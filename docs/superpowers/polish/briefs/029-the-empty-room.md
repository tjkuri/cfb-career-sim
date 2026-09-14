# 029 — The empty room

Repo: `/Users/tkuri/Documents/personal_projects/cfb-career-sim`

**Goal:** the decision screen uses the desktop viewport it is given.

**Why.** Measured by the 025 playtester at 1456×824: the whole app is a **~755px band centred in a
1456px window** — roughly **350px of dead black on the left and 350px on the right**. Vertically it is
worse: on a typical decision screen the card bottom lands around **y=560** and the remaining **~260px
is empty black**. Their words:

> *"The decision screen uses about a third of the area it has. It does not read as deliberate
> whitespace — the card, the stat header and the year rail all look like a phone layout that was never
> given a desktop breakpoint. The year rail in particular sits marooned in the top-right with a huge
> void beneath it that would comfortably hold the season stat detail the ending screen already knows
> how to lay out."*

**The playtester names the fix themselves and it is a good one**: the ending screen's seasons block is
*the best screen in the game* (a finding from an earlier playtest — see B5, which was inverted on
measurement). It already knows how to lay out season stat detail. The void under the year rail is
where that belongs.

## What the reference game does, which you should adapt rather than copy

Torn down in full in `reports/002-reference-teardown.md` — read §1 and §2 before you start:

- **Height-locked shell**, `90svh`, `overflow-hidden`. Not a top-anchored scrolling document.
- **Two columns, roughly 0.85fr / 1.15fr** — the decision on the left, the ledger on the right.
- Type small and very heavy: 125/156 sizes ≤12px, 112/142 weights ≥700. **Ours already matches this
  register** — waves 4–8 did that work and DECISION 022/023 settled the AA floor.

Adopt, adapt or reject each **on purpose**, and say which in your report. We are not making a reskin:
this is college football, not the soccer original.

## Constraints particular to this task

- **025 found zero visual defects at 1456px** — nothing clipped, overflowed or collided, contrast
  fine. **Do not reopen type, colour or contrast.** You are moving things, not restyling them.
- The card just gained content and can now be taller: a resolved card may carry a `THIS CARD` /
  `EVERYTHING ELSE` split, a character line, and an injury note. Lay out for the tall case as well as
  the short one; play until you have seen both.
- **Phone width must survive.** It is the layout that exists today and it works; the desktop
  breakpoint is what is missing. Check ~400px as well as 1456px.
- The decision and its options stay the clear focal point. Filling the room is not the goal —
  *the screen reading as deliberate* is. Empty space you keep on purpose is a fine answer if you can
  say why.
- **B10, imagery, is not in scope and is not blocking you.** We have no art; 025 confirms the room is
  real and empty independent of it.

## Files

You own `src/ui/screens/CareerScreen.tsx` and `src/ui/styles/career.css`.

**Out of bounds:** `src/engine/**` and `src/content/**` (frozen; another agent holds an approved,
scoped lift on them this wave — do not touch either), `src/ui/session/**` (read freely; if you need a
new field on the view model, put the exact diff in your report and the PM will land it), and
`src/ui/screens/SummaryScreen.tsx` / `src/ui/styles/summary.css`, which a third agent owns. **Read
the summary screen's seasons block — it is your model — but do not edit it.**

## Hard constraints — design intent, not preferences

- `overall` **is** shown as a number (spec §15). `character` is **never** shown as a number, only as a
  band phrase. It swings draft stock ~±7.5 against overall's ~82; an integer would overstate it
  tenfold.
- Never display: school tier or any badge implying it, `draftStock`, event `probability` or `weight`,
  EV, or school trait names. Traits are meant to be discovered by replaying, never stated.
- `src/ui/session/view-model.ts` is the only module allowed to read `GameState`. **Do not read
  `GameState` from a component** — if the screen needs a fact it does not have, that is a view-model
  diff in your report, not an import.
- Tests stay green (**baseline is 636**). Both typecheck passes exit 0.
- Aesthetic direction is fixed: dark theme, clean sans-serif, card-based, generous whitespace,
  minimal chrome, the decision and its options are the clear focal point.

## Shell rules — three agents have died on these

- **The dev server is already running on `localhost:5173`. Do not start one.**
- **Never run a foreground command that does not terminate.**
- **Do not commit.** Do not `git checkout` / `restore` / `stash` / `reset`. Two other agents have
  uncommitted work in this tree. The PM commits.
- If a tool call fails three times, stop and write up what you have.

## Verify before reporting

- `npm test` (636+), `npm run typecheck` (two passes), `npm run build` — all clean.
- **Do not use `npm run play` byte-identity as your check this wave** — another agent holds an
  approved content change that moves it deliberately. Your check is `git status`: nothing modified
  under `src/engine/`, `src/content/`, or the out-of-bounds list.
- **Look at it, at both widths, on the real thing.** Resize the browser to ~1456×824 and to ~400px.
  Play far enough to see: a plain decision card, a resolved card with the tall account block, an
  offseason hub, and the ending. Report the measured numbers you changed — the band width, where the
  card bottom lands, how much vertical space is left — against the playtester's figures above.

Use the `frontend-design` skill.

## REPORT

Write findings to `docs/superpowers/polish/reports/029-the-empty-room.md`.

Cover: what you adopted, adapted or rejected from the reference and why; the before/after measurements
at 1456×824; what went into the void under the rail; how the tall resolved card behaves; phone width;
and anything you deliberately left empty, with the reason.

**Return to the PM only:** status (done / blocked / needs-decision), at most five bullets, and that
path. Never the full findings.
