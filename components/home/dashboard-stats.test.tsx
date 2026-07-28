import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DashboardStats } from "./dashboard-stats";

describe("DashboardStats", () => {
  it("renders the three stat cards with mono numeric values", () => {
    render(
      <DashboardStats
        activeLoads={4}
        materialsInStock={12}
        remainingWeight="2450.5"
      />,
    );

    const activeLoads = screen.getByText("4");
    expect(activeLoads.className).toMatch(/\bfont-mono\b/);
    expect(screen.getByText("Cargas Ativas")).toBeInTheDocument();

    const materialsInStock = screen.getByText("12");
    expect(materialsInStock.className).toMatch(/\bfont-mono\b/);
    expect(screen.getByText("Materiais no Pátio")).toBeInTheDocument();

    const remainingWeight = screen.getByText("2450.5 Ton");
    expect(remainingWeight.className).toMatch(/\bfont-mono\b/);
    expect(screen.getByText("Peso Restante")).toBeInTheDocument();
  });

  it("renders zero values sensibly", () => {
    render(
      <DashboardStats activeLoads={0} materialsInStock={0} remainingWeight="0" />,
    );

    expect(screen.getByText("0 Ton")).toBeInTheDocument();
    expect(screen.getAllByText("0")).toHaveLength(2);
  });

  it("links the Cargas Ativas card to /inventory", () => {
    render(
      <DashboardStats activeLoads={4} materialsInStock={12} remainingWeight="2450.5" />,
    );

    const link = screen.getByRole("link", { name: /cargas ativas/i });
    expect(link).toHaveAttribute("href", "/inventory");
  });

  it("links the Materiais no Pátio card to /materials", () => {
    render(
      <DashboardStats activeLoads={4} materialsInStock={12} remainingWeight="2450.5" />,
    );

    const link = screen.getByRole("link", { name: /materiais no pátio/i });
    expect(link).toHaveAttribute("href", "/materials");
  });

  it("does not link the Peso Restante card", () => {
    render(
      <DashboardStats activeLoads={4} materialsInStock={12} remainingWeight="2450.5" />,
    );

    const pesoRestante = screen.getByText("Peso Restante");
    expect(pesoRestante.closest("a")).toBeNull();
  });
});
