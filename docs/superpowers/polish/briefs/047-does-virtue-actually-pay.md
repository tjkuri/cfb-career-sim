# 047 — B62: does virtue actually pay in a played career, and what do the no-choice cards cost?

**Type:** measurement + proposal · **Wave:** 25 · **Status:** ready — dispatch now

Repo: `/Users/tkuri/Documents/personal_projects/cfb-career-sim`

**You implement nothing in the working tree.** This task produces numbers and a written proposal. The
engine and content are frozen; the fix, if there is one, is the user's call and it will be made from
your table. An agent that "just tries" a change in the repo working tree has broken this task.

## The question, and why it is not already answered

A playtester ran a **maximum-virtue** career — team-first option on every card, one school, no
transfers, four seasons — and finished **one standing rung lower than they started**, with **zero**
*"Earned you credit in the locker room"* lines and **five** *"Cost you in the locker room."* They
concluded the good-teammate branch is a coin flip.

The PM then measured the **corpus** — every option in every authored event — and the corpus disagrees:

| | n | mean E[character] | mean success payout | mean p |
|---|---:|---:|---:|---:|
| options whose success branch pays character | 42 | **+2.35** | +3.31 | **0.81** |
| options whose success pays OVR and whose failure costs character | 34 | **−3.14** | +1.29 OVR | 0.60 |

Only 3 of the 42 virtuous options have non-positive EV, and the opportunity is flat across all six
positions. **So the static corpus says virtue pays reliably, and a real career saw it pay nothing.**
One of those two is not describing what actually happens, and nobody has measured the realized
frequency. That is Part 1, and it is the whole reason this brief exists.

The PM's hypothesis — **do not assume it, test it** — is that the defect is the **one-button cards**.
Of 18 single-option cards, 7 move character and **all seven can only move it down; zero can move it
up.** Five of those seven are the Season Opener milestones, which fire in **100% of careers, one per
season**:

```
fixed   milestone-opener-first      p=0.75  +0/-2
fixed   milestone-opener-no-excuse  p=0.75  +0/-2
fixed   milestone-opener-your-team  p=0.75  +0/-2
fixed   milestone-opener-counting   p=0.75  +0/-2
fixed   milestone-opener-last       p=0.75  +0/-2
random  speeding-georgia            p=0.85  +0/-4
random  the-missed-tackle-reel      p=0.60  +0/-1
```

**A refutation is a completely acceptable result and is worth as much as a confirmation.** Seven calls
in this project have been reversed by measuring a complaint instead of implementing it. If the sweep
shows an ordinary good career sees more *"Earned"* than *"Cost"* lines, then the playtester's run was
unlucky rather than structural, B62 shrinks to a variance/legibility item, and you have saved a wave.
Say that loudly if you find it.

## Where things are

Read these; do not read the rest of the repo.

- `src/ui/session/view-model.ts:370` — `lockerRoom: direction(character)`. This is the *only* thing
  that decides whether a card prints *"Earned you credit"* or *"Cost you"*. It is the sign of the
  character delta the card is accounted for. `src/ui/screens/CareerScreen.tsx:81-88` is the wording.
- `src/ui/session/types.ts:223` — the `CardAccount` shape.
- `src/sim/policies.ts` — `PROFILES` and the event strategies (`best`, `lazy`, `saboteur`,
  `antisocial`, `humanLazy`, `random`). Note **there is no "always take the virtuous branch" strategy**
  and `good` uses `events: "best"`, which is not the same thing. That gap matters — see Part 1.
- `src/sim/balance.ts` — `runBalance(runs, seedPrefix, policy, position, homeState)` →
  `BalanceReport` with `bustedRate`, `washoutRate`, `avgFinalCharacter`, `minFinalCharacter`,
  `characterP05`, `characterP25`, `charUnder55Rate`, `charUnder35Rate`, `avgFinalOverall`.
- `src/sim/prose-probe.ts`, `src/sim/repetition-probe.ts` — worked examples of instrumenting a career
  sweep and counting per-card facts. Copy the shape of whichever is closer; do not reinvent a harness.
- `src/content/**` — the events. Read for the seven cards above and for the `milestone-opener-*` set.

## How to work without touching the served tree

Another agent is working in the repo working tree while you run. **Do not modify anything under the
repo working tree except your report file.** Prototype in a detached worktree:

```
REPO=/Users/tkuri/Documents/personal_projects/cfb-career-sim
WT=<your scratchpad dir>/b62-scratch
cd "$REPO" && git worktree add --detach "$WT" HEAD
ln -s "$REPO/node_modules" "$WT/node_modules"
```

Then edit and run `npx tsx ...` inside `$WT`. When done, `git worktree remove --force "$WT"` from the
repo. **Never run `git checkout`, `git restore`, `git stash`, or `git commit` in the repo working
tree** — it routinely holds uncommitted work from other agents.

- **The dev server is already running. Do NOT run `npm run dev`** — it never exits and it is the most
  likely thing to hang you.
- **Never run a foreground command that does not terminate on its own.** Cap sweep sizes so a run
  finishes in minutes; report the sample size you actually used.
- **If a single tool call fails 3 times, stop that line of attack**, write up what you have, and
  report `blocked`. A partial honest report beats a stalled session.
- **A previous agent on this board was killed by a session rate limit mid-task and lost everything it
  had not written down.** Write Part 1 to the report file on disk **before** you begin Part 2.

## Part 1 — the realized-frequency sweep (status quo, no code changes to behaviour)

Over a few thousand careers per cell, at minimum for the `good` profile and one ordinary baseline
(`baselineRandom`), across at least three positions including QB and one non-QB non-Kicker, count
**per career**:

1. **Realized *"Earned"* vs *"Cost"* lines.** How many cards in a career produce a positive character
   account and how many produce a negative one? Give the mean, the median, and the share of careers
   that see **zero** *"Earned"* lines. The playtester saw 0 up and 5 down in four seasons; report how
   far out on the distribution that actually is.
2. **Final-minus-starting character.** Full distribution, not just the mean: p05 / p25 / median / p75
   / p95, and **the share of careers that end below where they started.**
3. **Attribution.** Of the negative character traffic in a career, what share comes from the seven
   one-button cards above, and what share from chosen options that failed their roll? Break the five
   `milestone-opener-*` cards out on their own line — they are the guaranteed traffic.
4. **The gap between corpus and career.** The corpus says a virtuous option is worth +2.35 at p=0.81.
   How many virtuous options does a career actually *get offered*? If the realized count is far below
   what the corpus implies, say why — weighting, gating, or the pool simply not surfacing them.

**`good` uses `events: "best"`, which optimises something; it is not "always be a good teammate."**
Read what `best` actually maximises and say so in the report. If it is not virtue-maximising, add a
**virtue-maximising event strategy in your worktree only** (always take the option with the highest
expected character) and run it as a fourth cell — that is the policy the playtester actually played,
and without it Part 1 does not answer the question that was asked. If you recommend keeping that
strategy in `src/sim/policies.ts` permanently, say so and put the diff in the report; **do not apply
it to the repo working tree.**

**Write Part 1 to the report before you start Part 2.**

## Part 2 — price the three routes

DECISION 070 named three routes. Prototype each in the worktree, measure it the same way as Part 1 so
the rows are comparable, and report what it does. **Measure; do not choose by argument.**

- **R1 — symmetrise the milestone openers.** The 75% branch earns what the 25% branch costs (+2/−2
  instead of +0/−2). Smallest possible change, five cards.
- **R2 — make them real choices.** Give the Season Opener cards a second option so the standing hit is
  something the player was asked about. This is a **content-authoring** cost, not a knob; price the
  authoring honestly (how many cards, how much prose) as well as the numbers.
- **R3 — strip the character effect from the no-choice cards entirely.** +0/−0. The cheapest, and it
  removes a mechanism rather than fixing it; report what is lost.

For each: effect on the Part 1 distributions, on `bustedRate` / `washoutRate` / `charUnder35Rate`, and
on whether the game stays losable. **The game must stay losable** — ordinary play currently busts
~5.67% and a badly-behaved career ~35.00%; a route that flattens those is a route that broke
something, and DECISION 062's economy (misbehaving pays only when you get away with it) is not
reopened. Also check R1 and R3 against the *badly-behaved* profiles: a route that makes it harder to
lose standing helps the antisocial player too, and that is a side effect, not a bonus.

**Do not widen virtuous payouts.** The Part 1 measurement may well show they are fine, and DECISION
063's preserved upside is explicitly not reopened. If your numbers end up arguing for it anyway, that
is a finding — write it down with the evidence, do not act on it.

## What to deliver

1. The Part 1 tables and its four answers.
2. A route table: for each of R1–R3 — what it does to the numbers, what it costs to build, what it
   risks, what it would break.
3. **A recommendation with reasoning, and the acceptance criterion you would hold the implementing
   wave to, stated as numbers, in advance.** The project's rule is that a balance change reports a
   miss rather than tuning itself until it passes; your acceptance criterion is what makes that
   possible, so write it as something that can fail.
4. Anything you found that nobody asked about. Several agents on this board have pushed back on their
   briefs and been right. **If you think this brief is aimed at the wrong thing, say so and show why**
   — that is a better outcome than a faithful execution of a wrong premise.

## Hard constraints — design intent, not preferences

- `overall` **is** shown to the player as a number. `character` is **never** shown as a number, only
  as a band phrase. It swings draft stock ~±7.5 against overall's ~82; an integer would overstate it
  tenfold.
- Never display: school tier or any badge implying it, `draftStock`, event `probability` or `weight`,
  EV, or school trait names. Traits are meant to be discovered by replaying, never stated.
- `src/engine/**` and `src/content/**` are **frozen**. This task writes a proposal; it does not edit
  them in the working tree. Worktree prototypes are for measurement only and are thrown away.
- `src/ui/session/view-model.ts` is the only module allowed to read `GameState`. Do not bypass it.
- 700 tests stay green and both `npm run typecheck` passes exit 0 **in the repo working tree** — which
  is automatic here, because you are not editing it. Verify at the end that `git status --short` in the
  repo shows nothing outside your report file and the other agent's UI files.

**REPORT:** write to `docs/superpowers/polish/reports/047-does-virtue-actually-pay.md`, Part 1 on disk
before Part 2 begins. Return to the PM **only**: status (done / blocked / needs-decision), at most
five bullets, and that path. **Never the full findings.** Lead your bullets with a one-line yes/no on
*"does an ordinary good career see more Earned than Cost?"* and your recommended route.
