# Stage 3e — Correctness and Instrumentation

**Status:** approved 2026-08-14
**Baseline:** `main` at `ec73813`, working tree clean, `npm test` → 266 passing (23 files).
**Source:** `docs/superpowers/STAGE3E-HANDOFF.md`, which carves this work out of the Stage 4 backlog
in `docs/superpowers/STAGE4-HANDOFF.md`.

## Why this stage exists

Stage 4 is balance tuning. Tuning is premature while four engine/schema traps are open and while
`runBalance` can only measure one of the six position slices. This stage closes the traps and makes
the other five slices measurable. It contains **no balance tuning** — every content edit below is
either a text/mechanic mismatch or the removal of a mechanically inert effect.

## Findings that shaped the design

Verified against the codebase during brainstorming:

- **The `pendingEffects` leak is latent, not active.** All 14 live `deferred` effects are queued
  from `offseason`, `nonconf`, or `conference` phases, all of which reach a `tickPhaseStart`. No
  live `postseason` `deferred` remains — Stage 3d fixed both. The gap is still open for the next
  author, and there is a second orphan path the handoff did not name: an offseason-queued
  `deferred` is also dropped when `enterOffseason` forces `status = "declared"`.
- **`recoveryPhases: 1` is fully inert, not merely weak.** `applyEffect` subtracts `overallDelta`
  and the next `tickPhaseStart` restores it before anything is simulated — no sideline, no lasting
  loss. Three injuries are defined at 1: `hamstring`, `concussion`, `turfToe`. Only `hamstring` is
  referenced by live content (once, in `universal.ts`).
- **Trap 2 (offseason `stat`/`snaps`) is live.** A sweep of all content found exactly one violation:
  `milestone-fall-camp/compete` grants `{ kind: "snaps", amount: 40 }` from an offseason phase
  (`milestones.ts:25`). It writes to `seasons[length - 1]` — the previous, already-consumed season.
  With `snapsPerDevPoint: 180` those 40 snaps are worth 0.22 dev points, which floors to 0, so the
  grant's *only* live effect is via `washoutSnapFloor: 60`, where it can retroactively lift a season
  over the buried-washout threshold and cancel a washout one season later.
- **`permanent` and `immediate` are byte-identical** for `overall` effects (63 vs 72 sites in
  `src/content/`). The
  comment at `effects.ts:26` claims the distinction matters for injury recovery; injury recovery
  restores its own `restoreAmount` and never reads `timing`. The comment describes behavior that
  does not exist.
- **The award-stat blind spot is exactly as predicted.** OL and K have downside
  (`cadence-trouble`, `guard-or-tackle`; `kickoff-duties-too`, `iced`). QB, OSKILL, DL, and DSKILL
  have none.

## §1 — Engine

### 1.1 Flush pending effects at career end

Add to `src/engine/effects.ts`:

```ts
export function flushPendingEffects(state: GameState, injuryOf: InjuryLookup): void
```

It empties `state.pendingEffects` and applies every entry unconditionally, ignoring `firePhaseAbs`.

The "don't re-defer a deferred effect" coercion currently inlined at `effects.ts:102-104` is
extracted into a shared private helper so `tickPhaseStart` and `flushPendingEffects` cannot drift
apart.

**Call site:** `finalizeIfEnded` in `src/engine/advance.ts`, whenever `status !== "active"`, and
**before** `computeDraftResult`. This covers the postseason→declare path and the
`enterOffseason`→forced-declare path, and it flushes on `busted` too, so the balance report's
`avgFinalOverall` is not inflated by penalties that were queued and never landed.

`finalizeIfEnded` gains an `injuryOf: InjuryLookup` parameter. It has exactly one call site
(`advance`, line 92).

**Rejected alternative:** forbidding postseason `deferred` at the schema level. It leaves the
offseason-declare orphan open and closes off a content shape that is legitimate once the queue
always drains.

### 1.2 Collapse `timing` to `"immediate" | "deferred"`

Remove `"permanent"` from the `Effect` union in `src/engine/types.ts`. Rewrite all **66** sites to
`"immediate"`: 63 in `src/content/events/**`, one in `advance.ts:137` (the redshirt bump), and two
in tests (`outcomes.test.ts:10`, `effects.test.ts:92`). `tsc` finds any straggler. Delete the stale
comment at `effects.ts:26`.

**Rejected alternative:** giving `permanent` real teeth by making injury recovery skip restoring
permanently-lost overall. That is a new mechanic with balance consequences — Stage 4's call, not
this stage's.

### 1.3 Track career injuries

Add `careerInjuries: number` to `GameState`, initialized to `0` in `createCareer`, incremented in
`applyEffect`'s `injury` case only. Suspensions are a separate `case` and do not count.

This exists solely so §5 can report injury exposure per position, which is one of the four facts
this stage is meant to convert from probe anecdote into a committed number.

## §2 — Schema hardening

Three new rules in `validateContent` (`src/content/schema.ts`), each with a `schema.test.ts` case
asserting the error fires and a matching case asserting a valid bundle still passes:

| Condition | Error message |
|---|---|
| `injuries[id].recoveryPhases < 2` | `Injury <id>: recoveryPhases must be >= 2 (1 clears before it can sideline)` |
| a `suspension` effect with `phases < 2` | `Event <id> option <opt>: suspension of 1 phase is mechanically free` |
| an `offseason`-phase event carrying a `stat` or `snaps` effect | `Event <id> option <opt>: offseason <kind> effects write to the previous, already-resolved season` |

The third requires `checkEffect` to receive the event's `phase`, which it does not currently take.

The offseason rule generalizes to all content the constraint that `positions.test.ts` enforces only
over the six position slices.

## §3 — Content resolutions

Mechanical fixes, not tuning. Each is either a text/mechanic mismatch or an inert effect.

| File | Change | Rationale |
|---|---|---|
| `bust.ts:108` | `phases: 1 → 2` | Description already reads *"Suspended two games"* |
| `bust.ts:149` | `phases: 1 → 2` | `lawyer-up`; no text conflict |
| `offfield.ts:635` | `phases: 1 → 2`, and *"One-game suspension."* → *"Two-game suspension."* | Keeps the text true |
| `injuries.ts` | `hamstring`, `concussion`, `turfToe`: `recoveryPhases: 1 → 2` | Required by §2's rule; all three are currently inert |
| `milestones.ts:25` | Drop `{ kind: "snaps", amount: 40 }`; keep the existing `{ kind: "overall", amount: 2 }` unchanged | Required by §2's rule |

**On the fall-camp conversion:** the chosen approach was "convert the snaps grant to overall." The
arithmetic conversion is 40 / 180 = 0.22 dev points → **0 overall**, so the faithful conversion is
to drop the effect and leave `+2 overall` as it stands. Adding `+1` would be a real buff, i.e.
tuning, which this stage excludes.

**Only one real behavior change lives in §3:** `universal.ts`'s `hamstring` starts actually
sidelining. `concussion` and `turfToe` are unreferenced, and the three suspension bumps affect
band-2/band-3 content that fires rarely.

## §4 — The content contract

Add to `src/content/events/positions.test.ts`:

> some reachable outcome reduces the bucket's award stat

An outcome is reachable if it exists on any option (positive, or negative where present). The award
stat is `SIGNATURE[position].stat`, already defined in that file. The assertion runs for all six
slices against an explicit gap list:

```ts
// Stage 4 decision — fix or ratify. See STAGE4-HANDOFF.md §"The content contract's blind spot".
const KNOWN_NO_AWARD_STAT_DOWNSIDE = new Set<Position>(["QB", "OSKILL", "DL", "DSKILL"]);
```

Listed slices assert the property is **absent**; unlisted slices assert it is **present**. This
fails in both directions: a slice that loses its downside fails, and a listed slice that gains
downside without being removed from the list also fails. The list can only shrink.

This is deliberately stronger than the `it.skip` the handoff sanctions, and it is not a silent
weakening — the four gaps are named in code with a pointer to the stage that owns the decision.

## §5 — Instrumentation

### 5.1 Parameterize `runBalance`

```ts
export function runBalance(
  runs: number, seedPrefix: string, policy: Policy, position: Position = "QB",
): BalanceReport
```

The default keeps every existing call site working unchanged.

### 5.2 New `BalanceReport` fields

| Field | Source |
|---|---|
| `position` | the parameter, echoed so an `all` run's rows are self-describing |
| `allConfRate` | share of careers whose `state.awards` includes `"allConference"` (the list is deduped, so no engine change is needed) |
| `avgInjuries` | mean `careerInjuries` (§1.3) |
| `injuredRate` | share of careers with `careerInjuries > 0` |
| `washoutRate` | share of **all** careers ending via the soft-washout path rather than the character spiral |

`washoutRate` requires the two washout reason strings in `enterOffseason` to be exported as named
constants from `advance.ts` and imported by `balance.ts`, rather than matched as inline literals.

### 5.3 CLI

```
npm run balance -- <runs> <policy> [position|all]
```

Position defaults to `QB`, preserving the documented `npm run balance -- 500 random` invocation.
`all` emits a six-row array — this is the command that regenerates the handoff's per-position table.

### 5.4 Tests

- A `describe.each` over all six positions at **200 runs each**, asserting structural invariants
  only: rates in `[0, 1]`, `avgSeasons > 1`, `minFinalCharacter ≤ characterP05 ≤ characterP25`,
  `charUnder35Rate ≤ charUnder55Rate`, `injuredRate ≤ 1`, `washoutRate ≤ bustedRate`.
- The existing `bustedRate > 0` gate **stays QB-only at 500 runs, unchanged**, with a comment
  recording that it rests on 4 careers in 500 (3 of them from the injury path, `the-knee` →
  `bust-mri`) and that §3's `hamstring` change may move it.

**Rejected alternative:** numeric bands per position. Stage 4's entire job is moving those numbers;
every tuning commit would have to re-baseline six gates.

## §6 — Verification and docs

Verification, in order:

1. `npm test` green.
2. `npm run typecheck` — both passes (`tsconfig.engine.json` then `tsconfig.json`) exit 0.
3. `npm run play -- demo` reaches a terminal state.
4. `npm run balance -- 500 random` still reports `bustedRate > 0`.
5. `npm run balance -- 500 random all` produces the six-row table.

Then update `docs/superpowers/STAGE4-HANDOFF.md`:

- Replace the per-position table with the measured output from step 5.
- Update §"Engine-level traps" to record traps 1–4 as closed, and how.
- Update §"Measurement notes" with the new QB baseline. §1.1 and §3 will move the headline numbers,
  so the existing baseline is stale by design; record the new one rather than explaining the delta.

## Risk

§3's `hamstring` fix and the fall-camp snaps removal both push toward more busts; §1.1's flush
pushes draft stock slightly down. The QB baseline in the handoff will move. That is expected, but it
makes the `bustedRate > 0` gate the one thing to check early rather than at the end of the stage.

## Explicitly out of scope

- Fixing the four award-stat gaps §4 names. That is a content decision Stage 4 owns.
- Any change to `devCap`, `snapsPerDevPoint`, `postseason.ts`, or bust weights and gates.
- Anything else from the Stage 4 backlog.
