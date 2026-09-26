# 062 — Stop promising a climb, and stop contradicting the sentence above you

**Type:** developer (UI) · **Wave:** 33 · **Status:** ready — dispatch now

Repo: `/Users/tkuri/Documents/personal_projects/cfb-career-sim`

**Goal:** the standing readout currently promises a climb the game cannot deliver, and it contradicts
the prose directly above it. Fix both, keep what it got right, and clear two smaller defects a
playtester found in the same screens.

**Why:** two independent lanes — a 3,000-careers-per-profile measurement and a playtester with no source
access — converged on this last wave. Read **`DECISIONS.md` 087 and 088** and nothing else from that
file. They are the whole background and they are short.

## The state of the tree — read this before you panic

**18 tests under `src/sim/**` are currently RED and that is expected.** An approved content change
(DECISION 086) just landed and those probes snapshot the corpus as it was before it. **Another lane is
re-baselining them right now and they are not yours — do not touch anything under `src/sim/`.**

**Your baseline is the 608 tests under `src/engine`, `src/content` and `src/ui`, which are all green:**

```
npx vitest run src/engine src/content src/ui     # 608 passing — this is your gate
npm run typecheck                                 # TWO passes, both must exit 0
```

## Hard constraints — a cold agent will not know any of this

- `overall` **is** shown as a number. **`character` is NEVER shown as a number** — not an integer, not a
  bar with ticks, not a dot count, not a percentage, not a tooltip. It swings draft stock ~±7.5 against
  overall's ~82; a number would overstate it tenfold. This is DECISION 002 and **it is not reversed by
  this brief.**
- **DECISION 002 explicitly leaves three levers open: words, position and weight.** Item 2 below uses
  **position**. Stay inside those three.
- Never display: school tier or any badge implying it, `draftStock`, event `probability` or `weight`,
  EV, or school trait names.
- `src/engine/**` and `src/content/**` are **frozen.** If you think a change there is needed, write a
  proposal into your report; do not edit.
- `src/ui/session/view-model.ts` is the only module allowed to read `GameState`. **Do not bypass it,
  and do not let a component start reading `GameState` directly.** That boundary is what makes the
  hidden-mechanics rule testable. You may extend `view-model.ts` if you genuinely need to.
- Aesthetic direction is fixed and settled: dark theme, clean sans-serif, card-based, generous
  whitespace, minimal chrome, the decision and its options are the focal point. **Do not reopen type,
  colour or contrast — ten playtests, zero visual defects.**
- **Do not commit. Never run `git checkout`, `git restore` or `git stash`** — the tree holds another
  lane's work and an approved content change. The PM commits.
- **Do not run `npm run dev`** — it is already running on 5173 and never exits. Never run a foreground
  command that does not terminate, and keep any single command under ~7 minutes; two agents died to a
  600s watchdog last wave.
- **Write your report file with a one-line stub as your FIRST action**, and append to it as you go. A
  lane lost all its work last wave by not doing this.

## Refuting this brief is a success condition

Say so plainly if an item below is wrong, and fix what is actually there. Four of this board's best
results came from an agent that found its brief's premise wrong. **Item 1 in particular contains a real
design tension and you may conclude it cannot be resolved as stated — report that rather than silently
sacrificing one half of it.**

## Item 1 — drop the summit, without losing what wave 31 won

**What wave 31 got right, and you must keep:** the readout is permanent, upper-left, on every screen,
with all five rungs named. The playtester's words: *"zero hunting."* Three playtests' worth of *"you
only see the ladder in the credits"* is closed by that, and **any fix that reintroduces hunting is a
regression.**

**What is wrong:** the top rung is **unreachable by construction.** Lane 061 measured that the median
maximum-virtue career finishes on character 75 and the median stock-maximiser on 71 — **4 points apart,
on rungs 14 points apart** — and that no content edit or boundary change separates them. So the scale
displays a summit nobody arrives at. The playtester, who did not know any of that, wrote that it is
*"a list with a visible top I never reached"* and that `YOU ENDED HERE` under the second rung
*"read as a scorecard saying I'd failed a career I was proud of."*

**The task:** make the readout stop reading as a ladder with a summit you failed to reach, while keeping
the player's position and the range legible at a glance.

**The tension, stated honestly:** "show the whole range so nothing is hidden" and "do not display a top
the player cannot reach" pull against each other. **Resolving that is the design work here** — it is why
this is a lane and not a one-line change. Some directions worth considering, none of them mandated:
render the scale relative to where the player *is* rather than as a fixed leaderboard; drop the
top-to-bottom ordering that makes it a rank; keep the five phrases but stop presenting them as steps to
be ascended; change what `YOU ENDED HERE` says or whether the ending screen frames the final position
against the unreached rungs at all. **Use the `frontend-design` skill.** Pick a direction, justify it in
the report, and say what you rejected.

## Item 2 — the display must stop contradicting the sentence above it

**This is the sharpest finding either lane produced.** Verbatim from the playtester:

> *"The readout is less informative than the prose above it — twice it printed 'Earned you credit with
> the program' and the rung didn't move. A coarse 5-step display over a hidden meter teaches players the
> currency is fake."*

The prose fires on a **single card's effect**; a rung boundary needs a **10-point accumulation**. So the
game routinely prints *you earned credit* while the widget beneath it says nothing happened — **and the
widget wins, because it persists.**

**The task: make the marker respond, by position, when a character effect fires** — so a credit line is
corroborated rather than contradicted. Sub-rung movement, within the band, using **position only**.

**The line you may not cross:** no number, no numeric scale, no tick marks the player could count, no
tooltip stating a value, nothing that lets a player reverse-engineer the integer. If your
implementation would let someone count steps and infer the meter, it is too precise. **Coarse,
continuous-feeling position is the target; a legible quantity is the failure.** If you cannot find a
treatment that moves visibly without becoming countable, **say so and stop** — that is a real finding
and DECISION 002 wins by default.

## Item 3 — a refusal must not shout that it was worthless

The playtester declined a tempting bad option **five times and got five nothings.** Some of that silence
is deliberate (DECISION 085 chose not to *pay* for restraint, and that is not reopened here). **But the
display makes the silence far louder than silence.** Verified in source by the PM:

- `src/ui/screens/CareerScreen.tsx:822` renders `own === 0 ? "No change" : ovrText(own)` inside `.delta`
- `src/ui/styles/career.css:1031` gives `.delta` `color: var(--emphasis)` — the **gold accent** — at
  `--delta-size` / `--delta-weight`

**So on a card where the player refused a bad idea, the largest, heaviest, gold-accented element on
screen reads "No change."** The playtester collected the house style around it: *"Less money, zero
risk"*, *"No harm done"*, *"Nobody notices, which is fine"*, and worst — holding the room together
through a coaching change resolving to *"You spend bowl week playing captain to nobody"* / `No change`.

**The task:** a zero delta must not occupy the loudest register on the card. **This is a display change
only — do not add an effect, a credit, or a consolation line; that would reopen DECISION 085.** The
outcome prose still has to be readable, and a player must still be able to tell that nothing moved.

## Item 4 — Senior Day resolves under a click aimed at Continue

Seen **twice**. The playtester aimed at `Continue` and a Senior Day card resolved instead — meaning a
choice was made for them by a mis-targeted click. Reproduce it, find the cause (likely layout shift,
overlapping hit areas, or a control mounting under the pointer between render and click), and fix it.
**A career decision taken by accident is the most serious defect in this brief** even though it is the
shortest item. If you cannot reproduce it, say so and describe what you tried.

## Files you will likely touch

`src/ui/screens/CareerScreen.tsx`, `src/ui/screens/SummaryScreen.tsx`, `src/ui/styles/career.css`,
possibly `src/ui/session/view-model.ts`, plus their tests.

**Out of bounds:** `src/engine/**`, `src/content/**`, **and everything under `src/sim/`** (another lane
owns it this wave).

Note `career-screen.test.ts` deliberately owns the collision between the standing header label and the
rung phrases beneath it, so a careless band edit is supposed to fail a test. **If it fails, read it
before changing it.**

## Verify before reporting

- `npx vitest run src/engine src/content src/ui` — **608 green**, plus whatever you add. Add tests for
  what you change, especially item 2's "does not become countable" property and item 4's regression.
- `npm run typecheck` — both passes exit 0.
- `npm run build` — clean.
- **Click through it at `http://localhost:5173`** and describe what you saw. Check a mid-career card, a
  card where character moves, a card where nothing moves, and the ending screen.
- `git status` — nothing under `src/engine/**`, `src/content/**` or `src/sim/**` may appear.

**REPORT:** write to `docs/superpowers/polish/reports/062-stop-promising-a-climb.md`.
Return to the PM **only**: status, **≤5 bullets**, and that path. **Never the full findings.** Lead with
item 1's chosen direction and what you rejected, then whether item 2 was achievable without becoming
countable, then item 4's cause.
