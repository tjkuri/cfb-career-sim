# 008 — Measure the repetition problem (measurement only, no code changes)

**Type:** research/measurement · **Wave:** 2 · **Status:** ready

Repo: `/Users/tkuri/Documents/personal_projects/cfb-career-sim`

## Goal

Put a number on the single biggest threat to this phase's north star. **You change no files except
your report and any throwaway script in the scratchpad.** No edits to `src/**`.

## Why

A playtester played three careers and stopped *reading* at roughly decision 16 of career one:

> *"Career 1, season 2 gave me the same Season Opener ('ninety thousand people, a noon kickoff, and a
> cupcake opponent'), the same Rivalry Week ('your ankle has been barking since Tuesday'), the same
> Bowl Season ('three weeks off, a gift suitcase'), word for word. That ankle has now barked in six
> separate seasons across three different players."*
>
> *"Once you can predict the season skeleton, a career is four laps of the same track with two or
> three new cards sprinkled in."*

The north star is a playtester playing **three careers in a row without being asked to**. No amount of
visual polish survives a player who has stopped reading. But this is one player's three careers, and
`src/content/**` is frozen — before anyone proposes content work, we need to know the real shape of
the problem. **This is the `DECISION 003` model: measure, then decide.**

## How

`npm run play -- <seed> random` runs a headless full career and prints JSON. `src/sim/play-headless.ts`
has the 15-line reference loop if you need to drive it programmatically instead. Run **at least 300
careers** across seeds and across all six positions — enough that the per-position numbers are not
noise. Put any script in the scratchpad, not in the repo.

If the JSON does not already identify which event produced each decision, get the event ids through
the headless loop rather than by string-matching prose — and say in your report exactly how you
attributed them.

## Questions, in priority order

1. **How repetitive is a career, actually?** Distinct events seen per career against total decisions.
   The distribution, not just the mean — the worst decile matters more than the average.
2. **The skeleton.** What fraction of a career's decisions are the three events the playtester named
   (Season Opener, Rivalry Week, Bowl Season, or whatever their real ids are)? How many times does a
   single event id repeat **within one career**, and at what decision number does the first exact
   repeat typically land? The playtester's boredom hit at ~16 — does that match?
3. **Coverage.** How much of the authored content does one career see? `src/content/events/**` holds
   ~102 events with options and ~330 authored outcomes. If a career sees 24 decisions, what share of
   the library does a player ever encounter — and how much of it is position-locked content they can
   only reach by replaying as someone else?
4. **Nonsense timing (B12).** How often does All-Star Game Invite fire in a freshman or sophomore
   year? How often is `Redshirt?` offered to a player who is past freshman year, or whose `overall`
   is already high? Give rates, not anecdotes.
5. **The redshirt contradiction (B13).** How often does a career take a redshirt and still accrue
   snaps in that same season? The playtester saw 9 snaps credited. Is that universal or a rare path?
6. **Does it get worse the longer you play?** Compare a first career to a fourth by the same player —
   i.e. how fast does the *pool* of unseen content run out across consecutive careers?

For each: the number, the method, and **one sentence on what it implies**. Rank the findings by how
much player-facing damage each does.

## What not to do

- **Do not propose content rewrites.** `src/content/**` and `src/engine/**` are frozen; this task
  produces evidence for a decision the user will make, not a plan.
- Do not tune anything. Do not "fix" a ratio you dislike.
- Do not read the UI source — this is engine/content measurement.

## Hard constraints

- `overall` **is** shown to players as a number; `character` is **never** shown as a number, only as a
  band phrase. Irrelevant to measuring, relevant if you are tempted to recommend a display.
- Never surface to players: school tier, `draftStock`, event `probability` or `weight`, EV, or school
  trait names. **You may read all of these freely for measurement** — they are hidden from players,
  not from analysis. Just do not recommend rendering any of them.
- 430+ tests stay green (the suite is now **444**). You are changing no source, so simply leave the
  tree as you found it.

## Operational notes

- A dev server may be running on 5173. **Never run `npm run dev` in the foreground — it does not exit
  and it has already killed one agent on this project.**
- **Do not run `git commit`, `git checkout`, `git restore` or `git stash`.** The tree may hold
  uncommitted work from a concurrent agent; a revert would destroy it.
- If a tool call fails 3 times, stop that line of attack, note it, and continue with the rest.
- 300 careers is a lot of output. Aggregate in the script; do not paste raw career JSON into the
  report or into your context.

## Report

Write to `docs/superpowers/polish/reports/008-measure-repetition.md`. Lead with a table of the
headline numbers and a one-paragraph answer to: **is the repetition problem as bad as one playtester
made it sound, worse, or narrower than it looked?**

**Return to the PM only:** status (done / blocked / needs-decision), at most five bullets, and the
report path. Nothing else — the PM is deliberately keeping its context small.
