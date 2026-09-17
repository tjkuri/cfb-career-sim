# 050 — B72: can a player tell which option the locker room is watching?

**Type:** blind audit + measurement · **Wave:** 26 · **Status:** ready — dispatch now

Repo: `/Users/tkuri/Documents/personal_projects/cfb-career-sim`

**You implement nothing and you edit nothing.** This task produces a judgement, scored against a
measurement, and a written proposal. Your only output file is your report.

## The finding you are testing

A measurement over the whole event corpus found:

> Of the **60** multi-option events where character differentiates the options, on **34 (56.7%)** the
> most-virtuous option is **strictly worse on the only number the game shows the player**, by a mean of
> **0.91 expected OVR**.

`overall` is displayed as an integer. `character` is displayed only as a band phrase — deliberately,
and correctly: it swings draft stock ~±7.5 against overall's ~82, so a number would overstate it
tenfold. **That asymmetry is not up for review.**

The hypothesis it raises is B72: **a card can cost the player standing without ever signalling that
standing was on the table.** A player steering by the visible signal would take the corrosive branch on
the majority of character cards *without intending to*, and then get a moral verdict printed on each
one. Supporting evidence: the playtester's reported tally (0 *"Earned"*, 5 *"Cost"*, four seasons)
occurs in **0.26%** of genuinely max-virtue careers but **10.60%** of careers played by a policy that
optimises overall — 40× more consistent with the second.

**If this is right, B62 is a legibility bug wearing a balance bug's clothes**, and the content fix now
in flight on five cards is correct but will not close the complaint. **If it is wrong, say so** — a
refutation here is worth as much as a confirmation and will save the next wave.

## Method — the blind is the point, and it is easy to ruin

Run this in three phases, **writing each to disk before starting the next.** If you look at the effects
before you have recorded your judgement, the audit is worthless and cannot be redone by you.

**Phase 1 — extract, without looking.** Identify the 60 multi-option events where character
differentiates the options, and within them the 34 where the most-virtuous option is strictly worse on
expected OVR. Write a file containing, for each of the 34, **only what a player sees**: the event's
prompt/description and the option **labels**. **No effects, no probabilities, no EV, no outcome prose.**
Then write the same for a **control group** — at least 10 of the 26 events where the virtuous option is
*not* worse on OVR — shuffled in and **not marked as controls.** The control group is what turns this
from an opinion into a test: if you flag the 34 and the controls at the same rate, you are reading
noise.

Events live in `src/content/events/**`. `src/sim/policies.ts` has `optionScore`, `effectScore` and
`optionCharacterScore`, which is how the 34 were identified; reuse them rather than reinventing the
classification.

**Phase 2 — judge cold.** For each card in the shuffled set, reading **only** the prompt and the two
labels, record:

1. **Could a player tell which option the locker room is watching?** yes / no / ambiguous.
2. **Which option would a player steering by "get drafted" pick?**
3. **Is there any cue in the label itself** — a word, a framing, an implied audience — that marks the
   standing cost, or is the only cue the player's own moral intuition about the fiction?

Record all three before you look at a single effect. **Then commit the file to disk.**

**Phase 3 — score.** Reveal the effects and score your Phase 2 answers against them. Report:

- **Hit rate on the 34 versus the control group.** If they are the same, B72 is refuted and the
  difficulty is general, not specific to the conflict cards.
- How often the "get drafted" pick and the virtuous pick are the same option, and how often the label
  gave *any* warning.
- The cards that fail worst, quoted — those are the concrete ones a fix would start from.

## What to deliver

1. The three phase files and the scored result.
2. **A verdict on B72 in one sentence**, confirmed / refuted / partial, with the number behind it.
3. **If confirmed: what the player would have to see.** Propose remedies against the constraint that
   EV, probability and a character *number* can never be shown. The interesting space is prose and
   framing — a label that tells you what is at stake without telling you the price — and this project
   has a strong precedent that the fix for an invisible mechanism is display, not balance. **Cost each
   remedy**, including how many of the 34 cards it would need to touch. Note that **`src/content/**` is
   frozen** and another agent is authoring in `milestones.ts` this wave, so your proposal is a proposal.
4. Anything you found that nobody asked about. Several agents on this board have pushed back on their
   briefs and been right. **If you think this brief is aimed at the wrong thing, say so and show why.**

## Rules

- **Edit nothing.** Read-only, plus your report and your phase files (put phase files in your scratchpad
  or alongside the report — not in `src/`).
- **Never run `git checkout` / `restore` / `stash` / `commit`.** The tree holds another agent's
  uncommitted work this wave.
- **The dev server is already running. Do NOT run `npm run dev`** — it never exits and it is the most
  likely thing to hang you. **Never run a foreground command that does not terminate on its own.**
- **If a single tool call fails 3 times**, stop that line of attack, write up what you have, report
  `blocked`. **Write each phase to disk as you finish it** — two agents on this board were killed
  mid-task, and the one that wrote as it went lost nothing.

## Hard constraints — design intent, not preferences

- `overall` **is** shown to the player as a number. `character` is **never** shown as a number, only as
  a band phrase. **This is the constraint your remedies must live inside, not one to propose relaxing.**
- Never display: school tier or any badge implying it, `draftStock`, event `probability` or `weight`,
  EV, or school trait names. Traits are meant to be discovered by replaying, never stated.
- `src/engine/**` and `src/content/**` are frozen.
- `src/ui/session/view-model.ts` is the only module allowed to read `GameState`.
- 708 tests stay green and both typecheck passes exit 0 **in the repo working tree** — automatic here,
  because you are not editing it.

**REPORT:** write to
`docs/superpowers/polish/reports/050-can-a-player-tell-which-option-the-locker-room-is-watching.md`.
Return to the PM **only**: status (done / blocked / needs-decision), at most five bullets, and that
path. **Never the full findings.** Lead your bullets with the one-sentence verdict on B72 and the
hit-rate-versus-control number.
