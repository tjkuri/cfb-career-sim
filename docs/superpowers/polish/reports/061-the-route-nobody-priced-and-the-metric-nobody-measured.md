# 061 — The route nobody priced, and the metric nobody measured

**Brief:** `briefs/061-the-route-nobody-priced-and-the-metric-nobody-measured.md` · **Wave:** 32 ·
**Type:** measurement + proposal · **Product code shipped:** none. Two new files under `src/sim/`, plus
this report. **Prices:** Route 3, Tier 2 + Route 3, Tier 1, HEAD. **Answers:** DECISION 085's open
clause. **Corrects:** report 059 §5.5 and DECISION 084's reading of the five openers.

---

## 0. The one paragraph

**The acceptance question's answer is NO, and the interesting part is which clause fails.** Tier 2 *does*
take the median `virtueLoyal` career from zero upward rung crossings to one — 19.6% → **52.1% ± 1.8pp**
of careers cross up, the first direct answer this board has to DECISION 085's open clause — but it fails
the `good` clause on both halves, moving `good`'s draft stock **+0.472 ± 0.079** and its credit rate to
**100.0%**. It fails for a reason table F makes unarguable: **at HEAD `virtueLoyal`, `virtueAmbitious`
and `good` all take `stay-within` ~3.99 times per career and `handle-it` exactly 0.000 times**, so any
credit on `stay-within` is paid to the virtuous player and the stock-maximiser in full. **Route 3 is
refuted and the wave-26 objection survives DECISION 074 intact:** the openers author only `+1` and `−2`,
the display floor is 2, so deleting the `−2` leaves **0.0% of careers reading any opener character line,
for every profile** — and worse, deleting it re-prices `handle-it` above `stay-within` for the stock
scorer (E[stock] 0.019 → **0.094** vs 0.040), so Route 3 hands `good` **+0.852 ± 0.153** draft stock —
the largest gain on the table — while costing **13.3%** of `good` careers an upward crossing. **Two
things the board did not know.** First, **DECISION 074 already fixed the opener tax**: the `−2` reaches
**0.0%** of deliberate careers, so report 047's *"40% of every character point a virtuous career loses"*
expired when the second option landed, and DECISION 084's *"charge −2 and can never credit"* describes a
card whose charge cannot land. Second, **the brief's fallback names the wrong change** — DECISION 081's
`80/67` moves the *second* floor and shifts `virtueLoyal`'s zero-up share only 80.4% → 78.8%; the top
floor would have to reach ~76 to move the median, which puts the stock-maximiser on the top rung in
**22.9%** of careers against 2.7% today. **So neither lever works, and §5.3 says why: the median
virtuous career finishes on 75 and the median stock-maximiser on 71 — a 4-point separation on a ladder
whose rungs are 14 points apart.** Recommendation: **approve Tier 1** (the only arm whose cost to the
stock-maximiser is n.s.), **reject Route 3 and Tier 2 + Route 3**, leave Tier 2 as the user's yes/no —
and hear §6.1, which is now stronger than the case for Tier 1. **Every figure here is OBSERVED, not
modelled**, because the engine takes its content as a call-time parameter; report 059's limitations 1, 2
and 3 are closed rather than restated.

---

---

## 1. Both predictions resolved before any sweep ran, and both refute the brief

### 1.1 Prediction 1 — CONFIRMED. Route 3 flips the stock-maximiser off `stay-within`

`openerPicks()` in `src/sim/route3-rung-probe.ts` asks the real `best` and `virtue` scorers what they
pick on each opener, **against the patched bundle for each arm**. Per-arm option economics for
`milestone-opener-first` (identical on all five — the cards are mechanically identical by acceptance
criterion, asserted in `milestones.test.ts`):

| Arm | `handle-it` char +/− | `handle-it` E[stock] | `stay-within` char +/− | `stay-within` E[stock] | `best` takes | `virtue` takes |
|---|---|---|---|---|---|---|
| **HEAD** | 0 / **−2** | 0.01875 | **+1** / 0 | **0.04000** | `stay-within` | `stay-within` |
| **Tier 1** | 0 / −2 | 0.01875 | +1 / 0 | **0.04000** | `stay-within` | `stay-within` |
| **Tier 2** | 0 / −2 | 0.01875 | **+2** / 0 | **0.17500** | `stay-within` | `stay-within` |
| **Route 3** | 0 / **0** | **0.09375** | +1 / 0 | 0.04000 | **`handle-it`** | `stay-within` |
| **Tier 2 + Route 3** | 0 / 0 | 0.09375 | +2 / 0 | **0.17500** | `stay-within` | `stay-within` |

**Deleting the −2 takes `handle-it`'s expected draft stock from 0.019 to 0.094 — against
`stay-within`'s 0.040 — so the stock-maximiser stops taking `stay-within` entirely.** The −2 was the
only thing making `stay-within` the stock-optimal pick. Report 059 §5.4 measured that the `good`
profile takes `stay-within` ~90% of the time and named it as the whole source of Tier 2's cost to
`good`; **Route 3 removes that behaviour rather than repricing it.**

This is report 059's limitation 3 — "a policy that chooses differently once the effect changes" —
firing on the very route 059 proposed as the cleaner alternative, and 059 could not have seen it
because its harness could not put the edit in the bundle. `virtue` does **not** flip (E[char] 0.900 vs
0.000), which matters for §3.

### 1.2 Prediction 2 — CONFIRMED from the corpus and the floor constant alone

`LOCKER_ROOM_MIN_CHARACTER = 2` (`view-model.ts:293`). The five openers author exactly two `character`
magnitudes between them: **`+1`** on `stay-within`'s success and **`−2`** on `handle-it`'s failure.
Nothing else on any of the five branches carries `character` at all.

**Route 3 deletes the −2. The only surviving opener `character` magnitude is +1, which is below the
display floor. So under Route 3 the openers print NO locker-room line to ANY player, on either
branch, in 100% of careers — not "almost none", exactly none, by construction.**

This is decidable without a single career and the sweep below confirms it as an identity
(`openerAnyLineRate = 0.000` in every Route-3 cell). **The wave-26 R3 objection therefore survives
DECISION 074 intact.** The PM's reading was that DECISION 074's `+1` means the card "still says
something"; it does not, because `+1` has never been sayable. DECISION 074 added a *branch*, not a
*line*. Wave 26's phrase — deleting the effect *"costs the openers the only thing they say"* — is
still literally true, and the `+1` the PM took as the counter-argument is exactly the kind of
sub-floor value report 059 §4.1 argument 1 described as *"not unrewarded, unreadable."*

**Corollary, and it is the reason `tier2plusRoute3` is in the table.** Tier 2 + Route 3 leaves `+2`
as the only opener magnitude — readable, but with no chargeable branch left. That makes all five
openers **one-way-UP cards**, which is the mirror defect DECISION 085 explicitly refused when it
dropped report 057's `playing-through-the-hand` row. The combined route fixes the asymmetry by
inverting it.

---

## 2. The five-arm table — all figures OBSERVED

`src/sim/route3-rung-probe.ts`, **3,000 careers per profile per arm** (500 per position × 6 positions),
seed prefix `b61`, `homeState` fixed at `TX` as in every probe in this directory. Five arms, not four:
HEAD, Tier 1, Tier 2, Route 3 and **Tier 2 + Route 3**, which the brief asked for separately.

**Every figure below was produced by a career the engine actually played against a bundle with the edit
in it.** No delta is modelled. `patchContent()` builds a copy of the content bundle with the arm's edits
applied and hands it to `createCareer` / `getDecision` / `advance` **and** to `makePolicy`, so the
`maxCharacter` gates re-evaluate and the policies re-select on their own. `src/content/**` is never
written, and a test asserts `CONTENT` is byte-identical after every arm has been patched.

Intervals are 95% (1.96 × SE). `n.s.` means the difference is smaller than its interval and this report
does not call it a difference.

### A. Draft stock, undrafted, bust

| Profile | Arm | draft stock (95% CI) | Δ vs HEAD | undrafted | bust |
|---|---|---|---|---|---|
| `virtueLoyal` | HEAD | 79.53 ± 0.44 | — | 1.3% ± 0.4pp | 0.6% ± 0.3pp |
|  | Tier 1 | 79.67 ± 0.44 | +0.136 ± 0.626 (n.s.) | 1.2% ± 0.4pp | 0.6% ± 0.3pp |
|  | Tier 2 | 80.06 ± 0.44 | +0.526 ± 0.625 (n.s.) | 1.1% ± 0.4pp | 0.7% ± 0.3pp |
|  | Route 3 | 79.53 ± 0.44 | +0.000 ± 0.626 (n.s.) | 1.3% ± 0.4pp | 0.6% ± 0.3pp |
|  | T2+R3 | 80.06 ± 0.44 | +0.526 ± 0.625 (n.s.) | 1.1% ± 0.4pp | 0.7% ± 0.3pp |
| `virtueAmbitious` | HEAD | 82.09 ± 0.46 | — | 1.0% ± 0.4pp | 0.5% ± 0.3pp |
|  | Tier 1 | 82.27 ± 0.46 | +0.173 ± 0.644 (n.s.) | 1.0% ± 0.4pp | 0.5% ± 0.3pp |
|  | Tier 2 | 82.55 ± 0.45 | +0.455 ± 0.643 (n.s.) | 0.8% ± 0.3pp | 0.5% ± 0.3pp |
|  | Route 3 | 82.09 ± 0.46 | +0.000 ± 0.645 (n.s.) | 1.0% ± 0.4pp | 0.5% ± 0.3pp |
|  | T2+R3 | 82.55 ± 0.45 | +0.455 ± 0.643 (n.s.) | 0.8% ± 0.3pp | 0.5% ± 0.3pp |
| `good` | HEAD | 83.23 ± 0.45 | — | 0.8% ± 0.3pp | 0.6% ± 0.3pp |
|  | Tier 1 | 83.30 ± 0.45 | +0.071 ± 0.634 (n.s.) | 0.7% ± 0.3pp | 0.5% ± 0.3pp |
|  | Tier 2 | 83.70 ± 0.45 | +0.472 ± 0.633 (n.s.) | 0.7% ± 0.3pp | 0.6% ± 0.3pp |
|  | Route 3 | 84.08 ± 0.45 | **+0.852 ± 0.632** | 0.8% ± 0.3pp | 0.5% ± 0.3pp |
|  | T2+R3 | 83.70 ± 0.45 | +0.472 ± 0.633 (n.s.) | 0.7% ± 0.3pp | 0.6% ± 0.3pp |
| `baselineRandom` | HEAD | 70.06 ± 0.49 | — | 7.1% ± 0.9pp | 4.9% ± 0.8pp |
|  | Tier 1 | 70.18 ± 0.49 | +0.113 ± 0.693 (n.s.) | 7.1% ± 0.9pp | 4.8% ± 0.8pp |
|  | Tier 2 | 70.47 ± 0.49 | +0.404 ± 0.691 (n.s.) | 6.7% ± 0.9pp | 4.5% ± 0.7pp |
|  | Route 3 | 70.27 ± 0.49 | +0.211 ± 0.694 (n.s.) | 7.1% ± 0.9pp | 4.7% ± 0.8pp |
|  | T2+R3 | 70.70 ± 0.49 | +0.638 ± 0.693 (n.s.) | 6.8% ± 0.9pp | 4.3% ± 0.7pp |


**Why these intervals are so wide, and the fix.** An observed arm is not a paired sample: once a policy
picks differently or a `maxCharacter` gate flips, the RNG stream diverges and the two careers stop
being the same career. An unpaired two-sample interval on draft stock is ±0.6, which is wider than
every effect on this board — it would report "no difference" for everything and discriminate nothing.
**§2.1 pairs on the SEED instead**, which recovers the precision without claiming a paired career.

### B. Lines the player reads

| Profile | Arm | credit lines mean (CI) | p50 | credit rate | charge lines mean (CI) | p50 | opener line rate |
|---|---|---|---|---|---|---|---|
| `virtueLoyal` | HEAD | 1.794 ± 0.044 | 2 | 85.9% ± 1.2pp | 0.729 ± 0.030 | 1 | 0.0% ± 0.0pp |
|  | Tier 1 | 2.463 ± 0.050 | 2 | 93.2% ± 0.9pp | 0.729 ± 0.030 | 1 | 0.0% ± 0.0pp |
|  | Tier 2 | 5.390 ± 0.049 | 5 | 100.0% ± 0.0pp | 0.728 ± 0.030 | 1 | 100.0% ± 0.0pp |
|  | Route 3 | 1.794 ± 0.044 | 2 | 85.9% ± 1.2pp | 0.729 ± 0.030 | 1 | 0.0% ± 0.0pp |
|  | T2+R3 | 5.390 ± 0.049 | 5 | 100.0% ± 0.0pp | 0.728 ± 0.030 | 1 | 100.0% ± 0.0pp |
| `virtueAmbitious` | HEAD | 2.377 ± 0.051 | 2 | 92.3% ± 1.0pp | 0.901 ± 0.033 | 1 | 0.0% ± 0.0pp |
|  | Tier 1 | 3.070 ± 0.058 | 3 | 96.2% ± 0.7pp | 0.901 ± 0.033 | 1 | 0.0% ± 0.0pp |
|  | Tier 2 | 5.962 ± 0.056 | 6 | 100.0% ± 0.0pp | 0.898 ± 0.033 | 1 | 100.0% ± 0.1pp |
|  | Route 3 | 2.377 ± 0.051 | 2 | 92.3% ± 1.0pp | 0.901 ± 0.033 | 1 | 0.0% ± 0.0pp |
|  | T2+R3 | 5.962 ± 0.056 | 6 | 100.0% ± 0.0pp | 0.898 ± 0.033 | 1 | 100.0% ± 0.1pp |
| `good` | HEAD | 1.211 ± 0.036 | 1 | 73.1% ± 1.6pp | 1.544 ± 0.043 | 1 | 0.0% ± 0.0pp |
|  | Tier 1 | 1.408 ± 0.040 | 1 | 77.4% ± 1.5pp | 1.521 ± 0.043 | 1 | 0.0% ± 0.0pp |
|  | Tier 2 | 4.795 ± 0.043 | 5 | 100.0% ± 0.0pp | 1.536 ± 0.043 | 1 | 100.0% ± 0.1pp |
|  | Route 3 | 1.218 ± 0.037 | 1 | 73.3% ± 1.6pp | 1.555 ± 0.044 | 1 | 0.0% ± 0.0pp |
|  | T2+R3 | 4.795 ± 0.043 | 5 | 100.0% ± 0.0pp | 1.536 ± 0.043 | 1 | 100.0% ± 0.1pp |
| `baselineRandom` | HEAD | 1.437 ± 0.040 | 1 | 78.8% ± 1.5pp | 7.539 ± 0.092 | 7 | 42.0% ± 1.8pp |
|  | Tier 1 | 1.753 ± 0.044 | 2 | 85.0% ± 1.3pp | 7.526 ± 0.092 | 7 | 42.1% ± 1.8pp |
|  | Tier 2 | 3.199 ± 0.054 | 3 | 97.8% ± 0.5pp | 7.516 ± 0.092 | 7 | 96.8% ± 0.6pp |
|  | Route 3 | 1.424 ± 0.040 | 1 | 78.6% ± 1.5pp | 6.998 ± 0.088 | 7 | 0.0% ± 0.0pp |
|  | T2+R3 | 3.182 ± 0.054 | 3 | 97.9% ± 0.5pp | 6.985 ± 0.088 | 7 | 89.9% ± 1.1pp |

### C. RUNG CROSSINGS — the metric

| Profile | Arm | UP mean (CI) | up p50 | up p90 | **zero-up share** | DOWN mean (CI) | down p50 | down p90 | zero-down share |
|---|---|---|---|---|---|---|---|---|---|
| `virtueLoyal` | HEAD | 0.203 ± 0.015 | 0 | 1 | **80.4% ± 1.4pp** | 0.091 ± 0.012 | 0 | 0 | 92.0% ± 1.0pp |
|  | Tier 1 | 0.311 ± 0.018 | 0 | 1 | **70.4% ± 1.6pp** | 0.101 ± 0.012 | 0 | 0 | 90.9% ± 1.0pp |
|  | Tier 2 | 0.558 ± 0.020 | 1 | 1 | **47.9% ± 1.8pp** | 0.107 ± 0.012 | 0 | 1 | 90.0% ± 1.1pp |
|  | Route 3 | 0.203 ± 0.015 | 0 | 1 | **80.4% ± 1.4pp** | 0.091 ± 0.012 | 0 | 0 | 92.0% ± 1.0pp |
|  | T2+R3 | 0.558 ± 0.020 | 1 | 1 | **47.9% ± 1.8pp** | 0.107 ± 0.012 | 0 | 1 | 90.0% ± 1.1pp |
| `virtueAmbitious` | HEAD | 0.311 ± 0.018 | 0 | 1 | **71.2% ± 1.6pp** | 0.156 ± 0.016 | 0 | 1 | 87.1% ± 1.2pp |
|  | Tier 1 | 0.402 ± 0.020 | 0 | 1 | **62.6% ± 1.7pp** | 0.162 ± 0.016 | 0 | 1 | 86.0% ± 1.2pp |
|  | Tier 2 | 0.630 ± 0.021 | 1 | 1 | **41.9% ± 1.8pp** | 0.159 ± 0.015 | 0 | 1 | 85.7% ± 1.3pp |
|  | Route 3 | 0.311 ± 0.018 | 0 | 1 | **71.2% ± 1.6pp** | 0.156 ± 0.016 | 0 | 1 | 87.1% ± 1.2pp |
|  | T2+R3 | 0.630 ± 0.021 | 1 | 1 | **41.9% ± 1.8pp** | 0.159 ± 0.015 | 0 | 1 | 85.7% ± 1.3pp |
| `good` | HEAD | 0.228 ± 0.018 | 0 | 1 | **80.2% ± 1.4pp** | 0.382 ± 0.024 | 0 | 1 | 71.1% ± 1.6pp |
|  | Tier 1 | 0.241 ± 0.018 | 0 | 1 | **79.1% ± 1.5pp** | 0.374 ± 0.024 | 0 | 1 | 71.5% ± 1.6pp |
|  | Tier 2 | 0.360 ± 0.020 | 0 | 1 | **68.3% ± 1.7pp** | 0.282 ± 0.021 | 0 | 1 | 77.6% ± 1.5pp |
|  | Route 3 | 0.142 ± 0.013 | 0 | 1 | **86.8% ± 1.2pp** | 0.524 ± 0.023 | 0 | 1 | 55.5% ± 1.8pp |
|  | T2+R3 | 0.360 ± 0.020 | 0 | 1 | **68.3% ± 1.7pp** | 0.282 ± 0.021 | 0 | 1 | 77.6% ± 1.5pp |
| `baselineRandom` | HEAD | 0.372 ± 0.021 | 0 | 1 | **68.2% ± 1.7pp** | 2.051 ± 0.033 | 2 | 3 | 2.2% ± 0.5pp |
|  | Tier 1 | 0.393 ± 0.022 | 0 | 1 | **66.3% ± 1.7pp** | 2.050 ± 0.033 | 2 | 3 | 2.4% ± 0.5pp |
|  | Tier 2 | 0.424 ± 0.023 | 0 | 1 | **64.7% ± 1.7pp** | 2.016 ± 0.034 | 2 | 3 | 3.1% ± 0.6pp |
|  | Route 3 | 0.357 ± 0.021 | 0 | 1 | **69.0% ± 1.7pp** | 1.984 ± 0.033 | 2 | 3 | 2.6% ± 0.6pp |
|  | T2+R3 | 0.433 ± 0.023 | 0 | 1 | **64.4% ± 1.7pp** | 1.964 ± 0.034 | 2 | 3 | 3.8% ± 0.7pp |

### D. Where the ladder starts and ends, and when it first moves

| Profile | Arm | start rung occupancy (0=top) | end rung occupancy | ever top | 1st UP at (median) | 1st DOWN at (median) | first move down |
|---|---|---|---|---|---|---|---|
| `virtueLoyal` | HEAD | 0.0% / 100.0% / 0.0% / 0.0% / 0.0% | 13.1% / 85.0% / 1.9% / 0.0% / 0.0% | 14.6% | 32 | 16 | 30.1% |
|  | Tier 1 | 0.0% / 100.0% / 0.0% / 0.0% / 0.0% | 22.5% / 76.1% / 1.4% / 0.0% / 0.0% | 24.9% | 32 | 22 | 18.6% |
|  | Tier 2 | 0.0% / 100.0% / 0.0% / 0.0% / 0.0% | 45.5% / 54.1% / 0.4% / 0.0% / 0.0% | 50.0% | 32 | 28 | 4.6% |
|  | Route 3 | 0.0% / 100.0% / 0.0% / 0.0% / 0.0% | 13.1% / 85.0% / 1.9% / 0.0% / 0.0% | 14.6% | 32 | 16 | 30.1% |
|  | T2+R3 | 0.0% / 100.0% / 0.0% / 0.0% / 0.0% | 45.5% / 54.1% / 0.4% / 0.0% / 0.0% | 50.0% | 32 | 28 | 4.6% |
| `virtueAmbitious` | HEAD | 0.0% / 100.0% / 0.0% / 0.0% / 0.0% | 18.3% / 79.0% / 2.7% / 0.0% / 0.0% | 20.4% | 31 | 12 | 33.1% |
|  | Tier 1 | 0.0% / 100.0% / 0.0% / 0.0% / 0.0% | 26.1% / 71.8% / 2.1% / 0.0% / 0.0% | 29.6% | 31 | 16 | 23.5% |
|  | Tier 2 | 0.0% / 100.0% / 0.0% / 0.0% / 0.0% | 47.9% / 51.4% / 0.8% / 0.0% / 0.0% | 53.5% | 29 | 27 | 8.7% |
|  | Route 3 | 0.0% / 100.0% / 0.0% / 0.0% / 0.0% | 18.3% / 79.0% / 2.7% / 0.0% / 0.0% | 20.4% | 31 | 12 | 33.1% |
|  | T2+R3 | 0.0% / 100.0% / 0.0% / 0.0% / 0.0% | 47.9% / 51.4% / 0.8% / 0.0% / 0.0% | 53.5% | 29 | 27 | 8.7% |
| `good` | HEAD | 0.0% / 100.0% / 0.0% / 0.0% / 0.0% | 2.1% / 80.6% / 17.0% / 0.3% / 0.0% | 2.7% | 26 | 16 | 91.3% |
|  | Tier 1 | 0.0% / 100.0% / 0.0% / 0.0% / 0.0% | 3.0% / 81.0% / 15.7% / 0.3% / 0.0% | 4.0% | 26 | 16 | 87.2% |
|  | Tier 2 | 0.0% / 100.0% / 0.0% / 0.0% / 0.0% | 14.2% / 79.5% / 6.2% / 0.1% / 0.0% | 18.8% | 26 | 18 | 46.8% |
|  | Route 3 | 0.0% / 100.0% / 0.0% / 0.0% / 0.0% | 0.2% / 62.3% / 36.6% / 0.9% / 0.0% | 0.2% | 22 | 18 | 99.6% |
|  | T2+R3 | 0.0% / 100.0% / 0.0% / 0.0% / 0.0% | 14.2% / 79.5% / 6.2% / 0.1% / 0.0% | 18.8% | 26 | 18 | 46.8% |
| `baselineRandom` | HEAD | 0.0% / 100.0% / 0.0% / 0.0% / 0.0% | 0.0% / 3.2% / 36.4% / 35.9% / 24.6% | 0.0% | 22 | 8 | 100.0% |
|  | Tier 1 | 0.0% / 100.0% / 0.0% / 0.0% / 0.0% | 0.0% / 3.6% / 37.2% / 35.3% / 23.9% | 0.0% | 22 | 8 | 100.0% |
|  | Tier 2 | 0.0% / 100.0% / 0.0% / 0.0% / 0.0% | 0.0% / 5.2% / 38.8% / 33.6% / 22.4% | 0.1% | 23 | 10 | 99.9% |
|  | Route 3 | 0.0% / 100.0% / 0.0% / 0.0% / 0.0% | 0.0% / 3.7% / 38.7% / 34.5% / 23.0% | 0.0% | 22 | 10 | 100.0% |
|  | T2+R3 | 0.0% / 100.0% / 0.0% / 0.0% / 0.0% | 0.0% / 6.2% / 40.8% / 32.2% / 20.8% | 0.1% | 23 | 11 | 99.9% |

### E. Character earned and lost, and what a crossing costs

| Profile | Arm | earned mean | earned p50 | lost mean | lost p50 | final char mean | final p50 | decisions |
|---|---|---|---|---|---|---|---|---|
| `virtueLoyal` | HEAD | 7.90 | 8 | -2.80 | -2 | 75.10 | 75 | 38.4 |
|  | Tier 1 | 8.85 | 9 | -2.80 | -2 | 76.05 | 76 | 38.4 |
|  | Tier 2 | 11.50 | 12 | -2.79 | -2 | 78.71 | 79 | 38.4 |
|  | Route 3 | 7.90 | 8 | -2.80 | -2 | 75.10 | 75 | 38.4 |
|  | T2+R3 | 11.50 | 12 | -2.79 | -2 | 78.71 | 79 | 38.4 |
| `virtueAmbitious` | HEAD | 8.97 | 9 | -3.66 | -3 | 75.31 | 76 | 40.9 |
|  | Tier 1 | 10.05 | 10 | -3.66 | -3 | 76.39 | 77 | 40.9 |
|  | Tier 2 | 12.56 | 12 | -3.65 | -3 | 78.91 | 79 | 40.9 |
|  | Route 3 | 8.97 | 9 | -3.66 | -3 | 75.31 | 76 | 40.9 |
|  | T2+R3 | 12.56 | 12 | -3.65 | -3 | 78.91 | 79 | 40.9 |
| `good` | HEAD | 6.48 | 6 | -6.19 | -6 | 70.29 | 71 | 40.9 |
|  | Tier 1 | 6.74 | 6 | -6.14 | -6 | 70.60 | 71 | 40.9 |
|  | Tier 2 | 10.05 | 10 | -6.16 | -6 | 73.89 | 74 | 40.9 |
|  | Route 3 | 2.92 | 2 | -6.22 | -6 | 66.70 | 67 | 40.9 |
|  | T2+R3 | 10.05 | 10 | -6.16 | -6 | 73.89 | 74 | 40.9 |
| `baselineRandom` | HEAD | 7.40 | 6 | -36.20 | -33 | 41.49 | 44 | 40.1 |
|  | Tier 1 | 7.81 | 6 | -36.11 | -32 | 41.97 | 45 | 40.1 |
|  | Tier 2 | 8.97 | 8 | -36.02 | -32 | 43.19 | 46 | 40.1 |
|  | Route 3 | 7.27 | 6 | -34.92 | -31 | 42.58 | 46 | 40.1 |
|  | T2+R3 | 8.86 | 8 | -34.79 | -31 | 44.27 | 48 | 40.1 |

### F. Opener behaviour — takes and readable lines per career

| Profile | Arm | takes handle-it | takes stay-within | lines from handle-it | lines from stay-within |
|---|---|---|---|---|---|
| `virtueLoyal` | HEAD | 0.000 | 3.990 | 0.000 | 0.000 |
|  | Tier 1 | 0.000 | 3.990 | 0.000 | 0.000 |
|  | Tier 2 | 0.000 | 3.990 | 0.000 | 3.594 |
|  | Route 3 | 0.000 | 3.990 | 0.000 | 0.000 |
|  | T2+R3 | 0.000 | 3.990 | 0.000 | 3.594 |
| `virtueAmbitious` | HEAD | 0.000 | 3.992 | 0.000 | 0.000 |
|  | Tier 1 | 0.000 | 3.992 | 0.000 | 0.000 |
|  | Tier 2 | 0.000 | 3.992 | 0.000 | 3.585 |
|  | Route 3 | 0.000 | 3.992 | 0.000 | 0.000 |
|  | T2+R3 | 0.000 | 3.992 | 0.000 | 3.585 |
| `good` | HEAD | 0.000 | 3.990 | 0.000 | 0.000 |
|  | Tier 1 | 0.000 | 3.991 | 0.000 | 0.000 |
|  | Tier 2 | 0.000 | 3.990 | 0.000 | 3.587 |
|  | Route 3 | 3.991 | 0.000 | 0.000 | 0.000 |
|  | T2+R3 | 0.000 | 3.990 | 0.000 | 3.587 |
| `baselineRandom` | HEAD | 1.967 | 1.969 | 0.513 | 0.000 |
|  | Tier 1 | 1.967 | 1.969 | 0.512 | 0.000 |
|  | Tier 2 | 1.969 | 1.971 | 0.510 | 1.784 |
|  | Route 3 | 1.967 | 1.971 | 0.000 | 0.000 |
|  | T2+R3 | 1.969 | 1.973 | 0.000 | 1.785 |

### G. Sample sizes

- HEAD: virtueLoyal=3000, virtueAmbitious=3000, good=3000, baselineRandom=3000
- Tier 1: virtueLoyal=3000, virtueAmbitious=3000, good=3000, baselineRandom=3000
- Tier 2: virtueLoyal=3000, virtueAmbitious=3000, good=3000, baselineRandom=3000
- Route 3: virtueLoyal=3000, virtueAmbitious=3000, good=3000, baselineRandom=3000
- T2+R3: virtueLoyal=3000, virtueAmbitious=3000, good=3000, baselineRandom=3000

### 2.1 Seed-paired deltas — the precise version of table A

The same seeds, both arms, differenced per seed. This is a **variance reduction, not a paired-career
claim**: the `diverged` column says what share of seeds produced a different career at all, and where
it is 0.0% the pairing is exact and the delta is an identity.

| Profile | Arm | diverged | Δ draft stock | **Δ upward crossings** | Δ downward crossings | Δ credit lines | Δ charge lines | 0→≥1 up | ≥1→0 up |
|---|---|---|---|---|---|---|---|---|---|
| `virtueLoyal` | Tier 1 | 47.8% | **+0.136 ± 0.016** | **+0.1083 ± 0.0122** | **+0.0097 ± 0.0064** | **+0.669 ± 0.030** | +0.000 ± 0.001 (n.s.) | 10.4% | 0.4% |
|  | Tier 2 | 100.0% | **+0.526 ± 0.054** | **+0.3550 ± 0.0217** | **+0.0160 ± 0.0140** | **+3.596 ± 0.022** | -0.002 ± 0.003 (n.s.) | 35.7% | 3.2% |
|  | Route 3 | 0.0% | +0.000 ± 0.000 (n.s.) | +0.0000 ± 0.0000 (n.s.) | +0.0000 ± 0.0000 (n.s.) | +0.000 ± 0.000 (n.s.) | +0.000 ± 0.000 (n.s.) | 0.0% | 0.0% |
|  | T2+R3 | 100.0% | **+0.526 ± 0.054** | **+0.3550 ± 0.0217** | **+0.0160 ± 0.0140** | **+3.596 ± 0.022** | -0.002 ± 0.003 (n.s.) | 35.7% | 3.2% |
| `virtueAmbitious` | Tier 1 | 49.3% | **+0.173 ± 0.040** | **+0.0913 ± 0.0132** | +0.0067 ± 0.0091 (n.s.) | **+0.693 ± 0.031** | -0.001 ± 0.002 (n.s.) | 9.5% | 0.8% |
|  | Tier 2 | 100.0% | **+0.455 ± 0.062** | **+0.3193 ± 0.0237** | +0.0037 ± 0.0170 (n.s.) | **+3.585 ± 0.023** | -0.003 ± 0.004 (n.s.) | 33.8% | 4.5% |
|  | Route 3 | 0.0% | +0.000 ± 0.000 (n.s.) | +0.0000 ± 0.0000 (n.s.) | +0.0000 ± 0.0000 (n.s.) | +0.000 ± 0.000 (n.s.) | +0.000 ± 0.000 (n.s.) | 0.0% | 0.0% |
|  | T2+R3 | 100.0% | **+0.455 ± 0.062** | **+0.3193 ± 0.0237** | +0.0037 ± 0.0170 (n.s.) | **+3.585 ± 0.023** | -0.003 ± 0.004 (n.s.) | 33.8% | 4.5% |
| `good` | Tier 1 | 15.6% | +0.071 ± 0.082 (n.s.) | **+0.0137 ± 0.0070** | **-0.0080 ± 0.0068** | **+0.197 ± 0.019** | **-0.023 ± 0.010** | 2.0% | 0.9% |
|  | Tier 2 | 100.0% | **+0.472 ± 0.079** | **+0.1320 ± 0.0243** | **-0.1003 ± 0.0226** | **+3.583 ± 0.022** | **-0.008 ± 0.008** | 21.3% | 9.3% |
|  | Route 3 | 100.0% | **+0.852 ± 0.153** | **-0.0860 ± 0.0189** | **+0.1423 ± 0.0208** | +0.007 ± 0.009 (n.s.) | +0.012 ± 0.014 (n.s.) | 6.7% | 13.3% |
|  | T2+R3 | 100.0% | **+0.472 ± 0.079** | **+0.1320 ± 0.0243** | **-0.1003 ± 0.0226** | **+3.583 ± 0.022** | **-0.008 ± 0.008** | 21.3% | 9.3% |
| `baselineRandom` | Tier 1 | 27.4% | **+0.113 ± 0.046** | **+0.0217 ± 0.0098** | -0.0013 ± 0.0115 (n.s.) | **+0.315 ± 0.021** | **-0.013 ± 0.009** | 3.6% | 1.7% |
|  | Tier 2 | 90.0% | **+0.404 ± 0.103** | **+0.0527 ± 0.0191** | **-0.0353 ± 0.0219** | **+1.762 ± 0.038** | **-0.023 ± 0.017** | 10.6% | 7.1% |
|  | Route 3 | 42.0% | **+0.211 ± 0.091** | **-0.0150 ± 0.0125** | **-0.0667 ± 0.0155** | **-0.014 ± 0.010** | **-0.542 ± 0.030** | 3.4% | 4.2% |
|  | T2+R3 | 96.8% | **+0.638 ± 0.137** | **+0.0610 ± 0.0227** | **-0.0870 ± 0.0265** | **+1.745 ± 0.039** | **-0.554 ± 0.034** | 13.9% | 10.0% |

n per cell: 3000

---

## 3. The acceptance question, answered

> *Does any arm take the median `virtueLoyal` career from zero upward rung crossings to at least one,
> without moving `good`'s draft stock or taking `good`'s credit rate to saturation?*

### **No. No arm does — but not for the reason the brief expected.**

The failure is **not** on the rung clause. One arm clears it:

| Arm | `virtueLoyal` careers with ≥1 upward crossing | median ups | clears the rung clause? |
|---|---|---|---|
| HEAD | 19.6% ± 1.4pp | **0** | — |
| Tier 1 | 29.6% ± 1.6pp | **0** | no |
| Route 3 | 19.6% ± 1.4pp (**identical to HEAD**) | **0** | no |
| **Tier 2** | **52.1% ± 1.8pp** | **1** | **yes, and only just** |
| Tier 2 + Route 3 | 52.1% ± 1.8pp (identical to Tier 2) | **1** | yes, same arm |

**Tier 2 moves the median `virtueLoyal` career from zero upward rung crossings to one.** The margin is
real but thin: 52.1% with a 95% interval of **[50.3%, 53.9%]**, which excludes 50% — so the median flip
is significant, and it would not have been at n=1,000. This is the first number on this board that
answers DECISION 085's open clause directly.

**It fails the `good` clause on both halves at once:**

- `good`'s draft stock moves **+0.472 ± 0.079** (seed-paired) — significant, not noise.
- `good`'s credit rate goes **73.1% → 100.0%**. That is saturation by definition, and it is exactly
  what DECISION 085 declined to bundle.

So the conjunction fails, and it fails **because Tier 2 cannot tell the two players apart.** Table F is
the mechanism and it is the most important table in this report:

> **At HEAD, `virtueLoyal`, `virtueAmbitious` and `good` all take `stay-within` ~3.99 times per career
> and `handle-it` exactly 0.000 times.**

The virtuous player and the stock-maximiser make the **identical choice on all five openers**, for
different reasons — `virtue` because it has the higher expected character, `best` because at HEAD it
has the higher expected draft stock (0.040 vs 0.019). **Any credit placed on `stay-within` is therefore
paid to both of them in full.** That is not a defect in Tier 2; it is a property of the card. The
openers have no branch that a virtuous player takes and a mercenary does not.

### 3.1 The brief's fallback names the wrong change, and §5 measures the right one

The brief says that if no arm clears the bar, *"the fault is in the rung boundaries after all — which
would make DECISION 081's shelved `80/67` change live again."* **The first half is half-right and the
second half does not follow.**

`80/67` moves the **second** floor. From a start of 70 it takes the fall threshold from −5 to −4. It
**cannot add an upward crossing to any career**, because the top floor does not move — and DECISION 081
is explicit that `80/67` exists to restore *activity* through the early-fall rate, which is downward
movement. Measured on 3,000 `virtueLoyal` careers (§5): `80/67` moves the zero-upward-crossing share
**80.4% → 78.8%**, and moves downward crossings **0.091 → 0.121**. **It is a remedy for a different
complaint.** The boundary that could clear the bar is the **top** floor, which DECISION 081 does not
propose, and §5 prices it.

---

## 4. Does the wave-26 R3 objection survive DECISION 074? **Yes, intact.**

§1.2 settled this from the corpus and the floor constant before any career ran. The sweep confirms it
as an identity:

| Arm | Profile | careers reading ANY opener character line |
|---|---|---|
| HEAD | `virtueLoyal` / `virtueAmbitious` / `good` | **0.0%** |
| HEAD | `baselineRandom` | 42.0% ± 1.8pp |
| **Route 3** | `virtueLoyal` / `virtueAmbitious` / `good` | **0.0%** |
| **Route 3** | `baselineRandom` | **0.0% ± 0.0pp** |
| Tier 2 | all four | **100.0% / 100.0% / 100.0% / 96.8%** |

**Under Route 3 the fraction of careers reading any opener character line is exactly zero, for every
profile.** The openers' only two authored magnitudes are `+1` and `−2`; Route 3 deletes the `−2` and
`+1` has never been above the display floor of 2. Wave 26's sentence — deleting the effect *"costs the
openers the only thing they say"* — **is still literally true.** DECISION 074 added a *branch*, not a
*line*, and the PM's reading that the card "still says something" mistook an authored value for a
readable one. This is report 059 §4.1's own argument 1 (*"they are not unrewarded, they are
unreadable"*) applied to the PM's counter-argument.

### 4.1 And the premise underneath it was already wrong at HEAD

The stronger finding, which neither DECISION 084 nor report 059 could see:

> **At HEAD the openers already say nothing to any deliberate player. The `−2` reaches 0.0% of
> `virtueLoyal`, `virtueAmbitious` and `good` careers, because all three take `stay-within` every time
> and the `−2` lives on `handle-it`.**

DECISION 084 named these five as the reason ~114 played decisions produce zero upward rungs, on the
grounds that they *"charge −2 and can never credit."* The card can. **The charge cannot land.** Report
047's *"40% of every character point a maximum-virtue career loses"* was measured **before DECISION
074** added the second option; 074 already fixed the tax it was opened over, and the figure has been
carried forward past its expiry. The only profile that still pays the opener tax is `baselineRandom`
(0.513 charge lines per career), i.e. a player choosing at random.

**So Route 3 removes a charge that no deliberate player pays, and by removing it deletes the only
opener line the random player reads.** It is worse than a no-op: it is a no-op for the people it was
proposed to help and a strict loss of information for the one profile it reaches.

### 4.2 Route 3's three measured side effects, none of which 059 could have seen

1. **It is an exact identity for both virtue profiles.** 0.0% of seeds diverge; every delta is
   identically 0.000 with a zero interval. Pinned as a test.
2. **It flips the stock-maximiser onto `handle-it` and pays it more than any other arm on the table.**
   `good`'s draft stock **+0.852 ± 0.153** — 1.8× Tier 2's +0.472 and 12× Tier 1's +0.071. Route 3 was
   proposed in 059 §5.5 as the route that *"costs the virtue profiles nothing, and does not pay anybody
   for being calm."* Both halves are true and the sentence is still misleading: **it pays the
   draft-stock optimiser, in draft stock, more than either credit pack does.**
3. **It makes `good`'s ladder strictly worse.** Upward crossings **−0.086 ± 0.019**, downward
   **+0.142 ± 0.021**, `good`'s ever-top rate **2.7% → 0.2%**, and `good`'s median final character
   **71 → 67**. Because `good` abandons `stay-within` it forfeits 3.99 × (+1) of sub-floor character a
   career — invisible in the ledger, load-bearing on the ladder. **13.3% of `good` careers go from at
   least one upward crossing to none.** This is the clearest thing in the report: the `+1` nobody can
   read is doing real work, and Route 3 is the one arm that takes it away.

### 4.3 Tier 2 + Route 3 is not a third option

For all three deliberate profiles, **Tier 2 + Route 3 is numerically identical to Tier 2** in every
column. The reason is §1.1: once `stay-within` pays `+2`, `best` returns to it (E[stock] 0.175 vs
0.094) and `virtue` never left, so **`handle-it` is taken 0.000 times and deleting its effect is
unreachable code.** Only `baselineRandom` sees any difference at all.

And it carries a defect the others do not: with `+2` the only surviving magnitude, **all five openers
become one-way-UP cards** — they can credit and can never charge. That is the mirror defect DECISION
085 explicitly refused when it dropped report 057's `playing-through-the-hand` row for creating one.
**Tier 2 + Route 3 would create five.** Pinned as a test.

---

## 5. What a crossing actually costs, and the boundary sweep

### 5.1 The arithmetic of a crossing from the modal start

**Every career starts on rung 1** (`STARTING_CHARACTER = 70`, `the staff trusts you`, floor 66) — start
occupancy is 100% / rung 1 in every cell of table D, so the modal starting position is the *only*
starting position. From there:

| | threshold | distance from 70 |
|---|---|---|
| **up** to `they would run through a wall for you` | ≥ 80 | **+10** |
| **down** to `just a guy in the building` | < 66 | **−5** |

Against that, what a career actually accumulates (table E, medians):

| Profile | earned | lost | net | final | short of 80 by |
|---|---|---|---|---|---|
| `virtueLoyal` HEAD | +8 | −2 | **+5** | 75 | **5** |
| `virtueLoyal` Tier 1 | +9 | −2 | +6 | 76 | 4 |
| `virtueLoyal` **Tier 2** | +12 | −2 | +9 | **79** | **1** |
| `good` HEAD | +6 | −6 | 0 | 71 | 9 |
| `good` **Route 3** | **+2** | −6 | −4 | **67** | 13 |
| `baselineRandom` HEAD | +6 | −33 | −27 | 44 | — |

**The median maximum-virtue career finishes exactly one point below the boundary under Tier 2, and five
points below it at HEAD.** That single point is why Tier 2's up-crossing share lands at 52.1% rather
than 80%: the distribution straddles the line instead of clearing it. It also means Tier 2's result is
**fragile to one point of recalibration in either direction**, which the board should know before
treating 52.1% as a robust "the median career now climbs."

### 5.2 The boundary sweep — one set of careers, seven candidate tables

`boundarySweep()` keeps the full per-decision `character` trajectory and scores it against several
candidate band tables, which is the instrument DECISION 081 built `rung-probe.ts` for and the reason its
band table is a parameter. Lower three floors held at 50/30/0 throughout.


**Arm: HEAD** — 3000 careers per profile, one set of careers scored against every table.

| Table (top/2nd) | `virtueLoyal` zero-up | `virtueAmbitious` zero-up | `good` zero-up | `good` ever-top | `baselineRandom` ever-top | vL downs/career | vL never moves |
|---|---|---|---|---|---|---|---|
| **80/66 (HEAD)** | 80.4% | 71.2% | 80.2% | 2.7% | 0.0% | 0.091 | 79.1% |
| 80/67 *(D081 shelved)* | 78.8% | 68.7% | 76.4% | 2.7% | 0.0% | 0.121 | 76.5% |
| 79/66 | 72.0% | 63.0% | 77.7% | 5.2% | 0.0% | 0.108 | 70.7% |
| 78/66 | 62.0% | 54.3% | 73.8% | 9.2% | 0.0% | 0.123 | 60.7% |
| 77/66 | 51.6% | 43.8% | 67.2% | 15.8% | 0.1% | 0.151 | 50.3% |
| 76/66 | 39.4% | 33.6% | 60.1% | 22.9% | 0.4% | 0.193 | 38.1% |
| 78/67 | 60.4% | 51.8% | 69.9% | 9.2% | 0.0% | 0.154 | 58.1% |

**Arm: Tier 1** — 3000 careers per profile, one set of careers scored against every table.

| Table (top/2nd) | `virtueLoyal` zero-up | `virtueAmbitious` zero-up | `good` zero-up | `good` ever-top | `baselineRandom` ever-top | vL downs/career | vL never moves |
|---|---|---|---|---|---|---|---|
| **80/66 (HEAD)** | 70.4% | 62.6% | 79.1% | 4.0% | 0.0% | 0.101 | 69.4% |
| 80/67 *(D081 shelved)* | 68.9% | 60.3% | 75.0% | 4.0% | 0.0% | 0.129 | 67.2% |
| 79/66 | 61.6% | 53.7% | 76.4% | 6.7% | 0.1% | 0.117 | 60.6% |
| 78/66 | 51.5% | 44.2% | 71.9% | 11.2% | 0.1% | 0.141 | 50.5% |
| 77/66 | 41.5% | 35.1% | 65.0% | 18.1% | 0.3% | 0.173 | 40.5% |
| 76/66 | 30.8% | 25.8% | 57.4% | 25.7% | 0.7% | 0.207 | 29.8% |
| 78/67 | 50.0% | 42.0% | 67.8% | 11.2% | 0.1% | 0.169 | 48.3% |

**Three things fall out of this table.**

1. **`80/67` does not address the acceptance question.** `virtueLoyal` zero-up 80.4% → **78.8%**, a
   1.6pp move, while downward crossings go 0.091 → 0.121 and never-moves 79.1% → 76.5%. It buys
   *activity*, overwhelmingly downward, which is exactly what DECISION 081 said it was for. **A
   playtester reporting the ladder as inert is still the falsifier that flips it — but not on this
   metric.** The brief's fallback does not follow from the brief's own acceptance question.

2. **The top floor would have to go to ~76 to move the median virtuous career on boundaries alone**
   (39.4% zero-up), and at 76 the stock-maximiser touches the top rung in **22.9%** of careers, against
   2.7% at HEAD. DECISION 081's accepted shape was *"a clear minority of virtuous careers, near-zero for
   the stock-maximiser."* **76/66 breaks it by 8.5×.** 77/66 (51.6% zero-up — median still 0) already
   costs 15.8%.

3. **The cheapest combination that clears the rung clause is Tier 1 + 77/66** — `virtueLoyal` zero-up
   **41.5%**, so median ups = 1 — and it costs `good` an ever-top rate of **18.1%**. Tier 1 + 78/66 puts
   `virtueLoyal` at 51.5%, i.e. **still a median of zero**, for `good` at 11.2%.

### 5.3 The finding underneath all of it: `character` does not carry the signal

Every lever on this board fails in the same place, and §5.1 says why in two numbers.

> **The median `virtueLoyal` career finishes on 75. The median `good` career finishes on 71. The
> separation between "played virtuously for four years" and "maximised draft stock and never thought
> about the room" is 4 character points — on a ladder whose two relevant rungs are 14 points apart.**

A band boundary is a step function. To place one between two distributions 4 points apart, when each has
a spread of ~10, is not possible: at every top floor in §5.2 the two profiles move **together**. That is
why no content edit clears the `good` clause and no boundary change clears it either. It is not a
corpus-asymmetry problem (DECISION 084) and not a calibration problem (DECISION 081). **It is that
`character` barely discriminates between the two ways of playing**, which is consistent with DECISION
084's own census: **136 of 204 options are silent both ways**, so two thirds of the game's decisions
contribute nothing to the axis the ladder reports.

**This is the answer the brief was reaching for and it is neither of the two it offered.** No edit to
these five cards can fix the complaint — and neither can the rung boundaries. The board has spent four
waves choosing between two levers that both fail for a third reason.

---

## 6. Recommendation

**Approve Tier 1. Reject Route 3 and Tier 2 + Route 3 outright — they are measured now, not unsure.
Leave Tier 2 as the user's single yes/no, now with a rung figure attached. And stop treating the ladder
as the thing these edits are for.**

| Arm | Verdict | The one number |
|---|---|---|
| **Tier 1** | **approve** | `good` draft stock **+0.071 ± 0.082 — n.s.**, the only arm whose cost to the stock-maximiser is indistinguishable from zero. Buys `virtueLoyal` 10.4% of careers going from zero upward crossings to ≥1, credit rate 85.9% → 93.2%. |
| **Tier 2** | **user's call, unchanged** | The **only** arm that moves the median `virtueLoyal` career's upward crossings (0 → 1, 52.1% ± 1.8pp). Costs `good`'s credit rate 73.1% → **100.0%**. |
| **Route 3** | **reject** | Exact identity for both virtue profiles (0.0% of seeds diverge). Takes opener character lines to **0.0% for every profile**. Pays `good` **+0.852 ± 0.153** draft stock — the largest on the table — and costs `good` **13.3%** of careers an upward crossing. |
| **Tier 2 + Route 3** | **reject** | Numerically identical to Tier 2 for all three deliberate profiles, and creates **five one-way-UP cards**, the defect DECISION 085 refused. |

**Route 3 is refuted, and wave 26 was right for a better reason than it gave.** It rejected R3 because
deleting the effect *"costs the openers the only thing they say."* It does — and the two things wave 26
could not have known are that (a) after DECISION 074 the opener already says nothing to a deliberate
player, so R3's cost is paid entirely by the random player, and (b) deleting the `−2` re-prices
`handle-it` above `stay-within` for the stock scorer, so R3 quietly *changes what a good player does*
and makes his ladder worse. **Report 059 §5.5 named Route 3 as "a cleaner option"; it is the worst of
the four.** That is my own lane's predecessor corrected, and the correction was only visible because
this probe could put the edit in the bundle.

### 6.1 The strongest fair statement of the counter-case for shipping nothing

Stated at its best, because on this board it is now stronger than the case for Tier 1.

**The complaint these eleven edits answer has already been fixed, and the one that remains is not a
content defect.** The playtester's sentence was *"being punished for something you were not asked about
is the only thing in this game that felt unfair rather than hard."* **DECISION 074 fixed that
completely** — §4.1 measures the residual at 0.0% of deliberate careers. What is left is a different
complaint, *"the ladder reads as inert"*, and it is a complaint that the game does not tell the player
he is good often enough. **Tier 1's answer to it is 0.67 extra credit lines per career and one extra
rung crossing in one career out of ten.** A change that reaches 10% of careers is a change no playtest
of realistic size can detect; the board would ship it and then be unable to say whether it worked.

**And §5.3 says the ladder cannot be made to mean what the board wants it to mean.** A display that
moves for a virtuous player also moves for a mercenary, because the two are 4 points apart on a 14-point
band. So a ladder that climbs is not a reward for integrity — it is a reward for *playing a lot of
cards*, which is what `baselineRandom`'s 2.05 downward crossings per career already demonstrate from the
other side. **Shipping Tier 1 makes the widget move slightly more often without making it mean anything
more**, and it spends the one thing the freeze exists to protect — the currency's meaning — to do it.
Report 059 §8's argument is unchanged and this report adds a second: **the honest fix is not to make the
ladder move, it is to stop promising it is a climb.** DECISION 081 already recorded that the ladder got
*quieter* on purpose and called a ladder nobody moves on "the failure mode on the other side of this
fix." The measurement now says both sides of that trade were mispriced, because the quantity being
displayed does not separate the players.

**The single strongest form:** the board has three waves of evidence that `character` is a currency you
protect rather than climb, and it has now measured that it *cannot* be made climbable without paying the
player who never thought about the room. **That is not a bug to fix. It is a description to change.**
The person who can decide whether the ladder should promise a climb at all is the user, and that
question is worth more than Tier 1.

---

## 7. The exact proposed diff

**Proposal only. This lane edited no content, and `git status` in §9 proves it.**

### 7.1 What I recommend approving — Tier 1, six edits, six cards

Unchanged from report 059 §4, restated so the user does not have to hold two documents open. All paths
are under `src/content/events/`. `current` and `proposed` are the **full `effects` array of the named
outcome**; every other field on the outcome — prose, probability, the sibling branch — is untouched.

| # | Card id | Option id | Branch | File | Current effects | Proposed effects |
|---|---|---|---|---|---|---|
| 1 | `wideopen-two-deep` | `bring-the-walkon-along` | positive | `school-life.ts` | `[{character:1},{moment:"Built a backup out of a walk-on"}]` | `[{character:`**`2`**`},{moment:"Built a backup out of a walk-on"}]` |
| 2 | `offseason-captain-vote` | `let-the-work-speak` | positive | `season-life.ts` | `[{moment:"Voted captain without campaigning for it"}]` | `[{moment:"Voted captain without campaigning for it"},`**`{character:2}`**`]` |
| 3 | `the-holding-call` | `own-it` | positive | `ol.ts` | `[{stat:pancakes,+2},{character:1}]` | `[{stat:pancakes,+2},{character:`**`2`**`}]` |
| 4 | `trash-talk` | `stay-quiet` | positive | `dl.ts` | `[{stat:tfls,+1},{character:1}]` | `[{stat:tfls,+1},{character:`**`2`**`}]` |
| 5 | `the-roughing-call` | `dial-it-back` | positive | `dl.ts` | `[{stat:tfls,+1},{character:1}]` | `[{stat:tfls,+1},{character:`**`2`**`}]` |
| 6 | `asked-to-block` | `buy-in` | positive | `oskill.ts` | `[{character:1}]` | `[{character:`**`2`**`}]` |

### 7.2 Tier 2 — the user's yes/no, for reference

| Card id | Option id | Branch | File | Current effects | Proposed effects |
|---|---|---|---|---|---|
| `milestone-opener-first` | `stay-within` | positive | `milestones.ts` | `[{snaps:10},{character:1}]` | `[{snaps:10},{character:`**`2`**`}]` |
| `milestone-opener-no-excuse` | `stay-within` | positive | `milestones.ts` | `[{snaps:10},{character:1}]` | `[{snaps:10},{character:`**`2`**`}]` |
| `milestone-opener-your-team` | `stay-within` | positive | `milestones.ts` | `[{snaps:10},{character:1}]` | `[{snaps:10},{character:`**`2`**`}]` |
| `milestone-opener-counting` | `stay-within` | positive | `milestones.ts` | `[{snaps:10},{character:1}]` | `[{snaps:10},{character:`**`2`**`}]` |
| `milestone-opener-last` | `stay-within` | positive | `milestones.ts` | `[{snaps:10},{character:1}]` | `[{snaps:10},{character:`**`2`**`}]` |

### 7.3 Route 3 — the diff I am recommending AGAINST, stated exactly so the rejection is checkable

| Card id | Option id | Branch | File | Current effects | Proposed effects |
|---|---|---|---|---|---|
| `milestone-opener-first` | `handle-it` | **negative** | `milestones.ts` | `[{kind:"character",amount:-2}]` | `[]` |
| `milestone-opener-no-excuse` | `handle-it` | negative | `milestones.ts` | `[{kind:"character",amount:-2}]` | `[]` |
| `milestone-opener-your-team` | `handle-it` | negative | `milestones.ts` | `[{kind:"character",amount:-2}]` | `[]` |
| `milestone-opener-counting` | `handle-it` | negative | `milestones.ts` | `[{kind:"character",amount:-2}]` | `[]` |
| `milestone-opener-last` | `handle-it` | negative | `milestones.ts` | `[{kind:"character",amount:-2}]` | `[]` |

Every row's `from` in all three tables is asserted against `src/content/**` at HEAD by
`route3-rung-probe.test.ts`, so if the corpus moves before the user rules, the proposal fails a test
rather than silently addressing a card that changed. This is the `credit-proposal-probe` convention,
extended as the brief asked.

### 7.4 What I am NOT proposing, and will not without a decision

**No change to `bands.ts`.** §5.2 prices the candidates and §5.3 argues none of them is a fix. A top
floor of 77 or 76 would clear the acceptance question's rung clause and would break DECISION 081's
accepted shape by 6–8×. That is a live option and the user should see the table, but **this lane does
not recommend it**, and it is a `src/ui/**` edit which this brief forbids in any case.

---

## 8. Limitations, and what would falsify this report

1. **What is observed and what is not.** *Every number in §2–§5 is observed*: real careers, played by
   the engine, against a bundle with the edit in it, with `maxCharacter` gates re-evaluated and policies
   re-selecting on their own. **Nothing in this report is modelled.** That is the one clean improvement
   on report 059, whose §7 limitations 1, 2 and 3 are closed here rather than restated. The cost is §2's
   pairing: arms diverge, so table A's intervals are unpaired and wide, and §2.1's tighter intervals are
   **seed-paired, which is a variance reduction and not a paired-career claim**. Where an arm changes no
   behaviour the pairing is exact (Route 3 on the virtue profiles: 0.0% diverged).
2. **The policies are not humans, and every fire rate is an upper bound.** `virtue` takes the
   highest-character branch every time; a person takes it some fraction of the time. Report 059's
   limitation 6 applies unchanged, and it cuts *against* Tier 1: a real player reads fewer of the six
   cards than 3,000 maximum-virtue careers do.
3. **`good` is misnamed and I have used behaviour, not the name, throughout.** It is a **draft-stock
   maximiser** (`events: "best"`), not "a player who plays well". It takes four of Tier 1's six branches
   exactly zero times because they are stock-negative, and it takes `stay-within` on all five openers
   because at HEAD that is the stock-optimal pick — not because it is the decent one. Where this report
   says "the stock-maximiser" it means this profile.
4. **`homeState` is fixed at `TX`** across all 60,000 careers, as in every probe in this directory.
   Region determines the Signing Day school pool, so `wideopen-two-deep`'s fire rate in particular is
   stated for that fixture.
5. **One consistency check does not reproduce exactly, and it is reported rather than buried.** DECISION
   081 measured `virtueLoyal` top-rung reach at **15.7%** and `virtueAmbitious` at **23.1%** over 14,400
   careers; this lane measures **14.6%** and **20.4%** over 3,000 each at HEAD. `virtueLoyal` is inside
   sampling error; **`virtueAmbitious` is not** (±1.4pp). The likely cause is content drift since
   `f2c3188` — DECISIONS 082–085 landed between — but I have not isolated it, and if the board wants
   §5.2's boundary table to be authoritative it should be re-run with `rung-probe.ts`'s seeds for a
   direct comparison.
6. **§5.3 is an argument, not a measurement.** The 4-point separation and the 14-point band are measured;
   *"no boundary can separate them"* is an inference from that plus the spread. A distributional
   remedy this lane did not explore — a boundary on something other than the final value, e.g. on
   `character` gained net of losses — is not ruled out by anything here.
7. **Tier 2's median flip is one point from reversing.** §5.1: the median Tier 2 career finishes on 79
   against a floor of 80. Any future edit that removes one character point from a virtuous career, or a
   top floor of 81, takes 52.1% back below 50% and the headline answer in §3 changes sign.
8. **What would falsify the central claim.** §4.1 rests on all three deliberate profiles taking
   `handle-it` **0.000** times. That is a property of two scorers, not of humans. **A playtester who
   takes "Take care of business" on an opener falsifies §4.1 immediately** — the `−2` would then be
   live for real players, Route 3 would have a real constituency, and this report's rejection of it
   would need re-opening. **That is one question in the next playtest and it is the cheapest thing on
   this board.** The probe cannot answer it, and it is the single most valuable number that is missing.

---

## 9. What I added, and verification

**Added — two files, both new, both under `src/sim/`. Nothing else.**

- `src/sim/route3-rung-probe.ts` — the five arms as data (`TIER_1`, `TIER_2`, `ROUTE_3`, `ARMS`),
  `patchContent()` (the observed-arm mechanism), the traced career, the seed-paired delta sweep and the
  boundary sweep. Three CLI modes:
  - `npx tsx src/sim/route3-rung-probe.ts 500 all all b61 head` — per-arm summary
  - `npx tsx src/sim/route3-rung-probe.ts 500 all all b61 paired:tier1,tier2` — seed-paired deltas
  - `npx tsx src/sim/route3-rung-probe.ts 500 all all b61 bounds:head` — candidate band tables
- `src/sim/route3-rung-probe.test.ts` — **31 tests**. They pin: the three copied constants against
  `view-model.ts`, `draft.ts` and `create-career.ts`; the re-derived band table against `trustPhrase`
  and `trustRungOf` for all 101 reachable values; every arm's row `from` against the corpus; that the
  five openers are `fixed`, partition `seasonIndex` 0–4 and author **exactly** `{+1, 0, −2}`; that the
  only readable opener line at HEAD is the `−2`; that `patchContent` leaves `CONTENT` byte-identical and
  shares every untouched event by reference; that Route 3 leaves every opener branch sub-floor; that
  Tier 2 + Route 3 makes all five one-way-**up**; that `best` flips to `handle-it` **only** under Route
  3 and `virtue` never flips in any arm; that the HEAD arm plays the game as it stands; and that Route 3
  is an **exact identity** for a maximum-virtue career and **not** one for the stock-maximiser.

**No existing probe was modified.** The floor constant, the verdict function and the band table are
duplicated from `spared-card-probe` / `human-lazy-probe` and each copy is asserted against its source,
which is the convention this directory already uses.

| Check | Command | Result |
|---|---|---|
| Tests | `npm test` | **841 passed**, 46 files (810 at HEAD + 31 added). Green. |
| Typecheck, both passes | `npm run typecheck` | **exit 0** |
| Typecheck, both passes again | `npm run typecheck` | **exit 0** |
| Balance identity, seed A | `npx tsx src/sim/balance.ts 2000 random all` | `md5 71acaf49853ee129c0668aa2f121dc5b` — **byte-identical to report 059's HEAD figure** |
| Balance identity, seed B | `npx tsx src/sim/balance.ts 2000 first all` | `md5 9a63f3518203dd930ccb256082c6bb1f` — **byte-identical** |

**Balance is byte-identical to HEAD, and because this lane ships no product code, identity IS the pass.**
Both md5s match the values report 059 recorded, which also confirms no content has moved since wave 31.

**`git status --porcelain`, pasted as the brief requires:**

```
 M docs/superpowers/polish/DECISIONS.md
 M docs/superpowers/polish/STATE.md
?? docs/superpowers/polish/briefs/060-does-the-ladder-read-as-something-you-can-climb.md
?? docs/superpowers/polish/briefs/061-the-route-nobody-priced-and-the-metric-nobody-measured.md
?? docs/superpowers/polish/reports/060-does-the-ladder-read-as-something-you-can-climb.md
?? docs/superpowers/polish/reports/061-the-route-nobody-priced-and-the-metric-nobody-measured.md
?? src/sim/route3-rung-probe.test.ts
?? src/sim/route3-rung-probe.ts
```

**`src/engine/**`, `src/content/**` and `src/ui/**` are all untouched — no entry under any of the three.**
From this lane: `?? src/sim/route3-rung-probe.ts`, `?? src/sim/route3-rung-probe.test.ts` and this
report. The two `M docs/…` entries and the 060 brief/report are the PM's and another lane's, untouched
here. **The playtester's build is the build they started on.** Nothing was committed; `git checkout`,
`git restore` and `git stash` were never run.
