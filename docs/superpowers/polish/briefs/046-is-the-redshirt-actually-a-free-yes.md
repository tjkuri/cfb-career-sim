# 046 — B43: is the redshirt actually a free yes, and what would make it a decision?

**Type:** measurement + proposal · **Wave:** 23 · **Status:** ready — dispatch now

Repo: `/Users/tkuri/Documents/personal_projects/cfb-career-sim`

**You implement nothing.** This task produces numbers and a written proposal. The engine and content
are frozen; the fix, if there is one, is the user's call and it will be made from your table. An
agent that "just tries" a change in the working tree has broken this task.

## Goal

Answer two questions with measurements, in this order, and do not start the second until the first
is on disk:

1. **Is the complaint true?** Two playtesters have independently called the redshirt offer *"a free
   lunch dressed as a gamble"* and *"an obvious free yes."* Nobody has checked. Measure take-vs-decline
   and report whether the numbers agree with them.
2. **If it is true, what are the candidate fixes worth and what do they cost?** Prototype the routes
   below in a scratch copy, measure each, and bring back a table plus a recommendation.

**A refutation is a completely acceptable result and is worth as much as a confirmation.** Five calls
in this project have been reversed by measuring a complaint instead of implementing it. If the
redshirt turns out to be a real fork that merely *feels* free, say so loudly — that changes the fix
from a balance change to a display change, which is a much cheaper wave.

## Why this matters

The card tells the player the redshirt *might backfire*, then applies the result **at the moment they
accept**, before the season it is betting on. `advance.ts` rolls `successProb`, applies
`bumpOverall` (+5) or `sinkOverall` (−3) with `timing: "immediate"`, and only then sits the season.
The offer is made in 2,991 of 3,000 careers.

## Where things are

Read these; do not read the rest of the repo.

- `src/content/redshirt.ts` — the whole config: `successProb`, `bumpOverall`, `sinkOverall`,
  `sitSnapModifier`, and the two outcome descriptions.
- `src/engine/advance.ts` — `applyChoice`'s `REDSHIRT_EVENT_ID` branch (~line 113) is where the roll
  happens; `redshirtOffered` (~line 276) is the eligibility rule (SO, JR, or an active injury);
  `developmentDelta` (~line 172) is `Math.min(cfg.devCap, Math.floor(seasonSnaps / perPoint))` and
  **cannot return a negative number**, which is the reason sitting a season may cost nothing at all.
- `src/sim/policies.ts` — `PolicyProfile` has a `redshirt: "take" | "decline" | "random"` field and
  `PROFILES` holds the named profiles. **This already gives you the A/B for free.**
- `src/sim/balance.ts` — `runBalance(runs, seedPrefix, policy, position, homeState)` returns a
  `BalanceReport` with `draftedRate`, `undraftedRate`, `round1Rate`, `allConfRate`, `avgSeasons`,
  `avgFinalOverall`, `avgFinalCharacter`, `bustedRate`, `washoutRate` and the character percentiles.
- `src/sim/play-headless.ts` — the `npm run play -- <seed> <policy>` entry point.

## How to work without touching the served tree

**A playtester is playing the live build at `localhost:5173` while you run.** Do not modify anything
under the repo working tree except your report file. Prototype in a detached worktree:

```
REPO=/Users/tkuri/Documents/personal_projects/cfb-career-sim
WT=<your scratchpad dir>/b43-scratch
cd "$REPO" && git worktree add --detach "$WT" HEAD
ln -s "$REPO/node_modules" "$WT/node_modules"
```

Then edit and run `npx tsx ...` inside `$WT`. When you are done, `git worktree remove --force "$WT"`
from the repo. **Never run `git checkout`, `git restore`, `git stash`, or `git commit` in the repo
working tree** — it routinely holds uncommitted work from other agents.

- **The dev server is already running. Do NOT run `npm run dev`** — it never exits and it is the most
  likely thing to hang you.
- **Never run a foreground command that does not terminate on its own.** Cap sweep sizes so a run
  finishes in minutes; report the sample size you actually used.
- **If a single tool call fails 3 times, stop that line of attack**, write up what you have, and
  report `blocked`. A partial honest report beats a stalled session.

## Part 1 — is it a free yes? (status quo, no code changes at all)

Do this in the repo itself, read-only, or in the worktree — either is fine, nothing is edited.

Run the A/B: the same profile with `redshirt: "take"` against `redshirt: "decline"`, everything else
held identical, same `seedPrefix`, across **at least three positions** (include QB and at least one
non-QB, non-Kicker) and **at least two event strategies** (a `good`-style optimiser and an ordinary
`random`-style baseline). Sample size large enough that a 1–2pp difference is not noise; say what you
chose and why.

Report, per cell: `draftedRate`, `undraftedRate`, `round1Rate`, `allConfRate`, `avgSeasons`,
`avgFinalOverall`. Then answer, in one sentence each:

1. **Does taking the redshirt improve the career, on the outcomes a player cares about?** By how much?
2. **Is there any position, strategy or state in which declining is better?** If the answer is "none,
   anywhere", that is the finding and it is the strongest form of the complaint.
3. **What does sitting a season actually cost?** Measure it, do not reason about it: with
   `sitSnapModifier` at 0.05, what is the median development a sit season produces, and how does that
   compare to a played season? If the answer is "the sit season costs approximately nothing", say the
   number.
4. **What does the extra year of eligibility buy?** Redshirting raises the class cap by one. Is the
   fifth season worth more than the fourth?
5. The roll is 60/40 on +5/−3, so its expected value is **+1.8 overall**. State plainly whether the
   gamble's *downside branch* is ever actually bad for a career, or whether a −3 career still lands in
   the same place a decline would have.

**Write Part 1 to the report before you start Part 2.**

## Part 2 — the routes

Prototype each in the worktree, measure it the same way as Part 1 so the rows are comparable, and
report what it does. **Measure; do not choose by argument.** If a route turns out to be incoherent or
much larger than it looks, say so and stop measuring it — that is a useful result too.

- **R1 — defer the roll to the end of the sit season.** The literal fix to the complaint: the card
  says "we'll see", the player lives the season not knowing, the +5/−3 lands when the season ends. No
  constant changes. Note that this is **not** inert: the player's overall is different for a whole
  season, and events gate on `minOverall`/`maxOverall`, so the career drifts. Measure the drift.
  Also answer a design question the numbers cannot: **where does the player find out?** Is there a
  screen at the end of a sit season that could carry the outcome, or would this fix create a result
  with nowhere to land? If the latter, say so — that is a UI dependency and it changes the cost.
- **R2 — make the sit season cost what the fiction says it costs.** If Part 1 shows sitting is nearly
  free, the gamble has no stake regardless of when it resolves. Measure what happens if a sit season
  is a real setback. **Do not pick a mechanism from taste** — state the smallest mechanism that
  produces a stake, measure it, and report its side effects (especially on `bustedRate` and
  `washoutRate`, and on whether an ordinary career can now fail for a reason it never could before).
- **R3 — retune `successProb` / `bumpOverall` / `sinkOverall`.** The pure knob. Measure at least two
  settings and report what it would take to make declining correct some of the time. **Report this
  route honestly even if you think it is the weak one** — the team needs to see the cheap option
  priced.
- **R0 — change nothing, fix the telling.** If Part 1 shows the redshirt *is* a real fork, then this
  is a card-wording and display problem, not an economy problem. Say what the player would have to
  see to experience it as a fork. Cost this route too.

## What to deliver

1. The Part 1 table and its five answers.
2. A route table: for each of R0–R3 — what it does to the numbers, what it costs to build, what it
   risks, and what it would break.
3. **A recommendation with reasoning, and the acceptance criterion you would hold the implementing
   wave to, stated as numbers, in advance.** The project's rule is that a balance change reports a
   miss rather than tuning itself until it passes; your acceptance criterion is what makes that
   possible, so write it as something that can fail.
4. Anything you found that nobody asked about. Two agents last wave pushed back on their briefs and
   both were right. **If you think this brief is aimed at the wrong thing, say so and show why** —
   that is a better outcome than a faithful execution of a wrong premise.

## Hard constraints — design intent, not preferences

- `overall` **is** shown to the player as a number. `character` is **never** shown as a number, only
  as a band phrase. It swings draft stock ~±7.5 against overall's ~82; an integer would overstate it
  tenfold.
- Never display: school tier or any badge implying it, `draftStock`, event `probability` or `weight`,
  EV, or school trait names. Traits are meant to be discovered by replaying, never stated.
- `src/engine/**` and `src/content/**` are **frozen**. This task writes a proposal; it does not edit
  them in the working tree. Worktree prototypes are for measurement only and are thrown away.
- `src/ui/session/view-model.ts` is the only module allowed to read `GameState`. Do not bypass it.
- 698 tests stay green and both `npm run typecheck` passes exit 0 **in the repo working tree** —
  which is automatic here, because you are not editing it. Verify at the end that
  `git status --short` in the repo shows nothing but your report file.

**REPORT:** write to
`docs/superpowers/polish/reports/046-is-the-redshirt-actually-a-free-yes.md`, writing Part 1 to disk
before starting Part 2. Return to the PM **only**: status (done / blocked / needs-decision), at most
five bullets, and that path. **Never the full findings.** Lead your bullets with a one-line yes/no on
*"is taking the redshirt strictly better?"* and your recommended route.
