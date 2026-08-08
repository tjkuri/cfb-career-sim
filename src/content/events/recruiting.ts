import type { GameEvent } from "../../engine/types";

export const RECRUITING_EVENTS: GameEvent[] = [
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
];
