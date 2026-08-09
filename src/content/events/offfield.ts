import type { GameEvent } from "../../engine/types";

// The off-field pressure ladder. Band 1 (this file's ungated events) applies
// character pressure to every career; band 2 gates at maxCharacter 55 and only
// finds players who have already slipped; band 3 is bust.ts. See
// docs/superpowers/specs/2026-08-08-phase2-stage3d-content-pile-design.md.
//
// Band 1 convention: the corrosive option charges character on the branch you
// take, not merely on the branch where you fail. The descent is a chosen cost.
export const OFFFIELD_EVENTS: GameEvent[] = [
  {
    id: "offfield-group-chat",
    kind: "random",
    phase: "offseason",
    weight: 3,
    title: "The Group Chat",
    description: "The old recruiting group chat is still alive, and someone just screenshotted your rant about your own coordinator's play calls.",
    options: [
      {
        id: "let-it-fly",
        label: "Let the screenshot ride",
        probability: 0.7,
        positiveOutcome: {
          description: "It gets a laugh in the building and dies by Sunday. The coordinator remembers it anyway.",
          effects: [
            { kind: "character", amount: -4 },
            { kind: "overall", timing: "permanent", amount: 1 },
          ],
        },
        negativeOutcome: {
          description: "It makes a recruiting Twitter account. The coordinator does not think it is funny.",
          effects: [
            { kind: "character", amount: -6 },
            { kind: "overall", timing: "permanent", amount: 1 },
          ],
        },
      },
      {
        id: "apologize",
        label: "Text the coordinator and own it",
        probability: 1,
        positiveOutcome: {
          description: "Awkward five minutes, then it's forgotten. No harm done.",
          effects: [],
        },
      },
    ],
  },
  {
    id: "offfield-money-manager",
    kind: "random",
    phase: "offseason",
    weight: 3,
    title: "Family Business",
    description: "Your cousin wants to manage your NIL money. He has a business card now. He is very confident.",
    options: [
      {
        id: "let-him-handle-it",
        label: "Let him handle it",
        probability: 0.6,
        positiveOutcome: {
          description: "He actually gets you a decent deal. You stop thinking about it, which is the point.",
          effects: [
            { kind: "character", amount: -4 },
            { kind: "overall", timing: "permanent", amount: 2 },
          ],
        },
        negativeOutcome: {
          description: "Half the money is gone into something he calls 'an opportunity.' Family dinner is tense for a while.",
          effects: [
            { kind: "character", amount: -5 },
            { kind: "overall", timing: "permanent", amount: 1 },
          ],
        },
      },
      {
        id: "hire-a-professional",
        label: "Hire an actual financial advisor",
        probability: 1,
        positiveOutcome: {
          description: "Boring, correct, and nobody's feelings get hurt at Thanksgiving.",
          effects: [],
        },
      },
    ],
  },
  {
    id: "offfield-sportsbook-nil",
    kind: "random",
    phase: "nonconf",
    weight: 3,
    title: "The NIL Deal Nobody Read",
    description: "Forty thousand dollars to post twice a month. The company turns out to be a sportsbook, and you are an amateur athlete.",
    options: [
      {
        id: "take-the-money",
        label: "Take the money and post",
        probability: 0.7,
        positiveOutcome: {
          description: "Compliance never calls. You quit the summer job and train full time instead.",
          effects: [
            { kind: "character", amount: -5 },
            { kind: "overall", timing: "permanent", amount: 2 },
            { kind: "moment", item: "Cashed an NIL check he probably should not have", icon: "money" },
          ],
        },
        negativeOutcome: {
          description: "Compliance calls. The posts come down, the money goes back, and the meeting is ninety minutes long.",
          effects: [
            { kind: "character", amount: -7 },
            { kind: "overall", timing: "permanent", amount: 1 },
          ],
        },
      },
      {
        id: "have-it-read",
        label: "Have someone read it first",
        probability: 1,
        positiveOutcome: {
          description: "Your compliance officer finds the sportsbook clause in about nine seconds. You pass on it.",
          effects: [],
        },
      },
    ],
  },
  {
    id: "offfield-skip-install",
    kind: "random",
    phase: "nonconf",
    weight: 3,
    title: "Skip the Install",
    description: "A podcast wants you on at the exact hour of the install meeting. It is genuinely a good podcast.",
    options: [
      {
        id: "do-the-podcast",
        label: "Do the podcast, catch the install later",
        probability: 0.65,
        positiveOutcome: {
          description: "Good episode, real exposure. You piece the install together from a teammate's notes.",
          effects: [
            { kind: "character", amount: -4 },
            { kind: "overall", timing: "permanent", amount: 1 },
          ],
        },
        negativeOutcome: {
          description: "Good episode. You show up to walkthrough not knowing the new checks, and it shows.",
          effects: [
            { kind: "character", amount: -4 },
            { kind: "overall", timing: "deferred", amount: -1, delayPhases: 1 },
          ],
        },
      },
      {
        id: "skip-the-podcast",
        label: "Skip the podcast, be in the room",
        probability: 1,
        positiveOutcome: {
          description: "You get the install cold. The podcast books someone else.",
          effects: [],
        },
      },
    ],
  },
  {
    id: "offfield-training-table",
    kind: "random",
    phase: "nonconf",
    weight: 3,
    title: "Cutting the Line",
    description: "The training-table line is long and you are starving. Cutting to the front in front of the walk-ons would take ten seconds.",
    options: [
      {
        id: "cut-the-line",
        label: "Cut to the front",
        probability: 0.5,
        positiveOutcome: {
          description: "Nobody says anything to your face. Somebody films it anyway.",
          effects: [
            { kind: "character", amount: -4 },
            { kind: "snaps", amount: 15 },
          ],
        },
        negativeOutcome: {
          description: "A walk-on's dad posts the clip with a caption about 'entitled scholarship guys.' It travels.",
          effects: [
            { kind: "character", amount: -5 },
            { kind: "snaps", amount: 15 },
          ],
        },
      },
      {
        id: "wait-your-turn",
        label: "Wait your turn like everyone else",
        probability: 1,
        positiveOutcome: {
          description: "You eat ten minutes later than you wanted to. Nobody notices, which is fine.",
          effects: [],
        },
      },
    ],
  },
  {
    id: "offfield-ticket-hookup",
    kind: "random",
    phase: "conference",
    weight: 3,
    title: "The Ticket Hookup",
    description: "Every player gets a comp allotment for home games. A guy from your hometown offers real money for yours — well above face, and very much against the rules.",
    options: [
      {
        id: "sell-them",
        label: "Sell the comp tickets",
        probability: 0.6,
        positiveOutcome: {
          description: "Cash in hand, nobody notices four tickets among thousands.",
          effects: [
            { kind: "character", amount: -4 },
            { kind: "overall", timing: "permanent", amount: 1 },
          ],
        },
        negativeOutcome: {
          description: "Compliance flags the resale listing with your name still in the metadata.",
          effects: [
            { kind: "character", amount: -6 },
            { kind: "overall", timing: "permanent", amount: 1 },
          ],
        },
      },
      {
        id: "give-them-away",
        label: "Just give them to your actual family",
        probability: 1,
        positiveOutcome: {
          description: "Less money, zero risk, and your family gets good seats.",
          effects: [],
        },
      },
    ],
  },
  {
    id: "offfield-bowl-curfew",
    kind: "random",
    phase: "postseason",
    weight: 3,
    title: "Bowl Trip Curfew",
    description: "Bowl week in a city you have never been to, and the team curfew is a lot earlier than the city is willing to shut down.",
    options: [
      {
        id: "sneak-out",
        label: "Sneak out after curfew",
        probability: 0.55,
        positiveOutcome: {
          description: "You make it back before the bed check and it becomes a story you tell for years.",
          effects: [
            { kind: "character", amount: -4 },
            { kind: "overall", timing: "permanent", amount: 1 },
          ],
        },
        negativeOutcome: {
          description: "The bed check catches an empty room. You run stadium steps before the practice everyone else sleeps through.",
          effects: [
            { kind: "character", amount: -5 },
            { kind: "overall", timing: "deferred", amount: -1, delayPhases: 1 },
          ],
        },
      },
      {
        id: "stay-in",
        label: "Stay in and get the rest",
        probability: 1,
        positiveOutcome: {
          description: "You watch a movie in the hotel room. The city will still be there next time.",
          effects: [],
        },
      },
    ],
  },
  {
    id: "offfield-ghost-media",
    kind: "random",
    phase: "postseason",
    weight: 3,
    title: "Ghosting the Media",
    description: "Required press availability, and you are simply not in the mood to explain a loss to a room full of reporters.",
    options: [
      {
        id: "no-show",
        label: "Don't show up",
        probability: 0.6,
        positiveOutcome: {
          description: "The beat writers grumble, run the postgame without you, and move on by Monday. You spend the hour in the training room instead.",
          effects: [
            { kind: "character", amount: -4 },
            { kind: "overall", timing: "permanent", amount: 1 },
          ],
        },
        negativeOutcome: {
          description: "Sports media runs a week of 'availability' takes with your name in the headline.",
          effects: [{ kind: "character", amount: -6 }],
        },
      },
      {
        id: "show-up",
        label: "Show up and answer the questions",
        probability: 1,
        positiveOutcome: {
          description: "Ten minutes of clichés about effort and execution. Nobody remembers it by dinner.",
          effects: [],
        },
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
];
