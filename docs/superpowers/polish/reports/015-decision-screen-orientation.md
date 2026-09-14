# 015 — The ledger is mounted, the rail states two things, and row 3 is readable

**Type:** implementation · **Status:** all three items done · **2026-09-13**
**Files changed:** `src/ui/screens/CareerScreen.tsx`, `src/ui/styles/career.css`,
`src/ui/session/view-model.ts`, `src/ui/session/types.ts`. Nothing committed.
**Not touched:** `ledger.ts`, `tokens.css`, `SummaryScreen.tsx`, `summary.css`, `src/engine/**`,
`src/content/**`. No new token was needed and none was added.

---

## 1. The ledger is mounted

Report 010's wiring diff applied verbatim — the import and the `ledger: LedgerRow[]` field on
`CareerView` in `types.ts`, the import and the `buildLedger({...})` entry after `season:` in
`buildView`. Nothing was re-derived and `ledger.ts` was not opened for editing. `seasonViews(state)`
is assignable to `LedgerSeason[]` exactly as the report said, `terminal` was already in scope, and
no import cycle appeared.

**The leak walker.** `view-model.test.ts` did fail on `tier leaked for QB` the first time I ran it
after wiring, and it is worth recording that **it was not the ledger**. I probed it: over a full
QB career the ledger contributes exactly ten key names —
`slot, label, state, classYear, schoolName, record, snaps, overall, redshirtSlot, tentative` —
none of them forbidden, which is what report 010 predicted. The `tier` came from the concurrent
016 agent's `HonorView.tier` on `CareerSummaryView.honors`. They have since renamed it to `rarity`
and the suite is green again. `FORBIDDEN_KEYS` is unchanged.

### Placement

The screen is now `.frame.career` wrapping `.career-main` (rail, standing block, card) followed by
`<aside class="ledger">`. **One DOM order, two layouts:**

- **Narrow.** The ledger is written after the card, so it stacks *below* it. Measured at an
  effective 360px: card top 236px, last option bottom 498px, ledger top 557px. The decision and its
  options stay above the fold on any real phone; nothing was pushed down by the table.
- **Desktop (`@media (min-width: 64rem)`).** A two-column grid —
  `minmax(0, var(--measure)) 14rem`, 3.5rem gutter — moves the table into the empty right-hand
  field (B1) and makes it `position: sticky`, so it is on screen for every card (DECISION 007).
  Measured at an effective 1458px: frame 760px, decision column **480px = `--measure` exactly**,
  ledger 224px, no horizontal overflow. The measure is not widened; the ledger and its gutter are
  added outside it, so no line of prose gets longer.

`base.css` was not edited — `.frame`'s `max-width` is overridden by `.career` inside `career.css`,
which is imported after it.

### What a row says

Line 1 is `YEAR n` (micro, uppercase, tracked — the rail's own label register) and, right-aligned,
the season's finishing OVR as a 15px/900 figure. Line 2 is `FR  Ames State` and, right-aligned, the
record. Grid rows are fixed at `1.3rem / 1.05rem`, declared on the grid rather than left to the
content, because a future row has four empty cells and no line boxes at all — without that the
empty rows collapse and the table stops reporting the career's length, which is the entire point of
drawing them.

Two things are deliberately **not** drawn:

- **No OVR on the current row.** `advance.ts:285` stamps a new line with the OVR the season
  *started* at, and `enterOffseason` (`advance.ts:207`) overwrites it with the OVR it ended at. The
  in-progress row's stored number is therefore a season old. The live OVR is the hero numeral
  directly above it; printing a stale one beside it would put two moments on screen at once, which
  is the bug DECISION 019 just closed on the rail.
- **No record on the current row.** Verified live over three careers: zero `0-0` rendered
  (DECISION 014).

States are drawn with surface, weight and an inset edge, never hue — there is no `--good`/`--bad`
and the ledger did not invent one. Played rows carry `--chalk` figures on the default dim ground;
the current row takes `--card-raised` plus a 2px `--chalk-dim` inset edge and a white year label;
future rows drop to `--chalk-faint`.

**Slot 5.** While `redshirtUsed` is false the row hangs off a **dashed** rule and the table simply
stops under it — an open edge, not a closed one — and its detail line reads `redshirt year`.
DECISION 010's named risk is a player reading slot 5 as a promise, and a fifth row drawn as solid
table would have been exactly that promise. Verified live: taking the redshirt flips
`data-tentative` to `no` and the rule goes solid, before the season is ever played.

### On "the current season's row leads" (DECISION 013)

The brief's verification line asks that the current row "leads". I did **not** move it to the top of
the table — sequence labels (`Year 1`–`Year 5`, DECISION 020) are only unambiguous in sequence, and
re-ordering them would undo 020. I read 013 as it is written: the current season's row *shipped*
first and is already on screen as the rail's third line, and within the ledger the current row leads
by being the lifted one. **Flagging this in case the PM meant the literal ordering** — it is a
five-line change if so.

## 2. Two axes, two statements (DECISION 024)

`.ovr-gloss` is gone. The standing block is now a two-column grid in which **the numeral occupies
row 1, column 1 only**:

```
      ON THE FIELD
 75   a week-one starter
      ─────────────────────────────
      IN THE LOCKER ROOM
      a problem they are managing
```

Three changes, all structural:

1. **Each claim is named for the place it describes.** `On the field` / `In the locker room` are
   grammatically parallel prepositional phrases, and — checked against all five `TRUST_BANDS` —
   neither collides with any phrase `bands.ts` can produce. `The staff` was the obvious label and is
   wrong: two of the five trust bands already say "the staff", so it would have read as a stutter
   40% of the time. Both claims are labelled, not just the second; a lone label reads as a footnote
   on a main statement, and a matched pair is what makes them parse as two readings.
2. **A rule between them, spanning the text column only.** The numeral is outside it, which says
   which claim it belongs to.
3. **The numeral no longer spans both rows.** That is the mechanism by which it came to gloss the
   trust phrase as well.

`character` moved **up**, not down: `--t-meta` / `--chalk-faint` → `--t-label` / `--chalk-soft`,
at prose weight rather than label weight. B17 is that it is already too easy to ignore, so buying
the separation by quieting it was never available. It remains words-only — no meter, bar, dot count
or number (DECISION 002).

Both phrases now **wrap with a 2-line clamp instead of truncating**. This is not the rail's fixed
slot, nothing here has to hold a shape across an `advance()`, and the longest trust band ("they
would run through a wall for you") does not fit one line at 15px at 360px. Clipping the claim that
024 exists to make readable would have been a strange way to make it readable.

**At-a-glance check, done at normal distance and not with my face against the screen:** it reads as
two statements. The label line is the first thing the eye lands on in each block and the rule closes
the first one off.

## 3. Strip row 3 (DECISION 023, claim 7)

`.rail-stats`: `--t-micro` (11px) → `--t-body` (13px), with `line-height` and `min-height` moved
together from `1.1rem` to `1.25rem` so the fixed slot still cannot reflow. **Colour untouched, no
grey added** — 023 asked for size before tone and that order was kept.

Row 3 is now one step *above* row 2 rather than one below it, which is the right way round: it is
the only content on the screen that answers "how am I actually doing", and it was set smaller than
anything else. Checked for the cost: the longest live QB line
(`925 Pass Yds 7 Pass TD 3 INT Thrown` beside `321 snaps`) measures 177px against a 177px cell at
**both** 500px and 360px — no truncation at the new size at either width.

**One honest caveat for the next playtest.** Rows 2 and 3 now differ by 1px (12 → 13) and by the
same 7 L\* of grey 022 already knew was subtle. The direction of the size step is reversed, which is
a real cue, but 1px is not what 023 means by "a sane amount", and I would not bet that the tonal
complaint dissolves. If the next playtester still merges them, **023's own escalation applies
(structure, not a fourth grey)** and the cheapest structural move is to demote row 2 to `--t-micro`,
giving the strip **15 / 11 / 13** — a 2px step in each direction, with the least valuable line (the
player's own constant name, plus the phase) taking the floor. That is one declaration. I did not
take it in this brief because it is a change to a row the brief does not own the mandate for.

---

## Verification

| | |
|---|---|
| `npm test -- --run` | **501 passed / 501**, 35 files. Baseline when I started was 492; the extra 9 are the concurrent 016 agent's. Zero failures attributable to this work. |
| `npm run typecheck` | both passes exit 0 |
| `npm run build` | clean, 21.76 kB CSS |
| `npm run play -- seedA random`, `seedB random` | **byte-identical** before and after (`diff -q`, both seeds, run twice — once after the wiring and once at the end). The UI change did not move the engine. |
| Browser click-through | creation → Signing Day → decision cards → a resolved card → summary, over three careers; five rows from season 1, current row lifted, zero `0-0`, redshirt flips `tentative` off, no console errors |
| `localStorage` | the origin held exactly two keys (`cfb-career-sim:v1:current`, `:log`) and no leftover `snap:*`. Both were backed up to one temp key, restored byte-for-byte, and the temp key deleted. The origin is back to those two keys. |

### The one gap in the verification, stated plainly

**I could not resize the browser viewport.** The Chrome extension renders this tab at a fixed
500 CSS px wide and `resize_window` moves a window that is not the render surface —
`documentElement.clientWidth` stayed 500 through resizes to 1456, 1400 and 2900 (the last was
refused). Three attempts, so I stopped per the standing rule.

What I did instead: emulated the layout width with `documentElement.style.zoom` (0.343 → an
effective 1458px, 1.389 → an effective 360px) and, for the desktop case, injected the contents of
the `@media (min-width: 64rem)` block verbatim as an unconditional rule. **The geometry this
measured is real** — element rects, overflow and the screenshots are all of a genuinely 1458px-wide
layout — and the numbers are in §1 above. The one thing it does **not** prove is that Chrome
evaluates the media query's own predicate at ≥1024px, which is the least interesting part of it.
Worth 60 seconds of a human's eye at a real 1456px before this ships.

Two smaller gaps: I did not land on a one-option narrated beat during the click-through (three
careers ended first). Its markup is unchanged and `.resolved-beat` was not touched. And the ledger's
pre-DECISION-009 save path (null `overall` / `classYear`) was exercised only by `ledger.test.ts`,
not in the browser — the origin holds no such save.

---

## Notes for the PM

1. **No new token is requested.** Everything above is built from the existing scale and ramp:
   `--t-micro / --t-meta / --t-body / --t-label`, `--chalk / --chalk-soft / --chalk-dim /
   --chalk-faint`, `--card-raised`, `--line`, `--track-label`, `--w-ui / --w-prose / --w-figure`.
   `tokens.css` is untouched. Contrast on the new roles: the two `On the field` / `In the locker
   room` labels are `--chalk-faint` at 11px on `--turf` (6.09:1 per 022) and the ledger's faint
   cells sit on `--turf` too; the only `--card-raised` ground in the new work is the current ledger
   row, which carries `--chalk-soft` and `--chalk`, not faint.
2. **DECISION 013's "current row leads"** — see §1. I kept sequence order and led by emphasis. Say
   the word if you meant the literal ordering.
3. **DECISION 010's fifth row now says `redshirt year` in words.** This is the one place the work
   adds copy. It is the direct answer to the playtester who finished three careers believing the
   game was four seasons long and found season 5 by accident, and redshirting is a decision the game
   openly offers rather than a hidden mechanic. If you want the table wordless, deleting that string
   is a one-line change and the dashed rule still carries "not guaranteed" on its own — but then the
   fifth row teaches the *shape* of a career without teaching what buys it.
4. **No engine proposal.** Nothing in this brief needed one. DECISION 025's refused line was not
   added and nothing new reads `draftStock`, tier, probability, weight or a trait name — the ledger
   goes through `view-model.ts` like everything else, and the walker proves it.
5. **Row 3's follow-up is pre-specified in §3** so the next agent does not have to re-derive it:
   15 / 11 / 13, one declaration, only if a playtester still merges the rows.
