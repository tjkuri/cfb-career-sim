import type { GameEvent } from "../../engine/types";

// Fixed milestone beats. Every matching fixed event fires each phase before the
// random draw, so this slice is capped at one per phase — Senior Day is the
// deliberate exception, and only in the final season. All are gated on
// requiresPlaying so they never fire at a player sitting out a redshirt.
export const MILESTONE_EVENTS: GameEvent[] = [
  {
    id: "milestone-fall-camp",
    kind: "fixed",
    phase: "offseason",
    weight: 1,
    conditions: { requiresPlaying: true, minClass: "SO" },
    title: "Fall Camp Battle",
    description: "The depth chart goes up Monday. Right now your name is written in pencil.",
    options: [
      {
        id: "compete",
        label: "Win the job",
        probability: 0.65,
        positiveOutcome: {
          description: "You take every rep like it is the last one and the pencil becomes ink.",
          effects: [
            { kind: "overall", timing: "permanent", amount: 2 },
            { kind: "snaps", amount: 40 },
          ],
        },
        negativeOutcome: {
          description: "You press, and pressing looks exactly like panicking on film.",
          effects: [{ kind: "overall", timing: "immediate", amount: -1 }],
        },
      },
    ],
  },
  {
    id: "milestone-opener",
    kind: "fixed",
    phase: "nonconf",
    weight: 1,
    conditions: { requiresPlaying: true },
    title: "Season Opener",
    description: "Ninety thousand people, a noon kickoff, and a cupcake opponent nobody will forgive you for losing to.",
    options: [
      {
        id: "handle-it",
        label: "Take care of business",
        probability: 0.75,
        positiveOutcome: {
          description: "Comfortable win. You are out by the fourth quarter.",
          effects: [{ kind: "snaps", amount: 25 }],
        },
        negativeOutcome: {
          description: "It is 17-14 in the fourth and the boo birds are warming up.",
          effects: [{ kind: "character", amount: -2 }],
        },
      },
    ],
  },
  {
    id: "milestone-rivalry",
    kind: "fixed",
    phase: "conference",
    weight: 1,
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
            { kind: "overall", timing: "permanent", amount: 2 },
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
            { kind: "overall", timing: "permanent", amount: 2 },
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
  {
    id: "milestone-bowl-season",
    kind: "fixed",
    phase: "postseason",
    weight: 1,
    conditions: { requiresPlaying: true },
    title: "Bowl Season",
    description: "Three weeks off, a gift suitcase, and a game in a city you have never been to.",
    options: [
      {
        id: "prepare",
        label: "Treat it like a playoff game",
        probability: 0.7,
        positiveOutcome: {
          description: "You are the only one who practiced like that, and it shows.",
          effects: [
            { kind: "overall", timing: "permanent", amount: 2 },
            { kind: "moment", item: "Carried the team through bowl season", icon: "trophy" },
          ],
        },
        negativeOutcome: {
          description: "Everyone else treated it like a vacation, and you could not drag them.",
          effects: [{ kind: "character", amount: -2 }],
        },
      },
      {
        id: "enjoy",
        label: "Enjoy the trip",
        probability: 1,
        positiveOutcome: {
          description: "Best three weeks of the year. The game is a blur.",
          effects: [{ kind: "moment", item: "Had the time of his life at a bowl game", icon: "sun" }],
        },
      },
    ],
  },
];
