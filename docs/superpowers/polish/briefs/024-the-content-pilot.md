# 024 — The content pilot: Season Opener stops being the same card four times

Repo: `/Users/tkuri/Documents/personal_projects/cfb-career-sim`

**Goal:** Write per-season variants of the `milestone-opener` event, fix three named text defects in
the same file, and **prove on a number** that the first-verbatim-repeat decision actually moves.

**Why:** Two independent playtesters stopped playing, and the named cause was repetition. It was
measured (`reports/008-measure-repetition.md`): five fixed milestone events are 40% of all decisions
in a full career, and the first word-for-word repeat lands at **decision 13 in 99.3% of careers** —
Season Opener in 205 of the 331 careers that repeat at all. The cost is not boredom. By decision 21
the second playtester was skimming bodies on **brand-new** cards, including the best-written injury
card in the game. Repetition trains the player out of reading, and the prose is this game's best
asset. This is a **pilot**: one event, then a measurement that decides whether the other seven get
written at all.

---

## Order of work — this order, not another

The measurement is the gate, so it must be built and validated **before** the content it will judge.

### 1. Rebuild the repetition harness, and commit it this time

`reports/008-measure-repetition.md` produced this phase's key numbers from a throwaway script that
was never committed. Rebuild it as a committed, reproducible probe in `src/sim/` — alongside
`src/sim/balance.ts`, `src/sim/failure-probe.ts` and `src/sim/trait-probe.ts`, whose shape and test
conventions you should copy. Read `reports/008-measure-repetition.md` §Method first; it specifies the
approach precisely.

Essentials from that method:

- Drive the engine's own loop — `createCareer` → `getDecision` → `advance`, the reference loop in
  `src/sim/play-headless.ts`. Record `getDecision(state).eventId` **before** each `advance()`, with
  `seasonIndex`, `phase`, `eligibility.classYear`.
- Attribution is **by event id**, never by string-matching prose. Hub decisions carry the engine's
  synthetic ids (`recruiting`, `redshirt`, `declare`, `transfer`).
- A "verbatim repeat" is a decision whose rendered card is identical to one already shown in that
  career. Under today's content that is the same `eventId` seen twice. **After your variants land it
  is not** — five variant ids render five different cards. So define the repeat key as the pair
  `(title, description)` of the rendered decision, not the id, and verify on today's content that
  this key reproduces the id-based numbers before you change anything. This is the single most
  important detail in the brief: get it wrong and the pilot grades itself.

**Cohorts** — reproduce 008's cohort B, and add C:

- **B — full four-year career**, 144 careers, all six positions balanced: declines the redshirt,
  declines early declare, stays put. The maximum-exposure case and the shape a playtester plays.
- **C — five-year redshirt career**, 144 careers: takes the redshirt once, then as B.

### 2. Reproduce 008's baseline before touching content. Do not proceed if it does not reproduce.

On **unmodified** content, cohort B must come back at:

| | 008 published | Tolerance |
|---|---|---|
| First verbatim repeat lands at decision | **13** (p10–p90 12–13) | exactly 13 |
| Careers with a repeat by decision 16 | **99.3%** | ≥ 98% |
| Decisions per career (median) | **40** | 39–41 |
| Decisions that re-show a card already seen | **45%** | 43–47% |

Note that `reports/022` §8 is the current engine baseline and post-dates 008 — small drift in the
median is possible and is fine inside those tolerances. **If the first-repeat number does not come
back at 13, stop and report `needs-decision`.** Either the harness is wrong or the engine moved, and
either way the gate is not trustworthy yet. Do not "fix" it by widening the tolerance.

### 3. The engine field — exactly this, and nothing more

Per-season variants are not expressible today: `selectFixedEvent` (`src/engine/select-event.ts`)
fires **every** matching fixed event, one per `advance`, in content order. It does not pick one from
a pool. Five variants with no discriminating condition would fire five openers per season.

**Approved by DECISION 042** — read it in `docs/superpowers/polish/DECISIONS.md` before starting:

- Add optional `seasonIndex?: number[]` to `EventConditions` in `src/engine/types.ts`.
- Check it in `eventMatches` in `src/engine/select-event.ts`:
  `if (c.seasonIndex && !c.seasonIndex.includes(state.seasonIndex)) return false;`
- Add its validator clause in `src/content/schema.ts` next to the existing `minClass`/`tier` clauses:
  entries must be integers in 0–4.
- Tests for all three.

**Nothing else in `src/engine/**` moves.** Not a helper, not a rename, not a tidy-up. If you believe
something else is needed, stop and report `needs-decision` with the reason.

**Why `seasonIndex` and not `classYear`:** `advance.ts:228-229` caps `classYear` at `SR`, so a
five-year redshirt career is `FR SO JR SR SR` and two seasons would share a class year — the pilot
would fail for exactly the players who play the most football. This is why cohort C is not optional.

### 4. Write the variants

`milestone-opener` lives in `src/content/events/milestones.ts`. Replace the single event with a
disjoint, exhaustive set keyed on `seasonIndex`, covering **0, 1, 2, 3 and 4**.

**Invariants — these are acceptance criteria, not advice:**

- **Disjoint and exhaustive.** Exactly one variant matches for every `seasonIndex` in 0–4. Write a
  test in `src/content/events/milestones.test.ts` that asserts this directly. Two matching variants
  means two openers in one season; zero means a season with no opener and a silent hole in the spine.
- **Mechanically identical.** Every variant keeps `kind`, `phase`, `weight`, `requiresPlaying`, the
  single option's `id` (`handle-it`), its `label`, its `probability` (0.75), and both outcomes'
  effect lists **exactly as they are today**. Only `id`, `title`, `description` and the two outcome
  `description` strings change. This is what makes the no-change proof in step 6 meaningful.
- **No variant asserts a crowd size, a venue, or a stature the player's school may not have.**
  DECISION 043 item 1: the current line — *"Ninety thousand people, a noon kickoff…"* — fires at FCS
  schools. Write the nerves, not the stadium. The failure mode of refusing to name a venue is prose
  with nothing concrete in it; concrete-but-school-agnostic is the target, not vague.
- **No variant names a class year.** `seasonIndex` 2 is a junior for most players and a sophomore for
  a redshirt. Name the *stage* instead — the first one ever, the one where you are the guy, the last
  one. That is the better beat anyway.
- **Titles may differ between variants.** The repeat key is `(title, description)`; a varying title
  is legitimate and probably right, since the card's heading is the first thing a skimming player
  re-recognises.

**Voice — read this twice.** Both playtesters named the writing as the best thing in the game. The
one outcome that makes this pilot a net loss is diluting it. The register is the existing file:
second person, present tense, short, dry, specific, no exclamation marks, no sports-broadcast cliché,
no motivational register. The joke is always underplayed. Study the surrounding events in
`milestones.ts`, `universal.ts` and `season-life.ts` and match them. **Do not write more words than
the card it replaces** — length is not the fix; sameness is.

### 5. The three text defects — DECISION 043, read it

1. Folded into the variants above (the FCS-blind opener).
2. `milestones.ts:152` — `Had the time of his life at a bowl game` is third person on a second-person
   screen. Fix it, and sweep the whole file for other third-person slips while you are in there.
3. The same line is a `moment` awarded to `enjoy`, the option a tanking player picks to waste the
   season — it is the most congratulatory element on a failed career's end screen. **Do not delete
   it**; it also fires for players genuinely having a good time, and an option with no effects is a
   worse card. Reword it so it reads as what it is: a trip enjoyed, not an achievement earned. Wry,
   not punishing. The icon may change; the effect list keeps its shape.

### 6. Prove nothing moved, then prove something did

**The no-change proof.** Re-run the nine full-eligibility profiles from `reports/022` §8 — that
report is the current baseline for any engine measurement, **not** §1 and not `reports/018` §4. Every
measured field must come back **identical**. If anything moved, a variant is not mechanically
identical; find it and fix it rather than explaining it.

**The gate.** Re-run your harness, cohorts B and C, same seeds. Report the before/after table for
every row in step 2. The pilot's stated hypothesis is that the **first verbatim repeat decision
number moves materially** — the opener is 62% of first repeats, so if it moves only from 13 to 14 the
conclusion is that variants are not the lever and the remaining seven events do not get written.
**Report the number you get. Do not argue it up.** A refutation here is a good outcome for this
phase and it is explicitly what DECISION 030 asked for.

Also report, separately: what cohort C does. The redshirt career is the case class-year gating would
have failed, and it is worth knowing whether `seasonIndex` actually covers it in practice.

---

## Hard constraints — design intent, not preferences

- `overall` **is** shown as a number. `character` is **never** shown as a number, only as a band
  phrase. It swings draft stock ~±7.5 against overall's ~82; an integer would overstate it tenfold.
- Never display: school tier or any badge implying it, `draftStock`, event `probability` or `weight`,
  EV, or school trait names. Traits are meant to be discovered by replaying, never stated.
- `src/engine/**` and `src/content/**` are **frozen**. This brief carries a bounded, written
  exception: `src/content/events/milestones.ts` per DECISIONS 030/036/043, and exactly the four
  additions in step 3 per DECISION 042. Anything beyond that is a proposal, not an edit — stop and
  report `needs-decision`.
- `src/ui/session/view-model.ts` is the only module allowed to read `GameState`. Do not bypass it.
  (You should not need to touch the UI at all.)
- 578 tests stay green. Both `npm run typecheck` passes exit 0.
- Aesthetic direction is fixed: dark theme, clean sans-serif, card-based, generous whitespace,
  minimal chrome, the decision and its options are the clear focal point.

## Setup

```
npm test           # 578 tests, all passing — must stay green
npm run typecheck  # TWO passes, both must exit 0
npm run build
npm run play -- <seed> random    # headless full career, prints JSON
npm run dev        # localhost:5173 — never run it in the foreground, it will hang you
```

## Verify before reporting

- `npm test` — 578 green, plus your new tests.
- `npm run typecheck` — both passes exit 0.
- `npm run build` — clean.
- The `reports/022` §8 nine-profile no-change proof — identical on every field.
- Click through one career at `localhost:5173` and read the openers you wrote **on the actual card**,
  in the real type scale. Prose that works in a file and not on the card is not done.

## Do not commit

**Leave your changes in the working tree.** The PM reads every line of prose before it is committed —
DECISION 030's voice constraint moved that obligation onto them when the user chose agent-written.
Do not `git commit`, do not `git stash`, do not revert. Commit the harness and the content in one
tree and report.

## Report

Write findings to `docs/superpowers/polish/reports/024-the-content-pilot.md`.

Include: the before/after table for every row in step 2; cohort C separately; the no-change proof
result; the full text of every variant you wrote, so the PM can read the prose without opening the
diff; and anything the brief got wrong.

**Return to the PM only:** status (done / blocked / needs-decision), **at most five bullets**, and the
report path. Never the full findings.
