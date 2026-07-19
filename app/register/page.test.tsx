import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import RegisterPage from "./page";

async function renderRegisterPage(params: { error?: string; success?: string } = {}) {
  const jsx = await RegisterPage({
    searchParams: Promise.resolve(params),
  });
  render(jsx);
}

describe("RegisterPage", () => {
  it("renders the name field as the shared Input", async () => {
    await renderRegisterPage();

    const name = screen.getByLabelText("Nome");
    expect(name).toHaveAttribute("placeholder", "Seu nome completo");
    expect(name.dataset.slot).toBe("input");
  });

  it("renders the email field as the shared Input with a Portuguese placeholder", async () => {
    await renderRegisterPage();

    const email = screen.getByLabelText("E-mail");
    expect(email).toHaveAttribute("placeholder", "seu@email.com");
    expect(email.dataset.slot).toBe("input");
  });

  it("renders the password field as the shared Input with a masked placeholder", async () => {
    await renderRegisterPage();

    const password = screen.getByLabelText("Senha");
    expect(password).toHaveAttribute("placeholder", "••••••••");
    expect(password.dataset.slot).toBe("input");
  });

  it("renders the invite code field as the shared Input", async () => {
    await renderRegisterPage();

    const inviteCode = screen.getByLabelText("Código de convite");
    expect(inviteCode.dataset.slot).toBe("input");
  });

  it("shows a Portuguese error message for an invalid invite code", async () => {
    await renderRegisterPage({ error: "invalid_code" });

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Código de convite inválido.",
    );
  });

  it("shows a Portuguese confirmation notice after a successful signup pending email confirmation", async () => {
    await renderRegisterPage({ success: "confirm_email" });

    expect(screen.getByRole("status")).toHaveTextContent(
      "Conta criada! Confirme seu e-mail para poder entrar.",
    );
  });

  it("links to the login page", async () => {
    await renderRegisterPage();

    const link = screen.getByRole("link", { name: "Faça login." });
    expect(link).toHaveAttribute("href", "/login");
  });
});
