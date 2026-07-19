import { describe, expect, it } from "vitest";
import manifest from "./manifest";

describe("web app manifest", () => {
  it("identifies the app in Portuguese with standalone display", () => {
    const result = manifest();

    expect(result.name).toBe("Pátio");
    expect(result.lang).toBe("pt-BR");
    expect(result.display).toBe("standalone");
    expect(result.start_url).toBe("/");
  });

  it("sets theme and background colors from the design tokens", () => {
    const result = manifest();

    // Hex equivalents of --primary and --background from app/globals.css
    // (see lib/pwa/colors.ts for the OKLCh -> sRGB conversion).
    expect(result.theme_color).toBe("#006bab");
    expect(result.background_color).toBe("#f2f4f6");
  });

  it("declares 192x192 and 512x512 icons plus a maskable variant", () => {
    const result = manifest();

    expect(result.icons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          src: "/icons/icon-192.png",
          sizes: "192x192",
          type: "image/png",
          purpose: "any",
        }),
        expect.objectContaining({
          src: "/icons/icon-512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "any",
        }),
        expect.objectContaining({
          src: "/icons/icon-maskable-512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "maskable",
        }),
      ]),
    );
  });
});
