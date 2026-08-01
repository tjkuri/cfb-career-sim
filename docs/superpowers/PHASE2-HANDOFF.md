# CFB Career Sim — Phase 2 Handoff

Read this first when starting Phase 2 in a new session. It orients you and lists the open design questions to brainstorm before writing any code.

## Where things stand

- **Phase 1 (engine + playable headless core) is DONE and merged to `main`.** 64 tests pass, typecheck clean.
- Verify quickly: `npm test`, `npm run typecheck`, `npm run play -- demo` (plays a QB career to draft night and prints a JSON summary), `npm run balance -- 500 random`.
- Node here is **v22.0.0 (<22.6)**, so the CLI scripts run via `tsx` (a devDependency), not `node --experimental-strip-types`.

## Key docs (read as needed)

- Design spec (all Phase-1 decisions + rationale): `docs/superpowers/specs/2026-07-25-cfb-career-sim-design.md`
- Phase-1 plan (how the engine is built, task by task): `docs/superpowers/plans/2026-07-25-phase1-engine-headless-core.md`
- Build ledger + Phase-2 backlog + known deferrals: `.superpowers/sdd/progress.md`
- Reverse-engineered soccer reference: `reference/soccer-original/CareerSimulatorPage-BtSZ7OIp.js`

## The contract Phase-2 content/engine must respect

**Engine public API** (`src/engine/index.ts`): `createCareer(setup, seed)`, `advance(state, choiceId)`, `getDecision(state)`, `deriveDraftStock(state)`, `computeDraftResult(state, rng)`, `eligibleTiers(state)`. The engine is **pure, seeded, deterministic, zero-dependency** — keep it that way (no `Math.random`/`Date.now`/IO in `src/engine/**` or `src/content/**`; all randomness flows through the seeded rng in `GameState.rngCursor`).

**Content schema** (`src/content/schema.ts`, enforced by `validateContent`, which runs at import in `src/content/index.ts`):
- `Event { id, kind:'fixed'|'random', phase, weight, conditions?, title, description, options[] }`
- `Option { id, label, probability, positiveOutcome, negativeOutcome? }`
- `Outcome { description, effects: Effect[] }`
- `Effect` union: `overall`(immediate/permanent/deferred), `character`, `stat`, `snaps`, `injury`, `suspension`, `trophy`, `award`, `moment`, `ending`.
- Position buckets (stats already defined for all six in `positions.ts`): QB, OSKILL, OL, DL, DSKILL, K. **Only QB has authored events so far.**
- New content must reference only known ids (injuries, trophyIds, awardIds, stats) or the validator fails the build — this is the safety net that makes bulk authoring / subagent delegation safe.

## Open Phase-2 design questions (brainstorm these first)

Phase 2 is NOT pure content — several items need engine additions too. The brainstorm should decide what's engine vs content for each.

1. **Transfer-portal climb.** Today only season-0 recruiting surfaces school options (`recruitingOptions`); there is no in-career transfer. Design an offseason transfer-offer decision: which schools surface (by `eligibleTiers` + performance), how often, and the stay/move-up/move-down choice. Likely needs a new synthetic decision in `advance`'s offseason hub (like the `declare` decision).
2. **Team trophies & individual awards.** No content emits `trophy`/`award` effects yet, and there's no team-result or award simulation. Decide: a postseason resolver in the engine (team record → conf title/CFP/bowl by overall+tier+rng; season stats crossing thresholds → Heisman/All-American), vs. driving these purely through content events. Currently `bustedRate`/awards are structurally 0.
3. **Bust / washout endings.** No content emits `ending` effects, so the `busted` terminal path is unreachable end-to-end. Add academic-ineligibility / career-ending-injury / washout events, and an e2e test that drives a career to `busted`.
4. **Per-position content.** Author stat-affecting + flavor events for OSKILL, OL, DL, DSKILL, and K (kicker as self-aware novelty/hard-mode). Target ~60-100 events total across universal + position + off-field + injury/gamble + fixed milestones.
5. **Authoring approach & parallelization.** Hand-author vs generate-then-validate against the frozen schema; how to split across subagents safely (the validator is the guardrail).
6. **Redshirt mechanic.** `eligibility.redshirtUsed` exists but nothing uses it — decide the redshirt decision/flow.
7. **Home-state recruiting depth.** `recruitingOptions` currently picks one school per tier, preferring home state; may want richer school pools and regional weighting.
8. **Balance pass.** Once bust events + real award/trophy thresholds exist, tune weights/probabilities/draft bands against `npm run balance` distributions (draft-slot spread, bust rate, career length).

## Engine hardening backlog (from Phase-1 reviews — schedule early in Phase 2)

- Restore the engine's no-Node-globals compile guardrail via a project-references split (vitest+@types/node currently leak Node globals program-wide).
- `rng`: remove the inert `cursor` setter; add `rngInt` min<=max guard.
- `effects`: add a `never` exhaustiveness guard on the effect switch; give `suspension` a discriminated field instead of the `"suspension"` magic string in `injuries[]`.
- `schema`: type-predicate filter instead of `oc!`; assert `recruiting.kind==='fixed'`; validate `minClass`/`tier` condition values.
- `draft`: boundary tests at the undrafted floor (35) and tier cutoffs (25/45/70).
- `advance`: validate the `declare` choiceId (reject anything other than `declare`/`return`).
- Fix stale comment at `advance.test.ts:56` (first-option policy declares, not returns).

## Recommended first steps next session

1. Verify Phase 1 still green (`npm test`).
2. Run `superpowers:brainstorming` on Phase 2, working through the open questions above (deciding engine-vs-content for each).
3. Produce a Phase-2 spec, then a plan, then execute via `superpowers:subagent-driven-development` (same flow as Phase 1). Consider tackling the small engine-hardening backlog as an early task set before the big content push.
