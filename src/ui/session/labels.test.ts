import { describe, it, expect } from "vitest";
import { CONTENT } from "../../content/index";
import { ALL_POSITIONS } from "../../engine/index";
import {
  FALLBACK_ICON,
  awardLabel,
  iconGlyph,
  knownAwardIds,
  knownIcons,
  knownStatKeys,
  knownTrophyIds,
  statLabel,
  trophyLabel,
} from "./labels";

// The completeness guard. Content that adds a trophy, award, stat key or moment
// icon fails here rather than shipping a raw id -- or a blank -- to the player.

describe("label completeness against CONTENT", () => {
  it("labels every trophy id", () => {
    for (const id of CONTENT.trophyIds) {
      expect(knownTrophyIds(), `trophy ${id}`).toContain(id);
      expect(trophyLabel(id)).not.toBe(id);
    }
  });

  it("labels every award id", () => {
    for (const id of CONTENT.awardIds) {
      expect(knownAwardIds(), `award ${id}`).toContain(id);
      expect(awardLabel(id)).not.toBe(id);
    }
  });

  it("labels every stat key of every position", () => {
    for (const position of ALL_POSITIONS) {
      for (const key of CONTENT.positions[position].stats) {
        expect(knownStatKeys(), `stat ${key}`).toContain(key);
        expect(statLabel(position, key)).not.toBe(key);
      }
    }
  });

  it("gives every authored moment icon a glyph", () => {
    const authored = new Set<string>();
    for (const ev of CONTENT.events) {
      for (const opt of ev.options) {
        for (const outcome of [opt.positiveOutcome, opt.negativeOutcome]) {
          for (const eff of outcome?.effects ?? []) {
            if (eff.kind === "moment") authored.add(eff.icon);
          }
        }
      }
    }
    expect(authored.size).toBeGreaterThan(0);
    for (const icon of authored) {
      expect(knownIcons(), `icon ${icon}`).toContain(icon);
      expect(iconGlyph(icon)).not.toBe(FALLBACK_ICON);
    }
  });
});

describe("label behaviour", () => {
  it("distinguishes a thrown interception from a caught one", () => {
    expect(statLabel("QB", "ints")).not.toBe(statLabel("DSKILL", "ints"));
    expect(statLabel("QB", "ints")).toContain("Thrown");
  });

  it("falls back rather than blanking on an unknown icon", () => {
    expect(iconGlyph("no-such-icon")).toBe(FALLBACK_ICON);
  });

  it("falls back to the raw id for an unknown trophy or award", () => {
    expect(trophyLabel("mystery")).toBe("mystery");
    expect(awardLabel("mystery")).toBe("mystery");
  });
});
