import { test } from "@playwright/test";
import { recordedContext } from "./_util";

test("inventory", async ({ browser }) => {
  const { page, save } = await recordedContext(browser);

  await page.goto("/login");
  await page.getByLabel("E-mail").fill(process.env.TEST_USER_EMAIL ?? "");
  await page.getByLabel("Senha").fill(process.env.TEST_USER_PASSWORD ?? "");
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"));

  await page.getByRole("link", { name: /Ver Estoque/ }).click();
  await page.waitForURL("/inventory");
  await page.waitForTimeout(1200);

  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  await page.waitForTimeout(500);
  await page.evaluate(() =>
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }),
  );
  await page.waitForTimeout(1500);

  await save("inventory");
});
