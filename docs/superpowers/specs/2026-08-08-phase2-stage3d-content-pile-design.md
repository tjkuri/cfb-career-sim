# CFB Career Sim — Stage 3d: The Parallel Flavor Pile

**Date:** 2026-08-08
**Supersedes/extends:** `2026-08-07-phase2-stage3c-content-foundation-design.md` §10 (which defines 3d's hard requirements)
**Status:** design approved, pending plans

## 1. What Stage 3d is

The large parallel authoring push the content architecture was built to make safe: ~73 new events across the six position buckets and the off-field pool, bringing the game to ~90 events.

Every slice file already exists, is exported, and is wired into the barrel, so each author owns exactly one file and cannot collide with another. `src/content/events/index.test.ts` fails if a slice goes missing.

Stage 3d carries a **blocking exit criterion** inherited from 3c §10: `npm run balance -- 500 random` must report `bustedRate > 0`. It is currently 0.

## 2. Measured baseline

Everything below is grounded in a 500-career probe (QB, random policy) run at the start of this stage, not estimated:

| Measure | Value |
|---|---|
| Random draws per career | **12.44** |
| Draws per phase | 3.11 each, evenly across all four |
| Fixed-event fires per career | 8.66 |
| Final character — avg / P05 / **min** | 65.2 / 56 / **44** |
| Careers ever reaching ≤35 character | **0** |
| Final overall — avg / **min** | 78.1 / **55** |
| `washoutOverallFloor` | 45 — i.e. also unreachable |

Two consequences shape the whole design.

**A career gets ~12 random draws, spread evenly over four phases.** That is the entire budget. Pressure that only arrives late never compounds, because a career is ~3.1 seasons.

**The loosest bust gate is `maxCharacter: 35` and the worst career on record ends at 44.** The tail needs roughly another −25. The *median* must not move nearly that much, or ordinary players start drawing bust events — the failure mode 3c explicitly protected against by refusing to loosen gates.

### 2.1 New mechanical findings from this stage's exploration

These are established facts, not proposals, and they constrain authoring:

**Only six stats are read by anything.** `postseason.ts:56` is the sole consumer of `season.stats`, and it reads exactly the `production` award stats: QB `passYards`, OSKILL `scrimmageYards`, OL `pancakes`, DL `sacks`, DSKILL `tackles`, K `fieldGoals`. Every other stat — `ints`, `sacksAllowed`, `passTds`, `totalTds`, `receptions`, `tfls`, `points`, `gameWinners` — is **pure flavor and affects nothing**. A "penalty" of `+2 ints` costs the player literally zero.

**Overall dominates draft stock.** `deriveDraftStock` (`draft.ts:10`) weights overall at `(overall − 40) × 1.4`; an award is worth 3 once ever (awards are deduplicated in `effects.ts:73`), a trophy 2.5, and character only `(character − 50) × 0.15`. Milestones already demonstrated the consequence: unchecked `overall` grants moved `round1Rate` 7×.

**Injury survival into an offseason.** `tickPhaseStart` decrements every injury once per phase entry and drops it at 0. An injury inflicted in phase P reaches the *next offseason's event draw* only if:

| Inflicted in | Needs `recoveryPhases` ≥ | Qualifying injuries |
|---|---|---|
| offseason | 5 | `acl` |
| nonconf | 4 | `acl` |
| **conference** | **3** | **`mcl`, `acl`** |
| postseason | 2 | `ankle`, `shoulder`, `collarbone`, `mcl`, `acl` |

## 3. File layout and ownership

New slice **`src/content/events/offfield.ts`** owns the entire spiral ladder. `catfished` and `speeding-georgia` **move into it** from `universal.ts` — they are already off-field character content, and the file that owns the pressure should own all of it.

`universal.ts` keeps `gym-grind` and gains the position-agnostic neutral beats plus the long injury (§6).

The barrel (`index.ts`) and `index.test.ts` get their single edit in **Plan B**, after the six parallel authors have finished — so the shared-file change never overlaps parallel work.

| File | Owner | Plan |
|---|---|---|
| `qb.ts` `oskill.ts` `ol.ts` `dl.ts` `dskill.ts` `k.ts` | six authors, one file each | A (parallel) |
| `positions.test.ts` (new) | written **first**, before fan-out | A (task 1) |
| `offfield.ts` (new), `universal.ts`, `index.ts`, `index.test.ts` | one author | B (sequential) |

## 4. The graded spiral

Three bands. Only band 3 exists today.

### Band 1 — temptations

Ungated, all positions, all four phases. **8 new events** plus the 2 inherited from `universal.ts`, for 10 members.

Both inherited events (`catfished`, `speeding-georgia`) are conference-phase, so the 8 new ones are distributed **2 offseason / 3 nonconf / 1 conference / 2 postseason** to keep the band roughly even across phases rather than piling four into conference.

The shape is the whole idea: **the tempting option pays a real mechanical benefit and charges character on the branch you take**, not merely on the failure branch. That makes the descent a *chosen cost* rather than bad luck, which is what "a career of bad choices" in 3c §10 means. The clean option costs nothing and pays nothing.

- Character cost **−5 to −7** on the shortcut, on both its branches.
- Payment in overall / stats / snaps — a genuine temptation, not a trap.
- Two options per event, so random policy takes the shortcut ~50% of the time.
- Weight **3**.

The two inherited events (`catfished`, `speeding-georgia`) are luck-shaped rather than choice-shaped. They ship unchanged — they are tone-setting content — and converting them to the chosen-cost pattern is a listed tuning lever (§8).

### Band 2 — slipping

Gated **`maxCharacter: 55`**. **5 new events**, weight **4**. Two offseason, one each in nonconf / conference / postseason.

Bigger costs (−6 to −10) and thinner upside than band 1. Weight 4 beats band 1's 3, so once a player is slipping the pool actually tilts against them.

**Every band-2 event carries three options:**

1. **Dig in deeper** — worst for character, small mechanical payoff.
2. **Ride it out** — small character cost, no payoff.
3. **Redemption** — grants **+6 to +10 character**, paid for on the field in snaps or overall.

No `ending` effects anywhere in band 2. It is pressure, not death.

**Why redemption exists.** Without an exit, crossing 55 makes the descent monotonic and the player's choices stop mattering — the ending is decided and the remaining draws only determine how long it takes. It also directly attacks two findings already in the Stage-4 ledger: *character is close to a one-way ratchet* (8 of 9 positive grants live in `bust.ts`) and *there is no washout floor on character*. This is the first positive character grant outside `bust.ts`.

**Why it is three options and not two.** The balance harness's `randomPolicy` chooses uniformly, so a 2-option event would see redemption taken 50% of the time regardless of whether it is wise — potentially netting band 2 to zero and failing the exit criterion. Three options drops uptake to ~33%. The field cost must additionally be steep enough that redemption is a real sacrifice rather than a free undo.

### Band 3 — the existing six bust events

Untouched.

### Projected arithmetic

Using the measured 12.44 draws/career:

| Stage | Est. effect | Running character |
|---|---|---|
| Start | — | 70 |
| Milestones (measured today) | ≈ −3 | 67 |
| Band 1: ~3.7 draws × ~50% shortcut × −6 | ≈ −11 | **~56–60 median** |
| Band 2 opens at 55 — tail only, ~2 hits × −8, less redemption | ≈ −12 | **~44 bottom quartile** |
| Band 2 continues | −6 to −10 | **low 30s → band 3 live** |

The median lands just above the band-2 gate, so a typical career brushes the spiral without entering it; the bottom quartile enters and accelerates. Expected `bustedRate` 3–8%.

**These are feel-based starting points in the project's established style.** Plan B *measures* and adjusts using §8's levers until the exit criterion passes.

## 5. The position pile

~58 events across six buckets (QB has 2 already and needs 8 more; the other five need 10 each).

### 5.1 The invariant test is written first

Plan A's task 1 writes `src/content/events/positions.test.ts` asserting the template across all six buckets. **That file is the contract**; the six authors then work independently to satisfy it. It is the only shared file in Plan A, and it is written once, before the fan-out, so it cannot collide.

### 5.2 Per-bucket template (enforced by that test)

- **≥8 events**, all `kind: "random"`.
- All carry `conditions.position` for **their own bucket only**.
- Phase distribution **2 offseason / 3 nonconf / 3 conference / 2 postseason**. Position events concentrate on-field so the off-field pool owns the offseason and the spiral gets ~3 draws per career it never has to win a weight fight for.
- Every event references **at least one stat from its own `POSITIONS` row and no other bucket's stats**.
- **≥2 gated by `minClass`**, **≥1 gated by `tier`**.
- **No `ending` effects.** Band 3 is closed content.
- **No injury with `recoveryPhases: 1`** — mechanically inert (§7).
- Character effects allowed but small (±2). The pressure axis belongs to `offfield.ts`.
- Weight 2–4.

### 5.3 The overall-EV budget

**This is the principal risk in Plan A.** Roughly 7 position draws per career at +1 overall EV each would be +7 overall ≈ +10 draft stock, blowing out the draft distribution exactly as milestones did.

**Position events must be near overall-EV-neutral.** A +2 overall positive branch needs a negative branch that costs overall, targeting **EV ≈ 0 to +0.5**. Upside is paid in stats, snaps, and moments — never primarily in overall.

Plan A ends by re-running balance and reporting the `round1Rate` delta against the 0.116 baseline. **A move beyond ±0.05 means trimming overall grants before the plan closes.**

### 5.4 Stat calibration

Per on-field phase at overall 70, mid snaps, derived from `STAT_MODEL` (`simulate.ts:8`). A season is ~3× these:

| Bucket | Award stat (read) | Per-phase baseline | Season vs. threshold | Flavor stats (inert) |
|---|---|---|---|---|
| QB | `passYards` | ~415 | 1250 vs 1300 | `passTds` 3.2, `ints` 1.6 |
| OSKILL | `scrimmageYards` | ~290 | 865 vs 900 | `totalTds` 3.2, `receptions` 13 |
| OL | `pancakes` | ~11 | 33 vs 30 | `sacksAllowed` 3.7 |
| DL | `sacks` | ~2.5 | 7.4 vs 7 | `tfls` 5.0, `tackles` 16.5 |
| DSKILL | `tackles` | ~20 | 59 vs 60 | `ints` 1.65, `passBreakups` 5.0 |
| K | `fieldGoals` | ~5 | 15 vs 15 | `points` 23, `gameWinners` 0.44 |

Every award threshold sits within a few percent of one season of baseline production, so **stat grants are precisely what decide an All-Conference nod**. A "solid" grant is ~25% of a phase baseline; a "signature" grant ~75% (the existing `signature-win` at +320 `passYards`). **At most two signature-sized grants per bucket.**

## 6. The long injury

**Required (3c §10 clause 3):** one **`mcl`** (`recoveryPhases: 3`) emitted from a **conference-phase** event in `universal.ts`.

Per §2.1's table, a conference-phase `mcl` sidelines the player through the postseason — a real cost, since `isSidelined` makes `simulatePhaseProduction` return early, so no postseason stats — and lands in the offseason with one phase remaining, where `bust-mri`'s `requiresActiveInjury` gate matches. `bust-mri` has never fired in 2,000 measured careers; this is what makes it live.

It goes in `universal.ts` specifically because the balance harness only ever runs QB, so a position-gated emission could not be verified.

**Deferred by decision: the `acl` emission.** An `acl` on a low-probability postseason branch would span five phases, reaching two offseasons, and would incidentally unlock `redshirtOffered`'s injury clause (`advance.ts:216` — the medical-redshirt path, which has never evaluated true) and the `washoutSnapFloor` route to `busted`. It is **deliberately left out of 3d** to avoid adding a second large unmeasured lever to a stage that already carries a balance gate, and because a wiped season at −14 overall is the harshest outcome in the game. **It is the first lever to reach for if tuning needs more punishing content** (§8).

## 7. Mechanical traps authors must know

- **`recoveryPhases: 1` injuries and `phases: 1` suspensions are mechanically inert.** Production for a phase runs *before* that phase's events fire (`advance.ts:253`), and the injury clears at the next phase boundary. Note `schema.ts` enforces `recoveryPhases >= 1`, one below the first value that does anything.
- **Postseason events fire before the resolver** (`advance.ts:277`), so a postseason `stat` effect feeds that season's record and awards, and an `injury` there can sideline the player for it.
- **Base production accrues before events** (`advance.ts:253`), so `stat` effects add on top rather than replacing.
- **Offseason `snaps` effects are mostly inert and semantically backwards.** `applyEffect` writes to `seasons[seasons.length - 1]`, and during an offseason that is the *previous, completed* season — `enterOffseason` has already consumed it for development and already run the washout check. The only remaining consumer is `productionScore` (`draft.ts:5`), total snaps capped at 15 stock. **On offseason events, use `overall` rather than `snaps` as a field cost.** The same applies to offseason `stat` effects, which retroactively edit a season whose awards have already been resolved.
- **Fixed events fire during a redshirt sit unless gated** with `requiresPlaying`.
- **`probability: 1` makes the negative branch unreachable.**
- Only one `random` event fires per phase; every matching `fixed` event fires every phase.

## 8. Tuning levers (ordered, for Plan B and Stage 4)

### 8.0 Prerequisite: make the tuned quantity visible

`BalanceReport` currently reports `draftedRate`, `bustedRate`, `undraftedRate`, `round1Rate`, `avgSeasons` — **and nothing about character**, which is the exact quantity Plan B is tuning. `bustedRate` is a lagging, near-binary signal: it is 0 today and will stay 0 right up until the moment the spiral connects, giving the tuner no gradient to work with.

**Plan B's first task extends `BalanceReport`** with the fields the §2 probe already computes: `avgFinalCharacter`, `minFinalCharacter`, `characterP05`, `characterP25`, `charUnder55Rate` (the band-2 entry rate), `charUnder35Rate` (the band-3 entry rate), and `avgFinalOverall` / `minFinalOverall`. `src/sim/` is outside the engine-purity boundary, so this is a free change.

Without it, every lever below is turned blind. With it, the tuner can see *where* the chain breaks — whether careers fail to reach 55 at all, or reach it and never continue to 35.

### 8.1 The levers

The knobs available when `bustedRate` comes out wrong, roughly cheapest and safest first:

**To increase pressure:**

1. **Band-2 gate threshold** — raise from `maxCharacter: 55` toward 60–65 so more careers enter the band. Single number, largest effect, no content changes.
2. **Band-2 weight** — raise from 4. Increases draw share once inside the band without changing who enters.
3. **Band-1 character costs** — currently −5 to −7. Moves the median directly, so use with care; this is the lever that risks dragging ordinary players into the band.
4. **Redemption uptake** — add a fourth option to band-2 events (drops random-policy uptake from ~33% to 25%), or raise the redemption's field cost.
5. **Convert `catfished` and `speeding-georgia`** from their luck-shaped form to the band-1 chosen-cost pattern.
6. **Band-1 event count** — currently 8 new + 2 inherited; more events means more draw share against the position pile.
7. **The deferred `acl` emission** (§6). The heaviest lever, and the one that also opens the medical-redshirt and snap-washout paths.
8. **Bust-slice gates and weights** (`bust.ts`) — deliberately untouched in 3d; 3c §11 already flags all six weights and ending probabilities as feel-based.

**To decrease pressure:** invert 1–3. Note that `characterPart` in `deriveDraftStock` is only `(character − 50) × 0.15`, so character pressure costs at most ~7.5 draft stock — the spiral's effect on draft outcomes is small compared to its effect on the `busted` rate.

**Also relevant, from §5.3:** the position pile's overall-EV budget is a lever on `round1Rate` independently of any of the above.

## 9. Tone and authoring rules

Unchanged from 3c, restated because six parallel authors will read this spec:

- **Tone:** light, "silly + real-seeming" — the register of `catfished`, `speeding-georgia`, `giant_tattoo`, `tax_trouble`, `mysterious_substance`.
- **No mean-spirited or genuinely offensive content. No real player names.** School and conference names are public facts and fine.
- **Moments:** a moment implying *first / only / last* may only come from an event gated to fire once; a moment on a repeatable random event must read sensibly if it happens twice. `moments` is a chronological log, not a set.
- **Single-option events are legitimate** — the drama is in the roll, not the branch.
- **Determinism is sacrosanct:** no `Math.random` / `Date.now` / IO anywhere in `src/content/**` or `src/engine/**`. Enforced by the `tsconfig.engine.json` typecheck pass.

## 10. Tests and exit criteria

### Plan A

- `positions.test.ts` — the §5.2 template contract, written before the fan-out.
- `npm test` green, `npm run typecheck` green (**both** passes).
- `npm run balance -- 500 random` re-run; **`round1Rate` delta vs. the 0.116 baseline reported and within ±0.05**, or overall grants trimmed until it is.

### Plan B

- `BalanceReport` extended per §8.0, with its own test coverage in `balance.test.ts`.
- `offfield.test.ts` — every band-2 event gated `maxCharacter: 55`; each carries a redemption option granting ≥+6 character; none carries an `ending`; band-2 events have ≥3 options.
- A focused unit test in the style of `bust.test.ts`: inflict the `mcl` at conference, tick to the offseason, assert `eventMatches` accepts `bust-mri`. Fast and precise, rather than fishing across seeded careers.
- **Blocking gate, added to `balance.test.ts`: `bustedRate > 0` at 500 runs, random policy.** Seeded and therefore deterministic — a legitimate regression test, not a flake.
- `npm test` and `npm run typecheck` green.

## 11. Final inventory

| Group | Events |
|---|---|
| Existing | 17 |
| Position pile (§5) | +58 |
| Band 1 new (§4) | +8 |
| Band 2 new (§4) | +5 |
| `universal.ts` new, incl. the `mcl` event (§6) | +2 |
| **Total** | **~90** |

Slightly above 3c §10's "~85" target, which was approximate.

## 12. Plan split

**Plan A — the position pile.** Task 1 writes the invariant test; tasks 2–7 are six parallel authors, one slice each; task 8 measures.

**Plan B — the spiral.** Sequential, single author: the §8.0 instrumentation first, then `offfield.ts` + the barrel edit + the long injury, then tune against the finished pool using §8.1 until `bustedRate > 0`.

Plan A runs first so that Plan B tunes against the *final* pool composition — the position pile changes every phase's draw share, so tuning the spiral first would mean tuning it twice.

## 13. Carried to Stage 4

New to this stage's ledger, on top of what 3b/3c logged:

- **Only six stats are read** (§2.1). The other eight are inert flavor. Either wire them into something or acknowledge them as pure narration.
- **Both `busted` paths other than events are unreachable.** Min final overall is 55 against `washoutOverallFloor: 45`; `washoutSnapFloor: 60` needs two consecutive near-zero seasons, which nothing produces.
- **`redshirtOffered`'s injury clause has never evaluated true** (`advance.ts:216`) and stays that way in 3d, since the `mcl` is inflicted at conference and expires before the *following* offseason's hub check.
- **Offseason `snaps` and `stat` effects write to the previous, already-resolved season** (§7). Either move the season push earlier or make `applyEffect` a no-op for them during an offseason — right now they are a silent trap for every future author.
- The deferred `acl` emission (§6) and everything in §8.
