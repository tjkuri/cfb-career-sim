import type { GameEvent } from "../../engine/types";

// Defensive-skill events (LB/DB). Authored in Stage 3d.
export const DSKILL_EVENTS: GameEvent[] = [
  {
    id: "coverage-install",
    kind: "random",
    phase: "offseason",
    weight: 3,
    conditions: { position: ["DSKILL"] },
    title: "Coverage Install",
    description:
      "The new defensive coordinator's install is three inches thick, and none of the checks match what you learned last spring.",
    options: [
      {
        id: "memorize-the-whole-manual",
        label: "Memorize the whole manual",
        probability: 0.6,
        positiveOutcome: {
          description:
            "You've got every check cold before the second install meeting, and the DC starts calling on you to walk the room through it.",
          effects: [{ kind: "overall", timing: "immediate", amount: 2 }],
        },
        negativeOutcome: {
          description:
            "Half the verbiage still isn't automatic once fall camp starts, and it costs you a beat on every snap.",
          effects: [{ kind: "overall", timing: "deferred", amount: -1, delayPhases: 1 }],
        },
      },
      {
        id: "lean-on-the-vets",
        label: "Lean on the veterans to decode it",
        probability: 1,
        positiveOutcome: {
          description:
            "You corner the older linebackers for help translating it. You're not ahead of the install, but you're not behind it either, and the room notices the good questions.",
          effects: [],
        },
      },
    ],
  },
  {
    id: "film-room-rat",
    kind: "random",
    phase: "offseason",
    weight: 3,
    conditions: { position: ["DSKILL"], minClass: "SO" },
    title: "Film Room Rat",
    description:
      "You start showing up to the film room before the position coach does. Most weeks it pays off. Some weeks you're just tired.",
    options: [
      {
        id: "grind-every-morning",
        label: "Grind every morning, no exceptions",
        probability: 0.5,
        positiveOutcome: {
          description:
            "The extra reps compound — you're diagnosing plays before the guard even twitches.",
          effects: [{ kind: "overall", timing: "immediate", amount: 2 }],
        },
        negativeOutcome: {
          description: "You're in the building so much you're gassed by fall camp, and it shows.",
          effects: [{ kind: "overall", timing: "immediate", amount: -2 }],
        },
      },
      {
        id: "keep-it-reasonable",
        label: "Put in solid extra work, no more",
        probability: 0.7,
        positiveOutcome: {
          description:
            "You add real work without wrecking your legs, and it's enough for the staff to notice.",
          effects: [{ kind: "overall", timing: "immediate", amount: 1 }],
        },
        negativeOutcome: {
          description: "Even reasonable extra reps catch up to you some mornings, and today's one of them.",
          effects: [{ kind: "overall", timing: "immediate", amount: -1 }],
        },
      },
    ],
  },
  {
    id: "gambling-on-the-jump",
    kind: "random",
    phase: "nonconf",
    weight: 3,
    conditions: { position: ["DSKILL"], requiresPlaying: true },
    title: "Gambling on the Jump",
    description:
      "Third-and-six, the receiver breaks in front of you, and you've got half a second to decide: jump the route, or play it honest and stay on top.",
    options: [
      {
        id: "jump-the-route",
        label: "Jump the route",
        probability: 0.5,
        positiveOutcome: {
          description: "You read it clean and take it away before it ever reaches him.",
          effects: [
            { kind: "stat", stat: "ints", amount: 1 },
            { kind: "overall", timing: "immediate", amount: 1 },
            { kind: "moment", item: "Jumped a route for an interception", icon: "hand" },
          ],
        },
        negativeOutcome: {
          description:
            "You guess wrong. He's already past you before your feet reset, and it's a long gain the other way.",
          effects: [{ kind: "overall", timing: "immediate", amount: -1 }],
        },
      },
      {
        id: "stay-on-top-of-it",
        label: "Stay on top of it",
        probability: 1,
        positiveOutcome: {
          description:
            "You don't bite — you carry him vertical, force the checkdown underneath, and close for the tackle.",
          effects: [{ kind: "stat", stat: "tackles", amount: 5 }],
        },
      },
    ],
  },
  {
    id: "the-missed-tackle-reel",
    kind: "random",
    phase: "nonconf",
    weight: 2,
    conditions: { position: ["DSKILL"], requiresPlaying: true },
    title: "The Missed Tackle Reel",
    description:
      "You whiff on an open-field tackle in the red zone Saturday, and Monday the coordinator cuts the clip into the team meeting with your name on it.",
    options: [
      {
        id: "answer-it",
        label: "Answer it on the practice field",
        probability: 0.6,
        positiveOutcome: {
          description:
            "You bounce back with the best tackling day of your season, and the reel gets replaced fast.",
          effects: [
            { kind: "stat", stat: "tackles", amount: 13 },
            { kind: "overall", timing: "immediate", amount: 1 },
          ],
        },
        negativeOutcome: {
          description: "It sits with you, and the whiffs don't stop — you're tentative in coverage all week.",
          effects: [
            { kind: "overall", timing: "immediate", amount: -1 },
            { kind: "character", amount: -1 },
          ],
        },
      },
      {
        id: "laugh-it-off",
        label: "Laugh at yourself in front of the room",
        probability: 0.6,
        positiveOutcome: {
          description: "The room laughs with you, and by Wednesday the clip is a running joke instead of a verdict.",
          effects: [{ kind: "character", amount: 2 }],
        },
        negativeOutcome: {
          description: "The coordinator does not laugh, and pauses the clip until you stop.",
          effects: [{ kind: "character", amount: -2 }],
        },
      },
    ],
  },
  {
    id: "special-teams-gunner",
    kind: "random",
    phase: "nonconf",
    weight: 3,
    conditions: { position: ["DSKILL"], requiresPlaying: true },
    title: "Special Teams Gunner",
    description:
      "Special teams is short a body, and now you're the gunner sprinting downfield into a wall of blockers on every punt.",
    options: [
      {
        id: "sprint-the-lane",
        label: "Sprint the lane and beat the wall",
        probability: 0.6,
        positiveOutcome: {
          description: "You beat the double-team release and drop the returner before he sets his feet.",
          effects: [
            { kind: "stat", stat: "tackles", amount: 6 },
            { kind: "overall", timing: "immediate", amount: 2 },
          ],
        },
        negativeOutcome: {
          description: "Two blockers converge on you in the tunnel and you land wrong on an ankle underneath the pile.",
          effects: [
            { kind: "injury", injuryType: "ankle" },
            { kind: "overall", timing: "immediate", amount: -1 },
          ],
        },
      },
      {
        id: "play-it-safe-off-the-line",
        label: "Take the safer angle off the line",
        probability: 1,
        positiveOutcome: {
          description: "You take a cleaner angle and still make the tackle, just without threading the wall.",
          effects: [{ kind: "stat", stat: "tackles", amount: 3 }],
        },
      },
    ],
  },
  {
    id: "travel-with-the-no-1",
    kind: "random",
    phase: "conference",
    weight: 3,
    conditions: { position: ["DSKILL"], minClass: "JR", requiresPlaying: true },
    title: "Travel With the No. 1",
    description:
      "The coordinator puts you on an island with their best receiver for four quarters — every route, every formation, wherever he lines up.",
    options: [
      {
        id: "lock-him-down",
        label: "Lock him down man-to-man",
        probability: 0.55,
        positiveOutcome: {
          description:
            "You erase him vertically all afternoon, so they keep checking it down in front of you — and you're there to make the tackle every time.",
          effects: [
            { kind: "stat", stat: "tackles", amount: 13 },
            { kind: "overall", timing: "immediate", amount: 2 },
          ],
        },
        negativeOutcome: {
          description: "He finally gets over the top of you late, and it's the one route all game he wins.",
          effects: [
            { kind: "overall", timing: "immediate", amount: -1 },
            // Shadowing the No. 1 all game means fewer balls near you to make plays on.
            { kind: "stat", stat: "tackles", amount: -4 },
          ],
        },
      },
      {
        id: "play-with-safety-help",
        label: "Take the help over the top",
        probability: 1,
        positiveOutcome: {
          description: "You play it conservative with safety help — a quieter day, but a clean one.",
          effects: [
            { kind: "stat", stat: "tackles", amount: 4 },
          ],
        },
      },
    ],
  },
  {
    id: "the-pick-six",
    kind: "random",
    phase: "conference",
    weight: 3,
    conditions: { position: ["DSKILL"], requiresPlaying: true },
    title: "The Pick-Six",
    description: "The quarterback stares down his read a beat too long, and the ball's in the air right where you're standing.",
    options: [
      {
        id: "take-it-to-the-house",
        label: "Break on it and go",
        probability: 0.5,
        positiveOutcome: {
          description: "You break on it clean and there's nothing but grass between you and the end zone.",
          effects: [
            { kind: "stat", stat: "ints", amount: 1 },
            { kind: "overall", timing: "immediate", amount: 2 },
            { kind: "moment", item: "Returned an interception for a touchdown", icon: "bolt" },
          ],
        },
        negativeOutcome: {
          description:
            "You get a hand on it and it slips through — no pick, no return, just a near-miss the whole stadium groans about.",
          effects: [{ kind: "overall", timing: "immediate", amount: -2 }],
        },
      },
      {
        id: "play-it-underneath",
        label: "Knock it down instead",
        probability: 1,
        positiveOutcome: {
          description: "You knock it away instead of gambling for the pick — no highlight, but the drive's over.",
          effects: [
            { kind: "stat", stat: "passBreakups", amount: 1 },
            { kind: "stat", stat: "tackles", amount: 2 },
          ],
        },
      },
    ],
  },
  {
    id: "targeting-review",
    kind: "random",
    phase: "conference",
    weight: 2,
    conditions: { position: ["DSKILL"], requiresPlaying: true },
    title: "Targeting Review",
    description:
      "You square up a receiver working across the middle and the hit is full speed — full speed enough that the booth stops the game to review it for targeting.",
    options: [
      {
        id: "play-through-the-whistle",
        label: "Trust the hit was clean",
        probability: 0.55,
        positiveOutcome: {
          description: "The review clears you — controlled, legal, and it turns the whole sideline's heads.",
          effects: [
            { kind: "stat", stat: "tackles", amount: 2 },
            { kind: "overall", timing: "immediate", amount: 2 },
            { kind: "moment", item: "Delivered a hit that survived a targeting review", icon: "shield" },
          ],
        },
        negativeOutcome: {
          description:
            "The booth confirms it. You're gone for the rest of the game, the defense plays down a body, and the coordinator has a few words for you about it after.",
          effects: [
            { kind: "overall", timing: "immediate", amount: -2 },
            { kind: "character", amount: -2 },
            { kind: "snaps", amount: -8 },
          ],
        },
      },
      {
        id: "pull-up-at-the-last-second",
        label: "Pull up at the last second",
        probability: 1,
        positiveOutcome: {
          description: "You take something off it at the last half-second — no flag, no review, just a clean form tackle.",
          effects: [
            { kind: "stat", stat: "tackles", amount: 3 },
            { kind: "character", amount: 1 },
          ],
        },
      },
    ],
  },
  {
    id: "the-bowl-interception",
    kind: "random",
    phase: "postseason",
    weight: 3,
    conditions: { position: ["DSKILL"], tier: [1, 2], requiresPlaying: true },
    title: "The Bowl Interception",
    description:
      "Bowl-week practice bleeds into the game itself, and midway through the third quarter you're staring down a wideout you've studied on tape for three weeks.",
    options: [
      {
        id: "trust-the-film",
        label: "Trust the film and jump it",
        probability: 0.6,
        positiveOutcome: {
          description:
            "You jump the exact route you circled on the whiteboard and come down with it in front of a national audience.",
          effects: [
            { kind: "stat", stat: "ints", amount: 1 },
            { kind: "overall", timing: "immediate", amount: 2 },
            { kind: "moment", item: "Picked off a pass in a bowl game", icon: "trophy" },
          ],
        },
        negativeOutcome: {
          description: "You jump it a beat early and he adjusts — incompletion, but the safety chews you out for freelancing.",
          effects: [{ kind: "overall", timing: "immediate", amount: -1 }],
        },
      },
      {
        id: "play-your-zone",
        label: "Stay disciplined in your zone",
        probability: 1,
        positiveOutcome: {
          description: "You stay disciplined in your drop, and the tape rewards it with tackles instead of turnovers.",
          effects: [{ kind: "stat", stat: "tackles", amount: 5 }],
        },
      },
    ],
  },
  {
    id: "all-star-practice-week",
    kind: "random",
    phase: "postseason",
    weight: 3,
    conditions: { position: ["DSKILL"], requiresPlaying: true, minClass: "JR", minOverall: 70 },
    title: "All-Star Practice Week",
    description:
      "Bowl-week all-star practices put a stopwatch and a dozen scouts on every rep of one-on-ones, and the receiver across from you is somebody's first-round pick.",
    options: [
      {
        id: "go-after-it",
        label: "Go after him on every rep",
        probability: 0.5,
        positiveOutcome: {
          description: "You win the rep clean twice in a row, and the scouts start writing your name down instead of his.",
          effects: [
            { kind: "overall", timing: "immediate", amount: 2 },
            { kind: "stat", stat: "passBreakups", amount: 1 },
            { kind: "moment", item: "Won one-on-ones in front of NFL scouts", icon: "eye" },
          ],
        },
        negativeOutcome: {
          description: "He wins the rep both times, and the notebook fills up with somebody else's name.",
          effects: [{ kind: "overall", timing: "immediate", amount: -2 }],
        },
      },
      {
        id: "keep-it-fundamentally-sound",
        label: "Play it technically sound",
        probability: 1,
        positiveOutcome: {
          description: "You play clean instead of chasing highlights, and the position coach tells the scouts you're the safe bet.",
          effects: [
            { kind: "stat", stat: "tackles", amount: 3 },
            { kind: "character", amount: 1 },
          ],
        },
      },
    ],
  },
  {
    id: "dskill-safety-or-corner",
    kind: "random",
    phase: "offseason",
    weight: 3,
    conditions: { position: ["DSKILL"], minClass: "SO" },
    title: "Safety or Corner",
    description: "The staff thinks you see the field like a safety. You have played corner since you were nine.",
    options: [
      {
        id: "move-to-safety",
        label: "Move to safety",
        probability: 0.55,
        positiveOutcome: {
          description: "From the middle of the field you see everything first. You are the one calling the coverage by August.",
          effects: [{ kind: "overall", timing: "immediate", amount: 3 }, { kind: "moment", item: "Moved to safety and ran the defense", icon: "eye" }],
        },
        negativeOutcome: {
          description: "Too much field, too many reads. You are a step late to everything in camp.",
          effects: [{ kind: "overall", timing: "immediate", amount: -2 }],
        },
      },
      {
        id: "stay-at-corner",
        label: "Stay at corner",
        probability: 1,
        positiveOutcome: {
          description: "You stay on an island where you are comfortable, and the staff respects the answer.",
          effects: [{ kind: "character", amount: 1 }],
        },
      },
    ],
  },
  {
    id: "dskill-ballhawk-camp",
    kind: "random",
    phase: "offseason",
    weight: 3,
    conditions: { position: ["DSKILL"] },
    title: "Ballhawk Camp",
    description: "A former All-Pro defensive back runs a summer camp across the country. It overlaps with voluntary workouts, which are not voluntary.",
    options: [
      {
        id: "skip-for-camp",
        label: "Skip workouts and go to the camp",
        probability: 0.6,
        positiveOutcome: {
          description: "You come back with the eyes of a ten-year veteran, and nobody can argue with what you do in camp.",
          effects: [{ kind: "overall", timing: "immediate", amount: 2 }, { kind: "character", amount: -2 }],
        },
        negativeOutcome: {
          description: "The camp is mostly a highlight video for the instructor, and the staff noticed you were gone.",
          effects: [{ kind: "overall", timing: "immediate", amount: -1 }, { kind: "character", amount: -2 }],
        },
      },
      {
        id: "stay-for-workouts",
        label: "Stay for team workouts",
        probability: 1,
        positiveOutcome: {
          description: "You run every conditioning test with the guys who will be on the field with you.",
          effects: [{ kind: "character", amount: 2 }],
        },
      },
    ],
  },
];
