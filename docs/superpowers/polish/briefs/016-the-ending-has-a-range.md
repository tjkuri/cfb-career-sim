# 016 — The ending must be able to tell a good career from a bad one

Repo: `/Users/tkuri/Documents/personal_projects/cfb-career-sim`

**Goal:** give the draft summary a visible dynamic range, so a 3rd-round pick and a near-last pick
do not render identically, and so a short or bad career is not congratulated by its own furniture.

**Why:** the 014 playtester played career 3 deliberately badly and reported *"the ending is a gold
headline regardless of what I did"* — and then answered "no" to a fourth career. Measured on our
own screens: **#69 overall and #194 overall print in the same gold, same size, same weight, same
position.** Meanwhile a two-season career that went 7-5 then 5-7 was given an **HONORS** block and a
Moments reel led by a trophy emoji. The screen celebrates every input. That is the last thing a
player sees, and it is currently telling them their choices did not matter.

**This is also the screen the phase's own notes call the best in the game** (B5) — the seasons block
in particular. **Do not rewrite it.** This brief is about range, not redesign.

## Standing rules (these killed three earlier agents — read them)

- **The dev server is already running** on `localhost:5173`. Do not start one.
- **Never run a foreground command that does not terminate.** No `npm run dev`, no `--watch`. Use
  `npm test -- --run`.
- **If a tool call fails 3 times, stop** and write up what you have.
- **Do not commit. Never `git checkout` / `restore` / `stash`.** The PM commits.
- **Work in priority order and report partial work honestly.**
- If you use `localStorage` for test scaffolding, **clean up your keys before you finish.**

## Files you own

`src/ui/screens/SummaryScreen.tsx`, `src/ui/styles/summary.css`, and `src/ui/session/view-model.ts`
+ `src/ui/session/types.ts` **only for the `SeasonView` / `MomentView` / summary-facing interfaces**,
plus their tests.

**Out of bounds:** `src/ui/screens/CareerScreen.tsx` and `src/ui/styles/career.css` (another agent
owns both this wave — **this is a hard boundary, wave 3 nearly collided here**), `src/engine/**` and
`src/content/**` (frozen), `src/ui/styles/tokens.css` (type scale and palette just settled; report
what you need and the PM will place it).

## Read first

- `docs/superpowers/polish/DECISIONS.md` — **021** (the verdict is one hue at two intensities — this
  brief extends that idea, it does not overturn it), **012** (**the governing constraint: magnitude
  may drive scale, weight and motion; hue may never track valence**), **014** (a null record is the
  absence of one), **003** (why OVR is an integer on screen at all).
- `docs/superpowers/polish/reports/014-post-wave4-playtest.md` — **claim 5** (the OVR column is
  confirmed for long careers and **refuted for short ones**: two seasons renders as a 2-row stub in
  a layout built for five) and **claim 6** (this brief's core).
- `docs/superpowers/polish/reports/011-summary-payoff.md` — how the screen is built now, and why.

## The work, in priority order

### 1. A draft position must read differently at a glance

#69 and #194 currently differ only in digits. The draft result is the single sentence the whole
career resolves into, and it has no range.

**DECISION 012 is the spec and it is not negotiable:** magnitude may drive **scale, weight and
motion**; hue may **never** track valence. There is deliberately no `--good`/`--bad` pair in
`tokens.css` and you must not add one. A first-overall pick and a seventh-rounder must be
distinguishable *without* one being green and the other red — the same way the OVR delta already
does it on the resolved card (see `.consequence[data-magnitude]` in `career.css` for the shipped
pattern; read it for the idea, do not edit that file).

Round is the natural magnitude axis, and it is already on screen. Undrafted, if reachable, is the
extreme of the same axis and not a separate colour.

### 2. Stop the furniture congratulating a bad career

A 7-5 / 5-7 two-season career displayed an **HONORS** block and a trophy-led Moments reel. Work out
what actually populates honors and the reel for such a career, and make the screen proportionate:
an honors block with nothing worth honouring should not render at all (DECISION 014's principle —
the absence of a thing is shown as absence, never as a fabricated zero), and the reel should not
lead with a trophy for a losing record.

**Content is frozen**, so if the problem turns out to be the authored strings or what the engine
puts in `moments`, that is a **proposal in your report**, not an edit. Say exactly what you would
change and why.

### 3. Short careers need a layout that fits them

Claim 5: the career-arc OVR column is *"the best thing on the screen"* across four or five seasons
(66 → 63 → 71 → 83 reads as an arc) and becomes a 2-row stub in a five-row frame for a short
career. Make two seasons look intentional rather than truncated.

## Hard constraints (design intent, not preferences)

- `overall` **is** shown as a number (spec §15). `character` is **never** shown as a number, only as
  a band phrase.
- Never display: school tier or any badge implying it, `draftStock`, event `probability` or
  `weight`, EV, or school trait names. **Live in this brief:** DECISION 025 refused a "projected
  round" line; the *final* draft result is of course shown, a *projection* never is.
- `src/engine/**` and `src/content/**` are **frozen**. Proposals go in the report.
- `src/ui/session/view-model.ts` is the only module allowed to read `GameState`.
- **Hue may never track valence.** Say in your report which axis you used for magnitude and confirm
  a bad result and a good result share a hue.
- 492 tests stay green; both typecheck passes exit 0.
- Aesthetic direction is fixed: dark theme, clean sans-serif, card-based, generous whitespace,
  minimal chrome.

## Verify before reporting

- `npm test -- --run` — **492 green** baseline. `npm run typecheck` — both passes exit 0.
  `npm run build` — clean.
- `npm run play -- <seed> random` on two seeds, byte-identical to before your change.
- **You must compare real endings side by side, not one screen.** Use `npm run play` to find seeds
  that produce a high pick, a low pick, and a two-season career, then view each at 1456px and
  360px. A range fix cannot be verified on a single example, and the playtester's complaint was
  precisely that two different endings looked the same.
- Confirm the seasons block itself is unchanged in substance. It is the best screen in the game.

Use the `frontend-design` skill for the visual work.

**REPORT:** write findings to `docs/superpowers/polish/reports/016-the-ending-has-a-range.md`.
Return to the PM **only**: status, ≤5 bullets, and that path. Never the full findings.
