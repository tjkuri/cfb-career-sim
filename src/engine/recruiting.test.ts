import { describe, it, expect } from "vitest";
import { generateRecruitingOffers, applyRecruitingChoice } from "./recruiting";
import { createRng } from "./rng";
import { createCareer } from "./create-career";
import { CONTENT } from "../content/index";
import type { Setup } from "./types";

const setup: Setup = { lastName: "Smith", jerseyNumber: 7, homeState: "TX", position: "QB" };

describe("generateRecruitingOffers", () => {
  it("returns offerCount offers for a fresh recruit", () => {
    const s = createCareer(setup, "offers-1");
    const offers = generateRecruitingOffers(s, CONTENT, createRng("offers-1"));
    expect(offers).toHaveLength(CONTENT.schoolSampler.offerCount);
  });

  it("never repeats a school in one offer set", () => {
    for (let i = 0; i < 25; i++) {
      const s = createCareer(setup, `dup-${i}`);
      const offers = generateRecruitingOffers(s, CONTENT, createRng(`dup-${i}`));
      const ids = offers.map((o) => o.schoolId);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it("only offers schools in tiers the player is eligible for", () => {
    // A fresh recruit (overall 60, character 70) has draft stock 31 -> tiers [1, 2].
    for (let i = 0; i < 25; i++) {
      const s = createCareer(setup, `tier-${i}`);
      const offers = generateRecruitingOffers(s, CONTENT, createRng(`tier-${i}`));
      for (const o of offers) expect([1, 2]).toContain(o.tier);
    }
  });

  it("is deterministic for a given seed", () => {
    const s = createCareer(setup, "det");
    const a = generateRecruitingOffers(s, CONTENT, createRng("det"));
    const b = generateRecruitingOffers(s, CONTENT, createRng("det"));
    expect(a).toEqual(b);
  });

  it("returns a short set rather than throwing when the pool is exhausted", () => {
    const content = { ...CONTENT, schools: [
      { id: "only", name: "Only U", tier: 1 as const, conference: "X", state: "TX" },
    ]};
    const s = createCareer(setup, "short");
    const offers = generateRecruitingOffers(s, content, createRng("short"));
    expect(offers).toHaveLength(1);
    expect(offers[0]!.schoolId).toBe("only");
  });

  it("gives every offer a snapModifier of 1", () => {
    const s = createCareer(setup, "mod");
    for (const o of generateRecruitingOffers(s, CONTENT, createRng("mod"))) {
      expect(o.snapModifier).toBe(1);
    }
  });
});

describe("applyRecruitingChoice", () => {
  it("applying a choice sets the school and opens season 0", () => {
    const s = createCareer(setup, "apply");
    const offers = generateRecruitingOffers(s, CONTENT, createRng("apply"));
    applyRecruitingChoice(s, offers[0]!.schoolId, CONTENT);
    expect(s.school.schoolId).toBe(offers[0]!.schoolId);
    expect(s.seasons).toHaveLength(1);
    expect(s.seasons[0]!.seasonIndex).toBe(0);
  });
});
