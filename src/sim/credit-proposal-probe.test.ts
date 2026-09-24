import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { CONTENT } from "../content/index";
import type { GameEvent, Outcome } from "../engine/types";
import { optionCharacterScore, optionScore } from "./policies";
import { ALL_POSITIONS } from "../engine/index";
import {
  LOCKER_ROOM_MIN_CHARACTER,
  UNDRAFTED_FLOOR,
  TIER_1,
  TIER_2,
  UNSURE,
  PROPOSALS,
  censusCorpus,
  characterSum,
  lockerRoomVerdict,
  summarize,
  traceCell,
  type CreditRow,
} from "./credit-proposal-probe";

const EVENTS = new Map<string, GameEvent>(CONTENT.events.map((e) => [e.id, e]));
const ALL_ROWS: CreditRow[] = [...TIER_1, ...TIER_2, ...UNSURE];

// ---------------------------------------------------------------------------
// The two constants this probe copies out of modules it may not edit.
// ---------------------------------------------------------------------------

describe("copied constants match their source", () => {
  it("LOCKER_ROOM_MIN_CHARACTER matches view-model.ts", () => {
    const src = readFileSync(new URL("../ui/session/view-model.ts", import.meta.url), "utf8");
    const m = src.match(/const LOCKER_ROOM_MIN_CHARACTER = (\d+);/);
    expect(m, "LOCKER_ROOM_MIN_CHARACTER not found in view-model.ts").not.toBeNull();
    expect(Number(m![1])).toBe(LOCKER_ROOM_MIN_CHARACTER);
  });

  it("UNDRAFTED_FLOOR matches draft.ts", () => {
    const src = readFileSync(new URL("../engine/draft.ts", import.meta.url), "utf8");
    const m = src.match(/const UNDRAFTED_FLOOR = (\d+);/);
    expect(m, "UNDRAFTED_FLOOR not found in draft.ts").not.toBeNull();
    expect(Number(m![1])).toBe(UNDRAFTED_FLOOR);
  });

  it("the verdict function is the UI's", () => {
    expect(lockerRoomVerdict(1)).toBeNull();
    expect(lockerRoomVerdict(-1)).toBeNull();
    expect(lockerRoomVerdict(0)).toBeNull();
    expect(lockerRoomVerdict(2)).toBe("credit");
    expect(lockerRoomVerdict(-2)).toBe("cost");
  });
});

// ---------------------------------------------------------------------------
// Every proposal row resolves to source at HEAD. A proposal whose `from` has
// drifted is a proposal against a build nobody runs.
// ---------------------------------------------------------------------------

describe("every proposal row resolves to src/content/** at HEAD", () => {
  it.each(ALL_ROWS.map((r) => [`${r.eventId} / ${r.optionId}`, r] as const))(
    "%s: the event, the option and the branch exist and carry the stated `from`",
    (_label, row) => {
      const ev = EVENTS.get(row.eventId);
      expect(ev, `event ${row.eventId} not found`).toBeDefined();
      const op = ev!.options.find((o) => o.id === row.optionId);
      expect(op, `option ${row.optionId} not found on ${row.eventId}`).toBeDefined();
      const outcome: Outcome | undefined =
        row.branch === "positive" ? op!.positiveOutcome : op!.negativeOutcome;
      expect(outcome, `${row.branch} outcome missing on ${row.eventId}/${row.optionId}`).toBeDefined();
      expect(characterSum(outcome!)).toBe(row.from);
    },
  );

  it("every row raises rather than lowers, and lands at or above the display floor", () => {
    for (const row of ALL_ROWS) {
      expect(row.to, `${row.eventId}/${row.optionId} must increase`).toBeGreaterThan(row.from);
      expect(row.to).toBeGreaterThanOrEqual(LOCKER_ROOM_MIN_CHARACTER);
    }
  });

  // The magnitude argument in the report: +2 is the smallest SPEAKABLE credit,
  // it is already an authored magnitude (10 outcomes carry it at HEAD), and it
  // stays inside the -1..-4 band that 49 of the 72 authored negative character
  // outcomes occupy. If a future edit proposes a magnitude the corpus has never
  // used, that is a new authorial decision and this test should fail.
  it("every proposed magnitude is one the corpus already authors", () => {
    const authored = new Set<number>();
    for (const ev of CONTENT.events)
      for (const op of ev.options)
        for (const o of [op.positiveOutcome, op.negativeOutcome]) {
          if (!o) continue;
          const c = characterSum(o);
          if (c !== 0) authored.add(Math.abs(c));
        }
    for (const row of ALL_ROWS) expect(authored.has(Math.abs(row.to)), `${row.to} is not an authored magnitude`).toBe(true);
  });

  it("the outcome prose a row targets is unambiguous within its option", () => {
    // `resolveFired` matches by prose, exactly as view-model.ts's cardAccount
    // does. If an option's two outcomes shared a description the probe would
    // refuse to account it and the row would silently measure nothing.
    for (const row of ALL_ROWS) {
      const op = EVENTS.get(row.eventId)!.options.find((o) => o.id === row.optionId)!;
      if (!op.negativeOutcome) continue;
      expect(
        op.positiveOutcome.description,
        `${row.eventId}/${row.optionId}: both outcomes share prose`,
      ).not.toBe(op.negativeOutcome.description);
    }
  });

  it("no card appears twice across the three tiers", () => {
    const keys = ALL_ROWS.map((r) => `${r.eventId}|${r.optionId}|${r.branch}`);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

// ---------------------------------------------------------------------------
// The modelling assumption, made checkable.
//
// The probe adds the delta on top of the career that was actually played. That
// is only sound if the edit does not change which branch a policy takes. Both
// scorers are evaluated here at HEAD and with the row applied.
// ---------------------------------------------------------------------------

function patchedOption(row: CreditRow): GameEvent["options"][number] {
  const ev = EVENTS.get(row.eventId)!;
  const op = ev.options.find((o) => o.id === row.optionId)!;
  const bump = (o: Outcome): Outcome => ({
    ...o,
    effects: [
      ...o.effects.filter((e) => e.kind !== "character"),
      { kind: "character", amount: row.to },
    ],
  });
  return row.branch === "positive"
    ? { ...op, positiveOutcome: bump(op.positiveOutcome) }
    : { ...op, negativeOutcome: bump(op.negativeOutcome!) };
}

describe("no proposal row flips a policy's pick on its own card", () => {
  it.each(ALL_ROWS.map((r) => [`${r.eventId} / ${r.optionId}`, r] as const))(
    "%s: `virtue` still prefers the same option before and after",
    (_label, row) => {
      const ev = EVENTS.get(row.eventId)!;
      const best = (opts: GameEvent["options"]): string =>
        opts.reduce((a, b) => (optionCharacterScore(b) > optionCharacterScore(a) ? b : a)).id;
      const after = ev.options.map((o) => (o.id === row.optionId ? patchedOption(row) : o));
      expect(best(after)).toBe(best(ev.options));
    },
  );

  // `best` (the `good` profile) scores in draft-stock points, where a character
  // point is worth 0.15 against an overall point's 1.4. A +1 bump is 0.15 of a
  // stock point, and on ONE card at HEAD that is enough to cross a tie.
  //
  // The flip set is PINNED rather than asserted empty, because the flip is the
  // finding: `Trash Talk` sits at 0.150 (stay-quiet) against 0.160
  // (let-it-fuel-you), a margin of one hundredth of a draft-stock point, and
  // +1 character carries it to 0.300. Report 059 §5 states plainly that the
  // modelled figures UNDERSTATE this row's effect on the `good` profile for
  // that reason. If a future content change adds or removes a flip, this test
  // fails and the report's limitation has to be restated.
  const KNOWN_BEST_FLIPS = ["trash-talk|stay-quiet"];

  it("the set of rows that move `best`'s pick is exactly the one the report names", () => {
    const flips: string[] = [];
    for (const row of ALL_ROWS) {
      const ev = EVENTS.get(row.eventId)!;
      const after = ev.options.map((o) => (o.id === row.optionId ? patchedOption(row) : o));
      for (const pos of ALL_POSITIONS) {
        const score = (o: GameEvent["options"][number]): number => optionScore(o, pos, CONTENT, -1000);
        const best = (opts: GameEvent["options"]): string =>
          opts.reduce((a, b) => (score(b) > score(a) ? b : a)).id;
        if (best(after) !== best(ev.options)) {
          flips.push(`${row.eventId}|${row.optionId}`);
          break;
        }
      }
    }
    expect(flips.sort()).toEqual([...KNOWN_BEST_FLIPS].sort());
  });

  it("the one flip is a coin-flip margin at HEAD, not a decisive preference", () => {
    const ev = EVENTS.get("trash-talk")!;
    const score = (o: GameEvent["options"][number]): number => optionScore(o, "DL", CONTENT, -1000);
    const quiet = score(ev.options.find((o) => o.id === "stay-quiet")!);
    const fuel = score(ev.options.find((o) => o.id === "let-it-fuel-you")!);
    expect(Math.abs(fuel - quiet)).toBeLessThan(0.05);
  });
});

// ---------------------------------------------------------------------------
// The corpus census: DECISION 084's numbers, re-derived.
// ---------------------------------------------------------------------------

describe("censusCorpus reproduces DECISION 084 at HEAD", () => {
  it("floor 2: 22 credit / 48 charge / 136 silent over 204 options", () => {
    const c = censusCorpus(2);
    expect(c.cards).toBe(106);
    expect(c.options).toBe(204);
    expect(c.canCredit).toBe(22);
    expect(c.canCharge).toBe(48);
    expect(c.silent).toBe(136);
  });

  it("floor 2: 27 one-way-down cards, 9 one-way-up", () => {
    const c = censusCorpus(2);
    expect(c.oneWayDown).toHaveLength(27);
    expect(c.oneWayUp).toHaveLength(9);
  });

  it("floor removed (1): 38 / 59 / 114, and 21 cards still one-way-down", () => {
    const c = censusCorpus(1);
    expect(c.canCredit).toBe(38);
    expect(c.canCharge).toBe(59);
    expect(c.silent).toBe(114);
    expect(c.oneWayDown).toHaveLength(21);
  });

  it("every proposed row is on a card that is one-way-down today", () => {
    const down = new Set(censusCorpus(2).oneWayDown);
    for (const row of ALL_ROWS) expect(down.has(row.eventId), `${row.eventId} is not one-way-down`).toBe(true);
  });

  it("each tier retires exactly the cards it names and no others", () => {
    const head = new Set(censusCorpus(2).oneWayDown);
    const t1 = new Set(censusCorpus(2, TIER_1).oneWayDown);
    const t12 = new Set(censusCorpus(2, PROPOSALS.tier1plus2).oneWayDown);
    const all = new Set(censusCorpus(2, PROPOSALS.tier1plus2plusUnsure).oneWayDown);
    expect(head.size - t1.size).toBe(TIER_1.length);
    expect(head.size - t12.size).toBe(TIER_1.length + TIER_2.length);
    expect(head.size - all.size).toBe(ALL_ROWS.length);
    // Retiring a one-way-down card must not create a one-way-UP card: every
    // row's card keeps a chargeable branch.
    expect(censusCorpus(2, PROPOSALS.tier1plus2plusUnsure).oneWayUp).toHaveLength(9);
  });
});

// ---------------------------------------------------------------------------
// The probe end to end, small.
// ---------------------------------------------------------------------------

describe("traceCareer scores the same career twice", () => {
  it("an empty proposal leaves every after-figure identical to before", () => {
    const traces = traceCell(12, "t59", "virtueLoyal", "OL", []);
    for (const t of traces) {
      expect(t.stockAfter).toBe(t.stockBefore);
      expect(t.creditsAfter).toBe(t.creditsBefore);
      expect(t.costsAfter).toBe(t.costsBefore);
      expect(t.charDelta).toBe(0);
    }
  });

  it("the tier-1 proposal never lowers credits or stock", () => {
    const traces = traceCell(12, "t59", "virtueLoyal", "OL", TIER_1);
    for (const t of traces) {
      expect(t.creditsAfter).toBeGreaterThanOrEqual(t.creditsBefore);
      expect(t.stockAfter).toBeGreaterThanOrEqual(t.stockBefore);
      expect(t.costsAfter).toBe(t.costsBefore); // no row touches a charging branch
    }
  });

  it("at least one tier-1 row actually fires for a virtue OL", () => {
    const traces = traceCell(30, "t59", "virtueLoyal", "OL", TIER_1);
    expect(traces.reduce((a, t) => a + t.charDelta, 0)).toBeGreaterThan(0);
  });

  it("summarize reports the paired delta as the mean of per-career differences", () => {
    const traces = traceCell(20, "t59", "virtueAmbitious", "DL", TIER_1);
    const r = summarize("virtueAmbitious", "tier1", TIER_1, traces);
    const manual = traces.reduce((a, t) => a + (t.stockAfter - t.stockBefore), 0) / traces.length;
    expect(r.draftStockDelta).toBeCloseTo(manual, 10);
    expect(r.careers).toBe(traces.length);
  });

  it("the run is deterministic in the seed", () => {
    const a = traceCell(8, "t59", "virtueLoyal", "QB", TIER_1);
    const b = traceCell(8, "t59", "virtueLoyal", "QB", TIER_1);
    expect(b.map((t) => t.stockAfter)).toEqual(a.map((t) => t.stockAfter));
  });
});
