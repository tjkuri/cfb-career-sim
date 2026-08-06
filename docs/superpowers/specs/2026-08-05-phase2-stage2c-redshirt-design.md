# CFB Career Sim — Phase 2 Stage 2c Design Spec: Redshirt

**Date:** 2026-08-05
**Status:** Approved design, pre-implementation
**Parent spec:** `docs/superpowers/specs/2026-08-02-phase2-content-engine-design.md` (Decision 4c)
**Predecessors:** Stage 1 (hardening) ✅, Stage 2a (postseason resolver) ✅, Stage 2b (offseason hub) ✅ — all merged.

## Why this is its own design pass

Decision 4c (redshirt) was deferred out of Stage 2b because it had a real, unresolved design question: development in the engine is **snap-gated** ("you develop by playing"), but a redshirt season is a *sit* (few/no snaps). So a naive redshirt is either useless (no development that year) or a pure freebie (an "instant yes" that isn't a decision). This spec resolves that by making redshirt a **bump-or-sink gamble**, modeled on the soccer reference's training events.

## The soccer precedent (validated by reading the reference)

The reference game's training gambles are all **bump-or-sink** — a probability roll where success gives a real gain and failure a real loss (not "gain or nothing"):
- Preseason camp: 65% → `+4` overall on success, `−3` on failure.
- Nutrition plan: 60% → `+3` permanent on success, `−2` on failure.
- Season workload: 65% → *starter* role on success, *substitute* (playing-time drop) on failure.

Redshirt adopts this exact philosophy.

## Design

### The redshirt decision

Redshirt is a **synthetic offseason-hub decision** — the first step in the existing `HUB_ORDER = ["redshirt", "declare", "transfer"]` sequence (Stage 2b reserved this slot). It is offered **once per career**.

**Offered when:** `!eligibility.redshirtUsed` AND either
- the player is early-career (`classYear` is `FR` or `SO`), or
- the player is carrying an **active injury** into the offseason (a "medical redshirt" — uses existing `state.injuries` with `kind: "injury"`).

**Options:** *Take the redshirt* / *Decline* (play the season normally). Declining proceeds to the declare/transfer steps as today.

### Taking the redshirt — the bump-or-sink bet

**What is certain:**
- You **sit the upcoming season**: near-zero snaps → no individual stats or individual awards that year. (Team trophies still accrue — you're rostered.)
- You spend your **one-time** redshirt (`redshirtUsed = true`) — it can't be saved for a future injury.
- Your timeline **delays by a year**: you get a 5th season, so the sit does not net-cost you a playing season, but you reach the draft a year later (more injury/decline exposure over a longer career).

**In exchange, eligibility is preserved:** the force-declare cap rises from 4 to 5 playing years — the extra year replaces the sit, so your total playing seasons are unchanged.

**The bet is the roll (resolved when you commit, like a content gamble event):**
- **Bump (success):** a big **permanent `+overall`** — you came back stronger for the rest of your (now later-starting) career.
- **Sink (failure):** a **permanent `−overall`** — you sat, lost your rhythm/conditioning, and came back **rusty and worse**. A recoverable decline, **not** a bury/washout.

**Why it's a real decision, not an auto-yes:** the roll is positive expected value but genuinely two-sided — a meaningful fraction of the time you come back *worse* — and you've burned your only redshirt and pushed your draft back a year to find out. The stakes also scale with situation:
- A **benchwarmer** risks little else (they weren't producing anyway) — often a fine bet, but still a real ~40% chance of a decline.
- A **productive starter** risks more: the sink drags down an otherwise-rising career, and the delay exposes a proven player to another year of injury. A genuine "is the leap worth the wait?" gamble.

### Numbers (initial, balance-tunable in Stage 4)

A new `redshirt` config block on `ContentBundle` (validated like the other config):

| Knob | Initial value | Meaning |
|---|---|---|
| `successProb` | 0.6 | chance the redshirt "clicks" |
| `bumpOverall` | +5 | permanent overall on success |
| `sinkOverall` | −3 | permanent overall on failure |
| `sitSnapModifier` | 0.05 | the upcoming sit season's snap multiplier (near-zero) |

The swing is deliberately a touch larger than the soccer training events (+5/−3 vs +4/−3) because a redshirt is a whole-season commitment, not a training choice.

## Engine vs content

- **Engine:** the redshirt hub decision + its `getDecision`/`applyChoice` branches; the bump/sink roll (via the seeded rng, reusing `applyEffect` for the permanent-overall delta); the eligibility-cap bump (4→5); flagging the upcoming season as a redshirt sit (snapModifier + suppression of individual production/awards for that season, team trophies preserved); the offered-when gate in `raiseNextHubDecision`.
- **Content:** the `redshirt` config knobs (probability, deltas, sit modifier).

## Eligibility model interaction

The Stage-2b `enterOffseason` order (development → eligibility advance → washout → `raiseNextHubDecision`) is **preserved**. Redshirt does not reorder it. Taking a redshirt raises the force-declare cap (`redshirtUsed ? 5 : 4`), so the extra year arrives at the end of the career; `classYear` continues advancing normally and stays `SR` for a 5th year. `draftEligible` remains `JR`/`SR`. This avoids the messy "revert the eligibility advance" path — the redshirt's value is the raised cap + the dev roll, and the sit is the upcoming season.

## Interactions / edge cases

- **Washout:** a single redshirt sit is one low-snap season; the buried-washout needs `washoutConsecutiveSeasons` (2) consecutive low-snap seasons, so a lone redshirt won't trigger it. A redshirt *followed by* another buried season legitimately can (redshirt, then still can't crack the lineup → washout) — thematically correct.
- **Individual awards during the sit season:** suppressed (0 stats → no production awards; prestige awards suppressed so a benched redshirt can't win All-American). Team trophies still accrue.
- **Sink + overall floor:** a `−3` sink cannot by itself drop a healthy player below the washout floor (45); if it does (already near the floor), washing out is the intended consequence.
- **Determinism:** the roll pulls from the seeded rng at decision time. Offering redshirt (a gate check) consumes no rng; only *taking* it rolls.

## Testing

- Redshirt offered when eligible (early or injured), not offered when `redshirtUsed`.
- Taking it: `redshirtUsed` set, cap raised, roll applied (bump on a success-seeded case, sink on a failure-seeded case), upcoming season is a sit (≈0 snaps, no individual awards).
- Declining proceeds to declare/transfer unchanged.
- A redshirted career can reach a 5th season (cap 5); still terminates.
- Determinism: same seed + policy → identical state, with redshirt in play.
- Config validation: bad `redshirt` config (prob out of [0,1], non-positive sitSnapModifier) rejected; real CONTENT validates clean.

## Out of scope

- Multiple redshirts (one per career).
- A distinct "redshirt" class-year label (`RS FR`) — cosmetic; `classYear` stays the existing four labels.
- Rebalancing the redshirt knobs against full distributions — Stage 4.
