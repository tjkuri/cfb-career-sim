# 032 — How losable is it now, and what does declaring early actually cost?

**Type:** measurement · **Wave:** 14 · **Status:** ready — dispatch now
**Repo:** `/Users/tkuri/Documents/personal_projects/cfb-career-sim`

## Goal

Two numbers, measured on the committed tree, that two pending decisions are waiting on:

1. **How often is `undrafted` actually reached**, by position and by how badly the career is played?
2. **What does declaring early actually cost** a player, in the terminal they end up with?

## Why

Both are currently anecdotes, and both are about to be put to the user as balance questions. The
house style here is that a contested call gets a number first.

- **B42.** While building a fixture to render the undrafted ending, the PM found that **400 careers
  under a deliberately bad policy produced zero undrafted results** (59 drafted : 1 busted in a
  60-career sample). The ending screen gives `Undrafted` the full width of a headline. If that
  terminal is effectively unreachable, the screen is carrying prominent real estate for an outcome
  almost nobody sees — and more importantly, the downside the whole game is played against may not
  exist. A previous playtester's verdict was *"I could not lose."* A later wave was supposed to have
  fixed that. Nobody has re-measured since two further balance changes landed.
- **B32.** The Declare-early card reads as a trap rather than a gamble: it frames itself as *"Cash in
  now"* and gives no warning. The next wave is meant to make a gamble look like one *before* it is
  taken. That fix cannot be designed without knowing the size of the gamble. If declaring early
  costs almost nothing, the honest fix is to stop calling it a gamble.

**You are measuring, not fixing.** Nothing in this brief asks you to change game behaviour. If you
conclude something should change, you write a proposal in your report; you do not apply it.

## Constraints — HARD, paste-in block

- `overall` **is** shown as a number. `character` is **never** shown as a number, only as a band
  phrase. It swings draft stock ~±7.5 against overall's ~82; an integer would overstate it tenfold.
- Never display: school tier or any badge implying it, `draftStock`, event `probability` or `weight`,
  EV, or school trait names. Traits are meant to be discovered by replaying, never stated.
- `src/engine/**` and `src/content/**` are **frozen**. An agent that believes a change there is
  needed writes a proposal; it does not edit. The PM decides, and brings it to the user if it touches
  game balance.
- `src/ui/session/view-model.ts` is the only module allowed to read `GameState`. Do not bypass that
  boundary.
- 644 tests stay green. Both typecheck passes exit 0. Verify before reporting.
- Aesthetic direction is fixed: dark theme, clean sans-serif, card-based, generous whitespace,
  minimal chrome, the decision and its options are the clear focal point.

## Additional bounds specific to this task

- **Out of bounds for edits:** `src/engine/**`, `src/content/**`, `src/ui/**`, and every existing file
  under `src/sim/`. You are reading them, not changing them.
- **Write any new probe script to your scratchpad directory, not into the repo.** A new file under
  `src/` would hot-reload the dev server, and another agent is playing the game in a browser against
  it right now. Import from the repo with an absolute path and run it with `npx tsx`.
- **Do not use the browser.** A playtester owns it this wave. Everything here is terminal-only.
- **Do not run `npm run dev`** — the server is already up, and `npm run dev` never exits. Never run a
  foreground command that does not terminate on its own.
- **Do not commit, and never run `git checkout`, `git restore`, `git stash`, or `git clean`.** The PM
  commits. Another agent may have uncommitted work in this tree.
- If a tool call fails 3 times, stop that line of attack and write up what you have.

## Where the tooling already is — read these before writing anything

Most of what you need exists and is committed. Read them first; do not rebuild them.

- `src/sim/failure-probe.ts` — already reports a **per-round draft histogram** and splits the busted
  terminal **by mechanism**. Its header comment explains exactly why it exists and what `balance.ts`
  does not give you. CLI: `npx tsx src/sim/failure-probe.ts <runs> <profile|all> <position|all>`
- `src/sim/policies.ts` — `firstOptionPolicy`, `randomPolicy`, and the `PROFILES` used for
  deliberately-bad play. Its comment block defines `lazy`, `saboteur` and `best` and derives the
  scoring weights from `deriveDraftStock`. **Read that derivation before you trust any of its
  output** — `stat` effects score 0, which it records as a known limitation.
- `src/sim/balance.ts` — rates under `randomPolicy`, plus `percentile`.
- `src/sim/play-headless.ts` — one full career as JSON. `npm run play -- <seed> random`.
- The engine's terminal states and washout reasons come from `src/engine/index` (`WASHOUT_REASONS`).

If an existing probe already answers a question below, **run it and cite it**. Only write new code
for the parts that genuinely are not covered — most likely the declare-early A/B in §2.

## 1. How losable is it? (B42)

Over **at least 1,000 careers per cell**, on the committed tree:

- The full terminal distribution — **drafted (by round) / undrafted / busted (by mechanism)** —
  crossed by **policy** (`best`, `random`, `lazy`, `saboteur`) and by **position** (all six).
- **Call out `undrafted` specifically.** Is it reachable at all? Under which policies and positions,
  and at what rate? If the rate is zero or near-zero for a whole policy, say so and say why — find
  the actual gate in the engine that makes it unreachable and name it with a file and line.
- The distribution of final `overall` and of draft stock at the terminal, per policy. A `lazy` career
  and a `best` career should not be producing the same ending; show whether they do.
- A previous measurement put `lazyEarly` at 89% → 56% drafted after an earlier wave, and a redshirt
  cohort at ~96% drafted after a later one. **Reconcile with those numbers** — if you get something
  different, the difference is itself a finding. Say which of the two is measuring what.

The question to answer in one sentence at the top of your report: **can a player who plays badly
actually lose, and does the game's worst realistic ending look meaningfully different from its
average one?**

## 2. What does declaring early cost? (B32)

This is an **identical-seed A/B**. Same seeds, same policy, one difference: at the first offer of the
declare-early decision, one arm takes it and the other declines and plays on.

- **≥1,000 paired careers.** Report the paired difference, not just two independent distributions —
  the whole point is what it costs *the same player*.
- Report: draft rate, **round distribution**, draft stock, final overall, and how many seasons of
  career each arm gave up or gained.
- **Split by when the offer came.** Declaring after two seasons and declaring after four are
  different gambles, and a warning that suits one may be wrong for the other.
- **Report the variance, not only the mean.** A gamble is defined by its spread. If declaring early
  costs 8 points of stock on average but the outcome range barely widens, it is a tax, not a gamble —
  and that distinction decides how the next wave words the card.
- Name the exact place the cost is applied, with file and line.

Then answer, in one sentence: **is declaring early a gamble, a tax, or a trap?** Those are three
different things and the fix differs for each.

## 3. What you may propose (but not apply)

If the numbers say something should change, write it as a **proposal** at the end of the report:
the change, the file and line, what it would move and by how much, the cheapest way to verify it, and
**what measurement would show the proposal to be wrong.** The PM takes balance proposals to the user.

Do **not** propose a fix for B32 that displays `draftStock` or a projected round — a previous
decision refused a round projection by name. A gamble should *look* like one before it is taken;
that is a writing and presentation problem, not a number-display problem.

## Verify before reporting

- `npm test` — 644 green.
- `npm run typecheck` — both passes exit 0.
- `git status --porcelain src/engine src/content src/ui src/sim` — **must be empty.** If it is not,
  you edited something you should not have; say so in the report rather than reverting it.
- State the exact command line for every number you report, so the PM can re-run it.

**REPORT:** write findings to `docs/superpowers/polish/reports/032-how-losable-is-it-now.md`.
Return to the PM **only**: status (done / blocked / needs-decision), **at most five bullets**, and
that path. **Never the full findings.** Lead with the undrafted rate and the one-sentence verdict on
declaring early.
