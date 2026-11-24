import { NextRequest } from "next/server";
import { AuthRetryableFetchError } from "@supabase/supabase-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { updateSession } from "@/lib/supabase/proxy";

const { mockCreateServerClient, mockGetClaims } = vi.hoisted(() => ({
  mockCreateServerClient: vi.fn(),
  mockGetClaims: vi.fn(),
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: mockCreateServerClient,
}));

describe("updateSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateServerClient.mockReturnValue({
      auth: {
        getClaims: mockGetClaims,
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("propagates claim verification errors instead of redirecting to sign in", async () => {
    const error = new Error("Unable to verify session");
    mockGetClaims.mockResolvedValue({
      data: { claims: null },
      error,
    });

    await expect(
      updateSession(new NextRequest("http://localhost/doctors")),
    ).rejects.toBe(error);
  });

  it("returns a retryable response when Supabase cannot be reached", async () => {
    const error = new AuthRetryableFetchError("fetch failed", 0);
    const logError = vi.spyOn(console, "error").mockImplementation(() => {});
    mockGetClaims.mockRejectedValue(error);

    const response = await updateSession(
      new NextRequest("http://localhost/doctors"),
    );

    expect(response.status).toBe(503);
    expect(response.headers.get("Retry-After")).toBe("5");
    await expect(response.json()).resolves.toEqual({
      error: "Authentication service is temporarily unavailable.",
    });
    expect(logError).toHaveBeenCalledWith(
      "Supabase authentication is temporarily unavailable",
      error,
    );
  });

  it("handles retryable errors returned by getClaims", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockGetClaims.mockResolvedValue({
      data: { claims: null },
      error: new AuthRetryableFetchError("fetch failed", 0),
    });

    const response = await updateSession(
      new NextRequest("http://localhost/doctors"),
    );

    expect(response.status).toBe(503);
  });

  it("redirects unauthenticated users from protected routes", async () => {
    mockGetClaims.mockResolvedValue({
      data: { claims: null },
      error: null,
    });

    const response = await updateSession(
      new NextRequest("http://localhost/doctors?sort=recent"),
    );

    expect(response.status).toBe(307);
    expect(new URL(response.headers.get("location")!).pathname).toBe(
      "/signin",
    );
    expect(
      new URL(response.headers.get("location")!).searchParams.get("next"),
    ).toBe("/doctors?sort=recent");
  });

  it("allows authenticated users through protected routes", async () => {
    mockGetClaims.mockResolvedValue({
      data: { claims: { sub: "user-1" } },
      error: null,
    });

    const response = await updateSession(
      new NextRequest("http://localhost/doctors"),
    );

    expect(response.status).toBe(200);
  });
});
