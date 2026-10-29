import { describe, it, expect } from "vitest";
import { createCareer } from "./create-career";
import { advance, getDecision, enterOffseason, offseasonDevelopment } from "./advance";
import { createRng } from "./rng";
import { CONTENT } from "../content/index";
import type { ContentBundle } from "../content/schema";
import type { GameState, Setup } from "./types";

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
    // Formerly "whenever asked to declare, return to school". There is no
    // declare decision any more (DECISION 057), so this is a plain first-option
    // policy and identical to `autoplay` -- kept under its own name because the
    // assertions below are about the career that plays out its eligibility, and
    // that is now every career.
    const choiceId = decision.options[0]!.id;
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
    // A first-option policy used to press "declare" the moment it became
    // draft-eligible, which is why 2 is the bar here. It now plays the career
    // out, so 2 is a floor the career clears comfortably -- kept as written
    // because the assertion is about eligibility advancing at all.
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
    // Play many careers; every COMPLETED season must have a full record, and
    // across the sample at least one career earns a trophy or award.
    //
    // The "completed" qualifier is new (DECISION 057). A record is written by
    // the postseason resolver, so a career that ends mid-season -- a character
    // bust, or the washout the new upperclass decline can now reach -- leaves a
    // final line with no record. Careers used to end at the declare card,
    // between seasons, so the case did not arise; now that every career plays
    // to the end of its eligibility it does, and a 0-0 final line on a career
    // that ended mid-season is correct rather than missing.
    let honored = 0;
    let checkedSeasons = 0;
    for (let i = 0; i < 30; i++) {
      const s = autoplay(`records-${i}`);
      for (const [idx, line] of s.seasons.entries()) {
        const isPartialFinal = idx === s.seasons.length - 1 && line.teamWins + line.teamLosses === 0;
        if (isPartialFinal) {
          // Only a career that ended inside the season may hold one.
          expect(s.status, `seed ${i}: a completed career left a 0-0 line`).toBe("busted");
          continue;
        }
        // Twelve regular-season games and the big game that ends the season.
        expect(line.teamWins + line.teamLosses).toBe(13);
        expect(line.bigGame).toBeDefined();
        checkedSeasons++;
      }
      if (Object.keys(s.trophies).length > 0 || s.awards.length > 0) honored++;
    }
    expect(checkedSeasons).toBeGreaterThan(0);
    expect(honored).toBeGreaterThan(0);
  });

  it("offers no declare decision and force-declares when out of eligibility", () => {
    // UPDATED (DECISION 057): the declare decision is deleted. What used to be
    // "still offers declare at JR" is now its opposite -- it must never be
    // offered -- and the forced declaration on empty eligibility is the only
    // way a career reaches the draft.
    const s = autoplay("refactor-declare");
    expect(["drafted", "busted"]).toContain(s.status);

    // Plays all years then force-declares (no phantom season). With
    // redshirt now first-option at the hub, this policy takes it once, so the cap
    // is 5 (4 base + 1 redshirt) rather than 4.
    const r = autoplayAlwaysReturn("refactor-force");
    expect(r.status).toBe("drafted");
    expect(r.eligibility.redshirtUsed).toBe(true);
    expect(r.eligibility.yearsUsed).toBe(5);
    expect(r.seasons.length).toBe(5);
  });

  it("never raises a declare decision, and still rejects a bogus choiceId at the hub", () => {
    // REPLACED (DECISION 057). This walked to the declare card and checked its
    // guard clause rejected "banana". The card is gone, so the walk asserts it
    // is never offered; the guard clause itself still has to be exercised, and
    // the redshirt hub is the surviving synthetic card that has one.
    let s = createCareer(setup, "declare-guard");
    let guard = 0;
    let checkedGuard = false;
    while (s.status === "active" && guard++ < 500) {
      const d = getDecision(s)!;
      expect(d.eventId).not.toBe("declare");
      if (d.eventId === "redshirt" && !checkedGuard) {
        expect(() => advance(s, "banana")).toThrow(/redshirt/i);
        checkedGuard = true;
      }
      s = advance(s, d.options[0]!.id);
    }
    expect(checkedGuard, "never reached a hub card with a guard clause").toBe(true);
  });
});

describe("development curve", () => {
  function lineFor(classYear: "FR" | "SO" | "JR" | "SR", role: "starter" | "rotation" | "backup", redshirt = false) {
    return { seasonIndex: 0, schoolId: "mont", snaps: 400, stats: {}, teamWins: 0, teamLosses: 0, overall: 70, classYear, role, redshirt };
  }

  it("pays playing time: a starter outgrows a backup over the same offseason, on average", () => {
    let starter = 0, backup = 0;
    for (let i = 0; i < 200; i++) {
      const s = createCareer(setup, `dev-${i}`);
      s.school = { schoolId: "mont", tier: 1 };
      starter += offseasonDevelopment(s, lineFor("FR", "starter"), CONTENT, createRng(`d-${i}`));
      backup += offseasonDevelopment(s, lineFor("FR", "backup"), CONTENT, createRng(`d-${i}`));
    }
    expect(starter).toBeGreaterThan(backup);
  });

  it("grows young players faster than seniors", () => {
    let fr = 0, sr = 0;
    for (let i = 0; i < 200; i++) {
      const s = createCareer(setup, `age-${i}`);
      s.school = { schoolId: "mont", tier: 1 };
      fr += offseasonDevelopment(s, lineFor("FR", "rotation"), CONTENT, createRng(`a-${i}`));
      sr += offseasonDevelopment(s, lineFor("SR", "rotation"), CONTENT, createRng(`a-${i}`));
    }
    expect(fr).toBeGreaterThan(sr);
  });

  it("a returning player's overall rises across seasons", () => {
    const s = autoplayAlwaysReturn("develops");
    expect(s.overall).toBeGreaterThan(60);
  });

  it("finalizes the completed line with the class year it was PLAYED AS, and its pre-development overall", () => {
    const s = createCareer(setup, "class-year-boundary");
    s.overall = 70;
    s.phase = "offseason";
    s.school = { schoolId: "mont", tier: 1 };
    s.eligibility = { classYear: "SO", yearsUsed: 1, redshirtUsed: false, draftEligible: false };
    s.seasons.push({ seasonIndex: 0, schoolId: "mont", snaps: 400, stats: {}, teamWins: 0, teamLosses: 0, overall: 64, classYear: "SO", role: "starter" });
    enterOffseason(s, CONTENT, createRng("class-year-boundary"));
    expect(s.eligibility.classYear).toBe("JR");
    expect(s.seasons[0]!.classYear).toBe("SO");
    expect(s.seasons[0]!.overall).toBe(70);
    expect(s.overall).toBeGreaterThan(70);
  });

  it("keeps the class year through a redshirt season, so no career is labelled SR twice", () => {
    const s = createCareer(setup, "rs-class");
    s.overall = 70;
    s.phase = "offseason";
    s.school = { schoolId: "mont", tier: 1 };
    s.eligibility = { classYear: "SO", yearsUsed: 1, redshirtUsed: true, draftEligible: false };
    s.redshirtSeasonActive = true;
    s.seasons.push({ seasonIndex: 1, schoolId: "mont", snaps: 20, stats: {}, teamWins: 0, teamLosses: 0, overall: 70, classYear: "SO", redshirt: true });
    enterOffseason(s, CONTENT, createRng("rs-class"));
    expect(s.eligibility.classYear).toBe("SO");
    expect(s.eligibility.yearsUsed).toBe(2);
  });
});

describe("soft-washout bust", () => {
  it("busts a career whose overall has collapsed below the floor", () => {
    const s = createCareer(setup, "washout-ovr");
    s.overall = 40; // below washoutOverallFloor (45)
    s.phase = "offseason";
    s.seasons.push({ seasonIndex: 0, schoolId: "x", snaps: 400, stats: {}, teamWins: 0, teamLosses: 0, overall: s.overall, classYear: s.eligibility.classYear });
    enterOffseason(s, CONTENT, createRng("washout-ovr"));
    expect(s.status).toBe("busted");
    expect(s.endingReason).toBeTruthy();
    expect(s.currentEventId).toBeNull();
  });

  it("does not bust a healthy, playing career", () => {
    const s = createCareer(setup, "healthy");
    s.overall = 75;
    s.phase = "offseason";
    s.seasons.push({ seasonIndex: 0, schoolId: "x", snaps: 400, stats: {}, teamWins: 0, teamLosses: 0, overall: s.overall, classYear: s.eligibility.classYear });
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
      s.seasons.push({ seasonIndex: i, schoolId: "x", snaps: belowFloor, stats: {}, teamWins: 0, teamLosses: 0, overall: s.overall, classYear: s.eligibility.classYear });
    }
    enterOffseason(s, CONTENT, createRng("buried"));
    expect(s.status).toBe("busted");
    expect(s.endingReason).toMatch(/buried/i);
  });

  // DECISION 072. A redshirt season is ~25 snaps, so it used to satisfy the
  // buried predicate on its own and bust the exact player the redshirt exists
  // for: an injured freshman who then sits. A sit season is a coach's decision,
  // not evidence of being buried, so it is SKIPPED by the consecutive-seasons
  // window -- skipped, not streak-breaking, so it cannot launder a prior
  // buried season either.
  it("does not count a redshirt season as a buried season", () => {
    const s = createCareer(setup, "redshirt-not-buried");
    s.overall = 64; // nineteen clear of washoutOverallFloor (45): this player was not washed out
    s.phase = "offseason";
    const belowFloor = Math.max(0, CONTENT.progression.washoutSnapFloor - 1);
    // FR wrecked by injury, then a redshirt season sat on purpose.
    s.seasons.push({ seasonIndex: 0, schoolId: "x", snaps: 25, stats: {}, teamWins: 0, teamLosses: 0, overall: s.overall, classYear: "FR" });
    s.seasons.push({ seasonIndex: 1, schoolId: "x", snaps: 26, stats: {}, teamWins: 0, teamLosses: 0, overall: s.overall, classYear: "SO", redshirt: true });
    enterOffseason(s, CONTENT, createRng("redshirt-not-buried"));
    expect(s.status).toBe("active");
    void belowFloor;
  });

  it("still busts when the two PLAYED seasons around a redshirt are both buried", () => {
    // The redshirt is skipped, not streak-breaking: it must not launder the
    // buried season that preceded it.
    const s = createCareer(setup, "redshirt-no-launder");
    s.overall = 70;
    s.phase = "offseason";
    const belowFloor = Math.max(0, CONTENT.progression.washoutSnapFloor - 1);
    s.seasons.push({ seasonIndex: 0, schoolId: "x", snaps: belowFloor, stats: {}, teamWins: 0, teamLosses: 0, overall: s.overall, classYear: "FR" });
    s.seasons.push({ seasonIndex: 1, schoolId: "x", snaps: 26, stats: {}, teamWins: 0, teamLosses: 0, overall: s.overall, classYear: "SO", redshirt: true });
    s.seasons.push({ seasonIndex: 2, schoolId: "x", snaps: belowFloor, stats: {}, teamWins: 0, teamLosses: 0, overall: s.overall, classYear: "JR" });
    enterOffseason(s, CONTENT, createRng("redshirt-no-launder"));
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

  it("staying leaves the school unchanged; moving changes it", () => {
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
        void beforeTier;
        const before = s.school.schoolId;
        expect(advance(s, "stay").school.schoolId).toBe(before);
        if (move) expect(advance(s, move.id).school.schoolId).not.toBe(before);
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
  s.seasons.push({ seasonIndex: 0, schoolId: "unt", snaps: 400, stats: {}, teamWins: 0, teamLosses: 0, overall: s.overall, classYear: s.eligibility.classYear });
  s.currentEventId = "redshirt";
  // createCareer already consumed schoolSampler.offerCount rng draws generating
  // Signing Day offers (and set pendingOptions for that recruiting event). Reset
  // both so this fixture's hand-tuned seeds are pinned to the redshirt roll only,
  // not to a Stage-4-tunable content constant -- and so it no longer carries the
  // impossible state of a live recruiting `pendingOptions` next to a redshirt event.
  s.rngCursor = 0;
  s.pendingOptions = undefined;
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
    // Seeds picked against rngCursor 0 (the redshirt roll is the fixture's first
    // draw -- see redshirtDecisionState's rngCursor reset above): "rs-seed-0"'s
    // first rngChance(0.6) succeeds, "rs-seed-4"'s fails. Both outcomes are
    // reachable and exact.
    // `advance` plays the sat season out, so read the overall the sit
    // season ended at -- before the next offseason's development.
    const sat = (st: GameState) => st.seasons.find((l) => l.redshirt)!.overall;
    const bumped = advance(redshirtDecisionState("rs-seed-0"), "redshirt", NO_EVENTS);
    expect(bumped.eligibility.redshirtUsed).toBe(true);
    expect(bumped.lastOutcome?.positive).toBe(true);
    expect(sat(bumped)).toBe(70 + NO_EVENTS.redshirt.bumpOverall);

    const sunk = advance(redshirtDecisionState("rs-seed-4"), "redshirt", NO_EVENTS);
    expect(sunk.eligibility.redshirtUsed).toBe(true);
    expect(sunk.lastOutcome?.positive).toBe(false);
    expect(sat(sunk)).toBe(70 + NO_EVENTS.redshirt.sinkOverall);
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
    expect(decision.options.map((o) => o.id)).toEqual(s.pendingOptions!.map((o) => o.id));
    for (const opt of decision.options) {
      const expected = s.pendingOptions!.find((o) => o.id === opt.id)!.schoolId;
      expect(advance(s, opt.id).school.schoolId).toBe(expected);
    }
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

// Finding 1 (fix-wave review): a reviewer deleted the schoolSnapModifier(...)
// factor from simulate.ts and, separately, commented out the
// rollAmbientInjury(...) call in advance.ts, and the full suite still passed
// 357/357 both times — every existing test exercises those two functions in
// isolation (school-effects.test.ts) rather than through the engine's actual
// call path. These tests drive real careers through advance() itself and must
// fail if either wiring is removed; see fix-wave-report.md for the
// removal-and-restore proof that they do.
describe("wideOpen wiring is actually called by the engine, not just callable", () => {
  // Content with every random/fixed event stripped except recruiting, mirroring
  // NO_EVENTS above: the point is to isolate the ambient roll and the snap
  // math from any *content* effect (e.g. milestone-opener's `{ kind: "snaps" }`
  // bonus) that would otherwise add noise on top of what we're measuring.
  const STRIPPED = { ...CONTENT, events: CONTENT.events.filter((e) => e.id === "recruiting") };

  // Pins Signing Day to a specific school by overwriting the sampled offer
  // list with a single hand-built one, then commits to it through the real
  // advance() entry point — applyRecruitingChoice and everything downstream
  // (tickPhaseStart, rollAmbientInjury, simulatePhaseProduction) runs for
  // real. This is the engine-level equivalent of school-effects.test.ts's
  // `applyRecruitingChoice(s, id, CONTENT)` pin, one layer higher.
  function commitTo(schoolId: string, seed: string, content: ContentBundle): GameState {
    const school = content.schools.find((x) => x.id === schoolId)!;
    const s = createCareer(setup, seed, content);
    s.pendingOptions = [{ id: `commit-${school.id}`, label: "x", schoolId: school.id, tier: school.tier, snapModifier: 1 }];
    return advance(s, `commit-${school.id}`, content);
  }

  it("rolls an ambient injury through advance() at a wideOpen school, and the season stays at 0 snaps while it does", () => {
    const wideSchool = STRIPPED.schools.find((x) => x.id === "unt")!;
    expect(wideSchool.trait, "unt is expected to carry wideOpen in the real ladder").toBe("wideOpen");
    const content = {
      ...STRIPPED,
      schoolTraits: { ...STRIPPED.schoolTraits, wideOpen: { ...STRIPPED.schoolTraits.wideOpen, injuryProbPerPhase: 1 } },
    };
    // With every content event stripped, autoProgress runs uninterrupted
    // through all three on-field phases of season 0 and pauses at the
    // redshirt hub at the start of season 1 — so season 0's line reflects
    // only the ambient roll + production, nothing else.
    const s = commitTo("unt", "wiring-injury", content);
    expect(s.currentEventId).toBe("redshirt");
    expect(s.careerInjuries).toBeGreaterThan(0);
    expect(s.seasons[0]!.snaps).toBe(0);
  });

  it("scales snaps by the school's snapModifier, observed only through advance() — a wideOpen school outproduces an untraited one from the same seed", () => {
    // injuryProbPerPhase 0 so the ambient roll can't shrink snaps and muddy
    // the comparison; probability 0 also consumes no RNG draw (documented in
    // school-effects.ts), so the production roll that follows is bit-for-bit
    // identical between the two runs below.
    const content = {
      ...STRIPPED,
      schoolTraits: { ...STRIPPED.schoolTraits, wideOpen: { ...STRIPPED.schoolTraits.wideOpen, injuryProbPerPhase: 0 } },
    };
    // Same tier, so the same depth-chart role; only the trait differs.
    const wide = commitTo("sacst", "wiring-snaps", content); // wideOpen, 1.15x
    const plain = commitTo("mont", "wiring-snaps", content); // untraited, 1.0x
    const wideSnaps = wide.seasons[0]!.snaps;
    const plainSnaps = plain.seasons[0]!.snaps;
    expect(wideSnaps).toBeGreaterThan(plainSnaps);
    // The exact ratio is 1.15 before per-phase Math.round noise (3 rounds
    // summed, not one round of the total), so assert a band around it rather
    // than an exact product.
    const ratio = wideSnaps / plainSnaps;
    expect(ratio).toBeGreaterThan(1.1);
    expect(ratio).toBeLessThan(1.2);
  });
});

// DECISION 039 item 1. The redshirt is recorded on the season line because it
// is not recoverable from stored data (report 010): `eligibility.redshirtUsed`
// says a redshirt was taken but not WHEN. Additive only -- see the byte-identity
// check in report 022.
describe("SeasonLine.redshirt", () => {
  it("marks exactly the season that was sat out, and only that one", () => {
    const s = autoplayAlwaysReturn("always-return");
    expect(s.eligibility.redshirtUsed).toBe(true);
    const flagged = s.seasons.filter((l) => l.redshirt === true);
    expect(flagged.length).toBe(1);
    // The redshirt is offered from SO, and the sat season is never the FR year
    // for this policy.
    expect(flagged[0]!.seasonIndex).toBeGreaterThan(0);
  });

  it("is written on every line a live career records, including the FR line created at Signing Day", () => {
    // `applyRecruitingChoice` pushes season 0 before kickoff, and autoProgress's
    // kickoff push is skipped for a season that already has a line -- so the FR
    // row is the one site that would otherwise be left `undefined`. `undefined`
    // means "this save predates the field", which a live career must never say.
    for (const seed of ["rsflag-a", "rsflag-b", "rsflag-c", "always-return"]) {
      const s = seed === "always-return" ? autoplayAlwaysReturn(seed) : autoplay(seed);
      expect(s.seasons.length).toBeGreaterThan(0);
      for (const line of s.seasons) {
        expect(typeof line.redshirt).toBe("boolean");
      }
      expect(s.seasons[0]!.seasonIndex).toBe(0);
      expect(s.seasons[0]!.redshirt).toBe(false);
    }
  });

  it("leaves every line false when no redshirt was ever taken", () => {
    let s = createCareer(setup, "no-redshirt");
    let guard = 0;
    while (s.status === "active" && guard++ < 500) {
      const decision = getDecision(s);
      if (!decision) throw new Error("active career with no decision");
      // Decline the redshirt every time it is offered; otherwise first option.
      const choiceId = decision.eventId === "redshirt" ? "decline" : decision.options[0]!.id;
      s = advance(s, choiceId);
    }
    expect(s.eligibility.redshirtUsed).toBe(false);
    expect(s.seasons.length).toBeGreaterThan(0);
    for (const line of s.seasons) expect(line.redshirt).toBe(false);
  });
});
