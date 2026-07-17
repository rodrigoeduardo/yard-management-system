import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Card } from "./card";

describe("Card", () => {
  it("renders a white bg, 1px bordered container with the card radius token", () => {
    render(<Card data-testid="card">content</Card>);

    const card = screen.getByTestId("card");
    expect(card.className).toMatch(/\bbg-card\b/);
    expect(card.className).toMatch(/\bborder\b/);
    expect(card.className).toMatch(/\bborder-border\b/);
    expect(card.className).toMatch(/\brounded-card\b/);
    expect(card.className).not.toMatch(/shadow/);
  });

  it("merges extra classNames without dropping the base styling", () => {
    render(
      <Card data-testid="card" className="p-4">
        content
      </Card>,
    );

    const card = screen.getByTestId("card");
    expect(card.className).toMatch(/\bp-4\b/);
    expect(card.className).toMatch(/\brounded-card\b/);
  });
});
