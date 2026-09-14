# 016 — The ending has a range

**Type:** implementation + two measurements · **Status:** done, all three priorities · **2026-09-13**
**Verified:** 501 tests green (492 baseline + 9 added) · `npm run typecheck` exit 0, both passes ·
`npm run build` clean · `npm run play -- <seed> random` byte-identical to `HEAD` on two seeds ·
six real endings compared side by side in the browser at 1456px and at 360px.

**The answer to the brief's one hard question, up front: the magnitude axis is the DRAFT ROUND, and
both ends of it are `--milestone`.** Measured in the live page: a Round 1 verdict and an `Undrafted`
verdict both compute to `rgb(240, 180, 41)`. They differ by size (48px vs 34.6px at 1456), weight
(800 vs 700), the width axis (wdth 58 vs 78), intensity (opacity 1 vs 0.68) and entrance travel
(16px vs 3px). No `--good`/`--bad` pair was added and none is wanted; nothing in `tokens.css` was
touched, and no new token is needed.

---

## The two measurements this brief rests on

Both over **600 random-policy careers**, all six positions, driven through the engine's public API.

**Draft outcome.** This is what the five verdict steps are cut on.

| | R1 | R2 | R3 | R4 | R5 | R6 | R7 | Undrafted | Ended early |
|---|---|---|---|---|---|---|---|---|---|
| share | 2.7% | 4.3% | 8.2% | 18.0% | 21.0% | 25.0% | 15.0% | 4.2% | 1.7% |

**Honors.** This is the second finding, and it is bigger than the brief assumed.

| id | careers with ≥1 |
|---|---|
| `allConference` | **50.5%** |
| `bowlWin` | **45.3%** |
| `allAmerican` | 5.8% |
| `confTitle` | 2.7% |
| `heisman` | 0.7% |
| `cfpTitle` | 0.0% |

**The old HONORS block fired on 70.5% of all careers, and on 17.8% its entire content was
`Bowl Win`.** The playtester's 7-5 / 5-7 career was not an edge case; it was the median.

---

## 1. The draft position reads differently at a glance

`verdictMagnitude` (1–5) is computed in `view-model.ts` from `draftResult.round` and rendered as
`data-magnitude` on `.verdict-block`. Five custom properties hang off it in `summary.css` —
`--verdict-scale`, `--verdict-weight`, `--verdict-wdth`, `--verdict-ink`, `--verdict-rise` — which
is deliberately the same shape as the shipped `.consequence[data-magnitude]` set in `career.css`:
one property set, one hue, N intensities of presence.

| step | outcome | share | scale | weight | wdth | opacity | rise |
|---|---|---|---|---|---|---|---|
| 5 | Round 1 | 2.7% | 1.12 | 800 | 58 | 1 | 16px |
| 4 | Rounds 2–3 | 12.5% | 1.00 | 800 | 62 | 1 | 12px |
| 3 | Rounds 4–5 | 39.0% | 0.88 | 800 | 68 | 0.92 | 8px |
| 2 | Rounds 6–7 | 40.0% | 0.80 | 700 | 74 | 0.84 | 5px |
| 1 | Undrafted / ended | 5.9% | 0.72 | 700 | 78 | 0.68 | 3px |

**Why round and not overall pick.** Round is ordinal, it is the thing already printed in the
headline (so emphasising it discloses nothing new — DECISION 012's own test), and `Undrafted` is its
far end rather than a separate state needing a separate treatment. Overall pick is a finer axis but
it is a derived number; five steps that a player can actually tell apart beat 224 they cannot.

**DECISION 021 is extended, not overturned.** Step 1's three numbers (0.72 / 700 / 0.68) are exactly
the treatment 021 upheld. The washout end of the scale is unchanged to the pixel; what is new is
that the drafted outcomes now range *above* it instead of all sitting on one line. `.quiet` is still
on the element and `.verdict-block.quiet` still selects exactly the set step 1 covers, so 021's
named one-line revert point survives — the values simply live in the step-1 block now rather than in
two competing rules.

**The playtester's exact pair, checked:** `#69 overall` is Round 3 (step 4) and `#194 overall` is
Round 7 (step 2). Two steps apart, asserted in a test by name.

---

## 2. The furniture has stopped congratulating

### Honors

`CareerSummaryView` gains `honors: HonorView[]` — the same facts as `awards` and `trophies`,
carrying one thing neither shape could: **rarity** (1 routine, 2 rare, 3 singular), keyed on the
engine id and sorted rarest-first. `awards` and `trophies` are **unchanged**, because `share.ts`
reads them and DECISION 005 freezes the share text, and `reducer.ts` builds the log entry from them.
The share text is byte-identical.

The screen now renders:

- **rarity 2–3 → the Honors grid.** A Heisman or a national title takes the full grid width, a
  4px accent edge and `--t-title`; an All-American or a conference title keeps the existing card.
  Same `--milestone` at both sizes.
- **rarity 1 → chalk chips.** `Bowl Win ×4`, `All-Conference`, at `--t-micro` in `--chalk-dim`, in
  a bordered chip and *not* in the accent. The accent is documented as "a career fact already known
  and already on screen, given its headline" — a result 45–50% of careers get does not deserve one.
- **the heading follows the content.** `Honors` when there is a distinction; `Also earned` when
  there is not. The word HONORS no longer appears over a bowl win.

Nothing is deleted. This is DECISION 014's principle one step on: the absence of an honour is shown
as its absence, not as a smaller trophy and not as a fabricated one. **An unknown id is treated as a
distinction, not as routine** — new content should arrive loud and be demoted on evidence.

Verified in the browser on the exact shape the playtester hit: a two-season 3-9 / 8-4 career, Round
7 Pick 32, now reads `ALSO EARNED · Bowl Win` in grey. It used to read `HONORS · Bowl Win` in gold.

### The reel leading with a trophy

Measured, the trophy glyph is the **most common mark in the game**, and it is almost never on a
trophy:

| moments carrying `icon: "trophy"` | count |
|---|---|
| Carried the team through bowl season | 506 |
| Won the rivalry game | 423 |
| First to his feet when a teammate took the award | 68 |
| Kicked a walk-off field goal to win a bowl game | 15 |
| Picked off a pass in a bowl game | 12 |

The top two are routine season beats, and the third is *somebody else* winning an award.

**What shipped (display layer, ours):** `.moment-glyph` is desaturated — `filter: grayscale(1)` at
`opacity: 0.7`. The argument is not only that the reel should not open with a gold trophy; it is
that **emoji are the only uncontrolled colour on a screen whose governing rule is that hue never
tracks valence.** 🏆 is gold, 🏥 is red, 💰 is green, and none of that was designed. Desaturated, the
glyph column reads as the margin that report 011 said it should be, and the reel leads with the
season heading and the words.

**What did not ship, because content is frozen — proposal for the PM:**

> In `src/content/events/milestones.ts`, re-point three `icon` values. `Won the rivalry game` and
> `Carried the team through bowl season` should not be `trophy` — `football` and `sun` already exist
> in the glyph table and are the right register for a routine season beat. `First to his feet when a
> teammate took the award` should not be `trophy` at all; the moment is about somebody else's award,
> and `star` or `hand` fits it. Reserve `trophy` for the five-a-career moments that name an actual
> trophy. This is one line each and no balance implication; the grayscale fix makes it optional
> rather than urgent, which is why it is a proposal and not a request.

---

## 3. Short careers

Claim 5 refuted the OVR column for two seasons: "a stub with no shape at all, and the screen doesn't
acknowledge that the career was short; it uses the identical layout." Three changes, none of which
touches the block's content:

1. **The block closes.** Every `.season` row drew its rule on top, so the block ended in mid-air. A
   five-row career gets away with that; two rows read as truncated. `.arc` now has a bottom rule.
2. **`data-span="short"` (≤2 seasons) gives the rows room** — `--arc-row-pad` 0.85rem → 1.35rem — so
   two rows sit as a deliberate block rather than as the top two rows of a missing five.
3. **A closing line: `ACROSS 2 SEASONS — 60 → 62 — +2`.** First rated season to last, with the net
   on the same three magnitude tiers as the per-season delta and in the same single hue. It gives a
   short career a stated shape instead of leaving the reader to find one in two numerals, and it
   gives a long one a total (`ACROSS 5 SEASONS — 65 → 93 — +28`). Null unless at least two seasons
   actually recorded an OVR, so a one-season career and a pre-009 save get no span rather than a
   fabricated zero.

**The seasons block itself is unchanged in substance.** Same rows, same fields, same reading order,
same columns, same grid, same delta tiers. Padding, a closing rule and one appended summary row.

---

## Files changed

| File | What |
|---|---|
| `src/ui/session/types.ts` | `VerdictMagnitude`, `HonorRarity`, `HonorView`; two fields on `CareerSummaryView`. Nothing else. |
| `src/ui/session/view-model.ts` | `verdictMagnitude()`, `HONOR_RARITY` + `honorViews()`; `headline()` returns the step. |
| `src/ui/session/view-model.test.ts` | +9 tests |
| `src/ui/screens/SummaryScreen.tsx` | `data-magnitude`, `arcSpan()`, `splitHonors()`, the honors/also split, `data-span` |
| `src/ui/styles/summary.css` | the magnitude set, the arc close + span row, honor rarity, `.also` chips, glyph desaturation |

`CareerScreen.tsx`, `career.css`, `tokens.css`, `src/engine/**`, `src/content/**`, `share.ts`,
`reducer.ts`, `labels.ts` — **not touched.** `career.css`'s `.consequence[data-magnitude]` was read
for the pattern and left alone. The concurrent agent's edits to `view-model.ts` (`buildLedger`) and
`types.ts` (`LedgerRow`) merged with mine without a conflict.

---

## One thing the leak guard caught, worth recording

`HonorView`'s rarity field was first written as `tier`, and `view-model.test.ts`'s boundary test
failed instantly: `tier leaked for QB`. It is a *key-name* test, and `tier` is the school's hidden
tier. The honor field has nothing to do with schools, but **the blanket key rule is worth more than
the better word**, so the field is `rarity`. The guard did exactly its job on a field that was
genuinely harmless — which is the case where a blanket rule earns its keep.

---

## Verification

- `npm test -- --run` → **501 passed, 35 files, 0 failed** (492 baseline, +9 mine).
- `npm run typecheck` → exit 0, both passes. `npm run build` → clean, 21.76 kB CSS / 380.06 kB JS.
- **Seed stability.** `git archive HEAD` extracted to a scratch dir, then `npm run play -- <seed>
  random` run in both trees for seeds `1ft6t7` and `polish-016`: `diff` reports **identical** for
  both. (The sim never imports `src/ui`, so this was expected; it is checked rather than argued.)
- **Six real endings, side by side** at 1456px, seeded into `localStorage` from careers played
  through the engine:

  | fixture | outcome | step | what it proves |
  |---|---|---|---|
  | `m87` DL, 5 seasons | R1 #10 | 5 | the loud end; `HONORS · All-American` + two chalk chips |
  | `m294` QB, 4 seasons | R2 #54 | 4 | the rarity ladder: Heisman card > All-American card > `Bowl Win` chip |
  | `m0` QB, 5 seasons | R3 #81 | 4 | `ALSO EARNED` (no distinction), span `62 → 78 +16` |
  | `m3` DL, 2 seasons | R7 #195 | 2 | short layout, no honors block at all |
  | `m13` OSKILL, 2 seasons | R7 #224 | 2 | **the playtester's career**: `ALSO EARNED · Bowl Win`, span `60 → 62 +2` |
  | `m29` K, 2 seasons | Undrafted | 1 | the quiet end, same hue |

- **Hue, measured in the page, not asserted in prose:** `.verdict` computes `rgb(240, 180, 41)` at
  step 1 and at step 4. Identical.
- **360px:** checked by pinning `--t-display` to what `clamp(--t-hero, 7vw, 3rem)` resolves to at a
  360px viewport (34px — the clamp floors there) and constraining the frame, because this
  environment renders at a fixed 1400px viewport regardless of window size. Zero elements exceed the
  frame on the loudest fixture; `Round 1, Pick 10` at step 5 is 38.08px and stays on one line.
- **`localStorage` cleaned.** The origin held another agent's in-progress career (seed `1u2op9`) and
  a `tmp015:backup` key. The current save was backed up before I wrote anything, restored
  afterwards, my `tmp016:backup` key removed, and `tmp015:backup` left untouched. The career log was
  not polluted (a restored terminal state does not re-settle). My tab is closed; the other agent's
  is as it was. Fixtures were staged in `node_modules/.cache/tmp016/` so they were never visible to
  `git status`, and that directory is deleted.

---

## Notes for the PM

1. **A decision is owed on the verdict scale**, in the shape of DECISION 021 extended to five steps.
   The substance: hue is constant, five steps on scale/weight/width/opacity/motion, cut on the
   measured round distribution, step 1 identical to 021's values. *Would change our mind:* a
   playtester who still cannot rank two drafted endings at a glance — in which case the lever is the
   scale spread (1.12 → 0.72 today), not a second hue.
2. **The honors split is the more opinionated call of the two** and deserves a decision line, since
   it changes what the word HONORS means: distinctions only, routine results as chalk chips, and a
   content-dependent heading. The counter-argument is that a bowl win *is* an achievement to a real
   player and demoting it is us editorialising. My answer is the measurement: at 45.3% it is not a
   distinction, and the screen that says otherwise is the screen a playtester answered "no" to a
   fourth career on.
3. **Content proposal, one line each:** re-point the `trophy` icon on `Won the rivalry game`,
   `Carried the team through bowl season` and `First to his feet when a teammate took the award`.
   See §2. Not urgent now that glyphs are desaturated.
4. **Not my brief, but the measurement is sitting right here and the playtester raised it:
   "I could not lose" is confirmed.** 98.3% of random-policy careers are drafted; only 4.2% go
   undrafted and 1.7% end early. The gamble framing has a 5.9% downside. That is a balance question
   for the engine owner, not a display one, and no UI change can manufacture a stake that the model
   does not have.
5. **A pre-existing inconsistency my span row sits next to.** Claim 5's third bullet: the verdict's
   `FINAL OVERALL` (post-offseason development, `state.overall`) can differ from the last season's
   stored OVR — 80 vs 78 on the `m0` fixture. The new span line reads `62 → 78`, so the gap is now
   stated twice on one screen rather than once. It is honest and the labels are accurate, but it is
   a real confusion and it is not mine to fix from the display layer: closing it properly means
   either recording a post-development OVR on the final `SeasonLine` (engine) or labelling the
   difference in words. **Recommend it goes in the next playtest brief as a direct question** rather
   than being guessed at.
6. **No new token was needed.** Every value on the screen comes from the existing role and ramp
   layers. `tokens.css` was not opened for edit.
