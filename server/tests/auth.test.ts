import { describe, it, expect, beforeAll, vi } from "vitest";
import jwt from "jsonwebtoken";
import { requireAuth, type AuthRequest } from "../src/middleware/auth";
import { ApiError } from "../src/middleware/errorHandler";

// requireAuth reads process.env.JWT_SECRET, so we set a fixed test value
// before any test runs. beforeAll runs once for the whole file.
beforeAll(() => {
  process.env.JWT_SECRET = "test-secret-for-vitest";
});

// Builds a minimal fake Express Request — only what requireAuth reads.
function fakeRequest(authHeader?: string): AuthRequest {
  return { headers: { authorization: authHeader } } as AuthRequest;
}

describe("requireAuth middleware", () => {
  it("calls next() and attaches req.admin for a valid token", () => {
    const token = jwt.sign(
      { id: "admin-1", email: "admin@acowale.com" },
      process.env.JWT_SECRET as string
    );
    const req = fakeRequest(`Bearer ${token}`);
    // `vi.fn()` creates a mock function so we can assert it was called.
    const next = vi.fn();

    requireAuth(req, {} as never, next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.admin).toEqual({ id: "admin-1", email: "admin@acowale.com" });
  });

  it("throws ApiError(401) when the Authorization header is missing", () => {
    const req = fakeRequest(undefined);
    expect(() => requireAuth(req, {} as never, vi.fn())).toThrow(ApiError);
  });

  it("throws ApiError(401) when the header doesn't start with 'Bearer '", () => {
    const req = fakeRequest("Basic sometoken");
    expect(() => requireAuth(req, {} as never, vi.fn())).toThrow(ApiError);
  });

  it("throws ApiError(401) for a malformed/invalid token", () => {
    const req = fakeRequest("Bearer not-a-real-token");
    expect(() => requireAuth(req, {} as never, vi.fn())).toThrow(ApiError);
  });

  it("throws ApiError(401) for a token signed with the wrong secret", () => {
    const token = jwt.sign({ id: "x", email: "x@x.com" }, "wrong-secret");
    const req = fakeRequest(`Bearer ${token}`);
    expect(() => requireAuth(req, {} as never, vi.fn())).toThrow(ApiError);
  });

  it("throws ApiError(401) for an expired token", () => {
    const token = jwt.sign(
      { id: "admin-1", email: "admin@acowale.com" },
      process.env.JWT_SECRET as string,
      { expiresIn: -10 } // already expired 10 seconds ago
    );
    const req = fakeRequest(`Bearer ${token}`);
    expect(() => requireAuth(req, {} as never, vi.fn())).toThrow(ApiError);
  });
});
