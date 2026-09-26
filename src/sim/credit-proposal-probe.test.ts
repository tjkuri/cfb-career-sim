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
  LANDED,
  REVERT_LANDED,
  censusCorpus,
  characterSum,
  lockerRoomVerdict,
  summarize,
  traceCell,
  type CreditRow,
} from "./credit-proposal-probe";

const EVENTS = new Map<string, GameEvent>(CONTENT.events.map((e) => [e.id, e]));
const ALL_ROWS: CreditRow[] = [...TIER_1, ...TIER_2, ...UNSURE];

// DECISION 086/089: TIER_1 shipped on 2026-09-25, so its six branches now carry
// their `to` value in src/content/**. Everything below distinguishes the two
// eras explicitly rather than re-pointing old assertions at the new corpus.
const LANDED_KEYS = new Set(LANDED.map((r) => `${r.eventId}|${r.optionId}|${r.branch}`));
const isLanded = (r: CreditRow): boolean => LANDED_KEYS.has(`${r.eventId}|${r.optionId}|${r.branch}`);
/** What the corpus should carry for a row TODAY: `to` if it shipped, else `from`. */
const expectedNow = (r: CreditRow): number => (isLanded(r) ? r.to : r.from);

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
      expect(characterSum(outcome!)).toBe(expectedNow(row));
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

function optionWithCharacter(row: CreditRow, amount: number): GameEvent["options"][number] {
  const ev = EVENTS.get(row.eventId)!;
  const op = ev.options.find((o) => o.id === row.optionId)!;
  const bump = (o: Outcome): Outcome => ({
    ...o,
    effects: [
      ...o.effects.filter((e) => e.kind !== "character"),
      { kind: "character", amount },
    ],
  });
  return row.branch === "positive"
    ? { ...op, positiveOutcome: bump(op.positiveOutcome) }
    : { ...op, negativeOutcome: bump(op.negativeOutcome!) };
}

/** The option as it reads AFTER the row's edit. */
const patchedOption = (row: CreditRow): GameEvent["options"][number] =>
  optionWithCharacter(row, row.to);

/**
 * The option as it read BEFORE the edit. For an unlanded row that is just the
 * corpus as it stands; for a landed one the value has to be put back, which is
 * what keeps the two policy-flip findings below measuring what they measured.
 */
const baselineOptions = (row: CreditRow): GameEvent["options"] => {
  const ev = EVENTS.get(row.eventId)!;
  if (!isLanded(row)) return ev.options;
  const reverted = optionWithCharacter(row, row.from);
  return ev.options.map((o) => (o.id === row.optionId ? reverted : o));
};

describe("no proposal row flips a policy's pick on its own card", () => {
  it.each(ALL_ROWS.map((r) => [`${r.eventId} / ${r.optionId}`, r] as const))(
    "%s: `virtue` still prefers the same option before and after",
    (_label, row) => {
      const ev = EVENTS.get(row.eventId)!;
      const best = (opts: GameEvent["options"]): string =>
        opts.reduce((a, b) => (optionCharacterScore(b) > optionCharacterScore(a) ? b : a)).id;
      const before = baselineOptions(row);
      const after = before.map((o) => (o.id === row.optionId ? patchedOption(row) : o));
      expect(best(after)).toBe(best(before));
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
      const before = baselineOptions(row);
      const after = before.map((o) => (o.id === row.optionId ? patchedOption(row) : o));
      for (const pos of ALL_POSITIONS) {
        const score = (o: GameEvent["options"][number]): number => optionScore(o, pos, CONTENT, -1000);
        const best = (opts: GameEvent["options"]): string =>
          opts.reduce((a, b) => (score(b) > score(a) ? b : a)).id;
        if (best(after) !== best(before)) {
          flips.push(`${row.eventId}|${row.optionId}`);
          break;
        }
      }
    }
    expect(flips.sort()).toEqual([...KNOWN_BEST_FLIPS].sort());
  });

  it("the one flip was a coin-flip margin before the edit, and the edit decided it", () => {
    const score = (o: GameEvent["options"][number]): number => optionScore(o, "DL", CONTENT, -1000);
    const pick = (opts: GameEvent["options"], id: string): number =>
      score(opts.find((o) => o.id === id)!);
    const row = TIER_1.find((r) => r.eventId === "trash-talk")!;

    // BEFORE (pre-086): 0.150 against 0.160 — one hundredth of a draft-stock
    // point, which is why report 059 said the modelled figures understate this
    // row's effect on `good`.
    const before = baselineOptions(row);
    expect(Math.abs(pick(before, "let-it-fuel-you") - pick(before, "stay-quiet"))).toBeLessThan(0.05);

    // AFTER: TIER_1 shipped, and deciding this coin flip in favour of the quiet
    // option IS the intended effect. `good` now prefers restraint on this card.
    const ev = EVENTS.get("trash-talk")!;
    expect(pick(ev.options, "stay-quiet")).toBeGreaterThan(pick(ev.options, "let-it-fuel-you"));
  });
});

// ---------------------------------------------------------------------------
// The corpus census: DECISION 084's numbers, re-derived.
// ---------------------------------------------------------------------------

// DECISION 084's census was measured BEFORE TIER_1 shipped. Re-pointing these
// assertions at today's corpus would silently rewrite the evidence base that
// DECISIONS 084, 085 and 089 all cite, so instead the pre-086 corpus is
// reconstructed with REVERT_LANDED and the historical numbers are asserted
// against it unchanged. The corpus as it stands today is asserted separately
// below, and the DELTA between the two is asserted to be exactly the six cards
// that shipped — which is a stronger statement than either census alone.
describe("censusCorpus reproduces DECISION 084 against the pre-086 corpus", () => {
  it("floor 2: 22 credit / 48 charge / 136 silent over 204 options", () => {
    const c = censusCorpus(2, REVERT_LANDED);
    expect(c.cards).toBe(106);
    expect(c.options).toBe(204);
    expect(c.canCredit).toBe(22);
    expect(c.canCharge).toBe(48);
    expect(c.silent).toBe(136);
  });

  it("floor 2: 27 one-way-down cards, 9 one-way-up", () => {
    const c = censusCorpus(2, REVERT_LANDED);
    expect(c.oneWayDown).toHaveLength(27);
    expect(c.oneWayUp).toHaveLength(9);
  });

  it("floor removed (1): 38 / 59 / 114, and 21 cards still one-way-down", () => {
    const c = censusCorpus(1, REVERT_LANDED);
    expect(c.canCredit).toBe(38);
    expect(c.canCharge).toBe(59);
    expect(c.silent).toBe(114);
    expect(c.oneWayDown).toHaveLength(21);
  });

  it("every proposed row was on a card that was one-way-down before the edit", () => {
    const down = new Set(censusCorpus(2, REVERT_LANDED).oneWayDown);
    for (const row of ALL_ROWS) expect(down.has(row.eventId), `${row.eventId} is not one-way-down`).toBe(true);
  });

  it("each tier retires exactly the cards it names and no others", () => {
    // `head` is the pre-086 corpus; the tier arms are measured from there, so
    // these differences mean the same thing they meant when 059 reported them.
    const head = new Set(censusCorpus(2, REVERT_LANDED).oneWayDown);
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
// The corpus as it stands TODAY, after DECISION 086/089 shipped TIER_1.
// ---------------------------------------------------------------------------

describe("the corpus today, and the delta is exactly the six cards that shipped", () => {
  it("floor 2: 28 credit / 48 charge / 133 silent, and 21 one-way-down", () => {
    const c = censusCorpus(2);
    expect(c.cards).toBe(106);
    expect(c.options).toBe(204);
    // 22 -> 28: all six shipped branches were below the display floor (five at
    // +1, one at 0) and now clear it. Nothing gained a charge, so canCharge is
    // unmoved. `silent` falls by only 3 because three of the six options could
    // already charge on their other branch and so were never counted silent.
    expect(c.canCredit).toBe(28);
    expect(c.canCharge).toBe(48);
    expect(c.silent).toBe(133);
    expect(c.oneWayDown).toHaveLength(21);
    expect(c.oneWayUp).toHaveLength(9);
  });

  it("floor removed (1): only the 0 -> 2 row is new, because the rest already cleared floor 1", () => {
    const c = censusCorpus(1);
    expect(c.canCredit).toBe(39); // 38 + offseason-captain-vote/let-the-work-speak
    expect(c.canCharge).toBe(59);
    expect(c.oneWayDown).toHaveLength(20);
  });

  it("today's corpus is the pre-086 corpus with TIER_1 applied, and nothing else", () => {
    for (const floor of [1, 2]) {
      const rebuilt = censusCorpus(floor, REVERT_LANDED.map((r) => ({ ...r, from: r.to, to: r.from })));
      const live = censusCorpus(floor);
      expect(rebuilt.canCredit, `floor ${floor} canCredit`).toBe(live.canCredit);
      expect(rebuilt.canCharge, `floor ${floor} canCharge`).toBe(live.canCharge);
      expect(rebuilt.silent, `floor ${floor} silent`).toBe(live.silent);
      expect(rebuilt.oneWayDown.sort(), `floor ${floor} oneWayDown`).toEqual(live.oneWayDown.sort());
      expect(rebuilt.oneWayUp.sort(), `floor ${floor} oneWayUp`).toEqual(live.oneWayUp.sort());
    }
  });

  it("exactly the six TIER_1 cards left the one-way-down set, and no card became one-way-up", () => {
    const before = censusCorpus(2, REVERT_LANDED);
    const after = censusCorpus(2);
    const left = before.oneWayDown.filter((id) => !after.oneWayDown.includes(id));
    expect(left.sort()).toEqual([...new Set(TIER_1.map((r) => r.eventId))].sort());
    expect(after.oneWayUp.sort()).toEqual(before.oneWayUp.sort());
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
