import path from "node:path";
import { test } from "@playwright/test";
import { recordedContext } from "./_util";

// The QR feed built by scripts/build-qr-y4m.mjs from load-intake's captured
// clip. Chromium plays it back as a real webcam device, so the page's own
// zxing scanner does the actual decoding — same as a physical camera would.
const QR_FEED_PATH = path.resolve(import.meta.dirname, "../clips/qr-feed.y4m");

test.use({
  launchOptions: {
    args: [
      "--use-fake-device-for-media-stream",
      "--use-fake-ui-for-media-stream",
      `--use-file-for-fake-video-capture=${QR_FEED_PATH}`,
    ],
  },
});

test("removal", async ({ browser }) => {
  const { page, save } = await recordedContext(browser);

  await page.goto("/login");
  await page.getByLabel("E-mail").fill(process.env.TEST_USER_EMAIL ?? "");
  await page.getByLabel("Senha").fill(process.env.TEST_USER_PASSWORD ?? "");
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"));

  await page.getByRole("link", { name: /Remover Carga/ }).click();
  await page.waitForURL("/removals/new");
  await page.waitForTimeout(600);

  await page.getByLabel("Motorista").fill("João Demo");
  await page.waitForTimeout(400);

  await page.getByRole("button", { name: "Iniciar Escaneamento" }).click();
  await page.waitForFunction(() => document.body.textContent?.includes("ITENS LIDOS (1)"), {
    timeout: 15000,
  });
  await page.waitForTimeout(800);

  await page.getByRole("button", { name: "Parar Escaneamento" }).click();
  await page.getByRole("button", { name: /Concluir Remoção/ }).first().click();
  await page.waitForTimeout(500);
  await page.getByRole("button", { name: "Confirmar" }).click();
  await page.waitForTimeout(1500);

  await save("removal");
});
