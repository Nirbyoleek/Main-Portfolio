import { describe, expect, it } from "vitest";
import { heroShell } from "../src/lib/shell";
import { person, stats } from "../src/data/content";

describe("heroShell", () => {
  const html = heroShell();
  it("contains the name, headline and every stat", () => {
    expect(html).toContain(`<span>${person.firstName}</span>`);
    expect(html).toContain(person.current.company);
    for (const s of stats) expect(html).toContain(s.value);
  });
  it("links the resume and uses the same classes as the React hero", () => {
    expect(html).toContain(`href="./${person.resume}"`);
    for (const c of ["hero__stage", "hero__copy", "hero__name", "hero__role", "hero__stats", "hero__still"]) {
      expect(html).toContain(`class="${c}`);
    }
  });
  it("escapes markup in content", () => {
    expect(html.includes("<script")).toBe(false);
  });
});
