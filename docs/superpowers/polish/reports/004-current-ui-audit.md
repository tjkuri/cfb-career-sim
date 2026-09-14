# 004 — Our UI audited against the 002 teardown

**Type:** research · **Wave:** 1 · **Status:** complete · **Code changed:** none

**Method.** Source reading only — the browser was left to the concurrent 003 playtest, `localStorage`
untouched, no dev server started, no test run. Every size in px below is computed from
`src/ui/styles/app.css` (rem base is **16px**: `html` sets no `font-size`, so `body { font-size: 17px }`
at `app.css:36` does *not* scale the rem-based declarations — see Bug 3). Every content-string length
was measured by loading the real `CONTENT` bundle through `tsx` and walking
`events[].{title,description,options[].{label,positiveOutcome,negativeOutcome}}`, not by regex over
source (a first pass by regex undercounted by ~25% because most long strings are written on a
continuation line).

Audited against `reports/002-reference-teardown.md`. Bound by DECISIONS 006 (three rejections),
007 (ledger, not a counter) and 008 (type inverts: smaller and much heavier) — none re-litigated.

---

## Gaps ranked by (player impact ÷ effort)

Impact is "how much of B2/B8 this closes for a player"; effort is S (< half a day, one file),
M (one to two files plus tests), L (new data on `CareerView` + new component + tests).

| # | Gap | Impact | Effort | Ratio | Files a fix touches |
|---|---|---|---|---|---|
| **G5** | `--bulb` does **8 distinct jobs**; no `--card-raised`, `--input`, radius, gap or duration tokens — 6 hard-coded hexes and 7 literal radii outside `:root` | High (prereq for every other visual gap) | **S** | ★★★★★ | `app.css` only |
| **G3** | **Zero clamps.** No `overflow`, `text-overflow`, `line-clamp` or `-webkit-line-clamp` anywhere in 475 lines. 9 overflow-capable nodes, 0 clamped. Hard prerequisite for G2 (002 §7k) | Med alone / **blocking** for G2 | **S** | ★★★★★ | `app.css` only |
| **G10** | No cross-fade on the *incoming* decision — `.fade-in` is on the resolved card only (`CareerScreen.tsx:29`), never on the decision card (`:38`). Every new decision is a hard cut | Med | **S** | ★★★★ | `CareerScreen.tsx`, `app.css` |
| **G4** | **Type register is inverted** (DECISION 008). 14 of our 18 size declarations are ≥16px; **none** is ≤12px; every content-bearing node runs weight 400 by inheritance; zero `uppercase`, zero positive tracking. The reference is 125/156 ≤12px and 112/142 ≥700 | **High** | M | ★★★★ | `app.css` (whole file) + the `@import` at `:6` — the font axis stops at **800**, so DECISION 008's "900 for numerals" is not loadable today |
| **G7** | No OVR ramp. `.ovr-number` (`app.css:92`) is one flat `--chalk` at every value 0–99; `.ovr-band` is a text class, not a ramp | Med | S–M | ★★★ | `app.css`, `CareerScreen.tsx` (or a `bands.ts` step fn) |
| **G6** | Option rendering: flat unequal-height rows, **no media slot**, no selected state, no disabled state reachable from the markup, no equal-height rule, no count-driven layout | **High** | M (CSS) / L (with art) | ★★★ | `app.css`, `CareerScreen.tsx` |
| **G9** | No chosen/unchosen resolution. On resolve the whole options block is **unmounted** (`CareerScreen.tsx:28` swaps the branch), so the rejected path vanishes. `Resolved` carries `choiceLabel` but no `optionId` (`types.ts:7-11`), so the chosen card can't even be re-identified | Med–High | M | ★★★ | `CareerScreen.tsx`, `types.ts`, `reducer.ts`, `app.css` |
| **G2** | **Layout shell.** Top-anchored scrolling document, single column, `max-width: 34rem` (544px) vs 002's height-locked two-column ~1120px at 0.85fr/1.15fr | **High** | M–L | ★★ | `app.css` (`.app`, `.frame`, `.card`), `CareerScreen.tsx` — **depends on G3 and G1** |
| **G12** | Summary is a flat season list, not per-school chapters; no 4:5 portrait shape for sharing | Med | M | ★★ | `SummaryScreen.tsx`, `app.css` (no view-model change needed — `schoolPath` + `seasons` already carry it) |
| **G1** | **No time orientation at all** (B2, DECISION 007). `CareerView` exposes `classYear` and nothing else temporal (`types.ts:44-58`); `SeasonView[]` exists only on `CareerSummaryView`, i.e. after death | **Highest** | **L** | ★★ | `view-model.ts`, `types.ts`, `CareerScreen.tsx`, `app.css`, `view-model.test.ts` — **plus an engine proposal**, see §4 |
| **G8** | No mid-career accumulator. `trophies` / `awards` / `moments` are on `CareerSummaryView` only (`types.ts:28-39`); during play the player never sees one | Med | M | ★★ | `view-model.ts`, `types.ts`, `CareerScreen.tsx`, `app.css`, tests |
| **G11** | No number tweens (002 §7a). `overall` jumps | Low–Med | M | ★ | `CareerScreen.tsx` + a new hook file |
| **G13** | Creation is a 4-field vertical form. Defaults are pre-filled *except* `lastName` (`CreationScreen.tsx:22`), so "start in one click" is one keystroke short | Low | S | ★ | `CreationScreen.tsx` |

**Ranking caveat for the PM:** G1 is bottom-half on ratio and **top on impact**. It is the one gap
002 calls "the single highest-leverage change" and DECISION 007 has already committed to. Read the
ratio column as dispatch order *within* a wave, not as a priority list.

---

## Files most contended

| File | Gaps that touch it | Note |
|---|---|---|
| **`src/ui/styles/app.css`** (475 lines) | **G2, G3, G4, G5, G6, G7, G8, G9, G10, G12** — 10 of 13 | The bottleneck. One flat file, no module boundaries, sections delimited only by `/* ---------- */` comments. **Two agents cannot work here in parallel.** |
| **`src/ui/screens/CareerScreen.tsx`** (52 lines) | G1, G2, G6, G7, G9, G10, G11 — 7 | Second bottleneck, but it is tiny; one agent can absorb all seven. |
| `src/ui/session/view-model.ts` | G1, G8 | Both are "add a field"; one agent, one pass. |
| `src/ui/session/types.ts` | G1, G8, G9 | Same. |
| `src/ui/session/view-model.test.ts` | G1, G8 | `FORBIDDEN_KEYS` at `:11-25` constrains both — see §4. |
| `src/ui/screens/SummaryScreen.tsx` | G12 only | **Safely parallel.** |
| `src/ui/screens/CreationScreen.tsx` | G13 only | **Safely parallel.** |
| `src/ui/session/reducer.ts` | G9 only | Safely parallel with everything except G9's screen half. |

**Non-overlapping parallel sets, as they stand today:**

- **A** — `view-model.ts` + `types.ts` + `view-model.test.ts` (ledger data, accumulator data). No CSS.
- **B** — `SummaryScreen.tsx` (+ the `/* summary */` block, `app.css:334-443`).
- **C** — `CreationScreen.tsx` (+ the `/* creation */` block, `app.css:222-332`).
- **D** — `app.css` tokens/type/shell + `CareerScreen.tsx`.

B, C and D all write `app.css`, so only one of them can run at a time **unless** wave 2 opens with a
mechanical split of `app.css` into `tokens.css` / `base.css` / `career.css` / `summary.css` /
`creation.css` / `log.css` (S, no visual change, no test change — the file is imported once at
`main.tsx:4`). That split turns one serial lane into three parallel ones and is the cheapest
dispatch win available. Recommended, not assumed.

---

## 1. Layout shell

### What we do now

| Concern | Where | Value |
|---|---|---|
| Page height | `app.css:28` | `html, body, #root { height: 100%; }` |
| Shell | `app.css:47-53` | `.app { min-height: 100%; display: flex; flex-direction: column; align-items: center; padding: clamp(1rem, 4vw, 2.5rem) 1.25rem 4rem; }` |
| Max width | `app.css:55-58` + `:21` | `.frame { width: 100%; max-width: var(--measure) }`, `--measure: 34rem` = **544px** |
| Scroll | — | **Nothing sets `overflow` anywhere.** `.app` is `min-height`, not `height`, so the document grows and the window scrolls. |
| Columns | — | None. `.frame` is a single block column used by all four screens. |
| Card | `app.css:120-126` | `margin-top: 1.75rem; border-radius: 5px; padding: clamp(1.35rem, 4vw, 2.1rem)`; no height, no `min-height`, no `max-height` |
| Media queries | `app.css:217` | **One**, and it is `prefers-reduced-motion`. There is no responsive breakpoint in the file. |

`.frame` is rendered by `CareerScreen.tsx:12`, `SummaryScreen.tsx:31`, `LogScreen.tsx:10`,
`CreationScreen.tsx:38` — and **also** by `App.tsx:49`, which wraps `CreationScreen` in a second
`.frame` (Bug 1).

### What 002 recommends

002 §2: height-locked shell (`h-[calc(90svh)]`, `min-h-[520px]`, `overflow-hidden`), two columns at
`0.85fr / 1.15fr` with a 24px gutter, decision left / ledger right, container adapted from `max-w-7xl`
to **~1120px** with the ledger at 56%.

### Delta

We are 544px of single column with an unbounded scroll; the target is ~1120px of two locked columns
where the decision column is **411px wide** — i.e. the decision's own measure gets *narrower*, not
wider, and the ledger takes the width we'd add. **Effort M–L**, and it cannot land before G3.

### What breaks if the shell is height-locked

Every text node in the decision path is unclamped. Worst-case content, measured from the real bundle:

| Role | n | median | p90 | **max** | Longest instance |
|---|---|---|---|---|---|
| Event title | 102 | 16 | 23 | **34** | `conference-primetime` — "Saturday Night, Everybody Watching" |
| Event description | 102 | 122 | 167 | **194** | `bowl-game-winner` — "Zero seconds on the clock, your team down two, and the distance is well within what you've hit a hundred times in an empty practice stadium and never once cared about the way you care right now." |
| Option label (authored) | 195 | 27 | 39 | **55** | `offfield-curfew-check/own-it-monday` — "Tell the position coach yourself before the report does" |
| Outcome paragraph | 330 | 76 | 124 | **241** | `the-wind-at-home/trust-your-read-of-the-swirl/positiveOutcome` — "You aim four yards outside the near upright, exactly like you've been telling anyone who'll listen for two years, and the wind brings it back right where you called it. The special teams meeting gets noticeably quieter around you after that." |
| Moment item | 39 | 39 | 48 | **59** | `the-wind-at-home` — "Called the stadium's wind correctly on a game-deciding kick" |
| School name | 57 | 9 | 16 | **18** | "Eastern Washington", "North Dakota State" |

Plus the strings the engine generates, which are **longer than anything authored** and are the real
worst case for the option row:

| String | Source | Length |
|---|---|---|
| Transfer-up label, longest **traited** school today | `transfer.ts:34` + `school-traits.ts:8` | **76** — "Transfer up to Florida Atlantic — the two-deep is thin (tougher competition)" |
| Same, if `factory`/`developmental` are ever assigned to a school | `school-traits.ts:9-10` | **107** — "…— takes three-stars and turns them into draft picks (tougher competition)" |
| Commit label | `recruiting.ts:31` | **51** today / **80** worst |
| Redshirt description | `advance.ts:74` | **105** |
| Redshirt outcome prose | `content/redshirt.ts:12,14` | 148 / 155 |

Note `school-traits.ts:13-16`: all 11 traited schools are `wideOpen`; `factory` and `developmental`
are inert today. So **76 chars is today's realistic max option label and 107 is the content-possible
max** — the clamp must be sized for 107, not 76.

**The 9 overflow-capable nodes, all unclamped:**

| # | Node | CSS | Rendered at | Longest real input |
|---|---|---|---|---|
| 1 | `.card-title` | `app.css:128-135` | `CareerScreen.tsx:30, :39` | 34 chars |
| 2 | `.card-body` | `app.css:137-140` | `CareerScreen.tsx:40` | 194 chars |
| 3 | `.option` | `app.css:151-164` | `CareerScreen.tsx:43` | 107 chars |
| 4 | `.outcome` | `app.css:187-193` | `CareerScreen.tsx:32` | 241 chars |
| 5 | `.resolved-choice` | `app.css:180-185` | `CareerScreen.tsx:31` | 118 ("You chose: " + 107) |
| 6 | `.rail-school` | `app.css:74-78` | `CareerScreen.tsx:14` | 18 chars |
| 7 | `.ovr-band` / `.trust` | `app.css:107-116` | `CareerScreen.tsx:23-24` | 33 / 37 (`bands.ts:17`, `:28`) |
| 8 | `.path` | `app.css:354-360` | `SummaryScreen.tsx:40` | ~90 (5 schools joined with " → ") |
| 9 | `.season-stats`, `.honors li`, `.moment`, `.log-meta`, `.share-pre` | `app.css:389-443, 447-459` | Summary/Log | unbounded (stat count is position-driven) |

`.ovr-gloss` does carry `min-width: 0` (`app.css:104`), which is the one flex-overflow guard in the
file — keep it.

**Height arithmetic** (derived from the CSS, *not* measured in a browser — Archivo's real advance
widths make this ±10%). Inside `.frame` at ≥840px viewport, `.card` content width is
544 − 2 − 67.2 = **~475px**.

| Composition | Card height | Document height |
|---|---|---|
| Worst authored event: 34-char title (2 lines) + 194-char body (4 lines) + 3 options at 2 lines | ~561px | ~754px |
| Worst hub: Transfer Portal, 4 options at 2 lines (76-char labels) | ~530px | ~723px |
| Worst resolved card: 2-line title + 241-char outcome (5 lines) + Continue | ~409px | ~600px |

Against 002's `90svh` / `min-h-[520px]` lock: the worst decision needs ~650px *inside* the shell, so
the lock **fails on any viewport shorter than roughly 720px** — and it fails harder in the target
layout, where the decision column is 411px wide rather than 475px. Conclusion: G3 is not a nicety,
it is the precondition. 002 §7k is right.

---

## 2. Type scale

### What we do now — every declaration in the file

| Role | `file:line` | Size (computed) | Weight | Leading | Width axis / tracking |
|---|---|---|---|---|---|
| Body / default | `app.css:30-39` | **17px** | 400 (inherited default) | 1.55 | `wdth 100` |
| `.cond` helper | `:42-45` | — | — | — | `wdth 76`, `+0.01em` |
| `.rail` | `:62-72` | 0.95rem = **15.2px** | 400 | 1.55 | `wdth 76` |
| `.rail-school` | `:74-78` | 1.05rem = **16.8px** | **600** | 1.55 | `wdth 76` (inherited) |
| `.ovr-number` | `:92-99` | 2.6rem = **41.6px** | **800** | **1** | `wdth 68`, tabular |
| `.ovr-band` | `:107-111` | 1rem = **16px** | 400 | 1.55 | `wdth 82` |
| `.trust` | `:113-116` | 0.88rem = **14.1px** | 400 | 1.55 | `wdth 76` |
| `.card-title` | `:128-135` | clamp → **28px @400w, 38.4px @≥640w** | **700** | 1.08 | `wdth 70`, **−0.005em** |
| `.card-body` | `:137-140` | **17px** (inherited) | 400 | 1.55 | `wdth 100` |
| `.option` label | `:151-164` | **17px** (`font: inherit`) | **400** | 1.55 | `wdth 100` |
| `.resolved-choice` | `:180-185` | 0.92rem = **14.7px** | 400 | 1.55 | `wdth 76` |
| `.outcome` | `:187-193` | 1.12rem = **17.9px** | 400 | **1.6** | `wdth 100` |
| `.continue` | `:195-206` | **17px** (`font: inherit`) | **600** | 1.55 | `wdth 76` |
| `.creation-head` | `:224-231` | clamp → **41.6–64px** | **800** | 0.95 | `wdth 68`, −0.01em |
| `.field > label` | `:235-241` | 0.9rem = **14.4px** | 400 | 1.55 | `wdth 76` |
| `.jersey-hash` | `:266-272` | 3rem = **48px** | **700** | 1 | `wdth 68` |
| `.jersey-input` | `:274-288` | clamp → **56–88px** | **800** | 1 | `wdth 68`, tabular |
| `.seed-note` | `:297-302` | 0.85rem = **13.6px** | 400 | 1.55 | `wdth 76` |
| `.primary` | `:304-317` | 1.05rem = **16.8px** | **700** | 1.55 | `wdth 76` |
| `.verdict` | `:336-344` | clamp → **38.4–57.6px** | **800** | 0.98 | `wdth 66`, tabular |
| `.path` | `:354-360` | 1.05rem = **16.8px** | 400 | 1.55 | `wdth 76` |
| `.section-head` | `:369-375` | 1rem = **16px** | **700** | 1.55 | `wdth 76` |
| `.season-school` | `:386` | 17px | **600** | 1.55 | `wdth 76` |
| `.season-stats` | `:389-397` | 0.88rem = **14.1px** | 400 | 1.55 | tabular |
| `.honors li` | `:401-405` | 17px | 400 | 1.55 | `wdth 88` |
| `.share-pre` | `:431-443` | 0.92rem = **14.7px** | 400 | **1.5** | `wdth 100` |
| `.log-name` | `:456` | 17px | **600** | — | `wdth 76` |
| `.log-meta` | `:459` | 0.88rem = **14.1px** | 400 | — | — |

**Totals, directly comparable to 002 §3:**

| | Reference bundle | Ours |
|---|---|---|
| Size declarations ≤12px | **125 of 156 (80%)** | **0 of 18 (0%)** |
| Size declarations ≥16px | 13 of 156 | **14 of 18 (78%)** |
| Smallest size in the file | 4px (rejected by DECISION 008) | **13.6px** (`.seed-note`) |
| Weight declarations ≥700 | **112 of 142 (79%)** | 8 of 12 — but all 8 are display/numeral roles |
| Content-bearing nodes at weight 400 | **zero `font-normal` in the file** | **all of them**, by inheritance from `body` |
| `leading-none` equivalents | 43 | 4 (`.ovr-number`, `.jersey-*`, `.verdict`, `.creation-head`) — all numerals, none on labels |
| `leading-tight` on prose | 8 | 0 — our prose runs **1.55–1.6** |
| `uppercase` | 39 | **0** |
| Wide tracking (≥0.14em) | 16 | **0** (our only positive tracking is +0.01em on `.cond`) |
| Tight tracking on large numbers | 9 | 2 (`.card-title` −0.005em, `.creation-head` −0.01em) — **not on `.ovr-number` or `.verdict`** |
| `tabular-nums` | 12 | **7** — `:80, :98, :287, :343, :366, :387, :396` |

### Delta against 002's six-step scale (DECISION 008)

| 002's step | Target | Our nearest | Delta |
|---|---|---|---|
| `--t-hero` 34px/900 | OVR | `.ovr-number` 41.6px/**800** | −7.6px, +100 weight. **900 is not loadable** — see below |
| `--t-title` 18px/800 | decision headline | `.card-title` 38.4px/700 | **−20.4px**, +100 weight. The single largest inversion in the file |
| `--t-label` 15px/700 | option label | `.option` 17px/**400** | −2px, **+300 weight** |
| `--t-body` 13px/500 | prose | `.card-body` 17px/400, lh 1.55 | −4px, +100 weight, leading 1.55 → ~1.25 |
| `--t-meta` 11px/700 uppercase 0.16em | rail labels | **role does not exist** | `.rail` has no labels at all — it is four bare values (`CareerScreen.tsx:14-17`) |
| `--t-micro` 10px/700 | table headers | **role does not exist** | no table |

**Which declarations are already right** (do not touch — see §6): the *width-axis* strategy
(`wdth 66-76` condensed for numerals and chrome, `wdth 100` for prose) is exactly the polarity 002
describes Inter achieving with weight, and it is ours. Tabular numerals are already on all seven
numeric roles. `.ovr-number` already has `line-height: 1`.

**Which invert the recommendation:** the four prose/label roles (`.card-body`, `.option`, `.outcome`,
`.card-title`) are all larger and lighter than the target, and `.card-title` at 38.4px against a
target of 18px is more than 2× over.

**Blocker for DECISION 008 nobody has flagged yet:** `app.css:6` imports
`family=Archivo:wdth,wght@62..125,400..800`. **The weight axis stops at 800.** DECISION 008 reserves
900 for numerals; today a `font-weight: 900` renders as synthetic-bold-of-800 or clamps to 800.
Archivo's variable font supports `wght 100..900`, so the fix is a one-token edit on that line
(`400..800` → `400..900`). It costs nothing and must land in the same brief as the type scale.

---

## 3. Colour roles

### Our full token set (`app.css:8-24`)

| Token | Value | Role in 002's architecture |
|---|---|---|
| `--turf-deep` | `#070d0a` | `--background` |
| `--turf` | `#0c1712` | `--card` (but it is our **body** background, `:32`) |
| `--card` | `#16241d` | `--muted`/`--surface` |
| `--card-edge` | `#22372d` | `--secondary` |
| `--line` | `#24382e` | `--border` |
| `--chalk` | `#eef3ef` | `--foreground` |
| `--chalk-dim` | `#93a89b` | `--secondary-foreground` |
| `--chalk-faint` | `#64776c` | `--muted-foreground` |
| `--bulb` | `#f0b429` | `--ring` — **plus seven other jobs** |
| `--bulb-dim` | `#8a6a1f` | (no counterpart) |
| `--sans` | Archivo | `--font-sans` |
| `--measure` | `34rem` | container width |

Five surface steps, three text steps, one accent, one font, one measure. 002's appendix asks for two
more surface steps (`--card-raised`, `--input`), radius tokens, gap tokens and duration tokens —
**none of which exist**. Instead:

- **6 hard-coded colours outside `:root`:** `#101b16` at `:157` (`.option` ground), `:248`
  (`.input`/`.select` ground), `:435` (`.share-pre` ground) — that is precisely 002's missing
  `--input` step, already in use three times; `#16241d` at `:168` (`.option:hover`) and `:472`
  (`.notice`) — a literal re-spelling of `var(--card)`; `#d3ded6` at `:139` (`.card-body`) — a
  **fourth text step** that is not in the token set at all.
- **7 literal radii:** `5px` (`:124`), `2px` (`:160, :203, :250, :314, :327, :471`), `3px` (`:437`).
- **Literal durations:** `120ms` (`:163`), `220ms` (`:210`).
- **Literal focus colour:** `rgba(240, 180, 41, 0.35)` at `:174` — `--bulb` retyped as rgba rather
  than referenced, so a change to the token silently misses the focus ring.

### `--bulb`: how many jobs? — **eight. Confirmed, not refuted.**

Eleven declaration sites (`grep -rn -- "--bulb\|rgba(240, 180, 41\|#f0b429" src/`):

| # | Job | Sites |
|---|---|---|
| 1 | **Hover affordance** on an option's left edge | `:169` (`--bulb-dim` border), `:170` (`--bulb` left border) |
| 2 | **Focus ring** | `:174` (`.option`, as a literal rgba), `:256` (`.input`/`.select` border), `:290` (`.jersey-input` underline) |
| 3 | **Primary button fill** | `:201` (`.continue`), `:312` (`.primary`) |
| 4 | **Outcome quote rule** — the emphasis bar on resolved prose | `:191` |
| 5 | **Decorative identity numeral** — the jersey number | `:281` |
| 6 | **Summary success signal** — `.verdict` is bulb when drafted, `--chalk` when not | `:342` + `:346` |
| 7 | **Log status signal** — `.log-headline` bulb when drafted, faint otherwise | `:457-458` |
| 8 | **System alert chrome** — the unplayable-save notice | `:469-470` |

Jobs 1, 2 and 3 are three different interaction meanings on one hue, so a focused option and a
hovered option and the primary button are all the same yellow. Jobs 6 and 7 make that same yellow
mean "good result", which is the closest thing in our UI to the emerald/rose semantics DECISION 006
rejects — it is not a *probability* leak (the career is over; the outcome is known) but it does spend
the accent on a meaning the focus ring also claims.

002's prescription — "`--bulb` for focus/selection only; a separate token for the OVR ramp" — needs a
third and fourth token too: a **primary-fill** token and a **status/verdict** token, or jobs 3, 6 and
7 have nowhere to go. **Effort S**, `app.css` only, but it must be the *first* wave-2 CSS task
because G4, G6, G7 and G9 all want to reference tokens that do not exist yet.

Missing entirely: any ramp for the OVR (job for 002 §4's rarity adaptation), and any token for the
ledger's three row states (`done` / `current` / `future` — G1 needs exactly the `--card-raised` step
002 asks for).

---

## 4. The time-orientation gap (DECISION 007)

### What `GameState` actually carries (`src/engine/types.ts:118-165`)

| Field | Type | Ledger use |
|---|---|---|
| `seasonIndex` | `number`, 0-based | **Row index.** Incremented once per full 4-phase cycle at `advance.ts:163`, including redshirt seasons |
| `phase` | `"offseason" \| "nonconf" \| "conference" \| "postseason"` | **Column.** `PHASE_ORDER`, `types.ts:12` |
| `phaseAbs` | `number` | Absolute phases elapsed. **Do not name a view-model field `phaseAbs`** — it is in `FORBIDDEN_KEYS` (`view-model.test.ts:24`) and the boundary test walks the whole view object by key name |
| `eligibility.classYear` | `"FR" \| "SO" \| "JR" \| "SR"` | Row label — but see the redshirt problem below |
| `eligibility.yearsUsed` | `number` | Progress |
| `eligibility.redshirtUsed` | `boolean` | **Row count**: `CLASS_ORDER.length + (redshirtUsed ? 1 : 0)` (`advance.ts:227`) → **4 or 5 rows** |
| `eligibility.draftEligible` | `boolean` | Why the declare hub fires |
| `redshirtSeasonActive` | `boolean` | Marks the row currently being sat |
| `school.schoolId` | `string` | Row school, via `schoolName()` (`view-model.ts:23`) |
| `school.tier` | `Tier` | **Forbidden.** `"tier"` is in `FORBIDDEN_KEYS` (`view-model.test.ts:15`) and 002's own constraint check bans any colour that encodes tier |
| `seasons: SeasonLine[]` | `{seasonIndex, schoolId, snaps, stats, teamWins, teamLosses}` (`types.ts:24-31`) | Per-row record, snaps, stats |
| `overall` | `number` | Current OVR only |
| `status`, `endingReason`, `draftResult` | | Terminal row |

### What `CareerView` has today

`types.ts:44-58` — `playerName`, `positionLabel`, `schoolName`, `classYear`, `seasonRecord`,
`overall`, `standing`, `trust`, `status`, `decision`, `summary`. The only temporal field is
`classYear`, rendered as a bare `<span>` at `CareerScreen.tsx:15`. `seasonRecord` is the *current*
season only (`view-model.ts:38-42` returns null unless the last `SeasonLine` matches `seasonIndex`).
`SeasonView[]` exists but is reachable only through `summary`, which `buildView` sets to `null` while
`status === "active"` (`view-model.ts:125`). **The shape of the career is unreadable until it is over.**

### What `CareerView` would gain

One field. Something like:

```
ledger: {
  seasonIndex: number;
  label: string;            // "FR" | "SO" | "JR" | "SR" | a redshirt-marked 5th
  schoolName: string | null;
  record: string | null;    // "9-3"
  snaps: number | null;
  state: "done" | "current" | "future";
  phases: ("done" | "current" | "future")[];   // length 4, PHASE_ORDER
}[]
```

padded to the full career length (4 or 5). `view-model.ts` would compute it from `state.seasons`
(joined on `seasonIndex`), `state.seasonIndex`, `state.phase`, `state.eligibility` — **no engine
change for any of that.** DECISION 007 is correct on the mechanism.

### Three things DECISION 007's note does not cover, that a wave-2 brief must resolve

1. **Per-row OVR does not exist.** `SeasonLine` (`types.ts:24-31`) has no `overall`. The reference's
   most-praised read — the right column arcing 50 → 82 → 66 — **cannot be reproduced from current
   state**, because the view-model is a pure function of the *current* `GameState` and nothing
   records what OVR was at the end of each season. Options: (a) render OVR only on the current row;
   (b) **engine proposal** — add `overall: number` to `SeasonLine`, written once in `enterOffseason`
   (`advance.ts:194`) where development is already applied; (c) snapshot per season in `UiState` in
   the reducer, which works but scatters career history outside the one module that owns it.
   **Recommend (b) as a written proposal** — `src/engine/**` is frozen, so this report proposes and
   does not edit. It is additive, one field, and `create-career.ts` needs no change (lines are
   pushed in `advance.ts:274`).
2. **`classYear` cannot label 5 rows.** `enterOffseason` advances `classYear` *and* `yearsUsed` on
   every season boundary, redshirt included (`advance.ts:221-225`), and `CLASS_ORDER` runs out at SR.
   A redshirted career therefore reads **FR, SO, JR, SR, SR** — two rows with the same label. Also,
   past seasons' class years are not stored anywhere (`SeasonLine` has none), so the view-model must
   derive them backwards by index, which is ambiguous once a redshirt has been taken (the sat season
   can be *inferred* from `snaps ≈ 0`, but that is an inference, not data). Either the view-model
   synthesizes a label (e.g. `"RS"` on the redshirted row, `"SR"` twice otherwise), or
   **engine proposal** — add `classYear` to `SeasonLine` alongside `overall` in the same one-line
   change. Same file, same write site.
3. **The row count is not fixed.** 002's whole point is a *fixed-length* table: twelve rows from the
   first decision. Ours is 4 until the player takes a redshirt, then 5 — the table would grow a row
   mid-career, which is exactly the "how much is left" signal changing under the player. Cleanest:
   always render 5 rows and mark the 5th as unavailable until `redshirtUsed` is true. That is a
   design call for the wave-2 brief, not an engine change.

### `SeasonView` — reuse or sibling?

**Sibling.** `SeasonView` (`types.ts:13-20`) is a *completed* season: `record`, `snaps`, `stats[]`,
and a `classYear` field that `view-model.ts:48` **hard-codes to `null` for every season** (a latent
dead field — Bug 2). A ledger row must additionally represent *future* and *current* rows, where
`record`, `snaps` and `stats` are all absent, and must carry `state` and per-phase state that
`SeasonView` has no business acquiring (it is also serialized into the summary and into `shareText`).
Widening `SeasonView` with four nullable fields would make the summary's type lie about what it has.
Declare `LedgerRow` next to it and let `SeasonView` alone.

### What the existing tests would need

`view-model.test.ts` needs **no change to pass** — the boundary test (`:48-77`) walks every key of
the built view and asserts the 13 `FORBIDDEN_KEYS` are absent, so a ledger field is checked for free
**provided no row key is named** `tier`, `trait`, `schoolTrait`, `snapModifier`, `probability`,
`weight`, `draftStock`, `character`, `rngCursor`, `pendingEffects` or `phaseAbs`. That is the real
constraint on the shape above, and it is why `label` is a string rather than anything tier-derived.
What should be **added**: a row-count test (4 without a redshirt, 5 with), a monotonic-state test
(no `future` row precedes a `done` row), and — if the engine proposal lands — a test that the
per-row OVR is populated for `done` rows and null for `future` ones. The trait test at `:95-103`
already stringifies the whole view and greps for trait names, so it covers any new field
automatically.

---

## 5. Option rendering

### What we do now

One component, `CareerScreen.tsx:41-47`:

```
<div className="options">
  {view.decision.options.map((o) => (
    <button key={o.id} className="option" type="button" onClick={() => onChoose(o.id)}>
      {o.label}
    </button>
  ))}
</div>
```

CSS, `app.css:142-176`:

| Property | Value |
|---|---|
| Container `.options` | `margin-top: 1.9rem; display: flex; flex-direction: column; gap: 0.6rem` |
| `.option` | `width: 100%; text-align: left; font: inherit` (→ 17px/400); `background: #101b16`; `border: 1px solid var(--line)`; **`border-left: 3px solid var(--line)`**; `border-radius: 2px`; `padding: 0.85rem 1rem`; `transition: border-color 120ms ease, background-color 120ms ease` |
| `:hover, :focus-visible` | `background: #16241d; border-color: var(--bulb-dim); border-left-color: var(--bulb)` |
| `:focus-visible` | `box-shadow: 0 0 0 2px rgba(240, 180, 41, 0.35)` |
| `:disabled` | `opacity: 0.5; cursor: default` |
| **selected** | **does not exist** |
| **media slot** | **does not exist** |

Height is content-driven: a 1-line label is ~54px, a 2-line label ~80px. Options in the same
decision are therefore **different heights whenever their labels wrap differently** — the exact
failure 002 §2 says `auto-rows-fr` exists to prevent.

`.option:disabled` is styled but **unreachable**: no `disabled` prop is ever passed
(`CareerScreen.tsx:43`). On resolve the entire options block unmounts (the ternary at
`CareerScreen.tsx:28` swaps to the resolved branch), so there is no chosen/unchosen state to style.

**Option counts, measured from the bundle:** 102 events → **14 with 1 option, 83 with 2, 5 with 3**
(single-option events are real — e.g. `the-chip-shot`, `k.ts:128`, one option with a 0.8 probability
split). Plus the hubs: Signing Day is `schoolSampler.offerCount = 3` (`content/regions.ts:20`),
Transfer is 1 (stay) + up to 3 = **up to 4** (`transfer.ts:18-43`), Declare and Redshirt are 2.
So the real range is **1–4**, which matches 002's count-driven span rule exactly (`P === 1 ? … : 4`).

### What 002 recommends

Equal-height cards (`auto-rows-fr`, `h-full`), a count-driven grid, `gap-2` (8px), a media slot at
**50% of card height / 100% of width**, and a resolution treatment (chosen keeps `ring-2` at full
colour, unchosen drop to `opacity-30 grayscale`, **both stay on screen**).

### Delta and cost

| Change | Effort | Files |
|---|---|---|
| Equal-height, count-driven grid (`grid` + `auto-rows-fr` + a `data-count` attr or `:has()`), 8px gap | **S–M** | `app.css`, `CareerScreen.tsx` (one attribute) |
| Clamp the label at 107 chars' worth of lines (G3) | S | `app.css` |
| Selected / unchosen states that keep both cards mounted | **M** | `CareerScreen.tsx` (stop unmounting the options block), `types.ts` (`Resolved` needs the chosen `optionId` — it has `choiceLabel` only, `types.ts:7-11`), `reducer.ts` (record it), `app.css` |
| **Media slot** | **M for the slot, L for the content** | `app.css` + `CareerScreen.tsx` are the cheap half. The expensive half is that **the image key does not exist anywhere in our data**: 002's reference keys images by `event × option`, and our `PendingDecision.options` is `{id, label}` (`advance.ts:24-29`). A per-outcome art set is ~195 option-keyed assets at one per option, and `src/content/**` is frozen, so either the UI derives a filename from `eventId + optionId` (no content change — works, and degrades to a neutral placeholder when the file is absent) or content gains an `art` field (proposal, frozen). **Recommend the derived-filename route** — it needs no engine or content edit and lets art land incrementally. |

002's §6 sourcing note (flat vector/silhouette in `--turf`/`--chalk`, not stock photography of real
people) still stands and is the right call for a fictional player; nothing in our code contradicts it.

---

## 6. Where our code already agrees with 002 — **do not touch**

1. **The hidden-mechanics boundary is real and tested.** `view-model.ts` is the only module that
   reads `GameState` for screen data, and `view-model.test.ts:11-25` enforces 13 forbidden keys over
   a full career in all 6 positions × 4 seeds. Every new field goes through it. (DECISION 004.)
2. **No outcome is coloured by branch.** `.outcome` (`app.css:187-193`) uses one neutral
   `--bulb` rule regardless of which branch resolved, and the engine strips the flag
   (`engine/types.ts:155-160`). DECISION 006's rejection #2 is already honoured in code.
3. **No probabilities, EV, weights or tier anywhere in the UI.** `PendingDecision.options` is
   `{id, label}` (`advance.ts:24-29`) — the option's `probability` is physically unreachable from a
   screen. DECISION 006 #1 is structurally enforced, not merely followed.
4. **No slot-machine reveal, no pre-choice chips.** Nothing to remove. DECISION 006 #3.
5. **`character` is never a number.** `trust` is a band phrase from `bands.ts:44-46`; `"character"`
   is in `FORBIDDEN_KEYS`. `overall` is an integer at `CareerScreen.tsx:21`. DECISIONS 002/003 are
   implemented exactly as written.
6. **The width axis is our weight axis.** `wdth 66-76` condensed on numerals, the rail and chrome vs
   `wdth 100` on prose is the same polarity 002 credits Inter's weight range with, and it is more
   distinctive than copying 700/800. **Keep the axis strategy; change the numbers.** (`app.css:1-4`
   documents the intent; it is a good intent.)
7. **`tabular-nums` is already on all seven numeric roles** — `:80, :98, :287, :343, :366, :387, :396`.
   002 §3 says "our `.rail-record` already does this — extend it to the OVR"; it is already on the
   OVR (`app.css:98`). That recommendation is stale; don't spend a brief on it.
8. **`prefers-reduced-motion` is guarded** at `app.css:217-220`, and it kills *all* transitions, not
   just the named animation. The only gap is the future one 002 §7d names — extend it to JS timing
   *if* JS timing is added.
9. **`.ovr-gloss { min-width: 0 }`** (`app.css:104`) — the one correct flex-overflow guard in the
   file. It is the pattern the other flex rows need.
10. **Persistence is silent and defensive.** `storage.ts:24-40` treats every read as
    possibly-absent/possibly-stale and behaves like a first visit rather than throwing; there is no
    save/load chrome. 002 §7h says adopt exactly this. Also `App.tsx:12-20` + `reducer.ts:41-48`
    detect a save that outlived its content and offer a fresh start rather than painting an empty
    card — better than the reference, which has no equivalent.
11. **Share is text, with the seed never omitted** (`share.ts:24`, DECISION 005). 002 §7g says skip
    the rasteriser until someone asks. Nothing to do but reshape the summary around it (G12).
12. **The `aria-live="polite"` on the resolved card** (`CareerScreen.tsx:29`) and `autoFocus` on
    Continue (`:33`) are the right accessibility instincts for a card that swaps in place — preserve
    both through any G9/G10 rework.
13. **No Tailwind, no CSS-in-JS, plain custom properties** (`package.json` dependencies are React and
    React-DOM only). The constraint is met; every 002 recommendation is expressible as tokens here.
14. **The unhinted school name never leaks a trait.** `withHint` (`transfer.ts:7-10`) emits the
    *hint prose*, never the trait id, and `view-model.test.ts:95-103` greps the serialized view for
    all three trait names. Discovery-by-replay is intact.

---

## Found, not fixed (bugs and oddities)

1. **Nested `.frame` on the creation screen.** `App.tsx:49` wraps `<CreationScreen>` in a
   `<div className="frame">`, and `CreationScreen.tsx:38` renders its own `.frame` root. Harmless
   today (same `max-width`), but it means the notice block and the form are in *different* frames
   and any future `.frame` rule (e.g. a display/grid change for G2) will apply twice.
2. **`SeasonView.classYear` is dead.** Declared `ClassYear | null` at `types.ts:16`, hard-coded to
   `null` for every season at `view-model.ts:48`, and never read by any screen. It is the field a
   ledger would want; it is currently a promise the view-model does not keep.
3. **`body { font-size: 17px }` does not scale the rem sizes.** `html` has no `font-size`, so
   `1rem` stays 16px while the body text is 17px. Every `rem` size in the file is therefore sized
   against a base that is *not* the body size — `.ovr-band` at `1rem` is smaller than the prose next
   to it, not equal to it. Worth deciding deliberately during G4 rather than inheriting.
4. **The focus ring is `--bulb` retyped as a literal** (`app.css:174`,
   `rgba(240, 180, 41, 0.35)`). Changing the token will silently miss it.
5. **`.option:disabled` is styled but unreachable** — no `disabled` prop is ever passed
   (`CareerScreen.tsx:43`).
6. **Two inline styles bypass the stylesheet** — `LogScreen.tsx:24` (`color: var(--chalk-faint)`)
   and the two `marginTop` values at `CreationScreen.tsx:122` / `LogScreen.tsx:36`. Small, but they
   are the only three places where the CSS is not the single source of layout.

## Proposals against frozen directories (written, not applied)

**P1 — `src/engine/types.ts`: add `overall: number` and `classYear: ClassYear` to `SeasonLine`
(`:24-31`), written at the existing push site (`advance.ts:274`) and at the development step
(`advance.ts:198-202`).** Additive, ~4 lines, no public-API change. Without it the ledger's OVR
column and its row labels are inferred rather than known, and the reference's best read — the career
arc visible as a column of numbers — is not reproducible. This is the only engine change any gap in
this report needs.

**P2 — none for `src/content/**`.** The option-art question (G6) is solvable by deriving a filename
from `eventId + optionId` in the UI, with a neutral placeholder when the file is absent. No content
edit required.

---

*Report produced by source reading only. No files under `src/**` were read-modified. No dependency,
test or config was touched.*
