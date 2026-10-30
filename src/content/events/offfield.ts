import type { GameEvent } from "../../engine/types";

// The off-field pressure ladder. Band 1 (this file's ungated events) applies
// character pressure to every career; band 2 gates at maxCharacter 55 and only
// finds players who have already slipped; band 3 is bust.ts. See
// docs/superpowers/specs/2026-08-08-phase2-stage3d-content-pile-design.md.
//
// Band 1 convention: the corrosive option charges character on the branch you
// take, not merely on the branch where you fail. The descent is a chosen cost.
export const OFFFIELD_EVENTS: GameEvent[] = [
  // ——— Band 1: ungated temptations, every career draws against these ———
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
          description: "It gets a laugh in the building and dies by Sunday. You play the next month like a man with something to prove.",
          effects: [
            { kind: "character", amount: -8 },
            { kind: "overall", timing: "immediate", amount: 2 },
          ],
        },
        negativeOutcome: {
          description: "It makes a recruiting Twitter account. The coordinator does not think it is funny.",
          effects: [
            { kind: "character", amount: -12 },
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
    description: "Your cousin wants to manage your NIL. He has no experience, which he says means he is not afraid to hunt whales. He has business cards now.",
    options: [
      {
        id: "let-him-handle-it",
        label: "Let him handle it",
        probability: 0.5,
        positiveOutcome: {
          description: "He lands a whale: a car dealership, a real number, and a private trainer paid for out of it.",
          effects: [
            { kind: "overall", timing: "immediate", amount: 3 },
            { kind: "moment", item: "Let your cousin hunt whales, and he landed one", icon: "money" },
          ],
        },
        negativeOutcome: {
          description: "Half the money is gone into something he calls 'an opportunity.' Family dinner is tense for a while.",
          effects: [
            { kind: "character", amount: -15 },
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
            { kind: "character", amount: -8 },
            { kind: "overall", timing: "immediate", amount: 3 },
            { kind: "moment", item: "Cashed an NIL check nobody read first", icon: "money" },
          ],
        },
        negativeOutcome: {
          description: "Compliance calls. The posts come down, the money goes back, and the meeting is ninety minutes long.",
          effects: [
            { kind: "character", amount: -22 },
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
            { kind: "character", amount: -8 },
            { kind: "overall", timing: "immediate", amount: 1 },
          ],
        },
        negativeOutcome: {
          description: "Good episode. You show up to walkthrough not knowing the new checks, and it shows.",
          effects: [
            { kind: "character", amount: -8 },
            { kind: "overall", timing: "deferred", amount: -2, delayPhases: 1 },
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
    conditions: { requiresPlaying: true },
    title: "Cutting the Line",
    description: "The training-table line is long and you are starving. Cutting to the front in front of the walk-ons would take ten seconds.",
    options: [
      {
        id: "cut-the-line",
        label: "Cut to the front",
        probability: 0.6,
        positiveOutcome: {
          description: "Nobody says anything to your face. You eat, nap, and have the best lift of your week.",
          effects: [
            { kind: "character", amount: -8 },
            { kind: "overall", timing: "immediate", amount: 1 },
          ],
        },
        negativeOutcome: {
          description: "A walk-on's dad posts the clip with a caption about 'entitled scholarship guys.' It travels.",
          effects: [
            { kind: "character", amount: -10 },
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
            { kind: "character", amount: -8 },
            { kind: "overall", timing: "immediate", amount: 1 },
          ],
        },
        negativeOutcome: {
          description: "Compliance flags the resale listing with your name still in the metadata.",
          effects: [
            { kind: "character", amount: -18 },
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
            { kind: "character", amount: -8 },
            { kind: "moment", item: "Snuck out on bowl week and never got caught", icon: "sun" },
            { kind: "overall", timing: "immediate", amount: 1 },
          ],
        },
        negativeOutcome: {
          description: "The bed check catches an empty room. You run stadium steps before the practice everyone else sleeps through.",
          effects: [
            { kind: "character", amount: -10 },
            { kind: "overall", timing: "immediate", amount: -2 },
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
            { kind: "character", amount: -8 },
            { kind: "overall", timing: "immediate", amount: 1 },
          ],
        },
        negativeOutcome: {
          description: "Sports media runs a week of 'availability' takes with your name in the headline.",
          effects: [{ kind: "character", amount: -18 }],
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
    weight: 1,
    title: "You Got Catfished",
    description: "That 'booster's daughter' in your DMs was a rival fan running a bit. It's all over social media.",
    options: [
      {
        id: "laugh",
        label: "Laugh it off publicly",
        probability: 0.8,
        positiveOutcome: {
          description: "Fans love the good sport. Character intact.",
          effects: [{ kind: "moment", item: "Got catfished, handled it like a champ", icon: "phone" }, { kind: "character", amount: 5 }],
        },
        negativeOutcome: {
          description: "Your clapback makes it worse.",
          effects: [{ kind: "character", amount: -12 }, { kind: "moment", item: "Catfishing meltdown went viral", icon: "phone" }],
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
  // ——— Band 2: the slipping band, gated at maxCharacter 55 ———
  {
    id: "offfield-entourage",
    kind: "random",
    phase: "offseason",
    weight: 4,
    conditions: { maxCharacter: 55 },
    title: "The Entourage",
    description: "Six people you did not know last spring now have strong opinions about your playing time.",
    options: [
      {
        id: "lean-in",
        label: "They are the only ones who get it",
        probability: 0.6,
        positiveOutcome: {
          description: "You stop taking calls from anyone who tells you something you did not want to hear.",
          effects: [
            { kind: "character", amount: -12 },
            { kind: "overall", timing: "immediate", amount: 2 },
          ],
        },
        negativeOutcome: {
          description: "One of them gets into it with a strength coach in the parking lot, wearing your jersey.",
          effects: [{ kind: "character", amount: -12 }],
        },
      },
      {
        id: "ride-it-out",
        label: "Say nothing and hope it settles",
        probability: 1,
        positiveOutcome: {
          description: "It does not settle, exactly. It just gets quieter for a while.",
          effects: [{ kind: "character", amount: -6 }],
        },
      },
      {
        id: "clear-the-room",
        label: "Change your number and go home for a month",
        probability: 0.75,
        positiveOutcome: {
          description: "Your mother feeds you and nobody asks you for anything. You come back lighter and further behind.",
          effects: [
            { kind: "character", amount: 20 },
            { kind: "overall", timing: "immediate", amount: -2 },
          ],
        },
        negativeOutcome: {
          description: "You go home, and half of them are there when you arrive.",
          effects: [
            { kind: "character", amount: 8 },
            { kind: "overall", timing: "immediate", amount: -4 },
          ],
        },
      },
    ],
  },
  {
    id: "offfield-portal-rumor",
    kind: "random",
    phase: "offseason",
    weight: 4,
    conditions: { maxCharacter: 55 },
    title: "The Portal Rumor",
    description: "Your name shows up on a transfer portal tracker you never entered. It is not real, but the staff cannot tell that from three states away.",
    options: [
      {
        id: "let-it-work",
        label: "Let them think you mean it",
        probability: 0.55,
        positiveOutcome: {
          description: "Every position coach in the building suddenly remembers your name. The rumor cools off before it starts.",
          effects: [
            { kind: "character", amount: -12 },
            { kind: "overall", timing: "immediate", amount: 3 },
          ],
        },
        negativeOutcome: {
          description: "The staff calls the bluff and quietly starts recruiting your replacement anyway.",
          effects: [{ kind: "character", amount: -15 }],
        },
      },
      {
        id: "ride-it-out",
        label: "Say nothing and let it die on its own",
        probability: 1,
        positiveOutcome: {
          description: "Nobody quite believes it and nobody quite forgets it either.",
          effects: [{ kind: "character", amount: -6 }],
        },
      },
      {
        id: "kill-it-yourself",
        label: "Call compliance and shut it down in writing",
        probability: 0.7,
        positiveOutcome: {
          description: "You spend the week proving you are not going anywhere — in meetings, not in the weight room.",
          effects: [
            { kind: "character", amount: 20 },
            { kind: "overall", timing: "immediate", amount: -2 },
          ],
        },
        negativeOutcome: {
          description: "You shut it down, and the staff quietly wonders why you needed to.",
          effects: [
            { kind: "character", amount: 8 },
            { kind: "overall", timing: "immediate", amount: -4 },
          ],
        },
      },
    ],
  },
  {
    id: "offfield-coordinator-blowup",
    kind: "random",
    phase: "nonconf",
    weight: 4,
    conditions: { maxCharacter: 55, requiresPlaying: true },
    title: "On the Sideline, On Camera",
    description: "You and your coordinator get into it on the sideline, three feet from a live broadcast camera.",
    options: [
      {
        id: "double-down",
        label: "Say the rest of it, camera or not",
        probability: 0.5,
        positiveOutcome: {
          description: "The clip is everywhere by halftime. He puts you back in anyway, mostly to prove a point.",
          effects: [
            { kind: "character", amount: -12 },
            { kind: "overall", timing: "immediate", amount: 2 },
            { kind: "snaps", amount: 15 },
          ],
        },
        negativeOutcome: {
          description: "The clip is everywhere by halftime, and he leaves you on the bench to make a different point.",
          effects: [{ kind: "character", amount: -12 }],
        },
      },
      {
        id: "ride-it-out",
        label: "Walk it off and say nothing after",
        probability: 1,
        positiveOutcome: {
          description: "The broadcast crew has a field day. You do not confirm or deny anything.",
          effects: [{ kind: "character", amount: -6 }],
        },
      },
      {
        id: "apologize-on-tape",
        label: "Find him after the game and own it, on the record",
        probability: 0.7,
        positiveOutcome: {
          description: "You sit out the next series so the cameras see you two talk it through instead. It costs you reps you needed.",
          effects: [
            { kind: "character", amount: 23 },
            { kind: "snaps", amount: -20 },
          ],
        },
        negativeOutcome: {
          description: "You own it on camera, and he still holds the next series over your head.",
          effects: [
            { kind: "character", amount: 8 },
            { kind: "snaps", amount: -20 },
          ],
        },
      },
    ],
  },
  {
    id: "offfield-curfew-check",
    kind: "random",
    phase: "conference",
    weight: 4,
    conditions: { maxCharacter: 55, requiresPlaying: true },
    title: "Bed Check",
    description: "Game-week curfew, and the RA doing bed check finds your room empty at 1 a.m.",
    options: [
      {
        id: "stay-out",
        label: "You are already out — might as well stay out",
        probability: 0.45,
        positiveOutcome: {
          description: "You roll in at four. Nobody official is awake to see it, and the staff needs you on the field too much to bench you over a curfew anyway.",
          effects: [
            { kind: "character", amount: -18 },
            { kind: "snaps", amount: 15 },
          ],
        },
        negativeOutcome: {
          description: "A different RA is awake this time, and this one writes things down.",
          effects: [{ kind: "character", amount: -10 }],
        },
      },
      {
        id: "ride-it-out",
        label: "Sneak back in and hope the report gets lost",
        probability: 1,
        positiveOutcome: {
          description: "It does not get lost. It just takes a few days to reach anyone who matters.",
          effects: [{ kind: "character", amount: -6 }],
        },
      },
      {
        id: "own-it-monday",
        label: "Tell the position coach yourself before the report does",
        probability: 0.7,
        positiveOutcome: {
          description: "He respects that you came to him first, and makes sure you understand it anyway — up before dawn for a week of extra conditioning.",
          effects: [
            { kind: "character", amount: 23 },
            { kind: "overall", timing: "deferred", amount: -3, delayPhases: 1 },
          ],
        },
        negativeOutcome: {
          description: "He respects it, but the extra conditioning happens either way.",
          effects: [
            { kind: "character", amount: 8 },
            { kind: "overall", timing: "deferred", amount: -6, delayPhases: 1 },
          ],
        },
      },
    ],
  },
  {
    id: "offfield-exit-interview",
    kind: "random",
    phase: "postseason",
    weight: 4,
    conditions: { maxCharacter: 55 },
    title: "The Exit Interview",
    description: "The staff sits you down for the season-ending meeting and tells you exactly where you stand. It is not where you thought.",
    options: [
      {
        id: "argue-the-tape",
        label: "Tell them the tape says otherwise",
        probability: 0.45,
        positiveOutcome: {
          description: "You get the last word in the room, and somehow it lands — they pencil you in for a bigger role next fall, mostly to see if you can back it up.",
          effects: [
            { kind: "character", amount: -12 },
            { kind: "overall", timing: "immediate", amount: 3 },
          ],
        },
        negativeOutcome: {
          description: "You get louder than the tape does. The meeting ends early, and nothing about your role changes.",
          effects: [{ kind: "character", amount: -10 }],
        },
      },
      {
        id: "ride-it-out",
        label: "Nod, say thank you, think about it later",
        probability: 1,
        positiveOutcome: {
          description: "You leave the room with nothing settled, which is its own kind of answer.",
          effects: [{ kind: "character", amount: -6 }],
        },
      },
      {
        id: "ask-what-it-takes",
        label: "Ask exactly what it takes and commit to it in writing",
        probability: 0.7,
        positiveOutcome: {
          description: "They hand you a list. It is a real list, with a real winter of extra work attached to it.",
          effects: [
            { kind: "character", amount: 20 },
            { kind: "overall", timing: "immediate", amount: -1 },
          ],
        },
        negativeOutcome: {
          description: "They hand you the list. You start the winter behind anyway.",
          effects: [
            { kind: "character", amount: 8 },
            { kind: "overall", timing: "immediate", amount: -2 },
          ],
        },
      },
    ],
  },
  // ——— Band 1, continued: moved in from universal.ts, sits here rather than
  // above with the rest of band 1 to avoid disturbing this event's position
  // in the file (see whole-branch review, Finding 8) ———
  {
    id: "speeding-georgia",
    kind: "random",
    phase: "conference",
    weight: 2,
    title: "Blue Lights",
    description: "Blue lights on a two-lane road an hour outside campus. You were doing 96.",
    options: [
      {
        id: "cooperate",
        label: "Yes sir, no sir",
        probability: 0.85,
        positiveOutcome: { description: "A warning and a story.", effects: [{ kind: "moment", item: "Talked a trooper out of a speeding ticket", icon: "car" }] },
        negativeOutcome: { description: "Coach finds out. Two-game suspension.", effects: [{ kind: "suspension", phases: 2 }, { kind: "character", amount: -8 }] },
      },
      {
        id: "tell-him-who-you-are",
        label: "Tell him who you are",
        probability: 0.5,
        positiveOutcome: {
          description: "He is a season-ticket holder. You sign his hat, take a selfie for his kid, and drive off with a warning.",
          effects: [{ kind: "character", amount: 5 }, { kind: "moment", item: "Signed a trooper's hat instead of a ticket", icon: "car" }],
        },
        negativeOutcome: {
          description: "He is not a fan. The body-cam clip is online by morning, and so is the two-game suspension.",
          effects: [{ kind: "suspension", phases: 2 }, { kind: "character", amount: -16 }],
        },
      },
    ],
  },
];
