# 006 — `SeasonLine` gains `overall` and `classYear` (approved engine change)

**Type:** developer · **Wave:** 2 · **Status:** ready

Repo: `/Users/tkuri/Documents/personal_projects/cfb-career-sim`

## Goal

Add two fields to `SeasonLine` in `src/engine/types.ts` and populate them at the write sites that
already exist. Nothing else.

```
overall: number        // the player's OVR at the point the season line is finalized
classYear: ClassYear   // the class year that season was played as
```

## Why this is authorized

`src/engine/**` is frozen and normally an agent may only write a proposal. **This change is already
approved — see `docs/superpowers/polish/DECISIONS.md` DECISION 009.** Read it before you start; it
is the authorization and it sets the conditions you are verified against.

The short version: the UI is building an always-visible career ledger (DECISION 007). `SeasonLine`
records no OVR, so the career arc — a column of numbers going 50 → 82 → 66, the single most valuable
read in the reference game — cannot be reconstructed from current state. And `classYear` is advanced
on every season boundary including redshirt years, so a redshirted career labels its rows
**FR, SO, JR, SR, SR**. Past class years are stored nowhere.

**This is the only engine change authorized.** If you find yourself wanting a second one, stop and
report `needs-decision`.

## Where

`docs/superpowers/polish/reports/004-current-ui-audit.md` §4 and its P1 proposal have the analysis and
the line numbers. The write sites:

- `src/engine/types.ts:24-31` — the `SeasonLine` interface.
- `src/engine/advance.ts:274` — where season lines are pushed.
- `src/engine/advance.ts:194-202` — `enterOffseason`, the development step, where OVR for the
  completed season is already in hand.
- `src/engine/advance.ts:221-225` — where `classYear` and `yearsUsed` advance. Take care to record
  the year the season was *played as*, not the year the player is being advanced *into*. Getting this
  off by one is the most likely bug in this task and it will not fail a test that exists today.

`create-career.ts` should need no change — lines are pushed in `advance.ts`. Confirm that rather than
assuming it.

## Hard constraints

- **Additive only.** No behaviour change. No public-API change — the engine's API stays at five
  exports. You are recording values the engine has already computed; nothing is recalculated,
  reordered, or re-rolled. Do not touch the RNG, its cursor, or the order of any draw.
- `src/content/**` stays frozen — this task has no reason to go near it.
- **Do not touch `src/ui/**`.** A concurrent task owns the stylesheet, and the view-model work that
  consumes these fields is a later brief. Your change is engine-only.
- `overall` is shown to the player as a number and that is fine. `character` is **never** shown as a
  number — do not add it to `SeasonLine`, even though it would be symmetrical. It swings draft stock
  ~±7.5 against overall's ~82; storing it per season invites a UI that renders it.
- Never expose: school tier, `draftStock`, event `probability` or `weight`, EV, or trait names.

## Verify before reporting — condition 2 is the one that matters

1. **`npm run play -- <seed> random` must produce byte-identical JSON before and after, for the same
   seed, apart from the two new fields.** Run it on **three different seeds**. Capture output before
   your change, apply the change, capture again, diff. **Paste the diffs into your report.** If any
   seed's simulation output moves — any stat, any outcome, any ordering — **stop and report
   `blocked`**: the change was not additive and something re-rolled.
2. `npm test` — **430 green.** Engine tests that assert `SeasonLine`'s shape get updated
   deliberately, with the update explained in your report. **Do not delete a failing test.**
3. `npm run typecheck` — **both passes exit 0.** Pass 1 (`tsconfig.engine.json`) is the one pinned to
   `src/engine/**`; it is the pass most likely to catch a mistake here.
4. **Old saves must not crash.** `localStorage` holds a serialized `GameState`; saves written before
   this change have `SeasonLine`s with no `overall` and no `classYear`. Confirm that loading such a
   save still works and is not discarded by `src/ui/session/storage.ts`. You may *read* the UI to
   check this — you may not edit it. If tolerating old saves requires a UI change, report it as a
   finding for the ledger brief rather than making it.
5. `npm run build` — clean.

A dev server may already be running on 5173. **Never run `npm run dev` in the foreground; it does not
exit.** If a tool call fails 3 times, stop that line of attack and report.

## Do not commit

Leave your work in the working tree. The user has not asked for commits and the PM is not making them
on their behalf. Do not run `git commit`, `git checkout`, `git restore` or `git stash` — the tree
holds verified uncommitted work from a concurrent CSS task. Reverting anything would destroy it.

## Report

Write to `docs/superpowers/polish/reports/006-engine-seasonline-fields.md`: the diff, the three-seed
byte-identical proof, which tests you updated and why, and the answer to the old-save question.

**Return to the PM only:** status (done / blocked / needs-decision), at most five bullets, and the
report path. Nothing else — the PM is deliberately keeping its context small.
