import { and } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";
import { buildRemovalFilterConditions } from "./removal-filters";

// Builds the SQL text/params for a set of conditions without needing a live
// DB connection — `PgDialect#sqlToQuery` only compiles, it never connects.
const dialect = new PgDialect();

function toQuery(filters: Parameters<typeof buildRemovalFilterConditions>[0]) {
  const conditions = buildRemovalFilterConditions(filters);
  if (conditions.length === 0) {
    return { sql: "", params: [] as unknown[] };
  }
  return dialect.sqlToQuery(and(...conditions)!);
}

describe("buildRemovalFilterConditions", () => {
  it("returns no conditions when no filter is active", () => {
    expect(buildRemovalFilterConditions({})).toEqual([]);
  });

  it("builds only a lower-bound date condition for an only-from date filter", () => {
    const { sql, params } = toQuery({ dateFrom: "2026-01-01" });
    expect(sql).toBe('"removals"."exit_date" >= $1');
    expect(params).toEqual(["2026-01-01T03:00:00.000Z"]);
  });

  it("builds only an upper-bound date condition for an only-to date filter", () => {
    const { sql, params } = toQuery({ dateTo: "2026-01-31" });
    expect(sql).toBe('"removals"."exit_date" <= $1');
    expect(params).toEqual(["2026-02-01T02:59:59.999Z"]);
  });

  it("builds a range date condition when both bounds are given", () => {
    const { sql, params } = toQuery({
      dateFrom: "2026-01-01",
      dateTo: "2026-01-31",
    });
    expect(sql).toBe(
      '("removals"."exit_date" >= $1 and "removals"."exit_date" <= $2)',
    );
    expect(params).toEqual([
      "2026-01-01T03:00:00.000Z",
      "2026-02-01T02:59:59.999Z",
    ]);
  });

  it("builds a greater-than-or-equal weight condition for weightMin alone", () => {
    const { sql, params } = toQuery({ weightMin: "10" });
    expect(sql).toBe('"removals"."total_removed_weight" >= $1');
    expect(params).toEqual(["10"]);
  });

  it("builds a less-than-or-equal weight condition for weightMax alone", () => {
    const { sql, params } = toQuery({ weightMax: "500" });
    expect(sql).toBe('"removals"."total_removed_weight" <= $1');
    expect(params).toEqual(["500"]);
  });

  it("builds a range weight condition when both bounds are given", () => {
    const { sql, params } = toQuery({ weightMin: "10", weightMax: "500" });
    expect(sql).toBe(
      '("removals"."total_removed_weight" >= $1 and "removals"."total_removed_weight" <= $2)',
    );
    expect(params).toEqual(["10", "500"]);
  });

  it("combines date and weight filters together", () => {
    const { sql, params } = toQuery({
      dateFrom: "2026-01-01",
      weightMax: "500",
    });
    expect(sql).toBe(
      '("removals"."exit_date" >= $1 and "removals"."total_removed_weight" <= $2)',
    );
    expect(params).toEqual(["2026-01-01T03:00:00.000Z", "500"]);
  });
});
