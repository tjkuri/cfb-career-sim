import type { GameEvent } from "../../engine/types";

// Defensive-line events. Authored in Stage 3d.
export const DL_EVENTS: GameEvent[] = [
  {
    id: "the-get-off",
    kind: "random",
    phase: "offseason",
    weight: 3,
    conditions: { position: ["DL"] },
    title: "The Get-Off",
    description:
      "The strength staff brings in a track coach to rebuild your first step out of the stance — start-block work, sprint mechanics, all of it before fall camp.",
    options: [
      {
        id: "commit-to-the-program",
        label: "Commit to the sprint program",
        probability: 0.6,
        positiveOutcome: {
          description: "Your first step is a full tick quicker by the time pads come on.",
          effects: [{ kind: "overall", timing: "immediate", amount: 2 }],
        },
        negativeOutcome: {
          description: "The new mechanics fight your instincts all summer, and you're slower off the ball than when you started.",
          effects: [{ kind: "overall", timing: "deferred", amount: -2, delayPhases: 1 }],
        },
      },
      {
        id: "stick-with-your-get-off",
        label: "Trust the get-off you already have",
        probability: 1,
        positiveOutcome: {
          description: "You skip the drills and keep doing what's worked. The strength staff notes it.",
          effects: [{ kind: "character", amount: -1 }],
        },
      },
    ],
  },
  {
    id: "weight-class",
    kind: "random",
    phase: "offseason",
    weight: 3,
    conditions: { position: ["DL"], minClass: "SO" },
    title: "Weight Class",
    description:
      "The staff wants a decision before summer conditioning starts: add nose-tackle mass to anchor the interior, or cut weight and chase an edge-rusher's first step.",
    options: [
      {
        id: "add-mass-inside",
        label: "Add mass and play the nose",
        probability: 0.7,
        positiveOutcome: {
          description: "The extra size lets you hold the point of attack without giving ground.",
          effects: [{ kind: "overall", timing: "immediate", amount: 1 }],
        },
        negativeOutcome: {
          description: "The added weight shows up in your legs before it shows up in your game.",
          effects: [{ kind: "overall", timing: "immediate", amount: -1 }],
        },
      },
      {
        id: "cut-weight-for-speed",
        label: "Cut weight and chase speed off the edge",
        probability: 0.5,
        positiveOutcome: {
          description: "You come back looking like a different kind of player, and the coaches love the new burst.",
          effects: [{ kind: "overall", timing: "immediate", amount: 2 }],
        },
        negativeOutcome: {
          description: "You're faster and weaker at the same time, and it costs you at the point of attack.",
          effects: [{ kind: "overall", timing: "deferred", amount: -2, delayPhases: 1 }],
        },
      },
    ],
  },
  {
    id: "stat-padding-saturday",
    kind: "random",
    phase: "nonconf",
    weight: 3,
    conditions: { position: ["DL"] },
    title: "Stat-Padding Saturday",
    description:
      "The nonconference schedule serves up a body that has no business lining up across from you. The line coach tells you to eat.",
    options: [
      {
        id: "pin-your-ears-back",
        label: "Pin your ears back all game",
        probability: 0.85,
        positiveOutcome: {
          description: "You live in the backfield from the first snap to the last.",
          effects: [
            { kind: "stat", stat: "sacks", amount: 1 },
            { kind: "stat", stat: "tfls", amount: 2 },
            { kind: "overall", timing: "immediate", amount: 1 },
          ],
        },
        negativeOutcome: {
          description: "The coaches pull the starters once the game's decided, and you watch the fourth quarter from the sideline.",
          effects: [{ kind: "overall", timing: "immediate", amount: -1 }],
        },
      },
    ],
  },
  {
    id: "gap-discipline",
    kind: "random",
    phase: "nonconf",
    weight: 3,
    conditions: { position: ["DL"] },
    title: "Gap Discipline",
    description:
      "The scheme calls for you to hold your gap and let the linebackers clean up. The quarterback keeps rolling toward daylight anyway.",
    options: [
      {
        id: "abandon-the-gap",
        label: "Abandon the gap and chase the play",
        probability: 0.5,
        positiveOutcome: {
          description: "You run him down from behind for the sack.",
          effects: [
            { kind: "stat", stat: "sacks", amount: 1 },
            { kind: "overall", timing: "immediate", amount: 1 },
          ],
        },
        negativeOutcome: {
          description: "He cuts back through the hole you left, and it's a long run the other way.",
          effects: [{ kind: "overall", timing: "immediate", amount: -1 }],
        },
      },
      {
        id: "hold-your-gap",
        label: "Hold your gap like it's drawn up",
        probability: 1,
        positiveOutcome: {
          description: "The linebacker cleans it up for a minimal gain, and the coordinator notices who did their job.",
          effects: [
            { kind: "stat", stat: "tackles", amount: 2 },
            { kind: "character", amount: 1 },
          ],
        },
      },
    ],
  },
  {
    id: "the-roughing-call",
    kind: "random",
    phase: "nonconf",
    weight: 2,
    conditions: { position: ["DL"] },
    title: "The Roughing Call",
    description:
      "You bury the quarterback a half-second after the ball's out, and the flag comes in high and hot. The officials are watching you the rest of the way.",
    options: [
      {
        id: "keep-playing-physical",
        label: "Keep playing through the whistle",
        probability: 0.5,
        positiveOutcome: {
          description: "You bait the tackle into a bad protection call two drives later and finish him for real.",
          effects: [
            { kind: "stat", stat: "sacks", amount: 1 },
            { kind: "overall", timing: "immediate", amount: 1 },
          ],
        },
        negativeOutcome: {
          description: "A second flag follows, and the coordinator has seen enough — you're on a short leash the rest of the half.",
          effects: [
            { kind: "overall", timing: "immediate", amount: -1 },
            { kind: "character", amount: -2 },
          ],
        },
      },
      {
        id: "dial-it-back",
        label: "Dial it back and play clean",
        probability: 1,
        positiveOutcome: {
          description: "You stay out of the officials' notebook and get a quiet word of approval from the staff.",
          effects: [
            { kind: "stat", stat: "tfls", amount: 1 },
            { kind: "character", amount: 1 },
          ],
        },
      },
    ],
  },
  {
    id: "double-teamed-all-day",
    kind: "random",
    phase: "conference",
    weight: 3,
    conditions: { position: ["DL"], minClass: "JR" },
    title: "Double-Teamed All Day",
    description:
      "The opposing coordinator builds the whole game plan around keeping two bodies on you. Every rep is a fight before it starts.",
    options: [
      {
        id: "beat-the-double",
        label: "Fight through both blockers",
        probability: 0.45,
        positiveOutcome: {
          description: "You split the double team clean and the quarterback never sees it coming.",
          effects: [
            { kind: "stat", stat: "sacks", amount: 2 },
            { kind: "overall", timing: "immediate", amount: 1 },
            { kind: "moment", item: "Split a double team for a sack", icon: "shield" },
          ],
        },
        negativeOutcome: {
          description: "Two bodies is two bodies, and you spend the game on the ground instead of in the backfield.",
          effects: [{ kind: "overall", timing: "immediate", amount: -1 }],
        },
      },
      {
        id: "trust-the-scheme",
        label: "Trust the scheme to free you late",
        probability: 1,
        positiveOutcome: {
          description: "The extra attention up front springs a teammate for a big one, and you still get home once yourself.",
          effects: [{ kind: "stat", stat: "sacks", amount: 1 }],
        },
      },
    ],
  },
  {
    id: "the-strip-sack",
    kind: "random",
    phase: "conference",
    weight: 3,
    conditions: { position: ["DL"] },
    title: "The Strip Sack",
    description:
      "You get home clean and the ball comes loose. Fifteen bodies pile on it near midfield, and nobody's sure who's underneath.",
    options: [
      {
        id: "dig-for-the-ball",
        label: "Dig for the ball in the pile",
        probability: 0.5,
        positiveOutcome: {
          description: "You come up with it yourself — sack and forced fumble on the same play.",
          effects: [
            { kind: "stat", stat: "sacks", amount: 2 },
            { kind: "overall", timing: "immediate", amount: 1 },
            { kind: "moment", item: "Forced and recovered a fumble in the same pile", icon: "hand" },
          ],
        },
        negativeOutcome: {
          description: "The officials rule it down before the ball came out, and the sack stands alone.",
          effects: [{ kind: "overall", timing: "immediate", amount: -1 }],
        },
      },
      {
        id: "stay-on-your-feet",
        label: "Stay on your feet and let the pile sort itself out",
        probability: 1,
        positiveOutcome: {
          description: "You don't get greedy — the sack counts either way, and you're back in your stance for the next snap.",
          effects: [{ kind: "stat", stat: "sacks", amount: 1 }],
        },
      },
    ],
  },
  {
    id: "trash-talk",
    kind: "random",
    phase: "conference",
    weight: 2,
    conditions: { position: ["DL"] },
    title: "Trash Talk",
    description: "The opposing guard has been running his mouth since warmups, and he hasn't stopped since the first snap.",
    options: [
      {
        id: "let-it-fuel-you",
        label: "Let it fuel you",
        probability: 0.6,
        positiveOutcome: {
          description: "You play with an edge all game and make sure he feels every snap.",
          effects: [
            { kind: "stat", stat: "sacks", amount: 1 },
            { kind: "overall", timing: "immediate", amount: 1 },
          ],
        },
        negativeOutcome: {
          description: "You take the bait, draw a personal foul, and give the coordinator a headache.",
          effects: [
            { kind: "overall", timing: "immediate", amount: -1 },
            { kind: "character", amount: -2 },
          ],
        },
      },
      {
        id: "stay-quiet",
        label: "Stay quiet and play your game",
        probability: 1,
        positiveOutcome: {
          description: "You let your tape do the talking. The staff appreciates the poise.",
          effects: [
            { kind: "stat", stat: "tfls", amount: 1 },
            { kind: "character", amount: 1 },
          ],
        },
      },
    ],
  },
  {
    id: "bowl-practice-reps",
    kind: "random",
    phase: "postseason",
    weight: 3,
    conditions: { position: ["DL"] },
    title: "Bowl Practice Reps",
    description:
      "Three weeks of practice before the bowl game means three weeks of live reps against your own offensive line, every single day.",
    options: [
      {
        id: "go-live-every-rep",
        label: "Go live on every rep",
        probability: 0.7,
        positiveOutcome: {
          description: "You show up to the bowl game sharper than you've been all year.",
          effects: [
            { kind: "stat", stat: "sacks", amount: 1 },
            { kind: "overall", timing: "immediate", amount: 1 },
          ],
        },
        negativeOutcome: {
          description: "Three weeks of live pass rush against your own tackle leaves you banged up and worn down by kickoff.",
          effects: [{ kind: "overall", timing: "immediate", amount: -1 }],
        },
      },
      {
        id: "manage-the-reps",
        label: "Manage your reps and stay fresh",
        probability: 1,
        positiveOutcome: {
          description: "You take it easy in practice and show up to the bowl feeling like it's September.",
          effects: [
            { kind: "stat", stat: "tfls", amount: 1 },
            { kind: "character", amount: 1 },
          ],
        },
      },
    ],
  },
  {
    id: "combine-buzz",
    kind: "random",
    phase: "postseason",
    weight: 3,
    conditions: { position: ["DL"], tier: [1, 2] },
    title: "Combine Buzz",
    description:
      "Scouts keep asking about your get-off number. You've never been the workout-warrior type, but they want it anyway.",
    options: [
      {
        id: "chase-the-number",
        label: "Grind the pre-draft drill work",
        probability: 0.5,
        positiveOutcome: {
          description: "You post a get-off time that makes the room go quiet.",
          effects: [
            { kind: "overall", timing: "immediate", amount: 2 },
            { kind: "stat", stat: "tfls", amount: 1 },
            { kind: "moment", item: "Posted a get-off number that turned heads", icon: "stopwatch" },
          ],
        },
        negativeOutcome: {
          description: "You look pedestrian on the stopwatch, and it's all the room wants to talk about.",
          effects: [{ kind: "overall", timing: "immediate", amount: -2 }],
        },
      },
      {
        id: "point-to-the-tape",
        label: "Point them to the tape instead",
        probability: 1,
        positiveOutcome: {
          description: "You let the season speak for itself. The sacks are already on film.",
          effects: [{ kind: "stat", stat: "sacks", amount: 1 }],
        },
      },
    ],
  },
];
