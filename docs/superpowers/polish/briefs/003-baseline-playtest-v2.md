# 003 — Baseline playtest (supersedes 001)

**Type:** playtester · **Wave:** 1 (re-dispatch) · **Status:** ready

Supersedes `briefs/001-baseline-playtest.md`, which was dispatched and **stalled with zero output**.
Two things changed: the reference-game half is dropped (report 002 covered it thoroughly by playing
the live site), and the career count is cut from five to three. Everything else stands.

You are a playtester, not a developer. You are a player. **Do not fix anything, do not read source
code, do not review the markup.** Your entire job is to report how the game feels to play.

## Setup — read this carefully, the last agent died here

- Repo: `/Users/tkuri/Documents/personal_projects/cfb-career-sim`
- **The dev server is ALREADY RUNNING at `http://localhost:5173` and is serving (HTTP 200, verified).
  Do NOT run `npm run dev`. Do NOT run `npm install`, `npm test`, or any build.** `npm run dev` never
  exits, and running it in the foreground is the most likely thing that hung the previous agent.
- **Never run a foreground command that does not terminate on its own.** If you need a shell at all,
  it is only for `git`-free one-shot commands that return immediately.
- Browser automation: invoke the `claude-in-chrome` skill first, then load the Chrome MCP tools in a
  **single** ToolSearch call listing every tool you need at once. A known-good tool set for this task:
  `tabs_context_mcp`, `tabs_create_mcp`, `navigate`, `computer`, `read_page`, `get_page_text`,
  `javascript_tool`, `tabs_close_mcp`.
- Clear `localStorage` between careers — keys `cfb-career-sim:v1:current` and `cfb-career-sim:v1:log`
  — using `javascript_tool`, then reload.
- **Anti-stall rule: if any single tool call fails 3 times, stop that line of attack immediately.**
  Write up what you have and report `blocked` with the specific failure. A partial honest report is
  worth far more than a stalled session. Do not retry a failing action in a loop.
- **Budget your session.** Aim to have a written report within a reasonable working span. If you are
  running long, cut to two careers and write up. Writing the report is not the optional part — it is
  the deliverable.

## What to play

**Three full careers**, each a different position from `POSITIONS` (Quarterback, Offensive skill,
Offensive line, Defensive line, Defensive skill, Kicker — pick three, and make one of them Kicker or
an line position, not three skill positions). A career is 10–45 decisions, median 24.

Play them as a player would: read the text, make choices you actually prefer, don't click blindly.
You are allowed to enjoy it. Notice when you stop enjoying it.

## What to report

Feel, not code. Be specific and concrete — "the third season blurred into the second because nothing
marked the boundary" beats "pacing could be improved."

- Where did you get bored, confused, or lost?
- **Did you know where you were?** In the season (early? bowl game? offseason?) and in the career
  (which year, how much is left)?
- Did a choice ever feel arbitrary — no basis to pick on?
- After each choice the options are replaced in place by the outcome text, then you press Continue.
  Does that beat earn its extra tap, or does it become a speed bump by the third season?
- Was anything invisible that should have been visible? Anything prominent that did not deserve it?
- What made you want to play again? What made you want to stop?
- **Did the three careers feel different from each other,** or did position turn out to be a costume?

## Specific claims to confirm or refute

These are one person's read of screenshots plus a short session. **They are unverified — tell us
which are real.** Refuting one is as valuable as confirming it, and we would rather cut work than do
work nobody needed. Do not simply validate the list.

1. The decision card floats in a large empty field at desktop width and reads unfinished.
2. You cannot tell where you are in the season or the career.
3. Hierarchy inside the card is flat — title, description and options sit too close in weight.
4. The option buttons read as form fields rather than choices with stakes.
5. The summary screen is a uniform grey scroll after the one big draft number.
6. The moment icons (emoji) look cheap next to the rest of the type.
7. Nothing marks a season ending; ~24 decisions arrive identically.
8. One accent colour is doing every job at once.

For each: **CONFIRMED / REFUTED / PARTIAL**, one or two sentences of what you actually saw, and — if
confirmed — how much it actually cost you as a player. A real but trivial annoyance should be labelled
as such; we are trying to rank these, not just collect them.

## One extra question, added since 001

Report 002 found the reference game answers "where am I in time" with a **fixed-length table that is
permanently on screen** — one row per career slot, completed rows filled in, future rows visible as
empty chrome — rather than any counter or progress bar. Before you read that as obviously right:
**while playing ours, did you actually want to know where you were, and when?** At the moment of the
decision, or between them? Would a table have helped you choose, or only helped you feel oriented?
Both are valid answers; we want the honest one.

## Things you should know before judging

- `overall` is shown as a number deliberately. `character` is deliberately shown **only** as a phrase
  ("the staff trusts you") because it barely affects the outcome — if it reads as *ignorable* rather
  than *subtle*, that is a finding worth reporting.
- School tiers, event probabilities, and school "traits" are hidden **on purpose** — you are meant to
  infer them by replaying. If you found yourself wanting a stat block at Signing Day, say so, but
  know that we will probably not add one.

## Report

Write the full writeup to `docs/superpowers/polish/reports/003-baseline-playtest.md`.
Append a short entry to `docs/superpowers/polish/PLAYTEST-LOG.md` in the format that file specifies.

**Return to the PM only:** status (done / blocked / needs-decision), at most five bullets, and the
report path. Nothing else — the PM is deliberately keeping its context small.
