# 014 — Playtest after waves 3 and 4

**Type:** playtester · **Wave:** 5 · **Status:** ready — dispatch once wave 4 is committed

You are a playtester, not a developer. You are a player. **Do not fix anything, do not read source
code, do not review the markup, do not run the tests.** Your entire job is to report how the game
feels to play.

Copy the shape of `briefs/003-baseline-playtest-v2.md` — that session worked and its report is the
best artifact in this phase.

## Setup — read carefully, two earlier agents died here

- Repo: `/Users/tkuri/Documents/personal_projects/cfb-career-sim`
- **The dev server is ALREADY RUNNING at `http://localhost:5173`. Do NOT run `npm run dev`, `npm
  install`, `npm test`, or any build.** `npm run dev` never exits and is the single most likely
  thing to hang you.
- **Never run a foreground command that does not terminate on its own.**
- Browser automation: invoke the `claude-in-chrome` skill first, then load the Chrome MCP tools in a
  **single** ToolSearch call listing every tool at once: `tabs_context_mcp`, `tabs_create_mcp`,
  `navigate`, `computer`, `read_page`, `get_page_text`, `javascript_tool`, `tabs_close_mcp`.
- Clear `localStorage` between careers — keys `cfb-career-sim:v1:current` and
  `cfb-career-sim:v1:log` — with `javascript_tool`, then reload.
- **If any single tool call fails 3 times, stop that line of attack.** Write up what you have and
  report `blocked`. A partial honest report beats a stalled session.
- **Writing the report is the deliverable**, not the optional part. If you are running long, cut to
  two careers and write up.

## The north star, and how to measure it honestly

The goal of this whole phase is: *a playtester who has never seen it plays three careers in a row
without being asked to.* You have now been asked to, which destroys the measurement — so replace it
with one that survives.

**After each career, stop. Before starting another, write down, in one line:**

> *Do I want to play again right now — yes or no — and what is pulling me either way?*

Record that answer **before** you continue. Three honest lines are worth more to us than three
careers played dutifully. If the answer is ever "no", say so plainly and play the next one anyway;
"no, but I did it because you asked" is the single most useful sentence you could write.

## What to play

**Three full careers**, three different positions from the six (Quarterback, Offensive skill,
Offensive line, Defensive line, Defensive skill, Kicker). Make at least one of them Kicker or a line
position — not three skill positions. A career runs 10–45 decisions, median 24.

Play as a player would: read the text, choose what you actually prefer, don't click blindly. You are
allowed to enjoy it. **Notice when you stop.**

## What to report

Feel, not code. Concrete beats abstract — "the third season blurred into the second because nothing
marked the boundary" beats "pacing could be improved."

- Where did you get bored, confused, or lost? At roughly which decision number?
- **Did you know where you were** — in the season, and in the career (which year, how much is left)?
- Did a choice ever feel arbitrary — no basis to pick on?
- Was anything invisible that should have been visible? Anything prominent that did not deserve it?
- What made you want to play again? What made you want to stop?
- **Did the three careers feel different from each other,** or did position turn out to be a costume?
- By career 3, what were you skimming? Be specific about what you stopped reading.

## Claims to confirm or refute

Everything below was built in the last two waves on reasoning that has not yet met a player.
**Refuting one is as valuable as confirming it.** Do not just validate the list — two of the eight
claims in the last playtest were wrong, and catching that saved a wave of work.

For each: **CONFIRMED / REFUTED / PARTIAL**, one or two sentences of what you actually saw, and — if
confirmed — how much it actually cost or gave you as a player.

1. **Some cards have a single option and now play as a short narrated beat** — description and
   outcome together, one Continue. Do these read as *one* event, or as two events awkwardly run
   together? Do they feel better or worse than a card where you actually chose?
2. **The strip above the card** tells you school, name, phase, season, class year and your season's
   snaps and stats. Does it orient you, or is it furniture you stopped reading by season two?
3. **After a choice, the card sometimes prints an overall change** (e.g. `+1 OVR`). Is it loud
   enough when the change is big, and quiet enough when it is small? Did you ever miss one you
   wanted to see?
4. **The critical one — a leak check.** After reading a resolved card, could you tell *anything*
   about the option you did **not** pick? Specifically: could you guess whether the other choice
   would have been better or worse? If you ever felt you could, say exactly which card and what gave
   it away. The game is meant to be a gamble, not a calculator, and the answer here should be no.
5. **The end-of-career screen shows a column of your overall rating season by season.** Does it read
   as a story with a shape, or as a spreadsheet?
6. **A career that ends badly** (undrafted, or a career-ending injury) prints its headline in a
   dimmed version of the same gold as a successful one, rather than a different colour. Does that
   read as *congratulatory* or wrong in any way? Can you tell a washout from a draft at a glance?
7. **The type is smaller and much heavier than it was.** Is anything hard to read? Name the exact
   text if so. Is anything now too shouty?
8. **Long text.** Did any text get cut off, overflow, or collide with anything — especially on the
   outcome paragraphs, which can run long?

## Two things to watch for that nobody has asked about yet

- **Repetition.** Measured: five events fire every single season and are about 40% of a career, and
  the first word-for-word repeat lands around decision 13 in almost every career. You will see them.
  Tell us how much it actually bothered you, and **whether it got worse across the three careers.**
  We know it is there; what we do not know is what it costs.
- **Career length.** Do you ever know how many seasons you have left, or whether a fifth year is
  possible? Report what you believed at the time, even if it was wrong.

## What not to do

- Do not read the source, the specs, or the other reports. Your value is that you are the only
  participant who does not know how it works.
- Do not soften findings. "This was boring" is a usable sentence.

**REPORT:** write to `docs/superpowers/polish/reports/014-post-wave4-playtest.md` and append a
session summary to `docs/superpowers/polish/PLAYTEST-LOG.md`.
Return to the PM **only**: status, ≤5 bullets, and those paths. Lead with the three "do I want to
play again" answers, verbatim — they are the phase's headline metric.
