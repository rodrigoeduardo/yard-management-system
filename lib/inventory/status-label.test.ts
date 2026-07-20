import { describe, expect, it } from "vitest";
import { buildStatusLabel } from "./status-label";

describe("buildStatusLabel", () => {
  it("builds a label with order and direction, no filters, view-only suffix", () => {
    expect(buildStatusLabel("Data de Saída", "desc", false)).toBe(
      "Ordenado por Data de Saída (desc) · somente visualização",
    );
  });

  it("appends a filters-active marker before the view-only suffix", () => {
    expect(buildStatusLabel("Peso da NF", "asc", true)).toBe(
      "Ordenado por Peso da NF (asc) · filtros ativos · somente visualização",
    );
  });
});
