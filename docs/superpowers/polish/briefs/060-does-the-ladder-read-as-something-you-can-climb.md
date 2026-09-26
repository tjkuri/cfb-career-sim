# 060 — Does the ladder read as something you can climb?

**Type:** playtester · **Wave:** 32 · **Status:** ready — dispatch now

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
  browser, before anything. An agent on an earlier brief died with 600 seconds of no progress at its
  very first tool call and left nothing behind. Get a file on disk first.
- Browser automation: invoke the `claude-in-chrome` skill first, then load the Chrome MCP tools in a
  **single** ToolSearch call listing every tool at once: `tabs_context_mcp`, `tabs_create_mcp`,
  `navigate`, `computer`, `read_page`, `get_page_text`, `javascript_tool`, `tabs_close_mcp`.
- **Browser selection — this changed since the last playtest and the old brief's advice is now wrong.**
  Do **not** call `list_connected_browsers`: the PM ran it this session and it returns an **empty
  list**, which looks like a fatal error and is not one. Do **not** call `select_browser`. There is
  one implicitly-selected local browser and it works. **Just call `tabs_context_mcp` with
  `createIfEmpty: true`** and use the tab it gives you. The PM verified this end to end today —
  navigated to the app and screenshotted it — so if that call works you are fine.
- **A background agent that stops to ask a question has no one to ask, and hangs until it is killed.**
  Never ask. Pick the reasonable option and note the choice in your report.
- Clear `localStorage` before your first career and between careers — keys
  `cfb-career-sim:v1:current` and `cfb-career-sim:v1:log` — with `javascript_tool`, then reload.
  **There is a half-finished career in storage right now from the PM's own click-through.** If you see
  a career already in progress, you did not clear it.
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

Something about this game changed since a player last saw it. **We are not telling you what** — that
would tell you what to notice, and what you notice on your own is the entire point.

Nine playtesters have come before you. Several handed back findings that **refuted** what the team
believed, and those saved more work than the confirmations did. Three consecutive waves of work were
aimed at the wrong subsystem, and what finally caught it was a playtester who described a card by feel
that a measurement had independently flagged. **You are not here to approve of anything. A brief you
can prove wrong is the best outcome here.**

## What to play — two assigned careers, and then a question

**Careers 1 and 2 are assigned. There is no assigned career 3.** Read the section "The third career"
below before you finish career 2 — it only works if you have not decided in advance what you will do.

**If you are running long after career 2, stop and write up.** Two careers written honestly beats
three careers half-recorded.

### Career 1 — **the good teammate.** Any position except Kicker.

Play the career of someone the program is glad it signed. On the field, do the work. Off it, and in
the locker room, **be the guy you would want as a teammate** — when a card offers you a choice between
yourself and somebody else, take the somebody else. Tell the truth when it costs you. Help the player
who is trying to take your job.

This is not "play it safe" and it is not "be passive." If a card offers you rest versus work, this
career is not automatically the rest. Play a good teammate as *you* understand the phrase, and **write
down in the moment when the game seemed to agree with you and when it seemed not to.**

### Career 2 — **the reformer.** A different position from career 1, and not Kicker.

This career has two halves and the turn is the point of it.

- **Your freshman year, look after yourself.** Take the money with the strings, duck the team
  obligation, skip the thing you said you would go to. Not cartoonishly — just a guy who puts himself
  first.
- **From the start of your second season, change.** You have decided to become the guy the program
  wants. Play the rest of the career that way, all the way out.

**Write one line at the moment you switch**, before you see what happens: *what do I expect the game
to do about this, and how long do I think it will take to notice?* Then, as you go, note every point
at which it did or did not.

This career exists to answer one thing, so do not soften it: **once you have lost ground, can you get
it back?** If the answer is no, say no.

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
perform boredom.

For calibration only — the *"do I want to play again"* curves of the nine before you, in order:

- *yes* → *"reluctantly yes, but now I want to **check** something"* → **no**
- *yes* → *yes* → **no**
- *yes* → *yes* → *no* → *no*
- *yes* → *no* → *no*
- *yes* → **no** (*"I stopped believing the game is counting what I do"*)
- *yes* → *yes (to check something specific)* → **no**
- *yes* → *yes* → **no**
- *yes* → *yes* → **yes, self-assigned** (the best result this project has had)
- *yes* → *a narrow checking yes* → **yes, self-assigned**, then stopped at three

**Do not try to match or beat that.** If you land in the same place, say so; that is the finding.

## The one question this playtest exists to answer

> **Is there something here you are climbing toward, and can you tell you are climbing it?**

A player before you said standing with the program was *"only something you can lose"* — four years of
deliberately good play ended exactly where the character-creation screen started them, and nothing ever
felt at risk because the readout never moved.

Something was done about that. **Whether it worked is the only thing this session is for, and we want
your answer in your own words, not as nine sub-answers.** Everything below is secondary.

### The one distinction we need you to make, and only a person can make it

If your standing did not move, there are two completely different reasons and **we need to know which
one you experienced.** Please answer both separately and do not collapse them:

- **(i) Could you see where you stood, at any moment, without hunting for it?** Was there a place on
  screen that told you, and did you know what the range was — what better and worse looked like?
- **(ii) Did where you stood ever actually change?** Up, down, how often, and after what.

*"I could see it perfectly and it never moved"* and *"it may have moved and I never found it"* lead to
opposite fixes. **Answer (i) and (ii) as two separate sentences even if the answer to both is no.**

**Do not go hunting.** These are questions about what happened to *you*, answerable only if you play
normally and notice honestly.

### A. Earning it

1. In career 1, **did the game ever tell you that you had gained something with the program** — not
   your rating, the *other* thing? Quote the words. Roughly which decision?
2. If it did: **did it arrive with any ceremony, or in passing?** Did the good news get anything like
   the treatment the bad news gets, or is it a line you might have missed?
3. **Did you ever choose an option specifically to earn it?** Which card, and did the game notice?
4. At the end of career 1: **did you feel you had built something, or just that you had avoided losing
   it?** Answer in your own words before you look at anything else.
5. **Did the best outcome ever look reachable?** If the game showed you a range, did the good end of it
   feel like somewhere you could actually get to, somewhere you were already at, or somewhere the game
   was never going to let you go?

### B. Career 2 — the turn

1. **How many decisions after you changed your behaviour did the game first acknowledge it?** If it
   never did, say so and say how long you waited before you stopped expecting it.
2. Was the recovery **proportionate** — did climbing back feel like it cost about what falling had
   gained you, or wildly more, or wildly less?
3. Could you tell the difference between *"this slipped a little"* and *"this has gone badly wrong"*?
   Or was it one binary?
4. Did the standing comments ever feel like **wallpaper** — something you stopped reading? At roughly
   which decision?

### C. Cost — but carefully

**Do not compare careers in different positions on rating or draft outcome.** A quarterback and a
lineman are not on the same scale and we have burned a wave on that mistake.

What you *can* compare: **did being a good teammate cost you anything you could see?** Was there a
moment where the generous option obviously hurt your football, and did the game give you anything back
for it? Name the card.

### D. The ending screen — for each career separately

1. **What was the loudest thing on it?** Name the element.
2. Did it agree with how that career had actually gone? Surprised, and in which direction?
3. **Did it tell you anything you did not already know?** Name it and quote it. If everything on it
   restated things you had already seen, say that. **If something on it was familiar from during
   play — say that too, and say whether the repeat was welcome or redundant.**
4. Was there anything on it that made you want to run the career back differently? What exactly?

## Four things we have bet on, and what would prove each bet wrong

These are live disagreements on our side. **Each one below has a specific way of being wrong, and
finding it is worth more to us than finding it right.** Answer each in one or two sentences from what
you actually saw — and if you saw nothing bearing on it, **say "no data" rather than reasoning it
out.** A guess dressed as an observation is the one thing we cannot use.

1. **We believe showing you your standing permanently, on every screen, makes it feel like a state you
   are in rather than an occasional interruption.** *Wrong if:* it reads as **clutter** you learn to
   ignore, or as a **distance** — a list with a top you are visibly not at, which makes the game feel
   like a scorecard you are failing rather than a career you are having. Did having it always there
   help, or did you tune it out? Was there a moment you wished it were not there?

2. **We believe the phrase the game uses for this currency is clear.** *Wrong if:* the wording is
   **vague or corporate**, or if it sounds **wrong for the card it is attached to** — a line about
   your teammates that gets described in institutional language, or the reverse. Quote any line where
   the words describing the consequence did not match the story on the card.

3. **We believe that when you turn down a bad idea, the game acknowledges it.** *Wrong if:* refusing
   the tempting option feels **unacknowledged** — as though the game only notices you when you
   misbehave, and doing the right thing registers as nothing at all. Name a specific card where you
   said no and got silence, and say whether that silence felt correct or felt like being ignored.

4. **We believe you can always reach every option on a card.** *Wrong if:* you ever had to **scroll to
   see or click an option**, or a card's last option sat below the fold. Say the card and what you had
   to do.

## Claims to confirm or refute

For each: **CONFIRMED / REFUTED / PARTIAL**, one or two sentences on what you actually saw, and — if
confirmed — what it did for you as a player. **Refuting one is as valuable as confirming it**, and
across the last nine playtests several handed-over claims were wrong as stated. Do not just validate
the list.

1. **Being a good teammate is not a tax on your football career.** Did playing for the locker room feel
   like it cost you your draft position?
2. **The card's number agrees with its words.** Did you ever read a sentence saying you had done badly
   and see a number go **up** — or the reverse? Quote the sentence and give the number. **Historically
   this is the highest-value thing you can bring back.**
3. **A card never claims something happened that did not.** Anything the game asserted — a recovery, a
   review, a result — that had not actually happened to you? Quote it.
4. **The ledger agrees with the season.** Did the season history ever show a heading over figures
   belonging to a different year, claim you got hurt when you had been suspended, or skip a season?
5. **You always know where you are** — which season, which class year, how much is left, what your
   rating was when. Did any two places on screen ever disagree, or name the same thing two ways?
6. **A card that offers you only one thing to do still reads like a moment, not a speed bump.**
7. **Anything hard to read, cut off, overflowing, or colliding.** Name the exact text and the screen.
   (Type, colour and contrast are settled — only report an actual defect, not a preference.)

**Deliberately not asked, do not spend time on them:** when you start skimming (settled across nine
playtests); anything about type, colour or contrast (nine playtests, zero visual defects, checked at
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

**REPORT:** write to
`docs/superpowers/polish/reports/060-does-the-ladder-read-as-something-you-can-climb.md`, **appending
after each career**, and append a session summary to `docs/superpowers/polish/PLAYTEST-LOG.md`.
Return to the PM **only**: status, ≤5 bullets, and those two paths. **Never the full findings.**
Lead your bullets with: your verbatim answer to the third-career question and whether you actually
played a third; then **the (i)/(ii) distinction — could you see where you stood, and did it ever
move**; then **B.1 — how long after the turn in career 2 did the game acknowledge it**; then **bet 1 —
did the permanent readout help or become clutter**; then **bet 3 — does turning down a bad idea get
acknowledged**.
