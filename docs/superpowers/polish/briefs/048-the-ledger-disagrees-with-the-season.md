# 048 — B64–B67: the season ledger disagrees with the season the player actually played

**Type:** debugging + fix · **Wave:** 25 · **Status:** ready — dispatch now

Repo: `/Users/tkuri/Documents/personal_projects/cfb-career-sim`

**Use the `superpowers:systematic-debugging` skill. Invoke it before you touch anything.** Four
symptoms are reported below; they are probably not four bugs. Find the mechanism, then fix it.

**These are the first hard correctness bugs found in seven playtests of this build.** Everything
before them was feel. Treat them accordingly: reproduce first, fix second, and do not paper over a
display symptom whose cause is upstream.

## The four symptoms, as the player reported them

All four come from one browser playtest (three careers, ~107 decisions). Exact quotes:

- **B64 — the season ledger disagrees with the season the player played.** The senior row recorded
  **"9-3, 0 snaps, 87 overall, +15"** after a season the player had just played through, decision by
  decision. The header read **"0 snaps — 2 Sacks Allowed"** for four consecutive screens. An outcome
  said **"A season on the sideline cost you ground" (−4)** while the sidebar scored the same year
  **+15**. The career's final overall was **83** while that row said **87**.
- **B65 — stats mutate after a season closes.** Season 2 finished at **47 Pancakes**; the next screen
  reported **46** for the same completed season, and the ending screen also said 46. Snaps were seen
  **decreasing, 308 → 300**, for a season already over.
- **B66 — effects with no card.** *"You got hurt between decisions"* appeared attached to a −3 and a
  −4 with **no screen and no injury**, twice. Once with two contradictory explanations in a single
  line: *"An injury healed and gave the points back. You got hurt between decisions."*
- **B67 — MOMENTS silently skips seasons.** Career 3 has no season 3 in the timeline; career 2 has no
  season 2 and no season 4. There is no placeholder — the season simply is not there.

**"0 snaps" on a season the player played is the thread to pull.** Start there. A season line whose
snaps are wrong would explain a wrong overall delta, a wrong standing phrase, a "sideline" verdict on
a played season, and possibly a moment group that has nothing to attach to. Confirm or refute that
before you write any fix — a single upstream cause is a hypothesis, not a finding.

## Where things are

Read these; do not read the rest of the repo.

- `src/ui/session/view-model.ts` — **the only module allowed to read `GameState`**, and the most
  likely home of all four bugs. `:113` and `:146` build season views from `line.snaps`; `:474` decides
  the "season on the sideline" verdict from `seasonOverallDelta(line.snaps, ...)`; `:766-770` note
  that `season?.snaps ?? null` is deliberate — *"null is the absence of a number, never a zero."*
  **A `0` where a `null` was meant is exactly the shape of B64's headline symptom.**
- `src/ui/session/ledger.ts` — the ledger rows.
- `src/ui/screens/SummaryScreen.tsx:27-40, 137` — `groupMoments(moments, seasons)`. This deliberately
  groups by season (a previous wave's fix), so **a missing group is a hole in that grouping**, and
  B67 may be a grouping bug rather than missing data.
- `src/ui/screens/CareerScreen.tsx` — the live header and the between-card accounting lines; B66's
  *"You got hurt between decisions"* string lives in this neighbourhood.
- `src/ui/session/reducer.ts` — how a card resolves and what gets attributed to it.
- `src/engine/types.ts` — `SeasonLine`, including `redshirt` (`:48`), written at `advance.ts:319`.

**Be aware of a fix that landed yesterday:** `advance.ts:251` now filters redshirt seasons out of the
consecutive-buried-seasons window. Redshirt seasons are ~25 snaps and are legitimately low. A sit
season is a *real* season line and must still render as one — do not "fix" B64 by hiding low-snap
seasons.

## What you may and may not change

- **`src/engine/**` and `src/content/**` are frozen.** If the root cause is in the engine — a season
  line written with the wrong snaps, a stat mutated after the season closed — **stop, write a
  reproduction plus a one-paragraph proposal naming the exact line and the exact change, and report
  `needs-decision`.** Do not edit. The PM makes that call and escalates to the user if it touches
  balance. A reproduction of an engine bug is a completely successful outcome for this task.
- **Everything in `src/ui/**` is yours** — but `src/ui/session/view-model.ts` is the boundary that
  makes the hidden-mechanics rule testable. Fix inside it; do not let a screen start reading
  `GameState` to route around it.
- **Another agent is running measurement sweeps in a detached worktree during this wave.** It touches
  no `src/ui` file. You own every file you edit. **Never run `git checkout`, `git restore`, `git
  stash`, or `git commit`** — the tree holds uncommitted work and the PM commits.

## Method

1. **Reproduce each symptom deterministically before fixing it.** `npm run play -- <seed> <policy>`
   prints a full headless career as JSON; `src/sim/**` has probe harnesses to copy. If a symptom needs
   a specific career shape (an injured senior season, a redshirt, a transfer), hunt a seed that
   produces it and **record that seed in the report** so the next session can re-check.
2. **Write a failing test first** for each bug you fix, in the matching `*.test.ts`. That is the
   project's standard and the last engine fix on this board followed it.
3. Fix. Re-run.
4. **State plainly which of B64–B67 you fixed, which you reproduced but could not fix under the
   freeze, and which you could not reproduce at all.** "Could not reproduce" is a real result — say
   so rather than fixing something adjacent to make the report look complete.

## Verify before reporting — all of it, no exceptions

- `npm test` — **700 tests green**, plus the ones you add. Report the new number.
- `npm run typecheck` — **both passes** exit 0.
- `npm run build` — clean.
- `npm run play -- <seed> random` on at least two seeds. **If your change is UI-only this must be
  byte-identical to HEAD.** Do not trust a transcribed hash from this file — recompute both sides
  (checkout HEAD in a detached worktree, run there, diff). If a lane of yours *does* move the output,
  say which seeds moved and why that is expected.
- `git status --short` shows no change under `src/engine/**` or `src/content/**`.
- **Click through the change at `localhost:5173`.** The dev server is **already running** — do NOT run
  `npm run dev`, it never exits and it is the most likely thing to hang you. Play far enough to see a
  full season close and its row appear in the ledger.
- **Never run a foreground command that does not terminate on its own.**
- **If a single tool call fails 3 times, stop that line of attack**, write up what you have, and
  report `blocked`. A partial honest report beats a stalled session.
- **An agent on this board was killed by a session rate limit mid-task and lost everything it had not
  written down.** Write your reproductions to the report file as you find them, not at the end.

## Hard constraints — design intent, not preferences

- `overall` **is** shown to the player as a number. `character` is **never** shown as a number, only
  as a band phrase. It swings draft stock ~±7.5 against overall's ~82; an integer would overstate it
  tenfold.
- Never display: school tier or any badge implying it, `draftStock`, event `probability` or `weight`,
  EV, or school trait names. Traits are meant to be discovered by replaying, never stated.
- `src/engine/**` and `src/content/**` are frozen. Propose, do not edit.
- `src/ui/session/view-model.ts` is the only module allowed to read `GameState`.
- Aesthetic direction is fixed and **not in scope here**: dark theme, clean sans-serif, card-based,
  generous whitespace, minimal chrome. **Do not reopen type, colour, spacing or contrast** — seven
  playtests have found zero visual defects and this task is correctness only. Use the
  `frontend-design` skill only if a fix genuinely requires new visual treatment.

**REPORT:** write to `docs/superpowers/polish/reports/048-the-ledger-disagrees-with-the-season.md`.
Return to the PM **only**: status (done / blocked / needs-decision), at most five bullets, and that
path. **Never the full findings.** Lead your bullets with one line on whether B64–B67 share a single
cause, and the new test count.
