# CFB Polish Phase — Board

**This file is the single source of truth.** It must always be complete enough that a brand-new PM
session can take over from it alone. Update it after every wave.

**Last updated:** 2026-09-13 · **Wave:** 9 in flight (022, 023) · **PM session:** 4

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
- **501 tests passing**, both typecheck passes exit 0, production build clean (~112 kB gz JS).
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

**Branch `polish/ui-phase`.** `main` is untouched, nothing pushed. Baseline is now **501 tests**,
both typecheck passes exit 0, build clean.

Most recent first:

```
6fc2c17 feat(ui): the ending can tell a good career from a bad one
e818846 feat(ui): mount the ledger, and split the two things the OVR block was saying
ba156d2 feat(ui): the view model learns the ledger, honors rarity and a verdict scale
9b3d5d8 docs(polish): the 014 playtest, three calls it forced, and wave 6
ae561cc docs(polish): wave 4 landed, and the question it handed the playtest
d621732 fix(a11y): raise --chalk-faint to clear AA at the new 11px floor
3e5c8ce feat(ui): invert the type register, and clamp what can overflow
cdfd2f2 fix(ui): the rail describes one moment, not two
7feb63a docs(polish): wave 3's calls, wave 4 ready to re-dispatch, and the handoff
```

Agents are told **not to commit and never to `git checkout` / `restore` / `stash`** — the tree
routinely holds uncommitted work from two concurrent agents. **The PM commits**, after verifying:
tests, both typecheck passes, build, `npm run play` byte-identical on two seeds, `src/engine/**` and
`src/content/**` untouched in `git status`, and a hand click-through.

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

## Wave 5 — the 014 playtest. Read this before planning anything

Three careers, ~105 decisions (QB 41 / Kicker 32 / OL 18). Full report:
`reports/014-post-wave4-playtest.md`. **This is the most decision-changing report of the phase.**

### The north star, measured: we are not there

The metric is a cold playtester starting a third career unprompted. Verbatim:

1. *"Yes — I want to play again right now. What's pulling me is the Moments reel at the end... What's
   pulling against it is that I already know six of the cards word-for-word."*
2. *"Reluctantly yes — but the pull has changed. After career 1 I wanted to play; now I want to
   **check** something, which isn't the same thing."*
3. *"**No.** I would stop here. There is nothing left I expect to be surprised by — I know the six
   cards that fire every year, I know the offseason is a menu with one correct answer, and I know
   the ending is a gold headline regardless of what I did. I played the third one because you asked."*

**Read the decay, not just the verdict.** Enjoyment → obligation → refusal, over three careers, with
a named cause at each step. The writing still landed ("the Moments reel... rebuilt my four years
into a story I actually recognised"). What failed is everything around it.

**The three causes are named, and only one of them is a UI problem:**

| Cause | Owner |
|---|---|
| Content repetition — 8 recurring cards, first verbatim repeat at **decision 12** | **User** (B11 item 3, authoring) |
| No reachable failure state; the offseason has one correct answer | **User** (balance, engine) |
| The ending is a gold headline regardless of input | **PM** — wave 6 lane B |

**This is the honest read of the phase: the remaining UI work cannot reach the north star by
itself.** Waves 6+ can make the ending mean something and the screen legible; they cannot make the
twelfth decision surprising. That escalation is in "For the user" below.

### Claim verdicts

| Claim | Verdict |
|---|---|
| 8 — long text / overflow | **CONFIRMED CLEAN.** Zero overflow in 105 cards. Wave 4's clamps hold |
| 3 — OVR delta magnitude | **CONFIRMED for magnitude** (+4 reads louder than +1 — *do not touch it*), **REFUTED for meaning** |
| 4 — the DECISION 012 leak check | **Essentially passes.** Same card gave +2 one season and −5 another: *"a real gamble and it reads as one."* **One exception:** "The Ticket Hookup" → *"Less money, zero risk..."* characterises the branch not taken. A softer case in "Rivalry Week / Sit and get right". Playtester's own warning: **do not over-correct** |
| 5 — career-arc OVR column | **CONFIRMED for long careers** (66→63→71→83 *"reads as an arc"*), **REFUTED for short ones** — 2 seasons is a stub in a five-row frame |
| 6 — a bad ending in dimmed gold | **CANNOT CONFIRM — premise untested.** Played deliberately badly, declared at OVR 65 on a 5-7 record, still drafted **R7 P2**. *"I could not lose."* And #69 vs #194 print **identically** |
| 7 — smaller, heavier type | **CONFIRMED**, one casualty: strip row 3 too small to read |
| 1, 2 | Partial. Claim 2: the strip is *"actively lying"* in places |
| DECISION 022's grey question | **PARTIALLY REFUTED — see DECISION 023** |

### New backlog from the playtest

| ID | Item | Status | Notes |
|---|---|---|---|
| B18 | **No reachable failure state** | **CAUSE FOUND, FIX APPROVED — DECISION 038.** Not "too easy": `UNDRAFTED_FLOOR` is 35 and a career making *no decisions* scores 42.9 once development banks. Full-career tanking already fails 12.7% of the time; the loophole is the two-season declare (0.6% bust, 89.2% drafted). `EARLY_DECLARE_PENALTY = 8` approved by the user; in flight as 022 |
| B19 | ~~The offseason is a menu with one correct answer~~ | **REFUTED by measurement — DECISION 037.** Transferring up *costs* 0.43–0.91 overall and 0.85–2.23 draft stock per move and is the **worst** of the five offseason lines at all six positions. Two playtesters built an inverted model of a mechanic that works. Now a **legibility** item, folded into B23 |
| B20 | **The ending has no range.** #69 and #194 identical; HONORS block and a trophy-led reel on a 7-5/5-7 career | **in flight — wave 6 lane B (016)** |
| B21 | **The standing block reads as one self-contradicting sentence** — *"All-America caliber / just a guy in the building"*. **Not a regression; two axes rendered as one.** See DECISION 024 | **in flight — wave 6 lane A (015)** |
| B22 | **Career length is never stated and the title screen contradicts it.** A fifth season exists, bought by the redshirt, never explained, while the title says "Four years to get drafted" | **partly in flight** — the five-row ledger answers it structurally (wave 6 lane A); the title-screen wording is still open |

Also confirmed independently: **B13** (the redshirt tells you it sat you, then hands you a
game-deciding onside kick in a 9-snap year) and **B11** (repetition is *worse* than measured — 8
recurring cards, first verbatim repeat at decision 12 vs the harness's 13, and its real cost is
**indirect**: by career 3 the playtester skimmed every card body *including brand-new good ones*).

**The most useful single sentence in the report**, for anyone deciding what to build next:
repetition's cost is not boredom with the repeated cards, it is that it **teaches the player to stop
reading**, which then throws away the game's best asset.

## Wave 6 — complete and committed (PM session 3)

Two lanes, hard file split: lane A owns the decision screen, lane B owns the summary. They share no
files. `tokens.css` is off limits to both — the type scale and palette were settled in waves 4 and
the 022/023 pair, and a third agent editing tokens would undo that.

| Brief | What | Owns |
|---|---|---|
| `briefs/015-decision-screen-orientation.md` | (1) **Mount the ledger** — built, tested, unrendered, with an exact wiring diff in report 010; also the structural answer to B22. (2) Split the two axes so the standing block stops reading as a contradiction (DECISION 024). (3) Strip row 3 legibility (DECISION 023) | `CareerScreen.tsx`, `career.css`, and `view-model.ts`/`types.ts` only if the wiring diff needs them |
| `briefs/016-the-ending-has-a-range.md` | B20. A draft position must read differently at a glance, by **scale/weight/motion — never hue** (DECISION 012); stop the furniture congratulating a bad career; make a short career look intentional rather than truncated | `SummaryScreen.tsx`, `summary.css`, summary-facing interfaces in `types.ts`/`view-model.ts` |

### What shipped

```
6fc2c17 feat(ui): the ending can tell a good career from a bad one
e818846 feat(ui): mount the ledger, and split the two things the OVR block was saying
ba156d2 feat(ui): the view model learns the ledger, honors rarity and a verdict scale
```

**Three commits, not two.** Both lanes needed `types.ts` and `view-model.ts` despite the briefs
splitting them by interface — the same collision wave 3 hit. Rather than let one screen's commit
carry the other's data, the shared session layer went in first as its own commit, **verified to
typecheck, test and build on its own** (staged, rest stashed, both `tsc` passes run, 501 tests) and
rendering nothing new. Each of the three commits builds independently. **If a future wave puts two
agents near `types.ts` again, plan for this shape from the start rather than discovering it at
commit time — splitting by interface in the brief was not sufficient two waves running.**

**B21 fixed and visually confirmed by the PM:** the standing block now reads `60 · ON THE FIELD ·
in the rotation`, a rule, then `IN THE LOCKER ROOM · the staff trusts you`. The contradiction the
playtester reported is now structurally impossible. Character moved up a step in size and tone
(B17) and stays words-only.

**B22 answered structurally:** the ledger renders Years 1–4 on solid rules and **Year 5 hanging off
a dashed rule labelled "redshirt year"**, going solid when the redshirt lands. A career's shape and
its conditional fifth year are now stated without a word of explanation.

**016 measured the honors problem far past what the brief assumed** — the block fired on **70.5%**
of all careers, and on 17.8% its entire content was `Bowl Win`. That is DECISION 027. It also found
the trophy glyph is the most common mark in the game and almost never marks a trophy, shipped the
display half (desaturation — emoji were the only uncontrolled colour on a screen whose rule is that
hue never tracks valence), and left the three content strings as a proposal.

### The verification gap a fresh PM must not inherit silently — CLOSED by 017, kept for the lesson

**Desktop geometry at ≥1024px is still unverified on a real wide viewport.** The Chrome extension
pins the viewport at **800 CSS px**, and `resize_window` reports success while `innerWidth` stays
800 — the agent hit this, and **the PM reproduced it independently** before accepting the excuse.
What *is* verified: the agent measured real rects by injecting the media block's body, and the PM
confirmed the predicate is valid and the grid arithmetic closes (`--measure` 480 + 56 gap + 224
ledger = 760 container). What is **not** verified is the media-query predicate actually firing at
≥1024px. **Ask the user for a glance at a real 1456px window, or find a harness that can widen the
viewport.** Do not let a third agent burn a run rediscovering this.


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

## Wave 4 — complete and committed (PM session 3)

**First attempt died to a session limit.** Both agents died **during their reading phase** — one had
just opened the context docs, the other had just started capturing its baseline. **Tree was verified
clean afterwards:** no `src/**` edits, no partial reports, nothing to salvage and nothing to distrust.
This was the second time a session limit took a whole wave (see DECISION 016 for the first).

**Re-dispatched unchanged on 2026-09-13 by PM session 3**, both at once, against a clean tree
(`git status` empty at `7feb63a`) and a dev server already serving 200 on 5173. Neither brief was
edited: they were correct, and the failure was the session, not the work. **Both landed.** The
CSS/TSX ownership split held exactly — `git status` showed lane B's six session/screen files and
lane A's six stylesheets with zero overlap, so unlike wave 3 the lanes committed separately.

### What shipped

```
d621732 fix(a11y): raise --chalk-faint to clear AA at the new 11px floor
3e5c8ce feat(ui): invert the type register, and clamp what can overflow
cdfd2f2 fix(ui): the rail describes one moment, not two
```

**012 (type + clamps).** Six steps in `tokens.css` (11/12/13/15/18/34px, authored in rem) plus a
figure step and a fluid display step; prose 500, 900 reserved for numerals; tabular figures wherever
a number changes in place; no raw `font-size` outside the token block. All 9 overflow-capable nodes
clamped against the *bundle's* worst strings (241-char outcome, 194 description, 107 engine-built
label), not against what happened to be on screen. Audit **Bug 3 decided**: `body{font-size:17px}`
deleted, `html` left unset, so `rem` tracks the reader's root; no existing rem literal changed pixel
value. Two calls outside the brief's letter, both flagged and both accepted: `--measure` 34rem →
30rem, and `.card-title` widened to `wdth 84` because a condensed 18px headline read *smaller* than
13px prose at `wdth 100`.

**013 (rail).** `SeasonStamp` now carries the season line, captured in `play()` before `advance()`;
a new `railView()` assembles every rail cell from one moment — stamp when resolved, live otherwise,
no third case. Stamp stays nullable and normalizes for pre-field saves. Verified on 21 resolved
cards across two careers: zero mismatches against the decision card each answered, and `npm run
play` byte-identical on two seeds.

**The PM's own verification before committing:** 492 tests, both typecheck passes exit 0, build
clean, and a hand click-through of creation → Signing Day → a decision card → a resolved card with a
visible `+3 OVR` → the draft summary. B4 is visibly fixed — options are filled cards with gold edge
bars, no longer grey form fields.

### DECISION 022 — a palette call the PM made on top of the wave

012 flagged, and correctly did **not** fix, that `--chalk-faint` carried thirteen 11px text roles at
3.0–3.8:1, under the AA floor. Colour was not its brief. The PM re-measured, found the report's
proposed `#7e9488` **fails on `--card-raised` (4.42:1)** — a ground it is actually set on at
`career.css:245`/`:392` — and shipped `#849a8d` instead (6.09 / 5.36 / 4.76 across turf / card /
card-raised). Committed separately so it can be reverted alone. **Its cost is real and is now a
playtest question:** the ramp's bottom two greys are ~7 L* apart, and if they no longer read as two
tiers the answer is to collapse the tier, not to darken back below AA. Added to brief 014.

**A code check worth keeping:** DECISION 012's hue rule was verified in source rather than by
hunting for a negative delta in the browser — `magnitude()` uses `Math.abs` and the hue is
`--emphasis` at every tier, so a +8 and a −8 are equally loud and indistinguishable by colour. No
`--good`/`--bad` exists. The *perceptual* half of that question still belongs to the playtest.

### Two things 012 found that need a `.tsx` and therefore a future brief

- **Labelled rail cells.** The `--t-meta` role ("rail labels at 11px/700 uppercase", the `AGE` /
  `VALUE` / `APPS` box-score header the teardown describes) has no markup to live on — our rail is
  four bare values (`CareerScreen.tsx:14-17`). The CSS role is ready if we want the header.
- **A clamped `.option`/`.outcome` has no accessible full text.** Nothing is hidden today, because
  the clamps only fire past what the bundle can produce — but a `title` attribute would need placing
  in the tsx if the `factory`/`developmental` traits are ever assigned.
- Also open: a remaining **1px card shift** that 013 traced to `.standing`'s height (46.9/47.9px),
  not the rail. A `rem` `line-height` there would pin it as it pinned the rail.

| Brief | What | Owns |
|---|---|---|
| `briefs/012-type-scale-and-clamps.md` | DECISION 008's register inversion — six-step scale in tokens, raised floor, `leading-none` on numerals, tabular figures; plus clamps (zero exist, 9 overflow-capable nodes, longest real outcome 241 chars); plus a deliberate call on audit Bug 3 | **all of `src/ui/styles/`**, and forbidden from touching any `.tsx` |
| `briefs/013-rail-one-moment.md` | Freeze the season line into `SeasonStamp` so a resolved card's rail describes one moment. Found by the PM by hand — see the section above | `types.ts`, `view-model.ts`, `reducer.ts`, `CareerScreen.tsx` + tests; **no CSS** |

These two were deliberately shaped to run **concurrently**: 012 owns every stylesheet and no
component, 013 owns components and no stylesheet. That split is the only reason a type pass can run
in parallel with anything, and **it worked** — reuse the shape.

**Wave 5 — `briefs/014-post-wave4-playtest.md` — is dispatched and in flight** (2026-09-13, PM
session 3), against a cleared `localStorage` (the PM's own click-through *and* a dozen `snap:*`
scratch keys lane A left in the shared origin were both cleared first, and the PM's tab closed). It is the north-star check, and it carries two questions that decide standing decisions:
the leak check (DECISION 012's own "would change our mind") and whether a dimmed-gold washout
headline reads as congratulatory (DECISION 021's). Playtesting is **serial** — one browser agent at
a time, they share a `localStorage` origin.

## Wave 7 — the 017 playtest. Complete. Read this before planning anything

`briefs/017-post-wave6-playtest.md` dispatched 2026-09-13, one playtester, **serial** — it owns the
browser and the `localStorage` origin for its duration. Do not dispatch a second browser agent or a
dev agent touching `CareerScreen.tsx` / `SummaryScreen.tsx` until it returns.

It is the north-star re-check after wave 6, and it carries the four questions DECISIONS 023, 026,
027 and 028 each named as their own "would change our mind":

- **026** — can you rank two *drafted* endings at a glance? If not, the lever is the scale spread
  (1.12 → 0.72), **not** a second hue.
- **027** — does `Also earned` read as a consolation prize? If so the fix is the heading's wording,
  not restoring a block that fired on 70% of careers.
- **023** — do the two quietest greys still separate at a normal glance?
- **028** — does `FINAL OVERALL` differing from the last ledger row read as a contradiction?

Plus two the wave-6 build has never had a player on: **what a cold player thinks the dashed fifth
ledger row means**, and whether the ledger gets *used* or becomes wallpaper. And it is told to play
career 3 **deliberately badly**, so B18 gets a second independent read.

**Deliberately not carried:** claim 3 from 014 (OVR delta magnitude) — confirmed, and 014's own
warning was not to over-correct.

**Running alongside it: `briefs/018-failure-and-the-offseason-measured.md`** — stage 1 of DECISION
029. Measurement and a written proposal only; it edits `src/sim/**` and its report and nothing else.
It is parallel-safe with the playtest **by construction**: no browser, no `src/ui/**`, no
`src/content/**`, no dev server. If you dispatch anything else while a playtest is live, it must
clear the same bar — a content or UI edit changes the game under the playtester and destroys their
session.

### What 017 found — the short version

Three careers, 89 decisions (QB 38 / Kicker 33 / OL 18, the last played to lose).
Full report: `reports/017-post-wave6-playtest.md`.

**The curve did not move. It got slightly worse: `yes → no → no`** (014's was `yes → reluctant yes →
no`). And the cause is the same one both times:

> *"I read 'Your ankle has been barking since Tuesday' for the seventh time in season five and I
> stopped being a person reading a story and became a person clearing a queue."*

**Wave 6 is not what is losing us the player, and this is stated plainly in the report:** *"The
ledger and the ending are both better than what they replaced and neither one is the reason I
stopped."* Do not read the flat curve as a verdict on the last two waves.

**Skimming started in career 1 at decision 21, not career 3.** Two seasons earlier than 014. By
career 3 it had generalised to brand-new cards — including the best-written injury card in the game,
which cost 8 OVR and was clicked through unread.

### The wave-6 work, judged

| | Verdict |
|---|---|
| **The ledger** | **CONFIRMED and then some.** Used for three real decisions — twice to return to school after seeing the column fall. *"It did not become wallpaper."* Named as the one thing that made three careers feel like different lives |
| **Orientation** | **"The clearest win of the wave."** `SEASON 3 · JR` plus the highlighted row: never once had to guess the year |
| **The ending's range** | **PARTIAL.** R3 vs R7 rankable at a glance; **R2 vs R3 is not** — and 1–4 is where careers land. DECISION 026's own falsifier |
| **A bad ending** | **REFUTED.** *"The floor is a gold headline, two trophies and a sunshine emoji."* DECISION 021's own falsifier |
| **`Also earned`** | **Never rendered.** The heading is an either/or, so a career with both tiers shows an unlabelled grey chip. 027's falsifier, by way of a half-applied fix |
| **Two OVR numbers** | Noticed on all three screens, **not** read as a mistake — but only because the rail had trained them for four seasons. A player arriving cold *"would call it a bug"* |
| **The standing block** | **CONFIRMED.** B21 stays fixed |
| **Strip rows 2/3** | Still merge. DECISION 023's falsifier, its pre-specified fix now dispatched |

Calls logged in response: **DECISIONS 032–036.**

### The desktop verification gap is CLOSED

**017 played at 1456×757–813 CSS px** and the two-column layout rendered — content column ~480px
centred with the ledger rail to its right. The media query fires. Nobody needs to re-verify this.

**But it opened a new finding in the same breath:** *"roughly the right third and the bottom half of
the window were empty dark green on every screen. Not cramped — the opposite. The page never felt
like it was using the room it had."* That is **B1 returning at wide width**, and this time measured.
(The user separately confirmed the *summary* screen is a single stack at that width, which is by
design — the two-column shell is the decision screen only.)

### New backlog from 017

| ID | Item | Status | Notes |
|---|---|---|---|
| B23 | **Structural choices produce no resolution screen and no delta.** "Stay at Baylor" ran 75 → 82 **in the gap between two clicks.** Transfer, Declare and Stay show nothing; transferring UTSA → Baylor was *"acknowledged by one word changing in the header"* | todo — **high value** | This is B16, now quantified. The machinery exists: *taking* the redshirt does get a resolution and a loud `+10 OVR`. It is wired to one of four |
| B24 | **Position is a costume everywhere except the in-season cards.** All six open at OVR 60, "in the rotation" (not a thing kickers are in), identical offseason block. *"My kicker was voted team captain — in his redshirt year."* About 1 card in 4 is position-specific, and those were the only cards still being read by career 3 | todo | The position cards are praised as the best writing in the game. The finding is that there are too few of them, not that they are wrong |
| B25 | **"Declare for the Draft?" carries zero information and is the most consequential card in the game.** *"A coin flip dressed as a decision."* It is also where the playtester worked out failure was impossible — the game let a 61-OVR FCS lineman declare after two seasons **with no comment** | todo — **tension with DECISION 025** | 025 refused `draftStock` by name. A second playtester has now independently asked for the same thing. The ledger column is a partial answer and was used exactly this way. Needs a call that does not leak the number |
| B26 | **Nothing tells you the end is coming.** Career 1 ended after season 4 with no warning, on a resolution Continue that turned out to be the last click | todo | Distinct from B22: the *shape* is now clear, the *ending* is not |
| B27 | **The Moments reel is a repetition log.** Career 1 printed "Carried the team through bowl season" **three times out of six entries**; career 3's four entries are two lines repeated | todo — content-caused | The reel is *"the single best thing on the end screen"* and *"the part a player would screenshot."* The grouping (B6/011) is right; the strings repeat |
| B28 | **`FG -1` — negative field goals**, printed in the rail and permanently on the summary. Caused by taking the redshirt | todo — **engine bug**, needs a proposal | Folded into 020's report as a diagnosis-only task |
| B29 | **Wide-viewport emptiness.** Right third and bottom half empty at 1456px | todo | B1 at a measured width |

**The single change the playtester would make, in their words:** *"The three cards after a transfer
or a redshirt should be about the transfer or the redshirt. Right now the two biggest things that
can happen to a career are delivered as a one-word header change followed by reruns, and they're
also the two places where the game has already earned a beat."* That is B23 and B11 pointing at the
same spot.

## Wave 8 — complete and committed (PM session 4)

Two lanes, and this time **the session layer is split by FILE, not by interface.** Splitting by
interface collided at `types.ts` in two consecutive waves; this is the fix the board asked for.

| Brief | What | Owns |
|---|---|---|
| `briefs/019-the-ending-tells-the-truth.md` | DECISION 032 — widen the verdict scale where careers actually land, and **invert the hierarchy on a declining career** so the arc stops being the quietest true thing on the page. Plus 034 (`Also earned`) and 035 (label the two OVR numbers) | `SummaryScreen.tsx`, `summary.css`, `types.ts`, `view-model.ts`, `bands.ts` |
| `briefs/020-the-ledger-keeps-its-promise.md` | DECISION 033 — the dashed row stops asserting a fact the UI cannot check, and the season-5 header/rail desync (the only place the player was lost). Plus the duplicate `SR`, 023's strip fix, `1 Game-Winners`, and a `SeasonLine` redshirt-flag proposal | `CareerScreen.tsx`, `career.css`, `ledger.ts`, `labels.ts` |

`briefs/018` (balance measurement) is **still in flight** and owns `src/sim/**` — disjoint from both.

### What shipped

```
86c5a47 fix(ui): the summary's season table carries the same two bugs, now fixed
578dbdc feat(ui): a career that went down says so at the size it deserves
31e75fd fix(ui): the ledger stops promising what it cannot check, and a row is always current
```

**The file split by lane worked.** Three commits, zero collisions, and each lane's files were
verified green in isolation (020's were committed with 019's stashed, both typecheck passes run).
Do this again. **Splitting by interface failed twice; splitting by file has now worked once.**

**Both agents reported a 545-test suite and each attributed the new tests to the other.** Neither
was wrong and there is no discrepancy: wave 8 added **18** tests (12 in `ledger.test.ts`, 6 in
`labels.test.ts`), and the other ~26 were `src/sim` tests written by the *018* agent, which was
still in flight in the same worktree. **Lesson for a fresh PM: with three agents in one tree, the
suite total is not a per-lane signal.** Count the diff.

**Three findings from the lanes that outrank their own briefs:**

- **The season-5 desync was global.** The current-row test required a stored season line, which does
  not exist during *any* offseason — so no ledger row was current for a whole phase, in every season
  of every career. Season 5 was merely where it became visible. An existing test was pinning the bug
  and is now inverted.
- **My brief for 019 was wrong about where careers land.** I wrote "rounds 1–4"; measured, **rounds
  4–7 are 78% of outcomes and R6 is modal.** 019 corrected it and re-cut the scale accordingly —
  eight steps, one per round, because R2 and R3 had been the *same tier*. A brief's premises are
  checkable and this one should have been checked.
- **`FG -1` is `effects.ts` applying an authored negative `stat` effect with no floor**, not stat
  generation. Six careers in 1,500, all six redshirted.

## Wave 9 — in flight (PM session 4)

| Brief | What | Owns |
|---|---|---|
| `briefs/022-engine-stage-two.md` | The three approved engine changes — `EARLY_DECLARE_PENALTY = 8` in `computeDraftResult` only, the `SeasonLine` redshirt flag, the `FG -1` floor. DECISIONS 038 and 039 | `src/engine/**`, `src/sim/**` |
| `briefs/023-the-biggest-choices-get-a-moment.md` | B23 — hub decisions resolve invisibly; "Stay at Baylor" ran 75 → 82 between two clicks. Plus B25 (the declare card states that eligibility remains, no projection) and B26 (drop it if the data cannot support it) | `reducer.ts`, `types.ts`, `view-model.ts`, `CareerScreen.tsx`, `career.css` |

**Why these two can run together and the content pilot still cannot.** 022's whole acceptance test
is bit-identity against 018's measured tables. Content changes move event selection, which moves
those numbers, which makes the leak check unverifiable. **The content pilot goes in wave 10, after
022's bit-identity is banked** — not because of a file conflict but because of a measurement one.
That distinction is worth keeping: file-disjointness is not the only kind.

### Queued, deliberately not dispatched

**The content pilot (DECISIONS 030 + 036)** is written up but held **behind 018**. It edits
`src/content/**`, and 018 is measuring balance *against that content* — adding event variants
mid-run would invalidate its numbers. Dispatch it the moment 018 reports.

## The user's answers — all four standing escalations are now closed

Asked and answered 2026-09-13 by PM session 4. **The "For the user" section below is kept for its
reasoning but is no longer an open ask.** Logged as DECISIONS 029, 030 and 031.

| Ask | Answer | Now |
|---|---|---|
| **B18/B19** — unfreeze the engine for balance? | **Yes, proposal-first.** Measure and propose numbers; user approves before any engine edit | **DECISION 029.** Stage 1 dispatched as 018. Stage 2 needs a user approval round |
| **B11 item 3** — author content variants? | **Yes — pilot `milestone-opener` only, agent-written** | **DECISION 030.** Queued, not dispatched: it edits `src/content/**`, which would change the game under the live playtester. Dispatch when 017 returns |
| **B10** — imagery scope? | **Per-category, ~12–20 reusable flat vector pieces** | **DECISION 031.** Shape settled so nobody reopens it; *when* is still open and it blocks nothing |
| **Desktop ≥1024px** — the unverified media query | **CLOSED by 017**, which played at 1456px | The two-column shell renders. The gap is struck. It left a new finding in its place — B29 |

**Two notes a fresh PM should not have to rediscover:**

- DECISION 030 was offered to the user as "you write it" and they chose agent-written. The voice
  constraint therefore moves onto the PM: **read every line of pilot prose before it is committed.**
  The 014 playtester praised the writing by name, and diluting it is the one outcome that would make
  this pilot a net loss.
- DECISION 029 stage 2 is **not** automatically approved by 029. The user approves *the numbers*.
  Do not let a stage-1 agent roll on into implementing its own proposal.


## Next actions

1. ~~**Re-dispatch wave 4**~~ — **done and committed** as three commits. See the wave 4 section.
2. ~~**Then wave 5: `briefs/014`, the playtest.**~~ **Dispatched, in flight.** Then decide what is left from what it says, not from
   this table.
3. ~~**The ledger component is now the top unstarted item**~~ — **dispatched as wave 6 lane A.**
   Detail kept below because a fresh PM may need it if the lane fails.
   `src/ui/session/ledger.ts` is built, tested (6,418 snapshots over 240 careers, zero invariant
   violations) and committed; `reports/010-ledger-logic.md` ends with the **exact two-file wiring
   diff**. It needs `CareerScreen.tsx` and `career.css` — which is why it could join neither wave 3
   nor wave 4 — and both are now free. Rows are `Year 1`–`Year 5` per DECISION 020; read 020 before
   starting, and do **not** re-derive the snaps inference — 020 withdrew 015's "would change our
   mind" clause precisely to stop a future agent re-measuring a clean number that answers the wrong
   question.
   **Sequencing note:** it wants the same two files the playtest is currently forming opinions
   about. Wait for 014 rather than racing it — the ledger is the single largest remaining layout
   change, and the playtest's read of the decision screen is worth more taken before it lands.
4. **The type scale and clamps are DONE** (wave 4, commits `3e5c8ce` and `d621732`) — they are
   struck from this list rather than left to be redone. What the type pass *opened* is smaller and
   listed in the wave 4 section: labelled rail cells (needs markup), a `title` on clamped options,
   and a 1px `.standing` height shift.
5. ~~**When wave 6 returns**~~ — verified and committed as three commits; see the wave 6 section.
6. ~~**Next: a playtest.**~~ **Dispatched as wave 7 — `briefs/017-post-wave6-playtest.md`.** Original note kept below.
   This is now the top action, and this time the question is narrower than 014's: did the ending
   gaining a range, and the ledger appearing, change the *third*-career answer? Use
   `briefs/014-post-wave4-playtest.md` as the shape — it is the best brief written in this phase and
   it got refutations, not validation. Playtesting is **serial**.
   **Four questions the next playtest must carry**, each settling a standing decision:
   (a) DECISION 026 — can you rank two *drafted* endings at a glance now? If not, the lever is the
   scale spread (1.12 → 0.72), **not** a second hue.
   (b) DECISION 027 — does the `Also earned` row read as a consolation prize? If so the fix is the
   heading's wording, not restoring a block that fired 70% of the time.
   (c) DECISION 023 — do strip rows 2 and 3 still merge now that row 3 is legible? Rows differ by
   only 1px today; the pre-specified fix is demoting row 2, **not** a fourth grey.
   (d) DECISION 028 — does `FINAL OVERALL` differing from the last season's stored OVR (80 vs 78 on
   the `m0` fixture) read as a contradiction? Both labels are accurate; closing it properly is an
   engine change, so it is worth knowing whether it actually confuses anyone.
7. **Do not plan past that without the user's answers on B18/B19/B11.** The 014 report is explicit
   that the remaining north-star gap is content and balance, not interface. A fresh PM who queues
   four more UI waves against it will be polishing a game the playtester has already stopped
   reading.
8. Increment the **PM session** counter at the top of this file when you take over.

## For the user — ANSWERED 2026-09-13, kept for the reasoning

**These are no longer open asks.** See "The user's answers" above and DECISIONS 029/030/031. The
sections below record *why* each was escalated; do not re-ask them.

**Three of these are new and they are the reason the north star is not reachable by UI work alone.**

### 1. B18 + B19 — balance, and the reason career 3 was a "no"

The 014 playtester played career 3 **deliberately badly** — skipped the install, ghosted the media
twice, let a relative handle the money, played hurt — declared after two seasons at **OVR 65 with a
5-7 record**, and was still drafted in **Round 7, Pick 2**. Their words: *"I could not lose."* They
had also worked out that transferring up every offseason is free OVR, so *"the offseason stopped
being a decision."*

These are engine and balance questions, not polish, so they are raised rather than assumed. Wave 6
can make a Round 7 pick *look* like a Round 7 pick; it cannot make it a loss. **Without a reachable
downside the decisions are not gambles, and no amount of visual range will make them feel like
gambles.**

### 2. B11 item 3 — authoring new content (unchanged ask, now with a sharper cost)

Writing per-season variants of the five (the playtester counted eight) milestone events. The pilot
plan stands: do `milestone-opener` alone (62% of first repeats), re-run the 008 harness, and confirm
the first-repeat decision number actually moves before writing the rest.

**What is new is the measured cost of not doing it.** Repetition's damage is not that the repeated
cards are dull — it is that by career 3 the playtester was skimming *every* card body, including
brand-new ones they had never seen. Repetition is training players out of reading the prose, and the
prose is this game's best asset.

### 3. B10 — imagery (unchanged)



The reference gives every option a picture at ~50% of the option card. We have no art. ~102 events /
330 outcomes, so per-outcome art does not scale. Per-*category* — practice, game day, injury,
off-field, academics — is ~12–20 reusable flat vector pieces in the turf/chalk palette, and is the
only shape worth recommending. Cost and style are the user's call.

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
