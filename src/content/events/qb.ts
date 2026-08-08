import type { GameEvent } from "../../engine/types";

export const QB_EVENTS: GameEvent[] = [
  {
    id: "film-study",
    kind: "random",
    phase: "nonconf",
    weight: 3,
    conditions: { position: ["QB"] },
    title: "Extra Film Study",
    description: "The QB room is open late. Grind the tape?",
    options: [
      {
        id: "study",
        label: "Study the tape",
        probability: 0.9,
        positiveOutcome: {
          description: "The game slows down for you.",
          effects: [
            { kind: "overall", timing: "permanent", amount: 1 },
            { kind: "stat", stat: "passYards", amount: 120 },
          ],
        },
        negativeOutcome: { description: "You're gassed for practice.", effects: [{ kind: "overall", timing: "deferred", amount: -1, delayPhases: 1 } ] },
      },
    ],
  },
  {
    id: "signature-win",
    kind: "random",
    phase: "postseason",
    weight: 3,
    conditions: { position: ["QB"] },
    title: "Bowl Spotlight",
    description: "National TV, prime time. Do you rise to it?",
    options: [
      {
        id: "ball-out",
        label: "Leave it all on the field",
        probability: 0.6,
        positiveOutcome: {
          description: "You put on a show and win MVP buzz.",
          effects: [
            { kind: "stat", stat: "passYards", amount: 320 },
            { kind: "stat", stat: "passTds", amount: 3 },
            { kind: "overall", timing: "permanent", amount: 2 },
          ],
        },
        negativeOutcome: {
          description: "Nerves. Two picks and a rough night.",
          effects: [{ kind: "stat", stat: "ints", amount: 2 }, { kind: "overall", timing: "immediate", amount: -1 }],
        },
      },
    ],
  },
];
