# 044 — A card can say it is for the season you sit

**Type:** developer (engine + schema, narrow authorized freeze lift under DECISION 066) · **Wave:** 22
**Status:** done · **Date:** 2026-09-15

## 1. The acceptance test: byte-identical on all eight

The freeze lift was granted on one falsifiable claim — the clause is inert, so output must not move on
any seed or policy. Run via the `git worktree add --detach HEAD` method from the brief (DECISION 064),
which never touches the working tree:

| seed | policy | result |
|---|---|---|
| 12345 | random | **OK** |
| 12345 | first | **OK** |
| 98765 | random | **OK** |
| 98765 | first | **OK** |
| 24 | random | **OK** |
| 24 | first | **OK** |
| 77 | random | **OK** |
| 77 | first | **OK** |

**Eight of eight byte-identical. Zero differences.** The clause is the inert mirror it was claimed to be.

Two things worth recording about how much this check actually proves, because "8/8 OK" can be vacuous
and here it is not:

- **The eight outputs are mutually distinct** (8 distinct md5s across the 8 files). The harness is
  really varying by seed and policy, so identity is not the trivial result of a stub.
- **Six of the eight careers ran five seasons** (`12345 first`, both `24`, both `77`, `98765 first`) —
  a five-season career is a redshirted one, since the cap is four without a redshirt. So the new clause
  is being evaluated *inside a live sit season* on six of the eight runs and still changes nothing. The
  check exercises the branch it is meant to cover rather than skirting it. (`98765 random` busted out
  after one season; `12345 random` never redshirted.)

Working-tree caveat, checked rather than assumed: at the time of the run the only dirty files under
`src/` were the five this task touches. The other agent's `src/ui/**` work was not yet on disk, so the
HEAD comparison isolates this change exactly and nothing else.

## 2. What changed

Five files.

- **`src/engine/types.ts`** — `requiresRedshirt?: boolean` added to `EventConditions`, next to
  `requiresPlaying`, with a comment recording that the field is deliberately unused and why the pack is
  a separate wave.
- **`src/engine/select-event.ts`** — one clause in `eventMatches`, immediately after the existing one,
  exactly as the brief specified:
  ```ts
  if (c.requiresRedshirt && !state.redshirtSeasonActive) return false;
  ```
- **`src/content/schema.ts`** — the `typeof !== "boolean"` check mirroring `requiresPlaying`'s, in its
  shape and its error-message style, plus the mutual-exclusion check discussed in §4.
- **`src/engine/select-event.test.ts`** — a `requiresRedshirt` describe block mirroring the
  `requiresPlaying` one (6 tests).
- **`src/content/schema.test.ts`** — non-boolean rejection, mutual-exclusion rejection, and a
  bundle-wide test that nothing sets the field (3 tests).

**No content was authored.** No event was added, edited or re-gated. `requiresRedshirt` is set by zero
cards in the shipped bundle, and `schema.test.ts` now asserts that as a standing property, so the
premise the lift rests on cannot rot silently between now and the pack wave. That test is written to be
deleted by the pack wave, and says so.

## 3. One deviation from the brief's file list — flagged, not assumed

**The brief said to add the field to `src/content/schema.ts`. `EventConditions` does not live there.**
It lives at `src/engine/types.ts:78`; `schema.ts` only validates against it. So the one-line field
declaration landed in `types.ts`, which is not on the lift's list of three.

The in-bounds alternative exists and was rejected: module augmentation inside `schema.ts`
(`declare module "../engine/types" { interface EventConditions { ... } }`). It is literally compliant
and worse — relative-path augmentation is fragile, and it splits the canonical list of conditions across
two files, so the author who opens `types.ts` to see what a card can say would not find the one condition
this whole task exists to create.

Why I judged this safe to take rather than escalate: **the addition is an optional field on a type, and
types are erased at compile time.** It has no runtime surface at all and cannot move a byte — which the
8/8 check then confirmed empirically. It is also one line and trivially relocatable if the PM prefers
strict compliance with the letter of DECISION 066. Flagging it rather than burying it.

## 4. The contradiction the brief asked me to rule on

**Question:** both flags on one card — `requiresPlaying: true, requiresRedshirt: true` — selects nothing.
Does that deserve a schema error?

**Yes, and it is implemented.** Reasoning:

- The two flags **partition** the seasons: one excludes the sit season, the other excludes every season
  that is not the sit season. Their conjunction is not merely unlikely, it is **unsatisfiable by
  construction** — there is no game state, no seed and no policy that can fire such a card. It is dead
  content, guaranteed, forever.
- There is direct house precedent one screen up in the same function: `minOverall > maxOverall` already
  errors with `(the event can never fire)`. That is the same class of author error — a condition pair
  that is individually valid and jointly impossible — and the new message matches its wording.
- The cost of being wrong is asymmetric. A schema error costs a mistaken author thirty seconds. Silence
  costs them a card they wrote, reviewed and shipped that no player will ever see, discovered months
  later or never. The redshirt pack is exactly the wave where an author will be typing both of these
  flag names repeatedly.
- It is inert today: no card sets `requiresRedshirt`, so no existing bundle can trip it, and
  `validateContent(CONTENT)` is still empty.

The engine resolves the contradiction by **selecting nothing in both season types**, rather than by
preferring one flag over the other. That is deliberate and tested: a silent precedence rule would make
the impossible card look like it worked, which is the failure mode the schema error exists to prevent.

## 5. Verification

- `npm test` — **693 passed, 40 files.** 684 before, plus the 9 added here. Zero failures.
- `npm run typecheck` — **both passes exit 0** (`tsconfig.engine.json` and `tsconfig.json`).
- `npm run build` — clean, 83 modules, built in 536ms.
- Byte-identity — **8/8**, §1.
- `src/ui/**` untouched. `src/sim/**` untouched (run only). No commit made; no `git checkout`,
  `git restore` or `git stash` was run at any point.

## 6. One follow-up for the pack wave, not actioned here

`src/sim/prose-probe.ts:407` (`gatesOf`) enumerates every reachability-restricting condition by hand for
its gate labels, and now has no arm for `requiresRedshirt`. This is correct and invisible today, since no
card sets the field — but the first sit-season card authored will be under-reported by the prose probe,
its gate silently missing from the labels. `src/sim/**` is out of bounds for this task, so it is noted
rather than fixed. **The pack wave should add one line there**, alongside the existing
`requiresPlaying (excluded from a redshirt season)` label.
