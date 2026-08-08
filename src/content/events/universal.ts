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
          effects: [{ kind: "overall", timing: "permanent", amount: 3 }],
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
    id: "catfished",
    kind: "random",
    phase: "conference",
    weight: 2,
    title: "You Got Catfished",
    description: "That 'booster's daughter' in your DMs was a rival fan running a bit. It's all over social media.",
    options: [
      {
        id: "laugh",
        label: "Laugh it off publicly",
        probability: 0.8,
        positiveOutcome: {
          description: "Fans love the good sport. Character intact.",
          effects: [{ kind: "moment", item: "Got catfished, handled it like a champ", icon: "phone" }, { kind: "character", amount: 2 }],
        },
        negativeOutcome: {
          description: "Your clapback makes it worse.",
          effects: [{ kind: "character", amount: -6 }, { kind: "moment", item: "Catfishing meltdown went viral", icon: "phone" }],
        },
      },
      {
        id: "ignore",
        label: "Go dark and ignore it",
        probability: 1,
        positiveOutcome: { description: "It blows over in a week.", effects: [{ kind: "moment", item: "Weathered a catfishing saga", icon: "phone" }] },
      },
    ],
  },
  {
    id: "speeding-georgia",
    kind: "random",
    phase: "conference",
    weight: 2,
    title: "Speeding Ticket in Georgia",
    description: "Blue lights on a two-lane road outside Athens. You were doing 96.",
    options: [
      {
        id: "cooperate",
        label: "Yes sir, no sir",
        probability: 0.85,
        positiveOutcome: { description: "A warning and a story.", effects: [{ kind: "moment", item: "Talked his way out of a speeding ticket", icon: "car" }] },
        negativeOutcome: { description: "Coach finds out. One-game suspension.", effects: [{ kind: "suspension", phases: 1 }, { kind: "character", amount: -4 }] },
      },
    ],
  },
];
