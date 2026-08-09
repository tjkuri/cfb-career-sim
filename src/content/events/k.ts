import type { GameEvent } from "../../engine/types";

// Kicker events. Authored in Stage 3d.
export const K_EVENTS: GameEvent[] = [
  {
    id: "new-holder",
    kind: "random",
    phase: "offseason",
    weight: 3,
    conditions: { position: ["K"] },
    title: "New Holder",
    description:
      "The punter who caught for you graduated, and the walk-on replacing him has never held a laces-out snap in his life. The whole operation has to be rebuilt from the ground up.",
    options: [
      {
        id: "grind-the-operation",
        label: "Drill the operation until it's automatic",
        probability: 0.6,
        positiveOutcome: {
          description:
            "You and the new holder run the two-step count until neither of you has to think about it anymore. By fall camp it looks like you've been doing this for years.",
          effects: [{ kind: "overall", timing: "permanent", amount: 2 }],
        },
        negativeOutcome: {
          description:
            "The timing never quite locks in, and you're still second-guessing the count when the calendar flips to August.",
          effects: [{ kind: "overall", timing: "deferred", amount: -1, delayPhases: 1 }],
        },
      },
      {
        id: "keep-it-simple",
        label: "Strip the operation down to basics",
        probability: 1,
        positiveOutcome: {
          description:
            "You skip the flourishes and trust muscle memory over polish. Nothing about it is impressive, and the holder appreciates not being asked to be.",
          effects: [{ kind: "character", amount: 1 }],
        },
      },
    ],
  },
  {
    id: "the-yips",
    kind: "random",
    phase: "offseason",
    weight: 2,
    conditions: { position: ["K"], minClass: "SO" },
    title: "The Yips",
    description:
      "You miss eleven in a row on an empty practice field with nobody watching but the ball boy, which is somehow worse than missing them in front of eighty thousand people.",
    options: [
      {
        id: "push-through-alone",
        label: "Stay out there until it breaks",
        probability: 0.5,
        positiveOutcome: {
          description:
            "Kick twelve splits it clean, and so do the next eleven after that. Whatever was wrong in your head just isn't there anymore.",
          effects: [{ kind: "overall", timing: "permanent", amount: 2 }],
        },
        negativeOutcome: {
          description:
            "You never find the miss. It just gets more expensive the longer you stand out there looking for it.",
          effects: [{ kind: "overall", timing: "deferred", amount: -2, delayPhases: 1 }],
        },
      },
      {
        id: "call-the-sports-psych",
        label: "Talk to the sports psychologist instead",
        probability: 1,
        positiveOutcome: {
          description:
            "She has apparently seen this exact spiral in every kicker she's ever worked with, which is either reassuring or the least reassuring thing you've ever heard. Either way, it helps.",
          effects: [{ kind: "character", amount: 2 }],
        },
      },
    ],
  },
  {
    id: "kickoff-duties-too",
    kind: "random",
    phase: "nonconf",
    weight: 3,
    conditions: { position: ["K"] },
    title: "Kickoff Duties Too",
    description:
      "The special teams coordinator has decided one specialist job isn't enough for you and hands you kickoff duty on top of your own. Same leg, twice the workload, same paycheck.",
    options: [
      {
        id: "own-both-jobs",
        label: "Take both jobs and don't complain",
        probability: 0.55,
        positiveOutcome: {
          description:
            "You bang touchbacks all afternoon and still have plenty left for your own attempts. Nobody thanks you, but nobody has to.",
          effects: [
            { kind: "stat", stat: "fieldGoals", amount: 2 },
            { kind: "overall", timing: "immediate", amount: 1 },
          ],
        },
        negativeOutcome: {
          description:
            "The extra reps catch up to your leg by the fourth quarter, and a kickable one sails wide when it matters.",
          effects: [
            { kind: "stat", stat: "fieldGoals", amount: -1 },
            { kind: "overall", timing: "immediate", amount: -1 },
          ],
        },
      },
      {
        id: "stick-to-field-goals",
        label: "Ask them to find someone else for kickoffs",
        probability: 1,
        positiveOutcome: {
          description:
            "You push back, politely, and they find a linebacker with a strong leg and no aversion to running downfield. It's not a fight you needed to win loudly, and the staff notices you didn't.",
          effects: [{ kind: "character", amount: 1 }],
        },
      },
    ],
  },
  {
    id: "the-chip-shot",
    kind: "random",
    phase: "nonconf",
    weight: 2,
    conditions: { position: ["K"] },
    title: "The Chip Shot",
    description:
      "It's a twenty-two-yarder, the kind you make in your sleep, except the offense stalls out with over a minute left on the play clock and you have entirely too long to think about it.",
    options: [
      {
        id: "trust-your-leg",
        label: "Stop thinking and trust your leg",
        probability: 0.8,
        positiveOutcome: {
          description:
            "Twenty-two yards is twenty-two yards. You stop overthinking it somewhere around the fortieth practice swing and split the uprights for real.",
          effects: [
            { kind: "stat", stat: "fieldGoals", amount: 1 },
            { kind: "stat", stat: "points", amount: 3 },
            { kind: "overall", timing: "immediate", amount: 1 },
          ],
        },
        negativeOutcome: {
          description:
            "You think about it exactly one thought too many, push it right, and the shortest miss of your life gets the loudest silence of your season.",
          effects: [
            { kind: "overall", timing: "immediate", amount: -1 },
            { kind: "character", amount: -1 },
          ],
        },
      },
    ],
  },
  {
    id: "the-fake",
    kind: "random",
    phase: "nonconf",
    weight: 3,
    conditions: { position: ["K"] },
    title: "The Fake",
    description:
      "The call comes in from the sideline, and for once the ball isn't going through the uprights — it's going to you, on your feet, with eleven large strangers trying to make sure it doesn't work.",
    options: [
      {
        id: "run-the-fake",
        label: "Sell it and go get the first down",
        probability: 0.5,
        positiveOutcome: {
          description:
            "The edge is wide open and you tuck it upfield without much grace but plenty of urgency. Two drives later you're back out for the real thing, and that one goes through clean too.",
          effects: [
            { kind: "stat", stat: "fieldGoals", amount: 1 },
            { kind: "overall", timing: "permanent", amount: 2 },
            { kind: "moment", item: "Converted a fake field goal for a first down", icon: "football" },
          ],
        },
        negativeOutcome: {
          description:
            "There is nowhere to go, and a linebacker introduces himself the hard way. You spend the walk to the sideline discovering an ankle can bend like that.",
          effects: [
            { kind: "injury", injuryType: "ankle" },
            { kind: "overall", timing: "immediate", amount: -2 },
          ],
        },
      },
      {
        id: "play-it-safe-with-the-ball",
        label: "Take what's in front of you",
        probability: 1,
        positiveOutcome: {
          description:
            "You don't force it — you take the two yards available and live to kick another day. Not a highlight, but the coordinator trusts you with the ball again before the year's out, which is its own kind of compliment.",
          effects: [{ kind: "character", amount: 1 }],
        },
      },
    ],
  },
  {
    id: "iced",
    kind: "random",
    phase: "conference",
    weight: 3,
    conditions: { position: ["K"], minClass: "JR" },
    title: "Iced",
    description:
      "You're mid-approach when the opposing coach calls timeout, and the referee waves you back to the sideline to think about what you were about to do for another two minutes.",
    options: [
      {
        id: "stay-locked-in",
        label: "Keep the same routine, ice or no ice",
        probability: 0.6,
        positiveOutcome: {
          description:
            "The ice doesn't take. Same steps, same count, same result — straight through the middle.",
          effects: [
            { kind: "stat", stat: "fieldGoals", amount: 1 },
            { kind: "overall", timing: "immediate", amount: 1 },
          ],
        },
        negativeOutcome: {
          description:
            "You have too much time to think about the time you have to think, and it sails wide with the crowd noise turned all the way up.",
          effects: [
            { kind: "stat", stat: "fieldGoals", amount: -1 },
            { kind: "overall", timing: "immediate", amount: -1 },
          ],
        },
      },
      {
        id: "use-the-time",
        label: "Use the free rehearsal to reset",
        probability: 1,
        positiveOutcome: {
          description:
            "You walk through your steps one more time on the sideline and let your heart rate come down. Whatever the timeout was supposed to do to you, it mostly just makes you look calmer for it.",
          effects: [{ kind: "character", amount: 2 }],
        },
      },
    ],
  },
  {
    id: "the-wind-at-home",
    kind: "random",
    phase: "conference",
    weight: 2,
    conditions: { position: ["K"] },
    title: "The Wind at Home",
    description:
      "Everyone on the coaching staff insists your own stadium doesn't swirl. You have a theory about the upper deck that nobody else believes, and today you get to test it.",
    options: [
      {
        id: "trust-your-read-of-the-swirl",
        label: "Aim for the swirl like you always say to",
        probability: 0.55,
        positiveOutcome: {
          description:
            "You aim four yards outside the near upright, exactly like you've been telling anyone who'll listen for two years, and the wind brings it back right where you called it. The special teams meeting gets noticeably quieter around you after that.",
          effects: [
            { kind: "stat", stat: "fieldGoals", amount: 2 },
            { kind: "overall", timing: "immediate", amount: 1 },
            { kind: "moment", item: "Called the stadium's wind correctly on a game-deciding kick", icon: "wind" },
          ],
        },
        negativeOutcome: {
          description:
            "You aim for the swirl and, this once, the swirl doesn't show up. Wide left, and the coordinator raises an eyebrow you'll be thinking about all week.",
          effects: [
            { kind: "overall", timing: "immediate", amount: -1 },
            { kind: "character", amount: -1 },
          ],
        },
      },
      {
        id: "just-kick-it-straight",
        label: "Ignore your own theory for once",
        probability: 1,
        positiveOutcome: {
          description:
            "You kick it like a normal person would, mostly because you're tired of arguing about it. It works, and the scoreboard ticks up like it's supposed to — no wind theory required.",
          effects: [{ kind: "stat", stat: "points", amount: 3 }],
        },
      },
    ],
  },
  {
    id: "onside-kick",
    kind: "random",
    phase: "conference",
    weight: 3,
    conditions: { position: ["K"] },
    title: "Onside Kick",
    description:
      "Down eight with ninety seconds left, the coordinator looks at you like you're the one who has to decide this game now, which, for the next ten seconds, you are.",
    options: [
      {
        id: "pooch-it-perfect",
        label: "Drop it right on the numbers",
        probability: 0.5,
        positiveOutcome: {
          description:
            "It hits exactly where you wanted it, your own gunner comes up with the recovery, and two plays later you're jogging back out to tie the game — which you do.",
          effects: [
            { kind: "stat", stat: "fieldGoals", amount: 2 },
            { kind: "stat", stat: "gameWinners", amount: 1 },
            { kind: "overall", timing: "immediate", amount: 1 },
            { kind: "moment", item: "Set up a game-tying kick with an onside recovery", icon: "football" },
          ],
        },
        negativeOutcome: {
          description:
            "It skips a yard too far and their return man scoops it in stride. The sideline goes quiet fast, and there isn't a second chance.",
          effects: [{ kind: "overall", timing: "immediate", amount: -1 }],
        },
      },
      {
        id: "kick-it-conventional",
        label: "Kick it deep and trust the defense",
        probability: 1,
        positiveOutcome: {
          description:
            "You kick it away and let the defense earn the stop. They do, and it leaves you a clean, unhurried look to tie the game, which you take.",
          effects: [{ kind: "stat", stat: "fieldGoals", amount: 1 }],
        },
      },
    ],
  },
  {
    id: "bowl-game-winner",
    kind: "random",
    phase: "postseason",
    weight: 3,
    conditions: { position: ["K"], tier: [1, 2] },
    title: "Bowl Game Winner",
    description:
      "Zero seconds on the clock, your team down two, and the distance is well within what you've hit a hundred times in an empty practice stadium and never once cared about the way you care right now.",
    options: [
      {
        id: "trot-out-for-the-walk-off",
        label: "Take the win",
        probability: 0.5,
        positiveOutcome: {
          description:
            "It's good, and the stadium erupts, half in celebration and half in silence. Somebody's going to be replaying this kick at your wedding someday.",
          effects: [
            { kind: "stat", stat: "fieldGoals", amount: 3 },
            { kind: "stat", stat: "gameWinners", amount: 1 },
            { kind: "overall", timing: "permanent", amount: 1 },
            { kind: "moment", item: "Kicked a walk-off field goal to win a bowl game", icon: "trophy" },
          ],
        },
        negativeOutcome: {
          description:
            "It has the distance and misses left by a foot. The postgame is a blur, and it's the only thing anyone wants to talk about for a while.",
          effects: [
            { kind: "overall", timing: "immediate", amount: -1 },
            { kind: "character", amount: -2 },
          ],
        },
      },
      {
        id: "settle-for-overtime",
        label: "Take the tie and send it to overtime",
        probability: 1,
        positiveOutcome: {
          description:
            "You ask the coordinator for the shorter, safer look that ties the score instead of the correct-but-longer shot at the outright win. Nobody argues, and the game just keeps going.",
          effects: [{ kind: "stat", stat: "points", amount: 3 }],
        },
      },
    ],
  },
  {
    id: "the-long-attempt",
    kind: "random",
    phase: "postseason",
    weight: 2,
    conditions: { position: ["K"] },
    title: "The Long Attempt",
    description:
      "Fifty-seven yards, and the coach is jogging down the sideline asking if you have it in you, which is not a question you get asked very often and not one you love answering under center lights.",
    options: [
      {
        id: "tell-him-youve-got-it",
        label: "Tell him you've got it",
        probability: 0.4,
        positiveOutcome: {
          description:
            "It's got the leg by ten yards and clears the crossbar with room to spare. The broadcast replays it four times before the next snap.",
          effects: [
            { kind: "stat", stat: "fieldGoals", amount: 3 },
            { kind: "overall", timing: "permanent", amount: 1 },
            { kind: "moment", item: "Made a 57-yard field goal", icon: "target" },
          ],
        },
        negativeOutcome: {
          description:
            "It's got the leg. It does not have the accuracy — off the upright and away in the wrong direction.",
          effects: [{ kind: "overall", timing: "immediate", amount: -1 }],
        },
      },
      {
        id: "tell-him-to-punt-it-instead",
        label: "Tell him to flip the field instead",
        probability: 1,
        positiveOutcome: {
          description:
            "You're honest about the odds, and the coach agrees — the punter pins them deep instead. Two drives later a shorter, saner look presents itself, and that one you make.",
          effects: [{ kind: "stat", stat: "fieldGoals", amount: 1 }],
        },
      },
    ],
  },
];
