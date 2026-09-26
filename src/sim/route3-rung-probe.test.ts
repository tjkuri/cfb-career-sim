import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { CONTENT } from "../content/index";
import { STARTING_CHARACTER as ENGINE_STARTING_CHARACTER } from "../engine/create-career";
import { trustPhrase, trustRungOf, TRUST_LADDER } from "../ui/session/bands";
import type { Outcome } from "../engine/types";
import {
  ARMS,
  LOCKER_ROOM_MIN_CHARACTER,
  OPENER_IDS,
  ROUTE_3,
  STARTING_CHARACTER,
  TIER_1,
  TIER_2,
  TRUST_BAND_FLOORS,
  UNDRAFTED_FLOOR,
  characterSum,
  lockerRoomVerdict,
  openerPicks,
  patchContent,
  rungOf,
  traceCell,
  verifyRows,
  type ArmName,
} from "./route3-rung-probe";

function charOf(o: Outcome | undefined): number {
  return (o?.effects ?? []).reduce((a, e) => a + (e.kind === "character" ? e.amount : 0), 0);
}

// ---------------------------------------------------------------------------
// The copied constants, each pinned to its source.
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

  it("STARTING_CHARACTER matches the engine's own export", () => {
    expect(STARTING_CHARACTER).toBe(ENGINE_STARTING_CHARACTER);
  });
});

// ---------------------------------------------------------------------------
// The ladder. `bands.ts` exports phrases and `trustRungOf`, never the
// thresholds, so the probe re-derives the floors. This is the guard that makes
// re-deriving them safe: a band edit fails HERE instead of silently
// invalidating every rung-crossing figure in report 061.
// ---------------------------------------------------------------------------

describe("the probe's band table is the UI's band table", () => {
  it("reproduces trustPhrase(n) for every reachable character value", () => {
    for (let n = 0; n <= 100; n++) {
      expect(TRUST_BAND_FLOORS[rungOf(n)]!.phrase, `character ${n}`).toBe(trustPhrase(n));
    }
  });

  it("reproduces the UI's rung index for every reachable character value", () => {
    for (let n = 0; n <= 100; n++) {
      expect(rungOf(n), `character ${n}`).toBe(trustRungOf(trustPhrase(n)));
    }
  });

  it("has the same five phrases in the same best-first order", () => {
    expect(TRUST_BAND_FLOORS.map((b) => b.phrase)).toEqual([...TRUST_LADDER]);
  });

  it("agrees with the UI that a smaller index is a higher rung", () => {
    expect(rungOf(100)).toBe(0);
    expect(rungOf(0)).toBe(TRUST_BAND_FLOORS.length - 1);
  });

  it("silences everything under the floor and speaks at it", () => {
    expect(lockerRoomVerdict(1)).toBeNull();
    expect(lockerRoomVerdict(-1)).toBeNull();
    expect(lockerRoomVerdict(2)).toBe("credit");
    expect(lockerRoomVerdict(-2)).toBe("cost");
  });
});

// ---------------------------------------------------------------------------
// Every arm's rows resolved to source, card by card. Brief 061's first
// denominator rule: a set defined by a measurement is not a set verified card
// by card.
// ---------------------------------------------------------------------------

describe("every arm's rows match the corpus at HEAD", () => {
  for (const arm of Object.keys(ARMS) as ArmName[]) {
    it(`${arm}: every row's \`from\` is the authored value`, () => {
      expect(verifyRows(ARMS[arm])).toEqual([]);
    });
  }

  it("Tier 1 is six rows on six distinct cards", () => {
    expect(TIER_1).toHaveLength(6);
    expect(new Set(TIER_1.map((r) => r.eventId)).size).toBe(6);
  });

  it("Tier 2 and Route 3 each cover exactly the five openers", () => {
    expect(TIER_2.map((r) => r.eventId)).toEqual([...OPENER_IDS]);
    expect(ROUTE_3.map((r) => r.eventId)).toEqual([...OPENER_IDS]);
    expect(new Set(TIER_2.map((r) => r.optionId))).toEqual(new Set(["stay-within"]));
    expect(new Set(ROUTE_3.map((r) => r.optionId))).toEqual(new Set(["handle-it"]));
    expect(new Set(ROUTE_3.map((r) => r.branch))).toEqual(new Set(["negative"]));
  });
});

// ---------------------------------------------------------------------------
// The five openers, resolved by hand. Report 061 §1.2 is an argument about
// AUTHORED MAGNITUDES, and it is only sound if these are the only two.
// ---------------------------------------------------------------------------

describe("the five openers, verified card by card", () => {
  const openers = OPENER_IDS.map((id) => CONTENT.events.find((e) => e.id === id)!);

  it("all five exist, are `fixed`, and partition seasonIndex 0..4", () => {
    expect(openers.every(Boolean)).toBe(true);
    expect(openers.every((e) => e.kind === "fixed")).toBe(true);
    expect(openers.map((e) => e.conditions?.seasonIndex)).toEqual([[0], [1], [2], [3], [4]]);
  });

  it("all five carry exactly the two options at the documented probabilities", () => {
    for (const ev of openers) {
      expect(ev.options.map((o) => o.id)).toEqual(["handle-it", "stay-within"]);
      expect(ev.options[0]!.probability).toBe(0.75);
      expect(ev.options[1]!.probability).toBe(0.9);
    }
  });

  // This is the premise of §1.2 and the whole reason the wave-26 objection
  // survives. If a future edit gives an opener any other character magnitude,
  // that argument stops holding and this test says so.
  it("author exactly two character magnitudes between them: +1 and -2", () => {
    const seen = new Set<number>();
    for (const ev of openers) {
      for (const op of ev.options) {
        seen.add(charOf(op.positiveOutcome));
        seen.add(charOf(op.negativeOutcome));
      }
    }
    expect([...seen].sort((a, b) => a - b)).toEqual([-2, 0, 1]);
  });

  it("at HEAD the only READABLE opener line is the -2 charge", () => {
    const readable: number[] = [];
    for (const ev of openers) {
      for (const op of ev.options) {
        for (const o of [op.positiveOutcome, op.negativeOutcome]) {
          const v = lockerRoomVerdict(charOf(o));
          if (v !== null) readable.push(charOf(o));
        }
      }
    }
    expect(readable).toEqual([-2, -2, -2, -2, -2]);
  });
});

// ---------------------------------------------------------------------------
// patchContent — the mechanism that makes these arms observed rather than
// modelled. It must not touch the real bundle.
// ---------------------------------------------------------------------------

describe("patchContent edits a copy and never the bundle", () => {
  it("the HEAD arm is the base bundle itself", () => {
    expect(patchContent(ARMS.head)).toBe(CONTENT);
  });

  it("leaves CONTENT byte-identical after every arm is patched", () => {
    const before = JSON.stringify(CONTENT.events);
    for (const arm of Object.keys(ARMS) as ArmName[]) patchContent(ARMS[arm]);
    expect(JSON.stringify(CONTENT.events)).toBe(before);
  });

  it("shares every untouched event by reference", () => {
    const patched = patchContent(ROUTE_3);
    const touched = new Set<string>(ROUTE_3.map((r) => r.eventId));
    for (let i = 0; i < CONTENT.events.length; i++) {
      const same = patched.events[i] === CONTENT.events[i];
      expect(same, CONTENT.events[i]!.id).toBe(!touched.has(CONTENT.events[i]!.id));
    }
  });

  it("Route 3 deletes the character effect and changes nothing else", () => {
    const patched = patchContent(ROUTE_3);
    for (const id of OPENER_IDS) {
      const head = CONTENT.events.find((e) => e.id === id)!.options[0]!;
      const now = patched.events.find((e) => e.id === id)!.options[0]!;
      expect(now.id).toBe("handle-it");
      expect(charOf(now.negativeOutcome)).toBe(0);
      expect(now.negativeOutcome!.effects).toHaveLength(0);
      // Prose, probability and the success branch are untouched.
      expect(now.negativeOutcome!.description).toBe(head.negativeOutcome!.description);
      expect(now.probability).toBe(head.probability);
      expect(now.positiveOutcome).toEqual(head.positiveOutcome);
    }
  });

  it("Tier 2 raises stay-within to +2 and keeps the snaps effect and its order", () => {
    const patched = patchContent(TIER_2);
    for (const id of OPENER_IDS) {
      const head = CONTENT.events.find((e) => e.id === id)!.options[1]!;
      const now = patched.events.find((e) => e.id === id)!.options[1]!;
      expect(charOf(now.positiveOutcome)).toBe(2);
      expect(now.positiveOutcome.effects.map((e) => e.kind)).toEqual(
        head.positiveOutcome.effects.map((e) => e.kind),
      );
      expect(now.positiveOutcome.effects[0]).toEqual(head.positiveOutcome.effects[0]);
    }
  });
});

// ---------------------------------------------------------------------------
// The two findings report 061 leads with, pinned so a content change cannot
// quietly falsify the report.
// ---------------------------------------------------------------------------

describe("§1.2 — under Route 3 no opener can print a character line at all", () => {
  it("every opener branch is sub-floor under Route 3", () => {
    const patched = patchContent(ROUTE_3);
    for (const id of OPENER_IDS) {
      for (const op of patched.events.find((e) => e.id === id)!.options) {
        for (const o of [op.positiveOutcome, op.negativeOutcome]) {
          if (!o) continue;
          expect(lockerRoomVerdict(characterSum(o)), `${id}/${op.id}`).toBeNull();
        }
      }
    }
  });

  it("Tier 2 + Route 3 instead makes all five openers one-way-UP", () => {
    const patched = patchContent([...TIER_2, ...ROUTE_3]);
    for (const id of OPENER_IDS) {
      const verdicts: (string | null)[] = [];
      for (const op of patched.events.find((e) => e.id === id)!.options) {
        for (const o of [op.positiveOutcome, op.negativeOutcome]) {
          if (o) verdicts.push(lockerRoomVerdict(characterSum(o)));
        }
      }
      expect(verdicts.includes("credit"), `${id} can credit`).toBe(true);
      expect(verdicts.includes("cost"), `${id} can charge`).toBe(false);
    }
  });
});

describe("§1.1 — policy re-selection, measured against the patched bundle", () => {
  it("the stock scorer flips to handle-it under Route 3, and only under Route 3", () => {
    const flips: Record<string, boolean> = {};
    for (const arm of Object.keys(ARMS) as ArmName[]) {
      const picks = openerPicks(patchContent(ARMS[arm]));
      flips[arm] = OPENER_IDS.every((id) => picks[`${id}|best`] === "handle-it");
    }
    expect(flips).toEqual({
      head: false,
      tier1: false,
      tier2: false,
      route3: true,
      tier2plusRoute3: false,
    });
  });

  it("the virtue scorer never flips, in any arm", () => {
    for (const arm of Object.keys(ARMS) as ArmName[]) {
      const picks = openerPicks(patchContent(ARMS[arm]));
      for (const id of OPENER_IDS) {
        expect(picks[`${id}|virtue`], `${arm}/${id}`).toBe("stay-within");
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Identity. Because this lane ships no product code, the HEAD arm has to be
// the game as it stands, and an arm nobody's policy responds to has to be
// bit-identical rather than merely close.
// ---------------------------------------------------------------------------

describe("identity checks", () => {
  it("the HEAD arm plays the game as it stands", () => {
    const a = traceCell(6, "b61-id", "virtueLoyal", "QB", patchContent(ARMS.head));
    const b = traceCell(6, "b61-id", "virtueLoyal", "QB", CONTENT);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  // The `virtue` scorer never takes `handle-it` on an opener (E[char] 0.900 vs
  // 0.000), so deleting that branch's effect cannot reach a maximum-virtue
  // career. If this ever fails, §2's "Route 3 is an exact no-op for the virtue
  // profiles" claim is dead and the report is wrong.
  it("Route 3 is an exact no-op for a maximum-virtue career", () => {
    const head = traceCell(8, "b61-id", "virtueLoyal", "QB", CONTENT);
    const r3 = traceCell(8, "b61-id", "virtueLoyal", "QB", patchContent(ROUTE_3));
    expect(JSON.stringify(r3)).toBe(JSON.stringify(head));
  });

  it("Route 3 is NOT a no-op for the stock-maximiser", () => {
    const head = traceCell(8, "b61-id", "good", "QB", CONTENT);
    const r3 = traceCell(8, "b61-id", "good", "QB", patchContent(ROUTE_3));
    expect(JSON.stringify(r3)).not.toBe(JSON.stringify(head));
    expect(head.reduce((a, t) => a + (t.openerTakes["stay-within"] ?? 0), 0)).toBeGreaterThan(0);
    expect(r3.reduce((a, t) => a + (t.openerTakes["stay-within"] ?? 0), 0)).toBe(0);
  });
});
