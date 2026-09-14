# 030 — Undrafted is not a trophy

**Status:** done. **It was small** — two files, one branch, two CSS rules. See §6 before §2 if you
only want the size of it.

Brief: `briefs/030-undrafted-is-not-a-trophy.md`. Files touched: `src/ui/screens/SummaryScreen.tsx`,
`src/ui/styles/summary.css`. Nothing else.

---

## 1. What the display slot held, and why

The verdict block is a fixed ceremony in a fixed order:

```
  [eyebrow]   3 SEASONS · INCARNATE WORD → UTSA
  [display]   Round 5, Pick 9            <- .verdict, --milestone gold
  [detail]    #137 overall               <- .verdict-sub
  ───────
  [figure]    73  FINAL OVERALL          <- .final-ovr, --ovr chalk
```

`s.headline` (`view-model.ts:565`) fills the display slot with one of three things: a round and a
pick, the word `Undrafted`, or an ending reason. The first is a **value**. The other two are the
**absence** of that value — and they were being staged in the slot the value earns.

Measured in the live page at the 48px ceiling of `--t-display`:

| | `Round 5, Pick 9` | `Undrafted` |
|---|---|---|
| computed `color` | `rgb(240, 180, 41)` | `rgb(240, 180, 41)` |
| `font-size` | 45.12px | 34.56px |
| `font-weight` | 800 | 700 |
| `wdth` axis | 69 | 78 |
| `opacity` | 0.93 | 0.68 |
| position in block | 1st after eyebrow | 1st after eyebrow |

So the 025 playtester's three claims split cleanly. **"Same gold" is true and must stay true** —
DECISION 021 refused the chalk/gold split on this exact element by name, and 012 forbids hue tracking
valence. **"Same size and type" is already false** — 30% smaller, a weight down, twelve points
narrower, a third less ink — and it is also *not available as a lever*: DECISION 026 set those
magnitude-1 values and 032 froze them as "the washout end of the scale is the one part of this that
was already right." **"Same position" was true, and nobody had looked at it.**

Position is what makes a trophy. The screen announces whatever comes first after the eyebrow, and on
a career nobody called it was announcing the word for "no result", then quietly reporting the
player's actual final overall underneath it.

This file already rules on absent values, four elements down, in `.season-ovr`: a slot with no number
"holds its place and stays empty — the absence of a number, not a NaN and not a substituted one." The
verdict slot was doing the opposite.

## 2. How hierarchy carries the verdict, with no hue and no resize

On a no-call ending the three elements of the block run in the reverse order. Nothing else changes.

```
  drafted                          no call
  ────────                         ────────
  eyebrow                          eyebrow
  Round 5, Pick 9   (gold 45px)    61  FINAL OVERALL   (chalk 34px)
  #137 overall                     ───────
  ───────                          [61 → 52  −9]       (chalk, if the arc fell)
  73  FINAL OVERALL                ───────
                                   Undrafted           (gold 34.6px)
                                   No team called.
```

The career's own closing figure leads; the ending states itself last, which is where an ending goes.
The dividing rule moves with them: `.final-ovr` gives it up when it opens the block, `.verdict` takes
it when it closes one.

Four things this deliberately is not:

- **Not a hue.** Verified in the live page the way 026 verified its own scale: `.verdict` computes
  `rgb(240, 180, 41)` on *both* branches. No element on either branch changes colour. DECISION 021's
  refusal stands exactly where it was, and `.verdict-block.quiet .verdict` is still its named
  one-line revert point.
- **Not a resize.** Every element keeps its size, weight, width axis and opacity. 026's floor and
  032's freeze on it are untouched — which is why "make the word smaller", which the brief flagged as
  not-automatically-right, was in fact not even permitted.
- **Not a change to a good ending.** `.verdict-block` without `.quiet` — every drafted career, all
  eight magnitudes — renders in the order it always did. Confirmed in the page: child order is still
  `path, verdict, verdict-sub, final-ovr`, with `.verdict` at `border-top: 0px; margin-top: 0px`.
- **Not punitive.** The loudest thing on a no-call screen becomes a number the player already had,
  set in the chalk every other figure on the page is set in. The screen says what the career *was*
  and then says how it ended. No word was added, removed or rewritten — `headline` and `subhead` are
  still exactly the strings `view-model.ts` produces.

It also completes DECISION 032 rather than extending it. 032 inverted the hierarchy on a declining
career; the arc got promoted above the gold headline. On a **declining undrafted** career that
promotion was happening *underneath* the trophy, so the honest number still ranked second. It now
ranks first (see the third screen in §3).

## 3. The two endings, compared

Both played end to end with `npm run play -- <seed> random`, then loaded in the browser at
`localhost:5173` (the running dev server) by writing the finished `GameState` to the
`cfb-career-sim:v1:current` save key, which routes straight to the summary screen.

**Seed `s13` — drafted, Round 5 Pick 9, 3 seasons, 65 → 67 → 73.** Unchanged by this wave.

```
 3 SEASONS   INCARNATE WORD → UTSA
 Round 5, Pick 9                          45.1px  gold  w800  wdth 69  op .93
 #137 overall
 ──────────────────────────────────────
 73  FINAL OVERALL  after the off-season  34px    chalk w900
```

**Seed `s10` — undrafted, 2 seasons, 57 → 61 (a rising arc, so no arc line).** This is the pure case
the brief is about: nothing on the old screen contradicted the gold word.

```
 before                                    after
 ─────────────────────────────────────     ─────────────────────────────────────
 2 SEASONS  INCARNATE WORD                 2 SEASONS  INCARNATE WORD
 Undrafted                     <- gold     61  FINAL OVERALL
 No team called.                               after the off-season
 ──────────────────────────                ──────────────────────────
 61  FINAL OVERALL                         Undrafted                 <- gold
     after the off-season                  No team called.
```

Side by side with `s13`, the two screens now differ in shape, not just in loudness: the drafted one
opens gold and closes on a number, the no-call one opens on a number and closes gold. At a glance,
before the words resolve, they are two different objects.

**Seed `u326` — undrafted, 3 seasons, 61 → 57 → 52.** The declining no-call career, where 032's
promotion previously sat below the trophy:

```
 3 SEASONS  STEPHEN F. AUSTIN
 53  FINAL OVERALL  after the off-season
 ──────────────────────────
 OVER 3 SEASONS
 61 → 52   −9                    <- 1.2 × --t-hero, chalk, magnitude 3
 ──────────────────────────
 Undrafted
 No team called.
```

The loudest thing on the screen is now `61 → 52 −9`. That is exactly what 032 asked for and could not
reach through the undrafted branch.

The busted branch (`Career-ending injury`, `Academically ineligible`) shares `!wasDrafted` and gets
the same treatment, which is right for the same reason and needed no separate code path.

## 4. Verification

- `npm test` — **644 passed, 38 files** (baseline 636; the extra 8 are another agent's in-flight
  work, not mine — no test was added or changed by this wave).
- `npm run typecheck` — both passes exit 0.
- `npm run build` — clean, 543ms.
- `git status` — the only files modified by this wave are `src/ui/screens/SummaryScreen.tsx` and
  `src/ui/styles/summary.css`. Nothing under `src/engine/`, `src/content/`, `src/ui/session/`,
  `CareerScreen.tsx` or `career.css`. The engine and content modifications present in the tree were
  there before this wave started (baseline captured at start) and belong to the concurrent agents.
- Live-page assertions, both branches, quoted in §1–§2.
- `npm run play` byte-identity deliberately **not** used as a check, per the brief.

**One thing not screenshot-verified, stated plainly:** phone width. Another agent is driving the
shared browser window from a second tab, and resizing it would have disturbed a measurement in
progress. The change introduces no horizontal layout — it reorders three block-level elements and
moves one `border-top`/`padding-top` between two of them, and `summary.css` has no width media query
(only `prefers-reduced-motion`). At 400px `--t-display` clamps to its 34px floor, so `.verdict`
renders at 24.5px against `.final-ovr-num`'s 34px: the hierarchy this wave creates gets *stronger* as
the screen narrows, not weaker.

## 5. No view-model change is needed

The branch keys on `s.wasDrafted`, which `CareerSummaryView` already carries and
`view-model.test.ts` already covers. No diff to propose, and `GameState` is not read from the
component.

## 6. It was small

The whole fix is: name the three elements of the verdict block so they can be emitted in either
order, emit them reversed when `!s.wasDrafted`, and move one dividing rule to follow them. Two CSS
declarations blocks, one ternary. The comments around it are longer than the change, on purpose —
the reason a future agent must not "fix" this with a red or with a smaller word is the part worth
keeping.

The analysis was the work. The candidate fixes that had to be eliminated first — shrink the word
(forbidden by 026 + 032), grey the word (forbidden by 021 by name), blank the slot (reads as
hue-by-omission, and hides an ending the screen owes the player) — are why the answer looks obvious
in hindsight.

## 7. B34, noted not fixed, as instructed

Across the three careers loaded here the Moments reel showed no four-times repeat; `u326` showed
"Enjoyed the bowl trip more than the bowl game" twice, in season 1 and season 3, correctly separated
by the season grouping already in `SummaryScreen.tsx:26`. That grouping is doing its job — it makes a
real repeat legible as two different years rather than collapsing it. If the playtester's four
identical lines were all inside *one* season group, the grouping cannot help and the cause is the
content side, as the brief says. Not touched.
