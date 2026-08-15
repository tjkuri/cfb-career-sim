# CFB Career Sim — Stage 3e Handoff

Read this first when starting **Stage 3e (correctness + instrumentation)** in a fresh session.

**Read `STAGE4-HANDOFF.md` alongside it.** That document is the full picture — current state, how
to verify green, what Stage 3d shipped, the measurement caveats, and the ~40-item Stage 4 backlog.
This document does one thing: it carves three items out of that backlog, says why they come before
tuning, and gives you the specifics.

## Why 3e exists

Stage 4 is balance tuning. Two things make tuning premature right now:

1. **Three known engine/test defects are still open.** They are correctness bugs, not balance
   questions. Tuning content that sits on buggy paths means tuning around the bugs, and every
   content change made in that state has to be revisited once they're fixed.
2. **Five of the six position slices have no committed measurement.** `runBalance` hardcodes
   `position: "QB"` (`src/sim/balance.ts:35`), so `npm run balance` — the command Stage 4 will
   live inside — is blind to 5/6 of the game's content. Tuning what you cannot measure is how
   Stage 3c's milestone problem happened: five guaranteed events moved `round1Rate` 7× before
   anyone noticed.

3e is small, has no content changes, and makes Stage 4 measurable. Do it first.

## Scope — three items, in this order

### 1. Engine traps (correctness)

Full detail in `STAGE4-HANDOFF.md` §"Engine-level traps". Summary of what to fix:

- **Postseason `deferred` effects can be silently dropped.** `state.pendingEffects` has exactly one
  drain (`tickPhaseStart`), and the declare paths return before `autoProgress` reaches it. Measured
  at **~38% loss** on one event before it was caught. Stage 3d fixed the two live content
  instances (`offfield.ts`, `dl.ts`); **the engine gap is still open** and the next author who
  writes a postseason `deferred` effect hits it again. Fix the mechanism — drain `pendingEffects`
  on the declare path, or make the trap structurally impossible — not just the instances.
- **`phases: 1` suspensions are mechanically inert**, and three live instances remain free:
  `bust.ts:108`, `bust.ts:149`, and `speeding-georgia` in `offfield.ts`. Same root cause as the
  `recoveryPhases: 1` trap. `schema.ts` enforces `recoveryPhases >= 1` — one below the first value
  that does anything, which is worth fixing at the schema level so it cannot be authored again.
- **`timing: "permanent"` and `"immediate"` behave identically** for `overall` effects
  (`effects.ts:20-28`); only `deferred` differs. All 58 position-pile events choose between two
  values with no distinction. Either give them distinct behavior or collapse them in the schema and
  authoring guidance. This is a decision, not a bug — make it deliberately.

Consider also whether the **offseason `stat`/`snaps` trap** (trap 2 in the Stage 4 handoff) should
be guarded in the engine rather than documented. Right now it is handled purely by convention and a
`positions.test.ts` assertion; nothing stops a future author outside that file from hitting it.

### 2. The content contract's blind spot (test coverage)

`positions.test.ts` computes expected value over **`overall` effects only** — never `stat`,
`character`, or `snaps`. A real defect shipped through it (the K slice's `fieldGoals` one-way
ratchet, caught only by human review), and **the same shape survives in qb, oskill, dl, and
dskill**: no outcome in those four slices ever reduces the bucket's award stat. 20 free
`probability: 1` floors across the pile; DL is worst and has the highest `allConfRate` (0.796).

Add the assertion — "some reachable outcome reduces the bucket's award stat" — and it will fail for
four slices. **That is the point.** Fixing those four is a content decision that should be made
once for all six slices, not piecemeal; it is a legitimate Stage 4 call whether to fix them or
ratify them. Either land the assertion with the four fixes in the same stage, or land it skipped
with a pointer, but do not silently weaken it.

### 3. Parameterize `runBalance` by position (instrumentation)

`src/sim/balance.ts:35` hardcodes `position: "QB"`. Parameterize it, extend the CLI, and add
per-position coverage to `balance.test.ts`.

This is the highest-leverage item in 3e: it converts four Stage 4 backlog entries from anecdote
into measurable facts —

- injury exposure is uneven (OSKILL 0.053/event vs QB/OL/DL exactly 0)
- character drift by slice (K +0.257/event vs OL −0.107/event, a 3.3-point career spread against a
  band-2 gate of 55)
- All-Conference rates run 0.49–0.80 across positions
- `bustedRate` is already non-zero for OSKILL (0.022) and K (0.006) via the **soft-washout path**,
  a mechanism entirely distinct from the character spiral

Every one of those numbers currently comes from throwaway probe scripts recorded only in Stage 3d
task reports. None has a committed gate behind it. After this item, they all can.

**Watch out:** the existing `bustedRate > 0` gate in `balance.test.ts` is QB-specific and rests on
4 careers in 500, 3 of which come from the injury path (`the-knee` → `bust-mri`) rather than the
character spiral. Do not accidentally generalize that gate across positions — the per-position
rates differ by mechanism, and the QB gate's specific dependency is documented in the Stage 4
handoff's §"Measurement notes".

## What is explicitly NOT in 3e

- **No content authoring or content tuning.** If item 2's assertion forces a content decision,
  that decision is Stage 4's; 3e's job is to surface it, not to settle it.
- **No changes to `devCap`, `snapsPerDevPoint`, `postseason.ts`, or bust weights/gates.** Those are
  Stage 4's levers.
- **Nothing else from the Stage 4 backlog.** It is long and ordered; resist pulling items forward.

## Current state (verify before starting)

- **`main` is at `4b3f884`**, Stage 3d merged, working tree clean.
- `npm test` → **266 passing** (23 files).
- `npm run typecheck` → **two passes** (`tsc -p tsconfig.engine.json && tsc -p tsconfig.json`);
  both must exit 0. The engine pass enforces no-Node-globals in `src/engine/**` + `src/content/**`.
- `npm run play -- demo` → plays a career to a terminal state.
- `npm run balance -- 500 random` → current baseline:
  `draftedRate 0.992, bustedRate 0.008, undraftedRate 0.044, round1Rate 0.040, avgSeasons 3.108,`
  `avgFinalCharacter 53.32 (median 56), minFinalCharacter 3, characterP05 32, characterP25 48,`
  `charUnder55Rate 0.456, charUnder35Rate 0.072, avgFinalOverall 73.592, minFinalOverall 54`
- Node is **v22.0.0 (< 22.6)** → CLI scripts run via `tsx`, not `node --experimental-strip-types`.

**Note `avgFinalCharacter` 53.32 is a MEAN and the median is 56** — the mean is dragged by a
left-skewed tail whose minimum is 3. A controller misread this mid-3d and briefly concluded a
design goal had failed when it had been met. The band-2 gate is 55; the median is above it.

## Exit criteria

- The postseason-`deferred` gap is closed at the mechanism level, with a test that would fail if
  it regressed.
- No `phases: 1` suspension can be authored (schema-level), and the three live instances are
  resolved.
- The `permanent`/`immediate` question is decided deliberately and the codebase reflects the
  decision.
- `positions.test.ts` asserts award-stat downside; the four failing slices are either fixed or
  explicitly deferred with a pointer.
- `runBalance` takes a position; `balance.test.ts` covers more than QB; the per-position table in
  `STAGE4-HANDOFF.md` is replaced with measured, committed numbers.
- `npm test` and `npm run typecheck` green; `npm run balance -- 500 random` still reports
  `bustedRate > 0`.

## Recommended flow

1. Verify green (above).
2. **`superpowers:brainstorming`** — the open design questions are genuinely open: how to close the
   `pendingEffects` gap (drain on declare vs. forbid postseason `deferred` structurally), whether
   `permanent`/`immediate` should be collapsed or differentiated, and how far to take per-position
   measurement (parameter only, or a full six-position gate in `balance.test.ts`).
3. **`superpowers:writing-plans`** → one plan; 3e is small enough not to need two.
4. **`superpowers:subagent-driven-development`** to execute.
5. Then **Stage 4**, per `STAGE4-HANDOFF.md`.

## Key file pointers

- **Engine:** `src/engine/effects.ts` (`applyEffect`, `tickPhaseStart`, `pendingEffects`),
  `src/engine/advance.ts` (`autoProgress`, `enterOffseason`, the declare paths),
  `src/content/schema.ts` (`validateContent`).
- **Instrumentation:** `src/sim/balance.ts`, `src/sim/balance.test.ts`, `src/sim/play-headless.ts`.
- **The contract:** `src/content/events/positions.test.ts`.
- **Content the fixes touch:** `src/content/events/bust.ts`, `src/content/events/offfield.ts`.
- **The full backlog and all measurement caveats:** `docs/superpowers/STAGE4-HANDOFF.md`.
