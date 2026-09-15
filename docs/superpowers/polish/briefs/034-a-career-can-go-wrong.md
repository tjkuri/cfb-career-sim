# 034 — A career can go wrong: remove the declare decision, and measure what could replace it

**Type:** design + measurement (NO repo changes) · **Wave:** 15 · **Status:** ready
**Repo:** `/Users/tkuri/Documents/personal_projects/cfb-career-sim`

## Goal

Produce a **measured, costed proposal** for two coupled changes the user has approved in principle:
delete the declare-early decision, and restore a real way for a career to go wrong. **You implement
nothing in the repo.** You prototype candidates in a scratch copy, measure them over thousands of
careers, and come back with numbers so the mechanism can be chosen on evidence.

## Why — read this before anything

**Read `docs/superpowers/polish/DECISIONS.md` entry 057 first.** It is the user's decision and it
carries the reasoning. In short:

- Declaring early is **strictly dominated at every offer** — measured over 9,600 paired
  identical-seed careers, monotonic, no crossover at any position. Round 1 is `0.0000` over 2,400
  careers at each of the first two offers. It is not a gamble; it is a button whose only correct use
  is never. The user chose to delete it rather than reword it.
- **But it is carrying the game's entire failure mode.** Ordinary play with the decision present
  goes undrafted **12–17%** of the time. The same play with it removed: **0–0.3%**. Delete it alone
  and the old *"I could not lose"* complaint returns immediately.

So the two changes are one change. Either both land or neither does.

**The root cause of unlosability is already identified — do not re-derive it.**
`developmentDelta` (`src/engine/advance.ts:172`) is:

```
Math.min(cfg.devCap, Math.floor(seasonSnaps / perPoint))
```

**It cannot return a negative number.** Play and you improve; sit and you stay flat. Overall is a
one-way ratchet. The washout floor is 45 (`src/content/postseason.ts:52`) and an ordinary career
peaks in the 80s, so the floor is never approached. Every other failure path in the game is *an
event rolling badly* — none of them is *the career itself going wrong*.

## Your deliverable

A report that lets the PM and the user pick a mechanism **from numbers, not from plausibility.**

### 1. The removal — what breaks, and what it costs

- Where the declare decision is constructed. It is a synthetic hub built in the engine, not in
  content — start at `src/engine/advance.ts` and the `getDecision` hub branches, and note that
  `src/sim/policies.ts:242` has a `declare` strategy that will need to mean something different.
- **What else reads it.** Tests, the summary screen, the view model, the ledger's class-year
  display, `PROFILES` in `policies.ts`. Enumerate the call sites; do not guess at the blast radius.
- What a career looks like with it gone: career length, decision count per career, and — because
  this is the phase's top finding — **whether longer careers increase repetition exposure.**
  `npx tsx src/sim/repetition-probe.ts 24 B card` (also `C`, also `all`) is the committed gate for
  any repetition claim; use **both** cohorts, neither alone exercises all five opener variants.
- Note the interaction with the redshirt card, which grants a fifth season. With declare gone, is
  the fifth year still a choice worth having?

### 2. The downside — prototype and measure at least three candidates

Prototype each **in a scratch copy of the repo**, not in place. Suggested method, which has
precedent in this phase: `git archive HEAD` into a temp dir, patch the copy, run the probes there.
Measure each candidate over **≥2,000 careers per cell**, across all six positions and at least the
`good`, `baselineRandom` and `lazyFull` profiles.

Candidates to consider — **these are starting points, not a menu; propose better ones if you find
them:**

- **(a) Development can go negative.** A season below some snap threshold costs overall instead of
  holding it flat. The most direct attack on the ratchet, and the most in-fiction: a player who does
  not play falls behind.
- **(b) A plateau or decline curve.** Development tapers and then reverses late, so a career has a
  peak rather than a ceiling.
- **(c) Injuries that do not fully heal.** A serious injury leaves permanent cost. Check what
  `src/engine/` already does with injuries before assuming this is new work — see
  `long-injury.test.ts`.
- **(d) Production-weighted draft stock.** Make `deriveDraftStock` lean harder on snaps and less on
  overall, so a player who never saw the field cannot coast to a good ending on rating alone.

**For each candidate report:** undrafted rate, busted rate and split by mechanism, round
distribution, final-overall distribution, and career length — for each of the three profiles. Plus
the two acceptance numbers below.

### 3. The two acceptance tests every candidate must be scored against

1. **Does it restore failure?** The target is the failure rate the declare card was providing:
   roughly **12–17% undrafted under `baselineRandom`**. Materially under that and the game is still
   unlosable; materially over and it is punishing.
2. **Does it leave a well-played career alone?** Under the `good` profile, a career that does
   everything right should still succeed at close to today's rate (**0% undrafted, ~95–97%
   drafted, 28–52% round 1**). **A mechanism that makes good play fail is disqualified, no matter
   how well it scores on test 1.** Say so plainly for any candidate that trips this.

Report both numbers for every candidate, and **rank them**. State which one you would choose and
why. A recommendation with a number behind it is the deliverable; a survey of options is not.

### 4. What you must also say

- **The cheapest honest version.** If one candidate is one line in `postseason.ts` and another is a
  new subsystem, say so — cost is part of the choice.
- **What each candidate breaks.** Existing tests, `npm run play` seed baselines (bit-identity moves
  by construction here and that is approved — record the new md5s for seeds 24, 77 and 101 for
  whichever candidate you recommend), and any content that assumes overall only rises.
- **The falsifier for your recommendation** — what measurement would show it to be the wrong pick.

## Hard bounds

- **You change nothing in the repo.** No edits under `src/`, none anywhere else except your report.
  All prototyping happens in a scratch copy outside the working tree. `git status --porcelain` must
  be clean apart from your report file when you finish.
- **Do not use the browser.** Another agent owns it this wave. Terminal only.
- **Do not run `npm run dev`** — it never exits. Never run a foreground command that does not
  terminate on its own. Keep each simulation invocation bounded so it returns.
- **Do not commit**, and never run `git checkout`, `git restore`, `git stash` or `git clean` in the
  working tree. Another agent has uncommitted work in it. (Inside your own temp copy, do as you
  like.)
- If a tool call fails 3 times, stop that line of attack and write up what you have.
- **Write your report incrementally** — append each candidate's numbers as you get them. Agents have
  been killed mid-flight in this phase.

## Constraints — HARD, paste-in block

- `overall` **is** shown as a number. `character` is **never** shown as a number, only as a band
  phrase. It swings draft stock ~±7.5 against overall's ~82; an integer would overstate it tenfold.
- Never display: school tier or any badge implying it, `draftStock`, event `probability` or `weight`,
  EV, or school trait names. Traits are meant to be discovered by replaying, never stated.
- `src/engine/**` and `src/content/**` are **frozen.** The freeze is lifted for the *implementation*
  of this work, later, by DECISION 057 — **it is not lifted for you.** You propose; you do not edit.
- `src/ui/session/view-model.ts` is the only module allowed to read `GameState`.
- 644 tests stay green. Both typecheck passes exit 0. Verify before reporting.
- Aesthetic direction is fixed: dark theme, clean sans-serif, card-based, generous whitespace,
  minimal chrome, the decision and its options are the clear focal point.

## Verify before reporting

- `npm test` — 644 green (the working tree is untouched, so this should be unchanged).
- `npm run typecheck` — both passes exit 0.
- `git status --porcelain` — nothing but your report file.
- Give the exact command line for every number, including how the scratch copy was patched, so the
  PM can reproduce any row.

**REPORT:** write findings to `docs/superpowers/polish/reports/034-a-career-can-go-wrong.md`.
Return to the PM **only**: status (done / blocked / needs-decision), **at most five bullets**, and
that path. **Never the full findings.** Lead with your recommended mechanism and its two acceptance
numbers.
