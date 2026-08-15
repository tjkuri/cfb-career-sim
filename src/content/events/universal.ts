import type { GameEvent } from "../../engine/types";

export const UNIVERSAL_EVENTS: GameEvent[] = [
  {
    id: "gym-grind",
    kind: "random",
    phase: "offseason",
    weight: 4,
    title: "New Workout Regimen",
    description: "Your trainer wants you putting in extra hours. Risky, but it could pay off.",
    options: [
      {
        id: "grind",
        label: "Put in the extra hours",
        probability: 0.72,
        positiveOutcome: {
          description: "You come back noticeably stronger.",
          effects: [{ kind: "overall", timing: "immediate", amount: 3 }],
        },
        negativeOutcome: {
          description: "You tweak a hamstring pushing too hard.",
          effects: [{ kind: "injury", injuryType: "hamstring" }],
        },
      },
      {
        id: "rest",
        label: "Play it safe and rest",
        probability: 1,
        positiveOutcome: { description: "You stay fresh, no change.", effects: [] },
      },
    ],
  },
  {
    id: "the-knee",
    kind: "random",
    phase: "conference",
    weight: 2,
    conditions: { requiresPlaying: true },
    title: "Somebody Rolls Up On You",
    description: "Nobody hits you. A teammate just falls the wrong way across the back of your leg, and the whole sideline hears it.",
    options: [
      {
        id: "walk-it-off",
        label: "Get up and finish the drive",
        probability: 0.55,
        positiveOutcome: {
          description: "It holds. You finish the game and ice it for a week.",
          effects: [{ kind: "moment", item: "Finished the game on one good leg", icon: "medical" }],
        },
        negativeOutcome: {
          description: "It does not hold. The trainer meets you at the numbers and you do not put weight on it again until January.",
          effects: [{ kind: "injury", injuryType: "mcl" }],
        },
      },
      {
        id: "cart",
        label: "Wave for the trainer",
        probability: 0.6,
        positiveOutcome: {
          description: "Sprain, not a tear. They shut you down early and you keep the rest of the season.",
          effects: [{ kind: "injury", injuryType: "ankle" }],
        },
        negativeOutcome: {
          description: "The scan finds more than the sideline test did.",
          effects: [{ kind: "injury", injuryType: "mcl" }],
        },
      },
    ],
  },
];
