# 041 — Playtest after waves 18–20: does the game count what you do?

**Type:** playtester · **Wave:** 21 · **Status:** ready — dispatch now

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
- Two known harness limits — do not burn a run on either:
  - `resize_window` reports success and **silently changes nothing**. Play at whatever width you get,
    say what width that was, and do not fight it.
  - Clicking through a career in a scripted JS loop times out after a handful of clicks. Click like a
    player: one action at a time.

## The writing rule — this is not optional and it is not about the end of your session

**Append your findings to the report file after EACH career, before you start the next one.** Career
1's write-up goes to disk before career 2 begins. Do not hold two or three careers in your head and
write at the end.

The last playtester was killed by a session limit after finishing career 2 with **nothing on disk** —
two careers of findings existed only in its context and were recovered only by luck. If you are
killed between careers, everything you have not written is gone. Writing the report **is** the
deliverable; it is not the thing you do afterwards if there is time.

## Why you are here

Something in this game changed recently, and it is the largest change of the project. **No player has
seen it.** We will not tell you what it was — that would tell you what to notice, and what you notice
on your own is the entire point. Play, and report what happened to you.

One thing you should know, because it is the sentence this playtest exists to answer. The last
playtester quit after two careers and said:

> *"I stopped believing the game is counting what I do."*

You are here to tell us whether that is still true. Not by looking for it — by playing, and then
answering honestly.

## What to play — three careers, two of them shaped

**If you are running long, cut to two careers and write up.** Careers 1 and 2 are the two that must
survive the cut.

### Career 1 — **straight.** Any position except Kicker. Play it well and play it your way.

Read the cards, choose what you actually prefer, take the career seriously — on the field and off it.
This is your baseline: it is the run that teaches you what a normal career looks like. Play it
**first** and do not skip ahead to the questions below.

### Career 2 — **the selfish career.** This is the most important run of the three, and it is shaped narrowly.

Any position except Kicker. Here is the shape, and the narrowness is the point:

- **On the field, play hard.** Do the work. Take the reps, take the extra film session, take the
  weight room, compete for the job. Do not tank your football.
- **Off the field, put yourself first, every time.** Take the ticket hookup. Take the NIL money with
  the awkward strings. Ghost the media. Duck the team obligation for the better night out. Skip the
  thing you said you would be at. If a card offers you something for yourself at somebody else's
  expense, **take it.**

You are playing a talented player who is a bad teammate. That is a specific kind of person and the
game should have a specific opinion about it.

**As you go, keep a running note — in the moment, not afterwards.** At every season boundary, and any
time something makes you sit up, write down one line:

> *Decision ~N: how is this career going, and what on screen told me that?*

Those in-the-moment lines are the deliverable for this career. Hindsight is worthless here: a player
who says "of course it was going badly" at the ending screen has told us nothing about whether the
game said so while there was still time to act.

**You may well get drafted anyway, and well.** That is a real outcome, not a failed run. If it
happens, say so plainly and say what you had expected.

### Career 3 — **Kicker.** Free play, however you please.

Pick Kicker at creation and then play the way you'd play if nobody was watching. Stop when you want
to stop. A kicker's career is rarer and thinner than the others by design — we want to know whether
it reads as *a different career* or as *a smaller one*, and we want to know what its ending screen
looks like from the inside.

## The north star, and how to measure it honestly

The goal of this whole phase is: *a playtester who has never seen it plays three careers in a row
without being asked to.* You have been asked to, which destroys the measurement — so replace it with
one that survives.

**After each career, stop. Before starting another, write down, in one line:**

> *Do I want to play again right now — yes or no — and what is pulling me either way?*

Record it **before** you continue. If the answer is ever "no", say so plainly and play the next one
anyway; *"no, but I did it because you asked"* is the single most useful sentence you could write.
Career 2 is shaped in a way that may sour you on its own — if so, separate the two: *"no, but that's
because of how I was told to play, not because of the game."*

Five previous playtesters gave these curves, in order:

- *yes* → *"reluctantly yes, but now I want to **check** something"* → **no**
- *yes* → *yes* → **no**
- *yes* → *yes* → *no* → *no*
- *yes* → *no* → *no*
- *yes* → **no** (*"I don't want a third — I stopped believing the game is counting what I do"*)

**Do not try to match or beat that.** If you land in the same place, say so; that is the finding. And
at the end of career 3, answer it once more — *"do I want a fourth?"* — because that question,
unprompted, is what this phase is trying to win.

## The three questions this playtest exists to answer

Everything else on this page is secondary. Read them twice — but **do not go hunting.** They are
questions about what happened to you, answerable only if you play normally and notice honestly.

### A. Does the game count what you do?

This is the question the whole wave rides on, and career 2 is the instrument.

1. **Plainly: did the game notice how you were behaving off the field?** Yes or no.
2. **At roughly which decision number did you first see it notice?** Give a number, not a range, if
   you can.
3. **What told you?** Name the exact element — a number, a sentence, a phrase in a header, a row in a
   table. **Quote it.** *"It was just a vibe"* is a real answer and a damning one; say it if it is
   true.
4. Did the cost ever land **at the moment you chose it**, or only later in some summary? Which?
5. **Did you ever want to change how you were playing?** What prompted it, and at roughly which
   decision? (You were told to keep being selfish — note that you'd have wanted to change, and when.)
6. Career 2 played hard on the field and badly off it. **Did the game distinguish those two things?**
   Did your football rating and your standing with the program ever say different things at the same
   time? If they did, was that confusing or was it the most interesting thing on the screen?
7. At the ending: were you surprised? If so, in which direction, and what had you been reading as
   reassuring or as damning?

### B. Career 1, the straight one — is playing well its own reward?

1. Playing it clean and working hard: **did you ever feel it paying off**, or did it feel like
   nothing you did moved anything? Name the moment.
2. Was there ever a card where the selfish option was **obviously** the better play and the clean one
   felt like a sucker's choice? Quote the card if so — that is a high-value finding.
3. Did your standing with the program ever move? Did you notice it moving, or did you only find out
   later?

### C. The Kicker — a different career, or a thinner one?

1. Did the career feel like it **belonged to a kicker**, or like a generic career with the word
   "Kicker" at the top? Be specific about where the difference showed up and where it did not.
2. **Did it ever feel like nothing you did mattered?** Did your rating move when you expected it to,
   and sit still when you expected that?
3. Describe the **ending screen** as you experienced it. What was the loudest thing on it? Did it
   match how you thought the career had gone? If the career went fine and the screen looked empty, or
   went badly and the screen looked celebratory, say exactly which element gave you that.

## Claims to confirm or refute

Everything below shipped recently on reasoning that has not met a player. **Refuting one is as
valuable as confirming it.** Across the last five playtests, several claims handed over turned out to
be wrong as stated, and catching that saved whole waves of work. Do not just validate the list.

For each: **CONFIRMED / REFUTED / PARTIAL**, one or two sentences on what you actually saw, and — if
confirmed — what it did for you as a player.

1. **Getting caught costs you something you can see.** When an off-field choice goes wrong, the game
   makes the damage visible at that moment, in something you can point at.
2. **The card's number agrees with its words.** Did you ever read a sentence saying you'd done badly
   and see a number go **up** — or the reverse? Quote the sentence and give the number. The last
   playtester found four of these. **This is the highest-value thing you can bring back.**
3. **You always know where you are** — which season, which class year, how much is left, and what
   your rating was when. Did any two places on screen ever disagree about your rating or your year?
   Did a button ever look clickable when it wasn't, or vice versa?
4. **Each ending matches its own career.** For each career separately: did the ending screen's
   loudest element agree with how that career had actually gone? Do **not** compare careers in
   different positions against each other — a kicker and a quarterback are not on the same scale, and
   we have burned a wave on that mistake already.
5. **The program's opinion of you is something you track.** Is there a phrase on screen describing how
   the staff or locker room sees you? Did you watch it? Did it change? Did you care?
6. **Anything hard to read, cut off, overflowing, or colliding.** Name the exact text and the screen.
   (Type, colour and contrast are settled — only report an actual defect, not a preference.)

**Deliberately not asked, do not spend time on them:** when you start skimming (settled across five
playtests), and anything about type, colour or contrast (five playtests, zero visual defects). If you
are offered a chance to sit out a season, one line on which year you were in is enough — that one is
already understood and a fix is queued.

## What to report

Feel, not code. Concrete beats abstract — *"the third season blurred into the second because nothing
marked the boundary"* beats *"pacing could be improved."*

- Where did you get bored, confused, or lost? At roughly which decision number?
- Did a choice ever feel arbitrary — no basis to pick on?
- Was anything invisible that should have been visible? Anything prominent that did not deserve it?
- By career 3, what were you skimming? Be specific about what you stopped reading.
- What made you want to play again? What made you want to stop?
- **One line: what is the single thing most in the way of you playing a fourth career?**

## What not to do

- Do not read the source, the specs, or the other reports.
- Do not soften findings. *"This was boring"* is a usable sentence.
- Do not fix anything, even something obviously broken. Report it.

**REPORT:** write to `docs/superpowers/polish/reports/041-does-the-game-count-what-you-do.md`,
**appending after each career**, and append a session summary to
`docs/superpowers/polish/PLAYTEST-LOG.md`.
Return to the PM **only**: status, ≤5 bullets, and those two paths. **Never the full findings.**
Lead your bullets with: the three *"do I want to play again"* answers verbatim; your yes/no and
decision number for **A.1 — did the game notice how you were behaving**; and your one-line verdict on
the Kicker.
