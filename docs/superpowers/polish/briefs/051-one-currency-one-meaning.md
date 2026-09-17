# 051 — One currency, one meaning: threshold the locker-room line, then delete the effort inversion

Repo: `/Users/tkuri/Documents/personal_projects/cfb-career-sim`
Branch: `polish/ui-phase`. HEAD at dispatch: `4076822`. Tree clean, **727 tests green**.

## Goal

Make the character currency mean exactly one thing, in two steps, measuring after each:

- **R1 (UI, ~5 lines):** stop printing a locker-room verdict for character deltas too small to matter.
- **B76 (content, ~22 effect entries):** delete the sub-3 character effects where the game pays the
  player for *doing less*.

Both are already authorised — R1 by DECISION 075, B76 by the **user** in DECISION 076. You are not
deciding whether to do them. You are doing them, in this order, and measuring whether they agree.

## Why

`cardAccount` in `src/ui/session/view-model.ts` maps **any** non-zero character delta to
`direction(character)`, so a −0.15 and a −13.4 print the identical sentence *"Cost you in the locker
room."* That line is read on 37.5% of resolved cards and means nothing on a third of them.

Worse, underneath it there is an **effort inversion**: on 22 of 34 character-differentiating cards the
character-rewarded branch is the *lower-effort* one — *"Ask for a series off"*, *"Decline and rest the
injuries"*, *"Lean on the veterans"*, *"Enjoy the trip"*. That contradicts the convention
`src/content/events/offfield.ts` states in its own header (*"the corrosive option charges character on
the branch you take; the descent is a chosen cost"*) and it points the player's moral intuition
backwards. One currency is carrying two authored meanings.

**R1 alone hides this; B76 removes it.** That is why they are one lane.

## Read first, in this order, and nothing else

1. `docs/superpowers/polish/DECISIONS.md` — entries **075** and **076**. 076 is the user's call and its
   scope is binding.
2. `docs/superpowers/polish/reports/050-can-a-player-tell-which-option-the-locker-room-is-watching.md`
   — **§3** (the bucket split), **§4** (the inversion, with 10 of the 22 tabled), **§8 R1 and R2**, and
   **Appendix A** (all 60 cards with `group` and `charSpread`).
3. `src/sim/virtue-probe.ts` — your measuring instrument. It calls `cardAccount` **directly**, so it
   measures exactly what a player reads, and R1 changes its output by construction.

Do not read the rest of the board. This brief is self-contained.

## The work, in order. Do not reorder it.

### Step 0 — baseline, before you touch anything

Run `src/sim/virtue-probe.ts` at HEAD over the `virtue` and `good` profiles, all positions, at a sample
size large enough that a ±0.1 change in mean Earned/Cost per career is outside the standard error
(047 used 3,000/cell; 049 needed 10,000 for a 0.17pp question — pick from your own SE and **state the
number you picked and why**). Record, per profile:

- realized **Earned** and **Cost** locker-room lines per career,
- mean character at career end, and mean draft stock.

Write these to the report before you edit a line. Everything after is measured against them.

### Step 1 — the census that picks the threshold. **This is the step most likely to go wrong.**

R1 thresholds **the summed character delta on the option the player actually took**. §3's buckets are
the **spread across an event's options** (`charSpread`). *These are different measures and the second
does not give you the first.* The ≈±1.5 in DECISION 075 is a suggestion derived from the wrong one —
**derive your own from the right one.**

Build a census of per-option summed character deltas across `src/content/events/**` (including deferred
and probabilistic branches — weight by outcome if the effect is on a success/failure branch, and say
which convention you used). Histogram it. Pick the threshold so that:

- the **12 moral forks** of §3 keep their line, and
- the **13 flavour nudges** lose it.

If no single threshold does both cleanly, **say so and show the overlap** rather than picking the
number that looks tidy. Report the threshold you chose, the census it came from, and what it silences.

### Step 2 — implement R1

TDD: failing test first. `src/ui/session/view-model.ts` only.

- Threshold **`lockerRoom`** only. **Do not touch `later`** (the deferred-overall line) — it is a
  different field with a different meaning and is not in scope.
- Keep the docblock honest: `lockerRoomLine`'s stated intent is what this implements, so update the
  prose to state the threshold and why it exists.
- The threshold is a named constant, not a magic number, with a one-line comment citing DECISION 075.

### Step 3 — measure R1. **Identity here is a failure, not a pass.**

Re-run Step 0's probe. Earned + Cost counts **must fall**. Report by how much, per profile, and name
the cards that went quiet. If the counts do not move, R1 is not doing what it says — **hunt the
difference before going further**, and if you cannot find it, stop and report `blocked`.

### Step 4 — implement B76

**The content freeze is lifted for this deletion and for nothing else.** No prose rewrite, no label
change, no new option, no effect added or retuned.

The set: the cards in report 050 Appendix A with `group = CONFLICT` and `charSpread < 3` (§3's mid +
flavour buckets, n = 22). Resolve each to its event id and option ids in `src/content/events/**` and
delete the `character` effect entries on those options.

Expected files: `oskill.ts`, `dskill.ts`, `ol.ts`, `dl.ts`, `k.ts`, `qb.ts`, `season-life.ts`,
`milestones.ts`.

- **`kickoff-duties-too` (`k.ts:79-121`) is mandatory.** It credits *"Ask them to find someone else for
  kickoffs"* +1 and gives *"Take both jobs and don't complain"* nothing. An authored, explicit standing
  cue pointing at the *uncredited* branch is the reductio the whole item exists for.
- **Verify orientation card by card and report it.** §4 tables 10 of the 22; the claim that all 22 are
  inverted is an extrapolation. The user's call is to delete all 22 regardless, so **delete them all** —
  but publish a per-card orientation table so we know what we deleted. If **more than three** turn out
  to reward the higher-effort/integrity branch, stop at that point and report `needs-decision`.
- `milestones.ts` was authored last wave (commit `ae03d50`, the Season Opener options). Re-derive any
  `milestone-*` card against the current file rather than trusting the report's snapshot — Appendix B
  of 050 flags exactly this.
- Schema, tests and balance assertions must all still hold. If a test asserts on a deleted effect, the
  test is describing the old currency — update it and **say which tests you changed and why**.

### Step 5 — measure B76, and run DECISION 076's stop condition

Re-run the probe a third time.

- **Non-vacuous check:** mean character per career under **`good`** must move. `good` takes the
  lower-effort branches these effects sit on; if deleting 22 of them changes nothing, you deleted the
  wrong entries. Identity is a failure.
- **Predicted, and state it before you look:** the *printed* Earned/Cost tally should move **very
  little** after Step 4, because R1 already silenced most of these. That is the expected result, not a
  null finding — B76 is a fix to the model, not to the display. Confirm or refute it explicitly.
- **STOP CONDITION (DECISION 076, the user's):** if R1 and B76 pull in **different directions** on the
  realized Earned/Cost counts, do **not** keep B76. Leave Step 2 in the tree, revert Step 4, and report
  `needs-decision` with both measurements. The two then ship in separate waves.

### Step 6 — the bonus measurement, cheap and owed

Re-run 047's source measurement (*"on 34 of 60 character-differentiating events the most-virtuous option
is strictly worse on the only visible number, by a mean 0.91 OVR"*) **with a ≥3 character floor**, on
the post-B76 corpus. DECISION 075 item 1: the 34 conflates ±1 flavour nudges with −13 moral forks and
every figure downstream inherits it. Report the floored numbers beside the originals.

## Hard constraints — design intent, not preferences

- `overall` **is** shown as a number. `character` is **never** shown as a number, only as a band phrase.
  It swings draft stock ~±7.5 against overall's ~82; an integer would overstate it tenfold.
- Never display: school tier or any badge implying it, `draftStock`, event `probability` or `weight`,
  EV, or school trait names. Traits are discovered by replaying, never stated.
- `src/engine/**` is **frozen**. `src/content/**` is frozen **except** for the B76 deletions above. If
  you believe another change is needed, write a proposal in the report; do not edit.
- `src/ui/session/view-model.ts` is the only module allowed to read `GameState`. Do not bypass that
  boundary — it is what makes the hidden-mechanics rule testable.
- **You own `src/sim/virtue-probe.ts`** if it needs to emit a finer breakdown. Another agent is running
  a measurement lane this wave from a **detached worktree pinned at `4076822`**; it touches nothing in
  the main tree and nothing in `src/sim/`. There is no file you share with it.
- **727 tests stay green.** Both `npm run typecheck` passes exit 0. Verify before reporting done.
- Aesthetic direction is fixed: dark theme, clean sans-serif, card-based, generous whitespace, minimal
  chrome, the decision and its options are the clear focal point.

## Verify before reporting

- `npm test` — 727 green (or more, with every added/changed test named in the report)
- `npm run typecheck` — **both** passes exit 0
- `npm run build`
- Click through at `localhost:5173`: play far enough to resolve several character cards and confirm the
  locker-room line now appears on the big ones and not on the noise.

## Two process rules this board paid for. Both apply to you.

1. **When a change is supposed to move the numbers, identity is the vacuous pass.** Hunt the
   difference; if you cannot find it, the change is not doing what it says. This rule reverted an
   approved engine fix last wave.
2. **Your diagnosis is an artifact to check, exactly like a player's.** Report 048 reproduced a symptom
   perfectly and named the wrong line. Measure the claim; do not infer it from reading source.

## REPORT

Write findings to `docs/superpowers/polish/reports/051-one-currency-one-meaning.md`.

Return to the PM **only**: status (done / blocked / needs-decision), **at most five bullets**, and that
path. Never the full findings. This is the single biggest lever on the PM's context size.

Use the `superpowers:test-driven-development` and `superpowers:verification-before-completion` skills.
