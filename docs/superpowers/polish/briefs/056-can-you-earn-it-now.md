# 056 — Playtest after wave 29: can you earn it *now*?

**Type:** playtester · **Wave:** 30 · **Status:** ready — dispatch now

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
- **Your first action is to create the report file with a one-line stub.** Before the skill, before the
  browser, before anything. An agent on the previous version of this brief died with 600 seconds of no
  progress at its very first tool call and left nothing behind. Get a file on disk first.
- Browser automation: invoke the `claude-in-chrome` skill first, then load the Chrome MCP tools in a
  **single** ToolSearch call listing every tool at once: `tabs_context_mcp`, `tabs_create_mcp`,
  `navigate`, `computer`, `read_page`, `get_page_text`, `javascript_tool`, `tabs_close_mcp`.
- **Do not ask which browser to use, and do not call `list_connected_browsers`.** There is exactly one
  and the PM has already confirmed it: **`8b77ec6f-1f42-4ea4-bca7-4869156e4634` ("Browser 1", local,
  macOS)**. Call `select_browser` with that deviceId if you are asked for one at all, then carry on.
  **A background agent that stops to ask a question has no one to ask, and hangs until it is killed** —
  that is the most likely thing that killed an earlier one.
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

Six things about this game changed since a player last saw it. **We are not telling you what they
were** — that would tell you what to notice, and what you notice on your own is the entire point.

Eight playtesters have come before you. Several handed back findings that **refuted** what the team
believed, and those saved more work than the confirmations did. The last four waves were each built on
a diagnosis that measurement then overturned — twice the mistake was the team's lead, not an agent's.
**You are not here to approve of anything. A brief you can prove wrong is the best outcome here.**

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

This is the career the whole wave is about. Play it first, play it all the way out, and do not skip
ahead to the questions.

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
perform boredom. We have had seven *"no"*s and we would rather have an eighth honest one than a
manufactured *"yes"*.

For calibration only — the *"do I want to play again"* curves of the eight before you, in order:

- *yes* → *"reluctantly yes, but now I want to **check** something"* → **no**
- *yes* → *yes* → **no**
- *yes* → *yes* → *no* → *no*
- *yes* → *no* → *no*
- *yes* → **no** (*"I stopped believing the game is counting what I do"*)
- *yes* → *yes (to check something specific)* → **no**
- *yes* → *yes* → **no**
- *yes* → *yes* → **yes, self-assigned** (the best result this project has had)

**Do not try to match or beat that.** If you land in the same place, say so; that is the finding.

## The one question this playtest exists to answer

> **Is standing with the program something you can *earn*, or only something you can lose?**

A player asked exactly this last time and answered it *"only something you can lose"* — zero upward
movements across two careers played deliberately to earn it, against two downward ones in the career
where they misbehaved, **the first arriving on decision 2.** Their sentence was: *"the same widget
that fires within ninety seconds of a bad choice will not fire after four years of good ones."*

Something was done about that. **Whether it worked is the only thing this session is for, and we want
your answer in your own words, not as nine sub-answers.** Everything below is secondary.

**Do not go hunting.** These are questions about what happened to *you*, answerable only if you play
normally and notice honestly.

### A. Earning it

1. In career 1, **did the game ever tell you that you had gained something with the program** — not
   your rating, the *other* thing? Quote the words. Roughly which decision?
2. If it did: **did it arrive with any ceremony, or in passing?** The bad version of this — the one a
   player has already described — is a large clear callout naming the ground you lost. Did the good
   version get anything like the same treatment, or is it a line you might have missed?
3. **Did you ever choose an option specifically to earn it?** Which card, and did the game notice?
4. At the end of career 1: **did you feel you had built something, or just that you had avoided losing
   it?** This is the question. Answer it in your own words before you look at anything else.

### B. Is it proportionate?

1. When the game commented on your standing, **did the size of the moment match the size of the
   comment?** Any comment bigger than the decision that caused it, or a decision that clearly mattered
   and passed without one?
2. Career 2 was selfish on purpose. **Could you tell the difference between "this slipped a little" and
   "this has gone badly wrong"?** Or was it one binary?
3. Did the standing comments ever feel like **wallpaper** — something you stopped reading? At roughly
   which decision?

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

## Three things we have bet on, and what would prove each bet wrong

These are live disagreements on our side. **Each one below has a specific way of being wrong, and
finding it is worth more to us than finding it right.** Answer each in one or two sentences from what
you actually saw — and if you saw nothing bearing on it, **say "no data" rather than reasoning it
out.** A guess dressed as an observation is the one thing we cannot use.

1. **We believe the standing system now moves in both directions and is worth watching.**
   *Wrong if:* it reads as **inert** — you notice it going quiet, stop tracking it, or feel it no
   longer responds to anything you do. If that is your experience, say it plainly; a one-word answer
   here changes a number we have already measured and are holding ready.

2. **On some cards the game shows you your intention before the outcome — a line naming the plan you
   went in with, then what actually happened.** *Wrong if:* that line reads as the game **hedging**,
   or as **telegraphing** that it is about to go badly — if seeing it made you brace for failure, or
   made the result feel pre-announced. It is supposed to read as neutral framing. Did it? Did you even
   register it?

3. **We believe the cards about helping a teammate read as the right thing being recognised.**
   *Wrong if:* they read as the game **paying you to do less** — or, the answer a player gave last
   time, if they read as **nothing at all**, arriving with no visible consequence in either direction.
   Cards like teaching the freshman behind you, or sitting so the backup can play: recognition,
   payment for passivity, or inert? **We genuinely do not know and there is no answer we are hoping
   for.**

## Claims to confirm or refute

For each: **CONFIRMED / REFUTED / PARTIAL**, one or two sentences on what you actually saw, and — if
confirmed — what it did for you as a player. **Refuting one is as valuable as confirming it**, and
across the last eight playtests several handed-over claims were wrong as stated. Do not just validate
the list.

1. **Being a good teammate is not a tax on your football career.** Did playing for the locker room
   feel like it cost you your draft position?
2. **The card's number agrees with its words.** Did you ever read a sentence saying you had done badly
   and see a number go **up** — or the reverse? Quote the sentence and give the number. **Historically
   this is the highest-value thing you can bring back.**
3. **A card never claims something happened that did not.** In particular: if the game tells you an
   injury has cleared up and hands points back, had you actually been hurt, and did it say so once
   rather than repeatedly? Quote anything that looked like the game reporting a recovery you did not
   have.
4. **The ledger agrees with the season.** Did the season history ever show a heading over figures that
   belonged to a different year, claim you got hurt when you had actually been suspended, or skip a
   season entirely?
5. **You always know where you are** — which season, which class year, how much is left, what your
   rating was when. Did any two places on screen ever disagree?
6. **A card that offers you only one thing to do still reads like a moment, not a speed bump.** When
   the game gave you no actual choice, did it feel like part of the story or like a click to get past?
7. **Anything hard to read, cut off, overflowing, or colliding.** Name the exact text and the screen.
   (Type, colour and contrast are settled — only report an actual defect, not a preference.)

**Deliberately not asked, do not spend time on them:** when you start skimming (settled across eight
playtests); anything about type, colour or contrast (eight playtests, zero visual defects, checked at
500px); and the redshirt / sit-out-a-season offer (settled twice). If you are offered the redshirt,
take it or decline it as you please and **spend no words on it**.

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

**REPORT:** write to `docs/superpowers/polish/reports/056-can-you-earn-it-now.md`, **appending after
each career**, and append a session summary to `docs/superpowers/polish/PLAYTEST-LOG.md`.
Return to the PM **only**: status, ≤5 bullets, and those two paths. **Never the full findings.**
Lead your bullets with: your verbatim answer to the third-career question and whether you actually
played a third; then **A.4 — at the end of career 1, did you feel you had built something or only
avoided losing it**; then **bet 1 — does the standing system read as live or as inert**; then
**bet 3 — recognition, payment for passivity, or nothing at all.**
