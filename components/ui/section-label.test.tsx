import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SectionLabel } from "./section-label";

describe("SectionLabel", () => {
  it("renders an uppercase, muted, letter-spaced heading", () => {
    render(<SectionLabel>Ações</SectionLabel>);

    const label = screen.getByText("Ações");
    expect(label.className).toMatch(/\buppercase\b/);
    expect(label.className).toMatch(/\btext-muted-foreground\b/);
    expect(label.className).toMatch(/tracking-(wide|wider|widest)/);
  });
});
