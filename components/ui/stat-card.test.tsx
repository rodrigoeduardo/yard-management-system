import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { StatCard } from "./stat-card";

vi.mock("@/components/ui/top-loader", () => ({
  LinkLoaderReporter: () => <span data-testid="link-loader-reporter" />,
}));

describe("StatCard", () => {
  it("renders a large mono numeric value and a muted label", () => {
    render(<StatCard value="12" label="Cargas Ativas" />);

    const value = screen.getByText("12");
    expect(value.className).toMatch(/\bfont-mono\b/);
    expect(value.className).toMatch(/font-bold/);

    const label = screen.getByText("Cargas Ativas");
    expect(label.className).toMatch(/\btext-muted-foreground\b/);
  });

  it("renders inside a Card container", () => {
    render(<StatCard value="12" label="Cargas Ativas" />);

    expect(screen.getByText("12").closest('[data-slot="card"]')).toBeInTheDocument();
  });

  it("renders as a plain, non-interactive card when no href is given", () => {
    render(<StatCard value="12" label="Cargas Ativas" />);

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("renders as an accessible link to href when given, with a chevron affordance", () => {
    render(<StatCard value="12" label="Cargas Ativas" href="/inventory" />);

    const link = screen.getByRole("link", { name: /cargas ativas/i });
    expect(link).toHaveAttribute("href", "/inventory");
    expect(link.querySelector("svg")).toBeInTheDocument();
  });

  it("reports link navigation to the top loader when href is given", () => {
    render(<StatCard value="12" label="Cargas Ativas" href="/inventory" />);

    const link = screen.getByRole("link", { name: /cargas ativas/i });
    expect(
      link.querySelector('[data-testid="link-loader-reporter"]'),
    ).toBeInTheDocument();
  });

  it("does not report to the top loader when no href is given", () => {
    render(<StatCard value="12" label="Cargas Ativas" />);

    expect(
      screen.queryByTestId("link-loader-reporter"),
    ).not.toBeInTheDocument();
  });
});
