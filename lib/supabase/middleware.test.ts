import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { isPublicPath, updateSession } from "./middleware";

describe("isPublicPath", () => {
  it("treats /login as public", () => {
    expect(isPublicPath("/login")).toBe(true);
  });

  it("treats other app routes as protected", () => {
    expect(isPublicPath("/")).toBe(false);
    expect(isPublicPath("/loads")).toBe(false);
  });

  it("does not treat /login-like paths as public", () => {
    expect(isPublicPath("/login-history")).toBe(false);
  });
});

describe("updateSession", () => {
  it("redirects an unauthenticated request to /login", async () => {
    const request = new NextRequest("https://example.test/loads");

    const response = await updateSession(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://example.test/login");
  });

  it("does not redirect an unauthenticated request to /login itself", async () => {
    const request = new NextRequest("https://example.test/login");

    const response = await updateSession(request);

    expect(response.status).not.toBe(307);
  });
});
