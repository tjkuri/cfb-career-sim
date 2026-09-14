# 022 — Engine stage 2: the approved changes, implemented exactly as measured

**Type:** developer · **Wave:** 9 · **Status:** ready
**Repo:** `/Users/tkuri/Documents/personal_projects/cfb-career-sim`

## Goal

Implement three engine changes the user has explicitly approved. **Every number below is already
decided.** You are not re-deriving them, and you are not improving on them.

## Why this brief is unusually prescriptive

`src/engine/**` has been frozen for this entire phase. It is unfrozen for exactly these three
changes, on the strength of a measurement report the user read and approved. Read
`docs/superpowers/polish/DECISIONS.md` entries **029**, **038** and **039** first, then
`reports/018-failure-and-the-offseason.md` §2.5 and §4 item 1, and `reports/020-the-ledger-keeps-its-promise.md`
final section.

**If you believe one of these numbers is wrong, stop and report `needs-decision`. Do not adjust it.**
The measurement behind it is 3,000 careers per row and the user assented to a design statement, not
just a value.

## Change 1 — `EARLY_DECLARE_PENALTY = 8`

| | |
|---|---|
| **Where** | `src/engine/draft.ts`, inside `computeDraftResult` **only** |
| **Today** | `const stock = deriveDraftStock(state);` (line 33) |
| **Proposed** | `export const EARLY_DECLARE_PENALTY = 8;` and `const stock = Math.max(0, deriveDraftStock(state) - (state.eligibility.classYear === "SR" ? 0 : EARLY_DECLARE_PENALTY));` |
| **Untouched** | `UNDRAFTED_FLOOR` stays 35. The `9.3` band divisor stays 9.3. **`deriveDraftStock` stays byte-identical.** |

**The placement is a hard constraint, not a style preference.** `deriveDraftStock` also feeds
`eligibleTiers`, which generates Signing Day and transfer offers. The tier thresholds are 25/45/70,
so an 8-point shift inside the shared function would silently move players across them and change
the offer ladder for every junior in the game. That is a different change with side effects nobody
has measured.

## Change 2 — `SeasonLine` gains an explicit redshirt flag

One additive boolean, written at the site where the engine already knows the fact. The same shape as
DECISION 009, which put `overall` and `classYear` on this exact type — **read how 009 was done and
match it**, including its treatment of saves written before the field existed.

The UI half is **not** in this brief. Do not touch `src/ui/**`. Specifically, `classYearLabel` must
stay derived from sequence — a fifth-year senior is a fifth-year senior however the fifth year was
earned (DECISION 039).

## Change 3 — the `FG -1` floor

`src/engine/effects.ts` (around lines 34-37) applies an authored `stat` effect with no lower bound.
A redshirt season's `sitSnapModifier: 0.05` rounds every generated stat to 0, so an authored `-1`
yields `-1`. Measured: 6 careers in 1,500, all six redshirted. Clamp at zero.

Check whether any other effect kind can go negative the same way and **report** what you find; fix
only this one unless another is provably the same bug.

## Verification — this is the part that matters

The report pre-specified the acceptance test, because the whole risk of change 1 is that it leaks
into the offer generator:

```
npx tsx src/sim/failure-probe.ts 3000 all QB
npx tsx src/sim/balance.ts 3000 random all
```

**Every full-eligibility profile must come back bit-identical** — `good`, `goodStay`, `randomFull`,
`longStay`, `lazyFull`, `antisocialFull`, to four decimal places on every metric, and round-1 rates
unchanged for *everyone*. Report 018 §4 item 1 has the table to check against. **If any of those
rows moves, the penalty has leaked and the change is wrong.**

Expected to move, and only these: `baselineRandom` picked 0.945 → 0.864, `goodEarly` 0.952 → 0.765,
`randomEarly` 0.914 → 0.739, `antisocialEarly` 0.960 → 0.808, `lazyEarly` **0.892 → 0.563**.

Then: `npm test` and `npm run typecheck` (**two** passes, both exit 0). Existing tests that assert a
draft result for an early declarer will legitimately change — when you change one, say in the commit
or report **which behaviour it was pinning and why the new value is right.** Do not simply update
numbers until the suite goes green.

## Files

**You own:** `src/engine/**`, `src/sim/**`, and their tests.
**Out of bounds — another agent owns these in this same wave:** all of `src/ui/**`.
Also out of bounds: `src/content/**` (still frozen), and `docs/superpowers/polish/STATE.md` and
`DECISIONS.md`.

Note: a UI agent is working concurrently. If a UI test breaks because of your engine change, **say
so in your report and leave it** — do not reach into their files.

## Constraints (hard — design intent, not preferences)

- `overall` **is** shown as a number. `character` is **never** shown as a number, only as a band
  phrase. It swings draft stock ~±7.5 against overall's ~82.
- Never display: school tier or any badge implying it, `draftStock`, event `probability` or
  `weight`, EV, or school trait names.
- `src/ui/session/view-model.ts` is the only module allowed to read `GameState`.
- Aesthetic direction is fixed: dark theme, clean sans-serif, card-based, generous whitespace,
  minimal chrome.
- Never run a foreground command that does not terminate on its own.

## Report

Write to `docs/superpowers/polish/reports/022-engine-stage-two.md`, leading with the bit-identity
check: the full-eligibility table, before and after, and an explicit statement of whether it held.
Return to the PM **only**: status, **at most five bullets**, and that path.
