import { describe, expect, it } from "vitest";
import { getGreeting } from "./greeting";

describe("getGreeting", () => {
  it("returns 'Bom dia' before noon", () => {
    expect(getGreeting(new Date("2026-01-01T09:00:00"))).toBe("Bom dia");
  });

  it("returns 'Boa tarde' from noon until before 6pm", () => {
    expect(getGreeting(new Date("2026-01-01T14:00:00"))).toBe("Boa tarde");
  });

  it("returns 'Boa noite' from 6pm onward", () => {
    expect(getGreeting(new Date("2026-01-01T20:00:00"))).toBe("Boa noite");
  });

  it("returns 'Boa noite' before 6am", () => {
    expect(getGreeting(new Date("2026-01-01T03:00:00"))).toBe("Boa noite");
  });
});
