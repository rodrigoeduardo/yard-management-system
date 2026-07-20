import { writeFileSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { recordedContext } from "./_util";

// Writes the first item's real QR data-URL to disk so the removal flow can
// build a fake-camera feed from it — the same code path a real scanner
// would decode, not a stand-in image.
const QR_HANDOFF_PATH = path.resolve(import.meta.dirname, "../clips/qr-handoff.json");

test("load-intake", async ({ browser }) => {
  const { page, save } = await recordedContext(browser);

  await page.goto("/login");
  await page.getByLabel("E-mail").fill(process.env.TEST_USER_EMAIL ?? "");
  await page.getByLabel("Senha").fill(process.env.TEST_USER_PASSWORD ?? "");
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"));
  await page.waitForTimeout(1200);

  await page.getByRole("link", { name: /Adicionar Carga/ }).click();
  await page.waitForURL("/loads/new");

  const notaFiscal = `DEMO${Date.now().toString().slice(-6)}`;
  await page.getByLabel("Nota Fiscal", { exact: true }).fill(notaFiscal);
  await page.getByLabel("Peso da Nota Fiscal").fill("480");
  await page.getByLabel("Material").fill("Sucata de Alumínio");
  await page
    .getByRole("button", { name: "Aumentar quantidade de itens" })
    .click();
  await page.waitForTimeout(300);

  // Desktop viewport shows both panels at once (no step wizard), so the
  // weight fields are already visible — no "Continuar" click needed there.
  await page.getByLabel("Peso do item 1").fill("240");
  await page.waitForTimeout(200);
  await page.getByLabel("Peso do item 2").fill("240");
  await page.waitForTimeout(400);

  await page
    .getByRole("button", { name: /Criar carga e gerar/ })
    .click();
  await page.waitForURL(/\/loads\/.+\/print/);
  await page.waitForTimeout(1500);

  const dataUrl = await page
    .locator('[data-testid="qr-grid"] img')
    .first()
    .getAttribute("src");
  expect(dataUrl).toBeTruthy();
  writeFileSync(QR_HANDOFF_PATH, JSON.stringify({ dataUrl }));

  await page.waitForTimeout(1000);
  await save("load-intake");
});
