import { describe, it, expect } from "vitest";
import { ALL_POSITIONS } from "../../engine/types";
import { makeSpot, playbook } from "../../engine/big-game";
import { createRng } from "../../engine/rng";
import { PLAYBOOKS } from "../../content/big-game";
import { at, stagePlay } from "./choreo";

// The engine decides the snap; the telestrator only draws it. These check that
// the drawing never contradicts the result, for every position, package,
// call, defense and look, won and lost, from a spread of spots.

const SPOTS = 12;

describe("the telestrator agrees with the result", () => {
  for (const position of ALL_POSITIONS) {
    PLAYBOOKS[position].forEach((book, pkg) => {
      it(`${position} ${book.name}`, () => {
        for (let i = 0; i < SPOTS; i++) {
          const spot = makeSpot(position, createRng(`ch-${position}-${pkg}-${i}`), pkg);
          const G = spot.yardsToGoal;
          for (let mine = 0; mine < 3; mine++)
            for (let theirs = 0; theirs < 3; theirs++)
              for (let look = 0; look < 3; look++)
                for (const won of [true, false]) {
                  const strong = playbook(position, pkg).odds[mine]![theirs]! >= 0.7;
                  const play = stagePlay({ position, pkg, spot, mine, theirs, look, won, strong });
                  const where = `${mine}/${theirs}/${look} ${won ? "won" : "lost"} at ${G}`;
                  const [, by, bz] = play.ball(1);
                  expect(Number.isFinite(by) && Number.isFinite(bz), where).toBe(true);
                  expect(play.movers.filter((m) => m.you).length, `${where}: exactly one YOU`).toBe(1);
                  if (book.side === "kick") continue;
                  // Where the ball ends: in someone's hands, or on the ground (incomplete).
                  const [, ballY, ballZ] = play.ball(1);
                  const loose = ballZ < 1;
                  const scored = (spot.side === "offense") === won;
                  if (scored) {
                    expect(loose, `${where}: a touchdown is not a dropped ball`).toBe(false);
                    expect(ballY, `${where}: a touchdown ends in the end zone`).toBeGreaterThanOrEqual(G);
                  } else if (!loose && spot.side === "offense") {
                    // A failed snap never shows a first down.
                    expect(ballY, `${where}: a failed snap is downed short of the line to gain`).toBeLessThan(spot.toGo);
                  } else if (!loose) {
                    expect(ballY, `${where}: a stop keeps them out of the end zone`).toBeLessThan(G);
                  }
                  void at;
                }
        }
      });
    });
  }
});
