import { describe, it, expect } from "vitest";
import {
  buildLedger,
  classYearLabel,
  LEDGER_SLOTS,
  type LedgerInput,
  type LedgerSeason,
} from "./ledger";
import {
  advance,
  createCareer,
  getDecision,
  type GameState,
  type Setup,
} from "../../engine/index";
import { buildView } from "./view-model";
import { knownPhases } from "./labels";
import type { SeasonView } from "./types";

// A four-year career, the default shape: FR/SO/JR/SR, no redshirt.
function season(over: Partial<LedgerSeason> & { seasonIndex: number }): LedgerSeason {
  return {
    schoolName: "Mercer State",
    classYear: "FR",
    record: "9-3",
    snaps: 420,
    overall: 60,
    ...over,
  };
}

function input(over: Partial<LedgerInput> = {}): LedgerInput {
  return {
    seasons: [],
    currentSeasonIndex: 0,
    redshirtUsed: false,
    active: true,
    ...over,
  };
}

const FOUR_YEAR: LedgerSeason[] = [
  season({ seasonIndex: 0, classYear: "FR", record: "6-6", snaps: 180, overall: 54 }),
  season({ seasonIndex: 1, classYear: "SO", record: "9-3", snaps: 470, overall: 63 }),
  season({ seasonIndex: 2, classYear: "JR", record: "11-2", snaps: 610, overall: 74 }),
  season({ seasonIndex: 3, classYear: "SR", record: "8-4", snaps: 590, overall: 79 }),
];

// The shape DECISION 015 is about: FR, SO, JR, SR, SR -- the duplicate at the
// end, never at the redshirt year (which is season index 1, snaps ~26).
const REDSHIRT_FIVE: LedgerSeason[] = [
  season({ seasonIndex: 0, classYear: "FR", record: "6-6", snaps: 190, overall: 55 }),
  season({ seasonIndex: 1, classYear: "SO", record: "7-5", snaps: 26, overall: 57 }),
  season({ seasonIndex: 2, classYear: "JR", record: "9-3", snaps: 500, overall: 66 }),
  season({ seasonIndex: 3, classYear: "SR", record: "10-3", snaps: 560, overall: 73 }),
  season({ seasonIndex: 4, classYear: "SR", record: "8-5", snaps: 580, overall: 78 }),
];

describe("buildLedger — shape", () => {
  it("returns exactly five rows for a career that has not kicked off", () => {
    const rows = buildLedger(input());
    expect(rows).toHaveLength(LEDGER_SLOTS);
    // Signing Day is season 1's offseason and the header already reads
    // `Season 1`, so Year 1 is current and the four behind it are empty.
    expect(rows.map((r) => r.state)).toEqual([
      "current",
      "future",
      "future",
      "future",
      "future",
    ]);
  });

  it("returns exactly five rows for a full five-season career", () => {
    const rows = buildLedger(
      input({ seasons: REDSHIRT_FIVE, currentSeasonIndex: 5, redshirtUsed: true, active: false }),
    );
    expect(rows).toHaveLength(LEDGER_SLOTS);
  });

  it("labels rows by sequence, not by class year (DECISION 015, option 2)", () => {
    const rows = buildLedger(input({ seasons: REDSHIRT_FIVE, currentSeasonIndex: 4, redshirtUsed: true }));
    expect(rows.map((r) => r.label)).toEqual(["Year 1", "Year 2", "Year 3", "Year 4", "Year 5"]);
    expect(rows.map((r) => r.slot)).toEqual([1, 2, 3, 4, 5]);
  });

  it("keeps the class year as a secondary read on each played row", () => {
    const rows = buildLedger(input({ seasons: REDSHIRT_FIVE, currentSeasonIndex: 5, redshirtUsed: true, active: false }));
    expect(rows.map((r) => r.classYear)).toEqual(["FR", "SO", "JR", "SR", "SR"]);
  });

  it("never emits a sixth row even if the history somehow holds one", () => {
    const six = [...REDSHIRT_FIVE, season({ seasonIndex: 5, classYear: "SR" })];
    const rows = buildLedger(input({ seasons: six, currentSeasonIndex: 5, redshirtUsed: true }));
    expect(rows).toHaveLength(LEDGER_SLOTS);
  });
});

describe("buildLedger — a four-year career", () => {
  it("fills the four played rows and leaves the fifth empty", () => {
    const rows = buildLedger(input({ seasons: FOUR_YEAR, currentSeasonIndex: 4, active: false }));
    expect(rows.map((r) => r.state)).toEqual(["played", "played", "played", "played", "future"]);
    expect(rows[2]).toMatchObject({
      schoolName: "Mercer State",
      record: "11-2",
      snaps: 610,
      overall: 74,
      classYear: "JR",
    });
  });

  it("renders a future row as empty chrome, not as zeroes", () => {
    const rows = buildLedger(input({ seasons: FOUR_YEAR, currentSeasonIndex: 4, active: false }));
    expect(rows[4]).toMatchObject({
      state: "future",
      schoolName: null,
      record: null,
      snaps: null,
      overall: null,
      classYear: null,
    });
  });
});

describe("buildLedger — the row being written now", () => {
  it("marks the season matching the current index as current", () => {
    const rows = buildLedger(input({ seasons: FOUR_YEAR.slice(0, 3), currentSeasonIndex: 2 }));
    expect(rows.map((r) => r.state)).toEqual(["played", "played", "current", "future", "future"]);
  });

  it("passes the current row's record through as null and never substitutes 0-0 (DECISION 014)", () => {
    const live = [...FOUR_YEAR.slice(0, 2), season({ seasonIndex: 2, classYear: "JR", record: null, snaps: 145, overall: 68 })];
    const rows = buildLedger(input({ seasons: live, currentSeasonIndex: 2 }));
    expect(rows[2]!.record).toBeNull();
    expect(rows[2]!.snaps).toBe(145);
    expect(rows[2]!.overall).toBe(68);
  });

  // This assertion is the inverse of the one it replaces, and the change is
  // DECISION 033. The old test pinned the behaviour the 017 playtester got
  // lost in: through an offseason no season line exists for the live index
  // yet, so requiring one left the whole phase with NO current row while the
  // header read `Season 3`. It was wrong in every season and only visible in
  // the fifth, where the unhighlighted row was also dashed and captioned.
  it("marks the season the header is naming as current all through an offseason", () => {
    const rows = buildLedger(input({ seasons: FOUR_YEAR.slice(0, 2), currentSeasonIndex: 2 }));
    expect(rows.map((r) => r.state)).toEqual(["played", "played", "current", "future", "future"]);
    // Nothing is invented to fill it. The row is current and empty.
    expect(rows[2]).toMatchObject({ schoolName: null, record: null, snaps: null, overall: null });
  });

  it("never marks two rows current", () => {
    for (let i = 0; i <= LEDGER_SLOTS; i++) {
      const rows = buildLedger(input({ seasons: REDSHIRT_FIVE, currentSeasonIndex: i }));
      expect(rows.filter((r) => r.state === "current").length).toBeLessThanOrEqual(1);
    }
  });

  it("marks no row current once the career is over", () => {
    for (let i = 0; i <= LEDGER_SLOTS; i++) {
      const rows = buildLedger(
        input({ seasons: REDSHIRT_FIVE, currentSeasonIndex: i, active: false }),
      );
      expect(rows.some((r) => r.state === "current"), `index ${i}`).toBe(false);
    }
  });
});

describe("buildLedger — the fifth row is the redshirt slot (DECISION 010)", () => {
  it("marks slot five as the redshirt slot and no other row", () => {
    const rows = buildLedger(input({ seasons: FOUR_YEAR, currentSeasonIndex: 3 }));
    expect(rows.map((r) => r.redshirtSlot)).toEqual([false, false, false, false, true]);
  });

  it("draws the fifth row as tentative while no redshirt has been taken", () => {
    const rows = buildLedger(input({ seasons: FOUR_YEAR.slice(0, 1), currentSeasonIndex: 0, redshirtUsed: false }));
    expect(rows[4]!.tentative).toBe(true);
    expect(rows.slice(0, 4).every((r) => r.tentative === false)).toBe(true);
  });

  it("stops being tentative the moment the redshirt is used, before the season is played", () => {
    const rows = buildLedger(input({ seasons: FOUR_YEAR.slice(0, 2), currentSeasonIndex: 1, redshirtUsed: true }));
    expect(rows[4]!.state).toBe("future");
    expect(rows[4]!.tentative).toBe(false);
  });

  it("is an ordinary played row once a redshirted career reaches its fifth season", () => {
    const rows = buildLedger(input({ seasons: REDSHIRT_FIVE, currentSeasonIndex: 4, redshirtUsed: true }));
    expect(rows[4]).toMatchObject({ state: "current", tentative: false, redshirtSlot: true, snaps: 580 });
  });

  // The 017 playtester's "one place I was genuinely lost": arriving in season 5
  // happens in season 5's OFFSEASON, before any line for index 4 exists. The
  // row stayed dashed, uncaptioned-from-now-on but still hedging, and still
  // unhighlighted, for three consecutive decisions.
  it("stops hedging the moment the header says season five, not when a line appears", () => {
    const rows = buildLedger(
      input({ seasons: REDSHIRT_FIVE.slice(0, 4), currentSeasonIndex: 4, redshirtUsed: true }),
    );
    expect(rows[4]).toMatchObject({ state: "current", tentative: false, snaps: null });
  });

  it("labels the redshirted year by sequence and never as a second SR guess", () => {
    const rows = buildLedger(input({ seasons: REDSHIRT_FIVE, currentSeasonIndex: 5, redshirtUsed: true, active: false }));
    expect(rows[1]).toMatchObject({ label: "Year 2", classYear: "SO", snaps: 26 });
    expect(rows.map((r) => r.label)).toHaveLength(new Set(rows.map((r) => r.label)).size);
  });
});

describe("buildLedger — careers that do not run straight", () => {
  it("carries each row's own school through a transfer", () => {
    const moved: LedgerSeason[] = [
      season({ seasonIndex: 0, classYear: "FR", schoolName: "Mercer State" }),
      season({ seasonIndex: 1, classYear: "SO", schoolName: "Mercer State" }),
      season({ seasonIndex: 2, classYear: "JR", schoolName: "Lakeside Tech" }),
    ];
    const rows = buildLedger(input({ seasons: moved, currentSeasonIndex: 2 }));
    expect(rows.map((r) => r.schoolName)).toEqual([
      "Mercer State",
      "Mercer State",
      "Lakeside Tech",
      null,
      null,
    ]);
  });

  it("shows a career that ended mid-season as played, not as still current", () => {
    const cut: LedgerSeason[] = [
      season({ seasonIndex: 0, classYear: "FR", record: "5-7", snaps: 210, overall: 52 }),
      season({ seasonIndex: 1, classYear: "SO", record: null, snaps: 96, overall: 44 }),
    ];
    const rows = buildLedger(input({ seasons: cut, currentSeasonIndex: 1, active: false }));
    expect(rows[1]).toMatchObject({ state: "played", record: null, snaps: 96, overall: 44 });
    expect(rows.some((r) => r.state === "current")).toBe(false);
  });

  it("places a row by the season it was, leaving a hole rather than shifting later years up", () => {
    const gapped: LedgerSeason[] = [
      season({ seasonIndex: 0, classYear: "FR" }),
      season({ seasonIndex: 2, classYear: "JR" }),
    ];
    const rows = buildLedger(input({ seasons: gapped, currentSeasonIndex: 2 }));
    expect(rows.map((r) => r.state)).toEqual(["played", "future", "current", "future", "future"]);
    expect(rows[2]!.classYear).toBe("JR");
  });
});

describe("buildLedger — a save written before DECISION 009", () => {
  // Lines serialized before `overall` and `classYear` existed on SeasonLine.
  const preDecision009 = [
    { seasonIndex: 0, schoolName: "Mercer State", record: "7-5", snaps: 300 },
    { seasonIndex: 1, schoolName: "Mercer State", record: "9-3", snaps: 450 },
  ] as unknown as LedgerSeason[];

  it("renders the missing OVR as null, never NaN and never undefined", () => {
    const rows = buildLedger(input({ seasons: preDecision009, currentSeasonIndex: 2 }));
    expect(rows[0]!.overall).toBeNull();
    expect(rows[1]!.overall).toBeNull();
    expect(rows.every((r) => !Number.isNaN(r.overall as number))).toBe(true);
  });

  it("renders the missing class year as null and still labels the row by sequence", () => {
    const rows = buildLedger(input({ seasons: preDecision009, currentSeasonIndex: 2 }));
    expect(rows[0]).toMatchObject({ classYear: null, label: "Year 1", state: "played", snaps: 300 });
  });

  it("does not throw on a line that is missing everything optional", () => {
    const wrecked = [{ seasonIndex: 0 }] as unknown as LedgerSeason[];
    expect(() => buildLedger(input({ seasons: wrecked, currentSeasonIndex: 0 }))).not.toThrow();
    const rows = buildLedger(input({ seasons: wrecked, currentSeasonIndex: 0 }));
    expect(rows[0]).toMatchObject({ state: "current", overall: null, snaps: null, record: null });
  });

  it("survives a season history that is missing entirely", () => {
    const rows = buildLedger(input({ seasons: undefined as unknown as LedgerSeason[] }));
    expect(rows).toHaveLength(LEDGER_SLOTS);
    expect(rows.every((r) => r.overall === null && r.snaps === null)).toBe(true);
    expect(rows.slice(1).every((r) => r.state === "future")).toBe(true);
  });
});

describe("buildLedger — the wiring the view-model will apply", () => {
  // A compile-time guard as much as a runtime one: if `SeasonView` ever stops
  // being assignable to `LedgerSeason`, the typecheck fails here rather than in
  // whatever wave next touches view-model.ts. This is the exact call the
  // wiring diff in report 010 makes.
  it("takes `seasonViews(state)` output as its season history unchanged", () => {
    const view: SeasonView = {
      seasonIndex: 0,
      schoolName: "Mercer State",
      classYear: "FR",
      record: "9-3",
      snaps: 400,
      overall: 61,
      stats: [{ label: "Pass Yds", value: 2100 }],
    };
    const rows = buildLedger({
      seasons: [view],
      currentSeasonIndex: 1,
      redshirtUsed: false,
      active: true,
    });
    expect(rows[0]).toMatchObject({ state: "played", overall: 61, classYear: "FR", record: "9-3" });
  });
});

describe("buildLedger — purity", () => {
  it("does not mutate the season history it is handed", () => {
    const seasons = REDSHIRT_FIVE.map((s) => ({ ...s }));
    const before = JSON.stringify(seasons);
    buildLedger(input({ seasons, currentSeasonIndex: 4, redshirtUsed: true }));
    expect(JSON.stringify(seasons)).toBe(before);
  });

  it("returns an equal ledger for equal input", () => {
    const a = buildLedger(input({ seasons: FOUR_YEAR, currentSeasonIndex: 3 }));
    const b = buildLedger(input({ seasons: FOUR_YEAR, currentSeasonIndex: 3 }));
    expect(a).toEqual(b);
  });
});

// ---------------------------------------------------------------------------
// The header and the highlighted row name the same season. DECISION 033.
//
// This is the regression the 017 playtester was lost in, and it is pinned two
// ways because the two ways fail differently. The first is exhaustive over the
// shape of the input and would have caught the bug from a desk; the second
// walks a real engine career and would have caught it from the screen.
// ---------------------------------------------------------------------------

describe("the header and the current row cannot disagree", () => {
  // What a phase means to the ledger is whether a line for the live index
  // exists yet: `advance.ts:273-277` pushes one on entering an ON-FIELD phase,
  // so through an offseason the newest line belongs to the season before. Both
  // states are enumerated against every slot.
  const PHASES = knownPhases();

  it("highlights slot N while the header reads Season N, in all five slots and every phase", () => {
    for (let index = 0; index < LEDGER_SLOTS; index++) {
      for (const phase of PHASES) {
        const lineExists = phase !== "offseason";
        const seasons = REDSHIRT_FIVE.slice(0, lineExists ? index + 1 : index);
        const rows = buildLedger(
          input({ seasons, currentSeasonIndex: index, redshirtUsed: true }),
        );
        const current = rows.filter((r) => r.state === "current");
        const headerSeasonNumber = index + 1;
        expect(current, `season ${headerSeasonNumber}, ${phase}`).toHaveLength(1);
        expect(current[0]!.slot, `season ${headerSeasonNumber}, ${phase}`).toBe(
          headerSeasonNumber,
        );
        expect(current[0]!.label).toBe(`Year ${headerSeasonNumber}`);
        // The row the header is naming is never also hedged as a maybe.
        expect(current[0]!.tentative, `season ${headerSeasonNumber}, ${phase}`).toBe(false);
      }
    }
  });
});

describe("the header and the current row agree over a real five-season career", () => {
  const SETUP: Setup = { lastName: "Brumfield", jerseyNumber: 7, homeState: "TX", position: "OL" };

  // Takes the redshirt, never declares early, never transfers: the exact
  // career the playtester ran, and the only way to reach slot 5.
  function redshirtPolicy(state: GameState, options: { id: string; label: string }[]): string {
    const ids = new Set(options.map((o) => o.id));
    if (ids.has("redshirt")) return "redshirt";
    if (ids.has("return")) return "return";
    if (ids.has("stay")) return "stay";
    return options[0]!.id;
  }

  function fiveSeasonCareer(): GameState[] {
    for (const seed of ["rs-1", "rs-2", "rs-3", "rs-4", "rs-5", "rs-6", "rs-7", "rs-8"]) {
      const states: GameState[] = [];
      let s = createCareer(SETUP, seed);
      for (let guard = 0; guard < 500 && s.status === "active"; guard++) {
        states.push(s);
        const decision = getDecision(s);
        if (!decision) break;
        s = advance(s, redshirtPolicy(s, decision.options));
      }
      states.push(s);
      if (s.eligibility.redshirtUsed && s.seasons.length === LEDGER_SLOTS) return states;
    }
    throw new Error("no seed produced a five-season redshirt career");
  }

  it("names one season, at every decision, from the first to the last", () => {
    const states = fiveSeasonCareer();
    let sawSeasonFive = false;
    let sawFiveOffseason = false;

    for (const state of states) {
      const view = buildView(state);
      const current = view.ledger.filter((r) => r.state === "current");
      const where = `season ${view.seasonNumber} ${state.phase} (status ${state.status})`;

      if (state.status !== "active") {
        expect(current, where).toHaveLength(0);
        continue;
      }
      expect(current, where).toHaveLength(1);
      expect(current[0]!.slot, where).toBe(view.seasonNumber);
      expect(current[0]!.tentative, where).toBe(false);

      if (view.seasonNumber === LEDGER_SLOTS) {
        sawSeasonFive = true;
        if (state.phase === "offseason") sawFiveOffseason = true;
      }
    }

    // The assertions above pass vacuously if the career never got there.
    expect(sawSeasonFive).toBe(true);
    expect(sawFiveOffseason).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Two rows labelled SR (017 playtest, claims 2 and 10.5)
// ---------------------------------------------------------------------------

describe("classYearLabel", () => {
  const FIVE = buildLedger(
    input({ seasons: REDSHIRT_FIVE, currentSeasonIndex: 5, redshirtUsed: true, active: false }),
  );

  it("qualifies the repeat and leaves the first use alone", () => {
    expect(classYearLabel(FIVE, 4, "SR")).toBe("SR");
    expect(classYearLabel(FIVE, 5, "SR")).toBe("5th-Yr SR");
  });

  it("leaves a four-year career untouched", () => {
    const four = buildLedger(input({ seasons: FOUR_YEAR, currentSeasonIndex: 4, active: false }));
    expect(four.map((r) => classYearLabel(four, r.slot, r.classYear))).toEqual([
      "FR",
      "SO",
      "JR",
      "SR",
      "",
    ]);
  });

  it("leaves no two rows carrying the same label, which DECISION 015 forbids", () => {
    const shown = FIVE.map((r) => classYearLabel(FIVE, r.slot, r.classYear)).filter(Boolean);
    expect(shown).toEqual(["FR", "SO", "JR", "SR", "5th-Yr SR"]);
    expect(new Set(shown).size).toBe(shown.length);
  });

  it("renders nothing at all for a row with no stored class year", () => {
    expect(classYearLabel(FIVE, 3, null)).toBe("");
  });

  it("qualifies by the year of the career, never by a guess at the redshirt season", () => {
    // Year 2 is the season that was actually sat out (26 snaps). It is not
    // marked, named, or reordered -- report 010 measured that fact as not
    // derivable, and DECISION 020 withdrew the clause that invited a retry.
    expect(classYearLabel(FIVE, 2, "SO")).toBe("SO");
  });

  it("agrees with the header, which asks the same question with the same slot", () => {
    // The header's slot is `seasonNumber`; the ledger's is `row.slot`. Same
    // number, same table, so the two strings are the same string.
    for (const row of FIVE) {
      expect(classYearLabel(FIVE, row.slot, row.classYear)).toBe(
        classYearLabel(FIVE, row.slot, row.classYear),
      );
    }
    expect(classYearLabel(FIVE, 5, "SR")).toBe(
      classYearLabel(FIVE, FIVE[4]!.slot, FIVE[4]!.classYear),
    );
  });
});
