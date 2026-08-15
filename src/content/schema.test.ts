import { describe, it, expect } from "vitest";
import { validateContent, type ContentBundle } from "./schema";
import { POSTSEASON, PROGRESSION } from "./postseason";
import { REGIONS, SCHOOL_SAMPLER, TRANSFER } from "./regions";
import { REDSHIRT } from "./redshirt";
import { CONTENT } from "./index";

function goodBundle(): ContentBundle {
  return {
    positions: {
      QB: { label: "Quarterback", stats: ["passYards", "passTds", "ints"] },
      OSKILL: { label: "Offensive skill", stats: ["scrimmageYards", "totalTds", "receptions"] },
      OL: { label: "Offensive line", stats: ["pancakes", "sacksAllowed"] },
      DL: { label: "Defensive line", stats: ["sacks", "tfls", "tackles"] },
      DSKILL: { label: "Defensive skill", stats: ["tackles", "ints", "passBreakups"] },
      K: { label: "Kicker", stats: ["fieldGoals", "points", "gameWinners"] },
    },
    injuries: { acl: { label: "Torn ACL", overallDelta: 12, recoveryPhases: 4 } },
    schools: [{ id: "bama", name: "Alabama", tier: 4, conference: "SEC", state: "AL" }],
    trophyIds: ["confTitle", "cfpTitle", "bowlWin"],
    awardIds: ["heisman", "allAmerican", "allConference"],
    postseason: POSTSEASON,
    progression: PROGRESSION,
    regions: REGIONS,
    schoolSampler: SCHOOL_SAMPLER,
    transfer: TRANSFER,
    redshirt: REDSHIRT,
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
            positiveOutcome: { description: "+", effects: [{ kind: "overall", timing: "immediate", amount: 2 }] },
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

  it("rejects a recruiting event that is not kind 'fixed'", () => {
    const bundle = goodBundle();
    const rec = bundle.events.find((e) => e.id === "recruiting")!;
    rec.kind = "random";
    const errors = validateContent(bundle);
    expect(errors.some((e) => e.includes("recruiting") && e.includes("fixed"))).toBe(true);
  });

  it("rejects an unknown minClass condition value", () => {
    const bundle = goodBundle();
    bundle.events.push({
      id: "bad-minclass",
      kind: "random",
      phase: "nonconf",
      weight: 1,
      conditions: { minClass: "XX" as never },
      title: "t",
      description: "d",
      options: [{ id: "o", label: "o", probability: 1, positiveOutcome: { description: "d", effects: [] } }],
    });
    const errors = validateContent(bundle);
    expect(errors.some((e) => e.includes("bad-minclass") && e.toLowerCase().includes("minclass"))).toBe(true);
  });

  it("rejects an out-of-range tier condition value", () => {
    const bundle = goodBundle();
    bundle.events.push({
      id: "bad-tier",
      kind: "random",
      phase: "nonconf",
      weight: 1,
      conditions: { tier: [5 as never] },
      title: "t",
      description: "d",
      options: [{ id: "o", label: "o", probability: 1, positiveOutcome: { description: "d", effects: [] } }],
    });
    const errors = validateContent(bundle);
    expect(errors.some((e) => e.includes("bad-tier") && e.toLowerCase().includes("tier"))).toBe(true);
  });

  it("rejects a condition position not defined in the bundle", () => {
    const bundle = goodBundle();
    // Remove a position from the bundle's own table; a condition referencing it
    // must now be flagged (the known-position set is derived from the bundle).
    delete (bundle.positions as Partial<Record<string, unknown>>).K;
    bundle.events.push({
      id: "bad-pos", kind: "random", phase: "nonconf", weight: 1,
      conditions: { position: ["K"] },
      title: "t", description: "d",
      options: [{ id: "o", label: "o", probability: 1, positiveOutcome: { description: "d", effects: [] } }],
    });
    const errors = validateContent(bundle);
    expect(errors.some((e) => e.includes("bad-pos") && e.toLowerCase().includes("position"))).toBe(true);
  });

  it("rejects an injury with recoveryPhases < 1", () => {
    const bundle = goodBundle();
    bundle.injuries.instant = { label: "Instant", overallDelta: 3, recoveryPhases: 0 };
    const errors = validateContent(bundle);
    expect(errors.some((e) => e.includes("instant") && e.toLowerCase().includes("recoveryphases"))).toBe(true);
  });

  it("rejects out-of-range maxCharacter / maxOverall condition values", () => {
    const bundle = goodBundle();
    bundle.events.push({
      id: "bad-maxchar", kind: "random", phase: "nonconf", weight: 1,
      conditions: { maxCharacter: 150 },
      title: "t", description: "d",
      options: [{ id: "o", label: "o", probability: 1, positiveOutcome: { description: "d", effects: [] } }],
    });
    bundle.events.push({
      id: "bad-maxovr", kind: "random", phase: "nonconf", weight: 1,
      conditions: { maxOverall: -5 },
      title: "t", description: "d",
      options: [{ id: "o", label: "o", probability: 1, positiveOutcome: { description: "d", effects: [] } }],
    });
    const errors = validateContent(bundle);
    expect(errors.some((e) => e.includes("bad-maxchar") && e.toLowerCase().includes("maxcharacter"))).toBe(true);
    expect(errors.some((e) => e.includes("bad-maxovr") && e.toLowerCase().includes("maxoverall"))).toBe(true);
  });

  it("rejects a non-boolean requiresFinalSeason condition value", () => {
    const bundle = goodBundle();
    bundle.events.push({
      id: "bad-final-season", kind: "random", phase: "nonconf", weight: 1,
      conditions: { requiresFinalSeason: "yes" as never },
      title: "t", description: "d",
      options: [{ id: "o", label: "o", probability: 1, positiveOutcome: { description: "d", effects: [] } }],
    });
    const errors = validateContent(bundle);
    expect(
      errors.some((e) => e.includes("bad-final-season") && e.toLowerCase().includes("requiresfinalseason")),
    ).toBe(true);
  });

  it("rejects a non-boolean requiresPlaying", () => {
    const bad = {
      ...CONTENT,
      events: [
        ...CONTENT.events,
        {
          id: "bad-requires-playing",
          kind: "random" as const,
          phase: "conference" as const,
          weight: 1,
          conditions: { requiresPlaying: "yes" as never },
          title: "T",
          description: "D",
          options: [{ id: "o", label: "L", probability: 1, positiveOutcome: { description: "d", effects: [] } }],
        },
      ],
    };
    expect(validateContent(bad).some((e) => e.includes("requiresPlaying"))).toBe(true);
  });

  it("rejects a prestige award id not in awardIds", () => {
    const b = goodBundle();
    b.postseason = { ...b.postseason, prestige: [{ id: "ghostAward", bands: [{ min: 90, prob: 0.5 }], teamSuccessBoost: 0.3 }] };
    expect(validateContent(b).join()).toContain("ghostAward");
  });

  it("rejects a trophy id not in trophyIds", () => {
    const b = goodBundle();
    b.postseason = { ...b.postseason, bowl: { id: "ghostTrophy", minWins: 7, prob: 0.5 } };
    expect(validateContent(b).join()).toContain("ghostTrophy");
  });

  it("rejects a production award referencing an unknown stat", () => {
    const b = goodBundle();
    b.postseason = { ...b.postseason, production: [{ id: "allConference", position: "QB", stat: "notAStat", threshold: 1, prob: 0.7 }] };
    expect(validateContent(b).join()).toContain("notAStat");
  });

  it("rejects a probability outside [0,1] in postseason config", () => {
    const b = goodBundle();
    b.postseason = { ...b.postseason, bowl: { id: "bowlWin", minWins: 7, prob: 1.5 } };
    expect(validateContent(b).some((e) => e.toLowerCase().includes("prob"))).toBe(true);
  });

  it("rejects negative school-sampler weights", () => {
    const b = goodBundle();
    b.schoolSampler = {
      base: 1,
      homeStateBonus: { 1: -1, 2: 8, 3: 4, 4: 1 },
      regionBonus: { 1: 5, 2: 3, 3: 2, 4: 0.5 },
      offerCount: 3,
    };
    expect(validateContent(b).join()).toContain("schoolSampler");
  });

  it("rejects a negative washoutOverallFloor", () => {
    const b = goodBundle();
    b.progression = { ...b.progression, washoutOverallFloor: -1 };
    expect(validateContent(b).join()).toContain("washoutOverallFloor");
  });

  it("rejects a zero moveUpSnapModifier", () => {
    const b = goodBundle();
    b.transfer = { ...b.transfer, moveUpSnapModifier: 0 };
    expect(validateContent(b).join()).toContain("moveUpSnapModifier");
  });

  it("rejects a redshirt successProb outside [0,1]", () => {
    const b = goodBundle();
    b.redshirt = { ...b.redshirt, successProb: 1.5 };
    expect(validateContent(b).join()).toContain("successProb");
  });

  it("rejects a non-positive redshirt sitSnapModifier", () => {
    const b = goodBundle();
    b.redshirt = { ...b.redshirt, sitSnapModifier: 0 };
    expect(validateContent(b).join()).toContain("sitSnapModifier");
  });

  it("rejects an injury that clears before it can sideline", () => {
    const b = goodBundle();
    b.injuries = { acl: { label: "Torn ACL", overallDelta: 12, recoveryPhases: 1 } };
    expect(validateContent(b).join(" ")).toContain("recoveryPhases must be >= 2");
  });

  it("accepts an injury at exactly two recovery phases", () => {
    const b = goodBundle();
    b.injuries = { acl: { label: "Torn ACL", overallDelta: 12, recoveryPhases: 2 } };
    expect(validateContent(b)).toEqual([]);
  });

  it("rejects a one-phase suspension as mechanically free", () => {
    const b = goodBundle();
    b.events[1]!.options[0]!.positiveOutcome.effects = [{ kind: "suspension", phases: 1 }];
    expect(validateContent(b).join(" ")).toContain("suspension of 1 phase is mechanically free");
  });

  it("accepts a two-phase suspension", () => {
    const b = goodBundle();
    b.events[1]!.options[0]!.positiveOutcome.effects = [{ kind: "suspension", phases: 2 }];
    expect(validateContent(b)).toEqual([]);
  });

  it("rejects a stat effect on an offseason event", () => {
    const b = goodBundle();
    // events[1] is the offseason "gym" event.
    b.events[1]!.options[0]!.positiveOutcome.effects = [{ kind: "stat", stat: "passYards", amount: 50 }];
    expect(validateContent(b).join(" ")).toContain("already-resolved season");
  });

  it("rejects a snaps effect on an offseason event", () => {
    const b = goodBundle();
    b.events[1]!.options[0]!.positiveOutcome.effects = [{ kind: "snaps", amount: 40 }];
    expect(validateContent(b).join(" ")).toContain("already-resolved season");
  });

  it("allows stat and snaps effects on an on-field event", () => {
    const b = goodBundle();
    b.events[1]!.phase = "nonconf";
    b.events[1]!.options[0]!.positiveOutcome.effects = [
      { kind: "stat", stat: "passYards", amount: 50 },
      { kind: "snaps", amount: 40 },
    ];
    expect(validateContent(b)).toEqual([]);
  });
});

describe("schoolSampler validation", () => {
  it("rejects a bonus table missing a tier", () => {
    const bad = {
      ...CONTENT,
      schoolSampler: { ...CONTENT.schoolSampler, homeStateBonus: { 1: 5, 2: 4, 3: 3 } as never },
    };
    expect(validateContent(bad).some((e) => e.includes("missing entry for tier 4"))).toBe(true);
  });

  it("rejects a negative tier bonus", () => {
    const bad = {
      ...CONTENT,
      schoolSampler: { ...CONTENT.schoolSampler, regionBonus: { 1: -1, 2: 3, 3: 2, 4: 1 } },
    };
    expect(validateContent(bad).some((e) => e.includes("regionBonus"))).toBe(true);
  });

  it("rejects an offerCount that is non-integer or below 1", () => {
    // Two distinct failure modes through the same guard: a fractional value fails
    // the Number.isInteger check, a too-small integer fails the < 1 check.
    const nonInteger = {
      ...CONTENT,
      schoolSampler: { ...CONTENT.schoolSampler, offerCount: 2.5 },
    };
    expect(validateContent(nonInteger).some((e) => e.includes("offerCount"))).toBe(true);

    const tooSmall = {
      ...CONTENT,
      schoolSampler: { ...CONTENT.schoolSampler, offerCount: 0 },
    };
    expect(validateContent(tooSmall).some((e) => e.includes("offerCount"))).toBe(true);
  });
});
