import { describe, it, expect } from "vitest";
import { createCareer } from "./create-career";
import { applyEffect, tickPhaseStart } from "./effects";
import { eventMatches } from "./select-event";
import { CONTENT } from "../content/index";
import { INJURIES } from "../content/injuries";
import type { Effect, GameState, Outcome, Setup } from "./types";

const setup: Setup = { lastName: "Doe", jerseyNumber: 3, homeState: "TX", position: "QB" };
const injuryOf = (t: string) => CONTENT.injuries[t] ?? { overallDelta: 3, recoveryPhases: 1 };

describe("long injuries reach the offseason", () => {
  it("some content event inflicts an injury lasting at least three phases", () => {
    const long = CONTENT.events.filter((ev) =>
      ev.options
        .flatMap((o) => [o.positiveOutcome, o.negativeOutcome].filter((oc): oc is Outcome => oc !== undefined))
        .flatMap((oc: Outcome) => oc.effects)
        .some((e: Effect) => e.kind === "injury" && (INJURIES[e.injuryType]?.recoveryPhases ?? 0) >= 3),
    );
    expect(long.length, "no event inflicts an injury with recoveryPhases >= 3, so bust-mri stays dead").toBeGreaterThan(0);
  });

  it("a conference-phase mcl survives into the offseason and makes bust-mri match", () => {
    const s: GameState = { ...createCareer(setup, "mri-reach"), phase: "conference" };
    applyEffect(s, { kind: "injury", injuryType: "mcl" }, injuryOf);
    expect(s.injuries[0]!.remainingPhases).toBe(3);

    // Two phase entries between the conference event and the offseason draw.
    s.phase = "postseason";
    tickPhaseStart(s, injuryOf);
    s.phase = "offseason";
    tickPhaseStart(s, injuryOf);

    expect(s.injuries.some((i) => i.kind === "injury"), "the mcl expired before the offseason").toBe(true);

    const mri = CONTENT.events.find((e) => e.id === "bust-mri")!;
    expect(eventMatches(s, mri), "bust-mri does not match a player carrying a live injury in the offseason").toBe(true);
  });

  it("confirms a two-phase injury would NOT have been enough", () => {
    // Guards the reasoning above: this is why the required injury is mcl and
    // not ankle or shoulder.
    const s: GameState = { ...createCareer(setup, "mri-reach"), phase: "conference" };
    applyEffect(s, { kind: "injury", injuryType: "ankle" }, injuryOf); // recoveryPhases 2
    s.phase = "postseason";
    tickPhaseStart(s, injuryOf);
    s.phase = "offseason";
    tickPhaseStart(s, injuryOf);
    expect(s.injuries.some((i) => i.kind === "injury")).toBe(false);
  });
});
