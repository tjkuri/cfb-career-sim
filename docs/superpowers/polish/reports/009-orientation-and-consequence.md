# 009 — Orientation and consequence on the decision card

**Status:** done · all four items implemented and verified · no commits made, work left in the tree.

All four priority items landed. The decision screen now says where the player is, what phase and
season the card they are reading belongs to, what just happened to them and how big it was; the 104
one-option cards per 72 careers keep the prose they were throwing away; and the gold accent has
moved off the no-op Continue and onto the options that commit the career.

---

## 1. The rail draws the season state, and the 71% phase bug is fixed

`CareerScreen.tsx` drew four spans off the live `view` and rendered none of `phaseLabel`,
`seasonNumber` or `season`. It now draws a **fixed slot of three fixed lines** (DECISION 019):

```
Toledo                                                      Season 1   FR
KKuri #7        Postseason                                            7-5
517 snaps       1,451 Pass Yds  12 Pass TD  5 INT Thrown
```

Line 1 is identity, line 2 is where the career is plus the record, line 3 is the line the player is
currently writing. Every cell holds its space when it is empty.

### The stamp is now read

When `resolved` is non-null, school, class year, season number and phase come from `resolved.stamp`
rather than the post-`advance` view. `stamp` is nullable, so each cell falls back to the live view
(`stamp ? stamp.schoolName : view.schoolName ?? "Uncommitted"` — the `stamp`-exists-but-school-null
case is pre-Signing-Day and must not fall through to the live school).

Snaps, the stat line and the record deliberately stay **live**: the stamp freezes the season's
*identity*, not the line being written. Report 007's measurement said the phase was wrong on 270 of
378 resolved cards; this is the half of that fix that was left undone.

### The reflow was real, and the first fix did not work

My first CSS pass set `min-height` on each rail line as a ratio-derived value. Measured in the
browser across a live career, the rail still moved:

| | before choosing | after choosing |
|---|---|---|
| rail height | 83.24px | **85.17px** |
| card top | 229.26px | **231.19px** |
| line heights | 26.03, 21.82, **18.40** | 26.03, 21.82, **20.33** |

The stat line grew 1.93px the first time a stat existed. **Cause:** `.rail-line` is a flex
container, so its height comes from the tallest child's line box rather than from a strut, and a
`min-height` below the natural box does nothing. **Fix:** `line-height` set in `rem` (absolute, not a
ratio) with `min-height` matching it exactly, so every cell resolves to the same box whatever its
font-size and an empty cell is exactly as tall as a full one.

**Verified after the fix,** walking real careers in the browser and measuring every card:

| | |
|---|---|
| distinct rail heights over 25 cards, one career | **1** (85.49px) |
| distinct rail line-height sets | **1** (`26.1,21.6,20.8`) |
| distinct card top offsets | **1** (211.51px) |
| second run, 11 cards, 8 resolved | same single values |
| horizontal overflow at 896px viewport | 0 of 36 cards |

The card does not move by a single pixel between a decision and its outcome.

---

## 2. One-option cards keep their prose (DECISION 018)

`reducer.ts:88` — `outcome === null || decision.options.length === 1` — is gone. The
`options.length === 1` clause was the whole bug.

### Measured first

Before writing code I walked 72 careers (6 positions × 12 seeds) through the raw engine:

| | |
|---|---|
| decisions shown | 1,007 |
| one-option cards | **104** (10.3%) |
| one-option cards whose outcome prose was null | **0** |
| back-to-back one-option pairs | 7 |

So every single one of the 104 had authored prose that was being discarded, and the
two-consecutive-beats case the decision warns about is real and needs to work.

### Shape of the fix

Two new functions in `reducer.ts`:

- **`play(state, decision, option)`** — the one place a decision is answered. Takes the stamp and the
  pre-`advance` `overall` together, calls `advance` once, builds the `Resolved`. Sets
  `narrated: decision.options.length === 1`.
- **`openCard(ui)`** — exported. If the career is parked on an un-resolved decision with exactly one
  option, resolves it immediately. **It never re-enters its own result**, which is what makes
  "at most one level" structural rather than a bound to get right.

`openCard` wraps the return of `start`, `choose`, `continue` and `restore`, and `App.tsx`'s
`useReducer` initializer. **It is not in a `useEffect`** — that was the explicit trap, and the reason
the initializer is safe is worth stating: StrictMode double-invokes the initializer, but both
invocations run from `hydrate()`'s own output, so each is `advance(sameState, sameId)` on a
deterministic engine. A `useEffect` would have advanced a second time from an *already advanced*
state and eaten a real decision.

### `normalize(ui)`, and the one file I touched outside my lane

`Resolved` gained `description`, `narrated` and `overallBefore`. A save written before them restores
with all three `undefined`. `storage.ts` already normalizes `stamp`, but **I did not edit
`storage.ts`** — I put `normalize()` in `reducer.ts` instead, because every restored `UiState` enters
the app through `restore` or through `App.tsx`'s initializer, both of which I own. A missing
baseline becomes `null`, never `0`: the card then reports no delta rather than a fabricated one.

I did have to touch **`src/ui/session/storage.test.ts`** — one `Resolved` literal in a fixture no
longer satisfied the type. Three fields added to a test object, no behaviour changed. It was not in
my owned list and not in the out-of-bounds list; flagging it rather than hiding it.

### Tests (12 new in `reducer.test.ts`, 17 → 28)

Written before the implementation. The old test
`"skips the outcome step on a single-option beat"` asserted the exact opposite of DECISION 018 and
was **rewritten in place**, with a comment saying it was reversed and why, so nobody restores it.

- never shows a bare one-option decision, over all six positions;
- a narrated card carries title, description, label, prose, stamp and a numeric `overallBefore`;
- **exactly one advance per card** — asserted via `rngCursor` movement, so a card that consumed two
  decisions shows up as a card nobody was shown;
- two consecutive beats are two cards, and the walk terminates at a summary rather than spinning;
- terminates for every position;
- hub cards (Signing Day) still resolve to nothing;
- multi-option cards are still `narrated: false`;
- **`openCard(openCard(x)) === openCard(x)`** whenever the first call produced a card — the property
  that makes the StrictMode double-invoke safe;
- a legacy `Resolved` normalizes to exactly the seven fields, no `undefined`;
- a save parked on a bare one-option card restores as a narrated card.

---

## 3. Consequence has a voice (DECISION 012)

`Resolved.overallBefore` is captured at the same point as the stamp, and kept **off** the stamp on
purpose: the stamp freezes identity, this freezes the progression baseline the card measures against.
The delta is `view.overall - resolved.overallBefore`.

### The tiers are measured, not guessed

4,404 resolved cards across 6 positions × 20 seeds:

| |overall| delta | share | treatment |
|---|---|---|
| 0 | **46.6%** | silent — nothing rendered |
| 1–2 | **42.4%** | 3px rule, 1.05rem / 600 |
| 3–5 | **9.1%** | 5px rule, 1.6rem / 700 |
| 6+ | **1.9%** | 8px rule, 2.35rem / 800 |

The loudest treatment fires on about **one card in fifty**, which is what makes it mean anything. The
playtester's −8 torn leg is in that top tier. The speeding-ticket joke moves `character` only, so its
delta is 0 and it renders nothing — the two now look nothing alike, which was the complaint.

Full observed range in the same run: −8 to +17.

### The forbidden line, verified in the browser

Computed styles pulled off two live cards in the same career:

| card | rule width | rule colour | delta font-size |
|---|---|---|---|
| `+3 OVR` | 5px | `rgb(240, 180, 41)` | 25.6px |
| `−3 OVR` | 5px | `rgb(240, 180, 41)` | 25.6px |

**Identical on every axis.** Scale, weight and motion track magnitude; hue is `--emphasis` at every
tier. There is no `--good`/`--bad` and none was added.

Mechanics: the outcome and the delta share one `.consequence` block with one left rule, because they
are one fact. The rule thickens *inward* — `padding-left: calc(1.25rem - var(--rule))` — so a louder
card does not shift its own prose. The delta's entrance translate also tracks magnitude, and
`prefers-reduced-motion` kills it. A visually-hidden sentence ("Overall up 3, now 67") is rendered
alongside, because `−8 OVR` with a real U+2212 minus is not something a screen reader can be trusted
to read as a number.

**No new token was needed.** `--emphasis`, `--dur-state` and `--dur-enter` were the documented
attachment points and they were sufficient. `tokens.css` is untouched.

---

## 4. Option rendering (B4)

- **Options** moved from `--input` (recessed — the reason they read as form fields) to
  `--card-raised`, with a `--select-dim` left rule at rest lighting to `--select` on hover/focus.
  They are now raised off the card and carry the accent.
- **Continue** demoted to a quiet outline button: transparent ground, `--line` border, `--chalk` ink,
  `--focus` ring. It moves a card off screen; it does not commit anything.

**The no-leak constraint holds structurally, not by care:** there is no per-option state in the
component or the stylesheet. Every option gets one identical class, and the only per-element styling
is `:hover` / `:focus-visible`, which are driven by the pointer rather than by the branch. Nothing
distinguishes one sibling from another before the choice is made.

`--action` does **not** become an orphan token — `creation.css` still uses it for "Start the
recruiting cycle", which genuinely does commit a career. The role stayed meaningful.

---

## 5. Verification

| | |
|---|---|
| `npm test -- --run` | **488 passed / 35 files** (444 baseline; +12 mine, the rest another lane's ledger tests landing concurrently) |
| `reducer.test.ts` alone | 28 passed (17 → 28) |
| `npm run typecheck` | both passes exit **0** |
| `npm run build` | clean, 82 modules, 509ms |
| `npm run play -- abc123 random` | **byte-identical** before and after |
| `npm run play -- zz9 random` | **byte-identical** before and after |
| Browser click-through | one-option milestone reached ("Season Opener", "Bowl Spotlight"); rail height, line heights and card top each have exactly one distinct value across every card measured |

The byte-identical headless output is the proof that item 2 changed *when* the UI calls `advance`,
not *what* the engine does.

Files changed: `src/ui/screens/CareerScreen.tsx`, `src/ui/styles/career.css`,
`src/ui/session/reducer.ts`, `src/ui/session/reducer.test.ts`, `src/ui/session/types.ts`,
`src/ui/App.tsx`, plus the one fixture in `src/ui/session/storage.test.ts` noted in §2.
`src/engine/**`, `src/content/**`, `view-model.ts`, `SummaryScreen.tsx`, `summary.css` and
`tokens.css` are untouched.

---

## 6. For the PM

1. **`storage.ts` normalization is now duplicated.** `loadCurrent` normalizes `stamp`; `reducer.ts`'s
   `normalize()` normalizes all seven fields. Both paths are correct and neither is dead, but the
   right long-term home is `storage.ts` alone. I stayed in my lane rather than edit it. One-line
   consolidation whenever that file is next open.
2. **`.sr-only` is defined in `career.css`.** It is a global utility and belongs in `base.css`. I did
   not own `base.css` and it was not out of bounds either, so I kept it local rather than guess.
3. **No new token requested.** Item 3 was fully served by `--emphasis` / `--dur-*`.
4. **No engine or content change is needed for anything in this brief.** The one thing I would have
   wanted — a per-option `hasProse` flag so a one-option card with null prose could be skipped
   cleanly — is unnecessary: measured 0 occurrences in 1,007 decisions, and `openCard` handles the
   case by not recursing regardless.
5. **Not done, and out of scope here:** multi-option resolved cards still do not show their
   description (only narrated ones do). That is deliberate — the player just read it — but if a
   playtester reports the resolved card feeling context-free, that is the lever.
6. **DECISION 018's stated risk was anticipated in the CSS.** The narrated card carries a hairline
   under the option label, separating the setup from the consequence, so the merged beat should not
   read as two events run together. If a playtester still reads it that way, thicken that seam rather
   than reverting the merge.
