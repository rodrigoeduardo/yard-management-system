import { ArrowUpDown } from "lucide-react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ControlTriggerButton } from "./control-trigger-button";

describe("ControlTriggerButton", () => {
  it("renders an icon-only button identified by its aria-label", () => {
    render(
      <ControlTriggerButton icon={ArrowUpDown} label="Ordenar" onClick={vi.fn()} />,
    );

    const button = screen.getByRole("button", { name: "Ordenar" });
    expect(button).toBeInTheDocument();
    expect(button.querySelector("svg")).toBeInTheDocument();
  });

  it("matches the search input's height (h-11) so the mobile row doesn't jag", () => {
    render(
      <ControlTriggerButton icon={ArrowUpDown} label="Ordenar" onClick={vi.fn()} />,
    );

    const button = screen.getByRole("button", { name: "Ordenar" });
    expect(button.className).toMatch(/\bh-11\b/);
  });

  it("reverts to the original size-8 button at md and up (desktop unchanged)", () => {
    render(
      <ControlTriggerButton icon={ArrowUpDown} label="Ordenar" onClick={vi.fn()} />,
    );

    const button = screen.getByRole("button", { name: "Ordenar" });
    expect(button.className).toMatch(/\bmd:size-8\b/);
  });

  it("shows no badge when count is omitted", () => {
    render(
      <ControlTriggerButton icon={ArrowUpDown} label="Ordenar" onClick={vi.fn()} />,
    );

    expect(screen.queryByText(/^\d+$/)).not.toBeInTheDocument();
  });

  it("shows a numeric badge overlay when count is provided", () => {
    render(
      <ControlTriggerButton
        icon={ArrowUpDown}
        label="Filtros"
        count={2}
        onClick={vi.fn()}
      />,
    );

    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("hides the badge when count is 0", () => {
    render(
      <ControlTriggerButton
        icon={ArrowUpDown}
        label="Filtros"
        count={0}
        onClick={vi.fn()}
      />,
    );

    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });
});
