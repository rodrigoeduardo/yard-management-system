import { describe, expect, it } from "vitest";
import { formatItemStatus } from "./item-status";

describe("formatItemStatus", () => {
  it("labels in_stock items as 'Em estoque'", () => {
    expect(formatItemStatus("in_stock")).toBe("Em estoque");
  });

  it("labels removed items as 'Removido'", () => {
    expect(formatItemStatus("removed")).toBe("Removido");
  });
});
