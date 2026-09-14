# 025 — Playtest after waves 9 and 10 (you can lose now, and the opener stopped repeating)

**Type:** playtester · **Wave:** 11 · **Status:** ready — dispatch now

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
  three careers and write up.
- Known harness limit, do not burn a run on it: the extension pins the viewport at ~800 CSS px and
  `resize_window` reports success while nothing changes. Play at whatever width you get and do not
  try to fight it. If the layout looks cramped, say so and note the width you were at.

## The north star, and how to measure it honestly

The goal of this whole phase is: *a playtester who has never seen it plays three careers in a row
without being asked to.* You have now been asked to, which destroys the measurement — so replace it
with one that survives.

**After each career, stop. Before starting another, write down, in one line:**

> *Do I want to play again right now — yes or no — and what is pulling me either way?*

Record that answer **before** you continue. Four honest lines are worth more to us than four careers
played dutifully. If the answer is ever "no", say so plainly and play the next one anyway; "no, but
I did it because you asked" is the single most useful sentence you could write.

Two previous playtesters gave these curves, in order:

- *yes* → *"reluctantly yes, but now I want to **check** something, which isn't the same thing"* → **no**
- *yes* → *yes* → **no**

**Do not try to match or beat that.** If you land in the same place, say so; that is the finding.
What we need to know is whether the curve moved, not whether you were kinder.

## What to play

**Four full careers** — this is the fourth-career run, so the fourth one matters most and is the
reason the brief asks for one more than usual. Four different positions from the six (Quarterback,
Offensive skill, Offensive line, Defensive line, Defensive skill, Kicker). Make at least one of them
Kicker or a line position — not four skill positions. A career runs 10–45 decisions, median 24.

Play as a player would: read the text, choose what you actually prefer, don't click blindly. You are
allowed to enjoy it. **Notice when you stop.**

Two of the four are shaped:

- **Career 3: try to end badly on purpose.** Skip the work, duck the media, play hurt, and **declare
  early**. We need to know what a bad career looks like from the inside, and whether the game lets
  you have one at all.
- **Career 4: transfer schools at least once**, if the game offers it. Otherwise play it however you
  like.

The other two are yours to play as you please.

## The question this playtest exists to answer

Everything else on this page is secondary to this one, so read it twice — but **do not go hunting
for it.** It is a question about what happened to you, answerable only if you play normally and
notice honestly.

Some events in this game repeat. Both previous playtesters hit that, and both reported the same
second-order effect: **they stopped reading card bodies — including brand-new cards they had never
seen before.** One of them had generalised to skimming everything by decision 21 of their *first*
career.

**What we cannot tell from any measurement is which of these is true:**

- **Onset** — you stop reading once you have been burned by a repeat *at all*, and how many more
  follow barely matters; or
- **Dose** — you keep reading, and each further repeat wears you down, so the total number is what
  decides it.

So, as precisely as you can manage:

1. **At what decision number did you first notice you were skimming rather than reading?** Not when
   you first saw a repeat — when you first caught *yourself* not reading.
2. **What was the card you were skimming when you noticed?** A repeat, or something new?
3. **Did it start from a specific moment you can name**, or did it come on gradually across
   decisions?
4. **Did it ever reverse?** Did anything pull you back into reading properly? Name it.
5. Same four questions for each career. Whether it starts *earlier* in career 3 than career 1 is
   itself an answer.

Answer from what happened, not from what you think we want. **"I never stopped reading" is a real and
very useful answer** — say it if it is true.

## Claims to confirm or refute

Everything below shipped in the last two waves on reasoning that has not yet met a player.
**Refuting one is as valuable as confirming it.** Do not just validate the list — across the last two
playtests, four of the claims handed over turned out to be wrong as stated, and catching that saved
two waves of work.

For each: **CONFIRMED / REFUTED / PARTIAL**, one or two sentences of what you actually saw, and — if
confirmed — how much it actually cost or gave you as a player.

1. **Could you lose?** The previous playtester played badly on purpose and was still drafted in round
   7; they wrote *"I could not lose."* Something changed. On career 3: **did it ever feel like
   failure was on the table?** At what point did you work out whether it was, and how? If you were
   drafted anyway, say so and say what that did to the ending.
2. **Declaring early — gamble or trap?** Career 3 declares early. When you chose it, did you
   understand you were taking a risk, or did the game hide the cost until the ending? **The specific
   question: does it read as a gamble you took, or as a trap you were walked into?** Those feel
   completely different and only one of them is acceptable.
3. **The transfer.** On career 4, when you transferred: did the game give the moment any weight? Did
   you find out what the transfer actually did to you, and when? Previously a transfer changed one
   word in the header and produced no card at all. **Does the offseason now feel like a decision, or
   still like a menu?** If you formed a belief about whether transferring up is good for you, say
   what it was and what gave you that belief.
4. **The draft ending.** Could you rank two of your four endings at a glance, without reading the
   round and pick numbers? Did the end screen ever read as *congratulatory* on the career that went
   badly? Name the exact element if so.
5. **Position — costume or character?** Four positions across four careers. Did they feel like
   different careers, or the same career with a different word at the top? **Be specific about where
   the difference showed up and where it did not.** If the offseason felt identical at all four
   positions, say that plainly.
6. **Did you know where you were** — in the season, and in the career (which year, how much is
   left)? At any point did you lose track?
7. **The season ledger** beside the card — did you *use* it to decide something, or was it wallpaper
   by season two?
8. **Anything hard to read, cut off, overflowing, or colliding.** Name the exact text.
9. **The empty room.** At the width you are playing, does the page feel like it is using the space it
   has, or does the card float in a large empty field? Answer for the decision screen specifically,
   and note the width you were at.

## What to report

Feel, not code. Concrete beats abstract — "the third season blurred into the second because nothing
marked the boundary" beats "pacing could be improved."

- Where did you get bored, confused, or lost? At roughly which decision number?
- Did a choice ever feel arbitrary — no basis to pick on?
- Was anything invisible that should have been visible? Anything prominent that did not deserve it?
- What made you want to play again? What made you want to stop?
- By career 4, what were you skimming? Be specific about what you stopped reading.
- **One line: what is the single thing most in the way of you playing a fifth career?**

## What not to do

- Do not read the source, the specs, or the other reports. Your value is that you are the only
  participant who does not know how it works.
- Do not soften findings. "This was boring" is a usable sentence.

**REPORT:** write to `docs/superpowers/polish/reports/025-post-wave9-playtest.md` and append a
session summary to `docs/superpowers/polish/PLAYTEST-LOG.md`.
Return to the PM **only**: status, ≤5 bullets, and those paths. Lead with the four "do I want to play
again" answers, verbatim, and the skimming-onset decision numbers — they are the phase's headline
metrics.
