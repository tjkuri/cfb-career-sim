import type { GameEvent } from "../../engine/types";

// Offensive-skill events (RB/WR/TE). Authored in Stage 3d.
export const OSKILL_EVENTS: GameEvent[] = [
  {
    id: "position-switch",
    kind: "random",
    phase: "offseason",
    weight: 3,
    conditions: { position: ["OSKILL"] },
    title: "The Position Switch",
    description:
      "The staff wants to move you — running back to slot, or slot to running back, whichever one you aren't already. It's presented as a compliment. It might even be one.",
    options: [
      {
        id: "commit",
        label: "Commit to the new role",
        probability: 0.55,
        positiveOutcome: {
          description: "The new reps click fast and you carve out a real role there.",
          effects: [{ kind: "overall", timing: "immediate", amount: 2 }],
        },
        negativeOutcome: {
          description: "The fit never quite comes together, and it shows on the depth chart.",
          effects: [{ kind: "overall", timing: "deferred", amount: -2, delayPhases: 1 }],
        },
      },
      {
        id: "hold-ground",
        label: "Push back and stay put",
        probability: 1,
        positiveOutcome: {
          description: "You hold your spot, but the staff quietly notes you didn't take direction well.",
          effects: [{ kind: "character", amount: -1 }],
        },
      },
    ],
  },
  {
    id: "weight-room-bet",
    kind: "random",
    phase: "offseason",
    weight: 2,
    conditions: { position: ["OSKILL"], minClass: "SO" },
    title: "The Weight Room Bet",
    description:
      "The strength coach bets you a case of gas-station snacks that you can't add real numbers to your squat max by fall camp. Word gets around the building fast.",
    options: [
      {
        id: "take-bet",
        label: "Take the bet",
        probability: 0.6,
        positiveOutcome: {
          description: "You blow past the number with reps to spare, and the staff starts bragging about you to recruits.",
          effects: [{ kind: "overall", timing: "immediate", amount: 2 }],
        },
        negativeOutcome: {
          description: "You stall out two reps short, and it's the running joke of the summer.",
          effects: [{ kind: "overall", timing: "immediate", amount: -1 }],
        },
      },
      {
        id: "stick-to-your-program",
        label: "Laugh it off and stick to your program",
        probability: 0.7,
        positiveOutcome: {
          description: "You keep doing what got you here, and you report to camp in the same shape you left in.",
          effects: [{ kind: "overall", timing: "immediate", amount: 1 }],
        },
        negativeOutcome: {
          description: "The staff reads it as ducking a challenge, and it colors how they talk about you.",
          effects: [{ kind: "character", amount: -2 }],
        },
      },
    ],
  },
  {
    id: "return-duty",
    kind: "random",
    phase: "nonconf",
    weight: 3,
    conditions: { position: ["OSKILL"], requiresPlaying: true },
    title: "Return Duty",
    description: "Special teams is thin, and they want you back deep fielding punts on top of your normal reps.",
    options: [
      {
        id: "accept",
        label: "Take the return job",
        probability: 0.7,
        positiveOutcome: {
          description: "You add real yardage in the return game and never leave the field.",
          effects: [
            { kind: "stat", stat: "scrimmageYards", amount: 60 },
            { kind: "snaps", amount: 5 },
          ],
        },
        negativeOutcome: {
          description: "The extra workload catches up with you, and you take an awkward step fielding one.",
          effects: [{ kind: "injury", injuryType: "ankle" }],
        },
      },
      {
        id: "decline",
        label: "Stay focused on offense",
        probability: 1,
        positiveOutcome: {
          description: "You save your legs and stick to what's already working.",
          effects: [{ kind: "stat", stat: "scrimmageYards", amount: 20 }],
        },
      },
    ],
  },
  {
    id: "the-drop",
    kind: "random",
    phase: "nonconf",
    weight: 2,
    conditions: { position: ["OSKILL"], requiresPlaying: true },
    title: "The Drop",
    description:
      "A ball hits you right in the numbers, wide open, and clangs off your hands in week two. The broadcast shows it twice.",
    options: [
      {
        id: "shake-it-off",
        label: "Shake it off",
        probability: 0.7,
        positiveOutcome: {
          description: "You put it out of your head and keep playing loose the rest of the way.",
          effects: [{ kind: "stat", stat: "scrimmageYards", amount: 65 }],
        },
        negativeOutcome: {
          description: "It sticks with you, and you play the rest of the game tight.",
          effects: [{ kind: "stat", stat: "scrimmageYards", amount: 10 }],
        },
      },
    ],
  },
  {
    id: "bubble-screen-diet",
    kind: "random",
    phase: "nonconf",
    weight: 3,
    conditions: { position: ["OSKILL"], requiresPlaying: true },
    title: "Bubble Screen Diet",
    description:
      "The OC has you catching bubble screens on repeat. Good for the completion rate, deadly boring, and it's not moving the needle on your tape.",
    options: [
      {
        id: "stay-professional",
        label: "Take what's given",
        probability: 1,
        positiveOutcome: {
          description: "You cash in the easy yardage without complaint, and the staff notices the professionalism.",
          effects: [
            { kind: "stat", stat: "scrimmageYards", amount: 35 },
          ],
        },
      },
      {
        id: "push-for-more",
        label: "Push the staff for downfield shots",
        probability: 0.5,
        positiveOutcome: {
          description: "They open it up and you make them pay for it.",
          effects: [
            { kind: "stat", stat: "scrimmageYards", amount: 110 },
            { kind: "overall", timing: "immediate", amount: 1 },
          ],
        },
        negativeOutcome: {
          description: "They indulge you once, it doesn't hit, and it's straight back to bubble screens.",
          effects: [
            // Below the guaranteed +35 that staying professional banks: pushing
            // for more has to be able to leave you behind the safe option.
            { kind: "stat", stat: "scrimmageYards", amount: -25 },
          ],
        },
      },
    ],
  },
  {
    id: "feature-back-workload",
    kind: "random",
    phase: "conference",
    weight: 4,
    conditions: { position: ["OSKILL"], minClass: "JR", requiresPlaying: true },
    title: "Feature Back Workload",
    description: "The staff hands you 28 touches a game and dares the defense to slow you down.",
    options: [
      {
        id: "embrace",
        label: "Embrace the workload",
        probability: 0.6,
        positiveOutcome: {
          description: "You wear defenses down in the fourth quarter and become the whole offense.",
          effects: [
            { kind: "stat", stat: "scrimmageYards", amount: 190 },
            { kind: "overall", timing: "immediate", amount: 1 },
          ],
        },
        negativeOutcome: {
          description: "The volume catches up with your body.",
          effects: [
            { kind: "stat", stat: "scrimmageYards", amount: 60 },
            { kind: "injury", injuryType: "shoulder" },
          ],
        },
      },
      {
        id: "spread-it",
        label: "Ask the staff to spread the load",
        probability: 1,
        positiveOutcome: {
          description: "You split touches with the room. Fresher, quieter, less spotlight.",
          effects: [{ kind: "stat", stat: "scrimmageYards", amount: 80 }],
        },
      },
    ],
  },
  {
    id: "the-toe-tap",
    kind: "random",
    phase: "conference",
    weight: 3,
    conditions: { position: ["OSKILL"], requiresPlaying: true },
    title: "The Toe-Tap",
    description:
      "You lay out for a ball near the sideline. Bang-bang. The whole stadium waits on the booth to sort out your feet.",
    options: [
      {
        id: "sell-it",
        label: "Sell the catch",
        probability: 0.55,
        positiveOutcome: {
          description: "The zebras put their hands up. It's the play of the day.",
          effects: [
            { kind: "stat", stat: "scrimmageYards", amount: 40 },
            { kind: "stat", stat: "totalTds", amount: 1 },
            { kind: "overall", timing: "immediate", amount: 1 },
            { kind: "moment", item: "Had a highlight sideline catch upheld on review", icon: "video" },
          ],
        },
        negativeOutcome: {
          description: "The booth finds a blade of grass under the ball. Overturned.",
          effects: [{ kind: "overall", timing: "immediate", amount: -1 }],
        },
      },
      {
        id: "wave-it-off",
        label: "Wave it incomplete before the booth does",
        probability: 0.75,
        positiveOutcome: {
          description: "You tell the official you trapped it. It buys you something that does not show up in the box score.",
          effects: [
            { kind: "stat", stat: "scrimmageYards", amount: 10 },
            { kind: "character", amount: 2 },
          ],
        },
        negativeOutcome: {
          description: "Replay would have given it to you. You take it off the board yourself.",
          effects: [
            { kind: "stat", stat: "scrimmageYards", amount: -20 },
            { kind: "overall", timing: "immediate", amount: -1 },
          ],
        },
      },
    ],
  },
  {
    id: "asked-to-block",
    kind: "random",
    phase: "conference",
    weight: 2,
    conditions: { position: ["OSKILL"], requiresPlaying: true },
    title: "Asked to Block",
    description: "The OC needs you sealing the edge on run downs, not touching the ball. Good soldier, quiet stat line.",
    options: [
      {
        id: "buy-in",
        label: "Take pride in the dirty work",
        probability: 1,
        positiveOutcome: {
          description: "You spring two long runs with key blocks. The coaches notice even if the box score doesn't.",
          effects: [{ kind: "character", amount: 1 }],
        },
      },
      {
        id: "lobby",
        label: "Lobby for more touches",
        probability: 0.4,
        positiveOutcome: {
          description: "The staff relents and dials up a few designed touches your way.",
          effects: [{ kind: "stat", stat: "scrimmageYards", amount: 70 }],
        },
        negativeOutcome: {
          description: "It reads as sulking, and you lose trust in the room.",
          effects: [
            { kind: "character", amount: -2 },
            { kind: "overall", timing: "immediate", amount: -1 },
          ],
        },
      },
    ],
  },
  {
    id: "bowl-opt-out",
    kind: "random",
    phase: "postseason",
    weight: 3,
    conditions: { position: ["OSKILL"], tier: [1, 2], requiresPlaying: true, minClass: "JR", minOverall: 70 },
    title: "Bowl Opt-Out",
    description:
      "Directional bowl, low stakes, and your name's already climbing draft boards. Sit and protect the tape you have, or suit up for the guys who got you here?",
    options: [
      {
        id: "sit",
        label: "Sit out",
        probability: 1,
        positiveOutcome: {
          description: "You watch from the sideline in a polo. Zero new risk, zero new tape.",
          effects: [],
        },
      },
      {
        id: "play",
        label: "Suit up and play",
        probability: 0.65,
        positiveOutcome: {
          description: "You play loose with nothing to lose and add a highlight to the reel.",
          effects: [
            { kind: "stat", stat: "scrimmageYards", amount: 90 },
            { kind: "character", amount: 2 },
            { kind: "overall", timing: "immediate", amount: 1 },
          ],
        },
        negativeOutcome: {
          description: "You take a hard hit in a game that means nothing on your permanent record.",
          effects: [
            { kind: "injury", injuryType: "collarbone" },
            { kind: "overall", timing: "immediate", amount: -2 },
          ],
        },
      },
    ],
  },
  {
    id: "the-long-one",
    kind: "random",
    phase: "postseason",
    weight: 4,
    conditions: { position: ["OSKILL"], requiresPlaying: true },
    title: "The Long One",
    description: "One snap, a blown coverage, and nothing but grass. Eighty yards of green in front of you.",
    options: [
      {
        id: "turn-it-upfield",
        label: "Turn it up field",
        probability: 0.7,
        positiveOutcome: {
          description: "You outrun the angle and take it to the house.",
          effects: [
            { kind: "stat", stat: "scrimmageYards", amount: 80 },
            { kind: "stat", stat: "totalTds", amount: 1 },
            { kind: "overall", timing: "immediate", amount: 1 },
            { kind: "moment", item: "Broke off an 80-yard touchdown", icon: "zap" },
          ],
        },
        negativeOutcome: {
          description: "The angle closes late and you're run down from behind at the ten.",
          effects: [{ kind: "stat", stat: "scrimmageYards", amount: 70 }],
        },
      },
    ],
  },
];
