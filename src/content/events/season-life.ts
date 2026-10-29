import type { GameEvent } from "../../engine/types";

// The ordinary rhythm of a season that is going FINE. Most of the shared pool
// is gated behind trouble — low character, low overall, injured — so measured,
// a thriving player could draw only 3-4 shared events per phase against a
// struggling player's 8. The better your career went, the more repetitive it
// got. These carry no trouble-gate, so they are what a healthy, well-regarded
// player actually sees.
//
// EV is matched to the pool each event joins (see STAGE4-HANDOFF.md): universal
// events have no positions.test.ts budget enforcing it, and the postseason pass
// learned that the hard way. Offseason events carry no stat/snaps effects — in
// an offseason those write to the previous, already-resolved season.
export const SEASON_LIFE_EVENTS: GameEvent[] = [
  {
    id: "offseason-captain-vote",
    kind: "random",
    phase: "offseason",
    weight: 3,
    conditions: { minClass: "SO" },
    title: "The Captain Vote",
    description: "The staff lets the roster vote on captains. Ballots go out Monday, and everybody in the building already knows who is campaigning and who is not.",
    options: [
      {
        id: "let-the-work-speak",
        label: "Say nothing and let the work speak",
        probability: 0.7,
        positiveOutcome: {
          description: "You never bring it up once, and the room votes for you anyway.",
          effects: [
            { kind: "moment", item: "Voted captain without campaigning for it", icon: "star" },
            { kind: "character", amount: 2 },
          ],
        },
        negativeOutcome: {
          description: "The guys who did campaign get it. Nobody says it was unfair, because it was not.",
          effects: [{ kind: "character", amount: -3 }],
        },
      },
      {
        id: "make-the-case",
        label: "Make the case for yourself",
        probability: 0.55,
        positiveOutcome: {
          description: "You say out loud that you want it, and then you spend the summer backing it up.",
          effects: [
            { kind: "overall", timing: "immediate", amount: 1 },
          ],
        },
        negativeOutcome: {
          description: "It reads as a campaign, and the room quietly votes for somebody who did not run one.",
          effects: [{ kind: "character", amount: -4 }],
        },
      },
    ],
  },
  {
    id: "offseason-going-home",
    kind: "random",
    phase: "offseason",
    weight: 3,
    title: "Going Home for the Summer",
    description: "Six weeks at home. The same people who watched you leave want to see what you turned into, and a few of them want the version of you that never left.",
    options: [
      {
        id: "stay-and-train",
        label: "Stay on campus and train",
        probability: 0.75,
        positiveOutcome: {
          description: "You stay with the guys who are serious about it, and you report in August ahead of where you left.",
          effects: [{ kind: "overall", timing: "immediate", amount: 1 }],
        },
        negativeOutcome: {
          description: "You do exactly what you did last summer, and in August it shows that you did.",
          effects: [
            { kind: "overall", timing: "immediate", amount: -1 },
            { kind: "character", amount: -2 },
          ],
        },
      },
      {
        id: "go-home",
        label: "Go home for the summer",
        probability: 0.6,
        positiveOutcome: {
          description: "You come back lighter than you left. Some of that is rest and some of it is nobody watching.",
          effects: [{ kind: "overall", timing: "immediate", amount: 2 }, { kind: "character", amount: 3 }],
        },
        negativeOutcome: {
          description: "Six weeks with people who still want to talk about your senior year of high school.",
          effects: [
            { kind: "character", amount: -5 },
            { kind: "overall", timing: "immediate", amount: -1 },
          ],
        },
      },
    ],
  },
  {
    id: "nonconf-watch-list",
    kind: "random",
    phase: "nonconf",
    weight: 3,
    title: "The Watch List",
    description: "Your name turns up on a preseason award watch list with forty other guys. It means nothing, and everybody treats it like it means something.",
    options: [
      {
        id: "ignore-it",
        label: "Never mention it",
        probability: 0.8,
        positiveOutcome: {
          description: "You never bring it up, and neither does anybody whose opinion you actually want.",
          effects: [{ kind: "overall", timing: "immediate", amount: 1 }],
        },
        negativeOutcome: {
          description: "You are the only one in the room not talking about it, which somehow becomes its own story.",
          effects: [{ kind: "character", amount: -3 }],
        },
      },
      {
        id: "lean-in",
        label: "Put the graphic up",
        probability: 0.5,
        positiveOutcome: {
          description: "You post it in July and then go play like a man who belongs on the list.",
          effects: [
            { kind: "overall", timing: "immediate", amount: 2 },
            { kind: "character", amount: 3 },
          ],
        },
        negativeOutcome: {
          description: "You post it in July and spend the whole fall being measured against it.",
          effects: [
            { kind: "character", amount: -6 },
            { kind: "overall", timing: "immediate", amount: -1 },
          ],
        },
      },
    ],
  },
  {
    id: "nonconf-blowout-sideline",
    kind: "random",
    phase: "nonconf",
    weight: 3,
    conditions: { requiresPlaying: true },
    title: "Up Forty at Halftime",
    description: "The guarantee game goes exactly the way guarantee games go. You are done for the day by the third quarter, and the twos are taking the reps you would have had.",
    options: [
      {
        id: "work-the-sideline",
        label: "Coach up the freshman behind you",
        probability: 0.75,
        positiveOutcome: {
          description: "You spend the second half walking a true freshman through his first real snaps. The staff notices who did that.",
          effects: [
            { kind: "character", amount: 4 },
            { kind: "snaps", amount: -15 },
          ],
        },
        negativeOutcome: {
          description: "You try to stay in it from the sideline and mostly end up in the way.",
          effects: [
            { kind: "character", amount: -4 },
            { kind: "snaps", amount: -15 },
          ],
        },
      },
      {
        id: "get-your-work-in",
        label: "Lobby for one more series",
        probability: 0.6,
        positiveOutcome: {
          description: "You talk your way into one more drive and make it worth the argument.",
          effects: [
            { kind: "snaps", amount: 25 },
            { kind: "overall", timing: "immediate", amount: 1 },
          ],
        },
        negativeOutcome: {
          description: "Pushing to stay in a decided game reads as hunting numbers, because it is.",
          effects: [
            { kind: "character", amount: -5 },
            { kind: "snaps", amount: 10 },
          ],
        },
      },
    ],
  },
  {
    id: "conference-primetime",
    kind: "random",
    phase: "conference",
    weight: 3,
    conditions: { requiresPlaying: true },
    title: "Saturday Night, Everybody Watching",
    description: "Night game, whiteout, the network's number one crew. Every rep you take gets replayed in slow motion by people who have never met you.",
    options: [
      {
        id: "play-your-game",
        label: "Play like it is a Tuesday practice",
        probability: 0.8,
        positiveOutcome: {
          description: "You play exactly the way you always do, which on this stage is its own kind of statement.",
          effects: [{ kind: "overall", timing: "immediate", amount: 1 }],
        },
        negativeOutcome: {
          description: "Nothing bad and nothing memorable. The broadcast never says your name.",
          effects: [{ kind: "character", amount: -1 }],
        },
      },
      {
        id: "press-for-the-moment",
        label: "Go get the moment",
        probability: 0.5,
        positiveOutcome: {
          description: "You make the play they cut into the intro package for the rest of the season.",
          effects: [
            { kind: "overall", timing: "immediate", amount: 3 },
            { kind: "moment", item: "Made the primetime play they replayed all year", icon: "tv" },
          ],
        },
        negativeOutcome: {
          description: "You force it with the whole country watching, and that is the clip instead.",
          effects: [
            { kind: "overall", timing: "immediate", amount: -2 },
            { kind: "character", amount: -1 },
          ],
        },
      },
    ],
  },
];
