import type { GameEvent } from "../../engine/types";

export const QB_EVENTS: GameEvent[] = [
  {
    id: "film-study",
    kind: "random",
    phase: "nonconf",
    weight: 3,
    conditions: { position: ["QB"], requiresPlaying: true },
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
            { kind: "overall", timing: "immediate", amount: 1 },
            { kind: "stat", stat: "passYards", amount: 120 },
          ],
        },
        negativeOutcome: { description: "You're gassed for practice.", effects: [{ kind: "overall", timing: "deferred", amount: -1, delayPhases: 1 } ] },
      },
      {
        id: "take-the-receivers-out",
        label: "Take the receivers out for wings instead",
        probability: 0.7,
        positiveOutcome: {
          description: "Chemistry is a real thing. They run every route a little harder for you on Saturday.",
          effects: [{ kind: "character", amount: 2 }, { kind: "stat", stat: "passYards", amount: 80 }],
        },
        negativeOutcome: {
          description: "Wings turn into a long night, and Thursday practice is slow for all five of you.",
          effects: [{ kind: "character", amount: -2 }, { kind: "overall", timing: "deferred", amount: -1, delayPhases: 1 }],
        },
      },
    ],
  },
  {
    id: "signature-win",
    kind: "random",
    phase: "postseason",
    weight: 3,
    conditions: { position: ["QB"], requiresPlaying: true },
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
            { kind: "overall", timing: "immediate", amount: 2 },
          ],
        },
        negativeOutcome: {
          description: "Nerves. Two picks and a rough night.",
          effects: [{ kind: "stat", stat: "ints", amount: 2 }, { kind: "overall", timing: "immediate", amount: -1 }],
        },
      },
      {
        id: "manage-the-game",
        label: "Take what they give you",
        probability: 1,
        positiveOutcome: {
          description: "Short throws, no turnovers, and a win nobody will put on a highlight reel.",
          effects: [{ kind: "stat", stat: "passYards", amount: 180 }, { kind: "stat", stat: "passTds", amount: 1 }],
        },
      },
    ],
  },
  {
    id: "transfer-qb",
    kind: "random",
    phase: "offseason",
    weight: 3,
    conditions: { position: ["QB"] },
    title: "The Transfer QB",
    description: "A decorated grad transfer walks into the quarterback room. Compete for the job, or take him under your wing?",
    options: [
      {
        id: "compete",
        label: "Win the job outright",
        probability: 0.6,
        positiveOutcome: {
          description: "You outwork him through camp and the staff never blinks.",
          effects: [{ kind: "overall", timing: "immediate", amount: 2 }],
        },
        negativeOutcome: {
          description: "He wins the early reps and the whispers start.",
          effects: [{ kind: "overall", timing: "deferred", amount: -2, delayPhases: 1 }],
        },
      },
      {
        id: "mentor",
        label: "Take him under your wing",
        probability: 1,
        positiveOutcome: {
          description: "You share your notes and the room stays tight. No shakeup, no drama.",
          effects: [{ kind: "character", amount: 2 }],
        },
      },
    ],
  },
  {
    id: "new-playbook",
    kind: "random",
    phase: "offseason",
    weight: 3,
    conditions: { position: ["QB"], minClass: "SO" },
    title: "New Playbook",
    description: "A new coordinator rips up the old scheme and installs his terminology from scratch.",
    options: [
      {
        id: "install",
        label: "Commit fully to the new system",
        probability: 0.6,
        positiveOutcome: {
          description: "The verbiage clicks and you're calling protections like a vet.",
          effects: [{ kind: "overall", timing: "immediate", amount: 2 }],
        },
        negativeOutcome: {
          description: "You're still peeking at the wristband deep into fall camp.",
          effects: [{ kind: "overall", timing: "deferred", amount: -2, delayPhases: 1 }],
        },
      },
      {
        id: "lean-on-vets",
        label: "Lean on the vets to cover for you",
        probability: 1,
        positiveOutcome: {
          description: "You get by on muscle memory from the old scheme. Steady, unspectacular.",
          effects: [],
        },
      },
    ],
  },
  {
    id: "audible-authority",
    kind: "random",
    phase: "nonconf",
    weight: 3,
    conditions: { position: ["QB"], requiresPlaying: true },
    title: "Audible Authority",
    description: "The OC hands you full control of the checks at the line. Now it's on you to get the offense in the right play.",
    options: [
      {
        id: "own-it",
        label: "Take command at the line",
        probability: 0.65,
        positiveOutcome: {
          description: "You diagnose the front before the snap and the offense hums all afternoon.",
          effects: [
            { kind: "overall", timing: "immediate", amount: 1 },
            { kind: "stat", stat: "passYards", amount: 150 },
          ],
        },
        negativeOutcome: {
          description: "You get caught in a bad check against a disguised blitz.",
          effects: [
            { kind: "overall", timing: "immediate", amount: -1 },
            { kind: "stat", stat: "ints", amount: 1 },
          ],
        },
      },
      {
        id: "run-whats-called",
        label: "Just run what's signaled",
        probability: 0.8,
        positiveOutcome: {
          description: "You execute the call as drawn and the drive stays on schedule.",
          effects: [{ kind: "stat", stat: "passYards", amount: 70 }],
        },
        negativeOutcome: {
          description: "The look was wrong and nobody had the authority to fix it. Three-and-out.",
          effects: [
            { kind: "stat", stat: "passYards", amount: -30 },
            { kind: "overall", timing: "immediate", amount: -1 },
          ],
        },
      },
    ],
  },
  {
    id: "sideline-camera",
    kind: "random",
    phase: "nonconf",
    weight: 2,
    conditions: { position: ["QB"], requiresPlaying: true },
    title: "Caught on the Sideline Camera",
    description: "The broadcast catches you ripping into a receiver after a drop, in 4K, for a national audience.",
    options: [
      {
        id: "cool-down",
        label: "Pull him aside and reset",
        probability: 0.8,
        positiveOutcome: {
          description: "You calm it down at halftime and he balls out the rest of the game.",
          effects: [
            { kind: "character", amount: 1 },
            { kind: "stat", stat: "passYards", amount: 90 },
          ],
        },
        negativeOutcome: {
          description: "The clip won't stop looping on Twitter all week.",
          effects: [{ kind: "character", amount: -2 }],
        },
      },
      {
        id: "stay-hot",
        label: "Let the edge carry you",
        probability: 0.5,
        positiveOutcome: {
          description: "The fire fuels a big second half.",
          effects: [
            { kind: "overall", timing: "immediate", amount: 1 },
            { kind: "stat", stat: "passYards", amount: 110 },
          ],
        },
        negativeOutcome: {
          description: "It reads as immature, and the staff has a word.",
          effects: [
            { kind: "overall", timing: "immediate", amount: -1 },
            { kind: "character", amount: -2 },
          ],
        },
      },
    ],
  },
  {
    id: "third-and-long",
    kind: "random",
    phase: "conference",
    weight: 3,
    conditions: { position: ["QB"], requiresPlaying: true },
    title: "Third and Long",
    description: "Third and eleven, two minutes left in the half. Sling it downfield, or take the easy checkdown?",
    options: [
      {
        id: "go-deep",
        label: "Push it downfield",
        probability: 0.55,
        positiveOutcome: {
          description: "You drop a dime in the bucket and move the chains in one shot.",
          effects: [
            { kind: "stat", stat: "passYards", amount: 180 },
            { kind: "overall", timing: "immediate", amount: 1 },
          ],
        },
        negativeOutcome: {
          description: "It sails on you and the DB reads it the whole way.",
          effects: [
            { kind: "overall", timing: "immediate", amount: -1 },
            { kind: "stat", stat: "ints", amount: 1 },
            // The drive dies here, and forcing it downfield all night leaves you
            // under your own baseline — the gamble has to be able to cost yards,
            // not merely fail to add them.
            { kind: "stat", stat: "passYards", amount: -60 },
          ],
        },
      },
      {
        id: "check-down",
        label: "Take the easy checkdown",
        probability: 1,
        positiveOutcome: {
          description: "Safe and short. The drive stalls out anyway.",
          effects: [{ kind: "stat", stat: "passYards", amount: 40 }],
        },
      },
    ],
  },
  {
    id: "silent-count",
    kind: "random",
    phase: "conference",
    weight: 3,
    conditions: { position: ["QB"], tier: [1, 2], requiresPlaying: true },
    title: "The Silent Count",
    description: "A hundred thousand fans on the road, and you can't hear your own cadence. Trust the silent count, or burn a timeout to get it right.",
    options: [
      {
        id: "trust-it",
        label: "Run the silent count as drawn up",
        probability: 0.6,
        positiveOutcome: {
          description: "Everyone's on the same page. Clean snap, clean play.",
          effects: [
            { kind: "stat", stat: "passYards", amount: 130 },
            { kind: "overall", timing: "immediate", amount: 1 },
          ],
        },
        negativeOutcome: {
          description: "The center jumps early and the whole play blows up.",
          effects: [{ kind: "overall", timing: "immediate", amount: -2 }],
        },
      },
      {
        id: "burn-timeout",
        label: "Burn a timeout to slow it down",
        probability: 1,
        positiveOutcome: {
          description: "You get the play off clean, but you're out of timeouts for the drill later.",
          effects: [{ kind: "stat", stat: "passYards", amount: 70 }],
        },
      },
    ],
  },
  {
    id: "two-minute-drill",
    kind: "random",
    phase: "conference",
    weight: 3,
    conditions: { position: ["QB"], minClass: "JR", requiresPlaying: true },
    title: "The Two-Minute Drill",
    description: "Down four, no timeouts, eighty seconds on the clock. It's on you.",
    options: [
      {
        id: "lead-it",
        label: "Run the two-minute offense",
        probability: 0.5,
        positiveOutcome: {
          description: "You march them the length of the field and win it at the horn.",
          effects: [
            { kind: "stat", stat: "passYards", amount: 220 },
            { kind: "overall", timing: "immediate", amount: 2 },
            { kind: "moment", item: "Led a game-winning two-minute drill", icon: "clock" },
          ],
        },
        negativeOutcome: {
          description: "You spike the clock, force a throw, and it's over.",
          effects: [
            { kind: "overall", timing: "immediate", amount: -2 },
            { kind: "stat", stat: "ints", amount: 1 },
          ],
        },
      },
      {
        id: "play-for-overtime",
        label: "Take the checkdowns and play for overtime",
        probability: 0.7,
        positiveOutcome: {
          description: "You move the chains methodically, kick it, and steal a possession in overtime.",
          effects: [{ kind: "stat", stat: "passYards", amount: 90 }],
        },
        negativeOutcome: {
          description: "The clock beats you at the twenty-eight with the field goal unit still on the sideline.",
          effects: [
            { kind: "stat", stat: "passYards", amount: -30 },
            { kind: "overall", timing: "immediate", amount: -1 },
          ],
        },
      },
    ],
  },
  {
    id: "all-star-invite",
    kind: "random",
    phase: "postseason",
    weight: 3,
    conditions: { position: ["QB"], requiresPlaying: true, minClass: "JR", minOverall: 70 },
    title: "All-Star Game Invite",
    description: "An all-star bowl wants you in Mobile. Accept and show out in front of every scout in the building, or skip it and protect your stock?",
    options: [
      {
        id: "accept",
        label: "Accept and play",
        probability: 0.55,
        positiveOutcome: {
          description: "You look the part all week and have your best day of the year.",
          effects: [
            { kind: "stat", stat: "passYards", amount: 200 },
            { kind: "overall", timing: "immediate", amount: 2 },
          ],
        },
        negativeOutcome: {
          description: "You look tight, throw two picks, and it's the last thing scouts remember.",
          effects: [
            { kind: "overall", timing: "immediate", amount: -2 },
            { kind: "stat", stat: "ints", amount: 2 },
          ],
        },
      },
      {
        id: "skip",
        label: "Skip it and protect your stock",
        probability: 1,
        positiveOutcome: {
          description: "No tape, no risk. The scouts go off the season instead.",
          effects: [],
        },
      },
    ],
  },
  {
    id: "qb-guru",
    kind: "random",
    phase: "offseason",
    weight: 3,
    conditions: { position: ["QB"] },
    title: "The Quarterback Guru",
    description: "A private QB coach in California charges more per hour than your scholarship is worth, and swears he can rebuild your release in six weeks.",
    options: [
      {
        id: "rebuild-release",
        label: "Fly out and rebuild the release",
        probability: 0.5,
        positiveOutcome: {
          description: "Quicker, higher, tighter. By August the ball is out of your hand before the rush gets home.",
          effects: [{ kind: "overall", timing: "immediate", amount: 3 }, { kind: "moment", item: "Rebuilt your throwing motion in one summer", icon: "zap" }],
        },
        negativeOutcome: {
          description: "Half a new motion is worse than either one. Under pressure, the old hitch keeps coming back.",
          effects: [{ kind: "overall", timing: "deferred", amount: -2, delayPhases: 1 }],
        },
      },
      {
        id: "throw-at-home",
        label: "Stay home and throw with your receivers",
        probability: 1,
        positiveOutcome: {
          description: "Same motion, same timing, and four receivers who know exactly where you want the ball.",
          effects: [{ kind: "character", amount: 1 }],
        },
      },
    ],
  },
  {
    id: "qb-seven-on-seven",
    kind: "random",
    phase: "offseason",
    weight: 3,
    conditions: { position: ["QB"], minClass: "SO" },
    title: "Seven-on-Seven Summer",
    description: "The receivers want to run 7-on-7 every morning all summer. Your arm has opinions about every morning.",
    options: [
      {
        id: "every-morning",
        label: "Run it every morning",
        probability: 0.75,
        positiveOutcome: {
          description: "Two hundred throws a week to the guys who will catch them in the fall. The timing is telepathic by August.",
          effects: [{ kind: "overall", timing: "immediate", amount: 2 }],
        },
        negativeOutcome: {
          description: "Somewhere around week five your shoulder starts filing complaints.",
          effects: [{ kind: "injury", injuryType: "shoulder" }],
        },
      },
      {
        id: "twice-a-week",
        label: "Twice a week, and save your arm",
        probability: 1,
        positiveOutcome: {
          description: "You throw enough to stay sharp and not one rep more. The receivers grumble, then get over it.",
          effects: [{ kind: "character", amount: 1 }],
        },
      },
    ],
  },
];
