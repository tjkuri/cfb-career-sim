import { describe, it, expect } from "vitest";
import { PLAYBOOKS } from "../content/big-game";
import { BIG_GAME_EVENT_ID, makeSpot, resolveBigGame, wheelOdds, wheelParts } from "./big-game";
import { createCareer } from "./create-career";
import { createRng } from "./rng";
import { ALL_POSITIONS, type PendingBigGame } from "./types";

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

describe("the read decides it", () => {
  const spot = makeSpot("QB", createRng("w"));
  const pending = (theirCall: number): PendingBigGame => ({
    stakes: "bowl", name: "Test Bowl", opponent: "Them", theirCall, scoutedCall: theirCall, tendency: 90, lookCall: theirCall, situation: 0, pkg: 0, spot, thrownIn: false,
  });
  const play = (callId: string, theirCall: number, seed: string, overall = 75) => {
    const s = createCareer({ lastName: "A", jerseyNumber: 1, homeState: "TX", position: "QB" }, seed);
    s.overall = overall;
    s.seasons.push({ seasonIndex: 0, schoolId: s.school.schoolId, snaps: 0, stats: {}, teamWins: 9, teamLosses: 3, overall, classYear: "FR", role: "starter", tierPlayed: 2 });
    s.pendingBigGame = pending(theirCall);
    s.currentEventId = BIG_GAME_EVENT_ID;
    resolveBigGame(s, callId, createRng(seed), () => ({ overallDelta: 3, recoveryPhases: 1 }));
    return s.seasons[0]!.bigGame!;
  };

  it("always wins with the call that beats theirs, and never spins", () => {
    // Quick slant beats the Cover 0 blitz.
    for (let i = 0; i < 50; i++) {
      const r = play("slant", 0, `strong-${i}`, 40);
      expect(r.matchup).toBe("strong");
      expect(r.won).toBe(true);
      expect(r.wheel).toBeUndefined();
    }
  });

  it("spins the wheel otherwise, and the spin decides it", () => {
    for (let i = 0; i < 50; i++) {
      const r = play("draw", 0, `weak-${i}`);
      expect(r.matchup).toBe("weak");
      expect(r.won).toBe(r.wheel!.roll < r.wheel!.odds);
    }
  });

  it("gives talent a bigger wedge", () => {
    expect(wheelOdds("weak", wheelParts("weak", 92, false, false))).toBeGreaterThan(wheelOdds("weak", wheelParts("weak", 70, false, false)));
    expect(wheelOdds("even", wheelParts("even", 99, false, true))).toBeLessThanOrEqual(0.8);
    expect(wheelOdds("weak", wheelParts("weak", 40, true, false))).toBeGreaterThan(0);
  });
});
