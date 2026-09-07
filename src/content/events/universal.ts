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
  // ——— Tier 3-4 only. Every tier gate in the position pile is [1,2], so before
  // these, signing with a blueblood only ever removed content from your pool.
  // These are position-agnostic on purpose: the pressure of playing somewhere
  // that expects titles is not specific to what you line up as, and universal
  // events must avoid position stats (passYards means nothing to a kicker). ———
  {
    id: "blueblood-five-star",
    kind: "random",
    phase: "offseason",
    weight: 2,
    conditions: { tier: [3, 4], minClass: "SO" },
    title: "The Five-Star Behind You",
    description: "The staff signed the top recruit in the country at your spot. He is in your position room on Monday, and he did not come here to wait his turn.",
    options: [
      {
        id: "bring-him-along",
        label: "Teach him the install",
        probability: 0.7,
        positiveOutcome: {
          description: "You bring him along yourself. The room tightens up, and the staff notices exactly who did that.",
          effects: [
            { kind: "character", amount: 2 },
            { kind: "overall", timing: "immediate", amount: 1 },
          ],
        },
        negativeOutcome: {
          description: "He passes you by the spring game, and the staff stops pretending the rotation is open.",
          effects: [{ kind: "overall", timing: "immediate", amount: -2 }],
        },
      },
      {
        id: "give-him-nothing",
        label: "Give him nothing",
        probability: 0.55,
        positiveOutcome: {
          description: "You hold the job on merit and the reps stay yours. Nobody has to like it.",
          effects: [{ kind: "overall", timing: "immediate", amount: 2 }],
        },
        negativeOutcome: {
          description: "It reads as exactly as insecure as it is, and the room quietly picks a side.",
          effects: [
            { kind: "character", amount: -2 },
            { kind: "overall", timing: "immediate", amount: -1 },
          ],
        },
      },
    ],
  },
  {
    id: "blueblood-playoff-or-bust",
    kind: "random",
    phase: "postseason",
    weight: 2,
    conditions: { tier: [3, 4], requiresPlaying: true },
    title: "Playoff or Bust",
    description: "Ten wins is a disappointing season here. The message boards have been counting since September, and the staff can hear them through the walls.",
    options: [
      {
        id: "say-it-on-camera",
        label: "Say the quiet part on camera",
        probability: 0.6,
        positiveOutcome: {
          description: "You tell them the standard is the standard, and then you go play like you meant it.",
          effects: [
            { kind: "overall", timing: "immediate", amount: 1 },
            { kind: "moment", item: "Told the cameras the standard is the standard", icon: "mic" },
          ],
        },
        negativeOutcome: {
          description: "It becomes the clip they run before every game you play from here on.",
          effects: [
            { kind: "character", amount: -2 },
            { kind: "overall", timing: "immediate", amount: -1 },
          ],
        },
      },
      {
        id: "nothing-quotable",
        label: "Give them nothing quotable",
        probability: 0.8,
        positiveOutcome: {
          description: "You bore the press into leaving you alone, and you get back to work.",
          effects: [{ kind: "overall", timing: "immediate", amount: 1 }],
        },
        negativeOutcome: {
          description: "It reads as ducking it. The room wanted somebody to say something, and you were the somebody.",
          effects: [
            { kind: "character", amount: -1 },
            { kind: "overall", timing: "immediate", amount: -1 },
          ],
        },
      },
    ],
  },
  {
    id: "blueblood-scouts-at-practice",
    kind: "random",
    phase: "conference",
    weight: 2,
    conditions: { tier: [3, 4], requiresPlaying: true, minClass: "JR" },
    title: "Scouts on the Sideline",
    description: "Eleven clubs sent somebody to Tuesday's practice. At a place like this they come every week, and they are not here to watch the starters.",
    options: [
      {
        id: "make-them-write-it-down",
        label: "Make them write your name down",
        probability: 0.55,
        positiveOutcome: {
          description: "You put two reps on tape that end up in every report written about this team that spring.",
          effects: [
            { kind: "overall", timing: "immediate", amount: 2 },
            { kind: "moment", item: "Put a practice rep on every scout's report", icon: "clipboard" },
          ],
        },
        negativeOutcome: {
          description: "You press, and the rep they write down is the one you lost.",
          effects: [{ kind: "overall", timing: "immediate", amount: -2 }],
        },
      },
      {
        id: "stack-a-clean-week",
        label: "Ignore them and stack a clean week",
        probability: 0.85,
        positiveOutcome: {
          description: "Nothing flashy and nothing bad. The grade is the grade, and the grade is good.",
          effects: [{ kind: "overall", timing: "immediate", amount: 1 }],
        },
        negativeOutcome: {
          description: "An anonymous week. Nobody writes anything down at all.",
          effects: [{ kind: "character", amount: -1 }],
        },
      },
    ],
  },
];
