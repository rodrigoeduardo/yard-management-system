import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PrintButton } from "./print-button";

describe("PrintButton", () => {
  it("renders the default label and is hidden in print", () => {
    render(<PrintButton />);

    const button = screen.getByRole("button", { name: "Imprimir" });
    expect(button.className).toMatch(/\bprint:hidden\b/);
  });

  it("renders custom children as the label", () => {
    render(<PrintButton>Imprimir 4 etiquetas em 1 folha</PrintButton>);

    expect(
      screen.getByRole("button", { name: "Imprimir 4 etiquetas em 1 folha" }),
    ).toBeInTheDocument();
  });
});
