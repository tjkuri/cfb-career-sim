// The career screen's two vocabulary constraints, as tests (task 058).
//
// There is no DOM environment in this project and `vitest.config.ts` collects
// `*.test.ts` only, so this file does not render the component. What it pins is
// the part that a later edit can silently break and a screenshot will not catch:
// the WORDS, and the relationship between the label on the standing block and
// the phrases `bands.ts` puts directly underneath it.

import { describe, it, expect } from "vitest";
import { PROGRAM_LABEL, programLine } from "./CareerScreen";
import { TRUST_LADDER } from "../session/bands";
import type { CardAccount } from "../session/types";

function account(lockerRoom: CardAccount["lockerRoom"]): CardAccount {
  return { own: 0, injury: false, later: null, lockerRoom } as CardAccount;
}

describe("the character line's vocabulary (task 058 item 2)", () => {
  // Measured before it was changed: of the 88 authored outcomes whose summed
  // character delta clears the display floor, 30% are about the room itself and
  // 33% have nothing to do with teammates at all -- money, family, media, fans,
  // police, academics. Weighted by how often each card fires over 140,935
  // decisions, 31% of the lines a player actually reads were plainly false as
  // stated. The currency is integrity broadly, so the display names the
  // currency.
  it("names the whole currency, not one room", () => {
    expect(programLine(account("cost"))).toBe("Cost you with the program.");
    expect(programLine(account("credit"))).toBe("Earned you credit with the program.");
  });

  it("never says locker room", () => {
    for (const verdict of ["cost", "credit"] as const) {
      expect(programLine(account(verdict))!.toLowerCase()).not.toContain("locker");
    }
    expect(PROGRAM_LABEL.toLowerCase()).not.toContain("locker");
  });

  // The floor lives in `cardAccount`, which returns null under
  // LOCKER_ROOM_MIN_CHARACTER. This screen must render nothing rather than
  // inventing a verdict for it (DECISION 075).
  it("says nothing when the account reports no verdict", () => {
    expect(programLine(account(null))).toBe(null);
  });

  // Direction and nothing else. The two sentences differ by their verb, never
  // by an amount, and neither may acquire one: `character` swings draft stock
  // by ~±7.5 against overall's ~82 and an integer here would overstate it
  // tenfold (DECISION 002).
  it("carries no number in either direction", () => {
    for (const verdict of ["cost", "credit"] as const) {
      expect(programLine(account(verdict))).not.toMatch(/\d/);
    }
  });
});

describe("the standing label against the ladder beneath it (task 058 item 1)", () => {
  // The binding constraint on the label. The five rungs are now drawn directly
  // under it during play, so a label that repeats a rung's words makes that rung
  // read as the heading of its own list. "The staff" collides with two rungs and
  // "the building" with a third; "the program" collides with none. If a later
  // band edit introduces one, this fails instead of shipping.
  it("does not collide with any rung", () => {
    for (const phrase of TRUST_LADDER) {
      expect(phrase.toLowerCase()).not.toContain(PROGRAM_LABEL);
    }
  });

  // The label and both card sentences have to be the same claim about the same
  // thing, or the block two inches above the card and the line under it are two
  // different currencies (DECISION 024's whole point).
  it("is the same noun the card's line uses", () => {
    expect(programLine(account("cost"))).toContain(PROGRAM_LABEL);
    expect(programLine(account("credit"))).toContain(PROGRAM_LABEL);
  });

  // The ladder is drawn from `TRUST_LADDER` in the order `bands.ts` writes it,
  // best regard first, and order is the entire payload -- the screen adds no
  // rung of its own and reorders nothing. Five is what the summary draws and
  // what the in-play block now draws, so the two are the same object.
  it("draws exactly the rungs bands.ts publishes, in its order", () => {
    expect(TRUST_LADDER).toHaveLength(5);
    expect([...TRUST_LADDER]).toEqual([
      "they would run through a wall for you",
      "the staff trusts you",
      "just a guy in the building",
      "a problem they are managing",
      "the staff has stopped defending you",
    ]);
  });
});
