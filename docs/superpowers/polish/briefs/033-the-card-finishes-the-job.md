# 033 — A card accounts for itself, including the cards the measurement could not see

**Type:** developer (UI) · **Wave:** 15 · **Status:** ready
**Repo:** `/Users/tkuri/Documents/personal_projects/cfb-career-sim`

## Goal

Close the three holes a playtester found in waves 12–13's "a card accounts for what it did" work:
hub cards printing an unattributed number, the character sentence losing to the number beside it,
and `EVERYTHING ELSE` never being explained.

## Why

Waves 12–13 built a real fix and it was verified over 12,847 cards with **zero** failures. The first
player through found it failing in **all three careers**. Both are true: the measurement's
population was *cards with authored prose*, and every real failure is outside that population. See
`docs/superpowers/polish/DECISIONS.md` entry 056 — **read it before writing code**, it names both
causes with file and line, and it explains why this is finishing a correct fix rather than redoing
a wrong one.

The reason this matters more than it looks: a previous playtest established that these
number-versus-words contradictions are what make skimming *rational*. They apply to brand-new cards
as much as repeated ones, which is how skimming generalises to cards the player has never seen. The
prose is this game's best asset and these defects train players not to read it.

## The three defects

**1. B45 — hub cards print a bare, unattributed number.**
`src/ui/session/reducer.ts:93` reads `const account = outcome === null ? null : cardAccount(...)`.
A one-option hub card has no authored outcome, so `account` is `null` and the card falls back to the
whole-`advance` total. The playtester's reproducible case, in 3/3 careers:

> *"You chose: Stay at Memphis" → **+5 OVR**, with no sentence at all*

That +5 was a deferred injury refund from an earlier card coming due. The number is real; the
attribution is wrong and there is no prose to carry it.

**Note the tension you must resolve rather than ignore:** DECISION 037 deliberately wants the
transfer hub to report *the whole movement*, because on that card the whole movement is the point.
So the fix is not "give hubs an account and stop." It is that **a number with no sentence is the
defect** — whatever a hub reports, it must say what it is reporting. Read DECISION 037 before
choosing an approach, and if you conclude 037 and this brief genuinely conflict, say so in your
report and propose rather than picking a side silently.

**2. B46 — the character sentence renders and loses.**
`lockerRoomLine` (`src/ui/screens/CareerScreen.tsx:80-87`) produces *"Cost you in the locker room."*
and line 349 renders it. It works. The playtester still read this as a reward:

> *"Compliance flags the resale listing with your name still in the metadata" → **+1 OVR***

A grey sentence does not outrank a bold signed integer. **This is hierarchy, not a missing feature**
— which is the thing this phase is best at. The card's real cost was character; the only number on
it was a small positive, and the number won.

**This does not reopen DECISION 002.** Character is still never an integer. Read 002 and 046 cause 2
before you start. If the only fix you can find requires a number, that is a proposal against 002 and
goes to the PM — do not take it yourself.

**3. B47 — `EVERYTHING ELSE` is a labelled bucket with no sentence.** Never once explained to the
player. Same defect as B45 wearing a label.

## Files you will likely touch

`src/ui/session/reducer.ts`, `src/ui/session/view-model.ts`, `src/ui/session/types.ts`,
`src/ui/screens/CareerScreen.tsx`, `src/ui/styles/career.css`, and their tests.

**Out of bounds:** `src/engine/**`, `src/content/**`, `src/sim/**`, `src/ui/screens/SummaryScreen.tsx`,
`src/ui/styles/summary.css`, and `src/ui/styles/tokens.css`.

## Constraints — HARD, paste-in block

- `overall` **is** shown as a number. `character` is **never** shown as a number, only as a band
  phrase. It swings draft stock ~±7.5 against overall's ~82; an integer would overstate it tenfold.
- Never display: school tier or any badge implying it, `draftStock`, event `probability` or `weight`,
  EV, or school trait names. Traits are meant to be discovered by replaying, never stated.
- `src/engine/**` and `src/content/**` are **frozen**. An agent that believes a change there is
  needed writes a proposal; it does not edit. The PM decides, and brings it to the user if it touches
  game balance.
- `src/ui/session/view-model.ts` is the only module allowed to read `GameState`. That boundary is
  what makes the hidden-mechanics rule testable. Do not bypass it.
- 644 tests stay green. Both typecheck passes exit 0. Verify before reporting.
- Aesthetic direction is fixed: dark theme, clean sans-serif, card-based, generous whitespace,
  minimal chrome, the decision and its options are the clear focal point.

## Working rules

- **Do not commit**, and never run `git checkout`, `git restore`, `git stash` or `git clean`. The PM
  commits. Another agent has uncommitted work in this tree.
- **The dev server is already running at `http://localhost:5173`.** Do not run `npm run dev` — it
  never exits. Never run a foreground command that does not terminate on its own.
- `resize_window` **silently no-ops** in this browser. To measure a breakpoint, run the app in a
  same-origin iframe sized to the exact viewport and read real rects from it.
- Driving a career by clicking in a JS loop **hits a 45-second timeout** after 3–10 clicks. Batch
  small, or skip the UI: write a terminal `GameState` straight into
  `localStorage['cfb-career-sim:v1:current']` as `{schema: 1, state, resolved: null}` and the app
  restores to it.
- If a grep over a source file returns nothing you are certain is there, run `file` on it — a literal
  NUL byte in a template string once made `grep` skip `view-model.ts` entirely.
- If a tool call fails 3 times, stop that line of attack and write up what you have.
- **Write your report incrementally.** Agents have been killed mid-flight in this phase; findings on
  disk survive, findings in your context do not.

## Verify before reporting

- `npm test` — 644 green (plus whatever you add).
- `npm run typecheck` — both passes exit 0.
- `git status --porcelain src/engine src/content src/sim` — **must be empty.**
- `npm run play -- 24 random` must stay byte-identical: md5 `cd2d3895e9c68e8dc485bfa5cc0fc832`.
- Click through at `localhost:5173`: a plain card, a one-option hub ("Stay at ..."), a card whose
  real cost is character, and a card showing `EVERYTHING ELSE`. **Reproduce the playtester's two
  quoted cases specifically** and show they now read correctly.
- Check 1456px and 360px.

Use the `frontend-design` skill for the visual work in defect 2.

**REPORT:** write findings to `docs/superpowers/polish/reports/033-the-card-finishes-the-job.md`.
Return to the PM **only**: status (done / blocked / needs-decision), **at most five bullets**, and
that path. **Never the full findings.**
