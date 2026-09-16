import { describe, it, expect } from "vitest";
import {
  buildCorpus,
  cardKey,
  countWords,
  gatesOf,
  outcomeKey,
  redshirtPools,
  runSweep,
  summarizeCoverage,
  traceProse,
  unitsOf,
  RUNTIME_OVERRIDDEN_EVENT_IDS,
} from "./prose-probe";
import { CONTENT } from "../content/index";
import { makePolicy, PROFILES } from "./policies";
import type { GameEvent, Setup } from "../engine/types";

const setup: Setup = { lastName: "P", jerseyNumber: 1, homeState: "TX", position: "QB" };

const sampleEvent: GameEvent = {
  id: "test-event",
  kind: "random",
  phase: "nonconf",
  weight: 1,
  conditions: { maxCharacter: 55, requiresPlaying: true },
  title: "Two Words",
  description: "Three words here",
  options: [
    {
      id: "a",
      label: "One",
      probability: 0.5,
      positiveOutcome: { description: "good good", effects: [] },
      negativeOutcome: { description: "bad", effects: [] },
    },
    { id: "b", label: "Two words", probability: 1, positiveOutcome: { description: "fine", effects: [] } },
  ],
};

describe("countWords", () => {
  it("counts whitespace-delimited tokens and ignores padding", () => {
    expect(countWords("  one   two\nthree ")).toBe(3);
    expect(countWords("")).toBe(0);
  });
});

describe("unitsOf", () => {
  // The counting rule of brief 042: the card unit is title + description +
  // EVERY option label, because the player reads all the labels to choose.
  // Each outcome is its own unit, because only one of them is ever read.
  it("puts title, description and all labels in one card unit", () => {
    const units = unitsOf(sampleEvent);
    const card = units.find((u) => u.key === cardKey("test-event"));
    expect(card?.words).toBe(2 + 3 + 1 + 2);
  });

  it("emits one unit per reachable outcome and none for an absent branch", () => {
    const keys = unitsOf(sampleEvent).map((u) => u.key);
    expect(keys).toContain(outcomeKey("test-event", "a", "pos"));
    expect(keys).toContain(outcomeKey("test-event", "a", "neg"));
    expect(keys).toContain(outcomeKey("test-event", "b", "pos"));
    expect(keys).not.toContain(outcomeKey("test-event", "b", "neg"));
  });
});

describe("buildCorpus", () => {
  it("excludes the recruiting event, whose prose the engine overrides at runtime", () => {
    const corpus = buildCorpus();
    expect(corpus.excludedEventIds).toEqual([...RUNTIME_OVERRIDDEN_EVENT_IDS]);
    expect(corpus.events.some((e) => e.id === "recruiting")).toBe(false);
    expect(corpus.excludedWords).toBeGreaterThan(0);
  });

  it("totals card words and outcome words to the corpus total", () => {
    const corpus = buildCorpus();
    expect(corpus.cardWords + corpus.outcomeWords).toBe(corpus.totalWords);
    expect(corpus.totalWords).toBeGreaterThan(5000);
  });
});

describe("gatesOf", () => {
  it("names every reachability-restricting condition an event carries", () => {
    expect(gatesOf(sampleEvent).sort()).toEqual(
      ["maxCharacter<=55", "requiresPlaying (excluded from a redshirt season)"].sort(),
    );
  });

  it("reports no gate for an unconditioned event", () => {
    expect(gatesOf({ ...sampleEvent, conditions: undefined })).toEqual([]);
  });
});

describe("traceProse", () => {
  const corpus = buildCorpus();

  it("never counts a prose unit twice toward distinct coverage", () => {
    const t = traceProse(setup, "prose-probe-test-1", makePolicy(PROFILES.good), corpus);
    expect(t.unitsSeen.size).toBeLessThanOrEqual(t.unitsRendered.length);
    expect(t.wordsDistinct).toBeLessThanOrEqual(t.wordsRendered);
  });

  it("only ever reports prose the corpus actually contains", () => {
    const t = traceProse(setup, "prose-probe-test-2", makePolicy(PROFILES.good), corpus);
    for (const key of t.unitsSeen) expect(corpus.units.has(key)).toBe(true);
    expect(t.wordsDistinct).toBeLessThan(corpus.totalWords);
  });

  it("charges hub prose separately from the authored corpus", () => {
    const t = traceProse(setup, "prose-probe-test-3", makePolicy(PROFILES.good), corpus);
    // Signing Day fires in every career, so hub prose is never zero.
    expect(t.hubWords).toBeGreaterThan(0);
    expect(t.hubDecisions).toBeGreaterThan(0);
  });
});

describe("summarizeCoverage", () => {
  it("reports a per-career share well under the sample union", () => {
    const corpus = buildCorpus();
    const sweep = runSweep(40, "good", ["QB"], corpus, "prose-probe-test");
    const row = summarizeCoverage("good", "QB", sweep);
    expect(row.meanCoverage).toBeGreaterThan(0);
    expect(row.meanCoverage).toBeLessThan(row.unionCoverage);
    expect(row.unionCoverage).toBeLessThanOrEqual(1);
  });
});

describe("redshirtPools", () => {
  // DECISION 051: requiresPlaying gates on-field beats out of a sit season.
  // The offseason is untouched by it, which is the control that proves the
  // difference between the two columns is the redshirt gate and nothing else.
  it("shrinks every on-field pool and leaves the offseason alone", () => {
    const rows = redshirtPools("QB");
    const offseason = rows.find((r) => r.phase === "offseason")!;
    expect(offseason.sitting.events).toBe(offseason.playing.events);
    for (const r of rows.filter((x) => x.phase !== "offseason")) {
      expect(r.sitting.events).toBeLessThan(r.playing.events);
      expect(r.sitting.words).toBeLessThan(r.playing.words);
    }
  });

  it("agrees with the bundle on which on-field events survive a sit season", () => {
    const onFieldWithoutPlayingGate = CONTENT.events.filter(
      (e) => e.phase !== "offseason" && !e.conditions?.requiresPlaying,
    ).length;
    expect(onFieldWithoutPlayingGate).toBe(12);
  });
});
