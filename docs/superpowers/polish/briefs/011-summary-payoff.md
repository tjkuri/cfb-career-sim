# 011 — The summary screen learns from its own best block

Repo: `/Users/tkuri/Documents/personal_projects/cfb-career-sim`

**Goal:** make the end-of-career screen land, by bringing the rest of it up to the one block on it
that already works — and by finally showing the career arc the engine now records.

**Why:** this is the payoff screen and the last thing a player sees before deciding whether to start
another career. The north star for this whole phase is *a playtester who has never seen the game
playing three careers in a row without being asked to* — so the screen that sells career #2 is
load-bearing. The playtest (B5) found it is "a uniform grey scroll" **except** for the seasons
block, which it called **the best screen in the game**. That verdict is the brief: do not rewrite
the seasons block. Learn from it and raise everything else to it.

## Standing rules (these killed two earlier agents — read them)

- **The dev server is already running** on `localhost:5173`. Do not start one.
- **Never run a foreground command that does not terminate.** No `npm run dev`, no `--watch`. Use
  `npm test -- --run`.
- **If a tool call fails 3 times, stop** and write up what you have.
- **Do not commit. Never `git checkout` / `restore` / `stash`.** The tree holds uncommitted work
  from other agents right now; one revert destroys it. The PM commits.
- **Work in priority order and report partial work honestly.** If you are running short, stop after
  an item, verify it, and say which items are done and which are not.

## Files you own

`src/ui/screens/SummaryScreen.tsx`, `src/ui/styles/summary.css`, `src/ui/session/view-model.ts`,
`src/ui/session/view-model.test.ts`, `src/ui/session/types.ts` — **but in `types.ts` you may only
touch `SeasonView` and `MomentView`.** Another agent owns `Resolved`, `SeasonStamp` and `CareerView`
in that same file this wave; do not reformat it, do not reorder it, and keep your edits inside those
two interfaces so the two sets of changes cannot collide.

**Out of bounds:** `src/engine/**`, `src/content/**` (both frozen), and
`src/ui/screens/CareerScreen.tsx`, `src/ui/styles/career.css`, `src/ui/styles/tokens.css`,
`src/ui/session/reducer.ts`, `src/ui/App.tsx`, `src/ui/session/ledger.ts` — other in-flight tasks
own those.

## Read first

- `docs/superpowers/polish/reports/003-baseline-playtest.md` — the B5/B6 findings in the
  playtester's own words. **Read what they praised before changing anything.**
- `docs/superpowers/polish/DECISIONS.md` — **009** (why `SeasonLine` now carries `overall` and
  `classYear`), **012** (magnitude may drive scale/weight/motion; hue may never track valence),
  **014** (a null record is the absence of a record, not a placeholder), **005** (the share block is
  text on purpose — no rasterizer).
- `src/ui/session/view-model.ts` — `seasonViews`, `momentViews`, `buildSummary`.

## The work, in priority order

### 1. Show the career arc — the data exists and nothing renders it

DECISION 009 crossed the frozen-engine line **specifically** to record what `overall` was at the end
of each season, on the argument that "the career arc — the reference's single most-praised read, a
right-hand column going 50 → 82 → 66 — cannot be reproduced" without it. That field now exists on
`SeasonLine`. `seasonViews` in `view-model.ts` still does not copy it across, and `SeasonView` has
no slot for it. Likewise `classYear`, which `seasonViews` currently hardcodes to `null`.

Add both to `SeasonView`, populate them in `seasonViews`, and render the arc as a column in the
seasons block. This is the single highest-value item on this screen: it turns a list of rows into a
story with a shape.

**Old saves must not crash.** Pre-DECISION-009 saves have `SeasonLine`s with no `overall` and no
`classYear`. Render those with a null OVR — never `NaN`, never `undefined`. Test it with a fixture.

Note: brief 010 is concurrently measuring how the *ledger* labels a redshirted career's class years
(they are stored ambiguously: `FR, SO, JR, SR, SR`). That is the ledger's problem, not yours — here,
render what is stored, and if a season has no stored class year, render the row without one.

### 2. Dedupe the moments — measure first

B6: the playtest reported the moments timeline showing **duplicate entries**, and the board's
verdict is "dedupe before restyling" — the emoji glyphs are the minor half of that finding.

Before changing anything, **measure it**: run `npm run play -- <seed> random` across a few hundred
careers (the pattern that worked is in `reports/008-measure-repetition.md`) and report how often a
career's `moments` array contains repeated `item` strings, and whether the repeats are the same
event firing in several seasons or the same moment pushed twice in one.

Then fix it in `momentViews`, at the display layer — a moment genuinely earned in three different
seasons is not a bug and must not be collapsed into one; the same moment pushed twice for one event
is. Let your measurement tell you which you are looking at. If the answer is "these are real repeats
across seasons", say so and **group by season instead of deduping** — the `MomentView` already
carries `seasonIndex` and the timeline currently ignores it.

### 3. Raise the rest of the screen to the seasons block

The verdict, the school path, the final overall line, Honors, and the share block are all currently
the same flat grey as each other. The headline of a career — drafted in round 3, or washed out — is
the most consequential sentence the game ever prints, and it is set at roughly the weight of a
caption.

- Give the verdict the ceremony it has earned. `--milestone` is the token for exactly this job (a
  career fact already known and already on screen, given its headline) and `--emphasis` plus the
  `--dur-*` tokens are DECISION 012's documented attachment points.
- **DECISION 012 applies here too:** an undrafted or busted career may be set quieter or heavier, it
  may **not** be set in a different hue from a drafted one. No red/green pair. The prose and the
  weight carry the tone; the palette does not.
- Honors is a bare `<ul>`. Trophies and awards are the rarest things in the game and read like a
  packing list.
- Do not touch the share text itself (DECISION 005 — it is copy-as-text on purpose and the seed line
  is never omitted). Its *presentation* on the page is fair game.

You may not edit `tokens.css`. Consume the tokens; if you need a new one, report it.

## Hard constraints (design intent, not preferences)

- `overall` **is** shown as a number (spec §15) — and the summary is where the final integer has
  always been shown. `character` is **never** shown as a number, only as a band phrase. It swings
  draft stock ~±7.5 against overall's ~82; an integer would overstate it tenfold.
- Never display: school tier or any badge implying it, `draftStock`, event `probability` or
  `weight`, EV, or school trait names. Traits are meant to be discovered by replaying, never stated.
- `src/engine/**` and `src/content/**` are **frozen**. If you believe a change there is needed,
  write a proposal in your report; do not edit.
- `src/ui/session/view-model.ts` is the only module allowed to read `GameState` — you own it this
  wave, so keep it that way: no screen may start reading `GameState` directly, and nothing the
  hidden-mechanics rule forbids may be copied into a view. `view-model.test.ts` asserts this over a
  full career; that test must keep passing.
- Tests stay green and both typecheck passes exit 0. Verify before reporting done.
- Aesthetic direction is fixed: dark theme, clean sans-serif, card-based, generous whitespace,
  minimal chrome, the decision and its options are the clear focal point.

## Verify before reporting

- `npm test -- --run` — **444 green** is the current baseline; you are adding tests, so state the
  new count. Other agents are working in the same tree: if you see a failure in a file you do not
  own, say so in the report rather than fixing it.
- `npm run typecheck` — **two passes, both must exit 0.**
- `npm run build` — clean.
- Click through at `localhost:5173` to a real summary screen. The fastest route is to play a career
  to its end; a washout is quicker than a draft, and you need to see **both** a drafted and a
  non-drafted summary, because DECISION 012's constraint is about exactly that pair.

Use the `frontend-design` skill for the visual work.

**REPORT:** write findings to `docs/superpowers/polish/reports/011-summary-payoff.md`.
Return to the PM **only**: status (done / blocked / needs-decision), at most five bullets, and that
path. Never the full findings — this is the single biggest lever on PM context size.
