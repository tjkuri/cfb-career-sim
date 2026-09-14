# 013 — The rail describes one moment, not two

**Status:** done · implemented and verified · no commits made, work left in the tree.

The context rail's two halves now come from the same side of `advance()`. The season line —
snaps, stat line, record — rides on `SeasonStamp` next to the season's identity, and the whole
rail is assembled in one function the screen calls. No CSS was touched.

---

## 1. The bug, reproduced first

At `localhost:5173`, fresh career, answering the first card of the opening offseason. Rail text
read cell by cell, one tick apart:

| card | rail |
|---|---|
| decision card | `North Texas · Season 1 FR · Offseason · · 0 snaps ·` |
| the same choice, resolved | `North Texas · Season 1 FR · Offseason · · **175 snaps** · **362 Pass Yds  3 Pass TD  2 INT**` |

Exactly the shape the brief described: an offseason that has somehow played a season. The identity
half was frozen to the stamp by wave 3; the season-line half was read live off a `GameState` that
`advance()` had already carried through an entire simulated phase.

## 2. The change

**`SeasonStamp` gains `season: SeasonLineView | null`** (`src/ui/session/types.ts`), captured in
`seasonStamp()` from the same `currentSeasonLine(state)` the live view uses, at the same point in
`play()` — before `advance()`. Nothing else moved.

**The comment above `SeasonStamp` was the trap, and it is rewritten as two named rules** rather
than one. FROZEN: everything the rail draws — identity *and* the line being written, because no
rail cell may describe a different moment than the cell beside it. NOT FROZEN: the progression
values, because DECISION 012 wants the magnitude of a change visible and freezing `overall` or the
band phrases would hide the delta the card exists to report. The comment now says why the two rules
do not collide: **the delta is read in the `.standing` block, which is never stamped, and no rail
cell carries a progression number.** Freezing the rail costs the delta nothing.

**A new `railView(view, resolved)` in `view-model.ts`** assembles the rail in one place, so no
screen decides cell by cell which side of `advance()` a value comes from. With a card on screen
every cell comes off its stamp; with no card, every cell is live. There is deliberately **no third
case**: a stamp that exists and carries a null school or a null season line is *reporting* that
state (pre-Signing-Day, pre-first-on-field-phase), and falling through to the live value there is
precisely how the rail came to name two moments. `CareerScreen` is now four lines of rail wiring
plus the same markup as before.

**Nullability held in three places.** `stamp` stays nullable and a card without one falls back to
the live view wholesale. `railView` re-guards `stamp.season ?? null`. And `normalize()` in the
reducer now normalizes the stamp **one level deep** — a save written between the stamp landing and
the season line joining it restores a stamp with no `season`, and that must reach a screen as
`null`, never `undefined`. A test covers that restore path specifically.

**The record cannot be faked by this.** `recordOf` returns null for a line whose `seasonIndex` is
still the live one, so the line frozen at choice time carries the same null the live view would
have reported. A test asserts `rail.season?.record` is never `"0-0"` across all six positions
(DECISION 014). The cell holds its space either way.

### Files changed

| file | what |
|---|---|
| `src/ui/session/types.ts` | `SeasonStamp.season`; new `RailView`; the two-rules comment |
| `src/ui/session/view-model.ts` | `seasonStamp` captures the line; new `railView` |
| `src/ui/session/reducer.ts` | `normalizeStamp`, one level deep |
| `src/ui/screens/CareerScreen.tsx` | reads `railView`; no markup or class changes |
| `src/ui/session/view-model.test.ts` | +3 tests (the rail walk, the `0-0` guard, the fallbacks) |
| `src/ui/session/reducer.test.ts` | stamp field-set test widened; +1 legacy-stamp test |
| `src/ui/session/storage.test.ts` | one stamp literal needed `season: null` to typecheck — see §5 |

## 3. The test that failed first

`view-model.test.ts` → *"the rail describes one moment, not two"* → **"draws the season line that
was on screen when the choice was made"**. It walks all six positions with the reducer, captures
`buildView(state)` immediately **before** each `choose`, and compares the rail the screen would draw
on the resolved card against it. Cards where a one-option beat auto-resolved behind the answer
(DECISION 018) are skipped by identity check, since the stamp there belongs to the later card.

Written against the old behaviour it failed with **`expected 160 to be +0`** — a rail reporting 160
snaps for a moment whose snap count was 0. It also counts how often the frozen line and the live
line disagree and requires that count to be non-zero, so the assertions cannot start passing
vacuously if the freeze is ever removed.

Two invariants I got wrong on the first pass, both worth recording because they look like bugs and
are not:

- **The line's own season number legitimately trails the header's.** During an offseason the rail
  reports the season just completed — that is DECISION 013's whole point, the row the redshirt,
  transfer and declare cards ask for. The assertion is `<=`, not `===`.
- **Snaps are not monotonic across a season boundary.** The frozen line can read 564 snaps while the
  live view already shows 10, because the live view is on a *new* line entirely. Comparisons only
  hold within one `seasonNumber`.

## 4. Verification

| | |
|---|---|
| `npm test -- --run` | **492 passed** (488 baseline + 4 new), 35 files |
| `npx tsc -p tsconfig.engine.json` | exit **0** |
| `npx tsc -p tsconfig.json` | exit **0** |
| `npm run build` | clean, 82 modules, 507ms |
| `npm run play -- seed-alpha random` | **byte-identical** before/after (`diff` empty) |
| `npm run play -- seed-beta random` | **byte-identical** before/after (`diff` empty) |

### In the browser, after

Two careers walked at `localhost:5173`, clicking through every card:

| | |
|---|---|
| resolved cards paired against the decision card just answered | **21** |
| pairs whose rail text differs by a single character | **0** |
| distinct rail heights, per career walk | **1** (76.89px; 76.88 on one sample is sub-pixel rounding of the same box) |
| distinct rail line-height sets | **1** (`23.9, 18.4, 17.6`) |
| horizontal overflow | **0 cards** |
| phases exercised | all four |

The reproduction case now reads correctly: the offseason card resolves at `Offseason · 0 snaps`, and
the 186 snaps appear one card later under `Non-Conference`, where they were earned. A boundary
example from the walk, showing both cards behaving:

```
resolved card:       UTSA | Season 2 SO | Offseason       | 6-6 | 514 snaps | 1,117 Pass Yds  8 Pass TD  6 INT Thrown
next decision card:  UTSA | Season 2 SO | Non-Conference  |     |  10 snaps | 23 Pass Yds
```

The resolved card reports the season that was just finished, under the phase it was finished in.
The next card reports the season now being written. Neither reports both.

**Rail height was re-measured, not assumed** — wave 3's property holds. Note the stylesheets moved
under me while I measured (the concurrent CSS agent): the rail was 85.49px tall at the start of my
session and 76.89px at the end. It is single-valued in every walk, which is the property that
matters.

## 5. Two things for the PM

**a) One out-of-brief edit, unavoidable.** `src/ui/session/storage.test.ts:46` constructs a
`SeasonStamp` literal; adding a required field to the interface breaks its typecheck. I added
`season: null` to that literal and nothing else in the file. The file is not on my owned list and
not on the out-of-bounds list. The alternative — making `season` optional — would have pushed
`undefined` into the screens, which is the thing every nullability comment in this module exists to
prevent.

**b) A 1px card shift that is not the rail, and not mine.** Measuring card-top offsets after the
`.fade-in` entrance animation settles, the card sits at 206.19px on most cards and 207.19px on some.
It tracks **`.standing`'s own height** (46.9px vs 47.9px), not the rail, which stayed single-valued
across the same cards. So the block that moves is the OVR/band/trust line — deliberately live, and
CSS I am not allowed to touch this wave. Worth a look from whoever owns `career.css`: a fixed
`line-height` in `rem` on `.standing`'s rows would pin it the same way it pinned the rail.

## 6. Proposals (no engine or content edits made)

**None needed.** This task turned out to require nothing from `src/engine/**` or `src/content/**` —
the season line was already reachable from the pre-`advance` state through the existing view-model
helper. The only frozen-file question it raises is the one DECISION 014 already answered and
declined: making W-L accrue game-by-game. Still not proposed, for the same reason (it moves the RNG
draw order and diverges every existing seed), and freezing the line makes the current behaviour
coherent rather than merely defensible — the card now says "no record yet" at a moment when there
genuinely was none, instead of borrowing one from the future.

*Incidental:* `git diff` reports `view-model.ts` as **binary**. That is not corruption from this
task — `momentViews` uses a literal NUL as its grouping-key separator (`` `${m.seasonIndex}\0${m.item}` ``)
and the byte is present in `HEAD`. It costs a readable diff on that file. If someone wants the diff
back, the separator could be any character that cannot appear in a season index; that is a one-line
change I left alone because it is not in this brief.
