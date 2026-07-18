import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LastMovementCard } from "./last-movement-card";

describe("LastMovementCard", () => {
  it("renders both a removal row and a load row when both exist, most recent first", () => {
    render(
      <LastMovementCard
        removal={{
          driver: "João Batista",
          exitDate: new Date("2026-07-16T12:00:00Z"),
          itemCount: 4,
          totalRemovedWeight: "3240",
          notasFiscais: ["145.977", "145.812"],
        }}
        load={{
          notaFiscal: "145.982",
          material: "Sucata de Alumínio",
          entryDate: new Date("2026-07-17T15:00:00Z"),
          nfWeight: "12480",
        }}
      />,
    );

    expect(screen.getByText("Última Movimentação")).toBeInTheDocument();

    // Load happened after removal, so it should render first.
    const rows = screen.getAllByRole("listitem");
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveTextContent("Carga · NF 145.982");
    expect(rows[0]).toHaveTextContent("Sucata de Alumínio");
    expect(rows[0]).toHaveTextContent("12480 kg");
    expect(rows[1]).toHaveTextContent("Remoção · João Batista");
    expect(rows[1]).toHaveTextContent("4 itens");
    expect(rows[1]).toHaveTextContent("3240 kg");
    expect(rows[1]).toHaveTextContent("NF 145.977");
    expect(rows[1]).toHaveTextContent("NF 145.812");
  });

  it("renders only the removal row when there is no load", () => {
    render(
      <LastMovementCard
        removal={{
          driver: "Maria Souza",
          exitDate: new Date("2026-02-01T12:00:00Z"),
          itemCount: 3,
          totalRemovedWeight: "45.5",
          notasFiscais: ["NF-001", "NF-002"],
        }}
        load={null}
      />,
    );

    const rows = screen.getAllByRole("listitem");
    expect(rows).toHaveLength(1);
    expect(rows[0]).toHaveTextContent("Remoção · Maria Souza");
  });

  it("renders only the load row when there is no removal", () => {
    render(
      <LastMovementCard
        removal={null}
        load={{
          notaFiscal: "145.982",
          material: "Sucata de Alumínio",
          entryDate: new Date("2026-07-17T15:00:00Z"),
          nfWeight: "12480",
        }}
      />,
    );

    const rows = screen.getAllByRole("listitem");
    expect(rows).toHaveLength(1);
    expect(rows[0]).toHaveTextContent("Carga · NF 145.982");
  });

  it("renders nothing when there is neither a removal nor a load", () => {
    const { container } = render(
      <LastMovementCard removal={null} load={null} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the removal date pinned to yard time, independent of host timezone", () => {
    // 2026-07-17 23:30 in America/Sao_Paulo (UTC-03:00) is 2026-07-18
    // 02:30Z. The removal row must show 17/07/2026 regardless of the host
    // process's own default timezone (e.g. TZ=UTC in CI).
    render(
      <LastMovementCard
        removal={{
          driver: "João Batista",
          exitDate: new Date("2026-07-18T02:30:00Z"),
          itemCount: 4,
          totalRemovedWeight: "3240",
          notasFiscais: ["145.977"],
        }}
        load={null}
      />,
    );

    const rows = screen.getAllByRole("listitem");
    expect(rows[0]).toHaveTextContent("17/07/2026");
  });
});
