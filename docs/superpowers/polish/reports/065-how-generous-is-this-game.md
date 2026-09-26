# 065 — How generous is this game, and does anything know where you played?

**Type:** measurement only · **Wave:** 34 · **Ships:** nothing. No product code, no balance change.
**Brief:** `docs/superpowers/polish/briefs/065-how-generous-is-this-game.md`

> Status: IN PROGRESS — sections are appended as each chunk lands.

---

## §1 — Does any award condition reference programme tier? Resolved to source, by hand

**Answer: NO. No award condition references programme tier, directly or through any argument it is
given.** This is a source fact, not an estimate.

### The call chain, verbatim

`src/engine/postseason.ts`:

```ts
export function resolveAwards(
  position: Position,
  overall: number,
  stats: Record<string, number>,
  wonAnyTrophy: boolean,
  cfg: PostseasonConfig,
  rng: Rng,
): Effect[] {
  const effects: Effect[] = [];
  const mult = cfg.positionMultiplier[position];
  for (const award of cfg.prestige) {
    const boost = wonAnyTrophy ? 1 + award.teamSuccessBoost : 1;
    const p = Math.min(1, bandProb(overall, award.bands) * mult * boost);
    if (rng.next() < p) effects.push({ kind: "award", id: award.id });
  }
  for (const award of cfg.production) {
    if (award.position !== position) continue;
    if ((stats[award.stat] ?? 0) < award.threshold) continue;
    if (rng.next() < award.prob) effects.push({ kind: "award", id: award.id });
  }
  return effects;
}
```

**`resolveAwards` is not passed `tier`, and it does not read `state`.** Its four inputs are
position, overall, that season's stat line, and a boolean. The caller
(`runPostseasonResolver`, same file) has `state.school.tier` in hand and passes
`state.setup.position`, `state.overall`, `season.stats` and `trophyEffects.length > 0` — tier is
available at the call site and is deliberately not forwarded.

So the **Heisman** (a `prestige` award) is
`P = bandProb(overall) × positionMultiplier[position] × (wonAnyTrophy ? 1.5 : 1)`,
and **All-American** the same with a 1.3 boost. At `src/content/postseason.ts`:

- heisman bands: `overall ≥ 92 → 0.50`, `≥ 88 → 0.25`, `≥ 84 → 0.08`, else 0
- allAmerican bands: `≥ 92 → 0.60`, `≥ 88 → 0.40`, `≥ 85 → 0.25`, `≥ 80 → 0.12`, `≥ 75 → 0.04`
- positionMultiplier: `QB 1.0`, `OSKILL 0.8`, `DL/DSKILL 0.4`, `OL 0.15`, `K 0.05`

**All-Conference** is a `production` award: a per-position stat threshold and a flat `prob`
(0.7, or 0.6 for K). Tier is absent there too — the gate is `stats[award.stat] >= threshold`, and
stats come from snaps, not from the opponent.

### Where tier *does* enter, and it is the only channel

`grep -n "tier" src/engine/*.ts` (non-test) resolves to exactly five live uses:

| Site | What tier does |
|---|---|
| `postseason.ts:16` `simulateTeamRecord` | `tierBaseWinPct` = `{1: 0.45, 2: 0.50, 3: 0.58, 4: 0.68}` — the team's per-game win probability |
| `postseason.ts:27,29` `resolveTrophies` | conference-title prob by tier `{1:.5, 2:.45, 3:.4, 4:.5}`; CFP prob by tier `{1:.05, 2:.10, 3:.20, 4:.35}`. **Bowl win is `minWins ≥ 7, prob 0.55` — not tier-keyed at all** |
| `select-event.ts:16` | an event may gate on tier. 9 authored cards do (6 position cards on `[1,2]`, 3 universal on `[2,3,4]`/`[3,4]`) |
| `transfer.ts` / `recruiting.ts` / `schools.ts` | which schools are offered, and the snap modifier attached to moving |
| `draft.ts:23-26` `eligibleTiers` | which tiers a given draft stock may be *offered* |

**So tier reaches the Heisman by exactly one indirect path: tier → win pct → `wonAnyTrophy` →
a ×1.5 multiplier on a probability that was already decided by overall and position.** The floor
on that path is a factor of 1.5, and it is capped: a tier-1 player at overall 92 who wins no
trophy draws 0.50; the same player at tier 4 who wins one draws 0.75. **Overall is the award.
Where you played moves it by at most one third.**

*(Measured confirmation of that channel's size is in §5.)*
