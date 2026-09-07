import { describe, it, expect } from "vitest";
import { EVENTS } from "./index";
import { RECRUITING_EVENTS } from "./recruiting";
import { UNIVERSAL_EVENTS } from "./universal";
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
  RECRUITING_EVENTS, UNIVERSAL_EVENTS, OFFFIELD_EVENTS, QB_EVENTS, OSKILL_EVENTS, OL_EVENTS,
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

  it("has no duplicate event ids across slices", () => {
    const ids = Object.values(SLICES).flatMap((s) => s.map((e) => e.id));
    expect(new Set(ids).size).toBe(ids.length);
  });
});
