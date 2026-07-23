import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(path.join(__dirname, "layout.tsx"), "utf-8");

describe("root layout fonts", () => {
  it("loads Instrument Sans and Spline Sans Mono from next/font/google", () => {
    expect(source).toMatch(/import\s*\{[^}]*Instrument_Sans[^}]*\}\s*from\s*"next\/font\/google"/);
    expect(source).toMatch(/import\s*\{[^}]*Spline_Sans_Mono[^}]*\}\s*from\s*"next\/font\/google"/);
  });

  it("no longer references Geist", () => {
    expect(source).not.toMatch(/Geist/);
  });

  it("wires the loaded fonts to --font-sans and --font-mono", () => {
    expect(source).toMatch(/variable:\s*"--font-sans"/);
    expect(source).toMatch(/variable:\s*"--font-mono"/);
  });

  it("applies both font variables on the html element", () => {
    const htmlBlockMatch = source.match(/<html[\s\S]*?>/);
    expect(htmlBlockMatch).not.toBeNull();
    const htmlBlock = htmlBlockMatch![0];
    expect(htmlBlock).toMatch(/\.variable/);
  });
});

describe("root layout demo banner (#252)", () => {
  it("imports DemoBanner and isDemoModeEnabled", () => {
    expect(source).toMatch(/import\s*\{\s*DemoBanner\s*\}\s*from\s*"@\/components\/demo\/demo-banner"/);
    expect(source).toMatch(
      /import\s*\{\s*isDemoModeEnabled\s*\}\s*from\s*"@\/lib\/supabase\/middleware"/,
    );
  });

  it("renders DemoBanner in the body, wired to demo mode and the configured contact URL", () => {
    expect(source).toMatch(/<DemoBanner\s+demoMode=\{isDemoModeEnabled\(\)\}\s+contactUrl=\{process\.env\.DEMO_CONTACT_URL\}\s*\/>/);
  });
});
