# 017 — Playtest after wave 6 (the ledger, and the ending's range)

**Type:** playtester · **Wave:** 7 · **Status:** ready — dispatch now

You are a playtester, not a developer. You are a player. **Do not fix anything, do not read source
code, do not review the markup, do not run the tests.** Your entire job is to report how the game
feels to play.

## Setup — read carefully, agents have died here

- Repo: `/Users/tkuri/Documents/personal_projects/cfb-career-sim`
- **The dev server is ALREADY RUNNING at `http://localhost:5173`. Do NOT run `npm run dev`, `npm
  install`, `npm test`, or any build.** `npm run dev` never exits and is the single most likely
  thing to hang you.
- **Never run a foreground command that does not terminate on its own.**
- Browser automation: invoke the `claude-in-chrome` skill first, then load the Chrome MCP tools in a
  **single** ToolSearch call listing every tool at once: `tabs_context_mcp`, `tabs_create_mcp`,
  `navigate`, `computer`, `read_page`, `get_page_text`, `javascript_tool`, `tabs_close_mcp`.
- Clear `localStorage` before your first career and between careers — keys
  `cfb-career-sim:v1:current` and `cfb-career-sim:v1:log` — with `javascript_tool`, then reload.
- **If any single tool call fails 3 times, stop that line of attack.** Write up what you have and
  report `blocked`. A partial honest report beats a stalled session.
- **Writing the report is the deliverable**, not the optional part. If you are running long, cut to
  two careers and write up.
- Known harness limit, do not burn a run on it: the extension pins the viewport at ~800 CSS px and
  `resize_window` reports success while nothing changes. Play at whatever width you get and do not
  try to fight it. If the layout looks cramped, say so and note the width you were at.

## The north star, and how to measure it honestly

The goal of this whole phase is: *a playtester who has never seen it plays three careers in a row
without being asked to.* You have now been asked to, which destroys the measurement — so replace it
with one that survives.

**After each career, stop. Before starting another, write down, in one line:**

> *Do I want to play again right now — yes or no — and what is pulling me either way?*

Record that answer **before** you continue. Three honest lines are worth more to us than three
careers played dutifully. If the answer is ever "no", say so plainly and play the next one anyway;
"no, but I did it because you asked" is the single most useful sentence you could write.

The previous playtester's three answers were, in order: *yes* → *"reluctantly yes, but now I want to
**check** something, which isn't the same thing"* → ***no***. **Do not try to match or beat that.**
If you land in the same place, say so; that is the finding. What we need to know is whether the
curve moved, not whether you were kinder.

## What to play

**Three full careers**, three different positions from the six (Quarterback, Offensive skill,
Offensive line, Defensive line, Defensive skill, Kicker). Make at least one of them Kicker or a line
position — not three skill positions. A career runs 10–45 decisions, median 24.

Play as a player would: read the text, choose what you actually prefer, don't click blindly. You are
allowed to enjoy it. **Notice when you stop.**

**One of the three careers — make it the last one — play to end badly on purpose.** Skip the work,
duck the media, play hurt, declare early. We need to know what a bad career looks like from the
inside, and whether the game lets you have one at all.

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

Everything below shipped in the last wave on reasoning that has not yet met a player. **Refuting one
is as valuable as confirming it.** Do not just validate the list — in the last two playtests four of
the claims handed over turned out to be wrong as stated, and catching that saved two waves of work.

For each: **CONFIRMED / REFUTED / PARTIAL**, one or two sentences of what you actually saw, and — if
confirmed — how much it actually cost or gave you as a player.

1. **The career ledger.** The decision screen now carries a column of year-by-year rows beside the
   card. Question one: **while playing, did you use it** — did you ever look at it to decide
   something, or did it become wallpaper by season two? Question two: it shows five rows, with the
   last one hanging off a **dashed** rule labelled *redshirt year* until a redshirt actually
   happens. **Without being told any of that**, what did you think the dashed fifth row meant the
   first time you saw it? Report what you actually believed, even if it was wrong.
2. **Career length.** Given the ledger, did you know how many seasons you had left? Did the title
   screen's "four years to get drafted" and what you saw in the game ever disagree?
3. **The standing block** above the card now reads as two separate lines — a number with an
   on-the-field phrase, a rule, then a locker-room phrase. Does it read as **two different things
   about you**, or still as one sentence arguing with itself? The old version said things like
   *"All-America caliber / just a guy in the building"* on one line.
4. **Character.** It is never a number, only a phrase, and it moved up a step in size. Did you
   notice it change during a career? Did you ever choose differently because of it?
5. **The ending's range — the big one.** A better draft position is now said *louder* — bigger,
   heavier, more entrance — while being the **same colour** at every level. Across your three
   careers: **could you rank two drafted endings at a glance**, without reading the round and pick
   numbers? If not, say so plainly — that reverses a call we just made.
6. **A bad ending.** On your deliberately-bad career: did the end screen read as *congratulatory*
   anywhere? Name the exact element if so. Did it feel like the game noticed you had done badly?
7. **`Also earned`.** Some end screens show a small row of chips under a heading like that,
   separate from the headline honours. Does that row read as a **consolation prize** or a demotion?
   Or does it read fine as "here is everything else you did"?
8. **Two overall numbers.** The end screen can print a `FINAL OVERALL` that differs from the last
   row of the season table (e.g. 80 vs 78). Both are accurate — one counts an offseason of work the
   other does not. **Did you notice? If you noticed, did it read as a contradiction or a mistake?**
   If you did not notice, say that — it is an equally useful answer.
9. **The small print.** Does ordinary dim text still look different from the really-in-the-background
   text — the little labels, the stat line under a season, the "you chose X" line on a resolved
   card? Or does the small print all read as one flat tone? Do not hunt for it with your face
   against the screen; the question is whether it registers at a normal glance.
10. **Anything hard to read, cut off, overflowing, or colliding.** Name the exact text.

## Two things to watch for that nobody has asked about yet

- **Repetition.** Measured: a handful of events fire every single season and are about 40% of a
  career, and the first word-for-word repeat lands around decision 12–13 in almost every career. You
  will see them. The last playtester's finding was not that the repeated cards are dull — it was
  that by career 3 they were skimming *every* card body including brand-new ones. **Tell us whether
  that happens to you, and when it starts.** Nothing has been done about this yet; we are trying to
  size the cost, not fish for confirmation.
- **Whether you could lose.** The previous playtester played badly on purpose and was still drafted
  in round 7. On your deliberately-bad career: **did it ever feel like failure was on the table?**
  At what point did you work out that it was not, if you did?

## What not to do

- Do not read the source, the specs, or the other reports. Your value is that you are the only
  participant who does not know how it works.
- Do not soften findings. "This was boring" is a usable sentence.

**REPORT:** write to `docs/superpowers/polish/reports/017-post-wave6-playtest.md` and append a
session summary to `docs/superpowers/polish/PLAYTEST-LOG.md`.
Return to the PM **only**: status, ≤5 bullets, and those paths. Lead with the three "do I want to
play again" answers, verbatim — they are the phase's headline metric.
