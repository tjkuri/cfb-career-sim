# 011 — The summary screen learns from its own best block

**Type:** implementation + one measurement · **Status:** done · **2026-09-13**
**Verified:** 488 tests green · `npm run typecheck` exit 0 (both passes) · `npm run build` clean ·
clicked through at `localhost:5173` on a drafted career, a busted career and a simulated
pre-DECISION-009 save.

All three priority items are done. Nothing was left partial.

---

## Headline

The seasons block now has the column DECISION 009 crossed the frozen-engine line to make possible:
a right-hand OVR arc reading **62 → 67 → 72 → 68**, with the season-over-season delta beside it. The
block itself was not rewritten — the same rows, the same content, the same reading order; the only
structural change is that the row is a grid instead of a wrapping flex line, because numbers that do
not line up are not an arc.

The moments timeline turned out **not to have a dedupe bug**. Measured over 700 careers, every single
repeated moment string is the same moment earned in a *different season* — 980 repeats, 980 of them
cross-season, zero same-season, zero pushed twice by one `advance()`. The playtester's "three
identical trophies" were three real trophies with the year filed off. It is fixed by grouping, not by
collapsing, which is the branch the brief asked me to take if the measurement came out this way.

---

## 1. The career arc

### What was missing

`SeasonLine.overall` and `SeasonLine.classYear` have existed since DECISION 009 landed. `seasonViews`
in `view-model.ts` copied across neither: `classYear` was hardcoded `null` and `overall` had no slot
on `SeasonView` at all. The most-praised read in the reference game was one field away and nothing
rendered it.

### What changed

- `SeasonView` gains `overall: number | null` and its `classYear` is now populated from the stored
  line rather than nulled. (`src/ui/session/types.ts` — **only** `SeasonView` and `MomentView` were
  touched in that file, as instructed. `Resolved`, `SeasonStamp` and `CareerView` are exactly as the
  concurrent agent left them; my edits and theirs merged without a conflict.)
- `seasonViews` reads both through `storedOverall` / `storedClassYear`
  (`src/ui/session/view-model.ts`), which are deliberately defensive.
- `SummaryScreen` renders the arc as a third grid column, right-aligned, 900-weight tabular numerals
  on `--ovr`, with a class-year label in the first column.

### Old saves

Three separate failure modes are handled, and all three are tested:

| Stored value | Rendered |
|---|---|
| a real integer | the number |
| **field absent** (pre-009 save) | nothing — the cell holds its width and stays empty |
| `NaN` or `null` (a bad serialization) | nothing |

`storedOverall` uses `Number.isFinite`, not a truthiness check, so a legitimate `0` would still
render and a `NaN` would not. `classYear` falls back to `null`, and the row then labels itself `Y1`,
`Y2`… by sequence — which is DECISION 015's **option 2** applied locally: sequence labels are the
safe default when the stored class year is not there. When no row in the career has an OVR, the
`OVR` column header is not drawn at all, so a legacy save does not get an empty labelled column.

I verified this in the browser, not only in a test: a real four-season drafted career with
`overall` and `classYear` deleted from every line renders `Y1 Mercer / Y2 North Texas / Y3 SMU /
Y4 Baylor`, full records, snaps and stat lines, no arc column, no `NaN`, no `undefined`.

### The delta

Each row after the first shows the season-over-season change (`+5`, `−4`). This is DECISION 012's
permitted half, applied literally:

- It is derived from a number **already on screen** in the row above it, so it discloses nothing.
- **Scale and weight track magnitude**: three tiers at |Δ| ≥ 6, ≥ 3, and below.
- **Hue does not track direction.** `+9` and `−9` render in the same colour at the same size. There
  is no green and no red anywhere on this screen.
- Zero is not rendered. A season that moved nothing says nothing rather than printing `±0`.

Note for whoever reads the screen next: the final overall (70 in my fixture) can differ from the last
season's stored OVR (68), because offseason development happens after the line is finalized. That is
honest and the labels say so — `FINAL OVERALL` under the verdict, `OVR` over the season column.

---

## 2. The moments — measurement first

### Method

Drove the engine's own loop (`createCareer` → `getDecision` → `advance`) and recorded, per career:
the `moments` array, the season index of each entry, and — critically — `moments.length` **before and
after every single `advance()`**, so a moment pushed twice for one event would be caught at the point
of the push rather than inferred from the final array.

Two cohorts, three policies:

- **Full four-year career** (n=300, all six positions): never declares early, never redshirts, never
  transfers; everything else random. This reproduces the shape the playtester actually played.
- **`random` policy** (n=400): the wider net the balance harness uses.
- `first-option` (n=300) as a sanity check; those careers are short and carry almost no repeats.

### Numbers

| | Full 4-year (n=300) | `random` (n=400) |
|---|---|---|
| Moments per career (median) | **8** | 4 |
| Distinct items per career (median) | **5** | 3 |
| Careers with ≥1 repeated item | **94.7%** | 49.5% |
| Redundant entries as a share of all entries | **29.1%** | 18.8% |
| …of which **cross-season** | **656 / 656 (100%)** | **324 / 324 (100%)** |
| …of which **same-season** | **0** | **0** |
| **Duplicates pushed by one `advance()`** | **0** | **0** |
| Max repeats of one item in a career | 4 | 4 |

The full-career median (8 moments, 5 distinct) reproduces the playtester's list exactly.

Top repeaters, full cohort: *Had the time of his life at a bowl game* (repeats in 217/300 careers),
*Carried the team through bowl season* (120), *Won the rivalry game* (103). All three are bowl/rivalry
milestones — the fixed season skeleton DECISION 017 already identified. Everything below them is in
single digits.

### Verdict: there is no dedupe bug

**The repeats are real.** Winning the rivalry game in three different years is three facts, and
collapsing them into one line deletes three years of a career. What made them read as "an event log"
is that the list dropped `seasonIndex`, which `MomentView` has carried since it existed.

Note the playtester's "two catfishings" were never exact duplicates at all — they are two *different*
outcome strings of the same event (`Got catfished, handled it like a champ` and `Weathered a
catfishing saga`). Nothing at the display layer can or should merge those.

### What shipped

- **Grouping.** `SummaryScreen` groups the timeline by season, with a `SEASON 3 · JR` heading per
  group. Three bowl games now read as three years, which is what they are.
- **The one real bug shape is still guarded.** `momentViews` merges an item repeated *within a single
  season* into a `count`, rendered as `×2`. This never fires on any measured career — it exists so
  that if an event ever pushes its moment twice, the screen shows `×2` instead of two identical rows,
  and the test that asserts it constructs that state by hand.
- **Nothing is lost.** A test asserts `sum(view.moments[].count) === state.moments.length` across
  every position, so grouping and merging can never silently drop an entry.

The emoji glyphs were left alone. They are the minor half of B6 and the board said dedupe first; with
the list grouped, the glyph column reads as a margin rather than as the content.

---

## 3. Raising the rest of the screen

### The verdict

Was: one line at ~2.4rem, gold if drafted and plain chalk if not, with the school path and the final
OVR as two undifferentiated grey lines beneath it.

Now a block with a ladder — eyebrow → headline → subhead → the number:

```
4 SEASONS   MERCER → NORTH TEXAS → SMU → BAYLOR
Round 5, Pick 14
#142 overall
─────────────────────────
70  FINAL OVERALL
```

- The headline runs to `clamp(2.6rem, 11vw, 4.2rem)` at wdth 62 / weight 800 on `--milestone`, with
  an entrance keyed to `--dur-enter` (DECISION 012's documented attachment point), guarded by
  `prefers-reduced-motion`.
- The final overall is now a 900-weight numeral on `--ovr` instead of the caption it was.
- The school path became the eyebrow, which is where context belongs relative to a headline.

**On DECISION 012 and the drafted/undrafted pair — this is the one thing I would flag for review.**
The old code set a drafted verdict in `--milestone` (gold) and a non-drafted one in `--chalk`. I read
that as a hue tracking valence and changed it: **both are now `--milestone`**, and the non-drafted one
is distinguished by being smaller (`clamp(2rem, 8vw, 3rem)`), lighter (700 vs 800) and dimmed with
`opacity: 0.68`. Opacity keeps the hue identical while removing presence, which is exactly "quieter,
not recoloured". Verified side by side in the browser: `Round 5, Pick 14` and `Academically
ineligible` are unmistakably different in weight and unmistakably the same colour.

### Honors

Was a bare `<ul>` set smaller than the stat labels underneath it. Now an auto-fitting grid of cards
on `--card` with a `--milestone` tick down the left edge, the label at 700 condensed in `--milestone`,
and the count as a `×2` chip. `--milestone` is documented for exactly this — "a career fact already
known and already on screen (drafted, an award) given its headline."

### The share block and the buttons

- The share **text is untouched** (DECISION 005). Same `shareText()`, seed line intact. Only its
  presentation changed: it now sits under a `SHARE THIS CAREER` heading with Copy beside it.
- **The button priority is flipped.** B5: *"the primary gold button at the bottom is Copy career. New
  career — the thing I actually wanted — is the ghost button next to it."* `New career` is now the
  filled accent button in its own action row at the foot of the page; `Copy career` is a ghost that
  lives with the block it copies. Given that the north star is three careers in a row, the screen
  that sells career #2 should ask for one.

### Two collisions with the concurrent DECISION 019 work, both absorbed

The context-rail agent rewrote `career.css` while I was in the browser, and two of its changes broke
the summary — both correctly, and both fixed on my side of the line:

1. **`.rail` became a column of `.rail-line` rows.** The summary's rail markup was the old flat
   shape, so the name and the position stacked. Fixed in `SummaryScreen.tsx` by wrapping them in a
   `.rail-line rail-id`. The summary's rail carries identity only — the career is over, so there are
   no season cells to hold open.
2. **`.continue` gave up the accent to the option rows** (B4's fix — the least consequential control
   should not be the loudest). That is right during play, and it silently turned my `New career`
   button into an outline. Switched to `.primary`, which is `--action` — the token documented as "the
   one button that moves the career forward". Nothing is being chosen on this screen, so the accent
   is free. `.summary-actions .primary` only overrides width and padding.

I did not edit `career.css`, `tokens.css`, `App.tsx`, `reducer.ts`, `ledger.ts` or `CareerScreen.tsx`.
No new token was needed; every value on this screen comes from the existing role layer
(`--milestone`, `--ovr`, `--action`, `--emphasis`'s duration siblings, the chalk ramp, the card ramp).

---

## Files changed

| File | What |
|---|---|
| `src/ui/session/types.ts` | `SeasonView.overall`, `SeasonView.classYear` populated, `MomentView.count`. **Nothing else in the file.** |
| `src/ui/session/view-model.ts` | `storedOverall` / `storedClassYear`, `seasonViews` carries both, `momentViews` merges within-season duplicates into a count |
| `src/ui/session/view-model.test.ts` | +9 tests (arc, legacy saves, NaN saves, moments) |
| `src/ui/screens/SummaryScreen.tsx` | arc column + delta, verdict block, honors cards, season-grouped moments, share/action split, `.rail-line` fix |
| `src/ui/styles/summary.css` | rewritten around the above; no token file touched |

---

## Verification

- `npm test -- --run` → **488 passed, 35 files, 0 failed.** The brief's baseline was 444; the tree has
  moved under concurrent work. I added 9. **No failures in any file, mine or anyone else's.**
- `npm run typecheck` → **exit 0**, both passes (`tsconfig.engine.json`, then `tsconfig.json`).
- `npm run build` → **exit 0**, clean, 14.16 kB CSS / 376.52 kB JS.
- Browser, `localhost:5173`, 1456px and again with the frame constrained to 360px (no horizontal
  overflow at either; no element exceeds the frame):
  - **Drafted**, four seasons, three schools, four honors — arc `62 / 67 / 72 / 68` with `+5 +5 −4`,
    honors grid, moments grouped across four seasons including three separate bowl-game entries.
  - **Busted** (`Academically ineligible`), two seasons — quiet verdict, same hue, no honors section,
    two moment groups.
  - **Pre-DECISION-009 save** (both fields stripped from a real career) — `Y1…Y4` labels, no OVR
    column, no `NaN`, everything else intact.

The seasons block's own content was not rewritten. School, record, snaps and the position-aware stat
line are the same fields in the same order; the stat *values* are now bolded against their labels,
which is the only typographic change inside the block.

---

## Notes for the PM

1. **The drafted/undrafted hue change is a judgement call I'd like reviewed** (see §3). I moved the
   non-drafted verdict from `--chalk` to a dimmed `--milestone` on my reading of "may not be set in a
   different hue from a drafted one". If the intent was that gold-vs-chalk is fine because chalk is
   the neutral rather than a second hue, reverting is a one-line change in `summary.css`
   (`.verdict-block.quiet .verdict`).
2. **No engine or content change is needed or proposed.** DECISION 009's two fields were sufficient;
   the arc needed no third field, and the moments finding needs no content edit.
3. **`localStorage` on `localhost:5173` was used for the visual verification** — I seeded finished
   careers into `cfb-career-sim:v1:current` and cleared both keys when finished. If another agent had
   an in-progress career parked in that origin, it is gone. Nothing in the repo was affected.
4. **DECISION 015 / brief 010 interaction:** when a stored class year is missing, the arc labels the
   row by sequence (`Y1…Y4`) rather than guessing — the same shape as DECISION 015's option 2. If the
   ledger brief lands on a different scheme for redshirt rows, the summary's fallback is a single
   expression in `SummaryScreen.tsx` and should follow it.
5. **Measurement harnesses** are in the session scratchpad, not the repo. They reproduce from the
   engine's public API in about 40 lines if the numbers ever need re-running.
