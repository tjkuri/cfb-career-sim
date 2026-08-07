import { describe, it, expect } from "vitest";
import { createCareer } from "./create-career";
import { advance, getDecision, developmentDelta, enterOffseason } from "./advance";
import { createRng } from "./rng";
import { CONTENT } from "../content/index";
import type { Setup } from "./types";

const setup: Setup = { lastName: "Allen", jerseyNumber: 7, homeState: "MT", position: "QB" };

function autoplay(seed: string) {
  let s = createCareer(setup, seed);
  let guard = 0;
  while (s.status === "active" && guard++ < 500) {
    const decision = getDecision(s);
    if (!decision) throw new Error("active career with no decision");
    // Policy: always take the first option.
    s = advance(s, decision.options[0]!.id);
  }
  return s;
}

function autoplayAlwaysReturn(seed: string) {
  let s = createCareer(setup, seed);
  let guard = 0;
  while (s.status === "active" && guard++ < 500) {
    const decision = getDecision(s);
    if (!decision) throw new Error("active career with no decision");
    // Policy: whenever asked to declare, return to school instead; otherwise take the first option.
    const choiceId = decision.eventId === "declare" ? "return" : decision.options[0]!.id;
    s = advance(s, choiceId);
  }
  return s;
}

describe("advance / getDecision", () => {
  it("first decision is recruiting with tier options", () => {
    const s = createCareer(setup, "seed");
    const d = getDecision(s);
    expect(d?.eventId).toBe("recruiting");
    expect(d!.options.length).toBeGreaterThan(0);
    expect(d!.options[0]!.id).toContain("commit-");
  });

  it("plays a full career to a terminal state", () => {
    const s = autoplay("career-1");
    expect(["drafted", "busted"]).toContain(s.status);
    if (s.status === "drafted") expect(s.draftResult).toBeDefined();
  });

  it("is deterministic: same seed + same policy => identical final state", () => {
    const a = autoplay("determinism");
    const b = autoplay("determinism");
    expect(a).toEqual(b);
  });

  it("advances eligibility across seasons (reaches at least JR before ending)", () => {
    const s = autoplay("eligibility");
    // The declare decision lists "declare" first, so a first-option policy declares
    // as soon as it becomes draft-eligible (JR), i.e. after yearsUsed reaches 2.
    const reachedUpperclass = s.eligibility.yearsUsed >= 2;
    expect(reachedUpperclass).toBe(true);
  });

  it("does not mutate the input state (purity)", () => {
    const s0 = createCareer(setup, "pure");
    const d = getDecision(s0)!;
    const snapshot = JSON.parse(JSON.stringify(s0));
    advance(s0, d.options[0]!.id);
    expect(s0).toEqual(snapshot);
  });

  it("always-return policy plays all years (incl. one redshirt) then force-declares with no phantom trailing season", () => {
    const s = autoplayAlwaysReturn("always-return");
    expect(s.status).toBe("drafted");
    // "redshirt" is now first-option at the offseason hub, so this always-first-option
    // policy takes it once (early, per redshirtOffered), bumping the eligibility cap
    // 4->5 and adding one played season versus the pre-redshirt expectation.
    expect(s.eligibility.redshirtUsed).toBe(true);
    expect(s.eligibility.yearsUsed).toBe(5);
    expect(s.seasons.length).toBe(5);
    // The last season line must reflect an actually-played season, not a
    // just-pushed-then-abandoned empty one from the postseason->offseason rollover.
    const lastSeason = s.seasons[s.seasons.length - 1]!;
    expect(lastSeason.snaps).toBeGreaterThan(0);
    for (const season of s.seasons) {
      expect(season.snaps).toBeGreaterThan(0);
    }
  });

  it("populates a team record for every played season and can accrue honors", () => {
    // Play many careers; every completed season must have a full record, and
    // across the sample at least one career earns a trophy or award.
    let honored = 0;
    let checkedSeasons = 0;
    for (let i = 0; i < 30; i++) {
      const s = autoplay(`records-${i}`);
      for (const line of s.seasons) {
        expect(line.teamWins + line.teamLosses).toBe(12);
        checkedSeasons++;
      }
      if (Object.keys(s.trophies).length > 0 || s.awards.length > 0) honored++;
    }
    expect(checkedSeasons).toBeGreaterThan(0);
    expect(honored).toBeGreaterThan(0);
  });

  it("still offers declare at JR and force-declares when out of eligibility (post-refactor)", () => {
    // First-option policy declares at JR (declare is option 0).
    const s = autoplay("refactor-declare");
    expect(["drafted", "busted"]).toContain(s.status);

    // Always-return plays all years then force-declares (no phantom season). With
    // redshirt now first-option at the hub, this policy takes it once, so the cap
    // is 5 (4 base + 1 redshirt) rather than 4.
    const r = autoplayAlwaysReturn("refactor-force");
    expect(r.status).toBe("drafted");
    expect(r.eligibility.redshirtUsed).toBe(true);
    expect(r.eligibility.yearsUsed).toBe(5);
    expect(r.seasons.length).toBe(5);
  });

  it("rejects a bogus choiceId at the declare decision", () => {
    let s = createCareer(setup, "declare-guard");
    let guard = 0;
    while (s.status === "active" && guard++ < 500) {
      const d = getDecision(s)!;
      if (d.eventId === "declare") {
        expect(() => advance(s, "banana")).toThrow(/declare/i);
        return;
      }
      s = advance(s, d.options[0]!.id);
    }
    throw new Error("never reached the declare decision");
  });
});

describe("development curve", () => {
  it("developmentDelta scales with snaps and caps out", () => {
    const cfg = { snapsPerDevPoint: 180, devCap: 3 };
    expect(developmentDelta(0, cfg)).toBe(0);
    expect(developmentDelta(200, cfg)).toBe(1);
    expect(developmentDelta(400, cfg)).toBe(2);
    expect(developmentDelta(2000, cfg)).toBe(3); // capped
  });

  it("a returning player's overall rises across seasons from playing", () => {
    // Always-return policy plays multiple full seasons; overall should end above
    // the starting baseline (60) purely from development (no gamble events needed).
    const s = autoplayAlwaysReturn("develops");
    expect(s.overall).toBeGreaterThan(60);
  });

  it("enterOffseason raises overall by exactly developmentDelta from last season's snaps", () => {
    const s = createCareer(setup, "hub-dev");
    s.overall = 70;
    s.phase = "offseason";
    s.seasons.push({ seasonIndex: 0, schoolId: "x", snaps: 400, stats: {}, teamWins: 0, teamLosses: 0 });
    const expected = 70 + developmentDelta(400, CONTENT.progression); // floor(400/180)=2 -> 72
    enterOffseason(s, CONTENT, createRng("hub-dev-rng"));
    expect(s.overall).toBe(expected);
  });
});

describe("soft-washout bust", () => {
  it("busts a career whose overall has collapsed below the floor", () => {
    const s = createCareer(setup, "washout-ovr");
    s.overall = 40; // below washoutOverallFloor (45)
    s.phase = "offseason";
    s.seasons.push({ seasonIndex: 0, schoolId: "x", snaps: 400, stats: {}, teamWins: 0, teamLosses: 0 });
    enterOffseason(s, CONTENT, createRng("washout-ovr"));
    expect(s.status).toBe("busted");
    expect(s.endingReason).toBeTruthy();
    expect(s.currentEventId).toBeNull();
  });

  it("does not bust a healthy, playing career", () => {
    const s = createCareer(setup, "healthy");
    s.overall = 75;
    s.phase = "offseason";
    s.seasons.push({ seasonIndex: 0, schoolId: "x", snaps: 400, stats: {}, teamWins: 0, teamLosses: 0 });
    enterOffseason(s, CONTENT, createRng("healthy"));
    expect(s.status).toBe("active");
  });

  it("busts a career buried on the depth chart for consecutive seasons even with a healthy overall", () => {
    const s = createCareer(setup, "buried");
    s.overall = 70; // well above washoutOverallFloor (45): only the buried condition should trip
    s.phase = "offseason";
    const floor = CONTENT.progression.washoutSnapFloor;
    const belowFloor = Math.max(0, floor - 1);
    for (let i = 0; i < CONTENT.progression.washoutConsecutiveSeasons; i++) {
      s.seasons.push({ seasonIndex: i, schoolId: "x", snaps: belowFloor, stats: {}, teamWins: 0, teamLosses: 0 });
    }
    enterOffseason(s, CONTENT, createRng("buried"));
    expect(s.status).toBe("busted");
    expect(s.endingReason).toMatch(/buried/i);
  });

  it("drives a full career to the busted terminal via advance()", () => {
    // Play one season, then force overall low and advance to the next offseason;
    // the engine must transition to busted and stop (no decision, no draft).
    let s = createCareer(setup, "e2e-bust");
    // advance through recruiting + season 0 up to the first offseason decision or terminal
    let guard = 0;
    while (s.status === "active" && s.seasonIndex === 0 && guard++ < 200) {
      const d = getDecision(s)!;
      s = advance(s, d.options[0]!.id);
    }
    // Now at/after the first offseason. Force a collapse and push to the next offseason.
    // Use a value well below washoutOverallFloor (45): the remaining offseason/nonconf
    // events for this season can still fire positive-overall outcomes (e.g. gym-grind's
    // "grind" option, chosen first-option, is +3 @ 72%), so a value just under the floor
    // (e.g. 38) can recover above it before the next enterOffseason check for this seed.
    s = JSON.parse(JSON.stringify(s));
    s.overall = 20;
    guard = 0;
    while (s.status === "active" && guard++ < 200) {
      const d = getDecision(s);
      if (!d) break;
      s = advance(s, d.eventId === "declare" ? "return" : d.options[0]!.id);
      if (s.status === "busted") break;
    }
    expect(s.status).toBe("busted");
    expect(getDecision(s)).toBeNull();
    expect(s.draftResult).toBeUndefined();
  });
});

describe("transfer portal", () => {
  it("offers a transfer decision in the offseason after the first season", () => {
    // Play recruiting + season 0; a first-option policy will hit either a
    // transfer or declare decision. Drive until a transfer decision appears.
    let s = createCareer(setup, "xfer-offered");
    let guard = 0;
    let sawTransfer = false;
    while (s.status === "active" && guard++ < 300) {
      const d = getDecision(s);
      if (!d) break;
      if (d.eventId === "transfer") { sawTransfer = true; break; }
      s = advance(s, d.eventId === "declare" ? "return" : d.options[0]!.id);
    }
    expect(sawTransfer).toBe(true);
  });

  it("staying leaves school unchanged and modifier at 1; moving changes tier and sets the modifier", () => {
    // Build a state parked on a transfer decision by generating offers directly,
    // then exercise applyChoice via advance for a concrete non-stay offer.
    let s = createCareer(setup, "xfer-apply");
    let guard = 0;
    while (s.status === "active" && guard++ < 300) {
      const d = getDecision(s);
      if (!d) throw new Error("no decision");
      if (d.eventId === "transfer") {
        const move = d.options.find((o) => o.id !== "stay");
        const beforeTier = s.school.tier;
        if (move) {
          const after = advance(s, move.id);
          // A non-stay offer sets a non-1 modifier (up<1 or down/lateral>1).
          expect(after.snapModifier).not.toBe(1);
          // tier may change (up/down) or stay (lateral) — but school-or-modifier changed.
          expect(after.school.tier !== beforeTier || after.snapModifier !== 1).toBe(true);
        } else {
          const after = advance(s, "stay");
          expect(after.snapModifier).toBe(1);
        }
        break;
      }
      s = advance(s, d.eventId === "declare" ? "return" : d.options[0]!.id);
    }
    expect(guard).toBeLessThan(300);
  });

  it("rejects an unknown transfer choice id", () => {
    let s = createCareer(setup, "xfer-bad");
    let guard = 0;
    while (s.status === "active" && guard++ < 300) {
      const d = getDecision(s);
      if (!d) throw new Error("no decision");
      if (d.eventId === "transfer") {
        expect(() => advance(s, "not-an-offer")).toThrow();
        break;
      }
      s = advance(s, d.eventId === "declare" ? "return" : d.options[0]!.id);
    }
  });

  it("still reaches a terminal state and stays deterministic with transfers in play", () => {
    const a = autoplay("xfer-term");
    const b = autoplay("xfer-term");
    expect(["drafted", "busted"]).toContain(a.status);
    expect(a).toEqual(b);
  });
});

// Content with no random events, so the sit season can't fire an overall-changing event.
const NO_EVENTS = { ...CONTENT, events: CONTENT.events.filter((e) => e.id === "recruiting") };

function redshirtDecisionState(seed: string) {
  const s = createCareer(setup, seed);
  s.overall = 70;
  s.school = { schoolId: "unt", tier: 2 };
  s.eligibility = { classYear: "SO", yearsUsed: 1, redshirtUsed: false, draftEligible: false };
  s.phase = "offseason";
  // seasonIndex must point PAST the completed season so autoProgress starts a fresh
  // season line for the sit year instead of merging its (near-zero) snaps into the
  // already-completed one (which would pollute the next enterOffseason's dev calc).
  s.seasonIndex = 1;
  s.seasons.push({ seasonIndex: 0, schoolId: "unt", snaps: 400, stats: {}, teamWins: 0, teamLosses: 0 });
  s.currentEventId = "redshirt";
  return s;
}

describe("redshirt decision", () => {
  it("is offered to an early, unused player and not once used", () => {
    const s = createCareer(setup, "rs-offer");
    s.eligibility.classYear = "SO";
    s.currentEventId = "redshirt";
    const d = getDecision(s);
    expect(d?.eventId).toBe("redshirt");
    expect(d!.options.map((o) => o.id)).toEqual(["redshirt", "decline"]);
  });

  it("taking it applies the bump on a success roll and the sink on a failure roll", () => {
    // Find one seed whose first rngChance(0.6) succeeds and one that fails.
    // (Implementer: try seeds; assert both outcomes are reachable and exact.)
    const bumped = advance(redshirtDecisionState("rs-seed-0"), "redshirt", NO_EVENTS);
    expect(bumped.eligibility.redshirtUsed).toBe(true);
    expect(bumped.overall).toBe(70 + NO_EVENTS.redshirt.bumpOverall);

    const sunk = advance(redshirtDecisionState("rs-seed-3"), "redshirt", NO_EVENTS);
    expect(sunk.eligibility.redshirtUsed).toBe(true);
    expect(sunk.overall).toBe(70 + NO_EVENTS.redshirt.sinkOverall);
  });

  it("the redshirt season is a sit (near-zero snaps) and grants no awards", () => {
    // Drive a real career taking redshirt when offered, then keep playing (taking
    // redshirt itself doesn't end the phase loop -- it only ends the offseason hub
    // sequence; the sit season's on-field phases, and any offseason-phase event like
    // a training decision, still need to resolve before its season line materializes).
    let s = createCareer(setup, "rs-sit");
    let guard = 0;
    let redshirted = false;
    while (s.status === "active" && guard++ < 400) {
      const d = getDecision(s);
      if (!d) break;
      if (d.eventId === "redshirt" && !redshirted) {
        s = advance(s, "redshirt");
        redshirted = true;
        continue;
      }
      s = advance(s, d.eventId === "declare" ? "return" : (d.options.find((o) => o.id === "stay")?.id ?? d.options[0]!.id));
    }
    expect(redshirted).toBe(true);
    // The lowest-snap season should be the sit (well under a normal ~360+ season).
    const minSnaps = Math.min(...s.seasons.map((x) => x.snaps));
    expect(minSnaps).toBeLessThan(100);
  });

  it("declining proceeds to the rest of the offseason (does not set redshirtUsed)", () => {
    const s = redshirtDecisionState("rs-decline");
    const after = advance(s, "decline");
    expect(after.eligibility.redshirtUsed).toBe(false);
    // decline chains onward; the career keeps progressing to a terminal or next decision.
    expect(["active", "drafted", "busted", "declared"]).toContain(after.status);
  });

  it("a redshirt career can reach a 5th season and still terminates deterministically", () => {
    const play = (seed: string) => {
      let s = createCareer(setup, seed);
      let guard = 0;
      while (s.status === "active" && guard++ < 400) {
        const d = getDecision(s);
        if (!d) break;
        // Take redshirt if offered; otherwise return/first-option.
        if (d.eventId === "redshirt") s = advance(s, "redshirt");
        else s = advance(s, d.eventId === "declare" ? "return" : (d.options.find((o) => o.id === "stay")?.id ?? d.options[0]!.id));
      }
      return s;
    };
    const a = play("rs-fifth");
    const b = play("rs-fifth");
    expect(a).toEqual(b); // determinism with redshirt in play
    expect(a.eligibility.redshirtUsed).toBe(true);
    expect(a.seasons.length).toBeGreaterThanOrEqual(5); // the extra year materialized
    expect(["drafted", "busted"]).toContain(a.status);
  });

  it("rejects an unknown redshirt choice id", () => {
    expect(() => advance(redshirtDecisionState("rs-bad"), "banana")).toThrow(/redshirt/i);
  });
});

describe("fixed milestone events", () => {
  const fixedNonconf = (id: string) => ({
    id, kind: "fixed" as const, phase: "nonconf" as const, weight: 1, title: id, description: "d",
    options: [{ id: "ok", label: "ok", probability: 1, positiveOutcome: { description: "d", effects: [] } }],
  });
  const withFixed = {
    ...CONTENT,
    events: [
      ...CONTENT.events.filter((e) => e.id === "recruiting"),
      fixedNonconf("milestone-1"),
      fixedNonconf("milestone-2"),
    ],
  } as typeof CONTENT;

  it("fires each matching fixed event once, in content order, then proceeds", () => {
    let s = createCareer(setup, "fixed-fire");
    const seen: string[] = [];
    let guard = 0;
    while (s.status === "active" && guard++ < 400) {
      const d = getDecision(s, withFixed);
      if (!d) break;
      seen.push(d.eventId);
      s = advance(s, d.options[0]!.id, withFixed);
    }
    const firstMs1 = seen.indexOf("milestone-1");
    const firstMs2 = seen.indexOf("milestone-2");
    expect(firstMs1).toBeGreaterThanOrEqual(0);
    expect(firstMs2).toBeGreaterThan(firstMs1); // m1 before m2 (content order)
    // Each fires exactly once per season it matches; over a full career (>=1 nonconf phase) at least once.
    expect(seen.filter((x) => x === "milestone-1").length).toBeGreaterThanOrEqual(1);
  });

  it("is behavior-preserving for the real content bundle (no non-recruiting fixed events)", () => {
    // Same seed with real CONTENT must be identical to itself (determinism) and terminate.
    const play = (seed: string) => {
      let s = createCareer(setup, seed);
      let guard = 0;
      while (s.status === "active" && guard++ < 400) {
        const d = getDecision(s)!;
        s = advance(s, d.eventId === "declare" ? "return" : d.options[0]!.id);
      }
      return s;
    };
    expect(play("preserve")).toEqual(play("preserve"));
    expect(["drafted", "busted"]).toContain(play("preserve").status);
  });
});

describe("recruiting offers are generated once", () => {
  const rSetup: Setup = { lastName: "Smith", jerseyNumber: 7, homeState: "TX", position: "QB" };

  it("resolves the choice against the same offer set that was displayed", () => {
    const s = createCareer(rSetup, "same-set");
    const decision = getDecision(s)!;
    expect(decision.eventId).toBe("recruiting");
    const chosenId = decision.options[0]!.id;
    const expectedSchoolId = s.pendingOptions!.find((o) => o.id === chosenId)!.schoolId;
    const next = advance(s, chosenId);
    expect(next.school.schoolId).toBe(expectedSchoolId);
  });

  it("accepts every displayed option", () => {
    for (let i = 0; i < 10; i++) {
      const s = createCareer(rSetup, `accept-${i}`);
      for (const opt of getDecision(s)!.options) {
        expect(() => advance(s, opt.id)).not.toThrow();
      }
    }
  });

  it("rejects an option that was not offered", () => {
    const s = createCareer(rSetup, "reject");
    expect(() => advance(s, "commit-not-a-real-school")).toThrow();
  });

  it("clears pendingOptions once the commitment is made", () => {
    const s = createCareer(rSetup, "clear");
    const next = advance(s, getDecision(s)!.options[0]!.id);
    expect(next.pendingOptions).toBeUndefined();
  });
});
