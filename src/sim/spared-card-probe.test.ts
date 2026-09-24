import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { CONTENT } from "../content/index";
import type { GameEvent, Outcome } from "../engine/types";
import {
  LOCKER_ROOM_MIN_CHARACTER,
  SPARED_CARDS,
  TEN_IDS,
  lockerRoomVerdict,
  resolveSpoken,
  summarize,
  traceCell,
  floorCensus,
  type CareerTrace,
} from "./spared-card-probe";

const EVENTS = new Map<string, GameEvent>(CONTENT.events.map((e) => [e.id, e]));

function charOf(o: Outcome | undefined): number {
  return (o?.effects ?? []).reduce((a, e) => a + (e.kind === "character" ? e.amount : 0), 0);
}

// The probe's copy of the UI floor is the only reason its "did the card speak"
// column means anything. If view-model.ts moves the constant and this copy does
// not, every silence in report 057 becomes a claim about a build nobody runs.
// The constant is not exported (and brief 057 may not edit `src/ui/**`), so the
// guard reads the source, which is the same guard human-lazy-probe.test.ts puts
// on its copy of the band table.
describe("the probe's locker-room floor is the UI's floor", () => {
  it("matches LOCKER_ROOM_MIN_CHARACTER in view-model.ts", () => {
    const src = readFileSync(new URL("../ui/session/view-model.ts", import.meta.url), "utf8");
    const m = src.match(/const LOCKER_ROOM_MIN_CHARACTER = (\d+);/);
    expect(m, "LOCKER_ROOM_MIN_CHARACTER not found in view-model.ts").not.toBeNull();
    expect(Number(m![1])).toBe(LOCKER_ROOM_MIN_CHARACTER);
  });

  it("silences everything under the floor and speaks at it", () => {
    expect(lockerRoomVerdict(0)).toBeNull();
    expect(lockerRoomVerdict(1)).toBeNull();
    expect(lockerRoomVerdict(-1)).toBeNull();
    expect(lockerRoomVerdict(2)).toBe("credit");
    expect(lockerRoomVerdict(-2)).toBe("cost");
    expect(lockerRoomVerdict(-6)).toBe("cost");
  });
});

// DECISION 078 exists because report 050 defined a set by a measurement and
// never resolved it card by card. This is that check, for the set 078 spared.
describe("the eleven spared cards, resolved to source at HEAD", () => {
  it("is ten cards plus the eleventh", () => {
    expect(TEN_IDS).toHaveLength(10);
    expect(SPARED_CARDS).toHaveLength(11);
    expect(SPARED_CARDS.filter((c) => c.eleventh).map((c) => c.id)).toEqual(["targeting-review"]);
  });

  it("every card id exists in the bundle exactly once", () => {
    for (const c of SPARED_CARDS) {
      const found = CONTENT.events.filter((e) => e.id === c.id);
      expect(found, `${c.id} missing from the bundle`).toHaveLength(1);
    }
  });

  it("every named good branch exists on its card", () => {
    for (const c of SPARED_CARDS) {
      const opts = EVENTS.get(c.id)!.options.map((o) => o.id);
      expect(opts, `${c.id} has no option "${c.goodOptionId}"`).toContain(c.goodOptionId);
    }
  });

  // The numbers report 057's table is built on. Written out per card so a
  // content edit that changes one of them fails here rather than silently
  // re-pointing the report's conclusion.
  it("carries the character deltas the report tables", () => {
    const expected: Record<string, { pos: number; neg: number | null }> = {
      "the-toe-tap": { pos: 2, neg: 0 },
      "bowl-opt-out": { pos: 2, neg: 0 },
      "nonconf-blowout-sideline": { pos: 2, neg: -4 },
      "transfer-qb": { pos: 2, neg: null },
      "playing-through-the-hand": { pos: 0, neg: 0 },
      "wideopen-two-deep": { pos: 1, neg: -3 },
      "the-holding-call": { pos: 1, neg: -2 },
      "trash-talk": { pos: 1, neg: null },
      "offseason-captain-vote": { pos: 0, neg: -3 },
      "blueblood-five-star": { pos: 2, neg: 0 },
      "targeting-review": { pos: 1, neg: null },
    };
    for (const c of SPARED_CARDS) {
      const opt = EVENTS.get(c.id)!.options.find((o) => o.id === c.goodOptionId)!;
      const e = expected[c.id]!;
      expect(charOf(opt.positiveOutcome), `${c.id} good branch, success`).toBe(e.pos);
      if (e.neg === null) expect(opt.negativeOutcome, `${c.id} should be deterministic`).toBeUndefined();
      else expect(charOf(opt.negativeOutcome), `${c.id} good branch, failure`).toBe(e.neg);
    }
  });

  it("agrees with the floor about which good branches can speak on success", () => {
    const speaks = SPARED_CARDS.filter((c) => {
      const opt = EVENTS.get(c.id)!.options.find((o) => o.id === c.goodOptionId)!;
      return lockerRoomVerdict(charOf(opt.positiveOutcome)) === "credit";
    }).map((c) => c.id);
    expect(speaks.sort()).toEqual(
      ["blueblood-five-star", "bowl-opt-out", "nonconf-blowout-sideline", "the-toe-tap", "transfer-qb"].sort(),
    );
  });
});

describe("resolveSpoken", () => {
  it("reads the fired outcome off the prose, like cardAccount does", () => {
    const opt = EVENTS.get("transfer-qb")!.options.find((o) => o.id === "mentor")!;
    const r = resolveSpoken("transfer-qb", "mentor", opt.positiveOutcome.description);
    expect(r.matched).toBe(true);
    expect(r.character).toBe(2);
    expect(r.verdict).toBe("credit");
  });

  it("is silent on a sub-floor branch that still moves character", () => {
    const opt = EVENTS.get("the-holding-call")!.options.find((o) => o.id === "own-it")!;
    const r = resolveSpoken("the-holding-call", "own-it", opt.positiveOutcome.description);
    expect(r.character).toBe(1);
    expect(r.verdict).toBeNull();
  });

  it("is silent, and reports zero, on a good branch carrying no character", () => {
    const opt = EVENTS.get("offseason-captain-vote")!.options.find((o) => o.id === "let-the-work-speak")!;
    const r = resolveSpoken("offseason-captain-vote", "let-the-work-speak", opt.positiveOutcome.description);
    expect(r.character).toBe(0);
    expect(r.verdict).toBeNull();
    expect(r.moment).toBe(true);
  });

  it("returns no match for prose from another card", () => {
    expect(resolveSpoken("transfer-qb", "mentor", "not a line in this bundle").matched).toBe(false);
    expect(resolveSpoken("transfer-qb", "mentor", undefined).matched).toBe(false);
  });
});

describe("the probe end to end", () => {
  const traces = traceCell(12, "test-057", "virtueAmbitious", "QB");

  it("plays careers and never counts a spoken line it did not take", () => {
    expect(traces).toHaveLength(12);
    for (const t of traces) {
      expect(t.decisions).toBeGreaterThan(0);
      for (const id of TEN_IDS) {
        expect(t.goodTakes[id]!).toBeLessThanOrEqual(t.fires[id]!);
        expect(t.goodSpeaks[id]!).toBeLessThanOrEqual(t.goodTakes[id]!);
        expect(t.goodSpeaks[id]! + t.goodSubFloor[id]! + t.goodZero[id]!).toBe(t.goodTakes[id]!);
      }
    }
  });

  it("is deterministic on a seed", () => {
    const again = traceCell(12, "test-057", "virtueAmbitious", "QB");
    expect(again).toEqual(traces);
  });

  it("summarises with careers in the denominator", () => {
    const r = summarize("virtueAmbitious", "QB", traces);
    expect(r.careers).toBe(12);
    expect(r.headlineSpeakRate).toBeGreaterThanOrEqual(0);
    expect(r.headlineSpeakRate).toBeLessThanOrEqual(1);
    expect(r.spokenPerCareerHist.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 10);
    expect(r.takes.spokeCredit + r.takes.spokeCost + r.takes.subFloor + r.takes.zeroCharacter).toBe(
      r.takes.total,
    );
    expect(r.silence.silentCareers).toBe(
      r.silence.neverMetAnyOfTen + r.silence.metAndTookButEaten + r.silence.metButNeverTookGood,
    );
  });

  it("counts a hand-built trace the way the report reads it", () => {
    const base = (): Record<string, number> => Object.fromEntries(SPARED_CARDS.map((c) => [c.id, 0]));
    const t: CareerTrace = {
      decisions: 40,
      fires: { ...base(), "transfer-qb": 2 },
      goodTakes: { ...base(), "transfer-qb": 2 },
      goodSpeaks: { ...base(), "transfer-qb": 1 },
      goodCredits: { ...base(), "transfer-qb": 1 },
      goodCosts: base(),
      goodSubFloor: { ...base(), "transfer-qb": 1 },
      goodZero: base(),
      goodMoments: base(),
      anySpeaks: { ...base(), "transfer-qb": 1 },
    };
    const r = summarize("x", "QB", [t]);
    expect(r.headlineSpeakRate).toBe(1);
    expect(r.spokenPerCareerP50).toBe(1);
    expect(r.creditPerCareerP50).toBe(1);
    expect(r.cards.find((c) => c.id === "transfer-qb")!.takes).toEqual({
      total: 2,
      credit: 1,
      cost: 0,
      subFloor: 1,
      zero: 0,
    });
    expect(r.metNoneRate).toBe(0);
    expect(r.takes).toEqual({ total: 2, spokeCredit: 1, spokeCost: 0, subFloor: 1, zeroCharacter: 0 });
  });
});

describe("the floor census", () => {
  it("counts more lines at a lower floor and prices the family against the bundle", () => {
    const c = floorCensus(8, "test-057c", "virtueAmbitious", ["QB", "OL"]);
    expect(c.careers).toBe(16);
    expect(c.cardsPerCareer).toBeGreaterThan(0);
    // Monotone by construction: |character| >= 1 is implied by |character| >= 2.
    expect(c.linesPerCareerByFloor[0]!).toBeGreaterThanOrEqual(c.linesPerCareerByFloor[1]!);
    expect(c.linesPerCareerByFloor[1]!).toBeGreaterThanOrEqual(c.linesPerCareerByFloor[2]!);
    expect(c.extraLinesFromTheTen).toBeLessThanOrEqual(c.extraLinesTotal);
  });
});
