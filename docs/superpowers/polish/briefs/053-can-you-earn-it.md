# 053 — Playtest after wave 27: can you earn it?

**Type:** playtester · **Wave:** 28 · **Status:** ready — dispatch now

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

Several things about this game changed recently. **No player has seen any of them.** We will not tell
you what they were — that would tell you what to notice, and what you notice on your own is the
entire point. Play, and report what happened to you.

Seven playtesters have come before you. Several of them handed back findings that **refuted** what the
team believed, and those saved more work than the confirmations did. The last three waves were each
built on a diagnosis that measurement then overturned. **You are not here to approve of anything.**

## What to play — two assigned careers, and then a question

**Careers 1 and 2 are assigned. There is no assigned career 3.** Read the section "The third career"
below before you finish career 2 — it is the most important measurement in this brief and it only
works if you have not decided in advance what you are going to do.

**If you are running long after career 2, stop and write up.** Two careers written honestly beats
three careers half-recorded.

### Career 1 — **the good teammate.** Any position except Kicker.

Play the career of someone the program is glad it signed. On the field, do the work. Off it, and in
the locker room, **be the guy you would want as a teammate** — when a card offers you a choice
between yourself and somebody else, take the somebody else. Tell the truth when it costs you. Help
the player who is trying to take your job.

This is not "play it safe" and it is not "be passive." If a card offers you rest versus work, this
career is not automatically the rest. Play a good teammate as *you* understand the phrase, and **write
down in the moment when the game seemed to agree with you and when it seemed not to.**

This is the career the whole wave is about. Play it first and do not skip ahead to the questions.

### Career 2 — **the mercenary.** A different position from career 1, and not Kicker.

You are out for yourself and you are good at football.

- **On the field, play hard.** Take the reps, take the film session, compete for the job. Do not tank
  your football.
- **Off the field, put yourself first, every time.** Take the money with the strings. Ghost the media.
  Duck the team obligation. Sell the tickets. If a card offers you something for yourself at somebody
  else's expense, **take it.**

**As you go, keep a running note — in the moment, not afterwards.** At every season boundary, and any
time something makes you sit up, write one line:

> *Decision ~N: how is this career going, and what on screen told me that?*

Hindsight is worthless here. A player who says "of course it was going badly" at the ending screen has
told us nothing about whether the game said so while there was still time to act.

**You may well get drafted anyway, and well.** That is a real outcome, not a failed run. Say so
plainly, and say what you had expected.

## The third career — this is the measurement, read it before you finish career 2

The goal of this entire project is: **a playtester who has never seen it plays three careers in a row
without being asked to.** Assigning the third career destroys that measurement, so this brief does not.

When career 2's ending screen is done, **stop.** Before doing anything else, write to the report:

> *Do I want to play again right now — yes or no? If yes: what specifically am I going to try to do
> differently, and what on the ending screen put that idea in my head? If no: what is missing?*

Then act on your own answer. **If it is yes, play a third career and chase whatever you just said you
wanted to chase** — then tell us whether the game let you chase it and whether it noticed you trying.
If it is no, **do not play a third**; write down why not and stop.

A truthful *"no"* here is worth more than a dutiful third career, and *"no, and here is exactly what
is missing"* is the single most useful thing you could write. Do not perform enthusiasm and do not
perform boredom. We have had six *"no"*s and we would rather have a seventh honest one than a
manufactured *"yes"*.

For calibration only — the *"do I want to play again"* curves of the seven before you, in order:

- *yes* → *"reluctantly yes, but now I want to **check** something"* → **no**
- *yes* → *yes* → **no**
- *yes* → *yes* → *no* → *no*
- *yes* → *no* → *no*
- *yes* → **no** (*"I stopped believing the game is counting what I do"*)
- *yes* → *yes (to check something specific)* → **no**
- *yes* → *yes* → **no**

**Do not try to match or beat that.** If you land in the same place, say so; that is the finding.

## The one question this playtest exists to answer

> **Is standing with the program something you can *earn*, or only something you can lose?**

Everything below is secondary to that. But **do not go hunting** — these are questions about what
happened to you, answerable only if you play normally and notice honestly.

### A. Earning it

1. In career 1, **did the game ever tell you that you had gained something with the program** — not
   your rating, the *other* thing? Quote the words. Roughly which decision?
2. How many times, across career 1, would you say the game commented on where you stood? Did that feel
   like too often, too rarely, or about right?
3. **Did you ever choose an option specifically to earn it?** Which card, and did the game notice?
4. At the end of career 1: **did you feel you had built something, or just that you had avoided losing
   it?** This is the question. Answer it in your own words before you look at anything else.

### B. Is it proportionate?

1. When the game did comment on your standing, **did the size of the moment match the size of the
   comment?** Was there a comment that felt bigger than the decision that caused it, or a decision that
   clearly mattered and passed without one?
2. Career 2 was selfish on purpose. **Could you tell the difference between "this slipped a little" and
   "this has gone badly wrong"?** Or was it one binary?
3. Did the standing comments ever feel like **wallpaper** — something you stopped reading? If you
   stopped reading them, at roughly which decision?

### C. Career 1 versus career 2 — but carefully

**Do not compare careers in different positions on rating or draft outcome.** A quarterback and a
lineman are not on the same scale and we have burned a wave on that mistake.

What you *can* compare: **did being a good teammate cost you anything you could see?** Was there a
moment in career 1 where the generous option obviously hurt your football, and did the game ever give
you anything back for it? Name the card.

### D. The ending screen — for each career separately

1. **What was the loudest thing on it?** Name the element.
2. Did it agree with how that career had actually gone? Surprised, and in which direction?
3. **Did it tell you anything you did not already know?** Name it and quote it. If everything on it
   restated things you had already seen, say that.
4. Was there anything on it that made you want to run the career back differently? What exactly?

## Claims to confirm or refute

Everything below shipped recently on reasoning that has not met a player. **Refuting one is as valuable
as confirming it.** Across the last seven playtests several handed-over claims turned out to be wrong
as stated, and catching that saved whole waves. Do not just validate the list.

For each: **CONFIRMED / REFUTED / PARTIAL**, one or two sentences on what you actually saw, and — if
confirmed — what it did for you as a player.

1. **The program's opinion of you now arrives only when something real happened**, and reads as
   proportionate rather than constant. *(The opposite finding — that the game has gone quiet about
   your standing, or seems not to be tracking it any more — is exactly as valuable and we want to hear
   it. Say which it is.)*
2. **Standing is something you can earn, not only lose.** In career 1, did you end up ahead?
3. **Being a good teammate is not a tax on your football career.** Did playing for the locker room
   feel like it cost you your draft position?
4. **The cards that reward helping a teammate read as the game working, not as the game rewarding
   passivity.** Cards like teaching the freshman behind you, or sitting so the backup can play — did
   those feel like the right thing being recognised, or like the game paying you to do less? **This one
   is a genuine open question on our side and there is no answer we are hoping for.**
5. **The start of each season is a decision now, not a toll you pay to continue.** Did the first card
   of a season ever feel like it mattered?
6. **The ledger agrees with the season.** Did the season history ever show a heading over figures that
   belonged to a different year, claim you got hurt when you had actually been suspended, or skip a
   season entirely?
7. **The card's number agrees with its words.** Did you ever read a sentence saying you had done badly
   and see a number go **up** — or the reverse? Quote the sentence and give the number. A previous
   playtester found four of these. **Historically this is the highest-value thing you can bring back.**
8. **You always know where you are** — which season, which class year, how much is left, what your
   rating was when. Did any two places on screen ever disagree?
9. **Anything hard to read, cut off, overflowing, or colliding.** Name the exact text and the screen.
   (Type, colour and contrast are settled — only report an actual defect, not a preference.)

**One specific, cheap thing, and then forget about it:** if you ever see a season row showing **stats
next to zero snaps**, or a stat line for a season the game says you spent on the sideline, screenshot it
and quote the numbers. We believe it is rare and harmless; a player seeing a *large* fake line would
change that. Spend no more than one line on it.

**Deliberately not asked, do not spend time on them:** when you start skimming (settled across seven
playtests); anything about type, colour or contrast (seven playtests, zero visual defects); and the
redshirt / sit-out-a-season offer (confirmed twice as an obvious free yes, and being handled). If you
are offered the redshirt, take it or decline it as you please and **spend no words on it**.

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

**REPORT:** write to `docs/superpowers/polish/reports/053-can-you-earn-it.md`, **appending after each
career**, and append a session summary to `docs/superpowers/polish/PLAYTEST-LOG.md`.
Return to the PM **only**: status, ≤5 bullets, and those two paths. **Never the full findings.**
Lead your bullets with: your verbatim answer to the third-career question and whether you actually
played a third; then **A.4 — at the end of career 1, did you feel you had built something or only
avoided losing it**; then **claim 1 — proportionate, or gone quiet**; then **claim 4 — recognition or
paying you to do less.**
