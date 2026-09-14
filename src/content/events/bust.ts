import type { GameEvent } from "../../engine/types";

// Career-ending events. All `random`, so weight is the rarity knob and a
// vulnerable player is exposed sometimes, not every season. Every gate is a
// real vulnerability, so the ending is telegraphed and earned rather than a
// bolt from the blue. Every event offers at least one survival path that
// crosses its own gate; low-effort survivals may deliberately leave the
// player under it, because those are the lethal options. A survival grant
// must act on the axis its event is gated on.
// Weights and probabilities are initial values, tuned in Stage 4.
export const BUST_EVENTS: GameEvent[] = [
  {
    id: "bust-mri",
    kind: "random",
    phase: "offseason",
    weight: 3,
    conditions: { requiresActiveInjury: true },
    title: "The MRI Comes Back",
    description: "The team doctor closes the door before he starts talking. That is never the good version.",
    options: [
      {
        id: "rehab",
        label: "Attack the rehab",
        probability: 0.7,
        positiveOutcome: {
          description: "Eight months of misery, and you run again.",
          effects: [
            { kind: "overall", timing: "immediate", amount: -2 },
            { kind: "moment", item: "Rehabbed all the way back", icon: "medical" },
          ],
        },
        negativeOutcome: {
          description: "The knee never comes back. Neither do you.",
          effects: [{ kind: "ending", reason: "Career-ending injury" }],
        },
      },
      {
        id: "play-through",
        label: "Tape it up and play",
        probability: 0.4,
        positiveOutcome: {
          description: "You get away with it. Mostly.",
          effects: [{ kind: "overall", timing: "immediate", amount: -4 }],
        },
        negativeOutcome: {
          description: "It goes on the first cut of camp, and it goes for good.",
          effects: [{ kind: "ending", reason: "Career-ending injury" }],
        },
      },
    ],
  },
  {
    id: "bust-academics",
    kind: "random",
    phase: "offseason",
    weight: 3,
    conditions: { maxCharacter: 35, minClass: "SO" },
    title: "Academic Probation",
    description: "The registrar's letter says you are one failed class from ineligible. It is not a long letter.",
    options: [
      {
        id: "tutors",
        label: "Move into the tutoring center",
        probability: 0.78,
        positiveOutcome: {
          description: "You claw the GPA back and the hold comes off your registration.",
          effects: [
            { kind: "character", amount: 12 },
            { kind: "moment", item: "Fought off academic probation", icon: "book" },
          ],
        },
        negativeOutcome: {
          description: "Ruled ineligible. Your name comes off the roster in a Tuesday email.",
          effects: [{ kind: "ending", reason: "Academically ineligible" }],
        },
      },
      {
        id: "coast",
        label: "Ride it out — the professor likes football",
        probability: 0.5,
        positiveOutcome: {
          description: "He curves the final. You exhale for a week.",
          effects: [{ kind: "character", amount: 2 }],
        },
        negativeOutcome: {
          description: "He does not curve the final.",
          effects: [{ kind: "ending", reason: "Academically ineligible" }],
        },
      },
    ],
  },
  {
    id: "bust-drug-test",
    kind: "random",
    phase: "conference",
    weight: 2,
    conditions: { maxCharacter: 30 },
    title: "Failed Drug Test",
    description: "Compliance wants a word. They have a folder, and your name is on the tab.",
    options: [
      {
        id: "own-it",
        label: "Own it and enter the program",
        probability: 0.8,
        positiveOutcome: {
          description: "Suspended two games, but the staff respects how you handled it.",
          effects: [
            { kind: "suspension", phases: 2 },
            { kind: "character", amount: 10 },
            { kind: "moment", item: "Owned a failed test and came back clean", icon: "shield" },
          ],
        },
        negativeOutcome: {
          description: "The second sample comes back the same way. That is the rule about second samples.",
          effects: [{ kind: "ending", reason: "Removed from the program" }],
        },
      },
      {
        id: "fight-it",
        label: "Fight the result",
        probability: 0.35,
        positiveOutcome: {
          description: "The lab's chain of custody was a mess. It goes away.",
          effects: [{ kind: "character", amount: 4 }],
        },
        negativeOutcome: {
          description: "The appeal makes it a story, and the story makes it a decision.",
          effects: [{ kind: "ending", reason: "Removed from the program" }],
        },
      },
    ],
  },
  {
    id: "bust-arrest",
    kind: "random",
    phase: "conference",
    weight: 2,
    conditions: { maxCharacter: 20 },
    title: "Booked at 3 A.M.",
    description: "A parking lot, a bad decision, and a police report with your jersey number in it.",
    options: [
      {
        id: "lawyer-up",
        label: "Get a lawyer and say nothing",
        probability: 0.6,
        positiveOutcome: {
          description: "Charges dropped. The staff is not thrilled, but you are still on the roster.",
          effects: [
            { kind: "suspension", phases: 2 },
            { kind: "character", amount: 8 },
          ],
        },
        negativeOutcome: {
          description: "The athletic director does not wait for the courts.",
          effects: [{ kind: "ending", reason: "Dismissed from the team" }],
        },
      },
      {
        id: "no-comment",
        label: "Post about it before your agent wakes up",
        probability: 0.2,
        positiveOutcome: {
          description: "Somehow the internet decides you are the sympathetic one.",
          effects: [{ kind: "character", amount: 6 }],
        },
        negativeOutcome: {
          description: "The screenshot outlives the charge. You are done here.",
          effects: [{ kind: "ending", reason: "Dismissed from the team" }],
        },
      },
    ],
  },
  {
    id: "bust-doghouse",
    kind: "random",
    phase: "nonconf",
    weight: 2,
    conditions: { maxCharacter: 25, requiresPlaying: true },
    title: "The Doghouse",
    description: "You have been running with the twos for three weeks and nobody will tell you why.",
    options: [
      {
        id: "ask",
        label: "Ask the coordinator what it takes",
        probability: 0.75,
        positiveOutcome: {
          description: "He tells you, plainly, and you do it. The reps come back.",
          effects: [
            { kind: "character", amount: 10 },
            { kind: "snaps", amount: 60 },
          ],
        },
        negativeOutcome: {
          description: "He tells you plainly, and you argue. That was the last conversation.",
          effects: [{ kind: "ending", reason: "Ran out of rope with the staff" }],
        },
      },
      {
        id: "sulk",
        label: "Say nothing and wait it out",
        probability: 0.45,
        positiveOutcome: {
          description: "Injuries ahead of you settle it. Not how you wanted it.",
          effects: [{ kind: "snaps", amount: 30 }],
        },
        negativeOutcome: {
          description: "The staff stops planning around you entirely.",
          effects: [{ kind: "ending", reason: "Ran out of rope with the staff" }],
        },
      },
    ],
  },
  {
    id: "bust-lost-love",
    kind: "random",
    phase: "offseason",
    weight: 2,
    conditions: { maxOverall: 55, minClass: "JR" },
    title: "6 A.M. Lifts",
    description: "The alarm goes off and for the first time you genuinely consider not going.",
    options: [
      {
        id: "keep-going",
        label: "Get up. Go.",
        probability: 0.8,
        positiveOutcome: {
          description: "It is not fun again yet, but it is yours again.",
          effects: [
            { kind: "overall", timing: "immediate", amount: 3 },
            { kind: "character", amount: 5 },
          ],
        },
        negativeOutcome: {
          description: "You go, and you realize on the drive home that you are finished.",
          effects: [{ kind: "ending", reason: "Walked away from the game" }],
        },
      },
      {
        id: "sleep-in",
        label: "Roll over",
        probability: 0.35,
        positiveOutcome: {
          description: "One missed lift. You are back Thursday.",
          effects: [{ kind: "overall", timing: "immediate", amount: -1 }],
        },
        negativeOutcome: {
          description: "One becomes five. You clean out your locker in June.",
          effects: [{ kind: "ending", reason: "Walked away from the game" }],
        },
      },
    ],
  },
];
