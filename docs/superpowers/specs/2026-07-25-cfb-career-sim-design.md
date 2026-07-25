# CFB Career Simulator — Design Spec

**Date:** 2026-07-25
**Status:** Approved design, pre-implementation
**Inspiration:** Copero's soccer "Simulador de Carrera" (`https://copero.com.ar/juegos/simulador-carrera`). A local copy of its game code is saved at `reference/soccer-original/CareerSimulatorPage-BtSZ7OIp.js` for reference.

## 1. Concept

A single-player, replayable "build your own college football career" narrative simulator. You create a player, get recruited out of high school, make decisions through college seasons, climb (or fall) between schools, and the payoff is **NFL Draft night** — what round and pick you land, plus the trophies, awards, and defining moments you accumulated.

**Design goals (in priority order):**
1. **Replayable** — short enough to play repeatedly, with a wide branching tree so every run feels different.
2. **Reproducible/shareable** — a career is fully determined by a seed + your choices (seeded RNG).
3. **A mix of silly and real-seeming** — real football decisions alongside tongue-in-cheek off-field events.
4. **Maintainable** — a clean, tested engine that's easy to extend.

## 2. Reference: how the soccer game works (validated by reading its code)

Key mechanics we confirmed by analyzing the original's client bundle:

- **100% client-side.** No backend for game logic; all events/content are baked into one JS chunk; progress saved to `localStorage`.
- **Seeded PRNG**, not `Math.random` (exactly one `Math.random` in the whole file). Careers are reproducible from a seed.
- **One mutable stat: `overall` (OVR).** Everything funnels into it. Notably, OVR changes come in three timing flavors — **`immediateOverallDelta`**, **`permanentOverallDelta`**, **`deferredOverallDelta`** (delayed consequence/payoff). This is the key trick we steal.
- **Derived value:** `marketValue = f(overall, age)` — computed, never set directly by events.
- **`reputation`** is computed and only used for comparisons (gating which clubs appear), never a stored grind stat.
- **Event → options → probability → positive/negative outcome**, where each outcome stacks **multiple** effects. Risk/gamble events (e.g., "new workout regimen": chance of +OVR vs. injury + missed games) are the core replayability driver.
- **Transfers are events**, not a live market — gated softly by the player's level (overall/value) and team `tier`/`league`. No hard threshold gates.
- **Typed injury system** — 10 named injuries (ACL, meniscus, achilles, ankle sprain, etc.), each with an `overallDelta` + recovery `duration`.
- **Team trophies vs. individual awards** are distinct (`kind: 'trophy'` vs `'award'`).
- **Career-moments timeline** (`kind: 'asset'`: `{seasonId, item}`) — non-stat "defining moments" logged for the summary.
- **No ranking/percentile.** The summary is just trophies + stats + moments. (For CFB, draft slot is the natural score.)

## 3. Architecture

Three layers with hard boundaries. **100% client-side, no backend.**

### `engine/` — pure TypeScript, zero I/O
The game as a pure function. No DOM, no network, no `Date.now()`, no `Math.random()` — all randomness flows through a **seeded RNG** passed in. Core surface:
- `createCareer(setup, seed) → GameState`
- `advance(state, choiceId) → GameState` — apply a decision, resolve outcomes via seeded RNG, move to next phase. The one function everything rotates around.
- `getDraftResult(state) → DraftResult`
- Pure helpers: `deriveDraftStock(state)`, `resolveOutcome(option, rng)`, `applyEffects(...)`.

### `content/` — data, not code
All events, options, outcomes, the school/tier ladder, positions, injury table, and home-state→recruiter maps as typed data validated against the engine schema. This is the large, delegatable authoring pile. The engine knows *how* to run an event; content defines *which* events exist.

### `ui/` — React + Vite
Renders `GameState`, sends choices to `advance()`, owns `localStorage` save/load and the shareable summary card. No game logic.

**Data flow:** `UI → advance(state, choice) → engine reads matching content, rolls seeded RNG → new GameState → UI renders`. Nothing else touches state.

## 4. State model

```ts
GameState {
  seed: string            // whole career reproducible from this
  rngCursor: number       // seeded PRNG position (no Math.random in engine)
  setup: { lastName, jerseyNumber, homeState, position }  // homeState drives recruiting

  // mutable player numbers (the only two you "grind")
  overall: number         // talent, ~40–99
  character: number       // 0–100, fed mainly by off-field events

  // CFB career clock
  eligibility: { classYear: 'FR'|'SO'|'JR'|'SR', yearsUsed, redshirtUsed, draftEligible }
  school: { schoolId, tier }          // tier 1=FCS 2=G5 3=P4 4=blue-blood
  seasonIndex, phase: 'offseason'|'nonconf'|'conference'|'postseason'

  // records
  seasons: SeasonLine[]   // per-season: { snaps, stat1, stat2, stat3, teamRecord }
  trophies: { cfpTitles, confTitles, bowlWins, ... }   // TEAM
  awards: AwardId[]       // INDIVIDUAL: heisman, allAmerican, allConference, ...
  moments: Moment[]       // shareable timeline (NIL deal, catfished, viral play, ...)

  // engine bookkeeping
  pendingEffects: DeferredEffect[]    // queued deferred deltas + injury recovery
  injuries: ActiveInjury[]
  status: 'active'|'declared'|'drafted'|'busted', endingReason?
}
```

**Derived (computed, never stored as truth):**
- `draftStock = f(overall, recent snaps/production, character, trophies, awards, position, classYear)` — the number revealed on draft night.
- `eligibleTiers = f(overall, draftStock)` — which school tiers realistically send offers.

## 5. Content schema

```ts
Event {
  id, type, phase, kind: 'fixed'|'random', weight,
  conditions?: { position?, minClass?, tier?, requiresInjury?, ... },
  title, description, options: Option[]
}
Option {
  id, label,
  probability,                 // splits into the two branches (1.0 = deterministic)
  positiveOutcome: Outcome, negativeOutcome?: Outcome
}
Outcome { description, effects: Effect[] }   // outcomes stack MULTIPLE effects
Effect =
  | { kind:'overall', timing:'immediate'|'permanent'|'deferred', amount, delayPhases? }
  | { kind:'character', amount }
  | { kind:'stat', stat, amount }
  | { kind:'snaps', amount }
  | { kind:'injury', injuryType }            // pulls from injury table
  | { kind:'suspension', phases }            // costs snaps
  | { kind:'trophy', id } | { kind:'award', id }
  | { kind:'moment', item, icon }            // logs to timeline
  | { kind:'transferOffer', ... } | { kind:'ending', reason }
```

**Data tables:**
- **Injury table:** `injuryType → { label, overallDelta, timing:'deferred', recoveryPhases, snapsImpact }` (~8 injuries for v1).
- **School ladder:** `schools[] { id, name, tier, conference, state }` + `homeState → localRecruiters`. Real school/conference names (public facts). **No real player names.**

## 6. Game loop & progression

**Creation → Recruiting (fixed events):** set last name / jersey / home state / position. **Starting talent is a fixed baseline for every player** — ~3★, `overall` ~58-62, with **no starting-stat randomization**. All starting variety comes from home state, position, and the choices you make — never a talent roll. That baseline maps to a HS star rating which, combined with `homeState`, surfaces school offers RNG-weighted by tier (blue-bloods are rare for everyone at the start; `homeState` biases which local/regional programs recruit you). Pick → sets `school` + `tier`. The "walk-on to blue-chip" fantasy, if ever wanted, is a deliberate future difficulty toggle — explicitly out of scope for v1.

**Season loop** (while `status==='active'`), iterating `offseason → nonconf → conference → postseason`:
1. **Event selection:** all matching `fixed` events fire (scripted milestones), plus random events drawn by `weight`, filtered by `conditions`, resolved via seeded RNG.
2. **Resolve:** show options → pick → roll `probability` → apply the branch's stacked effects.
3. **Accrue:** snaps build per phase; the 2-3 headline stats compute from `snaps × overall × rng`. Active injuries tick down `recoveryPhases`; queued deferred effects fire when their delay elapses.
4. **Postseason:** bowl/CFP resolution → possible team trophies; season stats crossing thresholds → individual awards (RNG-gated).

**End-of-season → offseason decision hub (branch-heavy heart):**
- **Eligibility advances** (FR→SO→JR→SR; a redshirt — young or injured players — preserves a year).
- **Transfer portal:** offers surface, soft/RNG-weighted by `overall`/`draftStock`/`tier` → *stay / move up / move down for playing time*.
- **If `draftEligible`** (post-JR, or SR): the **declare-for-draft** fork — cash in current stock now, or return for another season (upside: raise stock, chase trophies; downside: injury/decline/wash-out). The iconic CFB decision.
- **Bust checks:** career-ending injury, academic ineligibility, or wash-out → `status:'busted'`.

**Endings:**
- **Draft night:** final `draftStock` → **round + overall pick** (small RNG spread) → reveal + **career summary** (stats, trophies, awards, moments timeline) as a shareable card.
- **Bust:** undrafted / career-over summary with the reason.

**Determinism guarantee:** `seed` + exact sequence of choices → byte-identical career. Every RNG draw pulls from the seeded cursor, so a seed is shareable and replayable.

## 7. Positions (v1)

Position **buckets** (each with its own 2-3 headline stats), covering the whole field at a fraction of the content cost:

| Bucket | Covers | Headline stats |
|---|---|---|
| QB | QB | Passing yds, Pass TDs, INTs |
| Offensive skill | RB/WR/TE | Scrimmage yds, Total TDs, Receptions |
| OL | OT/OG/C | Pancakes, Sacks allowed (stock leans on overall+snaps) |
| DL | DL/EDGE | Sacks, TFLs, Tackles |
| Defensive skill | LB/CB/S | Tackles, INTs, Pass breakups |
| Kicker (novelty) | K | FG%, Long FG, Game-winners (draft ceiling capped by design) |

Kicker is a self-aware hard-mode: kickers rarely draft high, so the "high pick" goal is inherently capped, and its stat shape differs from everyone else's.

## 8. Off-field / character model

Off-field and tongue-in-cheek events (catfished, speeding ticket in Georgia, viral rant, NIL drama, problematic cousin visiting, partying) primarily feed **`character`** (0-100), with the same immediate/permanent/deferred timing trick, and can also directly cost **snaps via suspensions**. `character` folds into the derived `draftStock`, enabling the "elite talent slides in the draft over red flags" storyline. Risk/gamble events (e.g., "new workout regimen") are the core replay driver — a probabilistic fork applying multiple stacked effects.

## 9. Testing strategy

The engine is pure and seeded, so testing is straightforward:
- **Determinism/golden tests:** `seed + scripted choices → snapshot(GameState)`; a few fixed golden careers catch unintended logic changes.
- **RNG tests:** seeded PRNG produces a known sequence.
- **Effect-application unit tests:** each `Effect` kind in isolation (overall timings, injury recovery ticking, suspension→snaps, character clamping, trophy/award/moment logging).
- **Derivation tests:** `draftStock` monotonicity + boundaries; `eligibleTiers` gating.
- **Progression tests:** eligibility advances; declare-early ends the game; each bust condition triggers.
- **Content validator (critical):** a schema check over the *entire* content library (valid ids, `probability∈[0,1]`, `weight≥0`, reachable conditions). Makes bulk content authoring safe — bad data fails CI.
- **Balance harness:** a Monte-Carlo runner plays N-thousand random careers and reports distributions (draft-slot spread, bust rate, avg career length, trophy frequency) to tune weights/probabilities.
- **UI:** light — component render + one smoke playthrough.

## 10. v1 scope & content volume

The engine + schema is small and bounded; **content is the long pole** and the part worth delegating to a subagent against the frozen schema + validator.

Rough v1 targets:
- ~60-100 events (universal + position + off-field + injury + gamble + fixed milestones).
- ~8-injury table.
- ~40-60 real schools across the 4 tiers with conferences + states.
- Trophy/award set: CFP title, conference titles, NY6 bowls, Heisman, All-American, All-Conference.
- 6 position buckets (Section 7).

**Out of scope for v1 (possible follow-ups):** NFL coda after the draft; global leaderboards / server-saved careers; full 11-position granularity; mobile/Discord front-ends (the UI-agnostic engine leaves these open).

## 11. Tech stack

- **Engine:** TypeScript, pure functions, no runtime deps beyond a seeded PRNG (e.g., a small mulberry32/LCG). Tested with the project's test runner (Vitest).
- **Content validation:** schema validation (e.g., Zod or hand-rolled) run in tests.
- **UI:** React + Vite (mirrors the original's stack), `localStorage` persistence, deployable free to static hosting (Vercel/Netlify/GitHub Pages).
- **No backend.**
