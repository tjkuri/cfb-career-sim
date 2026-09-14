# 012 — Invert the type register, and clamp what can overflow

**Status: done.** All three priorities landed and are verified in a browser at 1456px and at a real
360px viewport. 492 tests green, both typecheck passes exit 0, `npm run build` clean.

Files touched: `src/ui/styles/{tokens,base,career,creation,summary,log}.css`. No `.tsx` touched, no
`src/engine/**` or `src/content/**` touched, nothing committed.

---

## 1. The scale

Six steps in `tokens.css`, plus two sizes **derived** from them rather than added to the scale.

| Token | rem | px @16 root | Weight it usually carries | Roles |
|---|---|---|---|---|
| `--t-micro` | `0.6875rem` | **11** | `--w-ui` 700, uppercase, `--track-label` | column heads, eyebrows, stat lines, season year, deltas at rest, seed note |
| `--t-meta` | `0.75rem` | **12** | 700 | rail lines, captions, Continue, primary/ghost buttons, share block |
| `--t-body` | `0.8125rem` | **13** | `--w-prose` 500 | prose — the decision description, moments, verdict subhead |
| `--t-label` | `0.9375rem` | **15** | `--w-ui` 700 | option rows, school names, the OVR band, **the outcome** (at 500) |
| `--t-title` | `1.125rem` | **18** | `--w-title` 800 | the decision headline |
| `--t-hero` | `2.125rem` | **34** | `--w-figure` 900 | the OVR, the final OVR, the loudest delta |
| `--t-figure` | `calc(--t-hero * 0.72)` | ~24.5 | 900 | mid numerals: season OVR, tier-2 delta, the jersey hash |
| `--t-display` | `clamp(--t-hero, 7vw, 3rem)` | 34→48 | 800/900 | the two screens holding a single object: the title card, the verdict, the jersey number |

Ratios 11 : 12 : 13 : 15 : 18 : 34 — 1.09, 1.08, 1.15, 1.20, 1.89. Tight at the bottom because the
bottom three steps are one texture (interface chrome) and open at the top because the top two are
numerals, which are the only things allowed to be loud. Hero : body is **2.6 : 1** against the
reference's measured 3 : 1.

**Where this diverges from 002's recommended six steps, and why.** 002 proposed
`hero 34 / title 18 / label 15 / body 13 / meta 11 / micro 10`. I kept four of those exactly, raised
the floor twice (10 → 11 and 11 → 12, per DECISION 008's "raise the floor" and because two label
steps 1px apart are noise, not a scale), and spent the freed step on `--t-figure`. 004 recorded that
002's `--t-meta` and `--t-micro` roles *do not exist in our build* (`.rail` has no labels, there is
no table), while a mid-numeral role exists four times over (`.season-ovr-num` was 27px,
`.final-ovr-num` 38px, and two delta tiers). The scale now covers roles we actually have.

Weight, leading and tracking are tokens too, so the register is one edit and not sixty:
`--w-prose 500 / --w-ui 700 / --w-title 800 / --w-figure 900`;
`--lh-none 1 / --lh-tight 1.2 / --lh-prose 1.45`; `--track-label 0.16em / --track-tight -0.01em`.

Prose is 500 everywhere and 900 appears only on numerals — `.ovr-number`, `.final-ovr-num`,
`.season-ovr-num`, `.jersey-input`, the tier-3 delta, `.season-delta.loud`. The verdict stays at 800
on purpose: `Undrafted` and `Career-ending injury` are words.

### The grep that proves no raw font-size survives

```
$ grep -rn "font-size:" src/ui/styles/ | grep -v tokens.css | grep -vE "font-size: var\(--"
src/ui/styles/summary.css:73:  font-size: calc(var(--t-display) * 0.72);
src/ui/styles/base.css:3:/* `html` sets no font-size on purpose. Audit Bug 3 was `body { font-size:
```

Line 3 of `base.css` is prose inside a comment. `summary.css:73` is the dimmed verdict
(`.verdict-block.quiet .verdict`) and is a calc **over** a token, not a literal — it has to be, because
it must stay proportionally below the fluid `--t-display` at every width; pinning it to `--t-hero`
would collapse the loud/quiet size difference to zero at 360px, which is exactly where DECISION 021
needs it visible. `tokens.css` itself contains no `font-size` declaration at all — only definitions.

`grep -rn "font-weight:" src/ui/styles/ | grep -v tokens.css | grep -vE "var\(--"` returns nothing.

### Tabular figures

`font-variant-numeric: tabular-nums` is now declared **on the containers** — `.rail`, `.season`,
`.log-row` — instead of on individual numeric cells, and the redundant per-cell declarations were
removed. That covers every number that changes in place: the OVR, both deltas, the live stat line,
the record, the snaps, the ledger, the season records and the per-season OVR column. `.ovr-number`,
`.final-ovr-num`, `.jersey-input`, `.path-count`, `.honor-count` and `.moment-count` keep their own
because they sit outside those three containers.

### Two judgement calls inside the type pass

1. **`.card-title` is set at `wdth 84`, not the old `wdth 70`.** At 18px against 13px prose set at
   `wdth 100`, a heavily condensed headline *loses* on visual width even while it wins on point
   size — screenshotted, the hierarchy read backwards. Widening the axis is how the house style
   keeps the register and still puts the headline on top.
2. **`--measure` moved 34rem → 30rem (544 → 480px).** Measure is a function of type size: 34rem at
   13px runs ~86 characters a line, well past the return-sweep limit. 30rem holds it at ~66 and
   lands the card's inner width on **411px** — the same width the reference's decision column
   measures at. This is the one change outside the literal letter of the brief. It is one token and
   trivially reverted if the layout brief wants the width back.

---

## 2. Clamps

Nine overflow-capable nodes, zero clamped, is now nine clamped. **The governing principle: every
clamp is sized so the longest string the content bundle can produce still renders whole.** A clamp
here is an overflow ceiling for a future height-locked shell, never an editorial cut — an event
description the player cannot finish reading would be a worse bug than a card that grows.

Line counts were **measured in the browser at 360px**, not derived from character arithmetic; the
arithmetic was wrong twice.

| Node | Longest real input | Measured at 411px / 360px | Clamp |
|---|---|---|---|
| `.card-title` | 34 ch | 1 / **2** lines | 3 |
| `.card-body` | 194 ch | 4 / **5** lines | 6 |
| `.option` | **107 ch** (engine-built, `factory`/`developmental`) | 2 / **4** lines | 5 |
| `.resolved-choice` | 118 ch (`You chose: ` + 107) | 2 / 4 lines | 5 |
| `.resolved-beat` | 107 ch | 2 / 4 lines | 5 |
| `.outcome` | **241 ch** | 5 / **7** lines | 8 |
| `.honor-label` | ~20 ch | 1 line | 2 |
| `.moment-item` | 59 ch | 1 / 2 lines | 3 |
| `.rail-school` · `.rail-player` · `.rail-statline` · `.ovr-band` · `.trust` · `.season-school` · `.log-name` · `.log-headline` | 18–37 ch | 1 line | single-line ellipsis |

Every clamp carries at least one line of headroom over the measured worst case — deliberately, because
a fallback face rendering before Archivo loads is wider than Archivo.

Two global guards: `overflow-wrap: break-word` on `body` (a school name is engine-built and the
layout has no horizontal scroll to absorb an unbreakable token) and `overflow-wrap: anywhere` on
`.share-pre`.

**Verified against the real worst case, not a typical one.** A save was constructed carrying the
241-char outcome (`the-wind-at-home`), the 194-char description (`bowl-game-winner`), the 34-char
title (`conference-primetime`) and the 107-char traited transfer label, loaded in a true 360px
viewport: `document.documentElement.scrollWidth === clientWidth === 360` (no horizontal overflow),
card height 414px, and **nothing truncated** — 7 of 8 outcome lines, 2 of 3 title lines, 2 of 5
choice-label lines.

The states were produced by a headless harness driving the real engine (written to the scratchpad,
not the repo; served to the page once through a gitignored temp file that has been deleted). The
tree is clean of it.

---

## 3. Audit Bug 3 — decided, not inherited

**Chosen: delete `body { font-size: 17px }` and leave `html` with no `font-size`.** `body` now takes
`var(--t-body)`.

The other two options were pinning `html { font-size: 16px }` (which throws away the reader's own
browser text-size setting — the one thing a type pass this small must not do) and documenting the
accident (which leaves every future `rem` author guessing). With the root unset, `1rem` is the
reader's root, the whole type scale tracks it, and `1rem` finally means what its author thinks.

**What moved:** only the type. The root is still 16px for anyone who has not changed it, so every
existing `rem` *spacing* literal computes to exactly the pixel value it computed to before this
change. The only spacing values I touched are the four named below, each for a reason the type pass
created.

---

## What else changed, and why

- `.rail-id` / `.rail-where` / `.rail-stats` line-heights tightened 1.6/1.35/1.3rem →
  1.4/1.15/1.1rem, with `min-height` still matching `line-height` exactly. DECISION 019's invariant
  is preserved — these are absolute so an empty cell is exactly as tall as a full one — but they
  were sized for 17px text.
- `.resolved-choice` gained `margin-top: 0.5rem`. The title lost 20px of height, so the gap it used
  to *imply* between itself and the "You chose:" line had to be declared.
- `.card-body` top margin 1rem → 0.7rem, `.creation-head` bottom margin 2rem → 1.6rem,
  `.field > label` bottom margin 0.35 → 0.3rem. Three gaps that were proportioned to 17px.
- `.jersey-hash` dropped to `--t-figure`: at `--t-hero` it sat level with the number, and the hash
  is punctuation while the number is the identity.
- `.input::placeholder` drops to `--w-prose`. The field is set at UI weight because a typed-in name
  is a nameplate; a placeholder at 700 read as something the player had already entered.
- Uppercase + `--track-label` added to the roles that are labels rather than content:
  `.rail-when` (`SEASON 4 SR`), `.field > label`, `.arc-head-ovr`, `.continue`, `.primary`,
  `.ghost`. This is the reference's 39-use uppercase polarity and it is already the summary's
  vernacular.
- **`.moment-season-n` had no CSS rule at all.** It is rendered at `SummaryScreen.tsx:199` and
  nothing in `styles/` had ever matched it. Given a `min-width: 0` + ellipsis rule.

### DECISION 012 is preserved and now reads louder

The delta tiers were `1.05 / 1.6 / 2.35rem` at weights `600 / 700 / 800`. They are now
`--t-title / --t-figure / --t-hero` at `700 / 800 / 900`, so the loudest delta is set at **exactly
the size of the OVR number it just changed**. `.season-delta` / `.mid` / `.loud` likewise run
`--t-micro / --t-meta / --t-label` at `700 / 800 / 900`. Hue is untouched at every tier: a +8 and a
−8 are the same colour and the same size. No `--good`/`--bad` was added and none is wanted.

`overall` is still the only rating rendered as an integer; `character` still appears only as a band
phrase. Nothing newly displayed.

---

## Findings for the PM

1. **`--chalk-faint` now fails WCAG AA at 11px, and this is the one real legibility risk in the
   pass.** Measured contrast of `#64776c`: **3.83:1 on `--turf`, 3.37:1 on `--card`, 3.00:1 on
   `--card-raised`** — all under the 4.5:1 AA floor for normal text, and none of these roles is
   large enough to qualify for the 3:1 large-text allowance. It already failed at 13–14px; dropping
   those roles to 11px makes it felt rather than merely measured. Thirteen roles are affected
   (`.rail-stats`, `.seed-note`, `.path`, `.final-ovr-label`, `.arc-head-ovr`, `.season-year`,
   `.season-stats`, `.season-delta`, `.moment-season`, `.moment-count`, `.log-meta`, `.trust`,
   `.resolved-choice`). **I did not fix it: it is a palette change and colour is not this brief's.**
   The fix is one token — `--chalk-faint` needs to reach roughly `#7e9488` to clear 4.5:1 on
   `--card`. `--chalk-dim` at 6.38:1 already clears it, so re-pointing the smallest roles is the
   other option. This is also the exact thing DECISION 008's "would change our mind" clause names,
   so it should go to the next playtest either way.
2. **A class name the type scale wants and cannot hang on: labelled rail cells.** 002's `--t-meta`
   role is "rail labels at 11px/700 uppercase" — `AGE`, `VALUE`, `APPS` over their values. Our rail
   is four bare values with no labels (`CareerScreen.tsx:14-17`), so the step currently has only
   `.rail-when` to live on. If the PM wants the box-score header the teardown describes, the cells
   need label spans placed in the tsx; the CSS role is ready for them.
3. **A clamped `.option` or `.outcome` has no accessible full text.** The clamps will only fire on
   content longer than the bundle can currently produce, so nothing is hidden today — but if the
   `factory`/`developmental` traits are ever assigned and a 107-char label lands on a narrow phone,
   the clamp is the only thing between it and the layout. A `title` attribute on `.option` would
   need to be placed in the tsx.
4. **`--measure` at 30rem is the one call outside the brief's letter.** Flagged above; one token to
   revert.
5. **The height-lock arithmetic is now much better but still not free.** The worst resolved card
   measures **414px** at 360px wide (was ~600px of document). The worst *decision* card — 34-char
   title, 194-char body, four 107-char options — is the remaining tall case and should be measured
   again by whoever owns the `90svh` lock, on the real 480px column rather than on the old 544px.

## Verification

- `npm test -- --run` → **492 passed (35 files)**. Baseline in the brief was 488; the other four are
  the concurrent agent's, and the count did not drop.
- `npm run typecheck` → **exit 0** (both passes). `npm run build` → clean, CSS 17.41 kB / 3.65 kB gz.
- Screens confirmed in Chrome at **1456px** and at a **true 360px viewport** (window resizing is
  still broken in this environment, as 002 also found — `innerWidth` stays 1470 whatever
  `resize_window` reports; a same-origin 360px iframe gives a genuine narrow viewport with real
  `vw` units and real media-query resolution, and was used instead):
  creation · Signing Day · Transfer Portal (4 options, longest 72 ch) · a 2-option decision ·
  a resolved card with a visible −8 OVR delta at tier 3 · a one-option beat card ·
  a drafted summary · the career log.
- Worst-case strings injected and confirmed unclamped at 360px, with no horizontal overflow.
