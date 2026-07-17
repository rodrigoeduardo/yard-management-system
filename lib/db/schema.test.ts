import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { db } from "./index";
import { items } from "./schema";

describe("items foreign key integrity", () => {
  afterAll(async () => {
    const client = (db as unknown as { $client: { end: () => Promise<void> } })
      .$client;
    await client.end();
  });

  it("rejects inserting an item with a nonexistent load_id", async () => {
    await expect(
      db.insert(items).values({
        loadId: randomUUID(),
        weight: "10",
      }),
    ).rejects.toThrow();
  });
});
