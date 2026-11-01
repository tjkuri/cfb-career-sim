import { describe, it, expect } from "vitest";
import { PLAYBOOKS } from "../content/big-game";
import { makeSpot } from "./big-game";
import { createRng } from "./rng";
import { ALL_POSITIONS } from "./types";

describe("makeSpot", () => {
  it("is always the last snap: fourth down, or the clock running out", () => {
    for (const position of ALL_POSITIONS) {
      for (let i = 0; i < 300; i++) {
        const spot = makeSpot(position, createRng(`spot-${position}-${i}`));
        if (spot.down < 4) expect(spot.clock, `${position} ${i}`).toBeLessThanOrEqual(5);
      }
    }
  });

  it("gives the result a score it can agree with", () => {
    for (let i = 0; i < 300; i++) {
      const o = makeSpot("QB", createRng(`o-${i}`));
      expect(o.them - o.us, "offense trails by a field goal to less than a touchdown").toBeGreaterThanOrEqual(3);
      expect(o.them - o.us).toBeLessThan(7);
      const d = makeSpot("DL", createRng(`d-${i}`));
      expect(d.us - d.them, "defense leads by less than a touchdown").toBeGreaterThan(0);
      expect(d.us - d.them).toBeLessThan(7);
    }
  });
});

describe("result lines", () => {
  // One line covers every defense a call can face, and a right call still
  // loses sometimes, so no line may name a particular defense.
  it("never name one of their package's defenses", () => {
    for (const [pos, books] of Object.entries(PLAYBOOKS)) {
      for (const b of books) {
        for (const line of [...b.success, ...b.failure]) {
          for (const c of b.counters) {
            expect(line.toLowerCase().includes(c.label.toLowerCase()), `${pos} ${b.name}: "${line}" names ${c.label}`).toBe(false);
          }
        }
      }
    }
  });
});
