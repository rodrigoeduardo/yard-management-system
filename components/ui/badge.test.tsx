import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Badge } from "./badge";

describe("Badge", () => {
  it("renders with a full pill radius by default", () => {
    render(<Badge data-testid="badge">Pendente</Badge>);

    expect(screen.getByTestId("badge").className).toMatch(
      /\brounded-pill\b/,
    );
  });

  it("renders the green 'Finalizada' variant with a check icon", () => {
    render(<Badge variant="success">Finalizada</Badge>);

    const badge = screen.getByText("Finalizada").closest('[data-slot="badge"]');
    expect(badge?.className).toMatch(/\bbg-success\b/);
    expect(badge?.className).toMatch(/\btext-success-foreground\b/);
    expect(badge?.querySelector("svg")).toBeInTheDocument();
  });

  it("does not render a check icon for the default variant", () => {
    render(<Badge>Pendente</Badge>);

    expect(
      screen.getByText("Pendente").closest('[data-slot="badge"]')?.querySelector("svg"),
    ).not.toBeInTheDocument();
  });
});
