import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LastRemovalCard } from "./last-removal-card";

describe("LastRemovalCard", () => {
  it("renders driver, date, item count, weight, and NFs for the most recent removal", () => {
    render(
      <LastRemovalCard
        removal={{
          driver: "Maria Souza",
          exitDate: "01/02/2026",
          itemCount: 3,
          totalRemovedWeight: "45.5",
          notasFiscais: ["NF-001", "NF-002"],
        }}
      />,
    );

    expect(screen.getByText("Última Movimentação")).toBeInTheDocument();
    expect(screen.getByText("Maria Souza")).toBeInTheDocument();
    expect(screen.getByText("01/02/2026")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("45.5 kg")).toBeInTheDocument();
    expect(screen.getByText("NF-001, NF-002")).toBeInTheDocument();
  });

  it("renders nothing when there is no removal yet", () => {
    const { container } = render(<LastRemovalCard removal={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});
