import { describe, it, expect } from "vitest";
import { CONTENT } from "../../content/index";
import { ALL_POSITIONS } from "../../engine/index";
import {
  FALLBACK_ICON,
  countedStatLabel,
  isUninflected,
  knownPhases,
  phaseLabel,
  awardLabel,
  iconGlyph,
  knownAwardIds,
  knownIcons,
  knownSingularLabels,
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

  it("gives every season phase a display name, never the raw id", () => {
    const phases = knownPhases();
    expect(phases).toHaveLength(4);
    const labels = new Set<string>();
    for (const phase of phases) {
      const label = phaseLabel(phase);
      expect(label.length).toBeGreaterThan(0);
      expect(label).not.toBe(phase);
      labels.add(label);
    }
    // Distinct, so a player can tell non-conference from conference play.
    expect(labels.size).toBe(4);
  });
});

// ---------------------------------------------------------------------------
// `1 Game-Winners` (017 playtest, claim 10.2)
//
// The header prints `<count> <label>` and every stat label in the table is
// written plural, so this was wrong for eight stats and not just the one the
// playtester happened to see. The coverage test below is the actual fix: a
// stat added to the table without a singular form fails here rather than
// printing `1 Fumbles` at a player.
// ---------------------------------------------------------------------------

describe("counted stat labels", () => {
  it("gives every plural label a singular form", () => {
    const missing: string[] = [];
    for (const position of ALL_POSITIONS) {
      for (const key of CONTENT.positions[position].stats) {
        const label = statLabel(position, key);
        if (!label.endsWith("s")) continue;
        if (isUninflected(label)) continue;
        if (countedStatLabel(label, 1) === label) missing.push(`${position}.${key} -> ${label}`);
      }
    }
    expect(missing, "plural labels with no singular form").toEqual([]);
  });

  it("only singularizes at a count of exactly one", () => {
    expect(countedStatLabel("Game-Winners", 1)).toBe("Game-Winner");
    expect(countedStatLabel("Game-Winners", 2)).toBe("Game-Winners");
    expect(countedStatLabel("Game-Winners", 0)).toBe("Game-Winners");
    expect(countedStatLabel("Pancakes", 27)).toBe("Pancakes");
  });

  // `FG -1` is live in the header today (017 claim 10.1, an engine stat bug
  // that is not this brief's to fix). Whatever the engine hands us, `-1 FG`
  // takes the singular, because minus one does in English.
  it("treats minus one as singular", () => {
    expect(countedStatLabel("Points", -1)).toBe("Point");
    expect(countedStatLabel("Points", -3)).toBe("Points");
  });

  it("inflects the head noun, wherever it sits in the label", () => {
    expect(countedStatLabel("Sacks Allowed", 1)).toBe("Sack Allowed");
    expect(countedStatLabel("Pass Yds", 1)).toBe("Pass Yd");
  });

  it("leaves abbreviations and non-plurals alone", () => {
    for (const label of ["FG", "TFL", "PBU", "TD", "INT", "INT Thrown", "Rec"]) {
      expect(countedStatLabel(label, 1), label).toBe(label);
    }
  });

  it("never maps a singular form back onto another label", () => {
    const singulars = new Set(knownSingularLabels().map((l) => countedStatLabel(l, 1)));
    expect(singulars.size).toBe(knownSingularLabels().length);
  });
});
