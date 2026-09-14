import { describe, it, expect } from "vitest";
import { MILESTONE_EVENTS } from "./milestones";
import { eventMatches } from "../../engine/select-event";
import { createCareer } from "../../engine/index";
import type { GameEvent, GameState, Phase, Setup } from "../../engine/types";

const SEASONS = [0, 1, 2, 3, 4];
const setup: Setup = { lastName: "A", jerseyNumber: 1, homeState: "TX", position: "QB" };

// A playing (non-redshirt) career in a given phase and season. Every milestone
// is gated on requiresPlaying, so this is the state in which they are meant to
// be reachable at all.
function playingState(phase: Phase, seasonIndex: number): GameState {
  const s = structuredClone(createCareer(setup, "milestone-test"));
  s.phase = phase;
  s.seasonIndex = seasonIndex;
  s.redshirtSeasonActive = false;
  // The season axis is what these tests vary; requiresFinalSeason beats are
  // excluded explicitly rather than by manipulating eligibility.
  return s;
}

const OPENERS = MILESTONE_EVENTS.filter((e) => e.id.startsWith("milestone-opener"));

describe("milestone slice", () => {
  it("is all fixed events", () => {
    for (const ev of MILESTONE_EVENTS) expect(ev.kind).toBe("fixed");
  });

  it("gates every milestone on the player actually playing", () => {
    for (const ev of MILESTONE_EVENTS) {
      expect(ev.conditions?.requiresPlaying, `"${ev.id}" is not gated on requiresPlaying`).toBe(true);
    }
  });

  // Generalised from "at most one per phase" when the opener gained per-season
  // variants: the invariant was never about the authored count, it was about
  // how many fixed milestones can FIRE in one phase. selectFixedEvent fires
  // every matching fixed event, one per advance, so two matches in a phase is
  // two cards where the design says one.
  it("runs at most one per phase per season, except the final-season beat", () => {
    const phases = [...new Set(MILESTONE_EVENTS.map((e) => e.phase))];
    for (const phase of phases) {
      for (const seasonIndex of SEASONS) {
        const s = playingState(phase, seasonIndex);
        const matching = MILESTONE_EVENTS.filter(
          (e) => !e.conditions?.requiresFinalSeason && eventMatches(s, e),
        );
        // "At most", not "exactly": Fall Camp carries minClass "SO", so the
        // offseason of a true freshman's first season has no milestone at all.
        // That gap predates the pilot and is deliberate.
        expect(matching.length, `phase ${phase}, season ${seasonIndex}: ${matching.map((e) => e.id)}`)
          .toBeLessThanOrEqual(1);
      }
    }
  });

  it("covers all four phases", () => {
    const phases = new Set(MILESTONE_EVENTS.map((e) => e.phase));
    expect([...phases].sort()).toEqual(["conference", "nonconf", "offseason", "postseason"]);
  });

  // DECISION 043 item 2. The screen is second person throughout; a third-person
  // pronoun anywhere in this file is a copy defect, and the one that shipped
  // ("Had the time of his life at a bowl game") sat in a moment, which is the
  // one place prose is re-read on the end screen.
  it("is second person everywhere, in card prose and in moments alike", () => {
    const thirdPerson = /\b(he|she|him|her|hers|his|himself|herself)\b/i;
    const offenders: string[] = [];
    for (const ev of MILESTONE_EVENTS) {
      const strings: string[] = [ev.title, ev.description];
      for (const opt of ev.options) {
        strings.push(opt.label);
        for (const oc of [opt.positiveOutcome, opt.negativeOutcome]) {
          if (!oc) continue;
          strings.push(oc.description);
          for (const eff of oc.effects) if (eff.kind === "moment") strings.push(eff.item);
        }
      }
      for (const str of strings) if (thirdPerson.test(str)) offenders.push(`${ev.id}: "${str}"`);
    }
    expect(offenders).toEqual([]);
  });
});

// DECISION 030/036/042 — the content pilot.
describe("Season Opener variants", () => {
  it("covers seasons 0 through 4", () => {
    const covered = new Set(OPENERS.flatMap((e) => e.conditions?.seasonIndex ?? []));
    expect([...covered].sort((a, b) => a - b)).toEqual(SEASONS);
  });

  // The acceptance criterion the brief names directly. Two matches means two
  // openers in one season; zero means a season with no opener and a silent hole
  // in the spine.
  it("matches exactly one variant in every season 0 through 4", () => {
    for (const seasonIndex of SEASONS) {
      const s = playingState("nonconf", seasonIndex);
      const matching = OPENERS.filter((e) => eventMatches(s, e));
      expect(matching.map((e) => e.id), `season ${seasonIndex}`).toHaveLength(1);
    }
  });

  it("writes a distinct card for every variant", () => {
    const cards = OPENERS.map((e) => `${e.title}${e.description}`);
    expect(new Set(cards).size).toBe(OPENERS.length);
    expect(new Set(OPENERS.map((e) => e.id)).size).toBe(OPENERS.length);
  });

  // The no-change proof in reports/022 §8 is only meaningful if the variants
  // differ in prose and in nothing else. This asserts that directly rather than
  // trusting the measurement to notice.
  it("is mechanically identical across every variant", () => {
    const shape = (e: GameEvent) => ({
      kind: e.kind,
      phase: e.phase,
      weight: e.weight,
      conditions: { ...e.conditions, seasonIndex: undefined },
      options: e.options.map((o) => ({
        id: o.id,
        label: o.label,
        probability: o.probability,
        positiveEffects: o.positiveOutcome.effects,
        negativeEffects: o.negativeOutcome?.effects,
      })),
    });
    const first = shape(OPENERS[0]!);
    for (const ev of OPENERS) expect(shape(ev), ev.id).toEqual(first);
  });

  it("keeps the option, probability and effects the pre-pilot opener shipped", () => {
    for (const ev of OPENERS) {
      expect(ev.options).toHaveLength(1);
      const opt = ev.options[0]!;
      expect(opt.id).toBe("handle-it");
      expect(opt.label).toBe("Take care of business");
      expect(opt.probability).toBe(0.75);
      expect(opt.positiveOutcome.effects).toEqual([{ kind: "snaps", amount: 25 }]);
      expect(opt.negativeOutcome?.effects).toEqual([{ kind: "character", amount: -2 }]);
    }
  });

  // DECISION 042: seasonIndex 2 is a junior for most players and a sophomore
  // for a redshirt, so naming the label would be wrong for exactly the players
  // who play the most football.
  it("names no class year", () => {
    const classYear = /\b(freshman|sophomore|junior|senior|frosh|redshirt)\b/i;
    for (const ev of OPENERS) {
      const prose = [ev.title, ev.description, ...ev.options.flatMap((o) => [
        o.positiveOutcome.description, o.negativeOutcome?.description ?? "",
      ])].join(" ");
      expect(classYear.test(prose), `${ev.id}: "${prose}"`).toBe(false);
    }
  });

  // DECISION 043 item 1. The line this replaced asserted ninety thousand people
  // at schools that do not have ninety thousand seats. No variant may assert a
  // crowd size, a venue, or a stature the player's school may not have.
  it("asserts no crowd size, venue or stature", () => {
    const forbidden =
      /\b(stadium|sellout|sold out|capacity|thousand|packed house|nationally televised|primetime|the whole country|blue ?blood|powerhouse|sec|big ten|playoff)\b/i;
    for (const ev of OPENERS) {
      const prose = [ev.title, ev.description, ...ev.options.flatMap((o) => [
        o.positiveOutcome.description, o.negativeOutcome?.description ?? "",
      ])].join(" ");
      expect(forbidden.test(prose), `${ev.id}: "${prose}"`).toBe(false);
    }
  });

  // Length is not the fix; sameness is. The card being replaced was 42 words
  // across its title, body and two outcomes.
  it("writes no more words than the card it replaces", () => {
    const words = (s: string) => s.split(/\s+/).filter(Boolean).length;
    for (const ev of OPENERS) {
      const total = words(ev.title) + words(ev.description)
        + ev.options.reduce((a, o) => a + words(o.positiveOutcome.description)
          + words(o.negativeOutcome?.description ?? ""), 0);
      expect(total, `${ev.id} is ${total} words`).toBeLessThanOrEqual(42);
    }
  });
});
