import { describe, it, expect } from "vitest";
import { awardsProduction, validateContent, type ContentBundle } from "./schema";
import { POSTSEASON, PROGRESSION } from "./postseason";
import { REGIONS, SCHOOL_SAMPLER } from "./regions";
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
    redshirt: REDSHIRT,
    // Minimal, not the real content: references only "acl", the one injury
    // this fixture's injuries table defines, so tests that replace the table
    // wholesale (keeping acl) don't spuriously trip the unknown-injury check.
    schoolTraits: {
      wideOpen: { snapModifier: 1.15, injuryProbPerPhase: 0.06, injuryTypes: ["acl"] },
      factory: { firstSeasonSnapModifier: 0.8, draftStockBonusPerSeason: 1.5, draftStockBonusCap: 5 },
      developmental: { developmentalBonus: 1, earlySnapModifier: 0.9, earlySeasons: 2 },
    },
    traitHints: { wideOpen: "hint", factory: "hint", developmental: "hint" },
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

  // DECISION 042. seasonIndex is 0-4 because eligibility caps at five seasons
  // (four, plus one if a redshirt is used), so anything outside that is a
  // variant that can never fire — silently, and only for some careers.
  it("rejects an out-of-range seasonIndex condition value", () => {
    const bundle = goodBundle();
    bundle.events.push({
      id: "bad-season",
      kind: "random",
      phase: "nonconf",
      weight: 1,
      conditions: { seasonIndex: [5] },
      title: "t",
      description: "d",
      options: [{ id: "o", label: "o", probability: 1, positiveOutcome: { description: "d", effects: [] } }],
    });
    const errors = validateContent(bundle);
    expect(errors.some((e) => e.includes("bad-season") && e.toLowerCase().includes("seasonindex"))).toBe(true);
  });

  it("rejects a negative and a non-integer seasonIndex condition value", () => {
    const bundle = goodBundle();
    const ev = (id: string, seasonIndex: number[]) => ({
      id, kind: "random" as const, phase: "nonconf" as const, weight: 1,
      conditions: { seasonIndex },
      title: "t", description: "d",
      options: [{ id: "o", label: "o", probability: 1, positiveOutcome: { description: "d", effects: [] } }],
    });
    bundle.events.push(ev("negative-season", [-1]), ev("fractional-season", [1.5]));
    const errors = validateContent(bundle);
    expect(errors.some((e) => e.includes("negative-season"))).toBe(true);
    expect(errors.some((e) => e.includes("fractional-season"))).toBe(true);
  });

  it("accepts a seasonIndex condition covering the whole 0-4 range", () => {
    const bundle = goodBundle();
    bundle.events.push({
      id: "good-season",
      kind: "random",
      phase: "nonconf",
      weight: 1,
      conditions: { seasonIndex: [0, 1, 2, 3, 4] },
      title: "t",
      description: "d",
      options: [{ id: "o", label: "o", probability: 1, positiveOutcome: { description: "d", effects: [] } }],
    });
    expect(validateContent(bundle).filter((e) => e.includes("good-season"))).toEqual([]);
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

  it("rejects a non-boolean requiresRedshirt", () => {
    const bad = {
      ...CONTENT,
      events: [
        ...CONTENT.events,
        {
          id: "bad-requires-redshirt",
          kind: "random" as const,
          phase: "conference" as const,
          weight: 1,
          conditions: { requiresRedshirt: "yes" as never },
          title: "T",
          description: "D",
          options: [{ id: "o", label: "L", probability: 1, positiveOutcome: { description: "d", effects: [] } }],
        },
      ],
    };
    expect(validateContent(bad).some((e) => e.includes("requiresRedshirt"))).toBe(true);
  });

  // The two flags partition the seasons, so together they select nothing. Same
  // class of author error as minOverall > maxOverall, and caught the same way.
  it("rejects a card that sets both requiresPlaying and requiresRedshirt", () => {
    const bad = {
      ...CONTENT,
      events: [
        ...CONTENT.events,
        {
          id: "impossible-card",
          kind: "random" as const,
          phase: "offseason" as const,
          weight: 1,
          conditions: { requiresPlaying: true, requiresRedshirt: true },
          title: "T",
          description: "D",
          options: [{ id: "o", label: "L", probability: 1, positiveOutcome: { description: "d", effects: [] } }],
        },
      ],
    };
    expect(
      validateContent(bad).some((e) => e.includes("impossible-card") && e.includes("mutually exclusive")),
    ).toBe(true);
  });

  // DECISION 066 lifted the engine freeze for this field on the ground that it
  // changes no existing card's eligibility, which is only true while nothing
  // sets it. The redshirt pack is a later wave and will delete this test; until
  // then it is what keeps the lift's premise honest.
  it("no shipped card sets requiresRedshirt yet — the field is authored-against in a later wave", () => {
    expect(CONTENT.events.filter((e) => e.conditions?.requiresRedshirt !== undefined).map((e) => e.id)).toEqual([]);
  });

  it("rejects a prestige award id not in awardIds", () => {
    const b = goodBundle();
    b.postseason = { ...b.postseason, prestige: [{ id: "ghostAward", bands: [{ min: 90, prob: 0.5 }], teamSuccessBoost: 0.3 }] };
    expect(validateContent(b).join()).toContain("ghostAward");
  });


  it("rejects a production award referencing an unknown stat", () => {
    const b = goodBundle();
    b.postseason = { ...b.postseason, production: [{ id: "allConference", position: "QB", stat: "notAStat", threshold: 1, prob: 0.7 }] };
    expect(validateContent(b).join()).toContain("notAStat");
  });

  it("rejects a probability outside [0,1] in postseason config", () => {
    const b = goodBundle();
    b.postseason = { ...b.postseason, prestige: [{ id: "heisman", bands: [{ min: 90, prob: 1.5 }], teamSuccessBoost: 0.3 }] };
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

  it("rejects a one-phase suspension as never zeroing a snap", () => {
    const b = goodBundle();
    b.events[1]!.options[0]!.positiveOutcome.effects = [{ kind: "suspension", phases: 1 }];
    expect(validateContent(b).join(" ")).toContain("suspension of 1 phase never zeroes a snap");
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
    // DECISION 048 now requires the gate on any on-field card that awards
    // production, so the fixture carries it. The property under test is
    // unchanged: stat and snaps effects are legal in an on-field phase.
    b.events[1]!.conditions = { requiresPlaying: true };
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

describe("schoolTraits validation", () => {
  it("rejects an unknown trait on a school row", () => {
    const bundle = goodBundle();
    // Cast: the point is to catch a bad value arriving from outside the type system.
    bundle.schools = [{ id: "bama", name: "Alabama", tier: 4, conference: "SEC", state: "AL", trait: "nonsense" as never }];
    expect(validateContent(bundle).join("\n")).toContain('unknown trait "nonsense"');
  });

  it("rejects a wideOpen injury probability outside [0,1]", () => {
    const bundle = goodBundle();
    bundle.schoolTraits = { ...bundle.schoolTraits, wideOpen: { ...bundle.schoolTraits.wideOpen, injuryProbPerPhase: 1.5 } };
    expect(validateContent(bundle).join("\n")).toContain("schoolTraits.wideOpen.injuryProbPerPhase must be in [0,1]");
  });

  it("rejects a wideOpen injury type that is not in the injury table", () => {
    const bundle = goodBundle();
    bundle.schoolTraits = { ...bundle.schoolTraits, wideOpen: { ...bundle.schoolTraits.wideOpen, injuryTypes: ["papercut"] } };
    expect(validateContent(bundle).join("\n")).toContain('schoolTraits.wideOpen: unknown injury "papercut"');
  });

  it("rejects a zero snap modifier, which would zero out a season", () => {
    const bundle = goodBundle();
    bundle.schoolTraits = { ...bundle.schoolTraits, wideOpen: { ...bundle.schoolTraits.wideOpen, snapModifier: 0 } };
    expect(validateContent(bundle).join("\n")).toContain("schoolTraits.wideOpen.snapModifier must be > 0");
  });

  it("rejects a traitHints table missing an entry for a known trait", () => {
    const bundle = goodBundle();
    bundle.traitHints = { ...bundle.traitHints, factory: "" };
    expect(validateContent(bundle).join("\n")).toContain('traitHints: missing hint for trait "factory"');
  });

  it("rejects out-of-range minOverall, and a minOverall above its own maxOverall", () => {
    const bundle = goodBundle();
    bundle.events.push({
      id: "bad-minovr", kind: "random", phase: "offseason", weight: 1,
      conditions: { minOverall: 120 },
      title: "t", description: "d",
      options: [{ id: "o", label: "o", probability: 1, positiveOutcome: { description: "d", effects: [] } }],
    });
    bundle.events.push({
      id: "impossible-window", kind: "random", phase: "offseason", weight: 1,
      conditions: { minOverall: 80, maxOverall: 60 },
      title: "t", description: "d",
      options: [{ id: "o", label: "o", probability: 1, positiveOutcome: { description: "d", effects: [] } }],
    });
    const errors = validateContent(bundle);
    expect(errors.some((e) => e.includes("bad-minovr") && e.toLowerCase().includes("minoverall"))).toBe(true);
    expect(errors.some((e) => e.includes("impossible-window") && e.includes("can never fire"))).toBe(true);
  });

  // DECISION 048. The 52 events that awarded a redshirting player production
  // were all authored one at a time, each one individually plausible. This rule
  // is what makes the 53rd impossible to write by accident.
  it("rejects an on-field event that awards production without requiresPlaying", () => {
    for (const phase of ["nonconf", "conference", "postseason"] as const) {
      const bundle = goodBundle();
      bundle.events.push({
        id: `ungated-${phase}`, kind: "random", phase, weight: 1,
        title: "t", description: "d",
        options: [{
          id: "o", label: "o", probability: 1,
          positiveOutcome: { description: "d", effects: [{ kind: "stat", stat: "passYards", amount: 40 }] },
        }],
      });
      expect(validateContent(bundle).join("\n")).toContain(`Event ungated-${phase}: on-field event awards stat/snaps production`);
    }
  });

  it("accepts the same event once it sets requiresPlaying, and ignores snaps-free on-field cards", () => {
    const bundle = goodBundle();
    bundle.events.push({
      id: "gated", kind: "random", phase: "conference", weight: 1,
      conditions: { requiresPlaying: true },
      title: "t", description: "d",
      options: [{
        id: "o", label: "o", probability: 1,
        positiveOutcome: { description: "d", effects: [{ kind: "snaps", amount: 12 }] },
      }],
    });
    bundle.events.push({
      id: "no-production", kind: "random", phase: "conference", weight: 1,
      title: "t", description: "d",
      options: [{
        id: "o", label: "o", probability: 1,
        positiveOutcome: { description: "d", effects: [{ kind: "character", amount: 2 }] },
      }],
    });
    expect(validateContent(bundle)).toEqual([]);
  });

  // The negative branch counts too: a card that DEBITS a stat is still claiming
  // the player took the field that season.
  it("flags an on-field event whose only production is on the negative branch", () => {
    const bundle = goodBundle();
    bundle.events.push({
      id: "negative-only", kind: "random", phase: "nonconf", weight: 1,
      title: "t", description: "d",
      options: [{
        id: "o", label: "o", probability: 0.5,
        positiveOutcome: { description: "d", effects: [{ kind: "character", amount: 1 }] },
        negativeOutcome: { description: "d", effects: [{ kind: "stat", stat: "ints", amount: -1 }] },
      }],
    });
    expect(validateContent(bundle).join("\n")).toContain("Event negative-only: on-field event awards stat/snaps production");
  });

  // The shipped bundle is the thing the rule exists to protect, and
  // `validateContent(CONTENT)` is asserted empty elsewhere in this file --
  // this states the specific property so a regression names itself.
  it("every on-field event in the shipped bundle that awards production sets requiresPlaying", () => {
    const onField = CONTENT.events.filter((e) => ["nonconf", "conference", "postseason"].includes(e.phase));
    const offenders = onField.filter((e) => awardsProduction(e) && !e.conditions?.requiresPlaying).map((e) => e.id);
    expect(offenders).toEqual([]);
    expect(onField.filter(awardsProduction).length).toBe(53);
  });

  // DECISION 049. The four draft-prospect cards told a 60-overall sophomore his
  // name was climbing draft boards. All three gates are load-bearing.
  it("the four draft-prospect cards gate on class, overall and playing status", () => {
    for (const id of ["bowl-opt-out", "all-star-invite", "all-star-practice-week", "senior-bowl-invite"]) {
      const ev = CONTENT.events.find((e) => e.id === id);
      expect(ev, id).toBeDefined();
      expect(ev!.conditions?.minClass, id).toBe("JR");
      expect(ev!.conditions?.minOverall, id).toBe(70);
      expect(ev!.conditions?.requiresPlaying, id).toBe(true);
    }
  });
});
