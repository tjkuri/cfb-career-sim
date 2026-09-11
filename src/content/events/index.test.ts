import { describe, it, expect } from "vitest";
import { EVENTS } from "./index";
import { CONTENT } from "../index";
import { RECRUITING_EVENTS } from "./recruiting";
import { UNIVERSAL_EVENTS } from "./universal";
import { SEASON_LIFE_EVENTS } from "./season-life";
import { SCHOOL_LIFE_EVENTS } from "./school-life";
import { OFFFIELD_EVENTS } from "./offfield";
import { QB_EVENTS } from "./qb";
import { OSKILL_EVENTS } from "./oskill";
import { OL_EVENTS } from "./ol";
import { DL_EVENTS } from "./dl";
import { DSKILL_EVENTS } from "./dskill";
import { K_EVENTS } from "./k";
import { BUST_EVENTS } from "./bust";
import { MILESTONE_EVENTS } from "./milestones";

// Guards against a slice file being authored but never wired into the barrel —
// its whole slice would vanish with every other test still green.
const SLICES = {
  RECRUITING_EVENTS, UNIVERSAL_EVENTS, SEASON_LIFE_EVENTS, SCHOOL_LIFE_EVENTS, OFFFIELD_EVENTS, QB_EVENTS, OSKILL_EVENTS, OL_EVENTS,
  DL_EVENTS, DSKILL_EVENTS, K_EVENTS, BUST_EVENTS, MILESTONE_EVENTS,
};

describe("events barrel", () => {
  it("includes every event from every slice", () => {
    const barrelIds = new Set(EVENTS.map((e) => e.id));
    for (const [name, slice] of Object.entries(SLICES)) {
      for (const ev of slice) {
        expect(barrelIds.has(ev.id), `${name} event "${ev.id}" is missing from EVENTS`).toBe(true);
      }
    }
  });

  it("contains nothing that is not in a slice", () => {
    const sliceIds = new Set(Object.values(SLICES).flatMap((s) => s.map((e) => e.id)));
    for (const ev of EVENTS) {
      expect(sliceIds.has(ev.id), `EVENTS event "${ev.id}" belongs to no slice`).toBe(true);
    }
  });

  it("gates content to top-tier programs, not only to small ones", () => {
    // Every tier gate in the position pile is [1,2], so signing with a
    // blueblood only ever SUBTRACTED content: tiers 1-2 saw 33 random events
    // against tiers 3-4's 32, and nothing fired because you play somewhere big.
    const tierGated = EVENTS.filter((e) => e.kind === "random" && e.conditions?.tier);
    const topOnly = tierGated.filter((e) => e.conditions!.tier!.every((t) => t >= 3));
    expect(
      topOnly.length,
      "no random event is exclusive to tier 3-4 schools, so a blueblood career has no beats of its own",
    ).toBeGreaterThan(0);
  });

  it("keeps every phase's shared random pool deep enough to avoid obvious repeats", () => {
    // Shared = not position-gated, so every playthrough draws from it. A career
    // draws ~3.1 random events per phase across its seasons, so a shallow
    // shared pool shows up directly as the same card twice. Postseason sat at 4
    // against offseason's 9 and conference's 8, and measured the worst repeat
    // rate of any phase (24% vs 16%) — the most dramatic phase repeating most.
    const PHASES = ["offseason", "nonconf", "conference", "postseason"] as const;
    for (const phase of PHASES) {
      const shared = EVENTS.filter(
        (e) => e.kind === "random" && e.phase === phase && !e.conditions?.position,
      );
      expect(
        shared.length,
        `${phase} has only ${shared.length} shared random events: ${shared.map((e) => e.id).join(", ")}`,
      ).toBeGreaterThanOrEqual(5);
    }
  });

  it("gives a thriving player a deep enough shared pool in every phase", () => {
    // Most of the shared pool is gated behind being in trouble — low character,
    // low overall, injured. Measured, a thriving player (char 70, ovr 70,
    // healthy, tier 2) could draw only 4-5 offseason events against a
    // struggling player's 8, so the better a career went the more repetitive it
    // got. This counts the shared events with no trouble-gate at all.
    const PHASES = ["offseason", "nonconf", "conference", "postseason"] as const;
    for (const phase of PHASES) {
      const thriving = EVENTS.filter((e) => {
        if (e.kind !== "random" || e.phase !== phase || e.conditions?.position) return false;
        const c = e.conditions;
        if (!c) return true;
        return (
          c.maxCharacter === undefined && c.maxOverall === undefined &&
          !c.requiresActiveInjury && !c.requiresInjury && !c.tier
        );
      });
      expect(
        thriving.length,
        `${phase} offers a thriving player only ${thriving.length} shared events: ${thriving.map((e) => e.id).join(", ")}`,
      ).toBeGreaterThanOrEqual(5);
    }
  });

  it("has no duplicate event ids across slices", () => {
    const ids = Object.values(SLICES).flatMap((s) => s.map((e) => e.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("gives every trait that any school carries at least one gated event", () => {
    // A trait that is only a rate shift is undiscoverable: a player samples
    // 10-50 careers, and last stage's shipped effects needed n=3000 to detect.
    // This is the guard that a trait cannot ship mechanically inert -- which is
    // the exact defect the school-trait work exists to fix.
    const carried = new Set(CONTENT.schools.map((s) => s.trait).filter(Boolean));
    for (const trait of carried) {
      const gated = EVENTS.filter((e) => e.conditions?.schoolTrait?.includes(trait as never));
      expect(gated.length, `trait "${trait}" is carried by a school but gates no event`).toBeGreaterThan(0);
    }
  });
});
