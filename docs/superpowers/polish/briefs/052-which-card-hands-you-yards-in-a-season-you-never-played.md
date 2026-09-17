# 052 — Which card hands you 130 yards in a season the engine says you never played

Repo: `/Users/tkuri/Documents/personal_projects/cfb-career-sim`
Branch: `polish/ui-phase`. **Work from a detached worktree pinned at commit `4076822`** — another agent
is editing `src/content/events/**` in the main tree this wave and would move your target under you.

## Goal

**Measure, do not fix.** Find which authored `stat` effects actually land production on a season line
with no playing time, measure how often a *player* meets the result, and price the repair routes so the
user can choose one. You will not edit `src/engine/**` or `src/content/**` — not even the fix you are
confident about.

## Why this lane exists, and why it is not the obvious one-liner

The symptom (B64): a played season stores `snaps: 0` beside a live stat line. Downstream, everything
inherits it — the ledger prints *"0 snaps"* next to the yards, `seasonOverallDelta` reads the zero and
charges the upperclass decline (a **−4** and the verdict *"A season on the sideline cost you ground"*)
on a season the player lived through, and `productionScore` loses those snaps from draft stock.

**Last wave the obvious fix was approved by the user, implemented TDD, and then reverted**, because the
non-vacuous check showed it changed nothing: 29 bad rows in 56,481 before, 29 after, and instrumenting
every snap effect showed the clamp at `src/engine/effects.ts:61` **never touched one of the 29**. It is
exonerated. **Read `docs/superpowers/polish/DECISIONS.md` entry 073 in full before anything else** —
it is short, and it is the reason this brief says "measure" four times.

The relocated cause: there are **123 authored `stat` effects** in `src/content/events/**` that write
production onto the current season line without adding snaps. `src/engine/simulate.ts:26-32` cannot
produce the defect (stats derive from the same phase's snaps, so zero snaps yields zero stats) and
`season.snaps` only ever increases outside of effects. One observed row matches an authored amount
verbatim — `OSKILL scrimmageYards: 20` at `src/content/events/oskill.ts:108`.

**That last sentence is a hypothesis with one confirming example. Your first job is to test it, not to
assume it.**

## Read first, and nothing else

1. `docs/superpowers/polish/DECISIONS.md` — entry **073**.
2. `docs/superpowers/polish/reports/048-the-ledger-disagrees-with-the-season.md` — **§5**, and its
   named repro seed (`z-206`).
3. `src/engine/effects.ts` (the `stat` and `snaps` cases), `src/engine/simulate.ts`, and whatever
   computes `seasonOverallDelta` and `productionScore`.

## The work

### 1. Attribute the bad rows by instrumentation, not by reading source

Instrument the `stat` case of `applyEffect` so every write records `(eventId, optionId, effectIndex,
amount, stat)` onto the season line it touched. Sweep careers. For every row with `snaps === 0` and at
least one positive stat, produce **the named authored effect that put it there**.

Required output: a table of offending `(eventId, optionId, stat, amount)` with counts. **If a bad row
comes back with an empty attribution history, that is the headline** — it means the cause is relocated
again, and DECISION 073's own stated mind-changer is exactly this. Say so loudly rather than rounding it
into the story above.

Also re-check **048's `z-206` repro** under the instrumented build, which 073 explicitly left open.

### 2. Measure the frequency a *player* experiences, not the row rate

29 in 56,481 rows is 0.05% and sounds like nothing. That is the wrong denominator — a player meets this
once per career or never, and the one who reported it met it. Report:

- **careers with ≥1 bad season**, as a percentage, per policy and per position;
- the **distribution of harm** when it happens: the draft-stock loss, whether the −4 upperclass decline
  fired, and whether the *"season on the sideline"* verdict printed;
- whether it **clusters** — by position, by season index, by redshirt, by event.

Run it under **more than `baselineRandom`**. Use at least `good`, `virtue`, and the human-shaped policy
in `src/sim/human-lazy-probe.ts`. 073's open question is whether a human-shaped policy produces a case
the random sweep never does; the 56,481-row sweep was `baselineRandom` only.

### 3. Price the routes. At least these four, and any better one you find

For each: what it changes, rows and careers affected **measured** (simulate the route; do not estimate
it), draft-stock and balance-assertion impact, files touched, and whether it needs the engine freeze or
the content freeze lifted.

- **R0 — do nothing.** Price the harm honestly. This is a live answer; DECISION 071 picked the R0
  analogue once already on this board.
- **RA — gate the `stat` effect on having played.** A `stat` effect is a no-op when the season line has
  no snaps. Engine.
- **RB — a `stat` effect implies snaps.** Production carries a minimum snap count with it. Engine, and
  it invents playing time the schedule never granted — say what that costs.
- **RC — fix the authored effects.** Whatever small set §1 actually names gets its `stat` effect
  removed or paired with an authored `snaps` effect. Content, and possibly very cheap if the set is
  small.
- **RD — downstream only.** Leave the data; make the ledger, the decline and the verdict tolerant of
  the shape. UI/derivation, no freeze lifted.

**Recommend one, and name the falsifier that would change your recommendation.**

## Hard constraints — design intent, not preferences

- `overall` **is** shown as a number. `character` is **never** shown as a number, only as a band phrase.
- Never display: school tier or any badge implying it, `draftStock`, event `probability` or `weight`,
  EV, or school trait names.
- `src/engine/**` and `src/content/**` are **frozen**. You are a measurement lane: **land no change to
  either, and no change to the main tree at all.** Instrumentation lives in your detached worktree and
  is thrown away. If a route needs a permanent probe in `src/sim/`, put the **diff in the report** — do
  not land it. `src/sim/virtue-probe.ts` is owned by another agent this wave; do not touch it.
- `src/ui/session/view-model.ts` is the only module allowed to read `GameState`.
- The main tree must end this wave exactly as you found it: **727 tests green**, both `npm run
  typecheck` passes exit 0. Verify that your worktree is gone and `git status` is clean before
  reporting.

## Two process rules this board paid for. Both apply to you.

1. **When a change is supposed to move the numbers, identity is the vacuous pass.** Hunt the
   difference; if you cannot find it, the change is not doing what it says. This rule is why the last
   approved fix here was reverted.
2. **Your diagnosis is an artifact to check, exactly like a player's.** Report 048 reproduced the
   symptom exactly and named the wrong line. A mechanism inferred from reading source is a hypothesis;
   only instrumentation makes it a finding.

## REPORT

Write findings to
`docs/superpowers/polish/reports/052-which-card-hands-you-yards-in-a-season-you-never-played.md`.

Return to the PM **only**: status (done / blocked / needs-decision), **at most five bullets**, and that
path. Never the full findings. This is the single biggest lever on the PM's context size.

If you finish the work but cannot hand back cleanly, the report on disk is the deliverable — write it
before you attempt anything else.
