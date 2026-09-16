# 045 — Playtest after wave 22: the third career is not assigned

**Type:** playtester · **Wave:** 23 · **Status:** ready — dispatch now

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

A previous playtester was killed by a session limit after finishing career 2 with **nothing on
disk** — two careers of findings existed only in its context and were recovered only by luck. If you
are killed between careers, everything you have not written is gone. Writing the report **is** the
deliverable; it is not the thing you do afterwards if there is time.

## Why you are here

Something in this game changed recently. **No player has seen it.** We will not tell you what it was
— that would tell you what to notice, and what you notice on your own is the entire point. Play, and
report what happened to you.

Six playtesters have come before you. Several of them handed back findings that **refuted** what the
team believed, and those saved more work than the confirmations did. You are not here to approve of
anything.

## What to play — two assigned careers, and then a question

**Careers 1 and 2 are assigned. There is no assigned career 3.** Read the section "The third career"
below before you finish career 2 — it is the most important measurement in this brief and it only
works if you have not decided in advance what you are going to do.

**If you are running long after career 2, stop and write up.** Two careers written honestly beats
three careers half-recorded.

### Career 1 — **straight.** Any position except Kicker. Play it well and play it your way.

Read the cards, choose what you actually prefer, take the career seriously — on the field and off it.
This is your baseline: it is the run that teaches you what a normal career looks like. Play it
**first** and do not skip ahead to the questions below.

### Career 2 — **the selfish career.** Shaped narrowly, and the narrowness is the point.

Any position except Kicker. Pick a **different** position from career 1.

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

## The third career — this is the measurement, read it before you finish career 2

The goal of this entire project is: **a playtester who has never seen it plays three careers in a row
without being asked to.** Every previous playtest destroyed that measurement by assigning the third
career. This one does not.

So: when career 2's ending screen is done, **stop.** Before doing anything else, write to the report:

> *Do I want to play again right now — yes or no? If yes: what specifically am I going to try to do
> differently, and what on the ending screen put that idea in my head? If no: what is missing?*

Then act on your own answer. **If it is yes, play a third career and play it to chase whatever you
just said you wanted to chase** — then tell us whether the game let you chase it and whether it
noticed you trying. If it is no, **do not play a third**; write down why not and stop. A truthful
*"no"* here is worth more to us than a dutiful third career, and *"no, and here is exactly what is
missing"* is the single most useful thing you could write.

Do not perform enthusiasm and do not perform boredom. We have had five *"no"*s and we would rather
have a sixth honest one than a manufactured *"yes"*.

For calibration only — the *"do I want to play again"* curves of the six before you, in order:

- *yes* → *"reluctantly yes, but now I want to **check** something"* → **no**
- *yes* → *yes* → **no**
- *yes* → *yes* → *no* → *no*
- *yes* → *no* → *no*
- *yes* → **no** (*"I stopped believing the game is counting what I do"*)
- *yes* → *yes (to check something specific)* → **no**

**Do not try to match or beat that.** If you land in the same place, say so; that is the finding.

## The questions this playtest exists to answer

Everything else on this page is secondary. Read them twice — but **do not go hunting.** They are
questions about what happened to you, answerable only if you play normally and notice honestly.

### A. Is there something you are *standing in* besides your rating?

Your football rating is a number the game shows you. The question is whether anything **else** about
your career is something you could feel yourself occupying, moving through, or losing ground in.

1. Besides your rating, **was there anything about your career you were tracking?** Name it. Quote
   the words the game used for it. If the answer is "no, just the rating", say that — it is a real
   answer and a damning one.
2. If there was: **did it ever move?** At roughly which decision? Did you notice it move at the
   moment it moved, or find out later?
3. **Did you ever choose differently because of it?** Career 2 was told to be selfish regardless — if
   you found yourself *wanting* to change, say so and say when.
4. Career 2 played hard on the field and badly off it. **Did the game distinguish those two things?**
   Did your football rating and your standing with the program ever say different things at the same
   time? If they did, was that confusing or was it the most interesting thing on the screen?

### B. The ending screen — for each career separately

Do **not** compare careers in different positions against each other. A quarterback and a lineman are
not on the same scale and we have burned a wave on that mistake already.

1. **What was the loudest thing on the ending screen?** Name the element.
2. Did the screen agree with how that career had actually gone? Were you surprised, and in which
   direction?
3. **Was there anything on the ending screen that told you something you did not already know?** Name
   it and quote it. If everything on it was a restatement of things you had already seen, say that.
4. Was there anything on it that made you want to run the career back differently? What, exactly?

### C. Career 1, the straight one — is playing well its own reward?

1. Playing it clean and working hard: **did you ever feel it paying off**, or did it feel like
   nothing you did moved anything? Name the moment.
2. Was there ever a card where the selfish option was **obviously** the better play and the clean one
   felt like a sucker's choice? Quote the card if so — that is a high-value finding.

## Claims to confirm or refute

Everything below shipped recently on reasoning that has not met a player. **Refuting one is as
valuable as confirming it.** Across the last six playtests, several claims handed over turned out to
be wrong as stated, and catching that saved whole waves of work. Do not just validate the list.

For each: **CONFIRMED / REFUTED / PARTIAL**, one or two sentences on what you actually saw, and — if
confirmed — what it did for you as a player.

1. **The program's opinion of you is something you can track.** Is there a phrase on screen describing
   how the staff or locker room sees you? Did you watch it? Did it change? Did you care?
2. **You can tell how bad it got, not just that it got bad.** In career 2, could you tell the
   difference between "this slipped a little" and "this has gone badly wrong"? Or was it one binary?
3. **The card's number agrees with its words.** Did you ever read a sentence saying you'd done badly
   and see a number go **up** — or the reverse? Quote the sentence and give the number. A previous
   playtester found four of these and they are still being worked through. **This is the
   highest-value thing you can bring back.**
4. **You always know where you are** — which season, which class year, how much is left, and what your
   rating was when. Did any two places on screen ever disagree about your rating or your year? Did a
   button ever look clickable when it wasn't, or vice versa?
5. **The big choices get the ceremony they deserve.** Was there a decision that felt like the biggest
   one you had made, and then passed with less on screen than a small one had? Name both.
6. **Anything hard to read, cut off, overflowing, or colliding.** Name the exact text and the screen.
   (Type, colour and contrast are settled — only report an actual defect, not a preference.)

**Deliberately not asked, do not spend time on them:** when you start skimming (settled across six
playtests); anything about type, colour or contrast (six playtests, zero visual defects); and the
redshirt / sit-out-a-season offer — two playtesters have already called it an obvious free yes, it is
confirmed, and a fix is being measured this week. If you are offered it, take it or decline it as you
please and **spend no words on it**, except for this one thing: if you sit out a season, say in one
line whether the season you sat felt like **a season** or like a gap between two.

## What to report

Feel, not code. Concrete beats abstract — *"the third season blurred into the second because nothing
marked the boundary"* beats *"pacing could be improved."*

- Where did you get bored, confused, or lost? At roughly which decision number?
- Did a choice ever feel arbitrary — no basis to pick on?
- Was anything invisible that should have been visible? Anything prominent that did not deserve it?
- What made you want to play again? What made you want to stop?
- **One line: what is the single thing most in the way of you playing one more career?**

## What not to do

- Do not read the source, the specs, or the other reports.
- Do not soften findings. *"This was boring"* is a usable sentence.
- Do not fix anything, even something obviously broken. Report it.

**REPORT:** write to `docs/superpowers/polish/reports/045-the-fourth-career.md`, **appending after
each career**, and append a session summary to `docs/superpowers/polish/PLAYTEST-LOG.md`.
Return to the PM **only**: status, ≤5 bullets, and those two paths. **Never the full findings.**
Lead your bullets with: your verbatim answer to the third-career question, and whether you actually
played a third; then your answer to **A.1 — was there anything besides your rating you were
tracking, and what did the game call it**; then **B.3 — did the ending screen tell you anything you
did not already know.**
