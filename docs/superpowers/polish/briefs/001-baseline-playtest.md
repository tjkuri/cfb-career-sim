# 001 — Baseline playtest

**Type:** playtester · **Wave:** 1 · **Status:** ready to dispatch

You are a playtester, not a developer. You are a player. **Do not fix anything, do not read source
code, do not review the markup.** Your entire job is to report how the game feels to play.

## Setup

```
cd /Users/tkuri/Documents/personal_projects/cfb-career-sim
npm run dev          # localhost:5173
```

Clear `localStorage` between careers — keys `cfb-career-sim:v1:current` and `cfb-career-sim:v1:log`.
You have browser automation; **actually click through the game.**

## What to play

1. **Five full careers of ours**, across different positions (Quarterback, Offensive skill, Offensive
   line, Defensive line, Defensive skill, Kicker — pick five). A career is 10–45 decisions, median 24.
   Play them as a player would: read the text, make choices you actually prefer, don't click blindly.
2. **Two or three careers of the reference game** this project reinterprets:
   `https://copero.com.ar/juegos/simulador-carrera` — Spanish, soccer, same genre. Play it properly.
   It is the standard we are trying to match for polish and feel.

## What to report

Feel, not code. Be specific and concrete — "the third season blurred into the second because nothing
marked the boundary" beats "pacing could be improved."

- Where did you get bored, confused, or lost?
- **Did you know where you were?** In the season (early? bowl game? offseason?) and in the career
  (which year, how much is left)?
- Did a choice ever feel arbitrary — no basis to pick on?
- After each choice the options are replaced in place by the outcome text, then you press Continue.
  Does that beat earn its extra tap, or does it become a speed bump by year three?
- Was anything invisible that should have been visible? Anything prominent that did not deserve it?
- What made you want to play again? What made you want to stop?
- **The reference game: what does it do better, concretely?** Name mechanisms, not vibes — what it
  shows you, when, and how that changed your experience.

## Specific claims to confirm or refute

These are one person's read of screenshots plus a short session. **They are unverified — tell us
which are real.** Refuting one is as valuable as confirming it.

1. The decision card floats in a large empty field at desktop width and reads unfinished.
2. You cannot tell where you are in the season or the career.
3. Hierarchy inside the card is flat — title, description and options sit too close in weight.
4. The option buttons read as form fields rather than choices with stakes.
5. The summary screen is a uniform grey scroll after the one big draft number.
6. The moment icons (emoji) look cheap next to the rest of the type.
7. Nothing marks a season ending; ~24 decisions arrive identically.
8. One accent colour is doing every job at once.

## Things you should know before judging

- `overall` is shown as a number deliberately. `character` is deliberately shown **only** as a phrase
  ("the staff trusts you") because it barely affects the outcome — if it reads as *ignorable* rather
  than *subtle*, that is a finding worth reporting.
- School tiers, event probabilities, and school "traits" are hidden **on purpose** — you are meant to
  infer them by replaying. If you found yourself wanting a stat block at Signing Day, say so, but
  know that we will probably not add one.

## Report

Write the full writeup to `docs/superpowers/polish/reports/001-baseline-playtest.md`.
Append a short entry to `docs/superpowers/polish/PLAYTEST-LOG.md` in the format that file specifies.

**Return to the PM only:** status, at most five bullets, and the report path. Nothing else — the PM
is deliberately keeping its context small.
