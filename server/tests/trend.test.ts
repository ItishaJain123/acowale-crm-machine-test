import { describe, it, expect } from "vitest";
import { bucketByDay } from "../src/lib/trend";

// Fixing "now" makes the test deterministic — no flakiness from real time passing.
const NOW = new Date("2026-07-20T12:00:00.000Z");

describe("bucketByDay", () => {
  it("returns one bucket per day, oldest first", () => {
    const result = bucketByDay([], 7, NOW);
    expect(result).toHaveLength(7);
    expect(result[0].date).toBe("2026-07-14");
    expect(result[6].date).toBe("2026-07-20");
  });

  it("returns zero counts when there is no feedback", () => {
    const result = bucketByDay([], 7, NOW);
    expect(result.every((b) => b.count === 0)).toBe(true);
  });

  it("counts multiple submissions on the same day together", () => {
    const timestamps = [
      new Date("2026-07-20T01:00:00.000Z"),
      new Date("2026-07-20T10:00:00.000Z"),
      new Date("2026-07-20T23:00:00.000Z"),
    ];
    const result = bucketByDay(timestamps, 7, NOW);
    const today = result.find((b) => b.date === "2026-07-20");
    expect(today?.count).toBe(3);
  });

  it("places each submission in the correct day bucket", () => {
    const timestamps = [
      new Date("2026-07-14T08:00:00.000Z"),
      new Date("2026-07-18T08:00:00.000Z"),
    ];
    const result = bucketByDay(timestamps, 7, NOW);
    expect(result.find((b) => b.date === "2026-07-14")?.count).toBe(1);
    expect(result.find((b) => b.date === "2026-07-18")?.count).toBe(1);
    expect(result.find((b) => b.date === "2026-07-15")?.count).toBe(0);
  });

  it("ignores submissions outside the requested day range", () => {
    // 10 days ago — outside a 7-day window.
    const timestamps = [new Date("2026-07-10T08:00:00.000Z")];
    const result = bucketByDay(timestamps, 7, NOW);
    expect(result.every((b) => b.count === 0)).toBe(true);
  });

  it("supports a custom window size (e.g. 30 days)", () => {
    const result = bucketByDay([], 30, NOW);
    expect(result).toHaveLength(30);
    expect(result[0].date).toBe("2026-06-21");
  });
});
