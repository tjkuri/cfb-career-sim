# School Identity Traits — Design

Stage 4 content pass. Closes the top open backlog item in `STAGE4-HANDOFF.md`: **the 57-school
ladder is mechanically inert.**

## 1. The problem, stated precisely

`SCHOOLS` carries 57 rows of `{ id, name, tier, conference, state }`. Consumption is narrow:

| field | read by |
|---|---|
| `tier` | `select-event.ts:11` (event gates), `postseason.ts` (team record, trophy odds), `transfer.ts` (move direction) |
| `state` | `engine/schools.ts:18` (sampler weighting) only |
| `conference` | **nothing** |
| `name` | offer labels |

Within a tier every school is a perfect substitute. Alabama and Georgia are the same object with
different names, so Signing Day is a ranking (pick the highest tier offered) rather than a decision.

## 2. What this pass adds

A **school trait**: a closed vocabulary of three identities, each carrying **both a benefit and a
cost**, so the tradeoff lives inside one school rather than in bookkeeping across the ladder. A
school carries at most one trait; most carry none, and untraited is a legitimate identity — the
ordinary program.

| trait | benefit | cost | scope of both | offer hint |
|---|---|---|---|---|
| `wideOpen` | snap bonus | ambient injury exposure — no one behind you | ongoing while enrolled | "the two-deep is thin" |
| `factory` | draft-stock bonus, accruing per season at the school | snap penalty, front-loaded; the room is stacked | tenure-shaped, opposite directions | "sends more guys to Sundays than anywhere else" |
| `developmental` | better development per snap | snap penalty across the first two seasons | tenure-shaped, opposite directions | "takes three-stars and turns them into draft picks" |

### 2.1 Why the costs sit where they do

The governing constraint is that **`overall` compounds through four channels** and most candidate
costs do not:

1. `overallPart = (overall − 40) × 1.4` in `deriveDraftStock`
2. `skill = overall / 70` in `simulatePhaseProduction` → stats → `allConference` → `awardPart` (3 each)
3. `overallWinShiftPerPoint` → team record → trophies → `trophyPart`
4. distance from `washoutOverallFloor: 45`

A trait whose benefit is `overall` and whose cost is flat on one channel **under-costs
structurally**, not merely by accident of magnitude. So `developmental` pays on the same axis its
benefit rides — time. Better development per snap, fewer snaps to spend it on.

`factory` is the mirror and was expected to **over-cost**: its cost compounds through the
`floor(snaps / 180)` cliff while its benefit is flat *and* clamped by `deriveDraftStock`'s
`[0, 100]` ceiling for exactly the elite careers it is meant to reward.

That prediction is real but softer than it first looks, because **the draft bonus leaks past the
draft**. `deriveDraftStock` feeds `eligibleTiers`, which `transfer.ts:24` uses to decide whether to
offer a move up a tier at all. So the bonus buys earlier access to better programs — a compounding
second-order benefit that partially offsets the predicted over-cost. Size the bonus expecting a
smaller net penalty than the first-order analysis suggests; verify by measurement.

`wideOpen` is symmetric — snaps up drives development up, injury drives lost snaps and `overall`
down — and is the most likely of the three to land near neutral.

### 2.2 Benefit and cost must share a temporal scope

**A trait's benefit and its cost must be collectable only together.** If one is one-shot and the
other ongoing, some transfer pattern collects the cheap half and skips the other, and the trait
stops being a decision.

This is not hypothetical. `generateTransferOffers` emits a lateral offer — same tier, different
school — **every offseason, unconditionally**, already carrying `lateralSnapModifier: 1.1`. The
game offers the hop annually and mildly rewards it before this pass adds anything.

Applying the rule caught a defect in two of the three traits as first drafted:

- **`wideOpen`** had a first-season snap bonus against permanent injury exposure: over ~3.1 seasons,
  ~3 phases of benefit against ~9.3 of cost. The optimal line was hopping between `wideOpen` schools
  for a fresh bonus each year while never accruing tenure cost — "sign here, then leave." Both sides
  are now **ongoing while enrolled**, which is also the narratively true reading: a thin two-deep
  means you keep playing *and* keep getting hurt, as long as you are there.
- **`factory`** had the mirror defect — a one-shot snap cost against a draft bonus that applied
  whenever stock was computed. The optimal line was transferring *into* a factory for the senior
  year: pay one season of penalty, collect the full bonus at declaration. The benefit is now
  **accrued per season at the school** (capped), which is also more plausible: scouts know the guy
  who has been in the building three years, not the transfer who arrived in June.
- **`developmental`** already satisfied the rule — pay early in snaps, collect for as long as you
  stay — and is unchanged.

### 2.3 Zero-mean is a measurement, never an inference

The pipeline is not linear. `developmentDelta` floors, `productionScore` clamps at
`min(15, snaps/200)`, `deriveDraftStock` clamps `[0, 100]`, and washout is a threshold test. Last
stage's K defect is the proof: a ~34% snap difference became a **total zero** through
`Math.floor`, capping K's draft ceiling at 86 against a round-1 threshold of 91.

**A `+1 here, −1 there` trait pair can do the same on either side of a floor.** Every claim that a
trait is balanced must come from measured outputs at n=3000/position, never from arithmetic on the
inputs.

### 2.4 Hidden from the player, never from the suite

The mechanics are not surfaced. Discovery is through replay. Each trait gets a hint in its offer
label that suggests without stating ("sends more guys to Sundays than anywhere else"), so a player
has a thread to pull.

But **a trait expressed only as a rate shift is undiscoverable** — a player samples 10–50 careers
and last stage needed n=3000 to detect shipped effects. So every mechanical trait also ships a
**content signature**: authored events gated on the trait, noticeable in one career and testable on
the next. A trait without a content signature does not ship.

Correspondingly, every trait's mechanical effect is asserted **directly** in tests, not inferred
from an aggregate.

## 3. Data model

```ts
// engine/types.ts, beside Tier — the engine reads it.
export type SchoolTrait = "wideOpen" | "factory" | "developmental";
```

School rows gain `trait?: SchoolTrait`. The field is optional because untraited is the common case.

All magnitudes live content-side in a new `SCHOOL_TRAITS` table, not in the engine — house style is
"engine stays generic; all numbers are tunable in the balance pass."

```ts
export interface SchoolTraitConfig {
  // Both sides ongoing while enrolled (2.2).
  wideOpen: { snapModifier: number; injuryProbPerPhase: number; injuryTypes: string[] };
  // Cost front-loaded, benefit accrued per season at the school and capped (2.2).
  factory: { firstSeasonSnapModifier: number; draftStockBonusPerSeason: number; draftStockBonusCap: number };
  developmental: { snapsPerDevPointMultiplier: number; earlySnapModifier: number; earlySeasons: number };
}
```

`validateContent` rejects an unknown trait on a school row, an unknown trait in an event condition,
and an unknown `injuryTypes` id — the same runtime guardrail it already applies to stats, awards and
injuries. The types make these unreachable from authored TS; the validator is what catches them
from any other source.

## 4. Engine reads

### 4.1 Snaps — `schoolSnapModifier`

New `schoolSnapModifier(state, content): number` in `engine/schools.ts`, multiplied into the snap
roll in `simulatePhaseProduction`.

**Deliberately orthogonal to `state.snapModifier`.** Transfer and redshirt already own that field
and `enterOffseason` resets it to 1 every year; a trait writing there would make three writers
contend for one mutable, and the reset would silently eat a multi-season effect.

Where a trait's snap effect is tenure-shaped, it is keyed on **seasons at the current school** —
`state.seasons.filter(s => s.schoolId === current).length` — not on `classYear`. A junior who
transfers into a `factory` is new to that depth chart and should pay the front-loaded cost; a
redshirt sophomore in year three there should not.

`wideOpen`'s snap bonus is **not** tenure-keyed — per 2.2 it applies for as long as the player is
enrolled, matching its ongoing cost.

This adds no RNG draw, so it perturbs no seeded stream.

### 4.2 Development — the cliff surface

`developmentDelta` takes a per-school divisor multiplier:

```
floor(seasonSnaps / (perPoint × multiplier))
```

A field-player season is ~480 snaps against `snapsPerDevPoint: 180`, so careers sit near the
360/540 boundaries and a multiplier of 0.85 moves the effective divisor to 153. This is the surface
most likely to produce a cliff, so it gets the most direct unit test: assert the delta at snap
counts straddling each boundary, both with and without the trait.

### 4.3 Draft — `deriveDraftStock` gains a school term

Signature change; ripples to `eligibleTiers` and `computeDraftResult`, both of which must now reach
content.

**`eligibleTiers` runs at Signing Day, when `state.school.schoolId === ""`.** The lookup must
resolve an empty/unknown school to no trait rather than throwing — otherwise `createCareer` breaks
before the player has a school at all.

**The bonus deliberately leaks past the draft**, and this is a designed consequence rather than an
accepted leak: `eligibleTiers` gates `transfer.ts:24`'s move-up offer, so a `factory` player reaches
better programs sooner. See 2.1 — it offsets part of the trait's expected over-cost, and the probe
must be read with that in mind.

### 4.4 Injury — the ambient roll

`wideOpen`'s cost is the one new mechanism in this pass: an ambient injury roll, which the engine
has never had (injuries have only ever come from event effects).

Placed in `autoProgress`, on `ON_FIELD_PHASES` only, after the season line is pushed and **before**
`simulatePhaseProduction`, so a fired injury sidelines the player for that phase via the existing
`isSidelined` check. Skipped when the player is already sidelined.

**One fire costs ~1.67 on-field phases, not one.** `applyEffect` sets `remainingPhases` to the
injury's `recoveryPhases`; `isSidelined` is `remainingPhases > 0`; `tickPhaseStart` decrements
*then* heals. So the applying phase and the following one are both lost — and `validateContent`
enforces `recoveryPhases >= 2`, so this is a floor, not a tuning choice. The on-field cost depends
on which phase fires, because the offseason absorbs a tick for free:

| fires in | on-field phases lost |
|---|---|
| nonconf | 2 (nonconf, conference) |
| conference | 2 (conference, postseason) |
| postseason | 1 (postseason only — offseason eats the second tick) |

Mean 5/3 ≈ **1.67 of the 3 on-field phases in a season**, i.e. a fire costs well over half that
season's snaps. `injuryProbPerPhase` must be sized against that, not against a one-phase
assumption — a naive reading overstates the affordable probability by roughly 2x.

**The durable cost is the lost snaps, not the overall hit.** `applyEffect` stores `restoreAmount`
and `tickPhaseStart` gives the `overallDelta` back on heal, so the overall loss is temporary. It
bites only where it straddles a boundary: `enterOffseason`'s development and washout checks, and
`deriveDraftStock` if the player declares before healing. The compounding cost is snaps →
development and snaps → stats → awards.

**The draw happens only when the trait is present.** That keeps the change surgical: a career that
never attends a `wideOpen` school consumes exactly the RNG it consumes today, and its seeded outcome
is unchanged. Only careers that sign with — or transfer into — a `wideOpen` school diverge.

Note this is narrower than "untraited careers are unaffected". A `factory` or `developmental` school
adds no draw of its own, but it *does* change snap counts, and `resolveAwards` skips its RNG draw
when a production gate is unmet (`postseason.ts`: "no draw when gate unmet"). So a snap change can
still shift the downstream stream by changing whether that draw happens. Seeded-outcome stability is
claimed only for careers that touch no traited school at all.

## 5. Content contract

`EventConditions` gains `schoolTrait?: SchoolTrait[]`; `eventMatches` gains one line beside the
existing `tier` check.

Trait events live in a new `content/events/school-life.ts`, following the `season-life.ts`
precedent rather than growing `universal.ts` past its current 330 lines and 8 events.

### 5.1 EV aim, stated before authoring

Last stage got this wrong twice. The rule that came out of it: **match the EV of the events a given
player will actually draw alongside yours — not the phase's whole roster.**

For a trait gate, the alongside-pool is the **ordinary ungated shared + position pool** for that
phase: a player at a `wideOpen` school carries no trouble-gate and no tier gate by virtue of the
trait alone. That pool's EV is measured *before* authoring, and the new events are aimed at it.

This is a weaker gate than last stage's `maxCharacter` subsets, so the harsh thriving-visible
correction does not apply here — but the measurement still runs, because that is the lesson.

### 5.2 Displacement is a certainty, not a risk

Only one random event fires per phase. Trait-gated content displaces position content, which lowers
award stats and moves `allConfRate`. This happened on both of last stage's content passes and both
needed thresholds re-placed after.

**Every wave budgets for a threshold re-placement in `content/postseason.ts`.** The band is the
goal; the thresholds are the knob. Re-place them rather than reshaping the content.

## 6. Distribution across the ladder

Traits are assigned realism-first, consistent with the ladder's existing house rule ("assigned by
real program stature ... conferences and states are factual").

**Requirement: every tier carries at least two distinct identities including untraited.** If
`factory` lived only at tier 4 and `wideOpen` only at tier 1, the trait would be tier wearing a hat
and the backlog complaint — choosing Alabama over Georgia is cosmetic — would stand unaddressed.

**Realism wins where the two conflict, and the exemption is declared, not quietly unmet.**
`schools.test.ts` already sets this precedent with `TWO_PER_STATE_EXEMPTIONS` (Mercer is the only
plausible FCS program in Georgia, so that cell is exempted in the test rather than satisfied by
inventing a school). Any tier that cannot carry two identities without giving a program a trait it
has not earned gets a named entry in an equivalent exemption list, with its reason. The intended
shape, subject to that:

| tier | identities present |
|---|---|
| 4 | `factory`, `developmental`, untraited |
| 3 | `factory`, `developmental`, untraited |
| 2 | `wideOpen`, `developmental`, untraited |
| 1 | `wideOpen`, `developmental`, untraited |

### 6.1 The distribution test measures the population, not the table

The sampler weights by home state (`homeStateBonus` +12/+8/+4/+1 by tier) and region, so **players
do not land evenly across a tier — zero-mean across the ladder is not zero-mean across the
population.** `runBalance` compounds this by hardcoding `homeState: "TX"`; measured that way, an
n=3000 run is measuring Texas.

So the distribution test does **not** count rows in `schools.ts`. It generates offer sets from every
home state present in the ladder and asserts each trait's **realized share of the offers players
actually see** lands in a band.

`runBalance` gains an optional `homeState` parameter defaulting to `"TX"`, so every baseline in the
handoff stays directly comparable while trait measurement can sweep states.

## 7. Measurement

Per-trait attribution needs outcomes split by trait, which does not belong in `BalanceReport`.

New `src/sim/trait-probe.ts` plus an npm script: n=3000/position, reporting the headline metrics per
bucket. **Zero-mean is a finding from this probe or it is not a finding.**

**Bucket by whether the career ever *received* the effect, not by where it spent the most seasons.**
Modal-school bucketing mis-attributes exactly the cases the traits are built around: a career that
takes season 1 at a `wideOpen` school — collecting the full first-year effect — and then transfers
and plays three seasons elsewhere would bucket as *untraited*, hiding the effect inside the control
group and biasing both buckets at once. Careers can therefore appear in more than one bucket; the
probe reports bucket sizes so overlap is visible rather than silent.

Bands to hold, from the handoff's target table:

| metric | band |
|---|---|
| actually picked (`draftedRate − undraftedRate`) | 0.85–0.95 |
| `round1Rate`, non-K | 0.01–0.05 |
| `round1Rate`, K | strictly below the non-K floor |
| `bustedRate` | 0.005–0.03, never 0 (OL's recorded 0.0043 exception stands) |
| `allConfRate` | 0.40–0.55, spread ≤ 1.25x |
| median final `character` | above 55 |
| `charUnder55Rate` | 0.35–0.50 |
| `avgSeasons` | 3.0–3.5 |

`npm run balance -- 500 random` is too small to judge `bustedRate` (QB read 0.002 at n=500 against
0.0053 at n=3000). n=3000/position for band judgments, always.

## 8. Testing

Beyond the contract tests the repo already runs:

- **Direct mechanical assertions, one per trait.** Not aggregate inference: call
  `schoolSnapModifier` / `developmentDelta` / `deriveDraftStock` with a traited and an untraited
  school and assert the difference.
- **Cliff straddle test** for `developmental`: `developmentDelta` at snap counts either side of each
  `floor` boundary, traited and untraited.
- **Ambient-roll isolation:** run a career that never attends a traited school twice on the same
  seed — once against the real trait table and once against a table with the trait stripped — and
  assert the two final states are identical. The filter must check **every school the career
  attended**, not just the one it signed with: a career that signs untraited and later transfers
  into a traited school is not a control. This proves the draw is conditional without needing to pin a
  literal baseline that would rot on the next content change.
- **Signing-day safety:** `createCareer` on a state with `schoolId === ""` resolves to no trait.
- **Distribution test** (§6.1), over realized offer sets across home states.
- **Content signature test:** every member of the trait vocabulary has at least one gated event and
  at least one school carrying it — so a trait cannot ship mechanically inert, which is the exact
  defect this pass exists to fix.

## 9. Sequencing — three waves

Each wave ends in its own n=3000 measurement and its own threshold re-placement, so `allConfRate`
movement is attributable to a single trait. Three traits landing together would make attribution
impossible, and every content pass last stage needed a correction round.

**Wave 1 — `wideOpen`.** Carries all the scaffolding: the type, the schema field, the config table,
the condition key, `schoolSnapModifier`, the ambient roll, the probe, the distribution test.
Note that 2.2's rescoping makes wave 1 slightly *smaller*: `wideOpen`'s snap bonus is ongoing, so
wave 1 does not need the seasons-at-school keying, which arrives with `factory` in wave 2.
`wideOpen` goes first because it sits at tiers 1–2 where most careers live — a large enough blast
radius to actually teach us the threshold coupling — both its sides compound, and it rides
`snapModifier`, an existing lever of known survivable magnitude.

**Wave 2 — `factory`.** A table row, two events, `deriveDraftStock`'s school term, a measurement
run. Goes second because it sits at tiers 3–4, which only ~12% of careers reach, and because its
expected over-costing is then the only unknown in play.

**Wave 3 — `developmental`.** A table row, two events, the `developmentDelta` multiplier, a
measurement run. Last because it touches the dev floor, the surface with the worst cliff behaviour.

**Each wave is its own implementation plan.** Wave 1's plan is the large one and is the only one
written up front; waves 2 and 3 are planned after their predecessor's measurement lands, because
what the measurement says about over- or under-costing is an input to how the next trait is sized.

## 10. Out of scope

- `conference` remains decorative. Making conference load-bearing (strength-of-schedule, per-league
  All-Conference thresholds) is a separate pass with its own balance surface.
- No school gets more than one trait. 57 schools × combinations is a surface no test can cover.
- The deferred `acl` emission (handoff lever 7) stays deferred. The ambient roll here is a
  trait-scoped mechanism, not the general injury lever, and should not be conflated with it.
