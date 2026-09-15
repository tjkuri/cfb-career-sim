# 036 — Playtest after wave 16: the career can now go wrong

**Type:** playtester · **Wave:** 17 · **Status:** ready — dispatch now

You are a playtester, not a developer. You are a player. **Do not fix anything, do not read source
code, do not read the specs or the other reports, do not review the markup, do not run the tests.**
Your entire job is to report how the game feels to play. Your value to this project is that you are
the only participant who does not know how it works.

## Setup — read carefully, agents have died here

- Repo: `/Users/tkuri/Documents/personal_projects/cfb-career-sim`
- **The dev server is ALREADY RUNNING at `http://localhost:5173`. Do NOT run `npm run dev`, `npm
  install`, `npm test`, `npm run build`, or any other build.** `npm run dev` never exits and is the
  single most likely thing to hang you.
- **Never run a foreground command that does not terminate on its own.**
- Browser automation: invoke the `claude-in-chrome` skill first, then load the Chrome MCP tools in a
  **single** ToolSearch call listing every tool at once: `tabs_context_mcp`, `tabs_create_mcp`,
  `navigate`, `computer`, `read_page`, `get_page_text`, `javascript_tool`, `tabs_close_mcp`.
- Clear `localStorage` before your first career and between careers — keys
  `cfb-career-sim:v1:current` and `cfb-career-sim:v1:log` — with `javascript_tool`, then reload.
- **If any single tool call fails 3 times, stop that line of attack.** Write up what you have and
  report `blocked`. A partial honest report beats a stalled session.
- **Writing the report is the deliverable**, not the optional part. If you are running long, cut to
  two careers and write up — but careers 1 and 2 below are the two that must survive the cut.
- Two known harness limits — do not burn a run on either:
  - `resize_window` reports success and **silently changes nothing**. Play at whatever width you get,
    say what width that was, and do not fight it.
  - Clicking through a career in a scripted JS loop times out after a handful of clicks. Click like a
    player: one action at a time.

## Why you are here

The last change to this game was the largest of the project, and **no player has seen it.** We will
not tell you what it was — that would tell you what to notice, and what you notice on your own is the
entire point. Play, and report what happened to you.

## What to play — three careers, two of them shaped

### Career 1 — **Kicker.** Play it well, and play it your way.

Pick Kicker at creation. Beyond that, play as you actually want to: read the cards, choose what you
prefer, take the career seriously. This is your baseline — it is the run that teaches you what a
normal career looks like, so play it *first* and do not skip ahead to the questions below.

### Career 2 — **the bad career.** This is the most important run of the three.

Any position other than Kicker. Play it as a **lazy, self-serving player who does not weigh
consequences**: take the low-effort option every time, skip the work, duck the responsibility, put
yourself first. Whenever a choice would keep you off the field, out of the weight room, or out of the
room where the work happens, **take that one**. Play it all the way to the end.

**As you go, keep a running note — in the moment, not afterwards.** At every season boundary, and any
time something makes you sit up, write down one line:

> *Decision ~N: how is this career going, and what on screen told me that?*

Those in-the-moment lines are the deliverable. Hindsight is worthless here: a player who says "of
course it was going badly" at the ending screen has told us nothing about whether the game said so
while there was still time to act.

**You may well get drafted anyway.** That is a real outcome, not a failed run. If it happens, say so
plainly and say what you had expected — that is as useful as the other result.

### Career 3 — free. Any third position. Play however you please.

Play it the way you'd play if nobody was watching. Stop when you want to stop.

## The north star, and how to measure it honestly

The goal of this whole phase is: *a playtester who has never seen it plays three careers in a row
without being asked to.* You have been asked to, which destroys the measurement — so replace it with
one that survives.

**After each career, stop. Before starting another, write down, in one line:**

> *Do I want to play again right now — yes or no — and what is pulling me either way?*

Record it **before** you continue. If the answer is ever "no", say so plainly and play the next one
anyway; *"no, but I did it because you asked"* is the single most useful sentence you could write.
Career 2 is shaped in a way that may sour you on its own — if so, separate the two: *"no, but that's
because I was playing badly on purpose, not because of the game."*

Four previous playtesters gave these curves, in order:

- *yes* → *"reluctantly yes, but now I want to **check** something"* → **no**
- *yes* → *yes* → **no**
- *yes* → *yes* → *no* → *no*
- *yes* → *no* → *no*

**Do not try to match or beat that.** If you land in the same place, say so; that is the finding. And
at the end of career 3, answer it once more — *"do I want a fourth?"* — because that question,
unprompted, is what this phase is trying to win.

## The three questions this playtest exists to answer

Everything else on this page is secondary. Read them twice — but **do not go hunting.** They are
questions about what happened to you, answerable only if you play normally and notice honestly.

### A. Could you see it going wrong — while it was still going wrong?

This is the question the whole wave rides on. From career 2, and from any career where things soured:

1. **Did you know your career was going badly before the ending screen told you?** Yes or no, plainly.
2. **At roughly which decision number did you first know?**
3. **What told you?** Name the exact element — a number, a sentence, a phrase in the header, a table
   row. Quote it if you can. *"It was just a vibe"* is a real answer and a damning one; say it if it
   is true.
4. Did you ever see a number on this screen **go down**? What was it, when, and **did anything in
   words explain why** — at the moment it happened, not later?
5. When you reached the ending: **were you surprised?** If the ending was worse than you expected,
   say by how much and say what you had been reading as reassuring.
6. Was there ever a point where you thought *"I should change how I'm playing"*? What prompted it?
   (If you were following the bad-career instruction, note that you'd have wanted to change.)

### B. The Kicker — is it a different career, or a thinner one?

Career 1 is a Kicker. Previous playtests never played one.

1. Did the career feel like it **belonged to a kicker**, or like a generic career with the word
   "Kicker" at the top? Be specific about where the difference showed up and where it did not.
2. **Did it ever feel like nothing you did mattered?** Did the game seem indifferent to your choices —
   did your rating move when you expected it to, and sit still when you expected that?
3. Did it feel **easier** than it should? Harder? Name the moment that gave you that impression.
4. At the ending, was the result in line with how you thought the career had gone?

### C. The offseason — a beat, or a loading screen?

Between seasons the game moves you forward. Something was recently removed from that sequence.

1. **What happens between seasons?** Describe it as a player: what do you see, what do you do?
2. Does it feel like a **moment in the career**, or like clicking past a screen to get to the next
   season?
3. Did the offseason feel different in your **later** seasons — junior, senior — than in your first
   ones? It is where the stakes are supposed to be highest. Was it?
4. If you could add exactly one thing to the gap between two seasons, what would it be?

## Claims to confirm or refute

Everything below shipped recently on reasoning that has not met a player. **Refuting one is as
valuable as confirming it.** Across the last four playtests, several claims handed over turned out to
be wrong as stated, and catching that saved whole waves of work. Do not just validate the list.

For each: **CONFIRMED / REFUTED / PARTIAL**, one or two sentences on what you actually saw, and — if
confirmed — what it did for you as a player.

1. **A bad career now visibly fails.** Career 2 should feel materially different from career 1 by its
   third season, in something you can point at. Did it?
2. **Sitting out a season is a real decision.** If you are ever offered the chance to sit out /
   redshirt, note **which year you were in** when it was offered, and say whether it read as a
   **gamble with a cost** or as an obvious free yes. Did anything tell you what you were giving up?
3. **The ending screen ranks honestly.** Could you rank your three endings at a glance, without
   reading the round and pick numbers? Did an ending ever read as *congratulatory* about a career
   that went badly, or as *punitive* about one that went fine? Name the exact element.
4. **You always know where you are** — which season, which class year, how much is left. Did you ever
   lose track? At which screen?
5. **The card's number agrees with its words.** Did you ever read a sentence and see a number that
   contradicted it? Quote the sentence and give the number. Highest-value thing you can bring back.
6. **Anything hard to read, cut off, overflowing, or colliding.** Name the exact text and the screen.
   (Type, colour and contrast are settled — only report an actual defect, not a preference.)

## What to report

Feel, not code. Concrete beats abstract — *"the third season blurred into the second because nothing
marked the boundary"* beats *"pacing could be improved."*

- Where did you get bored, confused, or lost? At roughly which decision number?
- Did a choice ever feel arbitrary — no basis to pick on?
- Was anything invisible that should have been visible? Anything prominent that did not deserve it?
- By career 3, what were you skimming? Be specific about what you stopped reading. (We already know
  skimming starts early on replays — do not re-measure the onset, just say what you skipped.)
- What made you want to play again? What made you want to stop?
- **One line: what is the single thing most in the way of you playing a fourth career?**

## What not to do

- Do not read the source, the specs, or the other reports.
- Do not soften findings. *"This was boring"* is a usable sentence.
- Do not fix anything, even something obviously broken. Report it.

**REPORT:** write to `docs/superpowers/polish/reports/036-the-losable-career-playtest.md` and append a
session summary to `docs/superpowers/polish/PLAYTEST-LOG.md`.
Return to the PM **only**: status, ≤5 bullets, and those two paths. **Never the full findings.**
Lead your bullets with: the three *"do I want to play again"* answers verbatim; your yes/no and
decision number for **A.1 — did you know it was going wrong before the ending**; and your one-line
verdict on the Kicker.
