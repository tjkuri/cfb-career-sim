# 005 — Split `app.css`, then complete the token set

**Type:** developer · **Wave:** 2 (task zero) · **Status:** complete · **Code changed:** `src/ui/styles/**` only

Step 1 (the mechanical split) was already done and PM-verified; I did not touch it. This report
covers **step 2, the token work**, which is all I changed.

---

## 1. The eight `--bulb` jobs and where each now points

`--bulb` was one hue doing eight jobs, so no later task could change one without changing all eight.
Every job now has its own role token. **Every token still resolves to the same value it did before**,
so the split is structural, not visual — that is the point: the roles are now independently
changeable, and nobody has spent an aesthetic decision that belongs to a later brief.

| # | Job (audit §3) | Was | Now | Sites |
|---|---|---|---|---|
| 1 | Hover/pre-select affordance on an option's left edge | `--bulb` / `--bulb-dim` | **`--select`** / **`--select-dim`** | `career.css:110-111` |
| 2 | Focus ring | `--bulb`, plus a retyped `rgba()` | **`--focus`** / **`--focus-halo`** | `career.css:115`, `creation.css:35, :69` |
| 3 | Primary button fill | `--bulb` on `--turf-deep` | **`--action`** / **`--action-ink`** | `career.css:141-142`, `creation.css:90-91` |
| 4 | Outcome quote rule (emphasis on resolved prose) | `--bulb` | **`--emphasis`** | `career.css:132` |
| 5 | Decorative identity numeral (the jersey number) | `--bulb` | **`--identity`** | `creation.css:60` |
| 6 | Summary verdict, accented when drafted | `--bulb` | **`--milestone`** | `summary.css:9` |
| 7 | Career-log headline, accented when drafted | `--bulb` | **`--milestone`** | `log.css:13` |
| 8 | System alert chrome (the unplayable-save notice) | `--bulb` / `--bulb-dim` | **`--alert`** / **`--alert-edge`** | `log.css:25-26` |

**6 and 7 deliberately share one token.** They are the same job on two screens — a career fact that
is already known and already on screen gets its headline. Giving them separate tokens would have
implied they can diverge; they should not.

### Naming, and the rule that outranks it

Names are roles, never colours — `--focus`, not `--amber` — so the token says what may change it.
Two names I considered and rejected:

- **`--success` for jobs 6/7.** Rejected. It is one keystroke from a `--good`/`--bad` pair, which
  DECISION 012 forbids outright. `--milestone` names the *event*, not its valence.
- **`--jersey` for job 5.** Rejected: that names the element, not the role. `--identity` survives a
  later brief moving the player's mark somewhere other than a jersey number.

`tokens.css` carries the DECISION 006/012 rule in a header comment so the next agent reads it before
adding a token: **scale, weight and motion may track magnitude; hue may not track valence.** There is
no `--good`/`--bad`, no red/green pair, and no token keyed to an outcome's branch. `--emphasis` and
the `--dur-*` pair are the documented attachment points for the magnitude set a later brief needs.

---

## 2. The rest of the token set

**Two layers.** Palette names the colour (`--bulb`, `--card`); roles name the job. The accent is now
referenced *only* through the role layer — `grep -rn -- '--bulb' src/` returns hits in `tokens.css`
and nowhere else. Neutral surface and text steps are still referenced directly, because they are
already role-shaped (`--card`, `--line`, `--chalk-dim`) and routing them through a second layer would
have been churn with no reader benefit.

### Surfaces — the two missing steps, plus a text step the audit found

| Token | Value | Why |
|---|---|---|
| `--input` | `#101b16` | The recessed ground. Was hard-coded **three times** (option rows, form fields, share block). |
| `--card-raised` | `#1c2e25` | New. The step between `--card` and `--card-edge` the ledger's current-row and hover state need (G1). Exact midpoint of the two neighbours, not an invented colour. **Unused today** — declared so G1 does not have to invent it mid-task. |
| `--chalk-soft` | `#d3ded6` | The audit's "fourth text step that is not in the token set at all" (`.card-body`). Slots into the existing chalk ramp: `chalk → chalk-soft → chalk-dim → chalk-faint`. |

The other two hard-coded hexes (`#16241d` at `.option:hover` and `.notice`) were literal
re-spellings of `var(--card)` and now say so. **All 6 hard-coded hexes are gone**; no hex exists
outside `tokens.css`.

### Radius — all 7 literals replaced

`--radius-card` 5px (the one large surface) · `--radius-control` 2px (anything you click or type
into, ×6) · `--radius-well` 3px (an inset block of text).

### Duration — both literals replaced

`--dur-state` 120ms (an element reacting to pointer/keyboard) · `--dur-enter` 220ms (content
arriving). Named by what is moving, so the reduced-motion guard and a future magnitude-keyed timing
have somewhere obvious to attach.

### Gap — declared, barely applied, and that is deliberate

A 4px scale (`--gap-1` … `--gap-5`). **I applied it only where an existing literal already landed
exactly on the scale** (`.jersey`). Today's spacing runs 0.2 / 0.25 / 0.3 / 0.6 / 0.7 / 0.85 / 0.9 /
1 / 1.1 / 1.25rem — that is not a scale, and snapping it to one is a **visible** change that belongs
to the layout brief, not here. The tokens exist so that brief has a vocabulary to write in; the
comment in `tokens.css` says exactly this so the next agent does not read the low usage as an
oversight.

### Font axis

`app.css:6` — `400..800` → `400..900`. **Verified loadable, not merely requested:** the loaded
`FontFace` now reports `weight: 400 900`, and a render probe gives 800 → 625.4px vs 900 → 667.0px for
the same string, so 900 is a real master, not synthetic bold or a clamp to 800. DECISION 008's "900
for numerals" is now available. **I restyled nothing with it** — no `font-weight` declaration
changed anywhere; the type scale is a later brief's.

---

## 3. Audit Bug 4, fixed as a side effect

The focus ring was `--bulb` retyped as `rgba(240, 180, 41, 0.35)`, so changing the token would
silently miss it. The accent is now held as channels:

```css
--bulb-rgb: 240 180 41;   /* #f0b429 */
--bulb: rgb(var(--bulb-rgb));
--focus-halo: rgb(var(--bulb-rgb) / 0.35);
```

Measured in the browser, `--focus-halo` computes to `rgba(240, 180, 41, 0.35)` — byte-identical to
the literal it replaced, and now derived from the hue rather than duplicating it. One edit to
`--bulb-rgb` moves every role including the ring. (I used `rgb()` with slash-alpha rather than
`color-mix()` deliberately: the project pins no browserslist, and slash-alpha has been supported
since Chrome 65 / Safari 12.1 where `color-mix()` needs Safari 16.2+.)

---

## 4. Found, not fixed

- **Audit Bug 3 — `body { font-size: 17px }` at `base.css:11` does not scale the rem sizes**, because
  `html` sets no `font-size`. Every `rem` in the stylesheets is therefore measured against 16px while
  the body text renders at 17px (e.g. `.ovr-band` at `1rem` is *smaller* than the prose beside it,
  not equal to it). **In scope to note, out of scope to fix — left untouched, as the brief directs.**
  The type-scale brief owns it and should decide it deliberately rather than inherit it.
- **Jobs 6/7 still spend the accent on "drafted vs not".** The audit flags this as the closest thing
  we have to the emerald/rose semantics DECISION 006 rejects. It is *not* a probability leak — the
  career is over and the result is already stated in prose — and it is gold-vs-neutral, not
  hue-vs-hue, so DECISION 012 is not breached. But it does spend the accent on a meaning `--focus`
  also claims. Changing it is an aesthetic call; I named the role and left the value. **Flagging it
  for whoever owns the summary (G12).**
- **`--card-raised` is declared and unused.** Intentional (G1 needs it). Noting it so nobody deletes
  it as dead.
- **`.continue:focus-visible` / `.primary:focus-visible` outline in `--chalk`, not `--focus`.**
  Pre-existing and probably right — an accent ring on an accent-filled button would vanish — but it
  means one focus treatment sits outside the `--focus` role. Left alone; worth a deliberate call in
  the focus/interaction brief.

---

## 5. Verification

| Check | Result |
|---|---|
| `npm test` | **444 passed / 34 files.** (430 at brief-writing time; the +14 are the two concurrent agents' new tests, all green.) |
| `npm run typecheck` | **both passes exit 0.** Mid-run they briefly failed in `src/engine/**` and `src/ui/session/**` from the concurrent agents' in-flight edits; zero errors ever touched `src/ui/styles/**`, and CSS is not in the TS program. Re-run after they landed: clean. |
| `npm run build` | **clean**, 500ms. CSS 7.42 → **8.26 kB** (added tokens and their comments; gzip 2.27 kB). |
| Files changed | `src/ui/styles/**` only — confirmed by `git status`. No screen, session, engine or content file touched. No commit, checkout, restore or stash run. |

**Screens clicked through, at 1280px desktop and at a true 400px viewport.** A dev server was already
running on 5173; I did not start one and never ran `npm run dev`. Window resizing would not take
effect after two attempts, so rather than keep hammering it I switched to a same-origin 400px
`<iframe>` — which gives a genuine 400px viewport, so the `vw`-based `clamp()`s on `.card-title`,
`.creation-head` and `.verdict` resolve honestly rather than against the outer window.

- **Creation** — heading, jersey numeral in `--identity`, `#` hash, `--input` fields and selects,
  `--action` primary button, seed note, ghost button.
- **Career/decision** — rail, OVR number in `--ovr`, band and trust gloss, card, title,
  `--chalk-soft` body, option rows. **Hover** (lit left edge `--select`, dim border `--select-dim`,
  ground lifting to `--card`) and **keyboard focus** (2px `--focus-halo` ring) both exercised.
- **Resolve-in-place** — resolved choice line, `--emphasis` quote rule, `--action` Continue, fade-in.
- **Summary** — `--milestone` verdict, sub, path, season rows, moments, `--input` share block at
  `--radius-well`, the three buttons.
- **Career log** — `--milestone` headline, rows, meta, empty/back states.

Horizontal overflow measured programmatically at 400px on every screen: **none**
(`scrollWidth === 400` throughout).

`.notice` (job 8) needs a save that outlived its content, which I did not want to forge, so I probed
its rules with a temporary detached element instead. Measured: background `rgb(22, 36, 29)` `#16241d`,
border `rgb(138, 106, 31)` `#8a6a1f`, left border `rgb(240, 180, 41)` `#f0b429` 3px, radius 2px —
all identical to before.

**The strongest evidence is not the screenshots.** I read back the *used* computed values on live
elements and compared them to the pre-change literals: `.verdict` color `rgb(240,180,41)`,
`.share-pre` background `rgb(16,27,22)` / radius `3px`, `.continue` background `rgb(240,180,41)` /
color `rgb(7,13,10)` / radius `2px`, `.option` background `rgb(16,27,22)` / borders `rgb(36,56,46)` /
transition `0.12s`, `.card-body` color `rgb(211,222,214)`, `.card` background `rgb(22,36,29)` / border
`rgb(34,55,45)` / radius `5px`, focus ring `rgba(240,180,41,0.35) 0 0 0 2px`. **Every one matches the
literal it replaced exactly.** No pixel moved.

*One caveat worth stating plainly:* reaching the summary at 400px required playing a career to its
end, which consumed the in-progress save that was in `localStorage` and appended two finished careers
to the log. That is the game's own flow, not data loss, but the save that was there when I started is
gone.
