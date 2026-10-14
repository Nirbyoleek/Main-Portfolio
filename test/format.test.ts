import { describe, expect, it } from "vitest";
import { durationLabel, monthLabel, monthsBetween, totalMonths } from "../src/lib/format";

describe("monthLabel", () => {
  it("formats a YYYY-MM month", () => {
    expect(monthLabel("2024-08")).toBe("Aug 2024");
    expect(monthLabel("2021-01")).toBe("Jan 2021");
  });
  it("reads null as the current role", () => {
    expect(monthLabel(null)).toBe("Present");
  });
});

describe("monthsBetween", () => {
  it("counts both the first and last month", () => {
    expect(monthsBetween("2024-01", "2024-07")).toBe(7);
    expect(monthsBetween("2022-05", "2022-09")).toBe(5);
  });
  it("spans year boundaries", () => {
    expect(monthsBetween("2021-07", "2022-01")).toBe(7);
  });
  it("is never less than one month", () => {
    expect(monthsBetween("2024-05", "2024-05")).toBe(1);
    expect(monthsBetween("2024-05", "2024-01")).toBe(1);
  });
});

describe("durationLabel", () => {
  it("writes years and months", () => {
    expect(durationLabel(27)).toBe("2 yrs 3 mos");
    expect(durationLabel(12)).toBe("1 yr");
    expect(durationLabel(1)).toBe("1 mo");
    expect(durationLabel(13)).toBe("1 yr 1 mo");
  });
});

describe("totalMonths", () => {
  it("adds separate roles", () => {
    const roles = [
      { start: "2021-07", end: "2022-01" },
      { start: "2022-05", end: "2022-09" },
    ];
    expect(totalMonths(roles)).toBe(12);
  });
  it("does not double-count overlapping roles", () => {
    const roles = [
      { start: "2024-01", end: "2024-06" },
      { start: "2024-04", end: "2024-09" },
    ];
    expect(totalMonths(roles)).toBe(9);
  });
});
