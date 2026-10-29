import { describe, it, expect } from "vitest";
import { MILESTONE_EVENTS } from "./milestones";

describe("milestone slice", () => {
  it("gates every milestone on the player actually playing", () => {
    for (const ev of MILESTONE_EVENTS) {
      expect(ev.conditions?.requiresPlaying, `"${ev.id}" is not gated on requiresPlaying`).toBe(true);
    }
  });

  it("fires nothing scripted every season: the only fixed beat is the final season's", () => {
    const fixed = MILESTONE_EVENTS.filter((e) => e.kind === "fixed");
    expect(fixed.map((e) => e.id)).toEqual(["milestone-senior-day"]);
    expect(fixed[0]!.conditions?.requiresFinalSeason).toBe(true);
  });

  it("is second person everywhere, in card prose and in moments alike", () => {
    const thirdPerson = /\b(he|she|him|her|hers|his|himself|herself)\b/i;
    const offenders: string[] = [];
    for (const ev of MILESTONE_EVENTS) {
      const strings: string[] = [ev.title, ev.description];
      for (const opt of ev.options) {
        strings.push(opt.label);
        for (const oc of [opt.positiveOutcome, opt.negativeOutcome]) {
          if (!oc) continue;
          strings.push(oc.description);
          for (const eff of oc.effects) if (eff.kind === "moment") strings.push(eff.item);
        }
      }
      for (const str of strings) if (thirdPerson.test(str)) offenders.push(`${ev.id}: "${str}"`);
    }
    expect(offenders).toEqual([]);
  });
});
