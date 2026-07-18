import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DashboardStats } from "./dashboard-stats";

describe("DashboardStats", () => {
  it("renders the three stat cards with mono numeric values", () => {
    render(
      <DashboardStats
        activeLoads={4}
        itemsInStock={128}
        remainingWeight="2450.5"
      />,
    );

    const activeLoads = screen.getByText("4");
    expect(activeLoads.className).toMatch(/\bfont-mono\b/);
    expect(screen.getByText("Cargas Ativas")).toBeInTheDocument();

    const itemsInStock = screen.getByText("128");
    expect(itemsInStock.className).toMatch(/\bfont-mono\b/);
    expect(screen.getByText("Itens no Pátio")).toBeInTheDocument();

    const remainingWeight = screen.getByText("2450.5 kg");
    expect(remainingWeight.className).toMatch(/\bfont-mono\b/);
    expect(screen.getByText("Peso Restante")).toBeInTheDocument();
  });

  it("renders zero values sensibly", () => {
    render(<DashboardStats activeLoads={0} itemsInStock={0} remainingWeight="0" />);

    expect(screen.getByText("0 kg")).toBeInTheDocument();
    expect(screen.getAllByText("0")).toHaveLength(2);
  });
});
