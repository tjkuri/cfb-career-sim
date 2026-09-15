import { describe, it, expect } from "vitest";
import { CONTENT } from "../content/index";
import { createCareer, getDecision, advance, type GameState, type Setup } from "../engine/index";
import { makePolicy, PROFILES, optionCharacterScore } from "./policies";
import { playCareer } from "./play-headless";
import { runHonoursProbe, summarize, trustBand, TRUST_BAND_FLOORS } from "./human-lazy-probe";
import { trustPhrase } from "../ui/session/bands";

const setup: Setup = { lastName: "Player", jerseyNumber: 7, homeState: "TX", position: "QB" };

// The probe prints the band a player would actually read. If the UI's table
// moves and this copy does not, every band row in report 037 silently becomes
// a claim about a phrase nobody is shown.
describe("the probe's locker-room bands are the UI's bands", () => {
  it("agrees with ui/session/bands.ts at every integer character value", () => {
    for (let c = 0; c <= 100; c++) expect(trustBand(c), `character ${c}`).toBe(trustPhrase(c));
  });

  it("covers the whole range with no gap", () => {
    expect(TRUST_BAND_FLOORS[TRUST_BAND_FLOORS.length - 1]!.min).toBe(0);
  });
});

describe("the humanLazy policy", () => {
  const policy = makePolicy(PROFILES.humanLazyFull);

  // Rule 1. These are the cards the brief is about: a character loss paired
  // with an overall gain. `lazy` DECLINES them because they are net-positive
  // draft stock; a human bad player is exactly the player who takes them.
  it("takes the corrosive branch of every off-field temptation", () => {
    const corrosive: Record<string, string> = {
      "offfield-group-chat": "let-it-fly",
      "offfield-money-manager": "let-him-handle-it",
      "offfield-sportsbook-nil": "take-the-money",
      "offfield-skip-install": "do-the-podcast",
      "offfield-training-table": "cut-the-line",
      "offfield-ticket-hookup": "sell-them",
      "offfield-bowl-curfew": "sneak-out",
      "offfield-ghost-media": "no-show",
      "offfield-entourage": "lean-in",
      "offfield-portal-rumor": "let-it-work",
      "offfield-coordinator-blowup": "double-down",
      "offfield-curfew-check": "stay-out",
      "offfield-exit-interview": "argue-the-tape",
    };
    const s = createCareer(setup, "hl-content", CONTENT);
    const rngless = { next: () => 0.5, cursor: 0 };
    for (const [eventId, optionId] of Object.entries(corrosive)) {
      const ev = CONTENT.events.find((e) => e.id === eventId)!;
      const state = { ...s, currentEventId: eventId } as GameState;
      expect(policy(state, ev.options.map((o) => ({ id: o.id, label: o.label })), rngless), eventId).toBe(optionId);
    }
  });

  // Rule 2, the load-bearing half. Where no option carries a character effect
  // the human bad player is not sandbagging -- he plays the football card the
  // way a good player does. This is what separates humanLazy from `lazy` and
  // from `antisocial`, both of which minimise draft stock on these cards.
  it("plays a card with no character axis exactly as `best` does", () => {
    const best = makePolicy(PROFILES.good);
    const s = createCareer(setup, "hl-tie", CONTENT);
    const rngless = { next: () => 0.5, cursor: 0 };
    let compared = 0;
    for (const ev of CONTENT.events) {
      if (ev.options.length < 2) continue;
      if (ev.options.some((o) => Math.abs(optionCharacterScore(o)) > 1e-9)) continue;
      const state = { ...s, currentEventId: ev.id } as GameState;
      const opts = ev.options.map((o) => ({ id: o.id, label: o.label }));
      expect(policy(state, opts, rngless), ev.id).toBe(best(state, opts, rngless));
      compared++;
    }
    expect(compared).toBeGreaterThan(20);
  });

  it("differs from lazy, antisocial and good on a substantial share of the content", () => {
    let vsGood = 0, vsLazy = 0, vsAnti = 0, total = 0;
    const s = createCareer(setup, "hl-diff", CONTENT);
    const rngless = { next: () => 0.5, cursor: 0 };
    const lazy = makePolicy(PROFILES.lazyFull);
    const anti = makePolicy(PROFILES.antisocialFull);
    const good = makePolicy(PROFILES.good);
    for (const ev of CONTENT.events) {
      if (ev.options.length < 2) continue;
      const state = { ...s, currentEventId: ev.id } as GameState;
      const opts = ev.options.map((o) => ({ id: o.id, label: o.label }));
      const h = policy(state, opts, rngless);
      total++;
      if (h !== good(state, opts, rngless)) vsGood++;
      if (h !== lazy(state, opts, rngless)) vsLazy++;
      if (h !== anti(state, opts, rngless)) vsAnti++;
    }
    expect(total).toBeGreaterThan(80);
    expect(vsGood / total).toBeGreaterThan(0.25);
    expect(vsLazy / total).toBeGreaterThan(0.4);
    expect(vsAnti / total).toBeGreaterThan(0.1);
  });

  it("only ever returns an id the engine offered, and always reaches a terminal state", () => {
    for (const name of ["humanLazyFull", "humanLazyAmbitious"] as const) {
      const p = makePolicy(PROFILES[name]);
      let s: GameState = createCareer(setup, `hl-valid-${name}`, CONTENT);
      const rngless = { next: () => 0.5, cursor: 0 };
      for (let i = 0; i < 80 && s.status === "active"; i++) {
        const d = getDecision(s, CONTENT);
        if (!d) break;
        const choice = p(s, d.options, rngless);
        expect(d.options.map((o) => o.id), `${name} chose ${choice} for ${d.eventId}`).toContain(choice);
        s = advance(s, choice, CONTENT);
      }
      for (let i = 0; i < 3; i++) {
        expect(["drafted", "busted"]).toContain(playCareer(setup, `hl-term-${name}-${i}`, p).status);
      }
    }
  });

  it("is deterministic for a fixed seed", () => {
    const a = playCareer(setup, "hl-det", makePolicy(PROFILES.humanLazyAmbitious));
    const b = playCareer(setup, "hl-det", makePolicy(PROFILES.humanLazyAmbitious));
    expect(a).toEqual(b);
  });

  // The finding the report leads with, pinned as a test so a content change
  // that fixes it fails here and forces the report to be re-read.
  it("ends a career in the bottom locker-room band far more often than `good` does", () => {
    const share = (name: keyof typeof PROFILES) => {
      const states = Array.from({ length: 60 }, (_, i) =>
        playCareer(setup, `hl-band-${i}`, makePolicy(PROFILES[name])),
      );
      return states.filter((s) => s.character < 30).length / states.length;
    };
    expect(share("humanLazyAmbitious")).toBeGreaterThan(0.8);
    expect(share("good")).toBeLessThan(0.4);
  });
});

describe("the honours probe", () => {
  it("reports every honour separately and every rate in [0,1]", () => {
    const r = runHonoursProbe(40, "hl-probe", "good", "QB");
    for (const k of ["bustedRate", "undraftedRate", "draftedRate", "allAmericanRate", "heismanRate", "allConferenceRate", "anyAwardRate", "anyTrophyRate"] as const) {
      expect(r[k], k).toBeGreaterThanOrEqual(0);
      expect(r[k], k).toBeLessThanOrEqual(1);
    }
    expect(r.bustedRate + r.undraftedRate + r.draftedRate).toBeCloseTo(1);
    expect(Object.values(r.bandShare).reduce((a, b) => a + b, 0)).toBeCloseTo(1);
  });

  it("summarizes an empty-honours cohort without dividing by zero", () => {
    const busted = { ...createCareer(setup, "hl-empty", CONTENT), status: "busted" as const, endingReason: "test" };
    const r = summarize("t", "QB", [busted]);
    expect(r.medianRound).toBe(0);
    expect(r.pickedAllAmericanRate).toBe(0);
    expect(r.endingReasons).toEqual({ test: 1 });
  });
});
