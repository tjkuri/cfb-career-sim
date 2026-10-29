import { describe, it, expect } from "vitest";
import { OFFFIELD_EVENTS } from "./offfield";
import type { Effect, GameEvent, Outcome } from "../../engine/types";

function outcomes(ev: GameEvent): Outcome[] {
  return ev.options.flatMap((o) =>
    [o.positiveOutcome, o.negativeOutcome].filter((oc): oc is Outcome => oc !== undefined),
  );
}
function allEffects(ev: GameEvent): Effect[] {
  return outcomes(ev).flatMap((oc) => oc.effects);
}
function characterSum(oc: Outcome): number {
  return oc.effects.reduce((a, e) => (e.kind === "character" ? a + e.amount : a), 0);
}
function paysSomething(oc: Outcome): boolean {
  return oc.effects.some((e) => e.kind === "overall" || e.kind === "snaps" || e.kind === "stat");
}

const band1 = OFFFIELD_EVENTS.filter((e) => e.conditions?.maxCharacter === undefined);

describe("off-field band 1 — ungated temptations", () => {
  it("authors ten members", () => {
    expect(band1.length).toBeGreaterThanOrEqual(10);
  });

  // catfished and speeding-georgia predate Stage 3d. They are luck-shaped
  // rather than choice-shaped and carry weight 2, so the conventions authored
  // in this stage exempt them. Converting them is a listed tuning lever
  // (spec section 8.1, lever 5).
  const INHERITED = new Set(["catfished", "speeding-georgia"]);
  // A straight gamble rather than a temptation: trusting family is not
  // corrosive, it is a bet that the cousin is as good as he says.
  const GAMBLES = new Set(["offfield-money-manager"]);

  it("is ungated, random, and weight 3", () => {
    for (const ev of band1) {
      expect(ev.kind, ev.id).toBe("random");
      expect(ev.conditions?.maxCharacter, `${ev.id} must be ungated on character`).toBeUndefined();
      expect(ev.conditions?.maxOverall, `${ev.id} must be ungated on overall`).toBeUndefined();
      expect(ev.conditions?.position, `${ev.id} must apply to every position`).toBeUndefined();
      if (!INHERITED.has(ev.id)) {
        expect(ev.weight, `${ev.id} must be weight 3`).toBe(3);
        expect(ev.options.length, `${ev.id} must offer exactly two options`).toBe(2);
      }
    }
  });

  it("emits no endings", () => {
    for (const ev of band1) {
      expect(allEffects(ev).filter((e) => e.kind === "ending").length, `${ev.id} emits an ending`).toBe(0);
    }
  });

  it("charges character on the branch you take, not only on failure", () => {
    for (const ev of band1) {
      if (INHERITED.has(ev.id) || GAMBLES.has(ev.id)) continue;
      const chosenCost = ev.options.some((o) => {
        const pos = characterSum(o.positiveOutcome);
        const neg = o.negativeOutcome ? characterSum(o.negativeOutcome) : pos;
        return pos <= -4 && neg <= -4;
      });
      expect(chosenCost, `${ev.id} has no option charging <= -4 character on both branches`).toBe(true);
    }
  });

  it("always offers a clean path", () => {
    for (const ev of band1) {
      // speeding-georgia predates Stage 3d: its single option is a coin flip
      // with no unconditionally-safe branch, which is the point of the event.
      // It's exempt for the same reason as the rest of INHERITED's checks.
      if (INHERITED.has(ev.id)) continue;
      const clean = ev.options.some((o) =>
        [o.positiveOutcome, o.negativeOutcome]
          .filter((oc): oc is Outcome => oc !== undefined)
          .every((oc) => characterSum(oc) >= 0),
      );
      expect(clean, `${ev.id} offers no option free of character cost`).toBe(true);
    }
  });

  it("never leaves the corrosive option strictly dominated", () => {
    for (const ev of band1) {
      if (INHERITED.has(ev.id) || GAMBLES.has(ev.id)) continue;
      const corrosive = ev.options.find((o) => characterSum(o.positiveOutcome) <= -4);
      expect(corrosive, `${ev.id} has no corrosive option`).toBeDefined();
      const tradeExists = paysSomething(corrosive!.positiveOutcome);
      expect(tradeExists, `${ev.id} offers no real trade — the corrosive option pays nothing`).toBe(true);
    }
  });
});

const band2 = OFFFIELD_EVENTS.filter((e) => e.conditions?.maxCharacter !== undefined);

describe("off-field band 2 — the slipping band", () => {
  it("authors five events, all gated at maxCharacter 55 with weight 4", () => {
    expect(band2.length).toBe(5);
    for (const ev of band2) {
      expect(ev.conditions!.maxCharacter, `${ev.id} must gate at exactly 55`).toBe(55);
      expect(ev.weight, `${ev.id} must outweigh band 1`).toBe(4);
      expect(ev.kind, ev.id).toBe("random");
    }
  });

  it("covers the phases the spiral needs", () => {
    const byPhase = (p: string) => band2.filter((e) => e.phase === p).length;
    expect(byPhase("offseason")).toBe(2);
    expect(byPhase("nonconf")).toBe(1);
    expect(byPhase("conference")).toBe(1);
    expect(byPhase("postseason")).toBe(1);
  });

  it("emits no endings — band 2 is pressure, not death", () => {
    for (const ev of band2) {
      expect(allEffects(ev).filter((e) => e.kind === "ending").length, `${ev.id} emits an ending`).toBe(0);
    }
  });

  it("offers three options so redemption is not a coin flip under random play", () => {
    for (const ev of band2) {
      expect(ev.options.length, `${ev.id} must offer exactly three options`).toBe(3);
    }
  });

  it("always offers a redemption path that is paid for on the field", () => {
    for (const ev of band2) {
      const redemption = ev.options.find((o) => characterSum(o.positiveOutcome) >= 6);
      expect(redemption, `${ev.id} offers no option granting >= +6 character`).toBeDefined();

      const fieldCost = redemption!.positiveOutcome.effects.some(
        (e) => (e.kind === "overall" && e.amount < 0) || (e.kind === "snaps" && e.amount < 0),
      );
      expect(fieldCost, `${ev.id}'s redemption is a free undo — it must cost overall or snaps`).toBe(true);

      // Offseason snaps effects write to the previous, already-consumed season
      // (see plan trap list), so the field cost there has to be overall.
      if (ev.phase === "offseason") {
        const usesSnaps = redemption!.positiveOutcome.effects.some((e) => e.kind === "snaps");
        expect(usesSnaps, `${ev.id} is an offseason event and must not pay its cost in snaps`).toBe(false);
      }
    }
  });

  it("always offers a path that digs the hole deeper", () => {
    for (const ev of band2) {
      const deeper = ev.options.some((o) => characterSum(o.positiveOutcome) <= -6);
      expect(deeper, `${ev.id} offers no option costing <= -6 character`).toBe(true);
    }
  });
});
