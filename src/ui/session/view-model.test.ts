import { describe, it, expect } from "vitest";
import { createCareer, advance, getDecision, ALL_POSITIONS, ALL_SCHOOL_TRAITS, type GameState, type PendingDecision, type Setup } from "../../engine/index";
import { CONTENT } from "../../content/index";
import { buildSummary, buildView, cardAccount, groupMoments, hubFacts, railView, remainderFacts } from "./view-model";
import { reducer, INITIAL_STATE } from "./reducer";
import type { CardAccount, CareerView, MomentView, RailView, SeasonView, UiState } from "./types";

// The hidden-mechanics rule, enforced at the one boundary that can enforce it.
// Tier logic and the transfer rebuild loop stay implicit; school traits are
// discovered through replay and never stated; draftStock, probability, weight
// and EV are never rendered.
const FORBIDDEN_KEYS = [
  "draftStock",
  "probability",
  "weight",
  "tier",
  "snapModifier",
  "trait",
  "schoolTrait",
  // "overall" is deliberately absent: it is the player's own progression stat
  // and IS rendered. "character" stays forbidden as a number -- see below.
  "character",
  "rngCursor",
  "pendingEffects",
  "phaseAbs",
];

// `pick` defaults to the first option, which is what every caller before this
// wave wanted. It is a parameter now because a first-option walk never reaches
// a transfer hub -- options[0] on the declare hub is "declare", which ends the
// career -- so the cards DECISION 056 is about are unreachable without it.
function playThrough(
  seed: string,
  position: Setup["position"],
  pick: (options: number) => number = () => 0,
): UiState[] {
  const setup: Setup = { lastName: "Kuri", jerseyNumber: 7, homeState: "TX", position };
  let ui = reducer(INITIAL_STATE, { type: "start", setup, seed });
  const states: UiState[] = [ui];
  for (let guard = 0; guard < 500; guard++) {
    if (!ui.state) break;
    if (ui.resolved) {
      ui = reducer(ui, { type: "continue" });
      states.push(ui);
      continue;
    }
    const d = getDecision(ui.state);
    if (!d) break;
    ui = reducer(ui, { type: "choose", optionId: d.options[pick(d.options.length)]!.id });
    states.push(ui);
    if (ui.screen === "summary") break;
  }
  return states;
}

describe("CareerView boundary", () => {
  it("never leaks a mechanic, across every position", () => {
    for (const position of ALL_POSITIONS) {
      for (let i = 0; i < 4; i++) {
        for (const ui of playThrough(`vm-${position}-${i}`, position)) {
          if (!ui.state) continue;
          const view = buildView(ui.state);
          const keys = new Set<string>();
          const walk = (v: unknown): void => {
            if (Array.isArray(v)) return v.forEach(walk);
            if (v && typeof v === "object") {
              for (const [k, val] of Object.entries(v)) {
                keys.add(k);
                walk(val);
              }
            }
          };
          walk(view);
          for (const forbidden of FORBIDDEN_KEYS) {
            expect(keys.has(forbidden), `${forbidden} leaked for ${position}`).toBe(false);
          }
          // `character` is deliberately NOT exposed as a number -- it moves
          // draft stock by about ±7.5 against overall's ~82, so an integer
          // would overstate it by an order of magnitude. The band phrase is
          // the only character read a screen can render.
          expect(keys.has("character")).toBe(false);
          expect(typeof view.trust).toBe("string");
        }
      }
    }
  });

  it("exposes overall as a number — the player's own progression stat", () => {
    // Deliberate, and the inverse of `character`. Hiding it behind bands
    // suppressed ~3/4 of progression feedback; see view-model.ts's note.
    const setup: Setup = { lastName: "Kuri", jerseyNumber: 7, homeState: "TX", position: "QB" };
    const view = buildView(createCareer(setup, "vm-ovr"));
    expect(typeof view.overall).toBe("number");
    expect(view.overall).toBeGreaterThan(0);
  });

  it("keeps the band phrase as a gloss on the number, not a replacement", () => {
    const setup: Setup = { lastName: "Kuri", jerseyNumber: 7, homeState: "TX", position: "QB" };
    const view = buildView(createCareer(setup, "vm-gloss"));
    expect(view.standing.length).toBeGreaterThan(0);
    expect(view.standing).not.toContain(String(view.overall));
  });

  it("never names a school trait in rendered text", () => {
    for (const ui of playThrough("vm-traits", "QB")) {
      if (!ui.state) continue;
      const json = JSON.stringify(buildView(ui.state));
      for (const trait of ALL_SCHOOL_TRAITS) {
        expect(json.includes(trait)).toBe(false);
      }
    }
  });

  it("reports no school before Signing Day rather than a blank", () => {
    const setup: Setup = { lastName: "Kuri", jerseyNumber: 7, homeState: "TX", position: "QB" };
    expect(buildView(createCareer(setup, "vm-uncommitted")).schoolName).toBeNull();
  });

  it("resolves school ids to display names", () => {
    const setup: Setup = { lastName: "Kuri", jerseyNumber: 7, homeState: "TX", position: "QB" };
    let s = createCareer(setup, "vm-names");
    const d = getDecision(s)!;
    s = advance(s, d.options[0]!.id);
    const view = buildView(s);
    expect(view.schoolName).not.toBeNull();
    expect(view.schoolName).not.toBe(s.school.schoolId);
    expect(view.schoolName!.length).toBeGreaterThan(1);
  });

  it("exposes a summary only once the career is terminal", () => {
    for (const ui of playThrough("vm-summary", "QB")) {
      if (!ui.state) continue;
      const view = buildView(ui.state);
      expect(view.summary === null).toBe(ui.state.status === "active");
    }
  });
});

// DECISION 014. `simulateTeamRecord` runs once, at the end of the postseason
// phase; the season line is pushed with zeros and stays that way all season.
// `0-0` is not a display bug, it is the absence of a record, and the view-model
// is where the two get told apart.
describe("the season record only exists once it has been played", () => {
  it("reports null, not 0-0, for a season the resolver has not reached", () => {
    let sawALiveSeason = false;
    for (const position of ALL_POSITIONS) {
      for (const ui of playThrough(`vm-record-${position}`, position)) {
        if (!ui.state) continue;
        const view = buildView(ui.state);
        const line = ui.state.seasons[ui.state.seasons.length - 1];
        if (line && line.seasonIndex === ui.state.seasonIndex) {
          sawALiveSeason = true;
          // The engine's own value is a literal 0-0 here. The view must not
          // pass it through, must not substitute a placeholder string, and
          // must not estimate one from anything else.
          expect(line.teamWins).toBe(0);
          expect(line.teamLosses).toBe(0);
          expect(view.seasonRecord).toBeNull();
          expect(view.season!.record).toBeNull();
          expect(view.season!.inProgress).toBe(true);
        }
        expect(view.seasonRecord).not.toBe("0-0");
        expect(view.season?.record).not.toBe("0-0");
      }
    }
    expect(sawALiveSeason).toBe(true);
  });

  it("never shows a record for the season currently being played", () => {
    // Verified across every position: the resolver assigns W-L and the season
    // index rolls over inside the same tick, so there is no observable state in
    // which the current season has a record. If the engine ever changes that,
    // this asserts the view-model follows rather than guesses.
    for (const position of ALL_POSITIONS) {
      for (const ui of playThrough(`vm-nolive-${position}`, position)) {
        if (!ui.state) continue;
        expect(buildView(ui.state).seasonRecord).toBeNull();
      }
    }
  });

  it("reports a real record once the season has closed out", () => {
    let sawAClosedSeason = false;
    for (const ui of playThrough("vm-closed", "QB")) {
      if (!ui.state) continue;
      const view = buildView(ui.state);
      if (view.season && !view.season.inProgress) {
        sawAClosedSeason = true;
        expect(view.season.record).toMatch(/^\d+-\d+$/);
        expect(view.season.record).not.toBe("0-0"); // a played season has games
      }
      for (const season of view.summary?.seasons ?? []) {
        if (season.seasonIndex < ui.state.seasonIndex) expect(season.record).not.toBeNull();
      }
    }
    expect(sawAClosedSeason).toBe(true);
  });

  it("gives the summary a null record for a season that never finished", () => {
    // A career ended by an `ending` effect mid-season leaves a line the
    // resolver never reached. That row is blank, not 0-0.
    const setup: Setup = { lastName: "Kuri", jerseyNumber: 7, homeState: "TX", position: "QB" };
    let s = createCareer(setup, "vm-unfinished");
    const d = getDecision(s)!;
    s = advance(s, d.options[0]!.id); // sign, which pushes no line yet
    while (s.seasons.length === 0 && s.status === "active") {
      const next = getDecision(s);
      if (!next) break;
      s = advance(s, next.options[0]!.id);
    }
    const view = buildView(s);
    expect(view.season).not.toBeNull();
    expect(view.season!.record).toBeNull();
  });
});

describe("the live season line", () => {
  it("carries snaps and stats during the season, when they are real", () => {
    let withStats = 0;
    for (const ui of playThrough("vm-live", "QB")) {
      if (!ui.state) continue;
      const view = buildView(ui.state);
      if (!view.season?.inProgress) continue;
      expect(view.season.snaps).toBeGreaterThanOrEqual(0);
      expect(view.season.seasonNumber).toBe(ui.state.seasonIndex + 1);
      for (const stat of view.season.stats) {
        expect(typeof stat.label).toBe("string");
        expect(stat.label.length).toBeGreaterThan(0);
        expect(stat.value).not.toBe(0); // zeroes are omitted, not rendered
      }
      if (view.season.stats.length > 0) withStats++;
    }
    expect(withStats).toBeGreaterThan(0);
  });

  it("has no season line at all before the first on-field phase", () => {
    const setup: Setup = { lastName: "Kuri", jerseyNumber: 7, homeState: "TX", position: "QB" };
    const view = buildView(createCareer(setup, "vm-preseason"));
    expect(view.season).toBeNull();
    expect(view.seasonRecord).toBeNull();
  });

  it("labels the stat line by position — a QB throws ints, a DB catches them", () => {
    // The one stat whose name means opposite things by position. Both go
    // through labels.ts; this asserts the live line uses that layer rather
    // than a second, flat one.
    const qb = withInt("QB", "vm-ints-qb");
    const db = withInt("DSKILL", "vm-ints-db");
    expect(qb).toBe("INT Thrown");
    expect(db).toBe("INT");
    expect(qb).not.toBe(db);
  });
});

/** Force an `ints` line onto a real in-progress season and read back its label. */
function withInt(position: Setup["position"], seed: string): string {
  for (const ui of playThrough(seed, position)) {
    if (!ui.state) continue;
    const line = ui.state.seasons[ui.state.seasons.length - 1];
    if (!line || line.seasonIndex !== ui.state.seasonIndex) continue;
    const state = structuredClone(ui.state);
    state.seasons[state.seasons.length - 1]!.stats.ints = 3;
    const stat = buildView(state).season!.stats.find((v) => v.value === 3 && v.label.includes("INT"));
    if (stat) return stat.label;
  }
  throw new Error(`no in-progress season found for ${position}`);
}

describe("where in the season", () => {
  it("puts a display-ready phase label on the view, never the raw id", () => {
    const RAW_PHASE_IDS = ["offseason", "nonconf", "conference", "postseason"];
    const seen = new Set<string>();
    for (const position of ALL_POSITIONS) {
      for (const ui of playThrough(`vm-phase-${position}`, position)) {
        if (!ui.state) continue;
        const view = buildView(ui.state);
        expect(view.phaseLabel.length).toBeGreaterThan(0);
        expect(RAW_PHASE_IDS).not.toContain(view.phaseLabel);
        expect(view.seasonNumber).toBe(ui.state.seasonIndex + 1);
        expect(view.seasonNumber).toBeGreaterThan(0);
        seen.add(view.phaseLabel);
      }
    }
    // All four phases are reachable and all four are labelled.
    expect(seen.size).toBe(4);
  });

  it("names nothing `phaseAbs` — the deferred-effect clock is not player-facing", () => {
    // Redundant with the boundary walk above, and deliberately so: the phase
    // work in this file is the thing most likely to reach for that name.
    const keys = new Set<string>();
    const walk = (v: unknown): void => {
      if (Array.isArray(v)) return v.forEach(walk);
      if (v && typeof v === "object") {
        for (const [k, val] of Object.entries(v)) {
          keys.add(k);
          walk(val);
        }
      }
    };
    for (const ui of playThrough("vm-phaseabs", "QB")) {
      if (!ui.state) continue;
      walk(buildView(ui.state));
    }
    for (const forbidden of FORBIDDEN_KEYS) expect(keys.has(forbidden)).toBe(false);
    // And the fields this brief added are present, so the walk above is
    // actually walking them rather than passing vacuously.
    for (const added of ["phaseLabel", "seasonNumber", "season", "inProgress", "snaps"]) {
      expect(keys.has(added), `${added} missing from the view`).toBe(true);
    }
  });
});

// DECISION 009 crossed the frozen-engine line for one read: the OVR each
// season finished at, so the summary can draw the career arc. The field is on
// `SeasonLine`; these assert the view-model actually carries it across, and
// that a save written before it existed renders as an absence rather than a
// `NaN`.
describe("the career arc", () => {
  it("carries the stored per-season overall into the summary", () => {
    let checked = 0;
    for (const position of ALL_POSITIONS) {
      for (const ui of playThrough(`vm-arc-${position}`, position)) {
        if (!ui.state) continue;
        const summary = buildView(ui.state).summary;
        if (!summary) continue;
        expect(summary.seasons.length).toBeGreaterThan(0);
        summary.seasons.forEach((season, i) => {
          const line = ui.state!.seasons[i]!;
          expect(season.overall).toBe(line.overall);
          expect(season.overall).not.toBeNull();
          expect(Number.isFinite(season.overall!)).toBe(true);
          checked++;
        });
      }
    }
    expect(checked).toBeGreaterThan(0);
  });

  it("labels a row with the year it was PLAYED as, not one counted backwards", () => {
    // The whole reason 009 stored it: `enterOffseason` advances the class year
    // on every boundary, so deriving it from the row index is wrong exactly
    // where a redshirt has been taken.
    let checked = 0;
    for (const ui of playThrough("vm-arc-class", "QB")) {
      if (!ui.state) continue;
      const summary = buildView(ui.state).summary;
      if (!summary) continue;
      summary.seasons.forEach((season, i) => {
        expect(season.classYear).toBe(ui.state!.seasons[i]!.classYear);
        expect(season.classYear).not.toBeNull();
        checked++;
      });
    }
    expect(checked).toBeGreaterThan(0);
  });

  it("renders a pre-DECISION-009 save with a null OVR, never NaN or undefined", () => {
    // `localStorage` holds serialized GameStates written before the two fields
    // existed. Strip them from a real terminal career and the rows must still
    // build -- with nothing in the arc column, not a zero and not a guess.
    const terminal = playThrough("vm-arc-oldsave", "QB")
      .map((ui) => ui.state)
      .filter((s): s is NonNullable<typeof s> => s !== null)
      .find((s) => s.status !== "active");
    expect(terminal).toBeDefined();

    const legacy = structuredClone(terminal!) as unknown as Record<string, unknown>;
    for (const line of legacy.seasons as Record<string, unknown>[]) {
      delete line.overall;
      delete line.classYear;
    }
    const summary = buildView(legacy as unknown as typeof terminal & object)!.summary!;
    expect(summary.seasons.length).toBeGreaterThan(0);
    for (const season of summary.seasons) {
      expect(season.overall).toBeNull();
      expect(season.classYear).toBeNull();
      expect(Number.isNaN(season.overall as unknown as number)).toBe(false);
      expect(season.overall).not.toBeUndefined();
      // Everything the old save DID store still renders.
      expect(typeof season.schoolName).toBe("string");
      expect(typeof season.snaps).toBe("number");
    }
    // And the career's final number, which lives on the state and not on the
    // line, is untouched by the absence.
    expect(typeof summary.finalOverall).toBe("number");
  });

  it("survives a stored overall that serialized to a non-number", () => {
    const terminal = playThrough("vm-arc-nan", "QB")
      .map((ui) => ui.state)
      .filter((s): s is NonNullable<typeof s> => s !== null)
      .find((s) => s.status !== "active")!;
    const broken = structuredClone(terminal) as unknown as Record<string, unknown>;
    const lines = broken.seasons as Record<string, unknown>[];
    lines[0]!.overall = Number.NaN;
    if (lines[1]) lines[1]!.overall = null;
    const summary = buildView(broken as unknown as typeof terminal & object)!.summary!;
    expect(summary.seasons[0]!.overall).toBeNull();
    if (summary.seasons[1]) expect(summary.seasons[1]!.overall).toBeNull();
  });
});

// Measured over 700 careers (300 full four-year, 400 `random`): every repeated
// moment string is the same moment earned in a different season, and no repeat
// ever shares a season index or is pushed twice by one `advance()`. So the
// timeline groups rather than dedupes -- and the one shape that WOULD be a bug
// collapses into a count.
describe("the moments timeline", () => {
  it("keeps a moment earned again in a later season as its own entry", () => {
    let sawARealRepeat = false;
    for (const position of ALL_POSITIONS) {
      for (const ui of playThrough(`vm-moments-${position}`, position)) {
        if (!ui.state) continue;
        const summary = buildView(ui.state).summary;
        if (!summary) continue;
        const byItem = new Map<string, number[]>();
        for (const m of summary.moments) {
          byItem.set(m.item, [...(byItem.get(m.item) ?? []), m.seasonIndex]);
        }
        for (const [, seasons] of byItem) {
          if (seasons.length > 1) {
            sawARealRepeat = true;
            // Every entry that survived is in a season of its own.
            expect(new Set(seasons).size).toBe(seasons.length);
          }
        }
        // Nothing is lost: the engine's moments and the view's total agree.
        const total = summary.moments.reduce((n, m) => n + m.count, 0);
        expect(total).toBe(ui.state.moments.length);
      }
    }
    expect(sawARealRepeat).toBe(true);
  });

  it("collapses the same moment recorded twice inside one season into a count", () => {
    const terminal = playThrough("vm-moments-dup", "QB")
      .map((ui) => ui.state)
      .filter((s): s is NonNullable<typeof s> => s !== null)
      .find((s) => s.status !== "active" && s.moments.length > 0)!;
    const doubled = structuredClone(terminal);
    const first = doubled.moments[0]!;
    doubled.moments.splice(1, 0, { ...first });
    const summary = buildView(doubled).summary!;
    const entry = summary.moments.find((m) => m.item === first.item && m.seasonIndex === first.seasonIndex)!;
    expect(entry.count).toBe(2);
    // One row, not two, and the count still totals the engine's list.
    expect(summary.moments.filter((m) => m.item === first.item && m.seasonIndex === first.seasonIndex)).toHaveLength(1);
    expect(summary.moments.reduce((n, m) => n + m.count, 0)).toBe(doubled.moments.length);
  });

  it("keeps the season each moment belongs to, so the timeline can group by it", () => {
    let checked = 0;
    for (const ui of playThrough("vm-moments-season", "OSKILL")) {
      if (!ui.state) continue;
      const summary = buildView(ui.state).summary;
      if (!summary) continue;
      for (const m of summary.moments) {
        expect(Number.isInteger(m.seasonIndex)).toBe(true);
        expect(m.seasonIndex).toBeGreaterThanOrEqual(0);
        expect(m.glyph.length).toBeGreaterThan(0);
        checked++;
      }
    }
    expect(checked).toBeGreaterThan(0);
  });
});

// DECISION 019, second half. The rail reads the stamp for the season's
// identity and read the LIVE view for the season line, so at a phase boundary
// the two halves described two different moments: found by hand at
// `localhost:5173` as `Offseason - 175 snaps - 362 Pass Yds`, an offseason
// that has somehow played a season, one tick after the same rail correctly
// read `0 snaps`. `advance()` can simulate a whole phase before it returns;
// every cell of the rail has to come from the same side of that call.
describe("the rail describes one moment, not two", () => {
  /**
   * Walk with the reducer and, for every resolved card, compare the rail the
   * screen would draw against the numbers that were on screen when the choice
   * was made.
   */
  function walkRails(seed: string, position: Setup["position"]) {
    const setup: Setup = { lastName: "Kuri", jerseyNumber: 7, homeState: "TX", position };
    let ui = reducer(INITIAL_STATE, { type: "start", setup, seed });
    const cards: { before: CareerView; rail: RailView; live: CareerView }[] = [];
    for (let guard = 0; guard < 500 && ui.screen !== "summary"; guard++) {
      if (ui.resolved) {
        ui = reducer(ui, { type: "continue" });
        continue;
      }
      if (!ui.state) break;
      const d = getDecision(ui.state);
      if (!d) break;
      const before = buildView(ui.state);
      const next = reducer(ui, { type: "choose", optionId: d.options[0]!.id });
      if (next === ui) break;
      ui = next;
      if (ui.resolved && ui.state) {
        const live = buildView(ui.state);
        const rail = railView(live, ui.resolved);
        // A one-option beat can auto-resolve behind the card just answered
        // (DECISION 018), in which case the stamp belongs to that later card
        // and `before` is not its moment. Identity says which happened.
        const sameCard =
          rail.seasonNumber === before.seasonNumber && rail.phaseLabel === before.phaseLabel;
        if (sameCard) cards.push({ before, rail, live });
      }
    }
    return cards;
  }

  it("draws the season line that was on screen when the choice was made", () => {
    let checked = 0;
    let diverged = 0;
    for (const position of ALL_POSITIONS) {
      for (const { before, rail, live } of walkRails(`vm-rail-${position}`, position)) {
        checked++;
        // The frozen half and the live half of the same rail must name the
        // same moment: the phase comes from the stamp, so the snaps, the stat
        // line and the record have to come from there too.
        expect(rail.season?.snaps ?? null).toBe(before.season?.snaps ?? null);
        expect(rail.season?.record ?? null).toBe(before.season?.record ?? null);
        expect(rail.season?.stats ?? null).toEqual(before.season?.stats ?? null);
        expect(rail.season).toEqual(before.season);
        // The line's own season number may legitimately trail the header's:
        // during an offseason the rail reports the season just completed
        // (DECISION 013), which is the row those three cards ask for.
        expect(rail.season?.seasonNumber ?? rail.seasonNumber).toBeLessThanOrEqual(
          rail.seasonNumber,
        );
        if ((rail.season?.snaps ?? null) !== (live.season?.snaps ?? null)) diverged++;
      }
    }
    expect(checked).toBeGreaterThan(20);
    // The bug is real and it is not rare: if this hits zero the season line
    // has stopped being frozen and the assertions above are passing vacuously.
    expect(diverged).toBeGreaterThan(0);
  });

  it("never turns a frozen line into a `0-0` (DECISION 014)", () => {
    for (const position of ALL_POSITIONS) {
      for (const { rail } of walkRails(`vm-rail-rec-${position}`, position)) {
        expect(rail.season?.record).not.toBe("0-0");
      }
    }
  });

  it("falls back to the live view for a save with no stamp, and never past one that has it", () => {
    const live = buildView(createCareer({ lastName: "Kuri", jerseyNumber: 7, homeState: "TX", position: "QB" }, "vm-rail-null"));
    const withLine: CareerView = {
      ...live,
      season: { seasonNumber: 2, schoolName: "Toledo", record: "9-3", snaps: 517, stats: [], inProgress: false },
    };
    const card = {
      title: "t",
      description: "",
      choiceLabel: "c",
      outcome: "o",
      hub: null,
      narrated: false,
      stamp: null,
      overallBefore: null,
      trustBefore: null,
      account: null,
      remainder: null,
    };

    // No stamp at all -- a save written before it existed. Every cell falls
    // back to the live view rather than to `undefined` or to a zero.
    const noStamp = railView(withLine, card);
    expect(noStamp.season).toEqual(withLine.season);
    expect(noStamp.phaseLabel).toBe(withLine.phaseLabel);
    expect(noStamp.seasonNumber).toBe(withLine.seasonNumber);

    // A stamp taken before the first on-field phase froze a null line. That
    // null is the answer, not a miss: falling through to the live line is how
    // the rail came to describe two moments in the first place.
    const stamped = railView(withLine, {
      ...card,
      stamp: { seasonNumber: 1, classYear: "FR", phaseLabel: "Offseason", schoolName: null, season: null },
    });
    expect(stamped.season).toBeNull();
    expect(stamped.school).toBe("Uncommitted");
    expect(stamped.phaseLabel).toBe("Offseason");
  });
});

// The ending must be able to tell a good career from a bad one. A playtester
// drew Round 7 Pick 2 off a deliberately-bad career and reported "the ending
// is a gold headline regardless of what I did"; #69 and #194 printed
// identically. `verdictMagnitude` is the fix's data half.
describe("the verdict has a range", () => {
  // Constructed rather than played: reaching round 1 and reaching Undrafted
  // from the same harness would need thousands of careers, and the mapping is
  // the thing under test, not the engine's distribution.
  function summaryWith(draft: { round: number; pick: number; undrafted: boolean }) {
    const base = createCareer({ lastName: "Kuri", jerseyNumber: 7, homeState: "TX", position: "QB" }, "vm-mag");
    return buildSummary({
      ...base,
      // An undrafted career still reaches the draft; `Status` has no
      // "undrafted" member and the flag on `draftResult` is what says so.
      status: "drafted" as const,
      draftResult: {
        undrafted: draft.undrafted,
        round: draft.round,
        pick: draft.pick,
        overallPick: draft.undrafted ? 0 : (draft.round - 1) * 32 + draft.pick,
        draftStock: 50,
      },
    });
  }

  it("gives every round its own step, with no call at the far end", () => {
    // One step per round. The five-step version put rounds 2 and 3 on the same
    // step, which is why a playtester asked to rank them could not: they were
    // not close, they were identical.
    expect(summaryWith({ round: 1, pick: 4, undrafted: false }).verdictMagnitude).toBe(8);
    expect(summaryWith({ round: 2, pick: 4, undrafted: false }).verdictMagnitude).toBe(7);
    expect(summaryWith({ round: 3, pick: 4, undrafted: false }).verdictMagnitude).toBe(6);
    expect(summaryWith({ round: 4, pick: 4, undrafted: false }).verdictMagnitude).toBe(5);
    expect(summaryWith({ round: 5, pick: 4, undrafted: false }).verdictMagnitude).toBe(4);
    expect(summaryWith({ round: 6, pick: 4, undrafted: false }).verdictMagnitude).toBe(3);
    expect(summaryWith({ round: 7, pick: 4, undrafted: false }).verdictMagnitude).toBe(2);
    expect(summaryWith({ round: 0, pick: 0, undrafted: true }).verdictMagnitude).toBe(1);
  });

  it("separates the two picks the playtester could not tell apart", () => {
    // #69 overall is Round 3 Pick 5; #194 is Round 7 Pick 2. And the pair
    // report 017 could NOT rank -- Round 2 against Round 3 -- which is the
    // falsifier DECISION 026 pre-registered and DECISION 032 accepted.
    const good = summaryWith({ round: 3, pick: 5, undrafted: false });
    const bad = summaryWith({ round: 7, pick: 2, undrafted: false });
    expect(good.subhead).toBe("#69 overall");
    expect(bad.subhead).toBe("#194 overall");
    expect(good.verdictMagnitude).not.toBe(bad.verdictMagnitude);
    const r2 = summaryWith({ round: 2, pick: 12, undrafted: false });
    const r3 = summaryWith({ round: 3, pick: 21, undrafted: false });
    expect(r2.verdictMagnitude).not.toBe(r3.verdictMagnitude);
    expect(r2.verdictMagnitude).toBeGreaterThan(r3.verdictMagnitude);
  });

  it("gives a career that ended before the draft the quietest step", () => {
    const base = createCareer({ lastName: "Kuri", jerseyNumber: 7, homeState: "TX", position: "QB" }, "vm-mag-bust");
    const busted = buildSummary({ ...base, status: "busted", endingReason: "Career-ending injury" });
    expect(busted.verdictMagnitude).toBe(1);
    expect(busted.wasDrafted).toBe(false);
  });

  it("is a real step on every career the harness plays", () => {
    let seen = 0;
    for (const position of ALL_POSITIONS) {
      for (const ui of playThrough(`vm-mag-${position}`, position)) {
        const summary = ui.state ? buildView(ui.state).summary : null;
        if (!summary) continue;
        expect([1, 2, 3, 4, 5, 6, 7, 8]).toContain(summary.verdictMagnitude);
        seen++;
      }
    }
    expect(seen).toBeGreaterThan(0);
  });
});

// A 7-5 / 5-7 two-season career was given an HONORS block reading "Bowl Win".
// Measured over 600 careers, bowlWin lands on 45.3% and allConference on
// 50.5%: the block fired on 70.5% of all careers. Rarity is what lets the
// screen stop calling a coin-flip result an honour without deleting the fact.
describe("honors are separated from routine results", () => {
  function honorsFor(trophies: Record<string, number>, awards: string[]) {
    const base = createCareer({ lastName: "Kuri", jerseyNumber: 7, homeState: "TX", position: "QB" }, "vm-honors");
    return buildSummary({ ...base, status: "drafted", trophies: { ...base.trophies, ...trophies }, awards: awards as never[] }).honors;
  }

  it("files a bowl win and an all-conference nod below a distinction", () => {
    const honors = honorsFor({ bowlWin: 2 }, ["allConference", "heisman"]);
    const byId = Object.fromEntries(honors.map((h) => [h.id, h.rarity]));
    expect(byId.heisman).toBe(3);
    expect(byId.allConference).toBe(1);
    expect(byId.bowlWin).toBe(1);
    // Rarest first, so the screen never has to sort.
    expect(honors.map((h) => h.rarity)).toEqual([...honors.map((h) => h.rarity)].sort((a, b) => b - a));
    expect(honors.find((h) => h.id === "bowlWin")?.count).toBe(2);
  });

  it("leaves the deliberately-bad career with nothing a screen can call an honour", () => {
    const honors = honorsFor({ bowlWin: 1 }, ["allConference"]);
    expect(honors.length).toBe(2);
    expect(honors.every((h) => h.rarity === 1)).toBe(true);
  });

  it("does not invent an entry for a trophy nobody won (DECISION 014)", () => {
    expect(honorsFor({ bowlWin: 0, confTitle: 0 }, [])).toEqual([]);
  });

  it("treats an unknown id as a distinction rather than silently filing it away", () => {
    const honors = honorsFor({ someNewTrophy: 1 }, []);
    expect(honors[0]?.rarity).toBe(2);
  });

  it("leaves `awards` and `trophies` untouched for share.ts and the log", () => {
    const base = createCareer({ lastName: "Kuri", jerseyNumber: 7, homeState: "TX", position: "QB" }, "vm-honors-compat");
    const summary = buildSummary({ ...base, status: "drafted", trophies: { ...base.trophies, bowlWin: 1 }, awards: ["allConference"] as never[] });
    expect(summary.awards).toEqual(["All-Conference"]);
    expect(summary.trophies).toEqual([{ label: "Bowl Win", count: 1 }]);
  });
});

// ---------------------------------------------------------------------------
// B23 / DECISION 037. The facts a hub resolution is composed from, since there
// is no authored prose behind Signing Day, the portal or the declare card and
// `src/content/**` is frozen.
// ---------------------------------------------------------------------------
describe("hubFacts", () => {
  const setup: Setup = { lastName: "Kuri", jerseyNumber: 7, homeState: "TX", position: "QB" };

  it("says nothing when the career is over", () => {
    // Declaring IS the next screen. A card in front of the draft verdict is a
    // click, not a beat.
    const before = createCareer(setup, "vm-hub-terminal");
    const after = { ...before, status: "drafted" as const, school: { ...before.school, schoolId: "other" } };
    expect(hubFacts({ ...before, school: { ...before.school, schoolId: "here" } }, after)).toBeNull();
  });

  it("says nothing before there is a school to have left", () => {
    // Signing Day. The career holds no school id at all until it resolves, so
    // the only "move" available is from nowhere to the school the player chose
    // one click ago and the rail is already printing.
    const before = createCareer(setup, "vm-hub-signing");
    expect(before.school.schoolId).toBe("");
    const after = { ...before, school: { ...before.school, schoolId: "baylor" } };
    expect(hubFacts(before, after)).toBeNull();
  });

  it("says nothing when neither the school nor overall moved", () => {
    // The empty ceremonial card, refused.
    const s = { ...createCareer(setup, "vm-hub-nochange"), school: { schoolId: "baylor", tier: 3 as const } };
    expect(hubFacts(s, s)).toBeNull();
  });

  it("names both schools on a move", () => {
    const before = { ...createCareer(setup, "vm-hub-move"), school: { schoolId: "utsa", tier: 2 as const } };
    const after = { ...before, school: { schoolId: "baylor", tier: 3 as const } };
    const facts = hubFacts(before, after)!;
    expect(facts.from).toBeTruthy();
    expect(facts.to).toBeTruthy();
    expect(facts.from).not.toBe(facts.to);
    // Display names, never ids -- and never the tier that is sitting right
    // beside them on the state object.
    expect(JSON.stringify(facts)).not.toContain("tier");
  });

  it("leaves the school unnamed when only overall moved", () => {
    // "Stay at Baylor", 75 -> 82. The delta is the whole card; repeating the
    // school would only restate the button that was just pressed.
    const before = { ...createCareer(setup, "vm-hub-ovr"), school: { schoolId: "baylor", tier: 3 as const } };
    const after = { ...before, overall: before.overall + 7 };
    const facts = hubFacts(before, after)!;
    expect(facts.to).toBeNull();
    expect(facts.from).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// REMOVED with the declare decision (DECISION 057). This file held a suite --
// "the declare card states the eligibility that remains" (B25 / DECISION 038)
// -- asserting that one line of fact printed under the declare prompt, counted
// down correctly, appeared on no other card, and leaked nothing about the
// player. The card is gone, `CareerView.decisionNote` is gone with it, and
// there is nothing left to assert. DECISION 025's refusal still stands for
// every card that remains: no projection, no draft stock, no round estimate.
// ---------------------------------------------------------------------------

// DECISION 046, cause 1 and cause 2. A resolved card's number described
// everything that happened inside its `advance()` -- its own outcome, plus an
// earlier card's deferred effect coming due, plus a season of development --
// and the playtester logged six cards whose prose the number therefore
// contradicted. The prose is correct in all six (report 025 §8), so the six
// rows of that table are the six cases below.
describe("a card accounts for what it did", () => {
  const setup: Setup = { lastName: "Kuri", jerseyNumber: 7, homeState: "TX", position: "QB" };

  function decisionFor(eventId: string): PendingDecision {
    return { eventId, title: "", description: "", options: [] };
  }

  /** The authored prose for one branch of one option, read from the bundle so
      the test accounts the outcome the engine would actually have reported. */
  function prose(eventId: string, optionId: string, branch: "positive" | "negative"): string {
    const option = CONTENT.events.find((e) => e.id === eventId)!.options.find((o) => o.id === optionId)!;
    const outcome = branch === "positive" ? option.positiveOutcome : option.negativeOutcome!;
    return outcome.description;
  }

  /** Account one outcome against a real career state. `advance()` applies a
      chosen outcome's effects FIRST, so a before-state with an untouched
      queue and an after-state carrying the prose is exactly the shape
      `cardAccount` reads in the reducer. */
  function account(
    eventId: string,
    optionId: string,
    branch: "positive" | "negative",
    over?: Partial<GameState>,
  ): CardAccount | null {
    const before: GameState = { ...createCareer(setup, "acct"), ...over };
    const after: GameState = {
      ...before,
      lastOutcome: { description: prose(eventId, optionId, branch) },
    };
    return cardAccount(before, after, decisionFor(eventId), optionId);
  }

  it("row 1 — The Position Switch: the fit not coming together is not a +5", () => {
    // "The fit never quite comes together, and it shows on the depth chart."
    // showed +5. The outcome authors a deferred -2 and nothing else; the +5 was
    // a season of development landing on top of it. Every deferred effect in
    // the bundle is delayPhases: 1 and lands inside its own card's advance, so
    // the -2 IS this card's own number -- and the development is not.
    expect(prose("position-switch", "commit", "negative")).toContain("never quite comes together");
    expect(account("position-switch", "commit", "negative")).toEqual({
      own: -2,
      injury: false,
      lockerRoom: null,
      later: null,
    });
  });

  it("row 2 — The Ticket Hookup: getting caught is a cost and nothing else", () => {
    // Was `character -6, overall +1`, which rendered as a reward for being
    // caught. Wave 19 removed the overall gain from the caught branch only:
    // the card stays a gamble (the got-away-with-it branch still pays +1) but
    // getting caught is now pure downside. DECISION 002 forbids the integer,
    // so the character half is reported as a direction and said in words.
    expect(prose("offfield-ticket-hookup", "sell-them", "negative")).toContain("Compliance flags");
    expect(account("offfield-ticket-hookup", "sell-them", "negative")).toEqual({
      own: 0,
      injury: false,
      lockerRoom: "cost",
      later: null,
    });
  });

  it("row 3 — The Long Attempt: a missed 57-yarder is a -1, not a +1", () => {
    // "off the upright and away" authors -1. The +1 the playtester saw was
    // somebody else's.
    expect(prose("the-long-attempt", "tell-him-youve-got-it", "negative")).toContain("off the upright");
    expect(account("the-long-attempt", "tell-him-youve-got-it", "negative")?.own).toBe(-1);
  });

  it("row 4 — Bowl Opt-Out: zero new risk, zero new tape, zero OVR", () => {
    // `effects: []`. The card said +2.
    expect(prose("bowl-opt-out", "sit", "positive")).toContain("Zero new risk");
    expect(account("bowl-opt-out", "sit", "positive")).toEqual({
      own: 0,
      injury: false,
      lockerRoom: null,
      later: null,
    });
  });

  it("row 5 — Cutting the Line: nobody notices, and nothing moves", () => {
    // `effects: []` again, shown as -3. Waiting your turn costs nothing, and
    // the card is now allowed to say so.
    expect(prose("offfield-training-table", "wait-your-turn", "positive")).toContain("Nobody notices");
    expect(account("offfield-training-table", "wait-your-turn", "positive")?.own).toBe(0);
    // The other option on the same card is the inverse shape: it moves no OVR
    // at all and its whole cost is character, which is exactly the card that
    // must not read as a free win.
    expect(account("offfield-training-table", "cut-the-line", "positive")).toEqual({
      own: 0,
      injury: false,
      lockerRoom: "cost",
      later: null,
    });
  });

  it("row 6 — Somebody Rolls Up On You: the sprain is the card's own -5", () => {
    // This one the old number got right, by coincidence: the -5 is the ankle's
    // `overallDelta` and nothing else landed. What was missing is that it is a
    // loan -- the engine restores the full amount when the injury heals, and
    // the card now says so rather than leaving the restoration to reappear on
    // an unrelated card as somebody else's remainder.
    expect(prose("the-knee", "cart", "positive")).toContain("Sprain, not a tear");
    expect(account("the-knee", "cart", "positive")).toEqual({
      own: -CONTENT.injuries.ankle!.overallDelta,
      injury: true,
      lockerRoom: null,
      later: null,
    });
  });

  it("reads the branch that fired from its prose, with no engine change", () => {
    // The engine reports `lastOutcome: { description }` and strips the
    // positive/negative flag on purpose (DECISION 001). Two candidate outcomes
    // per option, distinct descriptions: the description identifies the
    // branch, from content.
    const positive = account("position-switch", "commit", "positive");
    const negative = account("position-switch", "commit", "negative");
    expect(positive?.own).toBe(2);
    expect(negative?.own).toBe(-2);
  });

  it("refuses to guess: prose that matches nothing gets no account", () => {
    const before = createCareer(setup, "acct-miss");
    const after: GameState = { ...before, lastOutcome: { description: "Something else entirely." } };
    expect(cardAccount(before, after, decisionFor("position-switch"), "commit")).toBeNull();
    // An event or option that is no longer in the bundle, which is the drift
    // `isUnplayable` guards, is the same answer.
    expect(cardAccount(before, after, decisionFor("no-such-event"), "commit")).toBeNull();
    // And a hub card, which authors no prose at all: DECISION 037 already
    // settled that its number is the movement across the click.
    const hub: GameState = { ...before, lastOutcome: undefined };
    expect(cardAccount(before, hub, decisionFor("transfer"), "stay")).toBeNull();
  });

  it("accounts the redshirt card, whose prose the engine reads off content", () => {
    // The one decision outside `content.events` that authors prose. Its two
    // descriptions and its bump/sink amounts are both in `content.redshirt`,
    // so it can be accounted like any other card.
    const before = createCareer(setup, "acct-rs");
    const bump: GameState = { ...before, lastOutcome: { description: CONTENT.redshirt.bumpDescription } };
    const sink: GameState = { ...before, lastOutcome: { description: CONTENT.redshirt.sinkDescription } };
    expect(cardAccount(before, bump, decisionFor("redshirt"), "redshirt")?.own).toBe(CONTENT.redshirt.bumpOverall);
    expect(cardAccount(before, sink, decisionFor("redshirt"), "redshirt")?.own).toBe(CONTENT.redshirt.sinkOverall);
  });

  it("clamps the way the engine clamps, so the ceiling never leaks into the remainder", () => {
    // At 99 the engine refuses the point. A naive sum would credit the card
    // with a +1 it never got and push a phantom -1 into "everything else".
    expect(account("the-long-attempt", "tell-him-youve-got-it", "positive", { overall: 99 })?.own).toBe(0);
    expect(account("the-long-attempt", "tell-him-youve-got-it", "positive", { overall: 98 })?.own).toBe(1);
  });

  it("keeps a deferred effect out of the card's number while it is still queued", () => {
    // The mirror of row 1. Every deferred effect in the bundle today lands
    // inside its own card's `advance`, because the next decision falls in a
    // later phase; one that does not has not happened yet, and the card says
    // only that something lands later -- never how much, never when.
    const before = createCareer(setup, "acct-deferred");
    const after: GameState = {
      ...before,
      lastOutcome: { description: prose("position-switch", "commit", "negative") },
      pendingEffects: [
        { effect: { kind: "overall", timing: "deferred", amount: -2, delayPhases: 1 }, firePhaseAbs: before.phaseAbs + 1 },
      ],
    };
    expect(cardAccount(before, after, decisionFor("position-switch"), "commit")).toEqual({
      own: 0,
      injury: false,
      lockerRoom: null,
      later: "cost",
    });
  });

  it("never reports character as a number, only as a direction", () => {
    // DECISION 002, still standing. The account carries "cost" or "credit" and
    // no magnitude, so no screen can print one: character moves draft stock by
    // ~±7.5 against overall's ~82, and an integer would overstate it tenfold.
    const caught = account("offfield-ticket-hookup", "sell-them", "negative")!;
    expect(caught.lockerRoom).toBe("cost");
    expect(JSON.stringify(caught)).not.toContain("6");
    const kept = account("bowl-opt-out", "play", "positive")!;
    expect(kept.lockerRoom).toBe("credit");
  });
});

// ---------------------------------------------------------------------------
// What the card did NOT do (DECISION 056; B45, B47)
// ---------------------------------------------------------------------------

// A partial GameState is enough: `remainderFacts` reads exactly four fields and
// is deliberately blind to the rest, so a fixture that carried a whole career
// would hide which four.
function pair(
  before: Partial<GameState>,
  after: Partial<GameState>,
): [GameState, GameState] {
  const base = { injuries: [], pendingEffects: [], seasonIndex: 0 };
  return [{ ...base, ...before } as GameState, { ...base, ...after } as GameState];
}

const hamstring = (remainingPhases: number) => ({
  kind: "injury" as const,
  injuryType: "hamstring",
  remainingPhases,
  restoreAmount: 4,
});

const queued = (amount: number) => ({
  effect: { kind: "overall" as const, timing: "deferred" as const, amount },
  firePhaseAbs: 9,
});

describe("remainderFacts", () => {
  // DECISION 058. Crossing a season boundary used to mean one thing --
  // development -- so the card said so. An upperclassman under the snap floor
  // now LOSES overall at that same boundary, and a sentence reading "a season
  // of development came in" over a three-point drop is worse than the bare
  // number the sentence was added to explain.
  it("separates a season that cost overall from one that granted it", () => {
    const season = (seasonIndex: number, snaps: number, classYear: "SO" | "JR") => ({
      seasonIndex, schoolId: "x", snaps, stats: {}, teamWins: 6, teamLosses: 6,
      overall: 70, classYear,
    });
    const setup = { lastName: "K", jerseyNumber: 7, homeState: "TX", position: "QB" as const };

    // A junior who barely played: the boundary cost him ground.
    const [b1, a1] = pair(
      { seasonIndex: 2, setup, seasons: [season(2, 25, "JR")] },
      { seasonIndex: 3, setup, seasons: [season(2, 25, "JR")] },
    );
    expect(remainderFacts(b1, a1).developed).toBe(true);
    expect(remainderFacts(b1, a1).declined).toBe(true);

    // The same junior, having played: development, as always.
    const [b2, a2] = pair(
      { seasonIndex: 2, setup, seasons: [season(2, 520, "JR")] },
      { seasonIndex: 3, setup, seasons: [season(2, 520, "JR")] },
    );
    expect(remainderFacts(b2, a2).declined).toBe(false);

    // A sophomore who barely played is exempt by design -- the gate that was
    // measured, not a detail (report 034 §2).
    const [b3, a3] = pair(
      { seasonIndex: 1, setup, seasons: [season(1, 25, "SO")] },
      { seasonIndex: 2, setup, seasons: [season(1, 25, "SO")] },
    );
    expect(remainderFacts(b3, a3).declined).toBe(false);
  });

  it("reads a healed injury, and does not read a healing one as healed", () => {
    // The trap this keying exists to avoid: `remainingPhases` decrements on
    // every tick, so an injury that is merely getting closer to healing looks
    // like one record leaving and a different one arriving. It is out of the
    // key for exactly that reason.
    const [b1, a1] = pair({ injuries: [hamstring(1)] }, { injuries: [] });
    expect(remainderFacts(b1, a1).healed).toBe(true);

    const [b2, a2] = pair({ injuries: [hamstring(3)] }, { injuries: [hamstring(2)] });
    expect(remainderFacts(b2, a2).healed).toBe(false);
    expect(remainderFacts(b2, a2).hurt).toBe(false);
  });

  // The other half of that trap, and the one that was live until brief 049.
  // Keying by type alone made "an old hamstring healed AND this card gave you a
  // new one" indistinguishable from "the same hamstring is still there": one
  // record before, one after. The restored points then reached the screen as a
  // bare figure with no sentence under it. `remainingPhases` is the only thing
  // that tells the two apart -- a survivor has decremented, a fresh one has not
  // -- which is why it is out of the key and in the matching.
  //
  // Caught by the falsifier below once the Season Opener gained a second option
  // and the walk reshuffled onto it; it reproduces at HEAD-before-049 over a
  // wider seed sweep, so it was latent, not new.
  it("reports a heal that happened under a new injury of the same type", () => {
    const [before, after] = pair({ injuries: [hamstring(1)] }, { injuries: [hamstring(3)] });
    expect(remainderFacts(before, after).healed).toBe(true);
  });

  it("does not invent a heal when two of the same injury are both still healing", () => {
    const [before, after] = pair(
      { injuries: [hamstring(3), hamstring(2)] },
      { injuries: [hamstring(2), hamstring(1)] },
    );
    expect(remainderFacts(before, after).healed).toBe(false);
  });

  it("does not report a suspension expiring as an injury healing", () => {
    // A suspension lives in the same list with `restoreAmount: 0`. It returns
    // no points, so it is not part of any number and must not be given a
    // sentence that says it was.
    const [before, after] = pair(
      { injuries: [{ kind: "suspension", injuryType: "suspension", remainingPhases: 1, restoreAmount: 0 }] },
      { injuries: [] },
    );
    expect(remainderFacts(before, after).healed).toBe(false);
  });

  it("tells a deferred effect landing from a deferred effect being enqueued", () => {
    const [b1, a1] = pair({ pendingEffects: [queued(-2)] }, { pendingEffects: [] });
    expect(remainderFacts(b1, a1).landed).toBe(true);

    // The card's own outcome queuing one is the opposite fact: `CardAccount.later`
    // reports it, and it must not also be claimed as something that landed.
    const [b2, a2] = pair({ pendingEffects: [] }, { pendingEffects: [queued(-2)] });
    expect(remainderFacts(b2, a2).landed).toBe(false);
  });

  it("reads a season boundary as development, and a new injury as a knock", () => {
    const [b1, a1] = pair({ seasonIndex: 1 }, { seasonIndex: 2 });
    expect(remainderFacts(b1, a1).developed).toBe(true);
    expect(remainderFacts(...pair({ seasonIndex: 1 }, { seasonIndex: 1 })).developed).toBe(false);

    const [b2, a2] = pair({ injuries: [] }, { injuries: [hamstring(3)] });
    expect(remainderFacts(b2, a2).hurt).toBe(true);
  });

  it("carries no size, only presence -- so no hidden quantity can cross", () => {
    // The diff cannot apportion a number between two causes that both fired,
    // and a card that named a split would be inventing one. Presence is what
    // the screen is given, and presence is all there is to give.
    const [before, after] = pair(
      { injuries: [hamstring(1)], pendingEffects: [queued(-7)], seasonIndex: 0 },
      { injuries: [], pendingEffects: [], seasonIndex: 1 },
    );
    const facts = remainderFacts(before, after);
    expect(Object.values(facts).every((v) => typeof v === "boolean")).toBe(true);
    expect(JSON.stringify(facts)).not.toMatch(/[0-9]/);
  });

  it("explains every unattributed figure the screen can print (B45, B47)", () => {
    // The falsifier for the claim that the four causes are COMPLETE, which is
    // what makes the sentence honest rather than plausible.
    //
    // DECISION 056's transferable lesson is that a measurement sharing its
    // fix's assumptions cannot falsify it: report 026 measured cards with
    // authored prose, found 0 failures, and every real failure was a hub card
    // outside that population. So this one is defined over the population the
    // SCREEN draws an unattributed figure for -- hub cards explicitly included
    // -- and it fails if either population turns out to be empty, which is the
    // exact way 026's measurement was able to be right and useless at once.
    //
    // The policy picks randomly rather than always taking the first option:
    // options[0] on the declare hub is "declare", which ends the career before
    // a transfer hub is ever reached, and a first-option walk therefore sees
    // zero of the cards this test exists to cover.
    let rng = 1;
    const pick = (n: number) => Math.floor(((rng = (rng * 1103515245 + 12345) % 2147483648) / 2147483648) * n);

    let hubCards = 0;
    let remainders = 0;
    for (const position of ALL_POSITIONS) {
      for (let s = 0; s < 8; s++) {
        for (const ui of playThrough(`rf${s}-${position}`, position, pick)) {
          const r = ui.resolved;
          if (!r || !ui.state || r.overallBefore === null) continue;
          const total = ui.state.overall - r.overallBefore;
          const hubCard = r.hub !== null && r.account === null;
          const unattributed = hubCard ? total : r.account ? total - r.account.own : 0;
          if (unattributed === 0) continue;
          if (hubCard) hubCards += 1;
          else remainders += 1;

          // Not just "a cause fired" but "a cause the screen will actually
          // SAY": an injury the card's own outcome caused is suppressed down
          // here, because `accountNotes` is already describing it upstairs,
          // and a card left with only that flag would print the bare figure
          // this whole entry is about.
          const f = r.remainder!;
          const ownInjury = r.account?.injury ?? false;
          expect(
            f.healed || f.landed || f.developed || (f.hurt && !ownInjury),
            `an unattributed ${unattributed} with nothing to say for it on "${r.choiceLabel}"`,
          ).toBe(true);
        }
      }
    }
    // Both populations have to be non-empty or the assertion above proved
    // nothing -- which is the exact failure mode 056 is about.
    expect(hubCards).toBeGreaterThan(0);
    expect(remainders).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// B64 / B65 (TASK 048). The rail printed one season's NUMBER over another
// season's FIGURES.
//
// `seasonNumber` comes from `state.seasonIndex`, which `advancePhase`
// increments on leaving the postseason. The snaps, the stat line and the
// record come from `seasons[seasons.length - 1]`, which the engine does not
// push for the new season until the first ON-FIELD phase. So for the whole of
// EVERY offseason the rail reads `Season 4 - 7-5 - 614 snaps - 36 Pancakes`
// while all three of those figures belong to season 3. Measured over 360
// careers: 3,985 screens, about eleven per career.
//
// That is both reported symptoms at once. B64 is reading the figures under the
// number above them -- a redshirt or injury-wrecked line lands under the next
// season's name and the player sees a season they just played reporting almost
// no snaps. B65 is the moment the real line finally arrives: at the first
// on-field phase the same `Season N` heading swaps 614 snaps for 198 and drops
// the record, so a season the player believes is over appears to LOSE snaps
// and stats. Nothing in the engine mutates a closed line -- `schema.ts:326`
// rejects `stat` and `snaps` effects on offseason events and `select-event.ts`
// matches `ev.phase` exactly.
//
// The figures stay: the redshirt and transfer cards are read in the offseason
// and last season's line is the context they need (DECISION 013). What was
// missing is whose season it is.
describe("the rail says which season its figures belong to (B64, B65)", () => {
  function walk(seed: string, position: Setup["position"]) {
    const setup: Setup = { lastName: "Kuri", jerseyNumber: 7, homeState: "TX", position };
    let ui = reducer(INITIAL_STATE, { type: "start", setup, seed });
    const rails: RailView[] = [];
    for (let guard = 0; guard < 500 && ui.screen !== "summary"; guard++) {
      if (ui.resolved) {
        if (ui.state) rails.push(railView(buildView(ui.state), ui.resolved));
        ui = reducer(ui, { type: "continue" });
        continue;
      }
      if (!ui.state) break;
      const d = getDecision(ui.state);
      if (!d) break;
      const next = reducer(ui, { type: "choose", optionId: d.options[0]!.id });
      if (next === ui) break;
      ui = next;
    }
    return rails;
  }

  it("labels the line exactly when it is not the season in the header", () => {
    let labelled = 0;
    let unlabelled = 0;
    for (const position of ALL_POSITIONS) {
      for (const rail of walk(`vm-rail-label-${position}`, position)) {
        if (!rail.season) {
          expect(rail.seasonLabel).toBeNull();
          continue;
        }
        if (rail.season.seasonNumber === rail.seasonNumber) {
          // The figures are this season's. The heading already names it and a
          // second name would be chrome.
          expect(rail.seasonLabel).toBeNull();
          unlabelled++;
        } else {
          // The figures are a season the heading is not naming. Saying so is
          // the whole fix: the number, the record and the stat line are all
          // one season's and the player is told which.
          expect(rail.seasonLabel).toBe(`Season ${rail.season.seasonNumber}`);
          labelled++;
        }
      }
    }
    // Both populations have to be non-empty, or the assertions above proved
    // nothing. The mismatch is the bug and it fires in every offseason.
    expect(labelled).toBeGreaterThan(20);
    expect(unlabelled).toBeGreaterThan(20);
  });

  it("never labels a line the rail is not drawing", () => {
    const live = buildView(
      createCareer({ lastName: "Kuri", jerseyNumber: 7, homeState: "TX", position: "QB" }, "vm-rail-label-null"),
    );
    expect(railView(live, null).seasonLabel).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// B66 (TASK 048). "You got hurt between decisions." on a card where nobody got
// hurt.
//
// `hurt` diffed the WHOLE of `state.injuries`, and a suspension lives in that
// list alongside real injuries. So a card whose own outcome suspended the
// player -- `speeding-georgia/cooperate` is the one the playtest hit -- was
// reported as an injury that arrived from somewhere else, on a card that had
// just said in prose what happened. Reproduced at seed `p-114`, QB, screen 20,
// where it printed beside a real heal as the single line
// "An injury healed and gave the points back. You got hurt between decisions."
//
// `healed` has always excluded suspensions, by `restoreAmount > 0`. This is
// the exact mirror of that rule, which was simply missing.
describe("remainderFacts and suspensions (B66)", () => {
  const suspension = (remainingPhases: number) => ({
    kind: "suspension" as const,
    injuryType: "suspension",
    remainingPhases,
    restoreAmount: 0,
  });

  it("does not report a suspension arriving as getting hurt", () => {
    const [before, after] = pair({ injuries: [] }, { injuries: [suspension(2)] });
    expect(remainderFacts(before, after).hurt).toBe(false);
  });

  it("still reports a real injury arriving beside a suspension", () => {
    const [before, after] = pair(
      { injuries: [suspension(2)] },
      { injuries: [suspension(1), hamstring(2)] },
    );
    expect(remainderFacts(before, after).hurt).toBe(true);
  });

  it("does not let a suspension mask a heal", () => {
    // The ankle healed and gave its points back; the suspension is not part of
    // that number and must not add a second, false clause to the sentence.
    const [before, after] = pair(
      { injuries: [hamstring(1), suspension(3)] },
      { injuries: [suspension(2)] },
    );
    const facts = remainderFacts(before, after);
    expect(facts.healed).toBe(true);
    expect(facts.hurt).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// B67 (TASK 048). The moments timeline silently skipped seasons.
//
// `groupMoments` walked the MOMENTS and started a group whenever the season
// index changed, so a season in which no `moment` effect fired produced no
// group at all and the timeline read `Season 1 / Season 2 / Season 4`. Measured
// over 360 careers, 172 of them have at least one played season with no
// moment, so the hole is the common case rather than the exception. A career
// is a fixed number of years and a year with nothing in it is a fact about the
// year, not a reason to delete it from the list.
describe("groupMoments (B67)", () => {
  const season = (seasonIndex: number, classYear: "FR" | "SO" | "JR" | "SR"): SeasonView => ({
    seasonIndex,
    schoolName: "Toledo",
    classYear,
    record: "9-3",
    snaps: 500,
    overall: 70,
    stats: [],
  });
  const moment = (seasonIndex: number, item: string): MomentView => ({
    seasonIndex,
    item,
    glyph: "*",
    count: 1,
  });

  it("gives every played season a row, including the quiet ones", () => {
    const seasons = [season(0, "FR"), season(1, "SO"), season(2, "JR"), season(3, "SR")];
    const groups = groupMoments([moment(0, "a"), moment(2, "b"), moment(2, "c")], seasons);

    expect(groups.map((g) => g.seasonIndex)).toEqual([0, 1, 2, 3]);
    expect(groups.map((g) => g.label)).toEqual(["Season 1", "Season 2", "Season 3", "Season 4"]);
    expect(groups.map((g) => g.moments.length)).toEqual([1, 0, 2, 0]);
    expect(groups.map((g) => g.classYear)).toEqual(["FR", "SO", "JR", "SR"]);
  });

  it("drops no moment whose season has no line", () => {
    // Never observed in 360 careers, but a moment is a thing that happened and
    // a grouping that cannot place one must still print it rather than eat it.
    const groups = groupMoments([moment(0, "a"), moment(7, "orphan")], [season(0, "FR")]);
    expect(groups.flatMap((g) => g.moments.map((m) => m.item))).toEqual(["a", "orphan"]);
  });

  it("returns nothing at all for a career with no seasons and no moments", () => {
    expect(groupMoments([], [])).toEqual([]);
  });
});
