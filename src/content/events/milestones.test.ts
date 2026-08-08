import { describe, it, expect } from "vitest";
import { MILESTONE_EVENTS } from "./milestones";
import type { Phase } from "../../engine/types";

describe("milestone slice", () => {
  it("is all fixed events", () => {
    expect(MILESTONE_EVENTS).toHaveLength(5);
    for (const ev of MILESTONE_EVENTS) expect(ev.kind).toBe("fixed");
  });

  it("gates every milestone on the player actually playing", () => {
    for (const ev of MILESTONE_EVENTS) {
      expect(ev.conditions?.requiresPlaying, `"${ev.id}" is not gated on requiresPlaying`).toBe(true);
    }
  });

  it("runs at most one per phase, except the final-season beat", () => {
    const byPhase = new Map<Phase, string[]>();
    for (const ev of MILESTONE_EVENTS) {
      byPhase.set(ev.phase, [...(byPhase.get(ev.phase) ?? []), ev.id]);
    }
    for (const [phase, ids] of byPhase) {
      const unconditional = ids.filter(
        (id) => !MILESTONE_EVENTS.find((e) => e.id === id)!.conditions?.requiresFinalSeason,
      );
      expect(unconditional.length, `phase ${phase} has ${unconditional.length} ungated milestones`).toBe(1);
    }
  });

  it("covers all four phases", () => {
    const phases = new Set(MILESTONE_EVENTS.map((e) => e.phase));
    expect([...phases].sort()).toEqual(["conference", "nonconf", "offseason", "postseason"]);
  });
});
