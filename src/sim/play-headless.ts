import { createCareer, advance, getDecision, type GameState, type Setup } from "../engine/index";
import { createRng } from "../engine/rng";
import { firstOptionPolicy, randomPolicy, type Policy } from "./policies";

export function playCareer(setup: Setup, seed: string, policy: Policy): GameState {
  let s = createCareer(setup, seed);
  // A dedicated policy rng, seeded separately so policy choices don't disturb engine determinism.
  const policyRng = createRng(seed + ":policy");
  let guard = 0;
  while (s.status === "active" && guard++ < 1000) {
    const decision = getDecision(s);
    if (!decision) break;
    const choice = policy(s, decision.options, policyRng);
    s = advance(s, choice);
  }
  return s;
}

// Simple CLI entry: `npm run play -- <seed>`
function main() {
  const seed = process.argv[2] ?? "demo";
  const setup: Setup = { lastName: "Player", jerseyNumber: 7, homeState: "TX", position: "QB" };
  const policy: Policy = process.argv[3] === "random" ? randomPolicy : firstOptionPolicy;
  const s = playCareer(setup, seed, policy);
  const summary = {
    status: s.status,
    endingReason: s.endingReason,
    seasons: s.seasons.length,
    overall: s.overall,
    character: s.character,
    awards: s.awards,
    trophies: s.trophies,
    draft: s.draftResult,
    moments: s.moments.map((m) => m.item),
  };
  console.log(JSON.stringify(summary, null, 2));
}

// Run only when invoked directly.
if (process.argv[1] && process.argv[1].endsWith("play-headless.ts")) main();
