import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatCard } from "./stat-card";

describe("StatCard", () => {
  it("renders a large mono numeric value and a muted label", () => {
    render(<StatCard value="12" label="Cargas Ativas" />);

    const value = screen.getByText("12");
    expect(value.className).toMatch(/\bfont-mono\b/);
    expect(value.className).toMatch(/text-(2xl|3xl|4xl)/);

    const label = screen.getByText("Cargas Ativas");
    expect(label.className).toMatch(/\btext-muted-foreground\b/);
  });

  it("renders inside a Card container", () => {
    render(<StatCard value="12" label="Cargas Ativas" />);

    expect(screen.getByText("12").closest('[data-slot="card"]')).toBeInTheDocument();
  });
});
