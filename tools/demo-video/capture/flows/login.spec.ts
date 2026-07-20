import { test } from "@playwright/test";
import { recordedContext } from "./_util";

// Requires TEST_USER_EMAIL / TEST_USER_PASSWORD (see repo .env.example) for
// a real user in the target Supabase project, and the app dev server
// running at DEMO_BASE_URL (default http://localhost:3000).
test("login", async ({ browser }) => {
  const { page, save } = await recordedContext(browser);

  await page.goto("/login");
  await page.getByLabel("E-mail").fill(process.env.TEST_USER_EMAIL ?? "");
  await page.getByLabel("Senha").fill(process.env.TEST_USER_PASSWORD ?? "");
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"));
  await page.waitForTimeout(800);

  await save("login");
});
