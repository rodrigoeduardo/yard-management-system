import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GreetingHeader } from "./greeting-header";

describe("GreetingHeader", () => {
  it("renders 'greeting, name' when a display name is available", () => {
    render(
      <GreetingHeader
        greeting="Bom dia"
        displayName="Rafael"
        dateLabel="17/07/2026"
      />,
    );
    expect(screen.getByRole("heading", { name: "Bom dia, Rafael" })).toBeInTheDocument();
  });

  it("renders just the greeting when no display name is available", () => {
    render(
      <GreetingHeader greeting="Bom dia" displayName={null} dateLabel="17/07/2026" />,
    );
    expect(screen.getByRole("heading", { name: "Bom dia" })).toBeInTheDocument();
  });

  it("renders a date subtitle summarizing the yard for the day", () => {
    render(
      <GreetingHeader
        greeting="Bom dia"
        displayName="Rafael"
        dateLabel="17/07/2026"
      />,
    );
    expect(
      screen.getByText("Resumo do pátio em 17/07/2026"),
    ).toBeInTheDocument();
  });

  it("renders on mobile too (not hidden below md:)", () => {
    const { container } = render(
      <GreetingHeader greeting="Bom dia" displayName="Rafael" dateLabel="17/07/2026" />,
    );
    expect(container.firstElementChild?.className).not.toMatch(/\bhidden\b/);
  });
});
