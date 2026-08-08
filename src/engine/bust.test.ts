import { describe, it, expect } from "vitest";
import { createCareer } from "./create-career";
import { getDecision, advance } from "./advance";
import { CONTENT } from "../content/index";
import { BUST_EVENTS } from "../content/events/bust";
import type { Setup, GameState } from "./types";

const setup: Setup = { lastName: "Doe", jerseyNumber: 3, homeState: "TX", position: "QB" };

describe("bust content", () => {
  it("authors at least one event per bust path", () => {
    expect(BUST_EVENTS.length).toBeGreaterThanOrEqual(6);
    for (const ev of BUST_EVENTS) {
      expect(ev.kind).toBe("random");
      expect(ev.conditions).toBeDefined();
      const gated =
        ev.conditions!.maxCharacter !== undefined ||
        ev.conditions!.maxOverall !== undefined ||
        ev.conditions!.requiresActiveInjury === true;
      expect(gated, `bust event "${ev.id}" has no vulnerability gate`).toBe(true);
    }
  });

  it("every bust event can actually end a career", () => {
    for (const ev of BUST_EVENTS) {
      const endings = ev.options.flatMap((o) =>
        [o.positiveOutcome, o.negativeOutcome].filter(Boolean).flatMap((oc) => oc!.effects),
      ).filter((e) => e.kind === "ending");
      expect(endings.length, `bust event "${ev.id}" emits no ending effect`).toBeGreaterThan(0);
    }
  });

  it("drives a vulnerable career to busted through a content event", () => {
    // Pool contains exactly one bust event, so the draw is forced. The career
    // starts deeply vulnerable, so its gate matches.
    const only = BUST_EVENTS.find((e) => e.id === "bust-arrest")!;
    const content = { ...CONTENT, events: [...CONTENT.events.filter((e) => e.kind === "fixed"), only] };

    let s: GameState = createCareer(setup, "bust-e2e", content);
    s = advance(s, getDecision(s, content)!.options[0]!.id, content); // commit to a school
    s = { ...s, character: 5 };

    // Drive until the bust event surfaces, then take the riskiest option. That
    // option is not deterministically fatal (its negative outcome is a roll), so
    // the seed is hand-picked below to make this test deterministic — see Step 4.
    for (let i = 0; i < 40 && s.status === "active"; i++) {
      const d = getDecision(s, content);
      if (!d) break;
      const choice = d.eventId === only.id ? d.options[d.options.length - 1]!.id : d.options[0]!.id;
      s = advance(s, choice, content);
    }

    expect(s.status, `career ended as "${s.status}" instead of busted`).toBe("busted");
    expect(s.endingReason).toBeTruthy();
  });
});
