# 032 — How losable is it now, and what does declaring early actually cost?

**Type:** measurement · **Wave:** 14 · **Status:** done · **2026-09-14**
**Measured by:** PM session 7, directly. The dispatched agent stalled at 600s with nothing written;
the probe turned out to run 57,600 careers in 25 seconds, so the PM ran it inline rather than
re-dispatching into the same capacity wall.
**Changed:** nothing. `git status --porcelain src/engine src/content src/ui src/sim` is empty.
Probe scripts live in the session scratchpad, not in the repo.

---

## Headline

| | |
|---|---|
| Is `undrafted` reachable? | **Yes — 12.4–17.1% of ordinary random careers.** B42 is **REFUTED as stated** |
| Why the earlier "zero in 400" happened | That policy **never declared early.** Undrafted for a bad player who stays all five seasons is **0.17–2.7%** |
| Is declaring early a gamble, a tax, or a trap? | **A trap, and the word is now literal.** It is *strictly dominated at every offer* — no branch of it has upside |
| Round 1 after declaring early | **0.0000** over 2,400 careers at offer #1 and again at offer #2. Not rare — arithmetically out of reach |
| Careers measured | **74,400** (57,600 profile sweep + 9,600 paired A/B + 7,200 verification) |

**The one-sentence finding:** the game is losable and the ending screen's prominence for `Undrafted`
is fully earned — but the Declare card offers a choice that is **worse on every measured axis at
every point in a career**, which is a balance fact the UI cannot honestly dress up as a gamble.

---

## 1. Losability by policy (B42)

`npx tsx src/sim/failure-probe.ts 1200 <profile> all` — 1,200 careers × 6 positions per profile.
Ranges below are across the six positions.

| profile | what it is | undrafted | busted | drafted | rd 1 | stock P50 |
|---|---|---|---|---|---|---|
| `good` | plays well, stays | **0.0000** | 2.5–6.6% | 93–98% | 28.7–52.2% | 85–92 |
| `baselineRandom` | ordinary, unoptimised play | **12.4–17.1%** | 1.3–2.5% | 80–86% | 0.6–3.3% | 50–55 |
| `lazyFull` | plays badly, **stays** | **0.17–2.7%** | 1.2–1.6% | 96–99% | ~0% | 54–63 |
| `lazyEarly` | plays badly, **declares early** | **35.8–65.5%** | 0.3–0.5% | 34–64% | 0.0% | 32–37 |
| `antisocialFull` | tanks character, stays | 0.0000 | **12.3–15.0%** | 85–88% | 0.7–5.4% | 67–76 |
| `antisocialEarly` | tanks character, declares early | 11.6–31.1% | 0.3–0.7% | 69–88% | 0.0% | 38–43 |

**Three things this settles.**

1. **B42 is refuted.** Undrafted is not a rare ending. It is where roughly **one in eight** ordinary
   random careers finishes, and where **two in three** of a bad kicker's early-declare careers
   finish. The ending screen is right to give it the room it gives it.
2. **The earlier anecdote is explained, not contradicted.** DECISION 052's "400 careers under a
   deliberately bad policy, zero undrafted" was measured under a policy that plays badly *and stays
   all five seasons*. That cell really is ~0.2% for a QB; zero in 400 is the expected result. The
   variable that produces undrafted careers is **leaving early**, not playing badly.
3. **The two failure axes are separate and both work.** Tanking *ability* (`lazy`) produces low
   picks; tanking *character* (`antisocial`) produces **busts** at 12–15%, via the authored bust
   events. Neither collapses into the other. The "I could not lose" complaint from the 014 playtest
   is no longer true of the build: playing badly and declaring early loses, loudly.

**One tooling defect found, worth recording.** `lazyFull` and `saboteurFull` produce **byte-identical
output across all ~45 reported fields over 400 careers** (verified by JSON diff), and so do
`lazyEarly` / `saboteurEarly`. The scorer is correct — `policies.ts:180` really does weight `ending`
effects at −1000 for `saboteur` — but the options carrying `kind: "ending"` live behind the bust
gates, which are **character**-gated, and `lazy` tanks *overall* while leaving character alone. So a
`saboteur` career never sees an ending-effect option to be tempted by. **The consequence: no profile
in the tooling actually maximises for career-ending outcomes**, and "the upper bound on reachable
failure" has therefore never been measured, despite the comment in `policies.ts:28` claiming
`saboteur` is exactly that. Low stakes, but any future decision citing `saboteur` as a distinct
cohort is citing `lazy` under another name.

## 2. What declaring early actually costs (B32)

**Paired, identical-seed A/B.** Same seeds, same positions, same policy rng advanced in lockstep on
both arms; the single difference is which offer of the Declare card is accepted. Base profile `good`
— a player doing *everything else* optimally — so the cost measured is the cost of this decision
alone, not of playing badly.

2,400 careers per arm (400 seeds × 6 positions):

| declare at | seasons | undrafted | drafted | busted | **round 1** | round 6–7 | stock P50 | OVR P50 |
|---|---|---|---|---|---|---|---|---|
| **offer #1** | 2.00 | **22.8%** | 75.0% | 2.2% | **0.0000** | 69.2% | 41 | 72 |
| **offer #2** | 2.98 | 0.6% | 96.3% | 3.1% | **0.0000** | 25.5% | 60 | 76 |
| **offer #3** | 3.95 | 0.0% | 96.7% | 3.3% | 7.8% | 7.3% | 73 | 83 |
| **never** | 4.91 | 0.0% | 95.5% | 4.5% | **44.0%** | 0.3% | 89 | 92 |

**It is monotonic in every column that matters.** Every season you stay strictly improves undrafted
rate, round distribution, draft stock and final overall. There is no crossover, no position where it
inverts, and no arm with upside.

**The only thing staying costs you is bust risk: 2.2% → 4.5%.** That is the entire case for
declaring, and it buys 2.3 percentage points of safety at a price of 44 points of round-1
probability and 48 points of median draft stock. No risk-averse reading of that trade makes it
rational.

**Where the cost comes from — and the split matters for the fix.** `draft.ts:54` applies
`EARLY_DECLARE_PENALTY = 8` at the draft, plus 2 more from the `classPart` bonus a senior gets
(`draft.ts:16`). So the **explicit, authored penalty is 10 points**. The measured gap between "offer
#1" and "never" is **48 points of median stock.** The other ~38 points are **foregone development,
production, trophies and awards** — the seasons you did not play. The engine's deliberate tax is
about a fifth of the real cost; the rest is opportunity cost the player was never told about.

**Why round 1 is 0.0000 rather than merely rare.** `computeDraftResult` puts round 1 at stock ≥ 91.
A non-senior has 8 subtracted first, so reaching round 1 after declaring early requires a raw
`deriveDraftStock` of **≥ 99 out of a hard cap of 100**. It is not a long shot; it is very nearly
arithmetically excluded. A player who declares early cannot go in the first round.

### Verdict: trap, not gamble, not tax

- A **tax** would be a fixed, known cost with the choice still sometimes worth it. The 8 points were
  calibrated as a tax (DECISION 038) and *as a tax they work* — but they are not what decides this.
- A **gamble** would widen the outcome distribution — some careers better, some worse. It does the
  opposite: declaring early makes the best outcome unreachable while making the worst outcome far
  more likely. The distribution does not widen, it **shifts down and truncates at the top.**
- A **trap** is a choice framed as a tradeoff that has no favourable branch. That is what this is,
  and the card currently frames it as *"Cash in now."*

## 3. Proposals — written, not applied

### 3.1 B32 cannot be fixed as a presentation problem alone. This is a user decision.

The wave-14 plan was "a gamble should look like one before it is taken." **That fix is not available,
because it is not a gamble.** Making it *look* like a fair gamble would be the UI lying in the
opposite direction from today. Two honest routes, and they are mutually exclusive:

**Route A — tell the truth: it is a bad idea, and say so.** Cheapest, UI-only, no balance movement.
The Declare card stops saying *"Cash in now"* and says what leaving costs in terms the player already
has: seasons of eligibility left, and that a player who leaves early has never gone in the first
round. **No `draftStock`, no projected round** — DECISION 025 refused those by name, and neither is
needed: "you have two years of eligibility left" is a fact the player already owns.
*Consequence:* the option remains dominated, so informed players will simply never take it, and one
of the game's two offseason decisions becomes a formality.

**Route B — give it a real upside, so it becomes the gamble it is written as.** Balance change,
engine, and genuinely a user call. The missing upside is the one the fiction already implies:
declaring early should protect you from something. Today staying costs only 2.3pp of bust risk.
If the downside of staying were materially larger — injury, decline, a lost job — then cashing in
early would be a defensible read of a real risk, and the existing prose would become accurate
without being rewritten.
*Consequence:* touches `src/engine/**` and moves every seed. Larger than anything this phase has
done.

**Recommendation: A now, B only if the user wants the offseason to be a real decision.** A is small,
honest and unblocks the wave; B is the interesting game-design answer and is out of scope for a
polish phase without an explicit decision. **Falsifier for A:** a playtester who reads the reworded
card, declines, and reports the offseason as having become a non-choice — which would mean the
decision needed balance, not wording.

### 3.2 `saboteur` should be either fixed or deleted from the tooling

It is not a distinct cohort and its own header comment says it is. Either point it at the character
axis so it can actually reach the bust gates, or delete it and say in `policies.ts` that
`antisocial` is the failure-seeking profile. Low priority, but a measurement tool that silently
reports the same cohort under two names will mislead a future wave. **Not applied — `src/sim/` was
out of bounds for this brief.**

## 4. Verification

- `npm test` — **644 passed**, 38 files.
- `npm run typecheck` — both passes, exit 0.
- `git status --porcelain src/engine src/content src/ui src/sim` — **empty.**
- Every number above is reproducible with:
  - `npx tsx src/sim/failure-probe.ts 1200 <profile> all`
  - the paired A/B script in the session scratchpad (`declare-ab.ts`), `good` base, 400 seeds —
    it imports the frozen engine and content by absolute path and writes nothing.
- The `lazy`/`saboteur` identity was confirmed by running both at n=400 and diffing the full JSON
  field by field, not by eyeballing the summary table.
