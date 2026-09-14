# 029 — The empty room

**Type:** layout · **Wave:** 13 · **Status:** complete
**Code changed:** `src/ui/screens/CareerScreen.tsx`, `src/ui/styles/career.css` (nothing else)

Verified in the running app at 1456×824, 1920×1080, 1280×800, 1024×800, 768×900, 400×860 and
360×780 — a real viewport at each size, measured with `getBoundingClientRect()`, not reasoned off the
CSS. 120 cards across 5 careers were played to see a plain decision, a resolved card with the tall
account block, a transfer hub and the ending.

> Measurement note: `resize_window` reports success and does not resize this browser (the same
> failure report 002 hit). The app was therefore run inside a same-origin iframe sized to exactly
> 1456×824 and visually scaled down — a real layout at a real viewport, with exact rects read from
> the iframe's own document. Every number below is from that document.

---

## The numbers

| | before | after (1456×824) |
|---|---|---|
| Band width | **760px**, centred | **1016px**, centred |
| Dead black, left / right | **348 / 348** | **220 / 220** |
| Band as share of viewport | 52% | **70%** (the reference's own shell measures 69%) |
| Card bottom | y=567 | y=567 (plain) — **unmoved** |
| Black below the card, right column | **257px** | **0** — the column ends at y=760, which is exactly where `.app`'s 4rem bottom padding starts |
| The ledger | 224 × 273 at (884, 76) | **480 × 720** at (756, 40) |
| The void under the rail | **224 × 475** | gone; see "what went into it" |
| Vertical scroll | none | none (120/120 cards; tallest card bottom y=644, 180px of headroom) |

Other widths: gutters 132px at 1280, 452px at 1920, 20px at 1024 (the band compresses gracefully
from 1016 to 984 between 1024 and 1080px of viewport, taking the prose measure from 480 to 464 —
the only place in the range where the decision column is not exactly `--measure`). No horizontal
overflow at any width tested, including 360px.

---

## What I took from the reference, and what I did not

Read: `reports/002-reference-teardown.md` §1 and §2.

### Adopted

* **The fixed-length table whose rows do not change height as it fills.** At desktop every row is
  the height of a *played* row (`min-height: 3.75rem`), so the table is the same ~315px block in
  season 1 as in season 5. This is the reference's "an empty slot you can see", and it is what
  DECISION 007 actually wanted: a table that grows as it fills moves the how-much-is-left signal out
  from under the player. Before this, a future row was 38px and a played row 60px, so the block
  silently grew by 110px over a career.
* **The play-shell proportion.** 1016/1456 = 70%; the reference's live shell measured 990/1440 =
  69%. Arrived at from the content rather than copied — see "adapted" below.
* **The three row states as background steps, never as text.** Unchanged; it was already right.

### Adapted

* **Height-locked → height-filled.** The reference's shell is `h-[calc(90svh)] … overflow-hidden`.
  I did not adopt `overflow-hidden`. The resolved card grew this wave — a `THIS CARD` /
  `EVERYTHING ELSE` split, a character line and an injury note can all land on one card — and the
  tallest one measured over 120 cards is 386px, bottom at y=644. A locked shell would clip it, and
  025 found *zero* clipping to preserve. Instead the right-hand column carries
  `min-height: calc(100svh - 6.5rem)` (6.5rem is `.app`'s own 2.5rem top + 4rem bottom padding, and
  the top clamp is at its ceiling across this whole breakpoint). The room is always at least a
  screen tall; a card that outgrows it pushes the page rather than being cut.
* **0.85fr / 1.15fr → one `--measure` each.** The reference gives its ledger 56% of the shell
  because that ledger is twelve rows of six columns. Ours is five rows, and the hard constraint is
  that the decision stays the focal point. Two equal columns of 30rem, 3.5rem of gutter on each side
  of a hairline: `calc(var(--measure) * 2 + 3.5rem)` = 1016px. The decision column is *still exactly
  `--measure`* — nothing in the left column moved in this pass, at any width. The card keeps focal
  weight by treatment (it is the only filled, bordered surface on the screen), not by area.
* **`max-w-7xl` (1280px) → 1016px, fixed.** The band does not grow past two measures. A fluid band
  would only stretch a five-row table; the left column is a measure by definition and the right
  column's content does not want more than one either.
* **A column rule instead of a column of air.** The reference separates its columns with `gap-6` and
  nothing else, because both its columns are full of content to the floor. Ours are not, so the
  right column carries a 1px `--line` left border running floor to ceiling. This is the half of the
  fix that is not about width: a column of air with a defined edge is a column; the same air with
  nothing at its edge is the void the playtester filed. One hairline, in the vocabulary every other
  division on this screen already speaks.

### Rejected

* **Stretching the five ledger rows to fill the column** (`lg:grid-rows-[repeat(12,minmax(0,1fr))]`).
  Twelve rows over 609px is 51px each — a table. Five rows over 720px is 144px each — padding
  dressed as structure. The reference fills its column because it has twelve rows; we have five.
* **`auto-rows-fr` option cells, and stretching the card to the floor.** Distributing ~200px among
  two option rows turns a fork into a pair of billboards, and a card stretched to the floor would
  put the Continue button 200px below the sentence it answers.
* **Vertically centring the decision card in its column.** It would use the room, and it would move
  the card's top edge every time the card changed height — including between a decision and its own
  outcome. That is precisely the reflow DECISION 019 exists to stop, and the card top is currently
  pinned at y=255 for every card in the game. Not worth the room.
* **The reference's per-outcome images.** B10, out of scope, no art, and 025 confirmed the room is
  empty independent of it.

---

## What went into the void under the rail

The playtester named it: *"the season stat detail the ending screen already knows how to lay out"*.
The career ledger and the summary's `Seasons` block were always the same table — the ledger was just
that table with four of its six columns thrown away, which is why it fitted in 224px. The row now
carries what the ending screen's row carries, using the ending screen's three-column shape
(year / body / figure) and its reading order:

```
                                        OVR AT SEASON'S END
YEAR 1   Stephen F. Austin                                60
         FR   2-10   443 snaps
YEAR 2   Villanova                                        64
         SO   3-9    623 snaps                            +4
YEAR 3   Incarnate Word                                   71
         JR   6-6    650 snaps                            +7
YEAR 4   Stephen F. Austin              ← current, lifted
         SR
YEAR 5                                 ← future, dashed, open edge
─────────────────────────────────────────────────────────────
                     (deliberate air — see below)
─────────────────────────────────────────────────────────────
ACROSS 3 SEASONS                        60 → 71        +11
```

Three additions, all of them facts already on `CareerView.ledger`:

1. **Snaps.** `LedgerRow.snaps` existed and was never drawn.
2. **The season-over-season OVR step** (`+7`), derived in the screen from the previous *rated* row.
   This is the arc the 017 playtester called the best thing in the game, and the game was keeping it
   until the career was over.
3. **`Across N seasons  60 → 71  +11`** — the summary's closing `.arc-span`, said mid-career, in the
   same words and the same three cells. Null until two seasons have actually recorded an OVR: one
   season is not an arc, and a span invented from a single number would be the fabrication
   DECISION 014 forbids everywhere else in this table.

**No view-model change was needed and none was made.** The screen reads nothing new.

Four rules the new row keeps, all of them pre-existing and all of them easier to break now that the
row says more:

* **No OVR and no step on the current row.** `advance.ts:285` stamps the in-progress line with the
  OVR it *started* at; a step against it would be a season old (DECISION 019).
* **No record on the current row.** `0-0` is the absence of a record, not a value for it
  (DECISION 014).
* **No snaps on the current row.** This one is new, and it is the reason the row is not simply the
  summary row. Snaps accumulate live, and the rail two columns over is *frozen* to the card being
  read (DECISION 019) — so the two cells would print different snap counts for the same season every
  time an outcome was on screen. Verified on screen: `595 snaps` in the rail, nothing in the current
  ledger row, `595 snaps` in that row once the season closes.
* **The dashed fifth row keeps its open edge.** The table gained a closing rule (the summary's
  `.arc` idiom — a block that is mostly future rows otherwise ends in mid-air), but the rule is on
  `.ledger-row:last-child:not([data-tentative="yes"])`, so while slot 5 is an unspent redshirt the
  table still stops under a dashed rule with nothing below it. A closing rule under that row would
  draw exactly the promise DECISION 010 refuses to make. Verified both states.

No type, colour or contrast was reopened. Every size and every token in the ledger is one the file
already used: `--t-micro` for the year label, the meta line and the step, `--t-meta` for the school,
`--t-label` at `--w-figure` for the OVR, `--chalk-dim` for the row and `--chalk` promoted on played
figures. The column head is the summary's `.arc-head-ovr` verbatim. What changed is how many of the
facts the row already held are drawn.

---

## The tall resolved card

Measured over 120 cards / 5 careers at 1456×824, every consequence shape the wave can produce
(`outcome`, `+locker-room`, `+delta`, `+delta-else`, `+account-note`, `move`):

* card heights **221 → 386px**, top edge pinned at y=255 for all of them, bottom edge **476 → 644**.
* **Zero vertical scroll**, in all 120. The 4-part consequence
  (`outcome|locker-room|delta|delta-else`) bottoms out at y=644 — 180px of headroom against an
  `overflow: hidden` that is deliberately not there.
* The card is untouched by this wave: same width (480), same margins, same position. The whole
  change is on the other side of the rule.

## Phone width

360px and 400px both survive unchanged in structure: one column, DOM order decision-then-ledger, so
the table still lands below the card rather than pushing it off the fold. Document width equals
viewport width at both (no horizontal overflow). The ledger block grows from ~273px to ~285px — the
rows gained a line of content but not the desktop row minimum, which stays at one text row
(`2.35rem`): four tall empty slots at phone width would be four screens of scroll earning nothing.
Rows measure 38–48px. The school name still truncates rather than wraps.

## What is deliberately left empty, and why

1. **The left column below the card — 180 to 280px.** The decision is the focal point and it is
   sized by its content. The two ways to fill it (stretch the card, or centre it) are the two moves
   rejected above. This is now margin around the focal element rather than the page running out,
   because the room has a floor: the rule and the ledger column reach it.
2. **The right column between the table's closing rule and the arc foot — 330 to 380px.** Bounded
   above by the table's rule, below by a foot rule and the career-to-date line, and on the left by
   the column rule. Air inside a frame is whitespace; the same air with three open sides was the
   void.
3. **220px of gutter each side at 1456 (452px at 1920).** The band is capped at two measures. This
   is a game read at a measure, not a dashboard that grows to whatever monitor it is on.

Empty (1) is the one I would revisit first if it still reads as a void in the next playtest — the
honest fix is content, not stretch, and the obvious candidate is the option cards earning the
reference's image slot once there is art (B10).

---

## View-model diff, if the PM wants the last column

Not needed for anything above; the screen is complete without it. The one thing the ledger row still
cannot draw that the summary row draws is the per-season stat line (`Pass Yds 1,504  Pass TD 12
INT Thrown 3`). `SeasonView` has `stats`; `LedgerRow` does not. It would add ~18px to each played
row and would take roughly 70px out of empty space (2) above.

```diff
--- a/src/ui/session/ledger.ts
+++ b/src/ui/session/ledger.ts
@@ interface LedgerRow
   /** The OVR the season ended at. Null, never NaN, on a pre-009 save. */
   overall: number | null;
+  /** The season's counted stats, exactly as `SeasonView.stats` carries them.
+      Empty on a future row and on the current row -- they accumulate live and
+      the rail is frozen to the card being read (DECISION 019). */
+  stats: StatView[];
@@ function emptyRow
     overall: null,
+    stats: [],
@@ buildLedger, in the `for (const line of input.seasons ?? [])` loop
     row.overall = finiteOrNull(line.overall);
+    row.stats = Array.isArray(line.stats) ? line.stats : [];
```

`LedgerInput.seasons` already receives the same `SeasonLine[]` the summary reads, so nothing else
moves. The screen would then render, on played rows only, the summary's `.season-stats` markup
inside `.ledger-body`. Flag it and I will land the screen half.

---

## Verification

* `npm test` — **644 passed**, 38 files (baseline 636).
* `npm run typecheck` — both passes exit 0.
* `npm run build` — clean, 547ms.
* `git status` — nothing modified under `src/engine/`, `src/content/`, `src/ui/session/`,
  `SummaryScreen.tsx` or `summary.css` by this task. The two files this task owns are the two files
  it changed. Nothing committed.
* Looked at, at 1456×824 and at 400px, on the running app: plain decision card, resolved card with
  the tall account block, transfer hub, offseason, the ending, an empty season-1 ledger, a
  three-season ledger, and the dashed fifth row in both its states.
