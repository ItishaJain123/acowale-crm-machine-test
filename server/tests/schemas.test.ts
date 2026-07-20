import { describe, it, expect } from "vitest";
import { createFeedbackSchema, listFeedbackSchema, loginSchema } from "../src/lib/schemas";

// `describe` groups related tests. `it` is one test case.
// `schema.parse(x)` throws if `x` is invalid, and returns the parsed value if valid —
// that's the exact behavior our route handlers rely on.
describe("createFeedbackSchema", () => {
  it("accepts a valid minimal submission", () => {
    const result = createFeedbackSchema.parse({
      category: "BUG",
      comment: "The export button does nothing when clicked.",
    });
    expect(result.category).toBe("BUG");
    expect(result.rating).toBeUndefined();
  });

  it("accepts a full submission with rating and email", () => {
    const result = createFeedbackSchema.parse({
      category: "PRODUCT",
      comment: "Really enjoying the new dashboard.",
      rating: 5,
      email: "user@example.com",
    });
    expect(result.rating).toBe(5);
    expect(result.email).toBe("user@example.com");
  });

  it("rejects a comment that is too short", () => {
    // .parse() throws on invalid input — wrap it so `expect` can catch the throw.
    expect(() =>
      createFeedbackSchema.parse({ category: "BUG", comment: "hi" })
    ).toThrow();
  });

  it("rejects an unknown category", () => {
    expect(() =>
      createFeedbackSchema.parse({
        category: "NOT_A_REAL_CATEGORY",
        comment: "Valid length comment here.",
      })
    ).toThrow();
  });

  it("rejects a rating outside 1-5", () => {
    expect(() =>
      createFeedbackSchema.parse({
        category: "OTHER",
        comment: "Valid length comment here.",
        rating: 6,
      })
    ).toThrow();
  });

  it("rejects an invalid email format", () => {
    expect(() =>
      createFeedbackSchema.parse({
        category: "OTHER",
        comment: "Valid length comment here.",
        email: "not-an-email",
      })
    ).toThrow();
  });

  it("trims whitespace from the comment", () => {
    const result = createFeedbackSchema.parse({
      category: "OTHER",
      comment: "   Extra spaces around this comment.   ",
    });
    expect(result.comment).toBe("Extra spaces around this comment.");
  });
});

describe("listFeedbackSchema", () => {
  it("applies default pagination when not provided", () => {
    const result = listFeedbackSchema.parse({});
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(10);
  });

  it("coerces string query params into numbers", () => {
    // Express query params always arrive as strings — this is what makes
    // `z.coerce.number()` necessary in the route.
    const result = listFeedbackSchema.parse({ page: "3", pageSize: "20" });
    expect(result.page).toBe(3);
    expect(result.pageSize).toBe(20);
  });

  it("rejects a pageSize above the max of 100", () => {
    expect(() => listFeedbackSchema.parse({ pageSize: "500" })).toThrow();
  });
});

describe("loginSchema", () => {
  it("accepts a valid email and non-empty password", () => {
    const result = loginSchema.parse({
      email: "admin@acowale.com",
      password: "hunter2",
    });
    expect(result.email).toBe("admin@acowale.com");
  });

  it("rejects an empty password", () => {
    expect(() =>
      loginSchema.parse({ email: "admin@acowale.com", password: "" })
    ).toThrow();
  });
});
