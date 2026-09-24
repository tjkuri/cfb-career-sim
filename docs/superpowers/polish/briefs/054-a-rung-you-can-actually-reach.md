# 054 — A rung you can actually reach

Repo: `/Users/tkuri/Documents/personal_projects/cfb-career-sim`
Branch: `polish/ui-phase`. Tree clean, **728 tests green**, dev server on `localhost:5173`.

## Goal

Recalibrate `TRUST_BANDS` so the top rung of the trust ladder can be **earned by sustained virtuous
play and not by anything else**, and so a starting player no longer falls a rung on a single −1.

Two numbers change. Then you **measure the reach rate** and report it, because the whole point is that
nobody has ever measured this one.

## Why

A playtester played three careers, deliberately chased the top rung by name in the third, and never
moved up once — while moving **down on decision 2**. Their framing is correct: *"The display is not the
problem. The asymmetry is."*

The cause, measured over 7,200 careers and written up as **DECISION 080** (read it first):

```
STARTING_CHARACTER (src/engine/create-career.ts:8) = 70   <- frozen, and it does NOT need to move

TRUST_BANDS (src/ui/session/bands.ts:73)
  85  "they would run through a wall for you"     +15 from start   <- unreachable by ANY policy
  70  "the staff trusts you"                       START IS EXACTLY THE FLOOR  <- -1 drops a rung
  50  "just a guy in the building"
  30  "a problem they are managing"
   0  "the staff has stopped defending you"
```

**A fall costs 1 point. A climb costs 15. Maximally virtuous play returns a median +6 and a
best-in-sweep p95 of +14.** Not one of 18 profile×position cells reaches 85.

## The measured distribution you are calibrating against

Final character, 400 runs per cell, all six positions, from `src/sim/virtue-probe.ts`:

| profile | p05 Δ | median Δ | p95 Δ | avg final | final range (p05 → p95) |
|---|---|---|---|---|---|
| `virtueAmbitious` | −4 | **+6** | **+14** | 75.5 | 66 → 84 |
| `virtueLoyal` | −3 | **+6** | +12 | 75.3 | 67 → 82 |
| `good` | −10 | +1 | +10 | 70.3 | 60 → 80 |
| `baselineRandom` | −67 | −26 | −6 | 41.0 | 3 → 64 |
| `lazyFull` | −67 | −33 | −11 | 35.1 | 3 → 59 |
| `saboteurFull` | −68 | −33 | −11 | 34.9 | 2 → 59 |

**The downward half of this ladder is already well-used and the playtester confirmed it reads well** —
the callout box naming the rung you left was singled out as *"large, clear, well-designed."* **Do not
redesign the bottom.** The defect is at the top and at the start boundary.

## The change

```
  80  "they would run through a wall for you"    (was 85)
  66  "the staff trusts you"                     (was 70)
  50  "just a guy in the building"               unchanged
  30  "a problem they are managing"              unchanged
   0  "the staff has stopped defending you"      unchanged
```

**The reasoning, so you can challenge it rather than implement it blind:**

- **80** puts the climb at **+10** from a start of 70 — above virtue's median (+6) and inside its upper
  tail (p95 +12 to +14). It should be reached by a minority of genuinely virtuous careers and
  essentially never otherwise. `good` touches 80 only at its extreme p95.
- **66** puts **4 points of buffer** between a starting player and a fall. The smallest character
  effect in the bundle is 1, so a single bad card can no longer move the marker, while a mercenary
  career (median final 35–41) still falls through every rung below.
- The PM derived both from the table above. **They are a starting point, not a specification.** If your
  measurement says a different pair serves the stated goal better, **propose it with the numbers and
  say so** — that is a better outcome than implementing these.

## What you must measure, and it is the point of the lane

Run `src/sim/virtue-probe.ts` (or extend it) and report, per profile and per position:

1. **The rate at which each rung is occupied at career end**, under the old bands and the new ones,
   side by side.
2. **The top-rung reach rate specifically.** Target shape: a **minority** of `virtueLoyal` and
   `virtueAmbitious` careers, **near-zero** for `good`, **zero** for `baselineRandom`, `lazyFull` and
   `saboteurFull`. Report the actual numbers. **If the top rung comes out reachable by more than half
   of virtuous careers, it is no longer rare and the threshold is wrong — say so and propose the
   number that fixes it.**
3. **The rate at which a player's *first* rung change is downward**, old versus new. The playtester's
   first rung move came on decision 2; that is the specific experience this is meant to end.
4. **How many rung changes a career sees at all**, old versus new, per profile. A ladder nobody ever
   moves on is the failure mode on the other side of this fix.

**Non-vacuous rule, and this board reverted an approved engine fix over it:** this change is
*supposed* to move the numbers. Byte-identity on the rung-occupancy table is a **failure**, not a
pass. Hunt the difference; if you cannot find it, the change is not doing what it says.

## Hard constraints — design intent, not preferences

- `overall` **is** shown as a number. `character` is **never** shown as a number, only as a band
  phrase. **`TRUST_BANDS` is exported as phrases only and nothing downstream may reach a threshold, a
  count or a `character` value through it** — `bands.ts` says so in its own header and that must stay
  true. You are changing two integers inside that boundary, not opening it.
- Never display: school tier or any badge implying it, `draftStock`, event `probability` or `weight`,
  EV, or school trait names. Traits are discovered by replaying, never stated.
- `src/engine/**` and `src/content/**` are **frozen.** `STARTING_CHARACTER` is engine and **does not
  move** — the bands move around it. If you believe engine or content must change, write a proposal in
  the report; do not edit.
- **This is display calibration and must not change balance.** `character` swings draft stock
  identically whatever the ladder says. Confirm that: draft stock, undrafted rate and bust rate must
  come back **unchanged** by this diff. That check is the mirror image of the non-vacuous rule above —
  here identity **is** the pass.
- `src/ui/session/view-model.ts` is the only module allowed to read `GameState`.
- **728 tests stay green.** Both `npm run typecheck` passes exit 0. Any test asserting an old threshold
  is describing the old calibration — update it and **name it in the report**.
- Aesthetic direction is fixed: dark theme, clean sans-serif, card-based, generous whitespace, minimal
  chrome, the decision and its options are the clear focal point.
- **Another agent owns the one-option card defect (B82) this wave.** It does not touch `bands.ts`,
  `reducer.ts` or the summary screen. Stay out of `src/content/**` and the event-outcome path.

## Verify before reporting

- `npm test` (728 green, or more with every changed test named) · `npm run typecheck` both passes ·
  `npm run build`
- **Click through at `localhost:5173`** and confirm with your own eyes that a rung change still renders
  its callout correctly, and that the summary ladder marks the right rung.

## REPORT

Write findings to `docs/superpowers/polish/reports/054-a-rung-you-can-actually-reach.md`.
Return to the PM **only**: status (done / blocked / needs-decision), **at most five bullets**, and that
path. Never the full findings — it is the single biggest lever on the PM's context size.

Use `superpowers:test-driven-development` and `superpowers:verification-before-completion`.
