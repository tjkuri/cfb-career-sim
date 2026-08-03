# CFB Career Sim — Phase 2 Design Spec (Content Push + Engine Additions)

**Date:** 2026-08-02
**Status:** Approved design, pre-implementation
**Predecessor:** Phase 1 (pure engine + headless harness) — DONE, merged to `main`, 64/64 tests green.
**Parent spec:** `docs/superpowers/specs/2026-07-25-cfb-career-sim-design.md`
**Handoff read first:** `docs/superpowers/PHASE2-HANDOFF.md`

Phase 2 is the **content push** (all 6 position buckets, transfer-portal climb, team trophies + individual awards, bust/washout endings) **plus the engine additions those require**. Phase 1 proved the design is playable start-to-draft headlessly; Phase 2 makes it *deep and replayable*.

The guiding principle settled during brainstorming: **the engine owns *outcomes* (records, trophies, awards, endings, development); content owns *flavor, choices, and tunable knobs*.**

---

## 1. Grounded findings that reframed the brainstorm

Read of the actual Phase-1 code surfaced four facts that shaped every decision below:

1. **Fixed milestone events don't fire.** `autoProgress` only ever calls `selectRandomEvent` (`kind === "random"`). The only fixed events that surface are `recruiting` (special-cased) and the engine-injected `declare`. The parent spec's "all matching fixed events fire" is **unimplemented** → firing fixed events is an engine addition (Decision 4b).
2. **Team records are never simulated.** `teamWins`/`teamLosses` stay 0; there is no postseason team resolver, so `trophy`/`award` effects are structurally unreachable (Decision 1).
3. **Player headline stats do NOT feed draft stock.** `deriveDraftStock` uses *snaps* (not `passYards` etc.), overall, character, trophies, awards, class. So authored `stat` effects are currently cosmetic — **awards/trophies are the only mechanical bridge from on-field production to draft value.** This is why the postseason resolver (Decision 1) is the keystone of the whole phase.
4. **At most one random event fires per phase** — bounds content density; informs the ~60–100 event target.

## 2. Reference inspiration (soccer bundle, de-minified)

The reference game (`reference/soccer-original/CareerSimulatorPage-BtSZ7OIp.js`) already implements a systemic resolver we borrow from directly:

- **Individual awards** (`rn`/`tn`/`ln`): prestige awards = base probability keyed on **overall thresholds** (`≥97→1.0, ≥94→.5–1.0, ≥90→.2–.6, ≥85→.01–.1, else 0`), **× a role multiplier** (`on`: attacker 1.0, support .5, defensive .25), **boosted when the team won its league/continental cup**. Production award (golden boot) = pure **stat threshold** (`goals ≥50→1.0, ≥40→.5, ≥30→.25`), all RNG-gated via `rng < prob`.
- **Team trophies** = assigned from team tier/quality context + RNG (promotion/relegation gated by overall+reputation); the player inherits them.
- **Overall** grows on an **age/role development curve** (`zr`, every other year; big gains 18–22, decline after ~28).
- **Transfers** = offers every window, **pool gated by a computed `reputation`** (`cn`: rep ≥83 unlocks everything, lower reps unlock progressively smaller/local pools), sampled from the eligible pool. Includes a distinct **loan / "earn minutes elsewhere" development track**, plus forced-move events (`contractNonRenewal`).
- **No "bust."** Soccer careers always run to a fixed retirement age; the ending is just the trophy case. **The CFB bust is our own divergence.**

## 3. Decision 1 — Postseason resolver: team results + trophies + awards (ENGINE)

**Chosen: engine postseason resolver (approach A).** The engine computes the truth; content authors the color and owns the knobs.

Per season, at the postseason phase, the engine:

1. **Simulates the team's record** (`teamWins`/`teamLosses`) from `overall + tier + rng`.
2. **Resolves team trophies** from record + tier + rng: conference title, CFP berth, CFP title, NY6/bowl win. Emits `trophy` effects; player inherits them.
3. **Resolves individual awards** using the soccer-borrowed formula:
   - **Prestige awards** (Heisman, All-American): `baseProb(overall) × positionMultiplier × teamSuccessBoost`, RNG-rolled.
   - **Production awards** (All-Conference, stat titles): position-specific **headline-stat thresholds** on the season line, RNG-gated.

**Position multiplier** (tunable starting points; the mechanism that bakes in Kicker-hard-mode and "OL stock leans on overall" for free):

| Position | Multiplier |
|---|---|
| QB | 1.0 |
| OSKILL | 0.8 |
| DL / DSKILL | 0.4 |
| OL | 0.15 |
| K | 0.05 |

**Deliberate divergence from soccer:** awards/trophies **keep feeding `draftStock`** (they already do: trophy +2.5, award +3). In soccer they're cosmetic; for CFB a Heisman/All-American genuinely moves your draft stock, and this is the mechanism that finally makes headline stats *matter* (stats → award threshold → award → stock).

**Engine vs content:**
- **Engine:** the resolver algorithm (record sim, trophy resolution, award rolls), invoked at the postseason phase.
- **Content (data tables, e.g. `content/awards.ts`):** position multipliers, prestige overall-threshold curves, production stat-thresholds per position, team-success boost factors, and the trophy/award id sets. Engine stays generic; all numbers are tunable in the balance pass.

## 4. Decision 2 — Transfer-portal climb (ENGINE synthetic decision + CONTENT pool)

**Architecturally forced to be engine:** transfer offers depend on runtime `eligibleTiers(state)` + performance, which content `conditions` cannot compute. So it is an **engine-injected synthetic decision at the offseason hub**, same pattern as `declare`. `eligibleTiers` (derived from `draftStock`) is our analog of the reference's `reputation`; `recruitingOptions` is the sampler we generalize.

**Offer model — "A2-refined: tiered offers, always something"** (reconciles never-stale with mismatch-triggered big moves). Every offseason after the FR year, the hub surfaces an offer set drawn from `eligibleTiers`:

- **Stay** (always).
- **1–2 lateral offers** (same tier, different school; one framed as "bigger role / more snaps"). This is the never-empty floor — a "stuck" tier still has real choices (scheme fit, rival, home-state return).
- **Move-up offer** — only when the player has *outgrown* the tier (`eligibleTiers` includes a tier above current). Mismatch-triggered.
- **Move-down-for-snaps offer** — the loan-equivalent development track, surfaced when the player is *buried above their level*.

**Consequences (mechanical, applied by engine; magnitudes are content knobs):**
- **Stay** → no change.
- **Move up** → higher trophy/award ceiling + a draft-visibility nudge, *plus a first-season snaps penalty* (depth-chart reality — must win the job).
- **Move down** → guaranteed snaps/production bump, lower ceiling.

**The rebuild loop (emergent, not special-cased):** down → more snaps → more production → All-Conference at the lower level → draft stock recovers → climb back up. Falls out for free once stats feed awards (Decision 1) and development is gated by playing time (Decision 4a).

**Presentation note (Phase 3):** the tier logic and rebuild loop stay **implicit** — the player sees schools + flavor and infers the tradeoff; nothing is spelled out mechanically.

**Sequencing (engine change to `runOffseasonHub`):** the hub currently sets exactly one `currentEventId`. It becomes a small **multi-step sequence**: advance eligibility → **redshirt?** (Decision 4c) → **declare?** (only if draft-eligible) → **transfer offers?** (only if the player *returns*/is not declaring). Requires chaining synthetic decisions across `advance` calls rather than emitting one.

**Engine vs content:**
- **Engine:** the synthetic decision, offer-set generation (shared weighted sampler + snaps-context read), applying tier/school change + the snaps modifier, and the hub sequence.
- **Content:** the school pool (Decision 5a), transfer flavor text, knobs (# of lateral offers, snap-penalty size, draft-visibility nudge).

## 5. Decision 3 — Bust / washout endings (CONTENT events + small ENGINE additions)

CFB-original (soccer has no bust). "Bust" and "undrafted" stay **distinct terminals**: bust = career ends *before* the draft (mid-stream), with its own summary card + `endingReason`; undrafted = reached draft night with stock < 35 (already handled by `computeDraftResult`).

**The four bust paths:**

| Path | Mechanism | Owner |
|---|---|---|
| Career-ending injury | random event gated on being currently hurt (existing `requiresInjury`, tightened by new `requiresActiveInjury`), option emits `ending` at some probability | content (event authorable today; gate refined by enriched conditions) |
| Academic ineligibility | event gated on low character/overall, emits `ending` | content + enriched conditions |
| Off-field expulsion | off-field event (arrest, repeated suspension), emits `ending` | content |
| Soft washout | engine detects a non-viable career at the offseason hub (collapsed `overall`, or N straight seasons at ~0 snaps) → force `busted` | engine (new hub check) |

**Enriched `EventConditions` (chosen).** Add `maxCharacter`, `maxOverall`, and `requiresActiveInjury` (currently `requiresInjury` only checks the list is non-empty). Bust events then fire only on genuinely vulnerable players — busts feel *earned*, not random, and are far easier to balance. Small, validator-guarded schema addition that also enriches all Phase-2 content authoring, not just busts. The content validator must validate the new condition values.

**Engine vs content:**
- **Engine:** enriched condition evaluation in `eventMatches`; the soft-washout hub check; the existing `ending` effect (already works).
- **Content:** the career-ending-injury / academic / off-field bust events; the vulnerability gates on each.

**Required test:** an e2e test that drives a career to `busted` (currently the terminal is unreachable end-to-end).

## 6. Decision 4 — Season-loop engine additions

### 4a — Overall development curve gated by playing time (ENGINE)

Today `overall` moves *only* via event effects, so a player who dodges gamble events stays flat for four years and "return for another season" has no upside. **Add a modest passive per-offseason `overall` bump gated by last season's snaps** — you develop by *playing*; bench players develop less; redshirts develop while preserving eligibility. **No decline phase** (college is an all-upside 18–22 window; injuries/off-field provide the downside). This makes "return to school" a real bet and is the backbone the redshirt decision needs.

- **Engine:** the development algorithm, applied in the offseason hub.
- **Content:** curve magnitudes (dev-per-snap, caps by class) as knobs.

### 4b — Fire fixed milestone events (ENGINE)

`autoProgress` must fire **all matching `fixed` events for the phase**, then the single random draw. Unlocks authored scripted beats (senior day, rivalry week, bowl-selection framing). Small `autoProgress`/`select-event` change.

- **Engine:** fixed-event firing loop per phase.
- **Content:** the milestone events themselves.

### 4c — Redshirt (ENGINE synthetic decision)

`redshirtUsed` exists but is unused. Add a **synthetic offseason decision** offered when eligible (typically after a low-snaps FR year or post-injury): burn the redshirt → preserve a year of eligibility (5th year) + still develop, but that season is a "sit" (minimal snaps/production). Slots into the hub sequence (§4, Decision 2 sequencing).

- **Engine:** the redshirt decision + eligibility/`redshirtUsed` bookkeeping.
- **Content:** flavor text.

## 7. Decision 5 — Content depth, authoring, and sequencing

### 5a — School ladder depth (CONTENT + shared ENGINE sampler)

Expand from 10 to **~40–60 real schools** across the 4 tiers (conference + state). Replace the "first of tier" recruiting logic with a **weighted sampler that biases by home-state/region**. Both recruiting *and* transfer (Decision 2) use this one sampler.

### 5b — Authoring approach + parallelization

**Hand-author the mechanically-wired content** (fixed milestones, position stat-events, bust events, award/school tables); **batch-author the flavor pile** (off-field, gamble). The **validator + typecheck is the guardrail** that makes bulk authoring safe (unknown ids fail the build at import). Split the work by **append-only slice** so parallel authoring never collides: one unit per position bucket, plus separate universal / off-field / injury-gamble / milestone pools. (Whether slices run as subagents is a plan-time call — not decided here.)

### 5c — Engine hardening first (Task Set 0)

Do the accumulated Phase-1 minors **before the content push**, since several strengthen the guardrail right before bulk authoring and we're touching `EventConditions`/schema anyway:
- Project-references split to restore the engine no-Node-globals compile guardrail.
- `rng`: remove inert `cursor` setter; add `rngInt` min≤max guard.
- `effects`: `never` exhaustiveness guard on the effect switch; give `suspension` a discriminated field instead of the `"suspension"` magic string in `injuries[]`.
- `schema`: type-predicate filter instead of `oc!`; assert `recruiting.kind === 'fixed'`; validate `minClass`/`tier`/new-condition values.
- `draft`: boundary tests at the undrafted floor (35) and tier cutoffs (25/45/70).
- `advance`: validate the `declare` choiceId (reject anything but `declare`/`return`).
- Fix stale comment at `advance.test.ts:56`.

### 5d — Balance pass (last)

Extend the balance harness to report the new distributions — **bust rate by reason, award frequency by position** (verify Kicker/OL caps hold), trophy frequency, transfer frequency, draft-slot spread — then tune weights/probabilities/thresholds/curves.

## 8. Consolidated engine-vs-content split

| Capability | Engine | Content |
|---|---|---|
| Team record + trophy resolution | algorithm | trophy id set, boost knobs |
| Individual awards | roll algorithm | position multipliers, overall/stat thresholds, award ids |
| Stats → draft value | via awards/trophies in `deriveDraftStock` | (thresholds) |
| Transfer portal | synthetic hub decision, offer generation, sampler, consequences | school pool, flavor, knobs |
| Recruiting | shared weighted sampler | school pool, regional weights |
| Bust endings | enriched conditions, soft-washout hub check, `ending` effect | bust events + vulnerability gates |
| Development | per-offseason bump gated by snaps | curve magnitudes |
| Fixed milestones | fire matching fixed events per phase | milestone events |
| Redshirt | synthetic decision + bookkeeping | flavor |
| Per-position + off-field content | (schema unchanged) | ~60–100 events across all buckets |

## 9. Build order

1. **Task Set 0 — Engine hardening** (5c).
2. **Engine additions** — postseason resolver (D1), enriched conditions + soft-washout (D3 engine parts), development curve (4a), fire fixed events (4b), redshirt (4c), transfer synthetic decision + hub sequencing + shared sampler (D2), school-pool sampler (5a engine part). Schema/`EventConditions` changes land here, freezing the Phase-2 content contract.
3. **Content push** — schools (5a), award/threshold tables (D1 data), then the event library by slice (5b): per-position stat-events, universal, off-field, injury/gamble, fixed milestones, bust events.
4. **Balance pass** (5d).

Each engine addition is TDD'd (determinism/golden + unit tests); the content push leans on the validator + typecheck; the e2e `busted` test and per-position award-cap assertions gate completion.

## 10. Content volume targets (from parent spec §10)

- ~60–100 events (universal + per-position + off-field + injury/gamble + fixed milestones + bust).
- ~40–60 schools across 4 tiers.
- Trophy set: CFP title, conference titles, NY6/bowl wins. Award set: Heisman, All-American, All-Conference (+ position stat titles as authored).
- All 6 position buckets authored (Kicker as self-aware hard-mode; the position multiplier enforces its draft ceiling).

## 11. Out of scope for Phase 2

- NFL coda after the draft; global leaderboards/server saves; full 11-position granularity; the UI (Phase 3).
- Overall *decline* curve (college is all-upside; downside comes from injuries/off-field).
- A live transfer market (offers remain a seeded synthetic decision, not a simulated market of other players).
