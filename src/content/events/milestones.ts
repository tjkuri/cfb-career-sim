import type { GameEvent } from "../../engine/types";

// Fixed milestone beats. Every matching fixed event fires each phase before the
// random draw, so this slice is capped at one per phase — Senior Day is the
// deliberate exception, and only in the final season. All are gated on
// requiresPlaying so they never fire at a player sitting out a redshirt.
export const MILESTONE_EVENTS: GameEvent[] = [
  {
    id: "milestone-fall-camp",
    kind: "fixed",
    phase: "offseason",
    weight: 1,
    conditions: { requiresPlaying: true, minClass: "SO" },
    title: "Fall Camp Battle",
    description: "The depth chart goes up Monday. Right now your name is written in pencil.",
    options: [
      {
        id: "compete",
        label: "Win the job",
        probability: 0.65,
        positiveOutcome: {
          description: "You take every rep like it is the last one and the pencil becomes ink.",
          effects: [
            { kind: "overall", timing: "immediate", amount: 2 },
          ],
        },
        negativeOutcome: {
          description: "You press, and pressing looks exactly like panicking on film.",
          effects: [{ kind: "overall", timing: "immediate", amount: -1 }],
        },
      },
    ],
  },
  // ---------------------------------------------------------------------------
  // Season Opener — five per-season variants (DECISIONS 030, 036, 042, 043).
  //
  // One card that fired every season was 62% of all first verbatim repeats and
  // landed the first one at decision 13. These five partition seasons 0-4 on
  // `seasonIndex`: exactly one matches per season, and `milestones.test.ts`
  // asserts that directly, because two matching means two openers in one season
  // and zero means a silent hole in the spine.
  //
  // Three constraints shape the prose, and all three are acceptance criteria:
  //   - Mechanically identical. Only id, title, description and the two outcome
  //     descriptions differ; every variant keeps the same option, probability
  //     and effects, so the pilot can be proved to have moved no number.
  //   - No crowd size, venue or stature (DECISION 043 item 1). The line these
  //     replace asserted ninety thousand people at schools that do not have
  //     ninety thousand seats. Write the nerves, not the stadium.
  //   - No class year. `seasonIndex` 2 is a junior for most players and a
  //     sophomore for a redshirt, so these name the STAGE instead: the first one
  //     ever, the one where the room watches you, the last one.
  // ---------------------------------------------------------------------------
  {
    id: "milestone-opener-first",
    kind: "fixed",
    phase: "nonconf",
    weight: 1,
    conditions: { requiresPlaying: true, seasonIndex: [0] },
    title: "The First One",
    description: "Everything until now was practice for this. Your hands are cold and it is seventy degrees.",
    options: [
      {
        id: "handle-it",
        label: "Take care of business",
        probability: 0.75,
        positiveOutcome: {
          description: "Two snaps in, you are fine. Nobody can tell it was your first.",
          effects: [{ kind: "snaps", amount: 25 }],
        },
        negativeOutcome: {
          description: "It takes a half to stop feeling like a guest.",
          effects: [{ kind: "character", amount: -2 }],
        },
      },
    ],
  },
  {
    id: "milestone-opener-no-excuse",
    kind: "fixed",
    phase: "nonconf",
    weight: 1,
    conditions: { requiresPlaying: true, seasonIndex: [1] },
    title: "No Longer New",
    description: "Last September the nerves were allowed. This year they are just nerves.",
    options: [
      {
        id: "handle-it",
        label: "Take care of business",
        probability: 0.75,
        positiveOutcome: {
          description: "You play like a man who has done this before, because you have.",
          effects: [{ kind: "snaps", amount: 25 }],
        },
        negativeOutcome: {
          description: "You are a step late all afternoon and you know exactly why.",
          effects: [{ kind: "character", amount: -2 }],
        },
      },
    ],
  },
  {
    id: "milestone-opener-your-team",
    kind: "fixed",
    phase: "nonconf",
    weight: 1,
    conditions: { requiresPlaying: true, seasonIndex: [2] },
    title: "Your Team Now",
    description: "The young guys watch how you take the field now. You noticed in August.",
    options: [
      {
        id: "handle-it",
        label: "Take care of business",
        probability: 0.75,
        positiveOutcome: {
          description: "You set the tone on the first series and the rest follow.",
          effects: [{ kind: "snaps", amount: 25 }],
        },
        negativeOutcome: {
          description: "You play tight, and tight travels through a room that watches you.",
          effects: [{ kind: "character", amount: -2 }],
        },
      },
    ],
  },
  {
    id: "milestone-opener-counting",
    kind: "fixed",
    phase: "nonconf",
    weight: 1,
    conditions: { requiresPlaying: true, seasonIndex: [3] },
    title: "You Start Counting",
    description: "More of these behind you now than ahead. You did that math in June.",
    options: [
      {
        id: "handle-it",
        label: "Take care of business",
        probability: 0.75,
        positiveOutcome: {
          description: "You do not waste a snap of it, and the tape says so.",
          effects: [{ kind: "snaps", amount: 25 }],
        },
        negativeOutcome: {
          description: "Playing like every rep matters is not the same as playing well.",
          effects: [{ kind: "character", amount: -2 }],
        },
      },
    ],
  },
  {
    // Reachable only with a redshirt used — the eligibility cap is four seasons
    // plus the year a redshirt returns — so season 4 is always a final season,
    // and this is the one variant that can safely say so.
    id: "milestone-opener-last",
    kind: "fixed",
    phase: "nonconf",
    weight: 1,
    conditions: { requiresPlaying: true, seasonIndex: [4] },
    title: "The Last One",
    description: "Last one of these you get. Everybody in the building has mentioned it. Repeatedly.",
    options: [
      {
        id: "handle-it",
        label: "Take care of business",
        probability: 0.75,
        positiveOutcome: {
          description: "You are not sentimental about it until the second half. Then you are.",
          effects: [{ kind: "snaps", amount: 25 }],
        },
        negativeOutcome: {
          description: "You spend the whole first half trying to feel something about it.",
          effects: [{ kind: "character", amount: -2 }],
        },
      },
    ],
  },
  {
    id: "milestone-rivalry",
    kind: "fixed",
    phase: "conference",
    weight: 1,
    conditions: { requiresPlaying: true },
    title: "Rivalry Week",
    description: "Nobody on campus has talked about anything else since Sunday. Your ankle has been barking since Tuesday.",
    options: [
      {
        id: "play-through",
        label: "Play through it",
        probability: 0.6,
        positiveOutcome: {
          description: "You go the whole way and they storm the field.",
          effects: [
            { kind: "overall", timing: "immediate", amount: 2 },
            { kind: "moment", item: "Won the rivalry game", icon: "trophy" },
          ],
        },
        negativeOutcome: {
          description: "The ankle goes on the second series and you watch the rest in a boot.",
          effects: [{ kind: "injury", injuryType: "ankle" }],
        },
      },
      {
        id: "sit",
        label: "Sit and get right",
        probability: 1,
        positiveOutcome: {
          description: "You are healthy for November. It does not feel like enough on Saturday.",
          effects: [{ kind: "character", amount: -2 }],
        },
      },
    ],
  },
  {
    id: "milestone-senior-day",
    kind: "fixed",
    phase: "conference",
    weight: 1,
    conditions: { requiresPlaying: true, requiresFinalSeason: true },
    title: "Senior Day",
    description: "They call your name and you walk out to midfield. Last time you run out of this tunnel.",
    options: [
      {
        id: "walk",
        label: "Soak it in",
        probability: 0.8,
        positiveOutcome: {
          description: "You hug everyone twice and play the cleanest game of your life.",
          effects: [
            { kind: "overall", timing: "immediate", amount: 2 },
            { kind: "moment", item: "Went out a winner on Senior Day", icon: "star" },
          ],
        },
        negativeOutcome: {
          description: "You are crying before kickoff and never find the game.",
          effects: [{ kind: "moment", item: "Senior Day did not go to script", icon: "star" }],
        },
      },
    ],
  },
  {
    id: "milestone-bowl-season",
    kind: "fixed",
    phase: "postseason",
    weight: 1,
    conditions: { requiresPlaying: true },
    title: "Bowl Season",
    description: "Three weeks off, a gift suitcase, and a game in a city you have never been to.",
    options: [
      {
        id: "prepare",
        label: "Treat it like a playoff game",
        probability: 0.7,
        positiveOutcome: {
          description: "You are the only one who practiced like that, and it shows.",
          effects: [
            { kind: "overall", timing: "immediate", amount: 2 },
            { kind: "moment", item: "Carried the team through bowl season", icon: "trophy" },
          ],
        },
        negativeOutcome: {
          description: "Everyone else treated it like a vacation, and you could not drag them.",
          effects: [{ kind: "character", amount: -2 }],
        },
      },
      {
        id: "enjoy",
        label: "Enjoy the trip",
        probability: 1,
        positiveOutcome: {
          description: "Best three weeks of the year. The game is a blur.",
          // DECISION 043 items 2 and 3. Third person on a second-person screen,
          // and — because `enjoy` is the option a tanking player takes to waste
          // the season — the most congratulatory line on a failed career's end
          // screen. Not deleted: it also fires for players genuinely having a
          // good time, and an option with no effects is a worse card. Reworded
          // to read as what it is, a trip enjoyed rather than a thing achieved.
          effects: [{ kind: "moment", item: "Enjoyed the bowl trip more than the bowl game", icon: "sun" }],
        },
      },
    ],
  },
];
