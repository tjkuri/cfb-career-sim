import type { GameEvent } from "../../engine/types";

// Trait-gated content. A mechanical trait that is only a rate shift is
// undiscoverable: a player samples 10-50 careers, and effects shipped last
// stage needed n=3000 to detect. These are the content signature -- noticeable
// in one career, testable on the next.
//
// EV is matched to the pool a player at one of these schools actually draws
// alongside them: the ordinary ungated shared + position pool for the phase.
// Measured (see task-8-report.md): nonconf's qualifying pool weights to
// overall +0.326 / character -1.298; conference's to overall +0.117 /
// character -0.507. (A trait gate is weaker than the maxCharacter subsets
// that caught us out last stage, but the measurement still runs -- that is
// the lesson.)
//
// wideopen-two-deep's negative branch does NOT carry an injury effect, even
// though the brief that spawned this file specified one. wideOpen players
// already carry an ambient per-phase injury roll (school-effects.ts); a
// second injury source stacked only on that population pushed bustedRate to
// 0.0280 against a 0.005-0.03 band -- about 0.002 from the ceiling. The fix
// is content, not the calibrated ambient roll: the fatigue cost is paid in
// character instead.
export const SCHOOL_LIFE_EVENTS: GameEvent[] = [
  {
    id: "wideopen-next-man-up",
    kind: "random",
    phase: "conference",
    weight: 3,
    // requiresPlaying: true, per the house convention (milestones.ts:6) — a
    // redshirt is sitting the season, so "the guy in front of you goes down
    // and there is nobody behind him" and the +2 overall for playing through
    // it cannot fire for reps a sitting player never took.
    conditions: { schoolTrait: ["wideOpen"], requiresPlaying: true },
    title: "Next Man Up",
    description: "The guy in front of you goes down in warmups and there is nobody behind him. The position coach does not so much tell you as look at you.",
    options: [
      {
        id: "play-every-snap",
        label: "Take every snap and do not come off",
        probability: 0.6,
        positiveOutcome: {
          description: "You play the whole game on legs that stopped answering in the third quarter, and the tape is the best thing you have put on film.",
          effects: [
            { kind: "overall", timing: "immediate", amount: 2 },
            { kind: "moment", item: "Played every snap with nobody behind you", icon: "shield" },
          ],
        },
        negativeOutcome: {
          description: "By the fourth quarter you are running on nothing, and the tape shows it as clearly as everyone in the stadium saw it.",
          effects: [
            { kind: "overall", timing: "immediate", amount: -2 },
          ],
        },
      },
      {
        id: "ask-for-a-series",
        label: "Ask for a series off to get your legs back",
        probability: 1,
        positiveOutcome: {
          description: "You come off for one series, get your wind, and finish the game upright.",
          effects: [],
        },
      },
    ],
  },
  {
    id: "wideopen-two-deep",
    kind: "random",
    phase: "nonconf",
    weight: 3,
    // requiresPlaying: true, per the house convention (milestones.ts:6) — "the
    // depth chart goes up Monday" only means something to a player who is on
    // it that week; a sitting redshirt cannot take reps he isn't taking.
    conditions: { schoolTrait: ["wideOpen"], requiresPlaying: true },
    title: "The Two-Deep",
    description: "The depth chart goes up Monday. Your name is on it, and under your name there is a walk-on and a blank line.",
    options: [
      {
        id: "embrace-the-reps",
        label: "Take every rep you can get",
        probability: 0.65,
        positiveOutcome: {
          description: "Nobody is taking reps off you because there is nobody to take them. You get a season of work most players your age never see.",
          effects: [{ kind: "overall", timing: "immediate", amount: 2 }],
        },
        negativeOutcome: {
          // No injury effect here on purpose -- wideOpen already carries an
          // ambient injury roll every phase (school-effects.ts). Stacking a
          // second injury source on the same gated population is what pushed
          // bustedRate toward its ceiling; the fatigue cost is paid in
          // character instead, not in a second injury.
          description: "You get every rep, including the ones a healthier roster would have spared you, and by October you are running on fumes. The tape shows a guy who stopped playing clean, and the room notices.",
          effects: [{ kind: "character", amount: -12 }],
        },
      },
      {
        id: "bring-the-walkon-along",
        label: "Spend your reps teaching the walk-on behind you",
        probability: 0.7,
        positiveOutcome: {
          description: "By October he can spell you for a series without the staff flinching, and the room notices who built him.",
          effects: [
            { kind: "character", amount: 13 },
            { kind: "moment", item: "Built a backup out of a walk-on", icon: "star" },
          ],
        },
        negativeOutcome: {
          description: "He is not ready and the reps you gave him were reps off your own tape, and the staff is not shy about saying so.",
          effects: [
            { kind: "overall", timing: "immediate", amount: -2 },
            { kind: "character", amount: -6 },
          ],
        },
      },
    ],
  },
];
