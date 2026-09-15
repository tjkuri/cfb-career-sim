import { describe, it, expect } from "vitest";
import { bustPoolShares, runProbe, summarizeTraces, traceCareer } from "./failure-probe";
import { playCareer } from "./play-headless";
import { makePolicy, PROFILES, randomPolicy } from "./policies";
import { BUST_EVENTS } from "../content/events/bust";
import { ALL_POSITIONS, type Setup } from "../engine/index";

const setup: Setup = { lastName: "P", jerseyNumber: 1, homeState: "TX", position: "QB" };

describe("traceCareer", () => {
  it("produces exactly the career play-headless produces", () => {
    // The probe reimplements playCareer's loop to record what it saw. If the
    // copy ever drifts, every number in report 018 is measuring a different
    // game than `npm run balance` is.
    for (let i = 0; i < 30; i++) {
      const traced = traceCareer(setup, `eq-${i}`, randomPolicy);
      const played = playCareer(setup, `eq-${i}`, randomPolicy);
      expect(traced.state).toEqual(played);
    }
  });

  it("records one decision id per advance and reaches a terminal state", () => {
    const t = traceCareer(setup, "trace-1", makePolicy(PROFILES.lazyFull));
    expect(["drafted", "busted"]).toContain(t.state.status);
    expect(t.decisionIds.length).toBeGreaterThan(5);
    expect(t.minOverall).toBeLessThanOrEqual(t.state.overall);
    expect(t.minCharacter).toBeLessThanOrEqual(t.state.character);
  });

  it("only ever reports a bust event that the content actually defines", () => {
    const known = new Set(BUST_EVENTS.map((e) => e.id));
    for (let i = 0; i < 40; i++) {
      for (const id of traceCareer(setup, `bt-${i}`, makePolicy(PROFILES.antisocialFull)).bustEventsSeen) {
        expect(known).toContain(id);
      }
    }
  });
});

describe("summarizeTraces", () => {
  const report = runProbe(120, "probe-test", "baselineRandom");

  it("splits the busted terminal into mechanisms that add back up", () => {
    expect(report.washoutOverallRate + report.washoutBuriedRate + report.eventBustRate).toBeCloseTo(report.bustedRate, 10);
  });

  it("accounts for every career exactly once", () => {
    expect(report.bustedRate + report.undraftedRate + report.pickedRate).toBeCloseTo(1, 10);
    // roundShare[0] is the undrafted bucket; 1..7 are the picked ones.
    const summed = report.roundShare.reduce((a, b) => a + b, 0);
    expect(summed).toBeCloseTo(1 - report.bustedRate, 10);
    expect(report.roundShare[0]).toBeCloseTo(report.undraftedRate, 10);
  });

  it("reports failRate as busted-or-undrafted", () => {
    expect(report.failRate).toBeCloseTo(report.bustedRate + report.undraftedRate, 10);
  });

  it("keeps the stock histogram consistent with the careers that reached the draft", () => {
    const mass = Object.values(report.stockHistogram).reduce((a, b) => a + b, 0);
    expect(mass).toBeCloseTo(1, 10); // shares over careers that reached the draft
    const byClass = Object.values(report.stockCountsByClass)
      .flatMap((h) => Object.values(h))
      .reduce((a, b) => a + b, 0);
    expect(byClass / report.runs).toBeCloseTo(1 - report.bustedRate, 10);
  });

  it("orders its percentiles and reports every rate as a probability", () => {
    expect(report.minFinalOverall).toBeLessThanOrEqual(report.overallP05);
    expect(report.overallP05).toBeLessThanOrEqual(report.overallP50);
    expect(report.minDraftStock).toBeLessThanOrEqual(report.stockP05);
    expect(report.stockP05).toBeLessThanOrEqual(report.stockP50);
    for (const v of [report.failRate, report.bustedRate, report.undraftedRate, report.pickedRate, report.round1Rate, report.bustEventSurfacedRate]) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });

  it("is reproducible for a fixed seed prefix, profile and position", () => {
    expect(runProbe(60, "repro", "lazyFull")).toEqual(runProbe(60, "repro", "lazyFull"));
  });

  it("actually simulates the position it is given", () => {
    const { position: _a, ...qb } = runProbe(60, "perpos", "lazyFull", "QB");
    const { position: _b, ...k } = runProbe(60, "perpos", "lazyFull", "K");
    expect(qb).not.toEqual(k);
  });

  it("summarizes an empty-ish sample without dividing by zero", () => {
    const one = runProbe(1, "single", "lazyFull");
    expect(one.runs).toBe(1);
    expect(Number.isFinite(one.avgDraftStock)).toBe(true);
  });
});

describe("bustPoolShares", () => {
  it("gives every bust event a real but minority share of its phase's draw", () => {
    const shares = bustPoolShares("QB");
    expect(shares).toHaveLength(BUST_EVENTS.length);
    for (const s of shares) {
      // The state is constructed to satisfy the event's own gate, so it must
      // be in the pool — a zero here means the gate model has drifted from
      // eventMatches and the exposure numbers in report 018 are wrong.
      expect(s.eligiblePoolWeight, s.bustEventId).toBeGreaterThanOrEqual(s.bustWeight);
      expect(s.drawShare, s.bustEventId).toBeGreaterThan(0);
      expect(s.drawShare, s.bustEventId).toBeLessThan(0.5);
    }
  });

  it("holds for every position", () => {
    for (const pos of ALL_POSITIONS) {
      for (const s of bustPoolShares(pos)) expect(s.drawShare, `${pos} ${s.bustEventId}`).toBeGreaterThan(0);
    }
  });
});
