import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GreetingHeader } from "./greeting-header";

describe("GreetingHeader", () => {
  it("renders 'greeting, name' when a display name is available", () => {
    render(<GreetingHeader greeting="Bom dia" displayName="Rafael" />);
    expect(screen.getByRole("heading", { name: "Bom dia, Rafael" })).toBeInTheDocument();
  });

  it("renders just the greeting when no display name is available", () => {
    render(<GreetingHeader greeting="Bom dia" displayName={null} />);
    expect(screen.getByRole("heading", { name: "Bom dia" })).toBeInTheDocument();
  });
});
