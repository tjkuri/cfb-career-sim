# 063 — Re-baseline the probes after Tier 1, without erasing what they recorded

**Type:** developer (measurement infrastructure) · **Wave:** 33 · **Status:** ready — dispatch now

Repo: `/Users/tkuri/Documents/personal_projects/cfb-career-sim`

**Goal:** 18 tests under `src/sim/**` are red because an approved content change landed underneath
them. Make them green **the honest way** — by recording that the corpus moved — not by deleting or
weakening assertions.

**Why:** those assertions are tripwires that were deliberately written to fail exactly now. DECISION 086
predicted this failure in advance and said the content edit and the probe assertions must move in the
same commit. **The tripwire worked. Your job is to close it correctly.**

## What changed underneath them

The user approved three content changes (**DECISION 086**) and the PM applied them:

- **Tier 1 — six edits, all to a positive branch's summed `character`:**
  | Card | Option | File | was → now |
  |---|---|---|---|
  | `wideopen-two-deep` | `bring-the-walkon-along` | `school-life.ts` | 1 → **2** |
  | `offseason-captain-vote` | `let-the-work-speak` | `season-life.ts` | 0 → **2** (effect added) |
  | `the-holding-call` | `own-it` | `ol.ts` | 1 → **2** |
  | `trash-talk` | `stay-quiet` | `dl.ts` | 1 → **2** |
  | `the-roughing-call` | `dial-it-back` | `dl.ts` | 1 → **2** |
  | `asked-to-block` | `buy-in` | `oskill.ts` | 1 → **2** |
- **B85:** `milestone-fall-camp`'s option label `"Win the job"` → `"Take every rep like it's the last one"`.
- **B90, as narrowed by the PM:** `blueblood-five-star` moves `tier: [3,4]` → `[2,3,4]` and loses its
  dead `minClass: "SO"`. **The other two blueblood events stay `[3,4]`** — widening all three made
  `index.test.ts`'s "gates content to top-tier programs" assertion fail, correctly, because it would
  have left blueblood careers with no beats of their own.

**Tier 2 was REJECTED** (DECISION 089) and **Route 3 was refuted** (DECISION 087). Nothing else moved.

## The rule that governs this whole task

**Preserve the historical figures as history; assert the new figures as current state.**

Several of these tests exist to *reproduce a past decision's numbers* — `censusCorpus reproduces
DECISION 084 at HEAD` is the clearest case. DECISION 084's census (22 credit / 48 charge / 136 silent;
27 one-way-down / 9 one-way-up; 21 at floor 1) was **true of the corpus when it was measured** and it is
the evidence base for several live decisions. **Do not overwrite those constants with new ones and leave
no trace** — that silently rewrites the board's history and a future session will cite a number that was
never measured.

Instead, for each such test: keep the DECISION 084 values as named, commented constants recording what
was measured and when, add the post-086 values as the current expectation, and **assert the delta is
exactly what the six Tier 1 edits imply** — six cards moving from one-way-down to creditable, and
nothing else. That last assertion is worth more than either number on its own, because it proves the
only thing that changed is the thing we changed.

**Forbidden, and the PM will check for each of these:**
- Deleting a failing test or its assertion.
- Loosening an exact equality into a range, a `toBeGreaterThan`, or a snapshot.
- Adding `skip`, `todo`, `only`, or commenting a test out.
- Changing an expected number without a comment saying what it was, what it is, and why it moved.

**If a test cannot be made honest** — for instance if it asserts something that is now meaningless
rather than merely different — **say so in the report and leave it failing.** A single honestly-failing
test with an explanation is a better outcome than a green suite that has stopped meaning anything.

## The four files

```
src/sim/credit-proposal-probe.test.ts   most of the failures: `from` rows, the census, the policy-flip test
src/sim/route3-rung-probe.test.ts       tier1 rows' `from`
src/sim/spared-card-probe.test.ts       two of the eleven spared cards moved (two-deep, captain-vote)
src/content/events/index.test.ts        should already be green — verify, do not change it
```

**`TIER_1` in `credit-proposal-probe.ts` is now APPLIED, not proposed.** Represent that rather than
pretending it is still a pending proposal: a row whose edit has shipped should assert the corpus carries
its `to` value, and should be marked as landed. **`TIER_2` and the unsure three are still unapplied and
their `from` assertions must keep working exactly as they do now** — they are the live tripwire for the
next change, and DECISION 089 rejected Tier 2 rather than deleting it.

## One measurement the PM actually wants from you

DECISION 086 said the probe re-runs the acceptance check on identical seeds after Tier 1 lands.
**Do it, and report three numbers:** the observed change in **draft stock for the stock-maximiser
profile**, the **`virtueLoyal` credit rate**, and the **share of `virtueLoyal` careers with ≥1 upward
rung crossing** — each before and after, on identical seeds.

Lane 061 predicted Tier 1 at **+0.071 ± 0.082 draft stock on `good` (n.s.)**, credit rate
**85.9% → 93.2%**, and **+10.4pp** of careers going from zero upward crossings to ≥1. **Say whether the
shipped change matches its prediction.** If it does not, that is the most important sentence in your
report — it would mean the corpus edit did something other than what it was approved on.

## Hard constraints

- `src/engine/**` and `src/content/**` are **frozen** — and they are now *correct*. **Do not "fix" a
  failing test by editing content back.** If you believe a content edit was applied wrongly, stop and
  report it; do not revert it.
- **`src/ui/**` is out of bounds** — another lane owns it this wave and has uncommitted work there.
- Never display rules, the `view-model.ts` boundary, and the aesthetic direction are not your concern
  this wave, but do not violate them incidentally.
- **Do not commit. Never `git checkout` / `restore` / `stash`** — the tree holds another lane's work.
- **Do not run `npm run dev`.** Keep every command under ~7 minutes; chunk long sweeps and write results
  to the report as they land. Two agents died to a 600s watchdog last wave.
- **Write your report stub as your FIRST action** and append as you go.

## Verify before reporting

- `npm test` — **all green**, or a written explanation for each test you chose to leave red.
- `npm run typecheck` — both passes exit 0.
- `npm run build` — clean.
- `git status` — nothing under `src/engine/**`, `src/content/**` or `src/ui/**`.
- **Paste into the report the diff of every expected-value change you made**, so the PM can check each
  one against the six edits without re-deriving them.

**REPORT:** write to `docs/superpowers/polish/reports/063-re-baseline-the-probes.md`.
Return to the PM **only**: status, **≤5 bullets**, and that path. Lead with whether the shipped Tier 1
matched lane 061's prediction, then anything you left failing and why.
