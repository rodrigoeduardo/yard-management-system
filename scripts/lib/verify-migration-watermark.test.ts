import { describe, expect, it } from "vitest";
import {
  assertMigrationWatermark,
  MigrationWatermarkMismatchError,
} from "./verify-migration-watermark";

describe("assertMigrationWatermark", () => {
  it("does not throw when the applied row count equals the journal entry count", () => {
    expect(() => assertMigrationWatermark(18, 18)).not.toThrow();
  });

  it("throws MigrationWatermarkMismatchError when fewer rows are applied than journalled", () => {
    // Reproduces #328: drizzle-kit migrate can print success while silently
    // skipping every pending migration whose journal `when` sits behind the
    // watermark already recorded in drizzle.__drizzle_migrations.
    expect(() => assertMigrationWatermark(18, 17)).toThrow(
      MigrationWatermarkMismatchError,
    );
  });

  it("throws when more rows are applied than journalled", () => {
    expect(() => assertMigrationWatermark(17, 18)).toThrow(
      MigrationWatermarkMismatchError,
    );
  });

  it("includes both counts in the error message", () => {
    expect(() => assertMigrationWatermark(18, 17)).toThrow(
      /journal.*18.*applied.*17|18.*17/is,
    );
  });
});
