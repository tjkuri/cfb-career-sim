# 007 — Stop the header lying: live season state through the view-model

**Type:** developer · **Wave:** 2 · **Status:** ready

Repo: `/Users/tkuri/Documents/personal_projects/cfb-career-sim`

## Goal

Make `CareerView` carry the season state the player is actually owed, and stop it reporting a record
that does not exist. **This task is data only — `src/ui/session/**` and its tests. You write no CSS
and you touch no screen component.**

## Why

A playtester played three careers and ranked this first:

> *"The header said `0-0` for my entire quarterback career. At the draft screen it told me I had gone
> 5-7, 3-9, 5-7 and thrown 16 TDs to 16 picks. I played three losing seasons and did not know."*

They also reported the header **changing shape between cards** (record present, then absent) and the
class badge **flipping mid-card** — the FR→SO rollover happening while they were reading the outcome
text of the *previous* season's last event.

Read `docs/superpowers/polish/DECISIONS.md` **014** before you start. The short version, verified in
source: `0-0` is not a display bug. `simulateTeamRecord` runs **once, at the end of the postseason
phase** (`src/engine/postseason.ts:69-73`); `SeasonLine` is pushed with zeros at `advance.ts:276` and
stays that way all season. **The record genuinely does not exist yet.** Snaps and stats *do*
accumulate live (`effects.ts:36,41`, `simulate.ts:27`). Your job is to surface what is real and stop
presenting what is not.

## What to build

1. **An honest record.** `currentRecord` (`view-model.ts:38-42`) returns `"0-0"` for an unsimulated
   season. Distinguish *no record yet* from *a real 0-0*. Return `null` until the postseason resolver
   has run, so a consumer cannot render a fictional record. Do not fabricate, estimate or hide it
   behind a placeholder string.
2. **A live season line.** Add the in-season stat line and snaps to `CareerView` — the numbers the
   summary already shows after the fact, available *during* the season. Use the existing
   position-aware label layer in `src/ui/session/labels.ts`; do not build a second one, and remember
   `ints` means opposite things by position.
3. **Where in the season.** `GameState.phase` is `offseason | nonconf | conference | postseason` and
   the UI surfaces none of it. Put a display-ready phase label on `CareerView`. **Name the field
   carefully:** `phaseAbs` is in `FORBIDDEN_KEYS` (`view-model.test.ts:24`) and the boundary test
   walks the view by key name — do not name anything `phaseAbs`.
4. **Freeze the header against the card it belongs to.** A resolved outcome must render with the
   season state that was true *when the choice was made*, not the state the engine has since advanced
   into. Investigate first and report what you find: this may live in the `resolved` block
   (`session/types.ts:7-11`) rather than in the view-model. **If the fix turns out to need a screen
   component, do not make it — write it up as a finding for the next brief.**

## Out of bounds

- **`src/ui/styles/**` — a concurrent task owns the entire stylesheet and is splitting it into six
  files. Do not open it.**
- **`src/ui/screens/*.tsx` — not yours.** You are changing what data is available, not what is drawn.
  It is expected and fine that nothing looks different when you are done.
- **`src/engine/**` and `src/content/**` — frozen.** A concurrent task owns one approved, additive
  engine change (`SeasonLine` gains `overall` and `classYear`). Do not touch any engine file, and do
  not depend on those two fields — assume they are not there yet.
- Do **not** make the record accrue during the season. That is DECISION 014's explicitly untaken
  engine change: it would move the RNG draw order and every existing seed would diverge.

## Hard constraints

- `overall` **is** shown as a number. `character` is **never** shown as a number, only as a band
  phrase — it swings draft stock ~±7.5 against overall's ~82; an integer would overstate it tenfold.
- Never display: school tier or any badge implying it, `draftStock`, event `probability` or `weight`,
  EV, or school trait names. Traits are meant to be discovered by replaying, never stated.
- **`src/ui/session/view-model.ts` is the only module allowed to read `GameState`.** That boundary is
  what makes the hidden-mechanics rule testable — this task lives inside it, and every field you add
  goes through it, never around it.
- No colour, icon or emphasis derived from an outcome's positive/negative branch (DECISION 006/012).
  Not your layer, but do not add a field that would invite one — no `isGood`, no `delta` sign flag
  exposed as valence.
- Plain CSS, no Tailwind, no CSS-in-JS, no new dependency.

## Verify before reporting

- `npm test` — **430 green**, plus new tests for what you added.
- **Extend `view-model.test.ts`:** every new field is asserted absent from `FORBIDDEN_KEYS`, a
  no-record-yet season returns `null` rather than `"0-0"`, and the stat line is position-aware.
- `npm run typecheck` — **both passes exit 0.**
- `npm run build` — clean.
- A dev server may already be running on 5173. **Never run `npm run dev` in the foreground; it does
  not exit.** If a tool call fails 3 times, stop that line of attack and report.

## Do not commit

Leave your work in the working tree. The user has not asked for commits and the PM is not making them
on their behalf. Do not run `git commit`, `git checkout`, `git restore` or `git stash` — the tree
holds verified uncommitted work from a concurrent CSS task. Reverting anything would destroy it.

## Report

Write to `docs/superpowers/polish/reports/007-honest-season-state.md`: the final `CareerView` shape,
what you found on item 4 (the mid-card rollover) and whether it needs a screen change, and any field
you considered and rejected on the hidden-mechanics rule.

**Return to the PM only:** status (done / blocked / needs-decision), at most five bullets, and the
report path. Nothing else — the PM is deliberately keeping its context small.
