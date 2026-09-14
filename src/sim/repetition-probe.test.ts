import { describe, it, expect } from "vitest";
import {
  cardKeyOf,
  firstRepeat,
  repeatShare,
  traceCareer,
  runRepetitionProbe,
  REPETITION_COHORTS,
  type DecisionRecord,
} from "./repetition-probe";
import { CONTENT } from "../content/index";
import type { Setup } from "../engine/index";

// A minimal DecisionRecord: only `eventId`, `title` and `description` are read
// by the key functions, but whole records are built so these tests keep
// compiling honestly if the record grows.
function rec(index: number, eventId: string, title: string, description: string): DecisionRecord {
  return { index, eventId, title, description, seasonIndex: 0, phase: "nonconf", classYear: "FR" };
}

describe("repeat keys", () => {
  it("keys a decision on the rendered card, not on its event id", () => {
    const a = rec(1, "opener-s0", "Season Opener", "Same body.");
    const b = rec(2, "opener-s1", "Season Opener", "Same body.");
    expect(cardKeyOf(a)).toBe(cardKeyOf(b));
  });

  it("separates two cards that share a title but not a body", () => {
    const a = rec(1, "opener-s0", "Season Opener", "One body.");
    const b = rec(2, "opener-s1", "Season Opener", "Another body.");
    expect(cardKeyOf(a)).not.toBe(cardKeyOf(b));
  });

  it("separates two cards that share a body but not a title", () => {
    const a = rec(1, "x", "First Snap", "Same body.");
    const b = rec(2, "y", "Season Opener", "Same body.");
    expect(cardKeyOf(a)).not.toBe(cardKeyOf(b));
  });

  // The separator has to be something no authored title can contain, or a
  // title ending in the separator could collide with the next card's body.
  it("does not collide when a title and a body are re-split at the separator", () => {
    const a = rec(1, "x", "A", "B|C");
    const b = rec(2, "y", "A|B", "C");
    expect(cardKeyOf(a)).not.toBe(cardKeyOf(b));
  });
});

describe("firstRepeat", () => {
  it("returns the 1-based index of the first decision that re-shows a card", () => {
    const ds = [
      rec(1, "a", "A", "a"),
      rec(2, "b", "B", "b"),
      rec(3, "a", "A", "a"),
    ];
    expect(firstRepeat(ds, cardKeyOf)?.index).toBe(3);
  });

  it("names the event whose card repeated, not the one before it", () => {
    const ds = [rec(1, "a", "A", "a"), rec(2, "b", "B", "b"), rec(3, "a", "A", "a")];
    expect(firstRepeat(ds, cardKeyOf)?.eventId).toBe("a");
  });

  it("returns null for a career that never repeats a card", () => {
    const ds = [rec(1, "a", "A", "a"), rec(2, "b", "B", "b")];
    expect(firstRepeat(ds, cardKeyOf)).toBeNull();
  });

  it("counts a repeat of the very first card at index 2", () => {
    const ds = [rec(1, "a", "A", "a"), rec(2, "a", "A", "a")];
    expect(firstRepeat(ds, cardKeyOf)?.index).toBe(2);
  });
});

describe("repeatShare", () => {
  it("counts every re-showing after the first, not the first sighting", () => {
    // a a a b -> two of four decisions are re-showings.
    const ds = [rec(1, "a", "A", "a"), rec(2, "a", "A", "a"), rec(3, "a", "A", "a"), rec(4, "b", "B", "b")];
    expect(repeatShare(ds, cardKeyOf)).toBeCloseTo(0.5, 10);
  });

  it("is zero for an all-distinct career", () => {
    expect(repeatShare([rec(1, "a", "A", "a"), rec(2, "b", "B", "b")], cardKeyOf)).toBe(0);
  });

  it("is zero, not NaN, for an empty career", () => {
    expect(repeatShare([], cardKeyOf)).toBe(0);
  });
});

describe("traceCareer", () => {
  const setup: Setup = { lastName: "P", jerseyNumber: 1, homeState: "TX", position: "QB" };

  it("records the rendered title and description the player actually sees", () => {
    const ds = traceCareer(setup, "rep-trace-0", REPETITION_COHORTS.B);
    const opener = ds.find((d) => d.eventId.startsWith("milestone-opener"));
    const authored = CONTENT.events.find((e) => e.id === opener!.eventId)!;
    expect(opener!.title).toBe(authored.title);
    expect(opener!.description).toBe(authored.description);
  });

  it("numbers decisions from 1 with no gaps", () => {
    const ds = traceCareer(setup, "rep-trace-0", REPETITION_COHORTS.B);
    expect(ds.map((d) => d.index)).toEqual(ds.map((_, i) => i + 1));
  });

  it("plays a full four-year career under cohort B", () => {
    const ds = traceCareer(setup, "rep-trace-0", REPETITION_COHORTS.B);
    expect(Math.max(...ds.map((d) => d.seasonIndex))).toBe(3);
  });

  it("plays a five-season career under cohort C, which takes the redshirt", () => {
    const ds = traceCareer(setup, "rep-trace-0", REPETITION_COHORTS.C);
    expect(ds.some((d) => d.eventId === "redshirt")).toBe(true);
    expect(Math.max(...ds.map((d) => d.seasonIndex))).toBe(4);
  });
});

// The single most important property in the harness. The pilot writes variants
// with DISTINCT ids that render DISTINCT cards; if the repeat key were the
// event id, the pilot would grade itself green by construction. The card key
// is only trustworthy if it reproduces the id key on content where the two
// must agree — i.e. where no two events render the same card.
describe("the card key is the honest key", () => {
  it("gives every event in the bundle a distinct (title, description) pair", () => {
    const seen = new Map<string, string>();
    const collisions: string[] = [];
    for (const ev of CONTENT.events) {
      const k = cardKeyOf({ ...rec(0, ev.id, ev.title, ev.description) });
      if (seen.has(k)) collisions.push(`${seen.get(k)} / ${ev.id}`);
      seen.set(k, ev.id);
    }
    expect(collisions).toEqual([]);
  });

  it("reproduces the id-keyed first-repeat and repeat-share on a real cohort", () => {
    const byCard = runRepetitionProbe(REPETITION_COHORTS.B, 2, "rep-equiv", "card");
    const byId = runRepetitionProbe(REPETITION_COHORTS.B, 2, "rep-equiv", "id");
    expect(byCard.firstRepeatMedian).toBe(byId.firstRepeatMedian);
    expect(byCard.repeatByDecision16Rate).toBe(byId.repeatByDecision16Rate);
    expect(byCard.repeatShareMedian).toBe(byId.repeatShareMedian);
    expect(byCard.decisionsMedian).toBe(byId.decisionsMedian);
  });
});

describe("runRepetitionProbe", () => {
  it("balances careers across all six positions", () => {
    const r = runRepetitionProbe(REPETITION_COHORTS.B, 2, "rep-bal", "card");
    expect(r.careers).toBe(12);
    expect(Object.values(r.careersByPosition)).toEqual([2, 2, 2, 2, 2, 2]);
  });

  it("is deterministic on a seed prefix", () => {
    const a = runRepetitionProbe(REPETITION_COHORTS.B, 2, "rep-det", "card");
    const b = runRepetitionProbe(REPETITION_COHORTS.B, 2, "rep-det", "card");
    expect(a).toEqual(b);
  });

  it("reports rates as probabilities and percentiles in order", () => {
    const r = runRepetitionProbe(REPETITION_COHORTS.B, 2, "rep-ord", "card");
    expect(r.repeatByDecision16Rate).toBeGreaterThanOrEqual(0);
    expect(r.repeatByDecision16Rate).toBeLessThanOrEqual(1);
    expect(r.firstRepeatP10).toBeLessThanOrEqual(r.firstRepeatMedian);
    expect(r.firstRepeatMedian).toBeLessThanOrEqual(r.firstRepeatP90);
  });
});
