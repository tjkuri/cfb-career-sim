import type { GameEvent } from "../../engine/types";

// Offensive-line events. Authored in Stage 3d.
export const OL_EVENTS: GameEvent[] = [
  {
    id: "bulk-up-or-slim-down",
    kind: "random",
    phase: "offseason",
    weight: 3,
    conditions: { position: ["OL"] },
    title: "Bulk Up or Slim Down",
    description:
      "The new strength staff has opinions about your playing weight — bulk up twenty pounds, or trim down and get on the field faster. Either way, the plan starts Monday.",
    options: [
      {
        id: "commit-to-the-plan",
        label: "Buy all the way in",
        probability: 0.6,
        positiveOutcome: {
          description: "The new frame moves better than the old one. You look like a different player in camp.",
          effects: [{ kind: "overall", timing: "immediate", amount: 2 }],
        },
        negativeOutcome: {
          description: "The cut — or the bulk — never quite settles, and camp is a grind.",
          effects: [{ kind: "overall", timing: "deferred", amount: -2, delayPhases: 1 }],
        },
      },
      {
        id: "stay-your-own-weight",
        label: "Stick with what's worked",
        probability: 1,
        positiveOutcome: {
          description: "You show up in the same shape as last year. The staff notes you didn't take the plan seriously.",
          effects: [{ kind: "character", amount: -1 }],
        },
      },
    ],
  },
  {
    id: "new-line-coach",
    kind: "random",
    phase: "offseason",
    weight: 3,
    conditions: { position: ["OL"], minClass: "SO" },
    title: "New Line Coach",
    description:
      "A new O-line coach tears your stance down to the studs — hand placement, first step, all of it starting over from scratch.",
    options: [
      {
        id: "rebuild-it",
        label: "Trust the rebuild",
        probability: 0.55,
        positiveOutcome: {
          description: "The new fundamentals click by the end of camp, and everything downstream gets easier.",
          effects: [{ kind: "overall", timing: "immediate", amount: 2 }],
        },
        negativeOutcome: {
          description: "You're still fighting old habits when the season opener arrives.",
          effects: [{ kind: "overall", timing: "deferred", amount: -2, delayPhases: 1 }],
        },
      },
      {
        id: "keep-your-technique",
        label: "Keep doing what got you here",
        probability: 1,
        positiveOutcome: {
          description: "You nod through the install and keep your old stance. It works well enough, and the coach notices you did not try.",
          effects: [{ kind: "character", amount: -1 }],
        },
      },
    ],
  },
  {
    id: "the-blindside",
    kind: "random",
    phase: "nonconf",
    weight: 3,
    conditions: { position: ["OL"], requiresPlaying: true },
    title: "The Blindside",
    description:
      "The starting left tackle goes down in practice, and the coordinator points at you to protect the quarterback's blind side this week.",
    options: [
      {
        id: "embrace-the-assignment",
        label: "Take the assignment",
        probability: 0.65,
        positiveOutcome: {
          description: "You anchor the edge all afternoon and the quarterback never feels a rusher he doesn't see coming.",
          effects: [
            { kind: "stat", stat: "pancakes", amount: 5 },
            { kind: "overall", timing: "immediate", amount: 1 },
          ],
        },
        negativeOutcome: {
          description: "The speed off the edge is a different animal, and you're grabbing more than blocking.",
          effects: [
            { kind: "stat", stat: "sacksAllowed", amount: 2 },
            { kind: "overall", timing: "immediate", amount: -1 },
          ],
        },
      },
      {
        id: "ask-to-stay-inside",
        label: "Ask to stay inside",
        probability: 1,
        positiveOutcome: {
          description: "You hold your normal spot and have a clean week — but the staff quietly notes you ducked the tough assignment.",
          effects: [
            { kind: "stat", stat: "pancakes", amount: 2 },
            { kind: "character", amount: -1 },
          ],
        },
      },
    ],
  },
  {
    id: "cadence-trouble",
    kind: "random",
    phase: "nonconf",
    weight: 2,
    conditions: { position: ["OL"], requiresPlaying: true },
    title: "Cadence Trouble",
    description:
      "Two false starts in the first quarter of the opener, and the center keeps snapping early. The line coach is not being quiet about it on the headset.",
    options: [
      {
        id: "reset-the-get-off",
        label: "Reset and tighten the count",
        probability: 0.75,
        positiveOutcome: {
          description: "You settle in and finish the game clean.",
          effects: [{ kind: "stat", stat: "pancakes", amount: 3 }],
        },
        negativeOutcome: {
          description: "It snowballs — by the fourth quarter you're guessing at the snap.",
          effects: [
            { kind: "stat", stat: "pancakes", amount: -2 },
            { kind: "stat", stat: "sacksAllowed", amount: 2 },
            { kind: "overall", timing: "immediate", amount: -1 },
          ],
        },
      },
      {
        id: "sit-on-the-count",
        label: "Get off a half-beat late all game",
        probability: 1,
        positiveOutcome: {
          description: "No more flags. No more push, either, but nobody is screaming in your headset.",
          effects: [{ kind: "stat", stat: "pancakes", amount: 1 }, { kind: "stat", stat: "sacksAllowed", amount: 1 }],
        },
      },
    ],
  },
  {
    id: "pancake-highlight",
    kind: "random",
    phase: "nonconf",
    weight: 2,
    conditions: { position: ["OL"], requiresPlaying: true },
    title: "Pancake Highlight",
    description:
      "You bury a linebacker on an outside zone rep, and the clip is on the team's social account before you're off the field.",
    options: [
      {
        id: "ride-the-momentum",
        label: "Ride the momentum",
        probability: 0.7,
        positiveOutcome: {
          description: "You keep playing with your hair on fire and it shows up on tape all game.",
          effects: [
            { kind: "stat", stat: "pancakes", amount: 4 },
            { kind: "overall", timing: "immediate", amount: 1 },
            { kind: "moment", item: "Had a pancake block go up on the team's social account", icon: "video" },
          ],
        },
        negativeOutcome: {
          description: "You spend the next series watching the reaction instead of your assignment.",
          effects: [
            { kind: "stat", stat: "pancakes", amount: 1 },
            { kind: "overall", timing: "immediate", amount: -1 },
          ],
        },
      },
      {
        id: "put-the-phone-away",
        label: "Put the phone away and finish the game",
        probability: 0.85,
        positiveOutcome: {
          description: "You never see the clip until the bus ride, and your assignment grade is clean all four quarters.",
          effects: [{ kind: "stat", stat: "pancakes", amount: 2 }],
        },
        negativeOutcome: {
          description: "You play the rest of the way flat — nothing bad on the tape, nothing good either.",
          effects: [{ kind: "stat", stat: "pancakes", amount: -1 }],
        },
      },
    ],
  },
  {
    id: "facing-the-freak",
    kind: "random",
    phase: "conference",
    weight: 3,
    conditions: { position: ["OL"], minClass: "JR", requiresPlaying: true },
    title: "Facing the Freak",
    description:
      "The conference's best pass rusher lines up across from you for four quarters, and everyone in the building knows the game runs through this matchup.",
    options: [
      {
        id: "handle-him-solo",
        label: "Handle him one-on-one",
        probability: 0.5,
        positiveOutcome: {
          description: "You win the leverage battle snap after snap and he never gets home.",
          effects: [
            { kind: "stat", stat: "pancakes", amount: 7 },
            { kind: "overall", timing: "immediate", amount: 2 },
            { kind: "moment", item: "Shut down an All-Conference pass rusher one-on-one", icon: "shield" },
          ],
        },
        negativeOutcome: {
          description: "He wins the edge over and over and the sack total balloons.",
          effects: [
            { kind: "stat", stat: "sacksAllowed", amount: 3 },
            { kind: "overall", timing: "immediate", amount: -2 },
          ],
        },
      },
      {
        id: "get-a-chip",
        label: "Ask for a chip from the tight end",
        probability: 1,
        positiveOutcome: {
          description: "The extra body slows him down. Not flashy, but it holds.",
          effects: [{ kind: "stat", stat: "pancakes", amount: 2 }],
        },
      },
    ],
  },
  {
    id: "the-holding-call",
    kind: "random",
    phase: "conference",
    weight: 2,
    conditions: { position: ["OL"], requiresPlaying: true },
    title: "The Holding Call",
    description: "A holding flag wipes out a forty-yard touchdown, and the coordinator saw exactly who threw it.",
    options: [
      {
        id: "own-it",
        label: "Own it in the film session",
        probability: 0.8,
        positiveOutcome: {
          description: "You clean up your hands and finish the game with your best stretch of blocking.",
          effects: [
            { kind: "stat", stat: "pancakes", amount: 2 },
            { kind: "character", amount: 2 },
          ],
        },
        negativeOutcome: {
          description: "The staff keeps bringing the clip up, and it sticks with you.",
          effects: [{ kind: "character", amount: -2 }],
        },
      },
      {
        id: "argue-the-call",
        label: "Argue the call with the official",
        probability: 0.45,
        positiveOutcome: {
          description: "It somehow works — the crowd gets loud, the line feeds off it, and you dominate the rest of the game.",
          effects: [
            { kind: "stat", stat: "pancakes", amount: 5 },
            { kind: "overall", timing: "immediate", amount: 2 },
          ],
        },
        negativeOutcome: {
          description: "You draw a personal foul on top of it, and the coordinator has a word with you at halftime.",
          effects: [
            { kind: "overall", timing: "immediate", amount: -1 },
            { kind: "character", amount: -1 },
          ],
        },
      },
    ],
  },
  {
    id: "playing-through-the-hand",
    kind: "random",
    phase: "conference",
    weight: 3,
    conditions: { position: ["OL"], requiresPlaying: true },
    title: "Playing Through the Hand",
    description:
      "Your hand is swollen to twice its size after last week. The trainer can rig a club cast so you can play, or you can sit and let the backup get the reps.",
    options: [
      {
        id: "play-through-it",
        label: "Play through it in the cast",
        probability: 0.6,
        positiveOutcome: {
          description: "You grind through it and the line holds up despite the missing hand.",
          effects: [
            { kind: "stat", stat: "pancakes", amount: 4 },
            { kind: "overall", timing: "immediate", amount: 1 },
          ],
        },
        negativeOutcome: {
          description: "The cast costs you grip and technique, and it's a long, sloppy afternoon.",
          effects: [
            { kind: "stat", stat: "sacksAllowed", amount: 2 },
            { kind: "overall", timing: "immediate", amount: -2 },
          ],
        },
      },
      {
        id: "sit-and-let-the-backup-go",
        label: "Sit and let the backup play",
        probability: 1,
        positiveOutcome: {
          description: "The backup gets his shot and does fine. You get grief in the meeting room for missing it.",
          effects: [{ kind: "character", amount: -1 }],
        },
      },
    ],
  },
  {
    id: "senior-bowl-invite",
    kind: "random",
    phase: "postseason",
    weight: 3,
    conditions: { position: ["OL"], tier: [1, 2], requiresPlaying: true, minClass: "JR", minOverall: 70 },
    title: "Senior Bowl Invite",
    description:
      "An all-star bowl in Mobile wants you for a week of one-on-ones in front of every offensive line coach in the league.",
    options: [
      {
        id: "accept-and-practice",
        label: "Accept and practice all week",
        probability: 0.55,
        positiveOutcome: {
          description: "You win enough reps in the one-on-ones that people start talking about you differently.",
          effects: [
            { kind: "stat", stat: "pancakes", amount: 6 },
            { kind: "overall", timing: "immediate", amount: 2 },
          ],
        },
        negativeOutcome: {
          description: "The best pass rushers in the country are all in one building, and it's a rough week on tape.",
          effects: [
            { kind: "stat", stat: "sacksAllowed", amount: 2 },
            { kind: "overall", timing: "immediate", amount: -2 },
          ],
        },
      },
      {
        id: "decline-and-rest",
        label: "Decline and rest the injuries",
        probability: 1,
        positiveOutcome: {
          description: "No new tape, no new risk. The scouts work off the season you already put on film.",
          effects: [],
        },
      },
    ],
  },
  {
    id: "guard-or-tackle",
    kind: "random",
    phase: "postseason",
    weight: 2,
    conditions: { position: ["OL"], requiresPlaying: true },
    title: "Guard or Tackle?",
    description: "Scouts keep asking if you'll kick inside to guard. You've played left tackle your entire life and don't love the idea.",
    options: [
      {
        id: "work-out-at-guard",
        label: "Work out at guard for the scouts",
        probability: 0.55,
        positiveOutcome: {
          description: "The versatility plays well, and it opens up how teams project you.",
          effects: [
            { kind: "stat", stat: "pancakes", amount: 5 },
            { kind: "overall", timing: "immediate", amount: 1 },
          ],
        },
        negativeOutcome: {
          description: "You look stiff and unfamiliar at a new spot, and it costs you reps you'd normally win clean.",
          effects: [{ kind: "stat", stat: "pancakes", amount: -1 }],
        },
      },
      {
        id: "insist-on-tackle-only",
        label: "Insist on tackle reps only",
        probability: 1,
        positiveOutcome: {
          description: "You stay in your lane and post a clean, steady tape at the position you know.",
          effects: [{ kind: "stat", stat: "pancakes", amount: 2 }],
        },
      },
    ],
  },
  {
    id: "ol-left-tackle",
    kind: "random",
    phase: "offseason",
    weight: 3,
    conditions: { position: ["OL"], minClass: "SO" },
    title: "Moving to Left Tackle",
    description: "The staff wants you outside at left tackle, the position that gets paid on draft night. It also gets the other team's best pass rusher every snap.",
    options: [
      {
        id: "move-outside",
        label: "Move to left tackle",
        probability: 0.5,
        positiveOutcome: {
          description: "Your feet were always better than a guard's. By the opener you are protecting the quarterback's blind side like you were born there.",
          effects: [{ kind: "overall", timing: "immediate", amount: 3 }, { kind: "moment", item: "Moved to left tackle and stuck there", icon: "shield" }],
        },
        negativeOutcome: {
          description: "Speed rushers eat you alive in camp, and the move costs you a month of confidence.",
          effects: [{ kind: "overall", timing: "immediate", amount: -2 }],
        },
      },
      {
        id: "stay-inside",
        label: "Stay at guard",
        probability: 1,
        positiveOutcome: {
          description: "The line stays together, and the other four appreciate not having to learn a new neighbor.",
          effects: [{ kind: "character", amount: 1 }],
        },
      },
    ],
  },
  {
    id: "ol-pro-camp",
    kind: "random",
    phase: "offseason",
    weight: 3,
    conditions: { position: ["OL"] },
    title: "Summer With the Pros",
    description: "A retired All-Pro lineman runs a three-week private camp. Invite only, brutal, and right in the middle of team workouts.",
    options: [
      {
        id: "go-to-camp",
        label: "Go to the camp",
        probability: 0.6,
        positiveOutcome: {
          description: "Three weeks with men who did it for twelve years. Your hands are faster than they have ever been.",
          effects: [{ kind: "overall", timing: "immediate", amount: 2 }],
        },
        negativeOutcome: {
          description: "You come back with turf toe and a lot of good advice you cannot use yet.",
          effects: [{ kind: "injury", injuryType: "turfToe" }],
        },
      },
      {
        id: "stay-with-the-line",
        label: "Stay with your own line",
        probability: 1,
        positiveOutcome: {
          description: "You miss the camp. The other four noticed who stayed.",
          effects: [{ kind: "character", amount: 2 }],
        },
      },
    ],
  },
];
