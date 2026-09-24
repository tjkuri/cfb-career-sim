# 055 — The button promises, and the outcome refuses

Repo: `/Users/tkuri/Documents/personal_projects/cfb-career-sim`
Branch: `polish/ui-phase`. Tree clean, **728 tests green**, dev server on `localhost:5173`.

## Goal

Find every card in the bundle where **the option label asserts an outcome the card can then refuse**,
measure how often a player meets one, and fix the ones that can be fixed in the UI. **Content prose is
frozen** — for anything that needs a label rewritten, you write a proposal, not an edit.

## Why

*"The card's number agrees with its words"* has been put to eight playtesters and **refuted every
time.** It is the highest-yield defect class on this board. The 053 playtest found five instances, and
one is a **reproducible pattern seen three times across three careers**:

> **A single-option card whose button asserts success, and whose outcome is failure with a negative
> number.**

The named instances, from `reports/053-can-you-earn-it.md` §"bugs and defects worth a developer's
time" (read that section; it is short):

- **D30, *Missed Tackle Reel*.** The only button is *"Answer it on the practice field."* The outcome is
  *"the whiffs don't stop."*
- **D33, *Targeting Review*.** The card says the booth stopped the game to review. The outcome says
  *"no flag, no review."*
- **D28.** Prose reads *"in August it shows that you did"*, the verdict reads *"Cost you in the locker
  room"*, and the number is **−1 OVR**.

**Why this is worse on a one-option card than anywhere else.** With two options a label is a *choice*
the player makes and a failure branch is a risk they accepted. With one option the label is the only
thing on screen, the player cannot decline it, and the game has stated an outcome **as the button
text** before rolling against it. DECISION 070 already established that one-button cards are a special
population on this board — seven of them can only cost.

## The work

### 1. Enumerate the class, do not eyeball it

Sweep `src/content/events/**` and find every option whose **label asserts a result** rather than naming
an action, on a card that has a failure branch that can contradict it. Separate:

- **one-option cards** (the acute case), and
- multi-option cards where the *chosen* branch's label is contradicted by its own outcome.

Report the count, the list, and how you decided "asserts a result" — a rule a second reader could apply
and get your list. **Your classifier is an artifact to check, exactly like a diagnosis:** hand-score a
random sample of at least 20 against it and report the disagreement rate.

### 2. Measure what a player actually meets

Per career, per profile (`good`, `virtueLoyal`, `baselineRandom`, `lazyFull`), using the probes in
`src/sim/`: how many contradicted one-option cards does a player see, and what fraction of careers see
at least one? 053 hit the pattern **three times in three careers**, which suggests this is common, not
rare. **Confirm or refute that** — if it is rare, the finding is smaller than it looks and you should
say so plainly.

### 3. Routes, priced, and the split that matters

**The fix for a label that promises is not obviously a UI change, and you must not assume it is.** Price
at least:

- **R0 — do nothing.** Always a live answer on this board.
- **RA — UI.** Is there anything in the *presentation* of a one-option outcome that could stop the
  button reading as a promise, without touching prose? This is the only route you may implement.
- **RB — content.** Rewrite the offending labels to name an *action* rather than assert a *result*
  (*"Answer it on the practice field"* → the action is already there; the assertion is the implied
  success). **Proposal only. `src/content/**` is frozen.**
- **RC — schema/lint.** A validation rule that fails the build when a one-option card's label asserts a
  result. Cheap, prevents recurrence, and needs `src/content/schema.ts` — **which is content. Proposal
  only.**

**Implement RA if and only if it genuinely fixes something.** If the honest answer is that this defect
class lives in the prose and no display change touches it, **say that and implement nothing.** A report
that correctly says "not fixable in my lane" is worth more than a cosmetic change that leaves the
contradiction in place — this board has explicitly paid for that lesson twice.

### 4. The separable small defects, if and only if they are UI

053 also found these. Fix the ones inside your lane; propose the rest:

- **Duplicate narration of one healed injury** — *"An injury healed and gave the points back"* at the
  end of season 2 with **+1**, then again on the first card of season 3 with **+5** (the real
  restoration). One event, narrated twice, with two different numbers.
- **ON THE FIELD label thrash** — the phrase flipped *"All-America caliber"* → *"one of the best in the
  conference"* on a **1-point** 85→84 change and back three cards later. Note `standingPhrase` lives in
  `bands.ts`, **which another agent owns this wave — propose, do not edit.**
- **Stale flavour** — *"your name is written in pencil"* served four years running, including to an
  All-America-caliber senior.

## Hard constraints — design intent, not preferences

- `overall` **is** shown as a number. `character` is **never** shown as a number, only as a band phrase.
- Never display: school tier or any badge implying it, `draftStock`, event `probability` or `weight`,
  EV, or school trait names. **A card must never reveal the roll it made.**
- `src/engine/**` and `src/content/**` are **frozen**, and `schema.ts` is content. Proposals only.
- `src/ui/session/view-model.ts` is the only module allowed to read `GameState`.
- **728 tests stay green.** Both `npm run typecheck` passes exit 0.
- **`src/ui/session/bands.ts` is owned by another agent this wave (brief 054). Do not touch it.**
- Aesthetic direction is fixed: dark theme, clean sans-serif, card-based, generous whitespace, minimal
  chrome, the decision and its options are the clear focal point.

## Verify before reporting

`npm test` · `npm run typecheck` both passes · `npm run build` · and if you changed anything visible,
click it through at `localhost:5173` yourself.

## REPORT

Write findings to
`docs/superpowers/polish/reports/055-the-button-promises-and-the-outcome-refuses.md`.
Return to the PM **only**: status, **at most five bullets**, and that path. Never the full findings.
