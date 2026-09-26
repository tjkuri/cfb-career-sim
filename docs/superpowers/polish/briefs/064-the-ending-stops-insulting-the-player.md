# 064 — The ending stops insulting the player, and four things it got wrong

**Type:** developer (UI) · **Wave:** 34 · **Status:** ready

Repo: `/Users/tkuri/Documents/personal_projects/cfb-career-sim`

**Goal:** five defects the product owner found playing one career. All are in `src/ui/**`. All are
yours — no content, no engine.

**Read first, and only this:** the section **"THE PRODUCT OWNER PLAYED IT"** in
`docs/superpowers/polish/STATE.md`, and `DECISIONS.md` **090**. Do not read the rest of either file.

## The career that produced these

QB · Incarnate Word → Stephen F. Austin → North Texas · **5 seasons** · All-Conference, **Heisman
Trophy**, All-American, Bowl Win · **Round 1, Pick 12** · final **OVR 96**.

## Item 1 — the ending screen calls that career "a problem they are managing"

On the summary screen the standing readout drew all five rungs with the marker on **"a problem they are
managing"** and **`YOU ENDED HERE`** printed beneath it. A Heisman winner taken 12th overall was told,
in the loudest framing on the screen, that he was a problem.

**This is item 1 and it is the reason the wave exists.**

## Item 2 — stop drawing the scale. Draw the status and its movement

**The owner's own prescription, verbatim:** *"it might hit better if the player doesn't see the options,
just the status, and they see when it goes up and down."*

**Take it literally.** The five-rung list goes away as a visible scale, on **both** the career screen
and the summary. What replaces it is the player's **current standing** and, when it changes, **that it
changed and in which direction.**

**Why this shape and not the more elaborate one that was previously planned:** a previous plan kept the
five rungs, removed the summit, and added sub-rung marker movement. The owner's version is simpler, it
removes the unreachable top **by construction**, and it cannot read as a rank you are failing. A
measurement lane established that the top rung is unreachable — the median maximum-virtue career
finishes 5 points short of it and the median stock-maximiser 9 — so **a scale whose top nobody reaches
should not be drawn.**

**Keep what the permanent readout won:** standing must still be visible without hunting for it, on
every screen. A previous playtester's *"zero hunting"* closed three playtests of complaints. **Do not
reintroduce hunting**, and do not move it back into the credits.

**`character` is still NEVER a number** — not an integer, not a bar, not ticks, not a tooltip, not a
percentage. Words, position and weight are the permitted levers. That rule is DECISION 002 and this
brief does not reverse it.

## Item 3 — two seasons both labelled SR

The owner's five-season career printed **SEASON 4 · SR** and **SEASON 5 · SR**.

**The PM has already found the cause, so do not re-derive it:** `CLASS_ORDER` in `src/engine/types.ts`
is `["FR","SO","JR","SR"]` and `src/engine/advance.ts:270` advances only while
`ci < CLASS_ORDER.length - 1`. It therefore **clamps at SR**, and any career with a fifth season — the
redshirt path — prints SR twice. The redshirt year has no label of its own.

**`src/engine/**` is FROZEN.** So: establish whether this can be fixed honestly in the view model — for
example by deriving a displayed class label that knows a sit season happened, rather than echoing
`classYear` — and **if it cannot be fixed without an engine change, write the proposal and stop.** Say
clearly which it is. Do not edit the engine.

## Item 4 — "Everything else" is confusing

On an outcome card the owner read `This card +1 OVR` / `Everything else +2 OVR` and asked *"does this
mean this is the end of the season?"*

Their suggestion: **"net this season"** instead of *"Everything else"*. Take it or better it, but the
label must say **what period the figure covers**. Check what the figure actually aggregates before you
name it — **if "this season" is not literally what it sums, do not write that**, say what it does sum
and propose wording that is true.

## Item 5 — awards should arrive when they happen

*"in the soccer game you see the awards as they happen not at the end"*. Today the Heisman,
All-American and All-Conference appear only on the summary. **Surface an award at the moment it is
won.** Use the existing moment/outcome vocabulary rather than inventing a new surface, and do not let
it become a modal or anything that blocks the next decision.

## Item 6 — "Cost you with the program." is confusing

The owner called this line confusing. **It is wave 31's own rewrite** — it replaced *"Cost you in the
locker room."* on the argument that character covers more than one room, and B97 recorded at the time
that it would cost the majority of lines some vividness to buy accuracy on the minority. **The owner
has now confirmed the cost.**

**Do not simply revert it** — the reason it was changed is still true; a cousin mishandling NIL money is
not a locker-room event. Find a third option, propose it in the report with examples against real
outcome text, and **change it only if your version is better on both counts.** If you conclude the
current line is the least-bad available without a per-card audience field, say so and change nothing.

## Hard constraints

- `overall` is shown as a number. **`character` never is** — see item 2.
- Never display: school tier or any badge implying it, `draftStock`, event `probability` or `weight`,
  EV, or school trait names.
- **`src/engine/**` and `src/content/**` are frozen for YOU this wave.** The content freeze was lifted
  (DECISION 090) but under propose-then-approve, and **another lane owns content proposals.** If you
  need a content change, write it in your report.
- `src/ui/session/view-model.ts` is the only module allowed to read `GameState`. Do not bypass it.
- Aesthetic direction is settled: dark, clean sans-serif, card-based, generous whitespace, minimal
  chrome. **Do not reopen type, colour or contrast.**
- **Do not commit. Never `git checkout` / `restore` / `stash`.** Other lanes hold uncommitted work.
- **Do not run `npm run dev`** — already running on 5173. **Keep every command under ~7 minutes**;
  agents have died to a 600s watchdog.
- **Write your report stub as your FIRST action** and append as you go. A lane lost everything to that.

## Verify before reporting

- `npm test` — **846 green** at HEAD, plus what you add. Add a regression test for item 3's double-SR
  and for item 1 (a high-standing and a low-standing career must both render sensibly).
- `npm run typecheck` — both passes exit 0. `npm run build` — clean.
- **Click through at `http://localhost:5173`**, and specifically look at an ending screen for a career
  that went WELL. That is the case that was broken.
- `git status` — nothing under `src/engine/**`, `src/content/**`, or `src/sim/**`.

**REPORT:** `docs/superpowers/polish/reports/064-the-ending-stops-insulting-the-player.md`.
Return **only**: status, ≤5 bullets, that path. Lead with what replaced the five-rung scale, then
whether item 3 was fixable without an engine change, then your verdict on item 6.
