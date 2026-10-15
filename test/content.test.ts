// Guards the content file: everything the components and 3D scenes rely on
// is present, and dates and links are well formed.
import { describe, expect, it } from "vitest";
import { avatarModel, avatarQA, experience, impact, layers, person, projects, skillGroups, skills, stats } from "../src/data/content";
import { LAYER_KEYS, PROJECT_MOCKS } from "../src/lib/drawings";

const YM = /^\d{4}-(0[1-9]|1[0-2])$/;

describe("person", () => {
  it("has contact details and a resume", () => {
    expect(person.email).toMatch(/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i);
    expect(person.resume).toMatch(/\.pdf$/);
    expect(person.links.github).toMatch(/^https:\/\/github\.com\//);
    expect(person.links.linkedin).toMatch(/^https:\/\/www\.linkedin\.com\//);
  });
});

describe("experience", () => {
  it("uses YYYY-MM dates that run forward", () => {
    for (const role of experience) {
      expect(role.start).toMatch(YM);
      if (role.end) {
        expect(role.end).toMatch(YM);
        expect(role.end >= role.start).toBe(true);
      }
    }
  });
  it("is newest first, with only the first role current", () => {
    const starts = experience.map((r) => r.start);
    expect([...starts].sort().reverse()).toEqual(starts);
    expect(experience.filter((r) => r.end === null)).toHaveLength(1);
    expect(experience[0].end).toBeNull();
  });
});

describe("projects", () => {
  it("have unique ids and a screen drawing for every mock", () => {
    const ids = projects.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const p of projects) expect(PROJECT_MOCKS).toContain(p.mock);
  });
  it("only link to https pages", () => {
    for (const p of projects) {
      if (p.link) expect(p.link).toMatch(/^https:\/\//);
      if (p.repo) expect(p.repo).toMatch(/^https:\/\/github\.com\//);
    }
  });
  it("say what to do when there is no link", () => {
    for (const p of projects.filter((x) => x.type === "personal" && !x.link && !x.repo)) {
      expect(p.note, `${p.name} needs a link, repo or note`).toBeTruthy();
    }
  });
});

describe("hero layers", () => {
  it("each have a drawing", () => {
    for (const l of layers) expect(LAYER_KEYS).toContain(l.key);
  });
});

describe("numbers", () => {
  it("has four headline stats", () => {
    expect(stats).toHaveLength(4);
  });
  it("draws impact bars from sane percentages", () => {
    for (const d of impact) {
      expect(d.after).toBeGreaterThan(0);
      expect(d.after).toBeLessThan(300);
      const sign = d.after > 100 ? "+" : "−";
      expect(d.change.startsWith(sign)).toBe(true);
    }
  });
});

describe("skills", () => {
  it("have unique keycap labels", () => {
    const labels = skills.map((s) => s.label);
    expect(new Set(labels).size).toBe(labels.length);
  });
  it("mark at least one core skill per group that has one", () => {
    const core = skillGroups.flatMap((g) => g.items.filter((i) => i.core));
    expect(core.length).toBeGreaterThan(0);
  });
});

describe("avatar", () => {
  it("points at a .glb model and a still image, relative to the site root", () => {
    if (!avatarModel) return;
    expect(avatarModel.url).toMatch(/^\.\/.+\.glb$/);
    expect(avatarModel.still).toMatch(/^\.\/.+\.(webp|png|jpg)$/);
  });

  it("has short, distinct questions and answers it can say", () => {
    expect(avatarQA.length).toBeGreaterThanOrEqual(3);
    expect(new Set(avatarQA.map((x) => x.q)).size).toBe(avatarQA.length);
    for (const x of avatarQA) {
      expect(x.q.length).toBeLessThanOrEqual(26);
      expect(x.a.split(/\s+/).length).toBeLessThanOrEqual(32);
    }
  });
});
