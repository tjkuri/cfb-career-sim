# 015 — Mount the ledger, split the two axes, and make the strip readable

Repo: `/Users/tkuri/Documents/personal_projects/cfb-career-sim`

**Goal:** three fixes to the decision screen, all on the same two files, in priority order —
(1) mount the five-row career ledger that is already built and tested, (2) stop the standing block
reading as one self-contradicting sentence, (3) make the context strip's third row legible.

**Why:** the 014 playtester played three careers and answered "no" to a fourth. Two of their
reasons live on this screen. They never knew how many seasons they had left or that a fifth year
existed; and they read the standing block as *"All-America caliber / just a guy in the building"*
and reported it as a bug. It is not a bug — those are two different axes — but if a careful player
reads our correct data as broken, the presentation has failed.

## Standing rules (these killed three earlier agents — read them)

- **The dev server is already running** on `localhost:5173`. Do not start one.
- **Never run a foreground command that does not terminate.** No `npm run dev`, no `--watch`. Use
  `npm test -- --run`.
- **If a tool call fails 3 times, stop** and write up what you have.
- **Do not commit. Never `git checkout` / `restore` / `stash`.** The PM commits.
- **Work in priority order and report partial work honestly.** A verified item 1 beats three
  unverified ones. Item 1 alone is a good outcome for this brief.
- If you use `localStorage` for test scaffolding, **clean up your keys before you finish.** A
  previous agent left a dozen `snap:*` keys in the shared browser origin.

## Files you own

`src/ui/screens/CareerScreen.tsx`, `src/ui/styles/career.css`, and — only if item 1's wiring diff
requires it — `src/ui/session/view-model.ts` and `src/ui/session/types.ts` plus their tests.

**Out of bounds:** `src/ui/screens/SummaryScreen.tsx` and `src/ui/styles/summary.css` (another agent
owns both this wave), `src/ui/session/ledger.ts` (built, tested, correct — **consume it, do not
edit it**), `src/engine/**` and `src/content/**` (frozen — write a proposal in your report instead),
and `src/ui/styles/tokens.css` (the type scale and palette were just settled; if you believe you
need a new token, report it and the PM will place it).

## Read first

- `docs/superpowers/polish/reports/010-ledger-logic.md` — **ends with the exact two-file wiring
  diff for item 1.** Start there.
- `docs/superpowers/polish/DECISIONS.md` — **020** (ledger rows are labelled by sequence, `Year 1`–
  `Year 5`; its "would change our mind" clause was withdrawn on purpose — do **not** re-derive the
  snaps inference, it measures clean and answers the wrong question), **010** (always five rows,
  the fifth is the redshirt slot), **013** (current season's row first), **014** (a null record is
  the absence of one, never `0-0`), **024** (item 2 — this is its whole spec), **023** (item 3),
  **002** (why character is coarse and qualitative, and why making it finer is not on the table).
- `docs/superpowers/polish/reports/014-post-wave4-playtest.md` — §"The rail contradicts itself
  constantly", §"Career length", and claim 7 for item 3.

## The work, in priority order

### 1. Mount the ledger — the largest win available and the cheapest

`src/ui/session/ledger.ts` is built, tested over 6,418 snapshots from 240 careers with zero
invariant violations, and committed. **Nothing renders it.** Report 010 ends with the exact wiring
diff; follow it rather than re-deriving anything.

Rows are `Year 1`–`Year 5` (DECISION 020). Five rows always, the fifth being the redshirt slot
(DECISION 010). This is also the answer to the playtester's career-length confusion: they believed
a career was four years because the title screen says so, and a fifth season exists and is bought
by the redshirt. A five-row ledger states the shape of a career without a word of explanation.

Placement is yours to judge, but the reference's answer — a persistent ledger occupying the play
area's right-hand side, always on screen (DECISION 007, `reports/002-reference-teardown.md`) — is
the model, and we currently have a large empty field at desktop width (B1) that it can fill. At
narrow widths it must not push the decision card below the fold; the decision and its options
remain the focal point.

### 2. Two axes, two statements (DECISION 024)

`CareerScreen.tsx:85-91` puts the OVR number, the standing phrase (from `overall`) and the trust
phrase (from `character`) adjacent in one dimming ramp with no labels. Read top to bottom they
parse as one sentence about overall, so `All-America caliber / just a guy in the building` reads as
a contradiction. It is two true statements about two different things.

Make them separable as two statements. Labelling, spatial separation, or moving trust off the OVR
number's gloss are all open to you — **DECISION 024 fixes the problem, not the solution.** Two
things it does fix: do not make the character bands finer (DECISION 002 measured that call), and do
not make character quieter or hide it (B17 is that it is *already* too ignorable).

Constraint that bites here: **`character` is never a number, only a band phrase.** Do not add a
meter, a dot count, a bar, or anything else that implies a scale with resolution.

### 3. Make strip row 3 legible (DECISION 023, claim 7)

The playtester's one type-scale casualty: the strip's third row (`143 snaps · 13 FG 63 Points
1 Game-Winners`) is too small to read comfortably, and rows 2 and 3 no longer separate tonally —
*"what tells them apart is that row 3 is smaller."*

Raise row 3 to a legible step. **Do this before reaching for any tonal change** — 023's reasoning is
that once the rows differ in size by a sane amount, the tonal complaint likely dissolves. Do not add
a new grey; the ramp is four steps and stays four steps. Use the existing type tokens.

## Hard constraints (design intent, not preferences)

- `overall` **is** shown as a number (spec §15). `character` is **never** shown as a number, only as
  a band phrase. It swings draft stock ~±7.5 against overall's ~82; an integer would overstate it
  tenfold.
- Never display: school tier or any badge implying it, `draftStock`, event `probability` or
  `weight`, EV, or school trait names. **This one is live in this brief** — the 014 playtester asked
  for a "currently projected: 6th round" line and DECISION 025 refused it. Do not add it.
- `src/engine/**` and `src/content/**` are **frozen**. Write a proposal in your report; do not edit.
- `src/ui/session/view-model.ts` is the only module allowed to read `GameState`. Do not bypass it.
- **Hue may never track valence** (DECISIONS 006, 012, 021). There is no `--good`/`--bad` pair and
  you must not add one. Magnitude may drive scale, weight and motion.
- 492 tests stay green; both typecheck passes exit 0.
- Aesthetic direction is fixed: dark theme, clean sans-serif, card-based, generous whitespace,
  minimal chrome, the decision and its options are the clear focal point.

## Verify before reporting

- `npm test -- --run` — **492 green** is the baseline. `npm run typecheck` — two passes, both exit 0.
  `npm run build` — clean.
- `npm run play -- <seed> random` on two seeds, byte-identical to before your change. A UI change
  must not move the engine.
- **Click through at 1456px and at 360px:** creation → Signing Day → a decision card → a resolved
  card → a one-option beat → the summary. Confirm the ledger shows five rows from season 1, that the
  current season's row leads (DECISION 013), and that no row shows a fabricated `0-0`.
- Confirm at a glance — not with your face against the screen — that the standing block now reads as
  two statements rather than one.

Use the `frontend-design` skill for the visual work.

**REPORT:** write findings to `docs/superpowers/polish/reports/015-decision-screen-orientation.md`.
Return to the PM **only**: status, ≤5 bullets, and that path. Never the full findings.
