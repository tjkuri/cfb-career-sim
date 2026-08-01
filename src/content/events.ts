import type { GameEvent } from "../engine/types";

// Phase 1 slice: a recruiting fixed event, a handful of random on-field and
// off-field events, an injury gamble, and a fixed declare-for-draft milestone.
// The declare event is injected by the engine at the offseason hub (Task 11),
// so it is NOT listed here; these are the pooled + recruiting events.
export const EVENTS: GameEvent[] = [
  {
    id: "recruiting",
    kind: "fixed",
    phase: "offseason",
    weight: 1,
    title: "Signing Day",
    description: "The offers are in. Where do you commit?",
    // Options are generated dynamically by the engine from eligibleTiers (Task 10);
    // this single placeholder option keeps the event schema-valid. The engine
    // overrides recruiting options at runtime.
    options: [
      { id: "commit", label: "Commit", probability: 1, positiveOutcome: { description: "Committed.", effects: [] } },
    ],
  },
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
