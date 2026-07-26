import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const cookieStore = new Map<string, string>();
const headerStore = new Map<string, string>();

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: (name: string) =>
      cookieStore.has(name) ? { name, value: cookieStore.get(name) } : undefined,
  })),
  headers: vi.fn(async () => ({
    get: (name: string) => headerStore.get(name) ?? null,
  })),
}));

const { default: LoginPage } = await import("./page");

async function renderLoginPage(error?: string) {
  const jsx = await LoginPage({
    searchParams: Promise.resolve({ error }),
  });
  render(jsx);
}

describe("LoginPage", () => {
  beforeEach(() => {
    cookieStore.clear();
    headerStore.clear();
  });

  it("renders the logo block and Pátio title above the login form", async () => {
    await renderLoginPage();

    const title = screen.getByText("Pátio");
    expect(title).toBeInTheDocument();

    const logoMark = document.querySelector('[data-slot="brand-logo"]');
    expect(logoMark).toBeInTheDocument();
  });

  it("renders the email field as the shared Input with a Portuguese placeholder", async () => {
    await renderLoginPage();

    const email = screen.getByLabelText("E-mail");
    expect(email).toHaveAttribute("placeholder", "seu@email.com");
    expect(email.dataset.slot).toBe("input");
  });

  it("renders the password field as the shared Input with a masked placeholder", async () => {
    await renderLoginPage();

    const password = screen.getByLabelText("Senha");
    expect(password).toHaveAttribute("placeholder", "••••••••");
    expect(password.dataset.slot).toBe("input");
  });

  it("links to the register page", async () => {
    await renderLoginPage();

    const link = screen.getByRole("link", { name: "Criar conta" });
    expect(link).toHaveAttribute("href", "/register");
  });

  it("applies horizontal padding on the main container to keep the form off narrow-viewport edges", async () => {
    await renderLoginPage();

    const main = document.querySelector("main");
    expect(main).toHaveClass("px-4");
  });

  it("shows the Portuguese invalid-credentials error for ?error=invalid_credentials", async () => {
    await renderLoginPage("invalid_credentials");

    expect(screen.getByRole("alert")).toHaveTextContent("E-mail ou senha inválidos.");
  });

  it("renders in English when the NEXT_LOCALE cookie is set to en", async () => {
    cookieStore.set("NEXT_LOCALE", "en");

    await renderLoginPage();

    expect(screen.getByRole("heading", { name: "Sign in" })).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toHaveAttribute("placeholder", "you@email.com");
    expect(screen.getByRole("link", { name: "Create account" })).toBeInTheDocument();
  });
});
