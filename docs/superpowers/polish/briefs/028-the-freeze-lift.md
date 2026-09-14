# 028 — The freeze lift: a player who sits does not make plays

Repo: `/Users/tkuri/Documents/personal_projects/cfb-career-sim`

**Goal:** execute four approved changes to frozen files, and measure the balance consequence of the
largest one before and after.

**Why.** Report 027 diagnosed five credibility defects and found the cause underneath three of them:
`requiresPlaying` exists, works, and is missing from almost every content event that awards
production. A player who chooses to sit a redshirt season is handed a bowl-winning field goal and a
pick-six, and the stats go on his ledger row for a season he did not play.

**You are the only agent touching `src/content/**` and `src/engine/**` this wave, and that is
deliberate** — your measurement is over the whole content bundle, so a parallel lane editing any of
it would pollute the number. Two other lanes are running in `src/ui/screens/` and `src/ui/styles/`.

---

## Read before you start

- `docs/superpowers/polish/reports/027-the-credibility-defects.md` — §1, §3, §4, §5, §6. It has the
  measured firing rates, the id lists and the reasoning. **Do not re-derive what it already measured**;
  reproduce its numbers as your baseline check and move on.
- `docs/superpowers/polish/DECISIONS.md` **048**, **049**, **050** — these four changes, as approved,
  with their bounds. Also **040**, which is the precedent for moving the bit-identity baseline, and
  **042**, which is the precedent for an additive `EventConditions` field.

## The four changes

**1. DECISION 048 — `requiresPlaying: true` on all 52 (the big one).**
The 52 on-field events whose outcomes award `stat` or `snaps` production and do not set it. 027 §6
says the id list is reproducible with a short script over `CONTENT.events`; regenerate it rather than
trusting a paste. Plus a `validateContent` rule in `src/content/schema.ts`: *an on-field event
(`nonconf`/`conference`/`postseason`) whose outcomes award `stat` or `snaps` production must set
`requiresPlaying`* — with a test that fails when a new event omits it.

**This one is a balance change and it carries a stop condition.** Before and after, over **at least
1,000 careers** including a redshirt cohort, measure: draft rate, round distribution, and final-OVR
distribution. **If the redshirt cohort's draft rate collapses rather than shifting modestly, stop and
report — do not proceed to tune it.** DECISION 048 names that as the falsifier and it is the PM's
call, not yours. `src/sim/repetition-probe.ts` is a committed probe you can model a sweep on; do not
modify it.

**2. DECISION 049a — `minOverall?: number` on `EventConditions`.** One field in `src/engine/types.ts`,
one check in `src/engine/select-event.ts`, the exact mirror of the existing `maxOverall`. Additive, no
RNG movement. Then apply it, with `minClass: "JR"`, to the four cards 027 §3 names: `bowl-opt-out`,
`all-star-invite`, `all-star-practice-week`, `senior-bowl-invite`. Pick the threshold from the
measured OVR distribution at fire time and **say in your report why that number** — 027 §3 reports a
median of ~66 after the class gate. Then re-measure: if the gate makes any of the four effectively
stop firing, that card wants rewording instead, and 027 §3 records the fallback wording.

**3. DECISION 049b — the redshirt card's own two strings.** `src/engine/advance.ts:74` and `:76`. The
card promises a season that is not played; `sitSnapModifier: 0.05` means every redshirt season credits
snaps, median 26, which is the four-game rule modelled correctly. **The engine is right and the
telling is wrong.** 027 §5 proposes replacement strings — use them or better ones. No behaviour
change; `npm run play` must stay byte-identical *for this change considered alone*.

**4. DECISION 050 — two content fixes.**
- `src/content/events/universal.ts:123-125`, *Playoff or Bust*: "Ten wins is a disappointing season
  here" reads beside a sub-ten-win ledger in 96.5% of its firings. Reword so the program's standard
  cannot be mistaken for this season's scoreboard, and delete the number that invites the comparison.
  027 §4 proposes wording.
- `src/content/events/k.ts`: twelve `fieldGoals` stat effects, only line 141 pairs a `points` sibling.
  Each gains one at `3 * N`, including the two negatives. **Do not** make `points` derived in the
  engine — 027 §1 explains why that diverges every K seed for no gain.

## The prose bar

Changes 3 and 4 put words in front of players, and the writing is this game's best asset. Match the
voice of the file you are editing: second person, present tense, concrete, no third-person slips (a
test enforces this in `milestones.ts`). Short. The PM reads every line before committing.

## Files

You own `src/content/**` and, **only** for the three named sites, `src/engine/types.ts`,
`src/engine/select-event.ts` and `src/engine/advance.ts:74/:76`.

**Out of bounds:** every other line of `src/engine/**` — the engine is frozen and DECISIONS 048/049
lift it for exactly these three sites. Also `src/ui/screens/CareerScreen.tsx`,
`src/ui/screens/SummaryScreen.tsx`, `src/ui/styles/career.css`, `src/ui/styles/summary.css`, which two
other agents own right now. Anything else you believe needs changing is a **proposal in your report**.

## Hard constraints — design intent, not preferences

- `overall` **is** shown as a number (spec §15). `character` is **never** shown as a number, only as a
  band phrase. It swings draft stock ~±7.5 against overall's ~82; an integer would overstate it
  tenfold.
- Never display: school tier or any badge implying it, `draftStock`, event `probability` or `weight`,
  EV, or school trait names. Traits are meant to be discovered by replaying, never stated.
- `src/ui/session/view-model.ts` is the only module allowed to read `GameState`.
- Tests stay green (**baseline is 636**). Both typecheck passes exit 0. Verify before reporting done.
- Aesthetic direction is fixed: dark theme, clean sans-serif, card-based, generous whitespace,
  minimal chrome, the decision and its options are the clear focal point.

## Shell rules — three agents have died on these

- **The dev server is already running on `localhost:5173`. Do not start one.**
- **Never run a foreground command that does not terminate** (`npm run dev`, watch modes).
- **Do not commit.** Do not `git checkout` / `restore` / `stash` / `reset`. Two other agents have
  uncommitted work in this tree. The PM commits.
- If a tool call fails three times, stop and write up what you have.

## Verify before reporting

- `npm test` — 636 green or more, none failing. Expect to add tests.
- `npm run typecheck` — **two passes**, both exit 0. `npm run build` clean.
- **`npm run play` bit-identity: it MOVES, and that is approved** (DECISION 048, precedent 040).
  Record the new hashes for seeds **24, 77 and 101** in your report so the PM can re-baseline. Verify
  change 3 alone does *not* move it.
- The before/after balance measurement above, with its stop condition.
- `git status` shows nothing modified under the out-of-bounds list.

## REPORT

Write findings to `docs/superpowers/polish/reports/028-the-freeze-lift.md`.

Cover: the regenerated 52-id list and how you generated it; the validator rule and its test; the
`minOverall` threshold and why that number; the before/after balance table with the stop condition
explicitly evaluated; the new seed hashes; every line of prose you wrote, quoted in full, so the PM
can read it without opening the diff.

**Return to the PM only:** status (done / blocked / needs-decision), at most five bullets, and that
path. Never the full findings.
