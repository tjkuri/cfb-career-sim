# 038 — Four orientation defects and a button that lies

**Type:** developer (UI) · **Wave:** 18 · **Status:** ready — dispatch now

Repo: `/Users/tkuri/Documents/personal_projects/cfb-career-sim`

## Goal

Fix five concrete, independently-reported defects, all of which make the screen disagree with itself
about where the player is. None of them is a matter of taste.

## Why

A playtester at 1456px found all five. Orientation in time is the item this phase has spent the most
effort on (B2), and these are places where the fix now contradicts itself — two parts of one screen
giving two different answers is worse than neither answering.

## The five defects, in priority order

1. **The rail and the header disagree about OVR, at every season boundary.** End of season 1: the
   outcome card says *"Everything else: overall up 2, now 63"*, the header reads **63**, and the
   right rail — under a heading that literally reads **`OVR AT SEASON'S END`** — shows the Year 1 row
   as **61**. Same at every boundary: 69 vs 71, 77 vs 78, 86 vs 89.
   **Diagnose before fixing.** Either the rail's value is stale, or it is a genuinely different
   quantity (the value *before* offseason development is applied) under a label that claims to be the
   season's end. Find out which, then make the screen tell the truth — by correcting the value if it
   is stale, or by correcting the *label* if the value is right. Say in your report which it was.
2. **The rail runs ahead of the header.** On the last card of every season, the rail highlights
   **YEAR N+1** while the header still reads `SEASON N · POSTSEASON`. The highlight should follow the
   player, not the cursor into the next row.
3. **The phantom fifth year.** The rail shows five year slots for the whole career. A career with no
   redshirt ends after **four** seasons and goes straight to the ending screen, having shown an empty
   Year 5 the whole way. The playtester: *"Nothing ever told me why year 5 existed, or why I didn't
   get one."* A fifth year is real but conditional (a redshirt unlocks it, and `5TH-YR SR` renders
   correctly when it happens). Make the rail stop promising a season most careers never get. Your
   call how — do not invent a new mechanic, and do not reveal anything about eligibility the player
   has not been told.
4. **The START button lies.** On the create screen, **START THE RECRUITING CYCLE** renders in full
   solid gold at full opacity — visually identical to its enabled state — while it is `disabled`
   because **LAST NAME** is empty. Nothing marks LAST NAME as required. The playtester clicked it
   twice and got no feedback of any kind. Give the disabled state a visible disabled treatment, and
   mark the required field.
5. **`Next Man Up` tells an injured player to take every snap.** Reported by a kicker in a walking
   boot. This is almost certainly a missing `requiresPlaying`-class condition, which is **content and
   therefore frozen** — do not edit it. **Diagnose it and write a proposal** in your report: which
   event, what condition it is missing, and what the one-line content change would be. The PM
   decides.

## Files you will likely touch

`src/ui/**` — the season rail / right-hand ledger components, the header, and the create screen. The
OVR question may require reading `src/ui/session/view-model.ts`; you may change it there if that is
where the defect lives.

## Out of bounds

- `src/engine/**` and `src/content/**` — frozen (see constraints).
- **`src/sim/**` — another in-flight task owns it.** Do not touch it.
- **The ending / draft summary screen — the PM owns it this wave.** Do not touch it, even though you
  will hear it has problems. It does.

## Constraints — HARD, do not violate

- `overall` **is** shown as a number. `character` is **never** shown as a number, only as a band
  phrase. It swings draft stock ~±7.5 against overall's ~82; an integer would overstate it tenfold.
- Never display: school tier or any badge implying it, `draftStock`, event `probability` or `weight`,
  EV, or school trait names. Traits are meant to be discovered by replaying, never stated.
- `src/engine/**` and `src/content/**` are **frozen**. An agent that believes a change there is
  needed writes a proposal; it does not edit. The PM decides, and brings it to the user if it touches
  game balance.
- `src/ui/session/view-model.ts` is the only module allowed to read `GameState`. That boundary is what
  makes the hidden-mechanics rule testable. Do not bypass it.
- 650 tests stay green. Both typecheck passes exit 0. Verify before reporting.
- Aesthetic direction is fixed: dark theme, clean sans-serif, card-based, generous whitespace,
  minimal chrome, the decision and its options are the clear focal point. **Type, colour and contrast
  are settled** — three playtests, zero visual defects. Do not reopen them.
- **Do not commit.** Never run `git checkout`, `git restore` or `git stash` — the tree holds work from
  other agents. The PM commits.

## Setup notes — agents have died here

- **The dev server is ALREADY RUNNING at `http://localhost:5173`.** Do NOT run `npm run dev`. It never
  exits and is the single most likely thing to hang you.
- Never run a foreground command that does not terminate on its own.
- If a tool call fails 3 times, stop that line of attack and write up what you have.
- For browser work, invoke the `claude-in-chrome` skill and load the Chrome MCP tools in a **single**
  ToolSearch call. `resize_window` silently does nothing; play at whatever width you get.

## Verify before reporting

`npm test` (650 green), `npm run typecheck` (both passes exit 0), and **click through the change at
localhost:5173 yourself** — specifically, reach a season boundary and confirm the rail and header now
agree. A defect about two things disagreeing cannot be verified by a unit test alone.

Use the `frontend-design` skill for the visual work on defect 4.

**REPORT:** write findings to `docs/superpowers/polish/reports/038-where-am-i.md`.
Return to the PM **only**: status, ≤5 bullets, and that path. **Never the full findings.**
Lead your bullets with which of the two explanations defect 1 turned out to be, and your `Next Man Up`
proposal in one line.
