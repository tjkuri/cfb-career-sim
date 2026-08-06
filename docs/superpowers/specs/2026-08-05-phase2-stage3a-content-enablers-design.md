# CFB Career Sim — Phase 2 Stage 3a Design Spec: Content Enablers

**Date:** 2026-08-05
**Status:** Approved design, pre-implementation
**Parent spec:** `docs/superpowers/specs/2026-08-02-phase2-content-engine-design.md` (Decision 4b, §7 positions)
**Predecessors:** Stages 1, 2a, 2b, 2c — all merged.

## Purpose

Stage 3 is the content push. It splits into **3a (enablers — this spec)** and **3b (the authoring pile)**. 3a lights up two mechanisms the authoring in 3b depends on, kept small and sequential to de-risk them before the content flood:

1. **Fire authored fixed milestone events** — today only *random* events surface per phase; scripted milestones can't fire at all.
2. **Give the Kicker real, countable stats** — today K's stat model yields all zeros, so kickers can't accumulate stats or earn awards even as the intended hard-mode.

Bounded-pass scope was chosen (playable-and-varied for all positions, ~50–70 events total across Stage 3), parallel subagent authoring for 3b's flavor pile, and the existing light "silly + real-seeming" tone.

## Enabler 1 — Fire fixed milestone events (engine)

### Current behavior
`autoProgress` (in `src/engine/advance.ts`), per phase, after ticking + producing once, draws **at most one random event** (`selectRandomEvent`, which filters `kind === "random"`). Authored `fixed` events never surface — only the engine-special `recruiting` and the synthetic hub decisions (`declare`/`transfer`/`redshirt`) do.

### New behavior
Per phase, after production: **fire every matching `fixed` event, one at a time** (each is a decision resolved by a separate `advance()` call), **then** the single random draw, **then** advance the phase. A fixed event "matches" when `kind === "fixed"`, `eventMatches(state, ev)` passes (existing phase/condition gate), and `id !== "recruiting"` (still engine-special).

### Mechanism
- Two new `GameState` fields, reset when a phase is first entered (when `phaseSimulated` flips true): `phaseFiredEventIds: string[]` (fixed events already fired this phase) and `phaseRandomDrawn: boolean` (the one random draw has happened).
- The `autoProgress` phase-handling block is restructured: (a) tick + create season line + produce, once, resetting the two fields; (b) fire the first matching fixed event not in `phaseFiredEventIds` (stop for a decision); (c) once no unfired fixed events remain, do the single random draw guarded by `phaseRandomDrawn`; (d) run the postseason resolver (postseason only) and advance the phase.
- When a content event is resolved in `applyChoice`, if it was `kind === "fixed"` its id is pushed to `phaseFiredEventIds`, so re-entry after the decision picks the next unfired fixed event.

### Frequency semantics (content authors' responsibility)
Fixed events fire **whenever their conditions match**, i.e. once per matching phase per season — there is **no once-per-career mechanism** in this stage. Authors gate frequency with existing conditions (`minClass`, `phase`, `tier`, `position`, `max*`) so a milestone fires when intended (e.g. `minClass: SR` + `phase: postseason` ≈ a senior-year beat). A true once-per-career flag is out of scope; add it later if needed.

### Determinism
Firing a fixed event consumes no rng (it's gated by conditions, not a roll); its options resolve like any content event. The random draw is unchanged (one `selectRandomEvent` per phase). The determinism guarantee holds; adding fixed events to a phase shifts nothing in the rng sequence except the (unchanged) single random draw's position relative to the resolved fixed events.

## Enabler 2 — Kicker real stats (engine + content)

### Problem
`POSITIONS.K.stats = ["fgPct", "longFg", "gameWinners"]` and `STAT_MODEL.K.per100 = { fgPct: 0, longFg: 0, gameWinners: 0 }` — kickers accumulate **zero** stats, so they can never cross a production-award threshold, and the 0.05 prestige multiplier makes prestige awards near-impossible too. Kickers currently can't earn any recognition.

### The stat-shape mismatch
The engine's production model **accumulates** `per100 × snaps`. `fgPct` is a *rate* (made/attempted) and `longFg` is a *max*, neither of which fits an accumulating sum. So K's headline stats are redefined to **countable** ones.

### Change (approved)
- `POSITIONS.K.stats = ["fieldGoals", "points", "gameWinners"]` (content — `positions.ts`).
- `STAT_MODEL.K` gets real yields (engine — `simulate.ts`), initial/tunable, e.g. `snapsMin/Max` stay low (40–70; kickers play few snaps) and `per100 = { fieldGoals: 1.4, points: 6, gameWinners: 0.2 }` — a season (~120–210 snaps over 3 phases at overall 70) yields roughly ~2–3 FGs·… *(exact values are Stage-4-tunable; the point is non-zero, position-appropriate production)*.
- Add a K **production-award row** to the postseason config (`content/postseason.ts`): `{ id: "allConference", position: "K", stat: "fieldGoals", threshold: <tunable>, prob: <tunable> }`, so a strong kicker can earn All-Conference. The K prestige multiplier **stays 0.05** — hard-mode draft ceiling intact.

### Validation
Known-stats are derived from `POSITIONS`, so renaming K's stats auto-updates the validator's known set; the new K award row's `stat` must be one of the new K stats (validator already checks this). Real `CONTENT` must validate clean.

## Engine vs content

| Piece | Engine | Content |
|---|---|---|
| Fixed-event firing | `autoProgress` restructure + 2 GameState fields + `applyChoice` records fired ids | milestone events themselves (3b) |
| Kicker production | `STAT_MODEL.K` yields | `POSITIONS.K.stats` names, K award row |

## Out of scope (→ 3b or later)

- The authored content itself (milestones, per-position events, off-field, bust events, school-ladder expansion) — all Stage 3b.
- A once-per-career fixed-event mechanism.
- Reworking K to keep FG%/long-FG via a special-cased stat path.
- Balance-tuning the new K yields / award thresholds — Stage 4.

## Testing

- **Fixed events:** with a small test content bundle containing one or more `fixed` non-recruiting events matching a phase, `getDecision` surfaces them in order, each resolves, they don't re-fire, and the single random draw still happens after; determinism (same seed+policy → identical) holds; a phase with several fixed events surfaces each exactly once.
- **Kicker:** a K career accumulates non-zero `fieldGoals`/`points` over a season; a strong kicker earns `allConference` across seeds (reachability); K prestige awards remain near-zero (hard-mode); real `CONTENT` validates clean.
