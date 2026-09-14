# 019 — The ending tells the truth about a bad career

**Type:** developer · **Wave:** 8 · **Status:** done
**Brief:** `briefs/019-the-ending-tells-the-truth.md` · **Implements:** DECISIONS 032, 034, 035,
governed by 012 and 026 · **Evidence:** `reports/017-post-wave6-playtest.md` claims 5, 6, 7, 8

All four tasks shipped. `npm test` **all green** and `npm run typecheck` **both passes exit 0** on
every run of this task, the last one at 545 passed / 36 files.

**On the test count:** the brief names 501; the suite read 501 when this task started, 518
mid-task and 545 at the final run. The growth is entirely the other wave-8 agent working in the
same tree (+223 lines in `ledger.test.ts`, +59 in `labels.test.ts`, plus new `policies.test.ts`
and `failure-probe.test.ts` files). **This task added no test cases** — `git diff
src/ui/session/view-model.test.ts` shows one `it(` renamed and zero added — so the 501 the brief
names is intact underneath, and nothing here is hiding inside the new total.

---

## 1. The verdict scale — measured first, then widened

### What the distribution actually says

Re-measured over **600 careers** (random policy, 100 per position across all six), reading
`draftResult` directly rather than `balance.ts`'s `round1Rate`, which is the only round figure it
reports:

| | R1 | R2 | R3 | R4 | R5 | R6 | R7 | undrafted | ended early |
|---|---|---|---|---|---|---|---|---|---|
| share | 1.8% | 5.8% | 8.3% | 16.8% | 20.0% | 24.3% | 17.2% | 4.0% | 1.7% |

**This corrects a premise in the brief.** The brief says "rounds 1–4 is where most careers land."
It is not: **R1–R4 is 32.7% and R4–R7 is 78.3%.** The modal outcome is Round 6. So "put the
resolution where the careers actually are" means putting it across the *whole drafted range*, not
concentrating it in a band at the top.

### Why the old scale failed, precisely

It was not only too narrow. **Rounds 2 and 3 were the same tier** — `data-magnitude="4"` for both —
so the pair the playtester was asked to rank was not merely close, it was byte-identical output.
Five tiers over seven rounds means two pairs of adjacent rounds print identically, and one of those
pairs (R2/R3, 14.1% of careers between them) is a pair a player will naturally compare. No spread
widening alone could have fixed that; the resolution had to go up.

### What shipped

**Eight steps, one per round plus no-call**, `VerdictMagnitude = 1..8` (8 = R1 … 2 = R7, 1 =
undrafted or a career that ended before the draft). **The spread goes 1.12 → 0.72 up to
1.34 → 0.72**, geometric at ~1.09 per step:

| step | 8 (R1) | 7 (R2) | 6 (R3) | 5 (R4) | 4 (R5) | 3 (R6) | 2 (R7) | 1 (no call) |
|---|---|---|---|---|---|---|---|---|
| scale | 1.34 | 1.23 | 1.12 | 1.03 | **0.94** | 0.86 | 0.79 | 0.72 |
| wdth | 56 | 60 | 63 | 66 | 69 | 72 | 75 | 78 |
| weight | 800 | 800 | 800 | 800 | 800 | 700 | 700 | 700 |
| opacity | 1 | 1 | 1 | 0.97 | 0.93 | 0.88 | 0.80 | 0.68 |
| rise | 19px | 16px | 13px | 11px | 9px | 7px | 5px | 3px |

Step 4 (Round 5, the modal drafted outcome) is the base declared on `.verdict-block`; the floor is
DECISION 021's exact values and does not move. **Two properties of the choice matter:**

- **Nothing above the floor got quieter.** R3 was 1.00 and is 1.12; R4–5 were 0.88 and are
  1.03/0.94; R6 was 0.80 and is 0.86. The single level step is R7 (0.80 → 0.79), which is the
  bottom of the drafted range by design. 032's falsifier — "a good career's ending got quieter as
  a side effect" — cannot fire from this change.
- **Hue is constant and verified in the live page, not asserted.** Computed `color` read off
  `.verdict` at every rendered step: `rgb(240, 180, 41)` at magnitude 8, 7, 6, 5, 3, 2 and 1
  alike. Presence drops by opacity (1 → 0.68), which is the axis 021 and 026 already chose and
  which is what the 017 playtester was reading as "duller, more olive" at Round 7 — that reading
  is the mechanism working, not a hue leak.

---

## 2. The hierarchy inverts on a declining career

`ACROSS 2 SEASONS · 63 → 59 · −4` was the only honest sentence on the page and it was 11px at the
bottom of a table. On a career whose arc is negative it now **moves into the verdict block**,
directly under the headline, set at figure size in the chalk the other numerals on the screen use.

```
ROUND 7, PICK 9        ← 26.9px gold
#201 overall
─────────────────────
OVER 2 SEASONS         ← 11px label
63 → 59  −4            ← 34px chalk, 800 weight
─────────────────────
61  FINAL OVERALL
```

- **It moved; it was not copied.** The closing `.arc-span` row is suppressed when the promoted
  element renders (`span && !decline`). Printing the same three numbers twice within one
  screen-height would be the same fact said quietly under the same fact said loudly. The seasons
  block still closes: `.arc` carries its own bottom rule, which is what the wave-6 "it ends rather
  than stops" fix actually installed.
- **Scale tracks the size of the drop**, on `deltaClass`'s existing three cuts: −1/−2 → 0.78,
  −3..−5 → 1.0, −6 or worse → 1.2 (× `--t-hero`), with weight 700/800/900. A −2 stays subordinate
  to the headline; a −12 dominates it. Measured live: −2 → 26.5px, −4 → 34px, −12 → 40.8px against
  R7's 26.9px and Undrafted's 24.5px. On the two careers the 017 playtester would recognise, the
  true thing is now the loudest thing on the screen.
- **A rising career is untouched.** The element does not exist when `net >= 0`; nothing above or
  below it moves, and the good endings render exactly as before apart from task 4's four words.
- **012 holds, verified the way 026 verified it.** Computed `color` of the promoted figure is
  `rgb(238, 243, 239)` (`--ovr`) at **every** decline magnitude — 1, 2 and 3 read identically off
  the live page. It is the same token the final overall and every season OVR beside it are set in.
  No red, no second hue, no branch flag: the two numbers it subtracts are both already on screen.

---

## 3. `Also earned` gets its heading whenever it renders

`SummaryScreen.tsx` had `distinctions.length > 0 ? "Honors" : "Also earned"` — one heading for two
groups. Now each group prints its own (`Honors` over the distinction cards, `Also earned` over the
chips) and the second one takes `.section-head.second`, a 1.5rem top gap instead of 2.6rem,
because it is a sibling tier and not a new section. Verified on a career with both
(`Conference Championship` + `All-Conference`, `Bowl Win`): the chip row now has a name. No block
was restored — the routine group still fires only on its own rarity tier — and no rarity split was
undone.

---

## 4. The two overall numbers are labelled

Four words at each number, per DECISION 035, no engine change and neither number removed:

- The verdict block's `61 FINAL OVERALL` gains a second line: **"after the off-season"**
  (sentence case, untracked, `--chalk-dim`, so it reads as a clarification rather than a second
  label).
- The seasons column head `OVR` becomes **`OVR AT SEASON'S END`**. It spans grid columns 2 to −1
  so the words fit on one line at 400px without widening the 4.2rem column the figures line up in.

The two labels answer each other: one counts the off-season that followed the last season, the
other says the column does not.

---

## The acceptance test: could I rank them without reading the digits?

Rendered pairwise in same-width iframes of the live app, seeded from headless careers, at desktop
width and at 400px.

| Pair | Verdict |
|---|---|
| **Round 2 vs Round 3** (the pair that failed) | **Yes, side by side.** 41.8px vs 38.1px, wdth 60 vs 63 — the left is plainly the bigger sentence. Honest caveat below. |
| **Round 1 vs Round 7** | Yes, trivially. |
| **Round 3 vs Round 4** | Yes, side by side; the weakest adjacent pair above the weight break. |
| **Declining (−4, R7) vs rising (+21, R3)** | **Yes, instantly, and for the right reason.** The bad one's loudest element is `63 → 59 −4`; the good one's is a gold headline. Neither is a colour. |
| **−2 vs −4 vs −12** | Yes — the three declines rank against each other by the size of the statement. |

**The caveat, stated plainly.** R2 vs R3 is now rankable *side by side*. A ~9% size step plus three
units of width is a real difference but not a loud one, and I would not claim a player could rank
two adjacent rounds *from memory*, one screen at a time. That is the honest ceiling of a scale that
has to fit seven rounds between a fixed floor and a headline that must still fit at 400px. If the
next playtester can rank R2/R3 side by side but not across two sessions, the lever left is the
width axis and the weight break (move the 800/700 break, or open wdth further at the top), not
another hue and not more size.

---

## Files touched

Only the six this brief owns: `src/ui/screens/SummaryScreen.tsx`, `src/ui/styles/summary.css`,
`src/ui/session/types.ts`, `src/ui/session/view-model.ts`, `src/ui/session/view-model.test.ts`.
`bands.ts` needed no change. Nothing in `src/engine/**`, `src/content/**`, `src/sim/**`,
`tokens.css`, `ledger.ts`, `labels.ts`, `CareerScreen.tsx` or `career.css` was edited — the other
wave-8 agent's diff in those files is untouched and both diffs coexist green.

`src/sim/balance.ts` was **run, not edited**; the round distribution above came from a throwaway
script in the scratchpad that imports `playCareer` and `randomPolicy` read-only.

---

## Proposals and notes for the PM

**1. `balance.ts` reports `round1Rate` and nothing else about rounds.** Every task that has had to
cut a scale on the draft round (016, and this one) has written its own throwaway counter. A
`roundHistogram: number[]` on `BalanceReport` would make the next such cut reproducible from
`npm run balance`. It is a `src/sim/**` change and belongs to whoever owns that file this wave —
flagged, not done.

**2. The claim behind the brief's "rounds 1–4 is where most careers land" should be retired.** The
measurement says R4–R7 is 78% and Round 6 is modal. Anything downstream that reasons about "where
careers land" should use the table in §1.

**3. Still unanswered from claim 6, and not in this brief's scope.** Two of the three things the
playtester named as congratulatory on a tanked career were the **moments reel** — `🏆 Won the
rivalry game`, `☀️ Had the time of his life at a bowl game`, the latter being the reel celebrating
the exact choice they made to sabotage themselves, in the third person on a second-person screen.
This task made the arc honest; the reel still reads as a keepsake. That is DECISION 028 item 2 and
036 territory (content strings, frozen), and it is the largest remaining piece of claim 6.

**4. Nothing was needed from `tokens.css`.** The eight-step scale, the promoted arc and both new
labels are built from existing tokens; no palette or type-scale value was adjusted or wanted.
