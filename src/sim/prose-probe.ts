// Brief 042: how much of the authored prose does a player actually read?
//
// This project's doctrine is "the writing is the asset". Three correctness
// fixes have tightened event gates since the content was authored and nobody
// has priced the cost. This probe prices it. It edits nothing; it reads the
// frozen engine and the frozen content bundle and counts words.
//
// ---------------------------------------------------------------------------
// The counting rule (stated once, applied everywhere)
// ---------------------------------------------------------------------------
// "Authored prose a player actually reads" means, and only means:
//
//   * an event's `title`
//   * an event's `description`
//   * every option's `label` (the player reads all of them to choose)
//   * the `description` of the ONE outcome their choice resolved to
//
// Ids, keys, effect blocks, and the outcome descriptions of branches that did
// not fire are not prose the player read. A word is a whitespace-delimited
// token.
//
// Prose is bucketed into UNITS so "read" can be deduped:
//
//   card:<eventId>              title + description + all option labels
//   out:<eventId>:<optId>:pos   positiveOutcome.description
//   out:<eventId>:<optId>:neg   negativeOutcome.description
//
// A card seen twice is not twice as much reading, so coverage is measured over
// the UNION of units seen. Volume (total words rendered, repeats included) is
// reported alongside, because the gap between them is repetition.
//
// The denominator is every unit of every event in `CONTENT.events` except the
// `recruiting` event, whose title, description, option label and outcome text
// are all overridden by the engine at runtime (advance.ts getDecision) and are
// therefore placeholders no player can reach. That exclusion is reported.
//
// Engine-authored hub prose (Signing Day, Transfer Portal, Redshirt?) is NOT in
// the denominator either -- it does not live in src/content -- but it is
// counted separately, because every career reads it.
//
// CLI:
//   npx tsx src/sim/prose-probe.ts corpus
//   npx tsx src/sim/prose-probe.ts coverage <runs> <profile> [position|all]
//   npx tsx src/sim/prose-probe.ts gates <runs>
//   npx tsx src/sim/prose-probe.ts ten <runs> <profile>
//   npx tsx src/sim/prose-probe.ts redshirt

import { createCareer, advance, getDecision, ALL_POSITIONS, type GameState, type Position, type Setup } from "../engine/index";
import { createRng } from "../engine/rng";
import { eventMatches } from "../engine/select-event";
import type { EventConditions, GameEvent, Phase } from "../engine/types";
import { CONTENT } from "../content/index";
import { makePolicy, PROFILES, type Policy, type ProfileName } from "./policies";

export const RUNTIME_OVERRIDDEN_EVENT_IDS = new Set(["recruiting"]);

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter((w) => w.length > 0).length;
}

// ---------------------------------------------------------------------------
// Corpus
// ---------------------------------------------------------------------------

export interface ProseUnit {
  key: string;
  eventId: string;
  kind: "card" | "outcome";
  words: number;
}

export function cardKey(eventId: string): string {
  return `card:${eventId}`;
}
export function outcomeKey(eventId: string, optionId: string, branch: "pos" | "neg"): string {
  return `out:${eventId}:${optionId}:${branch}`;
}

export function unitsOf(ev: GameEvent): ProseUnit[] {
  const units: ProseUnit[] = [];
  const labelWords = ev.options.reduce((a, o) => a + countWords(o.label), 0);
  units.push({
    key: cardKey(ev.id),
    eventId: ev.id,
    kind: "card",
    words: countWords(ev.title) + countWords(ev.description) + labelWords,
  });
  for (const opt of ev.options) {
    units.push({
      key: outcomeKey(ev.id, opt.id, "pos"),
      eventId: ev.id,
      kind: "outcome",
      words: countWords(opt.positiveOutcome.description),
    });
    if (opt.negativeOutcome) {
      units.push({
        key: outcomeKey(ev.id, opt.id, "neg"),
        eventId: ev.id,
        kind: "outcome",
        words: countWords(opt.negativeOutcome.description),
      });
    }
  }
  return units;
}

export interface Corpus {
  events: GameEvent[];
  units: Map<string, ProseUnit>;
  wordsByEvent: Map<string, number>;
  totalWords: number;
  totalUnits: number;
  cardWords: number;
  outcomeWords: number;
  excludedWords: number;
  excludedEventIds: string[];
}

export function buildCorpus(events: GameEvent[] = CONTENT.events): Corpus {
  const units = new Map<string, ProseUnit>();
  const wordsByEvent = new Map<string, number>();
  let cardWords = 0;
  let outcomeWords = 0;
  let excludedWords = 0;
  const excludedEventIds: string[] = [];
  const kept: GameEvent[] = [];
  for (const ev of events) {
    const evUnits = unitsOf(ev);
    const evWords = evUnits.reduce((a, u) => a + u.words, 0);
    if (RUNTIME_OVERRIDDEN_EVENT_IDS.has(ev.id)) {
      excludedWords += evWords;
      excludedEventIds.push(ev.id);
      continue;
    }
    kept.push(ev);
    wordsByEvent.set(ev.id, evWords);
    for (const u of evUnits) {
      units.set(u.key, u);
      if (u.kind === "card") cardWords += u.words;
      else outcomeWords += u.words;
    }
  }
  return {
    events: kept,
    units,
    wordsByEvent,
    totalWords: cardWords + outcomeWords,
    totalUnits: units.size,
    cardWords,
    outcomeWords,
    excludedWords,
    excludedEventIds,
  };
}

// The three synthetic hub decisions the engine injects. Their prose is
// hardcoded in advance.ts getDecision and is read by every career.
export const HUB_PROSE: { id: string; text: string }[] = [
  { id: "recruiting", text: "Signing Day Where do you commit?" },
  { id: "transfer", text: "Transfer Portal The portal is open. Stay, or take an offer? " },
  {
    id: "redshirt",
    text:
      "Redshirt? Four games at most, and the season doesn't count against your eligibility. A year of scout team and the weight room, and a gamble on coming back stronger — it might backfire. Take the redshirt (play four games at most) Play this season",
  },
];

// ---------------------------------------------------------------------------
// Per-career trace
// ---------------------------------------------------------------------------

export interface ProseTrace {
  state: GameState;
  position: Position;
  /** Every unit key rendered, in order, repeats included. */
  unitsRendered: string[];
  /** Distinct unit keys rendered. */
  unitsSeen: Set<string>;
  /** eventId -> times the card was shown this career. */
  eventFires: Map<string, number>;
  /** Total words rendered, repeats included. */
  wordsRendered: number;
  /** Distinct words (sum of unit word counts over unitsSeen). */
  wordsDistinct: number;
  /** Words from the engine's synthetic hub decisions. */
  hubWords: number;
  hubDecisions: number;
  decisions: number;
}

const HUB_IDS = new Set(["recruiting", "transfer", "redshirt"]);
const HUB_WORDS = new Map(HUB_PROSE.map((h) => [h.id, countWords(h.text)]));

export function traceProse(setup: Setup, seed: string, policy: Policy, corpus: Corpus): ProseTrace {
  const byId = new Map(corpus.events.map((e) => [e.id, e]));
  let s = createCareer(setup, seed, CONTENT);
  const policyRng = createRng(seed + ":policy");
  const unitsRendered: string[] = [];
  const unitsSeen = new Set<string>();
  const eventFires = new Map<string, number>();
  let hubWords = 0;
  let hubDecisions = 0;
  let decisions = 0;
  let guard = 0;
  while (s.status === "active" && guard++ < 1000) {
    const decision = getDecision(s, CONTENT);
    if (!decision) break;
    decisions++;
    const evId = decision.eventId;
    const choice = policy(s, decision.options, policyRng);
    const next = advance(s, choice, CONTENT);
    const ev = byId.get(evId);
    if (HUB_IDS.has(evId) || !ev) {
      hubDecisions++;
      hubWords += HUB_WORDS.get(evId) ?? 0;
    } else {
      unitsRendered.push(cardKey(ev.id));
      eventFires.set(ev.id, (eventFires.get(ev.id) ?? 0) + 1);
      const opt = ev.options.find((o) => o.id === choice);
      const resolved = next.lastOutcome?.description;
      if (opt && resolved !== undefined) {
        const branch: "pos" | "neg" =
          opt.negativeOutcome && resolved === opt.negativeOutcome.description && resolved !== opt.positiveOutcome.description
            ? "neg"
            : "pos";
        unitsRendered.push(outcomeKey(ev.id, opt.id, branch));
      }
    }
    s = next;
  }
  let wordsRendered = 0;
  let wordsDistinct = 0;
  for (const key of unitsRendered) {
    const u = corpus.units.get(key);
    if (!u) continue;
    wordsRendered += u.words;
    if (!unitsSeen.has(key)) {
      unitsSeen.add(key);
      wordsDistinct += u.words;
    }
  }
  return {
    state: s,
    position: setup.position,
    unitsRendered,
    unitsSeen,
    eventFires,
    wordsRendered,
    wordsDistinct,
    hubWords,
    hubDecisions,
    decisions,
  };
}

// ---------------------------------------------------------------------------
// Coverage sweep
// ---------------------------------------------------------------------------

export interface CoverageRow {
  profile: string;
  position: Position | "all";
  runs: number;
  corpusWords: number;
  /** Mean distinct authored words one career shows, and that as a share. */
  meanWordsDistinct: number;
  meanCoverage: number;
  /** Mean words rendered including repeats. */
  meanWordsRendered: number;
  meanRepeatShare: number;
  meanHubWords: number;
  meanDecisions: number;
  meanCardsShown: number;
  meanDistinctCards: number;
  p05Coverage: number;
  p50Coverage: number;
  p95Coverage: number;
  /** Union over every career in the sample: the ceiling this policy can reach. */
  unionWords: number;
  unionCoverage: number;
}

function percentileOf(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.round(p * (sorted.length - 1))));
  return sorted[idx]!;
}

export interface Sweep {
  traces: ProseTrace[];
  corpus: Corpus;
}

export function runSweep(
  runs: number,
  profileName: ProfileName,
  positions: Position[],
  corpus: Corpus = buildCorpus(),
  seedPrefix = "b042",
): Sweep {
  const policy = makePolicy(PROFILES[profileName]);
  const traces: ProseTrace[] = [];
  for (const pos of positions) {
    const setup: Setup = { lastName: "Player", jerseyNumber: 7, homeState: "TX", position: pos };
    for (let i = 0; i < runs; i++) {
      traces.push(traceProse(setup, `${seedPrefix}-${pos}-${i}`, policy, corpus));
    }
  }
  return { traces, corpus };
}

export function summarizeCoverage(
  profile: string,
  position: Position | "all",
  sweep: Sweep,
): CoverageRow {
  const { traces, corpus } = sweep;
  const n = traces.length;
  const mean = (f: (t: ProseTrace) => number) => traces.reduce((a, t) => a + f(t), 0) / n;
  const coverages = traces.map((t) => t.wordsDistinct / corpus.totalWords).sort((a, b) => a - b);
  const union = new Set<string>();
  for (const t of traces) for (const k of t.unitsSeen) union.add(k);
  let unionWords = 0;
  for (const k of union) unionWords += corpus.units.get(k)?.words ?? 0;
  return {
    profile,
    position,
    runs: n,
    corpusWords: corpus.totalWords,
    meanWordsDistinct: mean((t) => t.wordsDistinct),
    meanCoverage: mean((t) => t.wordsDistinct) / corpus.totalWords,
    meanWordsRendered: mean((t) => t.wordsRendered),
    meanRepeatShare: 1 - mean((t) => t.wordsDistinct) / mean((t) => t.wordsRendered),
    meanHubWords: mean((t) => t.hubWords),
    meanDecisions: mean((t) => t.decisions),
    meanCardsShown: mean((t) => [...t.eventFires.values()].reduce((a, b) => a + b, 0)),
    meanDistinctCards: mean((t) => t.eventFires.size),
    p05Coverage: percentileOf(coverages, 0.05),
    p50Coverage: percentileOf(coverages, 0.5),
    p95Coverage: percentileOf(coverages, 0.95),
    unionWords,
    unionCoverage: unionWords / corpus.totalWords,
  };
}

/** Mean union coverage over consecutive groups of `k` careers from the sample. */
export function groupCoverage(sweep: Sweep, k: number): number {
  const { traces, corpus } = sweep;
  let total = 0;
  let groups = 0;
  for (let i = 0; i + k <= traces.length; i += k) {
    const union = new Set<string>();
    for (let j = i; j < i + k; j++) for (const key of traces[j]!.unitsSeen) union.add(key);
    let w = 0;
    for (const key of union) w += corpus.units.get(key)?.words ?? 0;
    total += w / corpus.totalWords;
    groups++;
  }
  return groups === 0 ? 0 : total / groups;
}

/**
 * Mean union coverage over groups of `k` careers drawn ACROSS positions --
 * the model of a replaying player who does not pick the same position every
 * time. Traces are interleaved so each group takes careers from k different
 * (position, index) slots.
 */
export function mixedGroupCoverage(sweeps: Sweep[], k: number, corpus: Corpus): number {
  const byPosition = new Map<Position, ProseTrace[]>();
  for (const sw of sweeps) {
    for (const t of sw.traces) {
      const arr = byPosition.get(t.position) ?? [];
      arr.push(t);
      byPosition.set(t.position, arr);
    }
  }
  const lists = [...byPosition.values()];
  if (lists.length === 0) return 0;
  const minLen = Math.min(...lists.map((l) => l.length));
  let total = 0;
  let groups = 0;
  for (let start = 0; start + Math.ceil(k / lists.length) <= minLen; start += Math.ceil(k / lists.length)) {
    const union = new Set<string>();
    let taken = 0;
    for (let off = 0; taken < k && start + off < minLen; off++) {
      for (const list of lists) {
        if (taken >= k) break;
        for (const key of list[start + off]!.unitsSeen) union.add(key);
        taken++;
      }
    }
    if (taken < k) break;
    let w = 0;
    for (const key of union) w += corpus.units.get(key)?.words ?? 0;
    total += w / corpus.totalWords;
    groups++;
  }
  return groups === 0 ? 0 : total / groups;
}

// ---------------------------------------------------------------------------
// Gates
// ---------------------------------------------------------------------------

export type GateLabel = string;

/** Every reachability-restricting gate an event carries, as stable labels. */
export function gatesOf(ev: GameEvent): GateLabel[] {
  const c: EventConditions | undefined = ev.conditions;
  if (!c) return [];
  const out: GateLabel[] = [];
  if (c.position) out.push(`position:${[...c.position].sort().join("/")}`);
  if (c.tier) out.push(`tier:${[...c.tier].sort().join("/")}`);
  if (c.schoolTrait) out.push(`schoolTrait:${[...c.schoolTrait].sort().join("/")}`);
  if (c.seasonIndex) out.push(`seasonIndex:${[...c.seasonIndex].sort().join("/")}`);
  if (c.minClass) out.push(`minClass:${c.minClass}`);
  if (c.requiresInjury) out.push("requiresInjury");
  if (c.requiresActiveInjury) out.push("requiresActiveInjury");
  if (c.requiresFinalSeason) out.push("requiresFinalSeason");
  if (c.requiresPlaying) out.push("requiresPlaying (excluded from a redshirt season)");
  if (c.requiresRedshirt) out.push("requiresRedshirt (only in a redshirt season)");
  if (c.maxCharacter !== undefined) out.push(`maxCharacter<=${c.maxCharacter}`);
  if (c.minOverall !== undefined) out.push(`minOverall>=${c.minOverall}`);
  if (c.maxOverall !== undefined) out.push(`maxOverall<=${c.maxOverall}`);
  return out;
}

export interface EventStat {
  eventId: string;
  phase: Phase;
  kind: "fixed" | "random";
  weight: number;
  words: number;
  gates: GateLabel[];
  firesPerCareer: number;
  seenRate: number; // share of careers that saw the card at least once
}

export function eventStats(sweep: Sweep): Map<string, EventStat> {
  const { traces, corpus } = sweep;
  const n = traces.length;
  const out = new Map<string, EventStat>();
  for (const ev of corpus.events) {
    out.set(ev.id, {
      eventId: ev.id,
      phase: ev.phase,
      kind: ev.kind,
      weight: ev.weight,
      words: corpus.wordsByEvent.get(ev.id) ?? 0,
      gates: gatesOf(ev),
      firesPerCareer: 0,
      seenRate: 0,
    });
  }
  for (const t of traces) {
    for (const [id, count] of t.eventFires) {
      const st = out.get(id);
      if (!st) continue;
      st.firesPerCareer += count;
      st.seenRate += 1;
    }
  }
  for (const st of out.values()) {
    st.firesPerCareer /= n;
    st.seenRate /= n;
  }
  return out;
}

export interface GateRow {
  gate: GateLabel;
  events: number;
  options: number;
  words: number;
  firesPerCareerGood: number;
  firesPerCareerHumanLazy: number;
  /** Words of events behind this gate that fired ZERO times in the good sample. */
  wordsNeverSeenGood: number;
  eventsNeverSeenGood: number;
  /** Expected words of this gate's events a single good career does not reach. */
  expectedWordsUnseenGood: number;
}

export function gateTable(
  good: Sweep,
  humanLazy: Sweep,
  corpus: Corpus = buildCorpus(),
): GateRow[] {
  const g = eventStats(good);
  const h = eventStats(humanLazy);
  const byGate = new Map<GateLabel, GameEvent[]>();
  for (const ev of corpus.events) {
    for (const gate of gatesOf(ev)) {
      const arr = byGate.get(gate) ?? [];
      arr.push(ev);
      byGate.set(gate, arr);
    }
  }
  const rows: GateRow[] = [];
  for (const [gate, evs] of byGate) {
    let words = 0;
    let options = 0;
    let firesG = 0;
    let firesH = 0;
    let wordsNever = 0;
    let evsNever = 0;
    let expectedUnseen = 0;
    for (const ev of evs) {
      const w = corpus.wordsByEvent.get(ev.id) ?? 0;
      words += w;
      options += ev.options.length;
      const gs = g.get(ev.id);
      const hs = h.get(ev.id);
      firesG += gs?.firesPerCareer ?? 0;
      firesH += hs?.firesPerCareer ?? 0;
      if ((gs?.firesPerCareer ?? 0) === 0) {
        wordsNever += w;
        evsNever += 1;
      }
      expectedUnseen += w * (1 - (gs?.seenRate ?? 0));
    }
    rows.push({
      gate,
      events: evs.length,
      options,
      words,
      firesPerCareerGood: firesG,
      firesPerCareerHumanLazy: firesH,
      wordsNeverSeenGood: wordsNever,
      eventsNeverSeenGood: evsNever,
      expectedWordsUnseenGood: expectedUnseen,
    });
  }
  rows.sort((a, b) => b.wordsNeverSeenGood - a.wordsNeverSeenGood || b.expectedWordsUnseenGood - a.expectedWordsUnseenGood);
  return rows;
}

// ---------------------------------------------------------------------------
// Redshirt pool (DECISION 051)
// ---------------------------------------------------------------------------

export interface PoolRow {
  phase: Phase;
  sitting: { events: number; weight: number; words: number };
  playing: { events: number; weight: number; words: number };
}

/**
 * The random-event pool available in each phase of a FR season, with and
 * without `redshirtSeasonActive`. Everything else about the state is held
 * identical, so the difference is exactly the redshirt gate.
 */
export function redshirtPools(position: Position = "QB", corpus: Corpus = buildCorpus()): PoolRow[] {
  const phases: Phase[] = ["offseason", "nonconf", "conference", "postseason"];
  const rows: PoolRow[] = [];
  for (const phase of phases) {
    const base = createCareer({ lastName: "P", jerseyNumber: 1, homeState: "TX", position }, "pool", CONTENT);
    base.school = { schoolId: CONTENT.schools.find((x) => x.tier === 2)!.id, tier: 2 };
    base.phase = phase;
    base.character = 70;
    base.overall = 65;
    base.eligibility = { classYear: "FR", yearsUsed: 0, redshirtUsed: true, draftEligible: false };
    const measure = (sitting: boolean) => {
      const s = { ...base, redshirtSeasonActive: sitting };
      const pool = CONTENT.events.filter((e) => e.kind === "random" && eventMatches(s, e, CONTENT));
      return {
        events: pool.length,
        weight: pool.reduce((a, e) => a + e.weight, 0),
        words: pool.reduce((a, e) => a + (corpus.wordsByEvent.get(e.id) ?? 0), 0),
      };
    };
    rows.push({ phase, sitting: measure(true), playing: measure(false) });
  }
  return rows;
}

/** The same pool count, union over all six positions (the whole-bundle view). */
export function redshirtPoolAllPositions(corpus: Corpus = buildCorpus()): PoolRow[] {
  const phases: Phase[] = ["offseason", "nonconf", "conference", "postseason"];
  return phases.map((phase) => {
    const collect = (sitting: boolean) => {
      const ids = new Set<string>();
      for (const position of ALL_POSITIONS) {
        const base = createCareer({ lastName: "P", jerseyNumber: 1, homeState: "TX", position }, "pool", CONTENT);
        base.school = { schoolId: CONTENT.schools.find((x) => x.tier === 2)!.id, tier: 2 };
        base.phase = phase;
        base.character = 70;
        base.overall = 65;
        base.eligibility = { classYear: "FR", yearsUsed: 0, redshirtUsed: true, draftEligible: false };
        const s = { ...base, redshirtSeasonActive: sitting };
        for (const e of CONTENT.events) if (e.kind === "random" && eventMatches(s, e, CONTENT)) ids.add(e.id);
      }
      let words = 0;
      let weight = 0;
      for (const id of ids) {
        words += corpus.wordsByEvent.get(id) ?? 0;
        weight += CONTENT.events.find((e) => e.id === id)?.weight ?? 0;
      }
      return { events: ids.size, weight, words };
    };
    return { phase, sitting: collect(true), playing: collect(false) };
  });
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function main(): void {
  const cmd = process.argv[2] ?? "corpus";
  const corpus = buildCorpus();
  if (cmd === "corpus") {
    console.log(
      JSON.stringify(
        {
          events: corpus.events.length,
          units: corpus.totalUnits,
          totalWords: corpus.totalWords,
          cardWords: corpus.cardWords,
          outcomeWords: corpus.outcomeWords,
          excludedEventIds: corpus.excludedEventIds,
          excludedWords: corpus.excludedWords,
          hubWords: HUB_PROSE.map((h) => ({ id: h.id, words: countWords(h.text) })),
        },
        null,
        2,
      ),
    );
    return;
  }
  const runs = Number(process.argv[3] ?? 500);
  const profile = (process.argv[4] ?? "good") as ProfileName;
  if (cmd === "coverage") {
    const posArg = process.argv[5] ?? "all";
    const positions = posArg === "all" ? ALL_POSITIONS : [posArg as Position];
    const rows = positions.map((p) => summarizeCoverage(profile, p, runSweep(runs, profile, [p], corpus)));
    const allSweep = runSweep(runs, profile, positions, corpus);
    rows.push(summarizeCoverage(profile, "all", allSweep));
    console.log(JSON.stringify(rows, null, 2));
    return;
  }
  if (cmd === "ten") {
    const sweeps = ALL_POSITIONS.map((p) => runSweep(runs, profile, [p], corpus));
    const all: Sweep = { traces: sweeps.flatMap((s) => s.traces), corpus };
    console.log(
      JSON.stringify(
        {
          profile,
          runsPerPosition: runs,
          oneCareer: summarizeCoverage(profile, "all", all).meanCoverage,
          tenSamePosition: Object.fromEntries(
            ALL_POSITIONS.map((p, i) => [p, groupCoverage(sweeps[i]!, 10)]),
          ),
          tenMixedPositions: mixedGroupCoverage(sweeps, 10, corpus),
          thirtyMixedPositions: mixedGroupCoverage(sweeps, 30, corpus),
        },
        null,
        2,
      ),
    );
    return;
  }
  if (cmd === "gates") {
    const good: Sweep = { traces: ALL_POSITIONS.flatMap((p) => runSweep(runs, "good", [p], corpus).traces), corpus };
    const lazy: Sweep = {
      traces: ALL_POSITIONS.flatMap((p) => runSweep(runs, "humanLazyAmbitious", [p], corpus).traces),
      corpus,
    };
    console.log(JSON.stringify(gateTable(good, lazy, corpus), null, 2));
    return;
  }
  if (cmd === "sitseason") {
    // What does a player actually read during the season they sit? One run of
    // careers, recording every card shown while `redshirtSeasonActive`.
    const policy = makePolicy(PROFILES[profile]);
    const byId = new Map(corpus.events.map((e) => [e.id, e]));
    const fires = new Map<string, number>();
    let careers = 0;
    let cardsSeen = 0;
    let wordsSeen = 0;
    const perCareerDistinct: number[] = [];
    for (const pos of ALL_POSITIONS) {
      for (let i = 0; i < runs; i++) {
        const seed = `b042-sit-${pos}-${i}`;
        let s = createCareer({ lastName: "Player", jerseyNumber: 7, homeState: "TX", position: pos }, seed, CONTENT);
        const rng = createRng(seed + ":policy");
        let guard = 0;
        let sat = false;
        const mine = new Set<string>();
        let cards = 0;
        let words = 0;
        while (s.status === "active" && guard++ < 1000) {
          const d = getDecision(s, CONTENT);
          if (!d) break;
          const active = s.redshirtSeasonActive;
          const ev = byId.get(d.eventId);
          const choice = policy(s, d.options, rng);
          const next = advance(s, choice, CONTENT);
          if (active && ev) {
            sat = true;
            cards++;
            mine.add(ev.id);
            fires.set(ev.id, (fires.get(ev.id) ?? 0) + 1);
            words += corpus.units.get(cardKey(ev.id))?.words ?? 0;
            const opt = ev.options.find((o) => o.id === choice);
            const resolved = next.lastOutcome?.description;
            if (opt && resolved !== undefined) {
              const branch: "pos" | "neg" =
                opt.negativeOutcome && resolved === opt.negativeOutcome.description ? "neg" : "pos";
              words += corpus.units.get(outcomeKey(ev.id, opt.id, branch))?.words ?? 0;
            }
          }
          s = next;
        }
        if (sat) {
          careers++;
          cardsSeen += cards;
          wordsSeen += words;
          perCareerDistinct.push(mine.size);
        }
      }
    }
    const ranked = [...fires.entries()].sort((a, b) => b[1] - a[1]);
    const totalFires = ranked.reduce((a, r) => a + r[1], 0);
    console.log(
      JSON.stringify(
        {
          profile,
          careersThatSat: careers,
          meanCardsInSitSeason: cardsSeen / Math.max(1, careers),
          meanDistinctCardsInSitSeason:
            perCareerDistinct.reduce((a, b) => a + b, 0) / Math.max(1, perCareerDistinct.length),
          meanWordsInSitSeason: wordsSeen / Math.max(1, careers),
          distinctEventsEverDrawnInASitSeason: ranked.length,
          topShare: ranked.slice(0, 20).map(([id, n]) => ({ id, share: n / totalFires })),
        },
        null,
        2,
      ),
    );
    return;
  }
  if (cmd === "options") {
    // Why is an outcome unit unseen? Three different findings hide under one
    // number: the card never fired, the option was never CHOSEN, or the branch
    // never rolled.
    const good: Sweep = { traces: ALL_POSITIONS.flatMap((p) => runSweep(runs, "good", [p], corpus).traces), corpus };
    const lazy: Sweep = {
      traces: ALL_POSITIONS.flatMap((p) => runSweep(runs, "humanLazyAmbitious", [p], corpus).traces),
      corpus,
    };
    const seen = new Set<string>();
    for (const t of [...good.traces, ...lazy.traces]) for (const k of t.unitsSeen) seen.add(k);
    const buckets = {
      cardNeverFired: { units: 0, words: 0, examples: [] as string[] },
      optionNeverChosen: { units: 0, words: 0, examples: [] as string[] },
      branchNeverRolled: { units: 0, words: 0, examples: [] as string[] },
      deterministicDeadBranch: { units: 0, words: 0, examples: [] as string[] },
    };
    for (const ev of corpus.events) {
      const cardFired = seen.has(cardKey(ev.id));
      for (const opt of ev.options) {
        const keys: ("pos" | "neg")[] = opt.negativeOutcome ? ["pos", "neg"] : ["pos"];
        const chosen = keys.some((b) => seen.has(outcomeKey(ev.id, opt.id, b)));
        for (const b of keys) {
          const key = outcomeKey(ev.id, opt.id, b);
          if (seen.has(key)) continue;
          const words = corpus.units.get(key)?.words ?? 0;
          const label = `${ev.id}:${opt.id}:${b}`;
          const bucket = !cardFired
            ? buckets.cardNeverFired
            : !chosen
              ? buckets.optionNeverChosen
              : opt.probability >= 1 && b === "neg"
                ? buckets.deterministicDeadBranch
                : buckets.branchNeverRolled;
          bucket.units += 1;
          bucket.words += words;
          if (bucket.examples.length < 12) bucket.examples.push(label);
        }
      }
    }
    // Static check, independent of any sample: a negativeOutcome behind
    // probability 1 (or a positiveOutcome behind probability 0) can never fire.
    const staticDead: { key: string; words: number; reason: string }[] = [];
    for (const ev of corpus.events) {
      for (const opt of ev.options) {
        if (opt.probability >= 1 && opt.negativeOutcome)
          staticDead.push({
            key: outcomeKey(ev.id, opt.id, "neg"),
            words: countWords(opt.negativeOutcome.description),
            reason: "probability 1 -- negativeOutcome can never resolve",
          });
        if (opt.probability <= 0)
          staticDead.push({
            key: outcomeKey(ev.id, opt.id, "pos"),
            words: countWords(opt.positiveOutcome.description),
            reason: "probability 0 -- positiveOutcome can never resolve",
          });
      }
    }
    console.log(JSON.stringify({ runsPerPosition: runs, buckets, staticDead }, null, 2));
    return;
  }
  if (cmd === "unseen") {
    const good: Sweep = { traces: ALL_POSITIONS.flatMap((p) => runSweep(runs, "good", [p], corpus).traces), corpus };
    const lazy: Sweep = {
      traces: ALL_POSITIONS.flatMap((p) => runSweep(runs, "humanLazyAmbitious", [p], corpus).traces),
      corpus,
    };
    const seenGood = new Set<string>();
    for (const t of good.traces) for (const k of t.unitsSeen) seenGood.add(k);
    const seenAny = new Set(seenGood);
    for (const t of lazy.traces) for (const k of t.unitsSeen) seenAny.add(k);
    const classify = (seen: Set<string>) => {
      let cardWords = 0;
      let outcomeWords = 0;
      const cards: string[] = [];
      for (const u of corpus.units.values()) {
        if (seen.has(u.key)) continue;
        if (u.kind === "card") {
          cardWords += u.words;
          cards.push(u.eventId);
        } else outcomeWords += u.words;
      }
      return { cardWords, outcomeWords, totalWords: cardWords + outcomeWords, neverShownEvents: cards };
    };
    const gs = eventStats(good);
    const ls = eventStats(lazy);
    const evRows = corpus.events
      .map((e) => ({
        eventId: e.id,
        phase: e.phase,
        kind: e.kind,
        weight: e.weight,
        words: corpus.wordsByEvent.get(e.id) ?? 0,
        gates: gatesOf(e),
        good: gs.get(e.id)?.firesPerCareer ?? 0,
        lazy: ls.get(e.id)?.firesPerCareer ?? 0,
      }))
      .sort((a, b) => a.good - b.good || b.words - a.words);
    console.log(
      JSON.stringify(
        {
          runsPerPosition: runs,
          unseenByGood: classify(seenGood),
          unseenByEitherPolicy: classify(seenAny),
          eventFireRates: evRows,
        },
        null,
        2,
      ),
    );
    return;
  }
  if (cmd === "redshirt") {
    console.log(
      JSON.stringify({ perPosition: redshirtPools("QB", corpus), allPositions: redshirtPoolAllPositions(corpus) }, null, 2),
    );
    return;
  }
  console.error(`Unknown command "${cmd}"`);
  process.exitCode = 1;
}

if (process.argv[1] && process.argv[1].endsWith("prose-probe.ts")) main();
