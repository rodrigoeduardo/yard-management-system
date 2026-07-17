import { describe, expect, it } from "vitest";
import { groupNfsByRemoval } from "./removal-log";

describe("groupNfsByRemoval", () => {
  it("groups NFs under their removal id", () => {
    const grouped = groupNfsByRemoval([
      { removalId: "r1", notaFiscal: "NF-1" },
      { removalId: "r1", notaFiscal: "NF-2" },
      { removalId: "r2", notaFiscal: "NF-3" },
    ]);

    expect(grouped.get("r1")).toEqual(["NF-1", "NF-2"]);
    expect(grouped.get("r2")).toEqual(["NF-3"]);
  });

  it("de-duplicates repeated NFs for the same removal", () => {
    const grouped = groupNfsByRemoval([
      { removalId: "r1", notaFiscal: "NF-1" },
      { removalId: "r1", notaFiscal: "NF-1" },
    ]);

    expect(grouped.get("r1")).toEqual(["NF-1"]);
  });

  it("returns an empty map for no rows", () => {
    expect(groupNfsByRemoval([])).toEqual(new Map());
  });
});
