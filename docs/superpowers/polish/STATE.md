# CFB Polish Phase — Board

**This file is the single source of truth.** It must always be complete enough that a brand-new PM
session can take over from it alone. Update it after every wave.

**Last updated:** 2026-09-13 · **Wave:** 2 in flight (005, 006, 007) · **PM session:** 1 

---

## The goal

A CFB reinterpretation of a soccer career simulator. Engine and content are finished and good; the
UI works but looks and feels like an MVP.

North star: match the reference game's visual polish and its intuitive, hard-to-put-down feel, while
being unmistakably college football rather than a reskin. When unsure whether something is worth
doing: *does this get us closer to how the reference game feels to play?*

**Done is not an empty backlog.** Done is a playtester who has never seen it playing three careers in
a row without being asked to.

## Reference game

- Live: `https://copero.com.ar/juegos/simulador-carrera` (Spanish, soccer)
- Local bundle: `reference/soccer-original/CareerSimulatorPage-BtSZ7OIp.js` (440K minified, one line)

**Torn down in full — `reports/002-reference-teardown.md`.** The live site was reachable; the report
carries measured pixel values and the actual `:root` tokens, not just bundle greps. Three starting
hypotheses, verdicts:

| | Hypothesis | Verdict |
|---|---|---|
| Layout | Full-viewport, vertically centred; ours top-anchored and scrolling | **Confirmed.** Height-locked shell (`90svh`, `overflow-hidden`), two columns ~0.85fr / 1.15fr — decision left, ledger right |
| Type | Small and very heavy; ours large and airy | **Confirmed and quantified.** 125/156 sizes ≤12px, 112/142 weights ≥700, `leading-none` 43×. See DECISION 008 |
| Imagery | A large image per event at 60–90% of viewport | **REFUTED.** Images are per *outcome* (event × option), rendered *inside* the option card at 157×154 of a 185×305 card — 50% of the card, ~15% of viewport. 39 photos total |

Headline finding: **there is no season/week counter anywhere.** Position in time is a fixed 12-row
ledger, always on screen, 56% × 100% of the play area. See DECISION 007.

Adopt, adapt or reject each **on purpose**. Do not copy its assets or literal palette. DECISION 006
records the three things in it we are deliberately *not* taking.

## Current state of the build

- Phase 3 MVP complete and committed (`42ba561`), plus the OVR display reversal (`d600e69`).
- **430 tests passing**, both typecheck passes exit 0, production build clean (~109 kB gzipped).
- Playable end to end: creation → Signing Day → decisions → draft summary → share text → career log,
  with `localStorage` resume.

## Backlog

Status: `todo` · `in-flight` · `blocked` · `done` · `dropped`

| ID | Item | Status | Notes |
|---|---|---|---|
| B1 | Decision card floats in a large empty field at desktop width | **CONFIRMED — low cost** | Playtester: real, but "not what hurt". B2's fix largely fills it anyway |
| B2 | **No orientation in time** | **CONFIRMED — worse than stated** | Record reads `0-0` all season and *intermittently vanishes*; class badge flips mid-card. But see DECISION 014 — `0-0` is true, not a display bug. In flight: brief 007 |
| B3 | Flat hierarchy inside the card | **PARTIAL / mostly REFUTED** | Flatness is *between* cards, not inside them. Do not brief this as stated |
| B4 | Option buttons read as form fields | **CONFIRMED** | Gold sits on Continue (a no-op) while real choices are grey outlines |
| B5 | Summary is a uniform grey scroll | **PARTIAL** | The seasons block is *the best screen in the game*. Do not rewrite it — it is the model for the rest |
| B6 | Moment icons are emoji | **PARTIAL — low priority** | Emoji are minor; **duplicate moments** are the real issue. Dedupe before restyling |
| B7 | No rhythm across a career | **CONFIRMED — strongest finding** | And the cause is *content repetition*, not styling: identical Season Opener / Rivalry Week / Bowl text every season. See B11 |
| B8 | One accent colour does every job | **CONFIRMED twice** | 004 counted **8 distinct `--bulb` jobs**; playtester calls it "the mechanism behind the flat dynamic range". In flight: brief 005 |
| B9 | Five parked *feel* items in `docs/superpowers/STAGE4-HANDOFF.md` — uneven injury exposure, character drift, decorative stats, +2 | todo | Deferred until a UI existed to judge them in. It exists now |
| B10 | **Imagery** — reference gives every option a picture (50% of the option card). We have no art. Sourcing/scope is a **user decision**, not a PM call | blocked-on-user | ~102 events / 330 outcomes. Per-outcome art does not scale; per-event ≈102; per-*category* ≈12–20 and reusable. See `reports/002-reference-teardown.md` §6 |

**B1–B8 are now verified** by the 003 playtest (3 careers, ~78 decisions) and the 004 audit. Verdicts
are in the table. Two were wrong as stated (B3, B5) and would have wasted a wave.

**New items the playtest found, which outrank most of B1–B8:**

| ID | Item | Status | Notes |
|---|---|---|---|
| B11 | **Seasons are near-literal reruns** — identical Season Opener / Rivalry Week / Bowl text every season, word for word. *"This is where I stopped reading and started clicking"* — decision ~16 of career 1 | **blocked-on-user** | `src/content/**` is frozen. This is the single largest threat to the north star ("three careers in a row without being asked") and **no amount of polish fixes it** |
| B12 | **Season-specific events fire in nonsense years** — All-Star Game Invite ("your last impression before the draft") closes *freshman* year; Redshirt? is offered unfiltered to a junior the game just called "one of the best in the conference" | **blocked-on-user** | Gating is content/engine. Cheaper than B11 and fixes much of the same damage |
| B13 | **Redshirt fiction and mechanics disagree out loud** — took a redshirt, kept playing the same season, appeared in a game, summary credited 9 snaps | **blocked-on-user** | Reads as a bug, not a design choice. Engine-side |
| B14 | **Flat dynamic range** — a −8 OVR injury + demotion renders identically to a speeding-ticket joke; promotions happen silently in grey | todo | Fix is DECISION 012: magnitude may drive scale/weight/motion, valence may never drive hue. Needs 005's tokens first |
| B15 | **Single-option cards have hidden effects** — "Win the job", the only option, cost 1 overall and showed no outcome text at all. Forced, negative, unexplained | todo | UI can show the delta (DECISION 012); the one-option-skips-Continue rule is spec §4 |
| B16 | **The biggest choices get the least ceremony** — transferring schools produces no outcome card at all; the header word just changes. Meanwhile a podcast invite gets a full card | todo | |
| B17 | **Character is ignorable, not subtle** — moved twice in three careers, silently, and one outcome said *"Character intact"* while the phrase did not change | todo | The qualitative-only call (DECISION 002) stands; the *presentation* is what failed. It sits in the same grey directly under the role phrase and coasts on that adjacency |

## In flight — wave 1 (research/validation only; no code changes in this wave)

| Brief | Agent | Owns files | Dispatched |
|---|---|---|---|
| ~~`briefs/001-baseline-playtest.md`~~ | playtester | — | **FAILED** — stalled, zero output. Superseded by 003 |
| `briefs/003-baseline-playtest-v2.md` | playtester | `reports/003-baseline-playtest.md`, `PLAYTEST-LOG.md` | 2026-09-13 (re-dispatch) |
| ~~`briefs/004-current-ui-audit.md`~~ | research | `reports/004-current-ui-audit.md` | **DONE** 2026-09-13 |
| ~~`briefs/002-reference-teardown.md`~~ | research | `reports/002-reference-teardown.md` | **DONE** 2026-09-13 |

**Agent-stall postmortem (001).** The first playtester stalled with no progress for 600s and wrote
nothing. Most likely cause: it ran `npm run dev` in the foreground, which never exits. The dev server
is now up and serving on 5173 (verified HTTP 200). Every brief since carries three rules that were
missing from 001 — *the server is already running, don't start one*; *never run a foreground command
that does not terminate*; *if a tool call fails 3 times, stop and write up what you have*. Keep these
in every future brief that touches the shell or the browser.

003 also narrows scope: the reference-game half is dropped (002 covered it by playing the live site)
and careers cut 5 → 3, because session length is itself a stall risk.

**Do not run two browser playtesters in parallel.** They share one Chrome profile and therefore one
`localStorage` origin — concurrent careers would clobber each other's saves. Playtesting is serial.

Wave 1 deliberately contains **no development work.** B1–B8 are unverified and the reference
divergences are three grep findings; both get evidence before anyone writes CSS. The two tasks are
independent — one plays our build and the reference, the other tears down the reference bundle — and
they share no files.

## Uncommitted work in the tree — read before touching anything

`git status` is **not clean and that is expected.** Nothing in this phase has been committed; the user
has not asked for commits and the PM does not make them on their behalf. Every brief now carries a
**do not commit / do not revert** rule, because a `git checkout` or `stash` by any agent would destroy
another's work.

Verified and sitting uncommitted: the six-file CSS split (`tokens.css`, `base.css`, `career.css`,
`creation.css`, `summary.css`, `log.css` + a 12-line `app.css` index).

**Rate-limit incident, 2026-09-13.** All three wave-2 agents were killed mid-flight by a session
limit. One had already written the CSS split but died before verifying it. The PM verified it by hand
rather than trusting or rerunning it:

- concatenating the six files in import order, normalized for whitespace and comments, gives **379
  lines identical to the original**, with **75 selectors in identical order** (diffed, not eyeballed);
- `npm test` 430 green · `npm run typecheck` both passes exit 0 · `npm run build` clean, CSS 7.42 kB.

Brief 005 was then rewritten to mark step 1 done, so the re-dispatched agent does not redo it. **A
killed agent may have left correct work behind — verify before discarding, and verify before
trusting.**

## In flight — wave 2 (re-dispatched 2026-09-13 after the rate-limit kill)

| Brief | What | Owns files |
|---|---|---|
| `briefs/005-split-css-and-tokens.md` | ~~Split `app.css`~~ **done, verified**; now: split the eight-job `--bulb`, add the missing surface/radius/gap/duration tokens, extend the font axis past `wght 800` | `src/ui/styles/**` |
| `briefs/006-engine-seasonline-fields.md` | `SeasonLine` gains `overall` + `classYear` (DECISION 009) | `src/engine/types.ts`, `src/engine/advance.ts` |
| `briefs/007-honest-season-state.md` | Live stat line + snaps + phase label on `CareerView`; stop rendering a record that does not exist (DECISION 014) | `src/ui/session/**` |

The three lanes share no files. 005 owns all CSS, 006 owns all engine, 007 owns all session data.
007 is explicitly told **not** to depend on 006's new fields.

**Wave 3 is blocked on 005 landing** — every remaining visual task needs the split stylesheet and
the new tokens. Queue, in playtester's own priority order:

1. Draw the live season state 007 exposes (needs `career.css` + `CareerScreen.tsx`).
2. Give consequence a visual voice — B14/B15, under DECISION 012 (magnitude, never valence).
3. The five-row ledger — DECISIONS 007/010/013, plus the career-length answer.
4. Type scale — DECISION 008 + audit G4; also fix audit Bug 3 (`body { font-size: 17px }` at
   `app.css:36` does not scale rem declarations because `html` sets no `font-size`).
5. Clamps — audit G3, hard prerequisite for any height-locked shell.
6. Option rendering — B4/G6. Gold currently sits on Continue, a no-op, while real choices are grey.

## Findings that outrank the backlog table

From `reports/004-current-ui-audit.md` — these were not on the board and change the plan:

- **`app.css` is the whole phase's bottleneck.** 10 of 13 gaps touch one flat 475-line file. Hence
  DECISION 011 and brief 005.
- **B8 is CONFIRMED by code, not opinion:** `--bulb` does **eight distinct jobs**. This one did not
  need a playtester.
- **The font axis stops at `wght 800`** (`app.css:6`), so DECISION 008's "900 for numerals" is not
  loadable today. One-token fix, folded into 005.
- **Zero clamps exist** in 475 lines; 9 overflow-capable nodes. Longest real strings, measured off the
  loaded `CONTENT` bundle: outcome **241 chars**, description 194, engine-built option label **76
  today / 107** if the `factory`/`developmental` traits are ever assigned. By CSS arithmetic a `90svh`
  lock fails below a ~720px viewport. Clamps are a hard prerequisite for the height-locked shell.
- **Six bugs found and deliberately left unfixed** — see the report's "Found, not fixed" section.
  Bug 3 (`body { font-size: 17px }` at `app.css:36` does not scale rem-based declarations, because
  `html` sets no `font-size`) belongs to the type-scale brief.

## Next actions

1. Await 005 / 006 / 007. Read the ≤5 bullets first; open a full report only when briefing against it.
2. **Dispatch wave 3 only after 005 lands** — the queue above, in that order. Two CSS lanes can run
   in parallel once the split exists (`career.css` and `summary.css` are separate files then).
3. **Re-playtest after wave 3.** The north star is a playtester playing three careers in a row
   unprompted; the 003 playtester stopped reading at decision ~16 and wanted a fourth career anyway.
   Measure against that, not against an empty backlog.
4. **Two things are waiting on the user — see "For the user" below.** Do not start either.

## For the user — open, not PM calls

**1. B11/B12/B13 — content repetition and event gating. This is the biggest finding in the phase.**

The playtester quit reading at decision ~16 of career 1, when Season Opener repeated verbatim in
season two. *"That ankle has now barked in six separate seasons across three different players."*
*"Once you can predict the season skeleton, a career is four laps of the same track with two or three
new cards sprinkled in."*

`src/content/**` is frozen, so none of it is a PM call. It matters because **no amount of visual
polish fixes it** — we would ship a beautiful game that a player stops reading a third of the way in.
Three shapes, cheapest first:

- **Gate the season-specific events** (B12) so All-Star Invite stops firing in freshman year and
  Redshirt? stops being offered to a junior star. Smallest change, fixes the loudest nonsense.
- **Fix the redshirt contradiction** (B13) — redshirt taken, player still appeared, 9 snaps credited.
  Reads as a bug.
- **Add per-season variants** of the three skeleton events (B11). Largest, and the only one that
  actually fixes the rerun problem.

**2. B10 — imagery.** The reference gives every option a picture at ~50% of the option card. We have
no art. ~102 events / 330 outcomes, so per-outcome art does not scale. Per-*category* — practice,
game day, injury, off-field, academics — is ~12–20 reusable flat vector pieces in the turf/chalk
palette, and is the only shape worth recommending. Cost and style are the user's call.

**Already decided and merely reported to the user:** DECISION 009 crosses the frozen-engine line for
the first time — two additive fields on `SeasonLine`, no balance effect, verified by byte-identical
`npm run play` output across three seeds. Balance changes go to the user; this is plumbing.

## Handoff protocol

Full PM instruction set: `docs/superpowers/polish/PM-PROMPT.md`. Read it, then this file.

Agents write findings to `reports/NNN-slug.md` and return **only** status, ≤5 bullets, and the path.
Never full findings — this is the main lever on PM context size.

After ~3–4 waves, or whenever the session feels long: finish updating this file, then tell the user
to start a fresh PM session with:

> You are the PM for the CFB polish phase. Read `docs/superpowers/polish/PM-PROMPT.md` and begin.

Increment the **PM session** counter at the top when you take over.
