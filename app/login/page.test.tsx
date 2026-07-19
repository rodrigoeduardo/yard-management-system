import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import LoginPage from "./page";

async function renderLoginPage(error?: string) {
  const jsx = await LoginPage({
    searchParams: Promise.resolve({ error }),
  });
  render(jsx);
}

describe("LoginPage", () => {
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
});
