import type { GameEvent } from "../../engine/types";

// The season's scripted beats. Season openers, fall camp and bowl week used
// to fire every season and made one year read like the last; the season's
// climax is now the big game (content/big-game.ts). What is left: the rivalry
// card, drawn at most once a career, and Senior Day, which only happens once.
export const MILESTONE_EVENTS: GameEvent[] = [
  {
    id: "milestone-rivalry",
    kind: "random",
    phase: "conference",
    weight: 3,
    conditions: { requiresPlaying: true },
    title: "Rivalry Week",
    description: "Nobody on campus has talked about anything else since Sunday. Your ankle has been barking since Tuesday.",
    options: [
      {
        id: "play-through",
        label: "Play through it",
        probability: 0.6,
        positiveOutcome: {
          description: "You go the whole way and they storm the field.",
          effects: [
            { kind: "overall", timing: "immediate", amount: 2 },
            { kind: "moment", item: "Won the rivalry game", icon: "trophy" },
          ],
        },
        negativeOutcome: {
          description: "The ankle goes on the second series and you watch the rest in a boot.",
          effects: [{ kind: "injury", injuryType: "ankle" }],
        },
      },
      {
        id: "sit",
        label: "Sit and get right",
        probability: 1,
        positiveOutcome: {
          description: "You are healthy for November. It does not feel like enough on Saturday.",
          effects: [{ kind: "character", amount: -2 }],
        },
      },
    ],
  },
  {
    id: "milestone-senior-day",
    kind: "fixed",
    phase: "conference",
    weight: 1,
    conditions: { requiresPlaying: true, requiresFinalSeason: true },
    title: "Senior Day",
    description: "They call your name and you walk out to midfield. Last time you run out of this tunnel.",
    options: [
      {
        id: "walk",
        label: "Soak it in",
        probability: 0.8,
        positiveOutcome: {
          description: "You hug everyone twice and play the cleanest game of your life.",
          effects: [
            { kind: "overall", timing: "immediate", amount: 2 },
            { kind: "moment", item: "Went out a winner on Senior Day", icon: "star" },
          ],
        },
        negativeOutcome: {
          description: "You are crying before kickoff and never find the game.",
          effects: [{ kind: "moment", item: "Senior Day did not go to script", icon: "star" }],
        },
      },
    ],
  },
];
