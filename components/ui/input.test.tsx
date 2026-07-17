import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Input } from "./input";

describe("Input", () => {
  it("renders a ~44px-tall field with the mockup radius/border/bg", () => {
    render(<Input aria-label="Nota Fiscal" />);

    const input = screen.getByLabelText("Nota Fiscal");
    expect(input.className).toMatch(/\bh-11\b/);
    expect(input.className).toMatch(/\brounded-input\b/);
    expect(input.className).toMatch(/\bborder-input\b/);
    expect(input.className).toMatch(/\bbg-card\b/);
  });

  it("does not apply the mono font by default", () => {
    render(<Input aria-label="Nota Fiscal" />);

    expect(screen.getByLabelText("Nota Fiscal").className).not.toMatch(
      /font-mono/,
    );
  });

  it("applies the mono font for numeric fields via the mono variant", () => {
    render(<Input aria-label="Peso" mono />);

    expect(screen.getByLabelText("Peso").className).toMatch(/\bfont-mono\b/);
  });

  it("renders a unit suffix inside the field", () => {
    render(<Input aria-label="Peso" mono unit="kg" />);

    expect(screen.getByText("kg")).toBeInTheDocument();
    expect(screen.getByLabelText("Peso")).toBeInTheDocument();
  });
});
