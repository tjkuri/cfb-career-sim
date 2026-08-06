# CFB Career Sim — Stage 3b Handoff

Read this first when starting **Stage 3b (the content push)** in a fresh session. It orients you and captures the decisions already locked so you can go straight to designing the content.

## Where things stand (as of this handoff)

- **`main` is at `b8aa1b1`**, all merged, nothing in flight, working tree clean.
- **141 tests pass, typecheck clean.** Verify quickly:
  - `npm test` → 141 passing.
  - `npm run typecheck` → runs **two passes** (`tsc -p tsconfig.engine.json && tsc -p tsconfig.json`); both must exit 0. The engine pass enforces no-Node-globals in `src/engine/**` + `src/content/**`.
  - `npm run play -- demo` → plays a QB career to a terminal state, prints JSON.
  - `npm run balance -- 500 random` → Monte-Carlo distribution summary.
- Node is **v22.0.0 (< 22.6)** → CLI scripts run via `tsx`, not `node --experimental-strip-types`.
- **Durable progress ledger:** `.superpowers/sdd/progress.md` (git-ignored, on-disk) — the authoritative record of every stage/task/commit. Trust it + `git log` over any recollection.

## What's done (Phase 2 so far — all merged)

- **Stage 1 — hardening:** tsconfig split (engine isolation), rng guards, effect exhaustiveness + discriminated suspension, validator hardening, **enriched `EventConditions`** (`maxCharacter`/`maxOverall`/`requiresActiveInjury`).
- **Stage 2a — postseason resolver:** per-season team record → team trophies + individual awards (soccer-borrowed formula: overall-band × position-multiplier × team-success-boost for prestige; stat thresholds for production), all feeding `deriveDraftStock`. Plus the development curve (overall grows from snaps each offseason).
- **Stage 2b — offseason hub:** shared home-state/region school sampler, **transfer portal** (stay/lateral/up/down + one-season snap modifier), **soft-washout bust** (makes `busted` reachable), hub decision sequencing.
- **Stage 2c — redshirt:** one-time bump/sink development gamble (sit a season → permanent +5/−3 roll, eligibility cap 4→5, no individual awards that season).
- **Stage 3a — content enablers (the immediate predecessor):**
  - **Fixed milestone events now fire.** `autoProgress` fires every matching `fixed` event for a phase (one at a time, tracked in `GameState.phaseFiredEventIds`), then the single random draw. `selectFixedEvent` is the selector. **Behavior is unchanged for current content** because the only existing fixed event is `recruiting` (engine-special, excluded).
  - **Kicker produces real stats.** K headline stats are now countable `["fieldGoals","points","gameWinners"]` with real `STAT_MODEL.K` yields and a K All-Conference production row. Prestige multiplier stays 0.05 (hard-mode ceiling).

## What Stage 3b is

**The content authoring push** — the large, parallelizable pile the whole architecture was built to make safe. The engine/systems are all done; 3b fills in the content. Locked scope decisions (already agreed with the user):

- **Bounded pass**, not the full 100: ~**8–12 events per position bucket** + the bust/off-field/milestone pools → **~50–70 events total**. Goal: every one of the 6 positions is genuinely playable and varied. More is easy to add later.
- **Parallel subagent authoring** is approved for the flavor pile (independent append-only slices — one per position, off-field, etc. — that can't collide; the validator + typecheck is the guardrail). Author the mechanically-wired content (bust, milestones) more carefully.
- **Tone:** keep the existing light "silly + real-seeming" register (catfished, speeding ticket in Georgia, NIL drama alongside real football beats). **No mean-spirited or genuinely offensive content. No real player names** (school/conference names are fine — public facts).

### Concrete 3b work items

1. **School ladder → ~40–60 schools** (`src/content/schools.ts`) across the 4 tiers with real conferences + states. The shared sampler (`src/engine/schools.ts`) already weights by home-state/region — just needs a richer pool.
2. **Bust content** (pure content — the mechanisms exist): career-ending-injury / academic-ineligibility / off-field-expulsion events using the enriched conditions (`requiresActiveInjury`, `maxCharacter`, `maxOverall`) + the `{kind:"ending", reason}` effect. **This is what finally makes busts common in real play** (soft-washout alone rarely fires — see ledger). An e2e busted-via-content test is worth adding.
3. **Fixed milestone events** (now fireable): senior-day, rivalry-week, bowl-selection beats, etc. Gate them with conditions so they fire when intended.
4. **Per-position stat + flavor events** for all 6 buckets (QB, OSKILL, OL, DL, DSKILL, K). Currently only QB has authored events (~5). Each bucket needs its slice referencing its own stats (see `POSITIONS`).
5. **Universal + off-field/gamble events** to round out the pool.

## The content contract (how to author — the guardrail)

Content is typed data validated at import (`validateContent` in `src/content/schema.ts` runs in `src/content/index.ts`, throws on any bad reference). **Author against it and the validator catches mistakes — this is what makes bulk/parallel authoring safe.**

- **`Event { id, kind:'fixed'|'random', phase, weight, conditions?, title, description, options[] }`**
  - `kind:'random'` → drawn by weight, at most one per phase. `kind:'fixed'` → fires whenever conditions match (once per phase per season; **no once-per-career mechanism** — gate with conditions).
  - `phase`: `'offseason'|'nonconf'|'conference'|'postseason'`.
  - `conditions?`: `position[]`, `minClass`, `tier[]`, `requiresInjury`, `requiresActiveInjury`, `maxCharacter`, `maxOverall`.
- **`Option { id, label, probability, positiveOutcome, negativeOutcome? }`** — `probability` splits the roll (1 = deterministic).
- **`Outcome { description, effects: Effect[] }`** — outcomes stack multiple effects.
- **`Effect`** union: `overall`(immediate/permanent/deferred), `character`, `stat`, `snaps`, `injury`, `suspension`, `trophy`, `award`, `moment`, `ending`.
- **New content must reference only known ids** (injuries in `injuries.ts`, `trophyIds`/`awardIds` in `index.ts`, stats derived from `POSITIONS`) or the validator fails the build.
- **Determinism/purity is sacrosanct:** no `Math.random`/`Date.now`/IO in `src/content/**` or `src/engine/**`; all randomness flows through the seeded rng.

### Current content inventory (what's there now)

- **~6 events** (`src/content/events.ts`): `recruiting` (fixed) + `gym-grind`, `film-study` (QB), `catfished`, `speeding-georgia`, `signature-win` (QB) — QB-heavy, thin.
- **10 schools** (`src/content/schools.ts`).
- **Injuries** (`src/content/injuries.ts`): hamstring, ankle, shoulder, concussion, acl.
- **Trophy ids:** `confTitle`, `cfpTitle`, `bowlWin`. **Award ids:** `heisman`, `allAmerican`, `allConference`.
- **Positions** (`src/content/positions.ts`): QB, OSKILL, OL, DL, DSKILL, K (K stats now `fieldGoals`/`points`/`gameWinners`).

## Notes for 3b authors (from the Stage-3a review)

- Fixed events **can fire during a redshirt sit season** and **in the postseason before the resolver runs** — so a postseason fixed event's stat/injury effects feed that season's team-record + award computation. Gate milestone conditions deliberately (e.g. don't fire a "big-game hero" beat during a redshirt sit).
- A fixed event whose conditions flip mid-phase is safe (fired ones are excluded; no loop).

## Recommended flow for the new session

1. Verify green (`npm test`, `npm run typecheck`).
2. **`superpowers:brainstorming`** on the Stage-3b content design — nail the concrete content shape (which events per bucket, the specific bust beats, milestone list, off-field flavor). Much is decided (scope/tone/parallelization above); this is content-shaped design.
3. **`superpowers:writing-plans`** → a 3b plan. Consider splitting: careful/mechanical slices (schools, bust, milestones) first, then the parallel per-position + off-field flavor slices as append-only files.
4. **`superpowers:subagent-driven-development`** to execute — parallel subagents for the independent flavor slices (append-only, validator-guarded), sequential review as usual. **Only spawn subagents when the plan calls for it and the user is executing.**
5. Then **Stage 4 (balance)** — tune all initial config values against `npm run balance`, and pick up the logged Stage-4 minors (below).

## Logged Stage-4 items (from prior reviews — address in the balance pass)

- Validate `ProgressionConfig` washout floors fully; assert `positionMultiplier` completeness; range-check win-pct knobs.
- K production threshold (15) is borderline at baseline overall (~13–17 fieldGoals) — only above-average kickers clear it.
- `washoutSnapFloor` (60) is likely unreachable given 3-phase snap accrual (~360–600/season) — consider a per-season fraction instead of an absolute floor; natural buried-washouts rarely fire, so busts depend on Stage-3b bust content.
- Redshirt roll-isolation test (`advance.test.ts`) exactness depends on `sitSnapModifier × maxSnaps × 3 < snapsPerDevPoint` (today 30 < 180); add a comment/guard before tuning those constants.
- Consider whether SR medical-redshirts (offered when a senior carries an injury) are intended in the balance model.

## Key file pointers

- **Design specs:** `docs/superpowers/specs/2026-08-02-phase2-content-engine-design.md` (the master Phase-2 spec — Decision 3 bust paths, Decision 5 authoring approach, §7 positions, §10 volume), plus the per-stage specs (`…stage2c-redshirt…`, `…stage3a-content-enablers…`).
- **Plans:** `docs/superpowers/plans/` (one per stage).
- **Ledger:** `.superpowers/sdd/progress.md`.
- **Content to author into:** `src/content/{events,schools,injuries,positions}.ts`, ids in `src/content/index.ts`, config in `src/content/{postseason,regions,redshirt}.ts`.
- **The guardrail:** `src/content/schema.ts` (`validateContent`).
- **Engine surfaces content uses:** `src/engine/select-event.ts` (fixed/random selection), `src/engine/advance.ts` (the loop + hub), `src/engine/effects.ts` (effect application), `src/engine/postseason.ts` (resolver consuming stats via awards).
