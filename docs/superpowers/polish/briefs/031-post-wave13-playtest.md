# 031 — Playtest after waves 11, 12 and 13 (cards account for themselves; a player who sits does not play)

**Type:** playtester · **Wave:** 14 · **Status:** ready — dispatch now

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
  two careers and write up. A two-career report that exists beats a three-career one that does not.
- Two known harness limits — do not burn a run on either:
  - `resize_window` reports success and **silently changes nothing**. The viewport is pinned at
    roughly 800 CSS px. Play at whatever width you get, say what width that was, and do not fight it.
  - Clicking through a career in a scripted JS loop times out after a handful of clicks. Click like a
    player: one action at a time.

## The north star, and how to measure it honestly

The goal of this whole phase is: *a playtester who has never seen it plays three careers in a row
without being asked to.* You have now been asked to, which destroys the measurement — so replace it
with one that survives.

**After each career, stop. Before starting another, write down, in one line:**

> *Do I want to play again right now — yes or no — and what is pulling me either way?*

Record that answer **before** you continue. Three honest lines are worth more to us than three
careers played dutifully. If the answer is ever "no", say so plainly and play the next one anyway;
*"no, but I did it because you asked"* is the single most useful sentence you could write.

Three previous playtesters gave these curves, in order:

- *yes* → *"reluctantly yes, but now I want to **check** something, which isn't the same thing"* → **no**
- *yes* → *yes* → **no**
- *yes* → *yes* → *no* → *no*

**Do not try to match or beat that.** If you land in the same place, say so; that is the finding.
What we need to know is whether the curve moved, not whether you were kinder than the last person.
And at the end of career 3, answer it once more — *"do I want a fourth?"* — because that question,
unprompted, is literally what this phase is trying to win.

## What to play

**Three full careers**, three different positions from the six (Quarterback, Offensive skill,
Offensive line, Defensive line, Defensive skill, Kicker). Make at least one of them Kicker or a line
position — not three skill positions. A career runs 10–45 decisions, median 24.

Play as a player would: read the text, choose what you actually prefer, don't click blindly. You are
allowed to enjoy it. **Notice when you stop.**

Two of the three are shaped. The shaping matters — each one exists to answer a specific question
below, and a career played the wrong shape wastes the run:

- **Career 2: redshirt on purpose.** Early on you will be offered a choice about whether to sit out /
  redshirt the season. **Take the sit option.** Then play that whole season out normally and pay
  close attention to it. This is the single most important run of the three — see question A.
- **Career 3: declare early.** At some offseason you will be offered the chance to leave for the NFL
  before your eligibility is up. **Take it the first time it is offered.** Play the rest normally.

Career 1 is yours to play however you please. Play it first, before you know what the shaped ones are
looking for.

## The three questions this playtest exists to answer

Everything else on this page is secondary to these. Read them twice — but **do not go hunting.** They
are questions about what happened to you, answerable only if you play normally and notice honestly.

### A. The redshirt season — did it feel thin?

On career 2 you will sit out a season deliberately. We changed something recently that had a
side-effect we could measure but could not judge: **a season you sit out now draws its events from a
much smaller pool than a season you play.** The numbers say a player would not notice, because it is
one season out of five. We do not believe the numbers on their own.

So, from inside it:

1. **Did the redshirt season feel thin, repetitive, or empty** compared with the seasons you played?
2. Did you see the same card twice *within* that one season? Name it if so.
3. Did sitting out feel like a real decision with a real cost, or like a dead season you clicked
   through to get to the next one?
4. **Was it worth it?** Did you ever find out what redshirting bought you, and when?
5. The card that offers it: does what it *says* match what then *happens*? Read it carefully before
   you accept, and say plainly if the season that follows contradicted it.

"It felt fine, I didn't notice anything" is a real and valuable answer here. Say it if it is true.

### B. Does the card's number agree with its words?

Two waves of work just went into one idea: **a card should account for what it did.** When you pick
an option and see the outcome, the screen tells you what changed. Previously that number was often
answering a different question than the sentence above it — you would read *"the fit never quite
comes together"* and see **+5**, or read a clear win and see a minus.

You may now see a card split its reporting into two parts — something attributed to **this card**,
and a separate note about **everything else** that happened at the same time.

What we need from you:

1. **Did you ever read a sentence and see a number that contradicted it?** Quote the sentence and
   give the number. This is the highest-value thing you can bring back.
2. When a card *did* split into two parts, did that read as clarifying or as clutter? Did you
   understand what the second part was telling you, or did you skip it?
3. **Did you ever learn what an option cost you in something other than the overall rating?** Some
   choices are meant to cost you standing/character rather than ability. Did the game ever make that
   legible — and if so, how did you know?
4. Was there a choice where the result was **different from the same choice earlier in the career**?
   Did that read as "the dice fell differently" or as "the game is not telling me the truth"?
5. Anything where a number appeared with **no sentence at all** to explain it.

### C. Onset of skimming — the number, again

Some events in this game repeat. Every previous playtester hit that, and every one reported the same
second-order effect: **they stopped reading card bodies — including brand-new cards they had never
seen before.** The last one reported it starting at decision 15 in career 1, and at **decision 1** in
every career after that, because every career opens the same way.

We have deliberately not written new content since. We expect the number to be unchanged. **Get it
anyway**, because a real authoring decision is waiting on it.

1. **At what decision number did you first notice you were skimming rather than reading?** Not when
   you first saw a repeat — when you first caught *yourself* not reading.
2. **What was the card you were skimming when you noticed?** A repeat, or something new?
3. Did it start from a specific moment you can name, or come on gradually?
4. **Did anything ever pull you back into reading properly?** Name it.
5. Same four for each career. Whether it starts *earlier* in career 3 than career 1 is itself an
   answer.

Answer from what happened, not from what you think we want. **"I never stopped reading" is a real and
very useful answer** — say it if it is true.

## Claims to confirm or refute

Everything below shipped recently on reasoning that has not yet met a player. **Refuting one is as
valuable as confirming it.** Do not just validate the list — across the last three playtests, six of
the claims handed over turned out to be wrong as stated, and catching that saved multiple waves of
work.

For each: **CONFIRMED / REFUTED / PARTIAL**, one or two sentences of what you actually saw, and — if
confirmed — what it actually did for you as a player.

1. **The season table beside the card.** It now carries a lot more per season — school, class year,
   record, snaps, rating and its step from the year before. **Did you use it to decide something, or
   was it wallpaper by season two?** Be specific about the one time you looked at it on purpose, if
   there was one.
2. **Did you know where you were** — in the season, and in the career (which year, how much is left)?
   At any point did you lose track?
3. **Declaring early — gamble or trap?** Career 3 declares early. When you chose it, did you
   understand you were taking a risk, or did the game hide the cost until the ending? **The specific
   question: does it read as a gamble you took, or as a trap you were walked into?** Those feel
   completely different and only one of them is acceptable. If the game gave you *any* signal that
   declaring was risky, name the exact words that did it.
4. **The ending screen.** Could you rank two of your three endings at a glance, without reading the
   round and pick numbers? Did the ending ever read as *congratulatory* about a career that went
   badly? Name the exact element if so.
5. **The Moments reel on the ending screen.** Did it ever print the same moment more than once? Quote
   it and say how many times.
6. **Position — costume or character?** Three positions. Did they feel like different careers, or the
   same career with a different word at the top? **Be specific about where the difference showed up
   and where it did not.** If the offseason felt identical at every position, say that plainly.
7. **Status and playing time.** The header carries a phrase about your role on the field. Did it ever
   disagree with the rest of the screen — saying you were playing when nothing said you had played,
   or the reverse? Quote it.
8. **Anything hard to read, cut off, overflowing, or colliding.** Name the exact text and the screen.
9. **The empty room.** At the width you are playing, does the page feel like it is using the space it
   has, or does the card float in a large empty field? Answer for the decision screen specifically,
   and **note the width you were at** — we know the harness pins it narrow, so this is a
   narrow-width answer and we will read it as one.

## What to report

Feel, not code. Concrete beats abstract — *"the third season blurred into the second because nothing
marked the boundary"* beats *"pacing could be improved."*

- Where did you get bored, confused, or lost? At roughly which decision number?
- Did a choice ever feel arbitrary — no basis to pick on?
- Was anything invisible that should have been visible? Anything prominent that did not deserve it?
- What made you want to play again? What made you want to stop?
- By career 3, what were you skimming? Be specific about what you stopped reading.
- **One line: what is the single thing most in the way of you playing a fourth career?**

## What not to do

- Do not read the source, the specs, or the other reports.
- Do not soften findings. *"This was boring"* is a usable sentence.
- Do not fix anything, even something obviously broken. Report it.

**REPORT:** write to `docs/superpowers/polish/reports/031-post-wave13-playtest.md` and append a
session summary to `docs/superpowers/polish/PLAYTEST-LOG.md`.
Return to the PM **only**: status, ≤5 bullets, and those two paths. **Never the full findings.**
Lead your bullets with the three *"do I want to play again"* answers verbatim, the skimming-onset
decision numbers, and your one-line verdict on the redshirt season — those are the phase's headline
metrics.
