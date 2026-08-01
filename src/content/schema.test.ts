import { describe, it, expect } from "vitest";
import { validateContent, type ContentBundle } from "./schema";

function goodBundle(): ContentBundle {
  return {
    positions: {
      QB: { label: "Quarterback", stats: ["passYards", "passTds", "ints"] },
      OSKILL: { label: "Offensive skill", stats: ["scrimmageYards", "totalTds", "receptions"] },
      OL: { label: "Offensive line", stats: ["pancakes", "sacksAllowed"] },
      DL: { label: "Defensive line", stats: ["sacks", "tfls", "tackles"] },
      DSKILL: { label: "Defensive skill", stats: ["tackles", "ints", "passBreakups"] },
      K: { label: "Kicker", stats: ["fgPct", "longFg", "gameWinners"] },
    },
    injuries: { acl: { label: "Torn ACL", overallDelta: 12, recoveryPhases: 4 } },
    schools: [{ id: "bama", name: "Alabama", tier: 4, conference: "SEC", state: "AL" }],
    trophyIds: ["confTitle", "cfpTitle"],
    awardIds: ["heisman"],
    events: [
      {
        id: "recruiting",
        kind: "fixed",
        phase: "offseason",
        weight: 1,
        title: "Signing day",
        description: "Pick a school.",
        options: [
          { id: "commit", label: "Commit", probability: 1, positiveOutcome: { description: "ok", effects: [] } },
        ],
      },
      {
        id: "gym",
        kind: "random",
        phase: "offseason",
        weight: 3,
        title: "Workout",
        description: "Extra hours?",
        options: [
          {
            id: "grind",
            label: "Grind",
            probability: 0.7,
            positiveOutcome: { description: "+", effects: [{ kind: "overall", timing: "permanent", amount: 2 }] },
            negativeOutcome: { description: "-", effects: [{ kind: "injury", injuryType: "acl" }] },
          },
        ],
      },
    ],
  };
}

describe("validateContent", () => {
  it("accepts a well-formed bundle", () => {
    expect(validateContent(goodBundle())).toEqual([]);
  });

  it("flags duplicate event ids", () => {
    const b = goodBundle();
    b.events.push({ ...b.events[1]!, id: "gym" });
    expect(validateContent(b).join()).toContain("Duplicate event id");
  });

  it("flags out-of-range probability and negative weight", () => {
    const b = goodBundle();
    b.events[1]!.options[0]!.probability = 1.5;
    b.events[1]!.weight = -1;
    const errs = validateContent(b).join();
    expect(errs).toContain("probability");
    expect(errs).toContain("weight");
  });

  it("flags unknown injury/trophy/award/stat references", () => {
    const b = goodBundle();
    b.events[1]!.options[0]!.negativeOutcome!.effects = [
      { kind: "injury", injuryType: "nope" },
      { kind: "trophy", id: "ghost" },
      { kind: "award", id: "ghost" },
      { kind: "stat", stat: "notAStat", amount: 1 },
    ];
    const errs = validateContent(b).join();
    expect(errs).toContain("unknown injury");
    expect(errs).toContain("unknown trophy");
    expect(errs).toContain("unknown award");
    expect(errs).toContain("unknown stat");
  });

  it("flags events with no options and a missing recruiting event", () => {
    const b = goodBundle();
    b.events[1]!.options = [];
    b.events = b.events.filter((e) => e.id !== "recruiting");
    const errs = validateContent(b).join();
    expect(errs).toContain("no options");
    expect(errs).toContain("recruiting");
  });
});
