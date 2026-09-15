# 034 — A career can go wrong: what it costs to remove the declare decision, and what should replace it

**Type:** design + measurement · **Wave:** 15 · **Status:** done — **needs a user decision**
**2026-09-15** · **Measured by:** PM session 7, directly. Two dispatched agents were killed by
capacity stalls before writing anything; the probes run 9,000 careers in seconds, so the PM ran it
inline rather than lose a third attempt.
**Changed in the repo:** nothing. All prototyping happened in `git archive HEAD` copies outside the
working tree. `git status --porcelain src/` is empty.

---

## Headline

| | |
|---|---|
| The problem, in one number | With declare removed, a **deliberately lazy** player is drafted **97.8%** of the time |
| Root cause | `developmentDelta` (`advance.ts:172`) cannot return a negative number. Overall is a one-way ratchet |
| Second root cause, and the bigger one | The undrafted line sits at stock **35**. A *lazy* career finishes at **59.7**. The bar is far below even a bad career |
| Recommended | **F2** — a raised draft bar *plus* upperclass decline. `good` 0.9% undrafted / 40.7% round 1; `lazy` **19.2%** undrafted |
| Acceptance test 1, as literally written | **Not met by any candidate that also passes test 2** — and the test was miscalibrated. See §5 |
| Careers measured | ~150,000 |

**The one-sentence finding:** the engine already knows which careers were bad — a good career scores
89 and a lazy one 60 — it simply never fails any of them, so the cheapest real downside is to raise
the bar the draft applies rather than to invent a new punishment.

---

## 1. The baseline: what removing declare leaves behind

Measured with profiles that never declare, which is exactly what the world looks like once the
decision does not exist.

| profile | undrafted | busted | drafted | round 1 | OVR P50 |
|---|---|---|---|---|---|
| `good` | 0.0% | 3.7% | 96.3% | 45.1% | 91.8 |
| `randomFull` | 0.1% | 3.6% | 96.3% | 9.9% | 82.2 |
| `lazyFull` | **0.7%** | 1.5% | **97.8%** | 0.0% | 71.8 |

**A player trying to fail is drafted 97.8% of the time.** That is the whole problem, and it confirms
DECISION 057's premise: deleting declare without a replacement returns the game to unlosable.

## 2. Why the obvious fix does not work

**Candidate A — development can go negative when you do not play.** The direct attack on the
ratchet. Swept across three intensities (`floor` = the snap count below which you lose ground):

| setting | `good` undrafted | `good` rd1 | `random` | `lazy` |
|---|---|---|---|---|
| floor 150 | 0.0% | 30.7% | 0.7% | 1.9% |
| floor 250 | 1.5% | 19.9% | 5.4% | 10.6% |
| floor 350 | **7.6%** | **5.3%** | 8.4% | 7.7% |

**It fails, and the way it fails is the interesting part.** At the intensity where it finally creates
failure, it **stops discriminating**: `good` 7.6%, `random` 8.4%, `lazy` 7.7% — everyone fails at the
same rate. It is punishing bad luck, not bad play, because snaps are largely sim-driven rather than
chosen. It also guts the good-career ceiling (round 1 45% → 5%).

**The cause is that it taxes freshmen.** A true freshman naturally has few snaps, so a flat snap
threshold charges every career for its first two years.

**Candidate C — the same decline, but only for upperclassmen.** A freshman who does not play is
normal; a junior who does not play is falling behind. Better, and better fiction:

| setting | `good` undrafted | `good` rd1 | `random` | `lazy` |
|---|---|---|---|---|
| floor 250 | 0.1% | 34.8% | 1.5% | 4.5% |
| floor 350 | 1.3% | 22.7% | 5.3% | 9.5% |
| floor 450 | **8.4%** | **7.0%** | 12.0% | 13.2% |

Discrimination at low intensity is excellent — **1 : 45** between `good` and `lazy` at floor 250 —
but the absolute failure rate is too low, and pushing it up destroys good careers exactly as in A.
**Decline alone cannot carry this.**

## 3. The mechanism that works, and why it was hiding in plain sight

The engine's draft stock **already separates career quality cleanly**: `good` finishes at 89,
`random` at 75, `lazy` at 60. The undrafted line is at **35** — far below all three. Nothing is
failing because the bar is on the floor, not because the engine cannot tell a bad career from a good
one.

**Candidate E — raise the bar, and rescale the round bands so round 1 stays reachable.**

| setting | `good` undrafted | `good` rd1 | `random` | `lazy` |
|---|---|---|---|---|
| floor 45 | **0.0%** | **45.1%** | 1.0% | 6.6% |
| floor 50 | **0.1%** | **45.1%** | 2.4% | **15.2%** |
| floor 55 | 0.4% | 41.6% | 5.9% | **29.0%** |

**At floor 50 a good career is untouched** — identical median overall, identical 45.1% round-1 rate,
byte-for-byte the same careers — while a lazy career fails **15.2%** of the time. Discrimination is
**1 : 152**. It is two numbers in `draft.ts`.

**Its one real weakness:** nothing *during* the career tells the player it is going wrong. They find
out on the final screen. **That is the same defect class this phase just removed from the declare
card** — a cost hidden until it is too late to act — so it should not be shipped alone.

## 4. Recommended: F2 — raise the bar *and* let an upperclassman lose ground

Gentle upperclass-only decline (below 200 snaps, one point per 60 short) **plus** the floor-50 bar.
Confirmed over **9,000 careers per profile**:

| profile | undrafted | busted | drafted | round 1 | round 6–7 | OVR P50 |
|---|---|---|---|---|---|---|
| `good` | **0.9%** | 3.6% | 95.6% | **40.7%** | 5.9% | 90.3 |
| `randomFull` | 5.6% | 3.3% | 91.1% | 8.8% | 19.7% | 80.5 |
| `lazyFull` | **19.2%** | 1.3% | 79.5% | 0.0% | 47.6% | 71.0 |
| `antisocialFull` | 2.7% | **13.7%** | 83.6% | 3.8% | 15.5% | 83.3 |

**Why this one over the cheaper E:**

1. **The decline is visible while it is happening**, in the overall number the player already
   watches. A career that is going wrong now *looks* like it is going wrong, which is the thing this
   entire phase is about.
2. **Good play is still protected** — 0.9% undrafted and 40.7% round 1, inside the acceptance band.
3. **It keeps all three failure paths distinct and working**: rating collapse (the new decline),
   character spiral (`antisocial` still busts at 13.7%, unchanged), and simply not being good
   enough (the raised bar).
4. **Bad play is now genuinely punished** — one lazy career in five ends undrafted, against one in
   140 today.

**Cost:** two constants in `draft.ts`, and about six lines at the development call site in
`advance.ts:199-210`. No new subsystem, no new content, no schema change.

**Ranking:** F2 > E (cheapest, but invisible until the end) > C (good discrimination, too weak) >
A (disqualified — punishes luck, not play) > D (not measured; E dominates it by attacking the same
quantity more directly and more cheaply).

## 5. The acceptance test I set was miscalibrated, and I am not quietly moving it

Brief 034 pre-specified: restore failure to roughly **12–17% undrafted under ordinary play**. **No
candidate reaches that without also failing good careers**, and F2 puts ordinary (`randomFull`) play
at **5.6%**.

**The test was wrong, and the reason matters.** The 12–17% figure came from `baselineRandom` — a
profile that declares early *at random*. Essentially all of that failure was the declare trap firing,
which is the very thing being deleted. Calibrating the replacement against the trap's output builds
the trap's severity back in under another name.

**What F2 actually does is redistribute failure from a gotcha to a judgement:** ordinary play fails
5.6% of the time instead of 12–17%, and *bad* play fails **19.2%** of the time instead of 0.7%.
DECISION 057's stated falsifier — *no mechanism restores failure without making good play fail* —
**did fire for candidates A and C, and does not fire for F2.**

This is flagged rather than absorbed because the user approved "restore the downside" against the
12–17% number, and F2 does not deliver that number for ordinary play. It delivers stakes for players
who earn them.

## 6. Open items the implementation must handle

- **Removing the declare decision is not measured here**, only simulated by using profiles that never
  declare. The real removal touches the engine hub, `policies.ts:242`'s `declare` strategy, the
  `PROFILES` table, the view model, and tests. That blast radius still needs enumerating.
- **The fifth-year question.** With declare gone, the redshirt card's extra season is the only thing
  varying career length. Worth asking whether the fifth year is still a choice worth having.
- **Repetition.** Careers get longer without declare (`randomFull` runs 4.73 seasons against
  `baselineRandom`'s 3.10), and repetition is this phase's top complaint. **`npx tsx
  src/sim/repetition-probe.ts 24 B card` (and `C`, and `all`) must be run on the implemented build**
  — both cohorts; neither alone exercises all five opener variants.
- **Seed baselines move by construction** and were not finalised here, because the real change also
  removes declare and will move them again. Re-baseline at commit (DECISION 040 precedent).
- **B43 interacts.** The redshirt card pays +5 up front. Under F2 a *junior* redshirt would now cost
  real ground, which makes redshirting an actual gamble for the first time — possibly fixing B43 for
  free. Not measured; worth checking during implementation.

## 7. Verification

- `npm test` — 644 passed. `npm run typecheck` — both passes exit 0. Working tree untouched.
- Every patch was verified in place before measuring (`grep` on the patched constants), after an
  early sweep silently reported baseline numbers three times because a quoting bug made the patch
  step fail while the measurement still ran. **Identical output across three different settings was
  the tell.** Any future sweep should assert the patch landed before trusting a row.
- Reproduce: `git archive HEAD` to a temp dir, apply the patch described per candidate, then
  `npx tsx src/sim/failure-probe.ts <runs> <profile> all`. The patch and harness scripts are in the
  session scratchpad.
