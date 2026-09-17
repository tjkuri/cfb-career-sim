import { describe, it, expect } from "vitest";
import {
  OPENER_EVENT_IDS,
  runVirtueProbe,
  singleOptionEventIds,
  summarizeVirtue,
  traceVirtue,
  type VirtueTrace,
} from "./virtue-probe";
import { makePolicy, PROFILES } from "./policies";
import { CONTENT } from "../content/index";
import type { Setup } from "../engine/types";

const setup: Setup = { lastName: "P", jerseyNumber: 1, homeState: "TX", position: "QB" };

describe("the virtue probe", () => {
  it("knows the five Season Openers by their ids, from the bundle", () => {
    expect(OPENER_EVENT_IDS).toHaveLength(5);
    for (const id of OPENER_EVENT_IDS) {
      expect(CONTENT.events.find((e) => e.id === id), id).toBeDefined();
    }
  });

  // The attribution split in report 047 is stated as "the one-button cards",
  // and after brief 049 the openers are no longer among them. If that stops
  // being true the split silently starts double-counting.
  it("no longer counts a Season Opener as a card the player was not asked about", () => {
    const singles = singleOptionEventIds();
    for (const id of OPENER_EVENT_IDS) expect(singles.has(id), id).toBe(false);
  });

  it("is deterministic for a fixed seed and profile", () => {
    const policy = makePolicy(PROFILES.virtueLoyal);
    const a = traceVirtue(setup, "vp-det", policy);
    const b = traceVirtue(setup, "vp-det", policy);
    expect(a.earned).toBe(b.earned);
    expect(a.cost).toBe(b.cost);
    expect(a.finalCharacter).toBe(b.finalCharacter);
    expect(a.lines.map((l) => `${l.eventId}/${l.optionId}/${l.lockerRoom}`)).toEqual(
      b.lines.map((l) => `${l.eventId}/${l.optionId}/${l.lockerRoom}`),
    );
  });

  // The probe's whole claim is that it measures the SENTENCE, not a proxy for
  // it: `cardAccount().lockerRoom` is exactly what CareerScreen turns into
  // *"Earned you credit in the locker room."* So a line marked credit must have
  // moved character up, and one marked cost must have moved it down.
  it("agrees with the character the card actually moved, line for line", () => {
    const policy = makePolicy(PROFILES.baselineRandom);
    for (let i = 0; i < 25; i++) {
      for (const line of traceVirtue(setup, `vp-sign-${i}`, policy).lines) {
        if (line.lockerRoom === "credit") expect(line.characterDelta).toBeGreaterThan(0);
        if (line.lockerRoom === "cost") expect(line.characterDelta).toBeLessThan(0);
      }
    }
  });

  it("summarises an empty-ish sample without dividing by zero", () => {
    const traces: VirtueTrace[] = [];
    const policy = makePolicy(PROFILES.virtueLoyal);
    for (let i = 0; i < 3; i++) traces.push(traceVirtue(setup, `vp-sum-${i}`, policy));
    const r = summarizeVirtue("virtueLoyal", "QB", traces);
    expect(r.runs).toBe(3);
    expect(r.net).toBeCloseTo(r.earnedMean - r.costMean);
    expect(r.costLinesOneButton + r.costLinesChosen).toBeCloseTo(r.costMean);
  });

  // Route R2's headline, at a sample small enough to run in a test file. The
  // openers were a one-way tax; a player taking the team-first branch now takes
  // the new option on every one of them.
  it("sends a maximum-virtue player down the new opener branch every time", () => {
    const r = runVirtueProbe(120, "b62p2", "virtueLoyal", "QB");
    expect(r.openerNewOptionShare).toBe(1);
    expect(r.costLinesOpener).toBeLessThan(0.35);
  });

  // ...and leaves the badly-behaved player exactly where it found them. This is
  // the zero-leakage property that chose R2 over R1 and R3, and it is cheap
  // enough to assert directly.
  it("leaves the badly-behaved player on the old opener branch", () => {
    const r = runVirtueProbe(120, "b62p2", "humanLazyAmbitious", "QB");
    expect(r.openerNewOptionShare).toBe(0);
  });
});
