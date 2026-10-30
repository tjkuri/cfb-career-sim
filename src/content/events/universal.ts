import type { GameEvent } from "../../engine/types";

export const UNIVERSAL_EVENTS: GameEvent[] = [
  {
    id: "gym-grind",
    kind: "random",
    phase: "offseason",
    weight: 2,
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
          description: "It holds. You finish the game and ice it for a week, and the locker room does not forget it.",
          effects: [
            { kind: "character", amount: 5 },
            { kind: "moment", item: "Finished the game on one good leg", icon: "medical" },
          ],
        },
        negativeOutcome: {
          description: "It does not hold. The trainer meets you at the numbers and you do not put weight on it again until January.",
          effects: [{ kind: "injury", injuryType: "mcl" }],
        },
      },
      {
        id: "cart",
        label: "Wave for the trainer",
        probability: 0.75,
        positiveOutcome: {
          description: "A bruise and a scare, not a tear. They sit you for the rest of the game and you are back next week.",
          effects: [],
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
    conditions: { tier: [2, 3, 4] },
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
            { kind: "character", amount: 5 },
            { kind: "overall", timing: "immediate", amount: 1 },
          ],
        },
        negativeOutcome: {
          description: "He passes you by the spring game, and the staff stops pretending the rotation is open.",
          effects: [{ kind: "overall", timing: "immediate", amount: -4 }],
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
            { kind: "character", amount: -4 },
            { kind: "overall", timing: "immediate", amount: -2 },
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
    description: "The standard here is the playoff, and everything short of it is a bad year. The message boards have been counting since September, and the staff can hear them through the walls.",
    options: [
      {
        id: "say-it-on-camera",
        label: "Say the quiet part on camera",
        probability: 0.6,
        positiveOutcome: {
          description: "You tell them the standard is the standard, and then you go play like you meant it.",
          effects: [
            { kind: "overall", timing: "immediate", amount: 2 },
            { kind: "character", amount: 5 },
            { kind: "moment", item: "Told the cameras the standard is the standard", icon: "mic" },
          ],
        },
        negativeOutcome: {
          description: "It becomes the clip they run before every game you play from here on.",
          effects: [
            { kind: "character", amount: -4 },
            { kind: "overall", timing: "immediate", amount: -2 },
          ],
        },
      },
      {
        id: "nothing-quotable",
        label: "Give them nothing quotable",
        probability: 0.8,
        positiveOutcome: {
          description: "You bore the press into leaving you alone, and you get back to work.",
          effects: [{ kind: "overall", timing: "immediate", amount: 2 }],
        },
        negativeOutcome: {
          description: "It reads as ducking it. The room wanted somebody to say something, and you were the somebody.",
          effects: [
            { kind: "character", amount: -2 },
            { kind: "overall", timing: "immediate", amount: -2 },
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
            { kind: "overall", timing: "immediate", amount: 5 },
            { kind: "moment", item: "Put a practice rep on every scout's report", icon: "clipboard" },
          ],
        },
        negativeOutcome: {
          description: "You press, and the rep they write down is the one you lost.",
          effects: [{ kind: "overall", timing: "immediate", amount: -4 }],
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
          effects: [],
        },
      },
    ],
  },
  // ——— Postseason depth. This phase's shared pool was 4 against offseason's 9
  // and conference's 8, two of those four gated, and it measured the worst
  // repeat rate of any phase (24%). It is also the phase a player remembers —
  // bowls, awards, the end of a season — so repeats read loudest here. ———
  {
    id: "postseason-coaching-carousel",
    kind: "random",
    phase: "postseason",
    weight: 3,
    title: "The Carousel Comes for Your Staff",
    description: "Your head coach takes the job at a bigger place three days into bowl prep. The building empties out in an afternoon, and everyone in your position room is on the phone with somebody.",
    options: [
      {
        id: "hold-the-room",
        label: "Hold the room together",
        probability: 0.65,
        positiveOutcome: {
          description: "You get the guys to finish the season for each other instead of for a staff that already left. The interim notices, and so does everyone above him.",
          effects: [
            { kind: "character", amount: 5 },
            { kind: "overall", timing: "immediate", amount: 1 },
          ],
        },
        negativeOutcome: {
          description: "Half the room is already gone in their heads. You spend bowl week playing captain to nobody.",
          effects: [{ kind: "character", amount: -2 }],
        },
      },
      {
        id: "make-your-calls",
        label: "Get on the phone yourself",
        probability: 0.5,
        positiveOutcome: {
          description: "You find out exactly what you are worth on the open market, and it is more than you thought.",
          effects: [{ kind: "overall", timing: "immediate", amount: 5 }],
        },
        negativeOutcome: {
          description: "Word gets back before the bowl does. You practice bowl week with a staff that has stopped investing in you.",
          effects: [
            { kind: "character", amount: -4 },
            { kind: "overall", timing: "immediate", amount: -2 },
          ],
        },
      },
    ],
  },
  {
    id: "postseason-awards-banquet",
    kind: "random",
    phase: "postseason",
    weight: 3,
    conditions: { requiresPlaying: true },
    title: "The Team Banquet",
    description: "They hand out the team awards in a hotel ballroom with bad chicken. The one you thought was yours goes to somebody else, and the room claps while the camera stays on your table.",
    options: [
      {
        id: "first-to-stand",
        label: "Be the first one on your feet",
        probability: 0.75,
        positiveOutcome: {
          description: "You are up before he is out of his chair. Nobody forgets who did that, least of all him.",
          effects: [
            { kind: "character", amount: 5 },
            { kind: "moment", item: "First up cheering when a teammate took the award", icon: "trophy" },
          ],
        },
        negativeOutcome: {
          description: "You mean it, and it still lands as a guy performing being fine with it.",
          effects: [],
        },
      },
      {
        id: "let-it-show",
        label: "Let it show",
        probability: 0.4,
        positiveOutcome: {
          description: "The staff reads the look on your face as a promise about next season, and they like it.",
          effects: [{ kind: "overall", timing: "immediate", amount: 3 }],
        },
        negativeOutcome: {
          description: "Somebody films you not clapping. It is on the internet before the dessert plates are cleared.",
          effects: [{ kind: "character", amount: -6 }],
        },
      },
    ],
  },
  {
    id: "postseason-bowl-practice-window",
    kind: "random",
    phase: "postseason",
    weight: 3,
    conditions: { requiresPlaying: true },
    title: "Fifteen Extra Practices",
    description: "Bowl prep buys the program three weeks of practice it would not otherwise get. For a lot of players it is the most development they see all year — if they treat it that way.",
    options: [
      {
        id: "treat-it-like-spring",
        label: "Treat it like a second spring ball",
        probability: 0.7,
        positiveOutcome: {
          description: "You come out of bowl prep noticeably further along than you went in.",
          effects: [
            { kind: "overall", timing: "immediate", amount: 1 },
            { kind: "snaps", amount: 25 },
          ],
        },
        negativeOutcome: {
          description: "You are running on an empty tank by December and it shows in the game itself.",
          effects: [{ kind: "overall", timing: "immediate", amount: -2 }],
        },
      },
      {
        id: "get-healthy",
        label: "Use the three weeks to get healthy",
        probability: 0.8,
        positiveOutcome: {
          description: "You show up to the bowl game feeling better than you have since September.",
          effects: [{ kind: "overall", timing: "immediate", amount: 1 }],
        },
        negativeOutcome: {
          description: "You come back rusty, and rusty in December looks a lot like slow.",
          effects: [{ kind: "overall", timing: "immediate", amount: -2 }],
        },
      },
    ],
  },
];
