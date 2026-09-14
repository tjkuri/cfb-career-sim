import { describe, it, expect } from "vitest";
import { createCareer, advance, getDecision, ALL_POSITIONS, ALL_SCHOOL_TRAITS, type Setup } from "../../engine/index";
import { buildView, railView } from "./view-model";
import { reducer, INITIAL_STATE } from "./reducer";
import type { CareerView, RailView, UiState } from "./types";

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

function playThrough(seed: string, position: Setup["position"]): UiState[] {
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
    ui = reducer(ui, { type: "choose", optionId: d.options[0]!.id });
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
      narrated: false,
      stamp: null,
      overallBefore: null,
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
