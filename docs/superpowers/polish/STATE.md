# CFB Polish Phase — Board

**This file is the single source of truth.** It must always be complete enough that a brand-new PM
session can take over from it alone. Update it after every wave.

**Last updated:** 2026-09-13 · **Wave:** 3 complete, 4 written and ready to re-dispatch · **PM session:** 2 (handing off)

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
| B2 | **No orientation in time** | **data done, drawing pending** | `CareerView` now carries the live stat line, snaps, `phaseLabel`, `seasonNumber`, and a record that is `null` until real. **Nothing renders any of it yet** — wave 3 item 1 |
| B3 | Flat hierarchy inside the card | **PARTIAL / mostly REFUTED** | Flatness is *between* cards, not inside them. Do not brief this as stated |
| B4 | Option buttons read as form fields | **CONFIRMED** | Gold sits on Continue (a no-op) while real choices are grey outlines |
| B5 | Summary is a uniform grey scroll | **PARTIAL** | The seasons block is *the best screen in the game*. Do not rewrite it — it is the model for the rest |
| B6 | Moment icons are emoji | **REFUTED as stated — done** | 700 careers: 980 repeated moment strings, **100% cross-season, 0 same-season, 0 pushed twice by one `advance()`**. There was no duplicate bug. Three rivalry wins in three years *is* the career; the timeline was throwing away the `seasonIndex` that would have said so. 011 groups by season instead. Emoji untouched and still low priority |
| B7 | No rhythm across a career | **CONFIRMED — strongest finding** | And the cause is *content repetition*, not styling: identical Season Opener / Rivalry Week / Bowl text every season. See B11 |
| B8 | One accent colour does every job | **structurally fixed** | Eight jobs → eight role tokens, all still resolving to the same value. The *visual* consequence — making a −8 look different from a shrug — is B14, wave 3 item 2 |
| B9 | Five parked *feel* items in `docs/superpowers/STAGE4-HANDOFF.md` — uneven injury exposure, character drift, decorative stats, +2 | todo | Deferred until a UI existed to judge them in. It exists now |
| B10 | **Imagery** — reference gives every option a picture (50% of the option card). We have no art. Sourcing/scope is a **user decision**, not a PM call | blocked-on-user | ~102 events / 330 outcomes. Per-outcome art does not scale; per-event ≈102; per-*category* ≈12–20 and reusable. See `reports/002-reference-teardown.md` §6 |

**B1–B8 are now verified** by the 003 playtest (3 careers, ~78 decisions) and the 004 audit. Verdicts
are in the table. Two were wrong as stated (B3, B5) and would have wasted a wave.

**New items the playtest found, which outrank most of B1–B8:**

| ID | Item | Status | Notes |
|---|---|---|---|
| B11 | **Seasons are near-literal reruns** | **MEASURED — see DECISION 017** | 864 careers: five `milestone-*` events are **40%** of a career and fire in **100%** of them; first verbatim repeat at **decision 13** in **99.3%** of careers. But 98 of 102 events fire — **not a content-volume problem.** Items 1–2 of 017 are UI-side and go in wave 3; item 3 is a content pilot on one event |
| B12 | **Season-specific events fire in nonsense years** | **HALF-CONFIRMED** | All-star/combine invite lands in FR/SO for ~**25%** of QB/OL/DL/DSKILL careers — real. The Redshirt-to-a-star half is **REFUTED**: median OVR at the offer is 65, only 3.4% ≥75. Real oddities instead: a true freshman is *never* offered it, and **48.8%** of careers are asked twice |
| B13 | **Redshirt fiction and mechanics disagree** | **NOT A BUG — a wording fix** | `sitSnapModifier` is 0.05, so **100%** of redshirt seasons credit snaps (median 26; the playtester's 9 was the p10). That is the four-game redshirt rule being modelled. **The fault is the telling:** the UI says you sat out, then credits snaps. Content/UI wording, not engine |
| B14 | **Flat dynamic range** — a −8 OVR injury + demotion renders identically to a speeding-ticket joke; promotions happen silently in grey | todo | Fix is DECISION 012: magnitude may drive scale/weight/motion, valence may never drive hue. Needs 005's tokens first |
| B15 | **Single-option cards have hidden effects** | **cause found — in flight (009)** | Not styling and not content: `reducer.ts:88` sets `skipOutcome = outcome === null \|\| decision.options.length === 1` and **discards the authored outcome prose on every one-option card**. The tap was already saved; it was bought with the writing DECISION 001 existed to make reachable. See DECISION 018 |
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

## Git state — read first

**Branch `polish/ui-phase`.** `main` is untouched. Four commits, nothing pushed:

```
64bdd98 refactor(ui): split app.css six ways, then give every accent job its own token
77e8b9c feat(engine): SeasonLine records the overall and class year it was played at
3f311b7 feat(ui): surface the season state the player is actually owed
7d13847 docs(polish): the reasoning behind the polish phase
```

**Baseline is now 444 tests** (was 430), both typecheck passes exit 0, build clean.

Agents are told **not to commit and never to `git checkout`/`restore`/`stash`** — the tree routinely
holds uncommitted work from two or three concurrent agents. The PM commits, after verifying.

## Wave 2 — complete

| Brief | Outcome |
|---|---|
| 005 tokens + split | Done. `app.css` → six files, cascade order proved by diff (379 identical lines, 75 selectors in order). Eight `--bulb` jobs → eight role tokens, all resolving to original values. No hex outside `tokens.css`. Font axis reaches a real 900 master. |
| 006 engine fields | Done. `SeasonLine` carries `overall` + `classYear`. Byte-identical `play` output on three seeds, and the whole final `GameState` incl. `rngCursor` diffs to the two new fields only. |
| 007 honest season state | Done. `CareerView` gains `season`, `phaseLabel`, `seasonNumber`; the record is `null` until it exists. |

**Three things wave 2 found that the briefs did not anticipate:**

1. **A fourth write site.** `newSeasonLine` in `recruiting.ts` creates season 0 at Signing Day; brief
   006 named only the two `advance.ts` sites. Missing it would have shipped a blank first ledger row.
2. **71% of resolved cards showed the wrong phase.** `App.tsx` builds the view from post-`advance`
   state while `resolved` holds pre-`advance` prose — 270 of 378 cards, 36 of 36 careers. This is what
   the playtester felt as "the class badge flips mid-card." **The data half shipped** (`Resolved.stamp`,
   taken before `advance()`); the two-line `CareerScreen.tsx` fix is written up in report 007 and is
   the first item of wave 3.
3. **Removing the fake `0-0` makes the rail reflow worse, not better.** The playtester's "the header
   changes shape between cards" needs a fixed slot, not a vanishing node. Report 007 flagged it for
   the screen lane.

## Wave 3 — complete and committed (PM session 2)

Three lanes, non-overlapping file ownership. No playtest this wave: the code is churning, and the
re-playtest lands after wave 3 is committed.

| Brief | What | Owns |
|---|---|---|
| ~~`briefs/009-orientation-and-consequence.md`~~ | The decision card: draw the season state + fix the 71% phase bug, one-option cards keep their prose (DEC 018), OVR delta (DEC 012), option rendering (B4) | `CareerScreen.tsx`, `career.css`, `reducer.ts` + test, `types.ts` (`Resolved`/`SeasonStamp`/`CareerView` only), `App.tsx` |
| ~~`briefs/010-ledger-logic.md`~~ | **DONE.** DECISION 015 settled → **DECISION 020**: rows are `Year 1`–`Year 5`. `session/ledger.ts` + `ledger.test.ts` shipped (new files only), validated over 6,418 ledger snapshots from 240 careers: zero invariant violations, zero `NaN`. Report ends with the exact two-file wiring diff for wave 4 | **new files only**: `session/ledger.ts`, `ledger.test.ts`. Edited no existing source |
| ~~`briefs/011-summary-payoff.md`~~ | **DONE.** Career-arc OVR column shipped (62 → 67 → 72 → 68) with magnitude-scaled deltas and no hue split; **B6 refuted** (see below); verdict/honors/share presentation raised. 488 tests, typecheck both passes, build clean, checked at 1456px and 360px | `SummaryScreen.tsx`, `summary.css`, `view-model.ts` + test, `types.ts` (`SeasonView`/`MomentView` only) |

**Committed as three commits** (`ledger` / `decision card` / `summary`), each verified by the PM
before it went in: 488 tests green, both typecheck passes exit 0, build clean, `src/engine/**` and
`src/content/**` untouched in `git status`, `tokens.css` untouched, and a hand click-through of
creation → Signing Day → a hub card → a one-option beat → a delta card. `types.ts` could not be
split across two commits, so it rides with the decision-card commit; reverting that one alone would
strand the summary's `SeasonView` fields.

**The one shared file is `types.ts`,** split by interface between 009 and 011; both briefs state the
boundary explicitly. If a future wave needs two agents in one file again, split it by interface in
the brief or sequence them — do not hope.

**What 010 found that nobody expected.** The snaps inference DECISION 015 hoped for *measures clean*
(redshirt rows median 26 snaps vs 461; threshold T=52 gives 0 false negatives over 5,390 rows) **and
is still useless**, because it identifies a row that is not the ambiguous one — the stored duplicate
`classYear` lands at career's end while the redshirt sits at season index 1 in 955 of 1,051 careers.
DECISION 020 withdraws 015's "would change our mind" clause for exactly this reason: left standing,
it would send a future agent to re-derive a 99.4% accuracy figure and re-propose a label that fixes
nothing. **A measurement can be clean and still answer the wrong question.**

**Wave 3 items deliberately deferred to wave 4:** the type scale (DECISION 008 — owns *all* CSS, must
run alone) and clamps (audit G3). They are sequenced after 009/011 so the register inversion passes
over finished surfaces once, instead of re-tuning CSS written against the old register. The ledger
*component* is also wave 4: 010 ships its logic and an exact wiring diff, and mounting it collides
with 009's `CareerScreen.tsx`.

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

## Wave 3 — ready to write, nothing blocking it

`app.css` is split, so **two CSS lanes can now run in parallel** (`career.css` and `summary.css` are
separate files). The token set exists, so visual work no longer has to invent one. Dispatch order:

1. **Draw what 007 exposed, and fix the 71% phase bug.** The live stat line, snaps and phase label are
   already on `CareerView` and nothing renders them. Report 007 gives the exact two-line
   `CareerScreen.tsx` change for the stamp. Also give the rail a **fixed slot** so it stops reflowing.
   *Owns:* `CareerScreen.tsx`, `career.css`.
2. **Give consequence a voice** (B14/B15). A −8 OVR injury must not render like a speeding-ticket
   joke. **DECISION 012 is the whole spec:** magnitude may drive scale, weight and motion; hue may
   never track valence. Show the OVR delta on the resolved card — it is the one screen whose job is
   "here is what happened" and it does not say what happened. `--emphasis` and the duration tokens are
   the documented attachment points. *Owns:* `CareerScreen.tsx`, `career.css` — **collides with 1, so
   sequence them or give both to one agent.**
3. **The five-row ledger** (DECISIONS 007/010/013/015). Read 015 before starting: `RS` is **not
   derivable**, and shipping two identically-labelled `SR` rows is forbidden. Option 2 (label by
   sequence, class year secondary) is the safe default. *Owns:* `view-model.ts`, `types.ts`, a new
   component, `career.css`.
4. **Type scale** (DECISION 008 + audit G4). Six steps, raised floor, `leading-none` on numbers,
   tabular-nums everywhere. Decide audit Bug 3 (`body{font-size:17px}` at `base.css:11` does not scale
   rem declarations) rather than inherit it. *Owns:* all CSS — **run alone.**
5. **Clamps** (audit G3). Zero exist; 9 overflow-capable nodes; longest real outcome is 241 chars.
   Hard prerequisite for any height-locked shell. *Owns:* CSS.
6. **Option rendering** (B4/G6). Gold currently sits on Continue — a no-op — while real choices are
   grey outlines. *Owns:* `CareerScreen.tsx`, `career.css`.

**Then re-playtest.** The north star is a playtester playing three careers in a row unprompted. The
003 playtester stopped reading at decision ~16 and *still* wanted a fourth career — the writing is
carrying this game, and the job is to stop the interface and the repetition getting in its way.

Use `briefs/003-baseline-playtest-v2.md` as the shape; it is the one that worked. Playtesting is
**serial** — two browser agents share one `localStorage` origin and would clobber each other.

## Found by the PM's own click-through, not by any agent — wave 4 item

**The rail's numbers still jump even though the rail no longer moves.** On a resolved card that
crossed a phase boundary, the identity half is frozen (stamp) and the season-line half is live, so
the strip reads `Offseason · 153 snaps · 292 Pass Yds` — an offseason that has somehow played a
season. On the decision card one tick earlier it correctly read `0 snaps`.

This is the 71% phase bug in its second form: DECISION 019 froze identity and deliberately left the
season line live, and at a boundary the two halves disagree. The fix is small and the reasoning is
already settled — the OVR delta lives in the `.standing` block, **not** in the rail, so freezing the
rail's snaps and stat line into the stamp costs the delta nothing and makes the whole strip describe
one moment. `SeasonStamp`'s comment excludes *progression* values for the delta's sake; snaps and
stats are not progression and were never the reason.

## Wave 4 — written, dispatched, killed by a session limit. Re-dispatch as-is.

Both agents died **during their reading phase** — one had just opened the context docs, the other
had just started capturing its baseline. **Tree verified clean afterwards:** no `src/**` edits, no
partial reports, nothing to salvage and nothing to distrust. This is the second time a session limit
has taken a whole wave (see DECISION 016 for the first). The briefs are intact and correct.

| Brief | What | Owns |
|---|---|---|
| `briefs/012-type-scale-and-clamps.md` | DECISION 008's register inversion — six-step scale in tokens, raised floor, `leading-none` on numerals, tabular figures; plus clamps (zero exist, 9 overflow-capable nodes, longest real outcome 241 chars); plus a deliberate call on audit Bug 3 | **all of `src/ui/styles/`**, and forbidden from touching any `.tsx` |
| `briefs/013-rail-one-moment.md` | Freeze the season line into `SeasonStamp` so a resolved card's rail describes one moment. Found by the PM by hand — see the section above | `types.ts`, `view-model.ts`, `reducer.ts`, `CareerScreen.tsx` + tests; **no CSS** |

These two are deliberately shaped to run **concurrently**: 012 owns every stylesheet and no
component, 013 owns components and no stylesheet. That split is the only reason a type pass can run
in parallel with anything. Keep it if you re-dispatch.

**Wave 5 is also already written:** `briefs/014-post-wave4-playtest.md`. Dispatch it once wave 4 is
committed. It is the north-star check, and it carries two questions that decide standing decisions:
the leak check (DECISION 012's own "would change our mind") and whether a dimmed-gold washout
headline reads as congratulatory (DECISION 021's). Playtesting is **serial** — one browser agent at
a time, they share a `localStorage` origin.

## Next actions

1. **Re-dispatch wave 4** — `briefs/012` and `briefs/013`, unchanged, both at once. Nothing blocks
   them and the tree is clean.
2. **Then wave 5: `briefs/014`, the playtest.** Then decide what is left from what it says, not from
   this table.
3. **Still queued behind wave 4:** the ledger component. `src/ui/session/ledger.ts` is built, tested
   and committed; `reports/010-ledger-logic.md` ends with the exact two-file wiring diff. It needs
   `CareerScreen.tsx` and `career.css`, so it collides with **both** wave-4 lanes — it cannot join
   them. Remaining after that: (a) the ledger component + the wiring diff 010 specifies — it collides with
   009's `CareerScreen.tsx`, which is why it was not in wave 3; (b) **the type scale, alone**
   (DECISION 008 + audit G4; owns all CSS; decide audit Bug 3 — `body{font-size:17px}` at
   `base.css:11` does not scale rem declarations — rather than inherit it); (c) clamps (audit G3;
   zero exist, 9 overflow-capable nodes, longest real outcome 241 chars; a hard prerequisite for any
   height-locked shell).
4. **Then re-playtest**, using `briefs/003-baseline-playtest-v2.md` as the shape — it is the one that
   worked. Playtesting is **serial**: two browser agents share one `localStorage` origin. The brief
   must ask the playtester to confirm *or refute*, and must ask directly whether they wanted a
   fourth career, because that is the north star and nothing else measures it.
5. Increment the **PM session** counter at the top of this file when you take over.

## For the user — one open scope call

**B10 — imagery.** The reference gives every option a picture at ~50% of the option card. We have no
art. ~102 events / 330 outcomes, so per-outcome art does not scale. Per-*category* — practice, game
day, injury, off-field, academics — is ~12–20 reusable flat vector pieces in the turf/chalk palette,
and is the only shape worth recommending. Cost and style are the user's call.

**B11 item 3 — authoring new content.** DECISION 017 items 1, 2 and 4 are PM calls and are in wave 3.
Item 3 — writing per-season variants of the five milestone events — is **authoring new game content**,
which is a different kind of decision from polish, so it is raised rather than assumed. The plan if it
goes ahead: pilot `milestone-opener` alone (62% of first repeats), then re-run the 008 harness and
confirm the first-repeat decision number actually moves before writing the other four.

## What a fresh PM should know that is not obvious from the files

- **Two of the eight original claims were wrong.** B3 was mostly refuted and B5 was inverted — the
  summary's seasons block is the best screen in the game. Verify before building; it saved a wave.
- **The writing is the asset.** The playtester read every card with pleasure and wanted a fourth
  career after quitting the third. Nothing in this phase should make the prose smaller or slower to
  reach.
- **Agents die.** One hung on `npm run dev` in the foreground; three were killed by a session limit
  mid-flight. One of those had written correct work and left no evidence — see DECISION 016. Verify a
  dead agent's output before discarding *or* trusting it.
- **The measurement habit is the house style.** DECISION 003 reversed a design call on 300 careers of
  data; 014 overturned the playtest's own top finding by source-checking it; 006 proved an engine
  change additive on three seeds. When a call is contested, get a number.

## Handoff protocol

Full PM instruction set: `docs/superpowers/polish/PM-PROMPT.md`. Read it, then this file.

Agents write findings to `reports/NNN-slug.md` and return **only** status, ≤5 bullets, and the path.
Never full findings — this is the main lever on PM context size.

After ~3–4 waves, or whenever the session feels long: finish updating this file, then tell the user
to start a fresh PM session with:

> You are the PM for the CFB polish phase. Read `docs/superpowers/polish/PM-PROMPT.md` and begin.

Increment the **PM session** counter at the top when you take over.
