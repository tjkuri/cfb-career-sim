import { describe, it, expect } from "vitest";
import { resolveOutcome } from "./outcomes";
import { createRng } from "./rng";
import type { EventOption } from "./types";

const opt: EventOption = {
  id: "gym",
  label: "New workout regimen",
  probability: 0.5,
  positiveOutcome: { description: "gains", effects: [{ kind: "overall", timing: "immediate", amount: 3 }] },
  negativeOutcome: { description: "hurt", effects: [{ kind: "injury", injuryType: "hamstring" }] },
};

describe("resolveOutcome", () => {
  it("returns positiveOutcome when probability is 1", () => {
    const o = resolveOutcome({ ...opt, probability: 1 }, createRng("a"));
    expect(o.description).toBe("gains");
  });

  it("returns negativeOutcome when probability is 0", () => {
    const o = resolveOutcome({ ...opt, probability: 0 }, createRng("a"));
    expect(o.description).toBe("hurt");
  });

  it("falls back to positiveOutcome when no negativeOutcome is defined", () => {
    const deterministic: EventOption = { ...opt, probability: 0, negativeOutcome: undefined };
    expect(resolveOutcome(deterministic, createRng("a")).description).toBe("gains");
  });

  it("is deterministic for a given rng seed/cursor", () => {
    const a = resolveOutcome(opt, createRng("same"));
    const b = resolveOutcome(opt, createRng("same"));
    expect(a.description).toBe(b.description);
  });
});
