import { describe, it, expect, beforeEach, vi } from "vitest";
import { createCareer, type Setup } from "../../engine/index";
import { LOG_CAP, appendLog, clearCurrent, hydrate, loadCurrent, loadLog, saveCurrent, saveLog } from "./storage";
import { INITIAL_STATE } from "./reducer";
import type { LogEntry, Resolved } from "./types";

const SETUP: Setup = { lastName: "Kuri", jerseyNumber: 7, homeState: "TX", position: "QB" };

// A minimal in-memory localStorage. jsdom is deliberately not a dependency of
// this suite, so the one browser API storage.ts touches is stubbed here.
function installStorage(impl?: Partial<Storage>): Record<string, string> {
  const data: Record<string, string> = {};
  const store: Storage = {
    getItem: (k) => (k in data ? data[k]! : null),
    setItem: (k, v) => { data[k] = String(v); },
    removeItem: (k) => { delete data[k]; },
    clear: () => { for (const k of Object.keys(data)) delete data[k]; },
    key: (i) => Object.keys(data)[i] ?? null,
    get length() { return Object.keys(data).length; },
    ...impl,
  };
  vi.stubGlobal("localStorage", store);
  return data;
}

function entry(seed: string): LogEntry {
  return {
    id: seed, finishedAt: 1, seed, lastName: "Kuri", jerseyNumber: 7,
    position: "QB", positionLabel: "Quarterback", schoolPath: ["Texas"],
    status: "drafted", headline: "Round 1, Pick 1", finalOverall: 90,
    trophyCount: 0, awards: [],
  };
}

beforeEach(() => { installStorage(); });

describe("current save", () => {
  it("round-trips a career and its resolved card", () => {
    const state = createCareer(SETUP, "s-1");
    const resolved: Resolved = {
      title: "T",
      description: "D",
      choiceLabel: "C",
      outcome: "O",
      hub: null,
      narrated: false,
      account: null,
      stamp: {
        seasonNumber: 1,
        classYear: "FR",
        phaseLabel: "Offseason",
        schoolName: null,
        season: null,
      },
      overallBefore: 60,
    };
    saveCurrent(state, resolved);
    const loaded = loadCurrent();
    expect(loaded!.state.seed).toBe("s-1");
    expect(loaded!.resolved).toEqual(resolved);
  });

  it("restores a pre-stamp save with a null stamp rather than undefined", () => {
    // Saves written before the resolved card carried a season stamp are still
    // playable; the header simply cannot be frozen for the one card in flight.
    const state = createCareer(SETUP, "s-legacy");
    localStorage.setItem(
      "cfb-career-sim:v1:current",
      JSON.stringify({ schema: 1, state, resolved: { title: "T", choiceLabel: "C", outcome: "O" } }),
    );
    const loaded = loadCurrent();
    expect(loaded).not.toBeNull();
    expect(loaded!.resolved).not.toBeNull();
    expect(loaded!.resolved!.stamp).toBeNull();
    expect("stamp" in loaded!.resolved!).toBe(true);
  });

  it("returns null after being cleared", () => {
    saveCurrent(createCareer(SETUP, "s-2"), null);
    clearCurrent();
    expect(loadCurrent()).toBeNull();
  });

  it("discards a save from a different schema", () => {
    localStorage.setItem("cfb-career-sim:v1:current", JSON.stringify({ schema: 99, state: {} }));
    expect(loadCurrent()).toBeNull();
  });

  it("discards unparseable data rather than throwing", () => {
    localStorage.setItem("cfb-career-sim:v1:current", "{not json");
    expect(loadCurrent()).toBeNull();
  });

  it("survives storage that throws on read", () => {
    installStorage({ getItem: () => { throw new Error("blocked"); } });
    expect(loadCurrent()).toBeNull();
    expect(loadLog()).toEqual([]);
  });

  it("survives storage that throws on write", () => {
    installStorage({ setItem: () => { throw new Error("quota"); } });
    expect(() => saveCurrent(createCareer(SETUP, "s-3"), null)).not.toThrow();
  });
});

describe("career log", () => {
  it("round-trips entries", () => {
    saveLog([entry("a"), entry("b")]);
    expect(loadLog().map((e) => e.seed)).toEqual(["a", "b"]);
  });

  it("puts the newest entry first", () => {
    expect(appendLog([entry("old")], entry("new"))[0]!.seed).toBe("new");
  });

  it("caps growth so storage cannot grow without bound", () => {
    let log: LogEntry[] = [];
    for (let i = 0; i < LOG_CAP + 25; i++) log = appendLog(log, entry(`e-${i}`));
    expect(log).toHaveLength(LOG_CAP);
    expect(log[0]!.seed).toBe(`e-${LOG_CAP + 24}`);
  });

  it("truncates on save as well as on append", () => {
    saveLog(Array.from({ length: LOG_CAP + 10 }, (_, i) => entry(`x-${i}`)));
    expect(loadLog()).toHaveLength(LOG_CAP);
  });

  it("discards a malformed log", () => {
    localStorage.setItem("cfb-career-sim:v1:log", JSON.stringify({ schema: 1, entries: "nope" }));
    expect(loadLog()).toEqual([]);
  });
});

describe("hydrate", () => {
  it("returns a first-visit state when storage is empty", () => {
    expect(hydrate(INITIAL_STATE)).toEqual({ ...INITIAL_STATE, log: [] });
  });

  it("restores an in-progress career onto the career screen", () => {
    saveCurrent(createCareer(SETUP, "s-4"), null);
    const ui = hydrate(INITIAL_STATE);
    expect(ui.screen).toBe("career");
    expect(ui.state!.seed).toBe("s-4");
    expect(ui.setup).toEqual(SETUP);
  });

  it("restores a finished career onto the summary screen", () => {
    const done = { ...createCareer(SETUP, "s-5"), status: "busted" as const, endingReason: "Done" };
    saveCurrent(done, null);
    expect(hydrate(INITIAL_STATE).screen).toBe("summary");
  });

  it("restores the log alongside the career", () => {
    saveLog([entry("kept")]);
    expect(hydrate(INITIAL_STATE).log.map((e) => e.seed)).toEqual(["kept"]);
  });
});
