import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SegmentedControl } from "./segmented-control";

const ITEMS = [
  { value: "current", label: "Estoque Atual" },
  { value: "removals", label: "Remoções" },
] as const;

describe("SegmentedControl", () => {
  it("renders a button per item and marks the active one pressed", () => {
    render(
      <SegmentedControl items={ITEMS} value="current" onChange={vi.fn()} />,
    );

    const current = screen.getByRole("button", { name: "Estoque Atual" });
    const removals = screen.getByRole("button", { name: "Remoções" });

    expect(current).toHaveAttribute("aria-pressed", "true");
    expect(removals).toHaveAttribute("aria-pressed", "false");
  });

  it("calls onChange with the clicked item's value", () => {
    const onChange = vi.fn();
    render(
      <SegmentedControl items={ITEMS} value="current" onChange={onChange} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Remoções" }));

    expect(onChange).toHaveBeenCalledWith("removals");
  });

  it("gives the active item a distinct style from inactive items", () => {
    render(
      <SegmentedControl items={ITEMS} value="current" onChange={vi.fn()} />,
    );

    const current = screen.getByRole("button", { name: "Estoque Atual" });
    const removals = screen.getByRole("button", { name: "Remoções" });

    expect(current.className).toMatch(/\bbg-card\b/);
    expect(removals.className).not.toMatch(/\bbg-card\b/);
  });
});
