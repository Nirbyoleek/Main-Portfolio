import { describe, expect, it } from "vitest";
import { clamp, damp, smoothstep, wrap } from "../src/lib/math";

describe("clamp", () => {
  it("defaults to 0..1", () => {
    expect(clamp(-2)).toBe(0);
    expect(clamp(0.4)).toBe(0.4);
    expect(clamp(3)).toBe(1);
  });
  it("accepts a range", () => {
    expect(clamp(5, -1.2, 1.2)).toBe(1.2);
  });
});

describe("smoothstep", () => {
  it("is 0 below the edge, 1 above it, and 0.5 halfway", () => {
    expect(smoothstep(0, 1, -1)).toBe(0);
    expect(smoothstep(0, 1, 2)).toBe(1);
    expect(smoothstep(0, 1, 0.5)).toBeCloseTo(0.5);
  });
});

describe("damp", () => {
  it("moves toward the target without overshooting", () => {
    const v = damp(0, 10, 5, 0.1);
    expect(v).toBeGreaterThan(0);
    expect(v).toBeLessThan(10);
  });
  it("is frame-rate independent", () => {
    // Two 1/120 s steps land where one 1/60 s step does.
    const twoSmall = damp(damp(0, 1, 6, 1 / 120), 1, 6, 1 / 120);
    const oneBig = damp(0, 1, 6, 1 / 60);
    expect(twoSmall).toBeCloseTo(oneBig, 10);
  });
});

describe("wrap", () => {
  it("wraps negative and overflowing indices", () => {
    expect(wrap(-1, 5)).toBe(4);
    expect(wrap(5, 5)).toBe(0);
    expect(wrap(7, 5)).toBe(2);
  });
});
