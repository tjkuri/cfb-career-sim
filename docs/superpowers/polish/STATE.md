# CFB Polish Phase — Board

**This file is the single source of truth.** It must always be complete enough that a brand-new PM
session can take over from it alone. Update it after every wave.

**Last updated:** 2026-09-24 · **Waves 12–16:** complete and committed · **Wave 17:** complete · **Wave 18:** complete and committed · **Waves 19 and 20:** complete and committed · **Waves 21 and 22:** complete and committed · **Waves 23 and 24:** complete and committed · **Wave 25:** complete and committed · **Wave 26:** complete and committed · **Wave 27:** complete and committed · **Wave 28:** complete · **Wave 29:** complete and committed · **Wave 30:** in flight · **PM session:** 13

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
- **671 tests passing** (as of wave 18), both typecheck passes exit 0, production build clean.
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
| B23 | ~~Structural choices produce no resolution screen and no delta~~ **DONE** (wave 9, `f6df3d1`). "Stay at Baylor" ran 75 → 82 **in the gap between two clicks.** Transfer, Declare and Stay show nothing; transferring UTSA → Baylor was *"acknowledged by one word changing in the header"* | todo — **high value** | This is B16, now quantified. The machinery exists: *taking* the redshirt does get a resolution and a loud `+10 OVR`. It is wired to one of four |
| B24 | **Position is a costume everywhere except the in-season cards.** All six open at OVR 60, "in the rotation" (not a thing kickers are in), identical offseason block. *"My kicker was voted team captain — in his redshirt year."* About 1 card in 4 is position-specific, and those were the only cards still being read by career 3 | todo | The position cards are praised as the best writing in the game. The finding is that there are too few of them, not that they are wrong |
| B25 | **PARTLY DONE** (wave 9). The card now states that eligibility remains; DECISION 025 untouched. **"Declare for the Draft?" carries zero information and is the most consequential card in the game.** *"A coin flip dressed as a decision."* It is also where the playtester worked out failure was impossible — the game let a 61-OVR FCS lineman declare after two seasons **with no comment** | todo — **tension with DECISION 025** | 025 refused `draftStock` by name. A second playtester has now independently asked for the same thing. The ledger column is a partial answer and was used exactly this way. Needs a call that does not leak the number |
| B26 | **DROPPED with evidence** (wave 9) — 100% of eligibility-exhaustion careers already see `One season of eligibility remains`. ~~Nothing tells you the end is coming.~~ Career 1 ended after season 4 with no warning, on a resolution Continue that turned out to be the last click | todo | Distinct from B22: the *shape* is now clear, the *ending* is not |
| B27 | **The Moments reel is a repetition log.** Career 1 printed "Carried the team through bowl season" **three times out of six entries**; career 3's four entries are two lines repeated | todo — content-caused | The reel is *"the single best thing on the end screen"* and *"the part a player would screenshot."* The grouping (B6/011) is right; the strings repeat |
| B28 | **DONE** (wave 9, `60126d9`), and `snaps` with it. ~~`FG -1` — negative field goals~~, printed in the rail and permanently on the summary. Caused by taking the redshirt | todo — **engine bug**, needs a proposal | Folded into 020's report as a diagnosis-only task |
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

## Wave 9 — complete and committed (PM session 4)

| Brief | What | Owns |
|---|---|---|
| `briefs/022-engine-stage-two.md` | The three approved engine changes — `EARLY_DECLARE_PENALTY = 8` in `computeDraftResult` only, the `SeasonLine` redshirt flag, the `FG -1` floor. DECISIONS 038 and 039 | `src/engine/**`, `src/sim/**` |
| `briefs/023-the-biggest-choices-get-a-moment.md` | B23 — hub decisions resolve invisibly; "Stay at Baylor" ran 75 → 82 between two clicks. Plus B25 (the declare card states that eligibility remains, no projection) and B26 (drop it if the data cannot support it) | `reducer.ts`, `types.ts`, `view-model.ts`, `CareerScreen.tsx`, `career.css` |

**Why these two can run together and the content pilot still cannot.** 022's whole acceptance test
is bit-identity against 018's measured tables. Content changes move event selection, which moves
those numbers, which makes the leak check unverifiable. **The content pilot goes in wave 10, after
022's bit-identity is banked** — not because of a file conflict but because of a measurement one.
That distinction is worth keeping: file-disjointness is not the only kind.

### What shipped

```
f6df3d1 feat(ui): the biggest choices in the game stop happening between two clicks
60126d9 feat(engine): declaring early costs you, and two impossible values stop being stored
4be7ced test(sim): the failure probe, and a policy that plays badly on purpose
```

**578 tests green, both typecheck passes exit 0, build clean.** The engine freeze is back on: 029's
lift was for B18/B19, 039's and 040's for three named defects, and all of it is spent.

**The acceptance test held.** All nine full-eligibility profiles identical on every field; round-1
rates unmoved for everyone; the five predicted movers on their predicted figures. `lazyEarly` — the
014 playtester's career — goes **89.2% → 56.3% drafted**, mean stock 42.926 → exactly 34.926. Two
standing guard tests now fail if the penalty ever migrates into `deriveDraftStock`.

**Three things the agents found that their briefs and my decisions had wrong:**

- **DECISION 039's proposal named one `SeasonLine` write site and there are two.** `recruiting.ts`
  creates the freshman line at Signing Day and `autoProgress` skips season 0, so the approved
  proposal as written would have left **12,000 of 12,000 careers with an undefined freshman row.**
- **DECISION 040's magnitude clause was wrong** — see DECISION **041**. ≤1 stock point predicted,
  ≤2 measured, because `snaps` also feed `developmentDelta`, whose floor division goes negative. All
  movement upward; the bug was docking players twice for having redshirted.
- **B26 did not need building.** 100% of careers that end on exhausted eligibility already pass a
  card reading `One season of eligibility remains`. 023 dropped the task with evidence rather than
  inventing a signal — the DECISION 033 mistake, correctly not repeated.

**Three of the four hubs were proved to deserve silence** rather than assumed to: Signing Day moves
`overall` 0/3,000, "return to school" 0/4,903, and declaring is terminal. Transfer is the only hub
that carries anything (50% of transfer hubs, ~1.1 cards per career) — which is also the fix for
DECISION 037.

### Open, small, and deliberately not done

- `view-model.ts` imports `CLASS_ORDER` from `engine/types` rather than the barrel, which does not
  re-export it. Tidiness, not a boundary violation — the hidden-mechanics rule is about reading
  `GameState`, which is unchanged. Fixing it touches a re-frozen engine file for no functional gain.
- The **new baseline** for any future engine measurement is `reports/022` **§8**, not §1 and not
  `reports/018` §4. §1 is the banked leak-check record and must stay readable as it was. Anyone
  comparing to the older tables after DECISION 040 will see a difference that is a decision, not a
  regression.

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


## Wave 10 — complete and committed (PM session 5)

| Brief | What | Owns |
|---|---|---|
| `briefs/024-the-content-pilot.md` | The content pilot, DECISIONS 030 + 036 + 042 + 043. Per-season variants of `milestone-opener`, the three text defects in `milestones.ts`, and the gate measurement | `src/content/events/milestones.ts`, `src/engine/types.ts`, `src/engine/select-event.ts`, `src/content/schema.ts`, a new probe in `src/sim/` |

**One lane on purpose.** The pilot's gate is a measurement over the whole content bundle, so a
parallel lane touching *any* content or engine file would pollute it — the wave-9 lesson that
file-disjointness is not the only kind of conflict. B29 and B24 stay unqueued until the playtest, per
the PM session 5 action list.

**Three things PM session 5 established before writing the brief** (read `select-event.ts:48-56` if
you doubt any of them):

- **The pilot was not writeable as approved.** `selectFixedEvent` fires *every* matching fixed event,
  one per `advance`, in content order — it does not pick one from a pool, and no existing condition
  partitions seasons into disjoint sets. DECISION **042** authorises one additive optional field,
  `seasonIndex?: number[]`, and nothing else. Two PM sessions had this queued as a pure content task;
  it never was.
- **`classYear` would have failed the players who play the most.** `advance.ts:228-229` caps it at
  `SR`, so a five-year redshirt career is `FR SO JR SR SR` and two openers would still be verbatim
  identical. Hence `seasonIndex`, and hence the redshirt cohort is not optional in the measurement.
- **The 008 harness was never committed** — this phase's headline repetition numbers came from a
  throwaway script. 024 rebuilds it in `src/sim/` as a committed probe and must reproduce the
  published baseline (first verbatim repeat at decision 13) on *unmodified* content before touching
  anything. The repeat key is the rendered `(title, description)` pair, not the event id; an id-based
  key would show the problem solved by construction.

**The gate, restated so nobody softens it later:** first verbatim repeat moves materially, or the
other seven events do not get written. DECISION 030 asked for a refutable pilot and this is the
refutation point.

**Not committed by the agent, deliberately.** DECISION 030's voice constraint moved onto the PM when
the user chose agent-written prose: the PM read every line before committing.

### What shipped

**613 tests green (was 578), both typecheck passes exit 0, build clean.** Full report:
`reports/024-the-content-pilot.md`. Prose is in §7 in full; the PM read every line, per DECISION 030.

- Five `milestone-opener` variants on `seasonIndex` 0–4, disjoint and exhaustive, 40–42 words each
  against the old card's 42. **Zero opener cards repeated in any career, in either cohort.**
- DECISION 042's field: `seasonIndex?: number[]` on `EventConditions`, its check in `eventMatches`,
  its validator clause, tests. **Nothing else in `src/engine/**` moved.**
- Both remaining DECISION 043 defects: the third-person slip (only one in the file; a test now fails
  on any third-person pronoun anywhere in `MILESTONE_EVENTS`), and the bowl moment reworded to
  `Enjoyed the bowl trip more than the bowl game` — a trip described, not an achievement cited.
- `src/sim/repetition-probe.ts` + 20 tests — the 008 harness, committed this time.

### The gate — DECISION 044

**13 → 15 on cohort B, and the by-16 rate flat at 100%.** The PM re-ran the committed probe and got
the agent's figures exactly. 030's clause fired. **The pilot ships anyway** — its other three
products do not depend on the gate, and re-shown decisions fell **45.0% → 37.5%** (B) and
**43.2% → 36.4%** (C).

**What it actually measured: the milestone skeleton is a queue.** The opener now repeats never; the
first repeat is `milestone-rivalry` in 112/144 careers, two decisions later. 024's counterfactual
says varying all five moves first-repeat to **19** and the by-16 rate to **37.5%**, and that the wall
after that is the three hub cards — string literals in `advance.ts`, not content, so they would need
their own decision.

**The seven-event decision is with the user, and the playtest informs it.** See DECISION 044: the
counterfactual rests on the untested premise that skimming is a function of cumulative *dose* rather
than *onset*, and 024 §10's options A and B are correct under opposite answers to that one question.

### Four things worth not rediscovering

- **The repeat key must be the rendered `(title, description)` pair, not the event id.** Five variants
  carry five ids; an id-keyed harness reports the problem solved by construction. The agent proved the
  two keys byte-identical on *unmodified* content before changing a word — that validation is the
  reason the +2 is trustworthy.
- **Neither cohort alone exercises all five variants.** Cohort C never fires `seasonIndex: [1]` (the
  redshirt sit always lands in season 1); cohort B never fires `seasonIndex: [4]` (no season 4).
  Any future run of this gate needs both, and not only for the class-year reason.
- **DECISION 042 is confirmed by measurement, not just argument.** `milestone-opener-last` fired in
  143/144 cohort-C careers; under class-year gating every one of those would have been served a
  verbatim repeat in its final season.
- **The PM's own edit:** two of five variants opened their positive outcome with *"You play like a
  man…"*. In a pilot whose premise is that sameness trains players out of reading, a shared
  construction across two cards in the same five-card set is the defect the voice review exists to
  catch. `seasonIndex: [3]` now reads *"You do not waste a snap of it, and the tape says so."*

## Wave 11 — complete (PM session 5)

| Brief | What | Owns |
|---|---|---|
| `briefs/025-post-wave9-playtest.md` | The fourth-career playtest. Four careers, four positions. Career 3 tanks *and declares early*; career 4 transfers | nothing — playtester, no source changes |

**Serial. One browser agent at a time, always.** The dev server is running in the background at
`localhost:5173`; the brief tells the agent not to start one.

**The question it exists to answer is DECISION 044's: onset or dose.** Do players stop reading once
they have been burned by a repeat at all, or does each further repeat wear them down? 024 §10's
options A and B are correct under opposite answers, so this is the input the seven-event authoring
decision is waiting on. The brief asks for the decision number at which the playtester first caught
*themselves* skimming, per career, and tells them "I never stopped reading" is a real answer.

**The playtester is deliberately not told that the opener now varies.** Telling them would send them
hunting for variants and contaminate the only measurement this wave can produce.

Also carried: can you lose now (wave 9 took `lazyEarly` 89% → 56% drafted); does declaring early read
as a **gamble or a trap**; does the new transfer resolution card make the offseason a decision rather
than a menu; DECISION 041's draft question; and B29's empty room at whatever width the harness gives.


### What 025 found — read this before planning anything

**The curve moved about one career.** Four "play again" answers: yes → yes (*"more than last time"*)
→ *"yes, but I want to **check** something, not play something"* → **no**. The fourth:

> *"No. I have four endings, I know what the levers are, and I know none of the words in the middle
> will change anything. If you asked me to play a fifth I would click through it without reading and
> we would both know it."*

**The answer to the question the wave existed for: ONSET. See DECISION 045.** Career 1 skimming began
at decision **15**, on a verbatim repeat, *"a snap, not a slide"*, generalised to brand-new cards by
decision 23. Careers 2, 3 and 4: **decision 1**, because every career opens on Signing Day again.
Dose governs only how long a good card buys back — *exactly one card*.

**The mechanism, which two playtests could not supply and this one did:**

> *Repetition is what starts it. The text/number contradictions are what make it rational to stay
> that way, and they apply to new cards as much as repeated ones — which is exactly how it
> generalises to cards I have never seen.*

**DECISION 046 is the one to read before briefing any of it.** The PM checked all six named
contradictions against source: **the prose is correct in every one.** Three separate causes, the
largest being that `reducer.ts:61-64` freezes `overallBefore` before `advance()`, so a card's delta
is everything that happened during that advance — its own effects, plus any deferred effect falling
due, plus progression. *Cutting the Line* authors `effects: []` and displayed **−3**. **Anyone who
briefs this as "fix the six cards" will rewrite good writing and leave the cause in place.**

### New backlog from 025

| ID | Item | Notes |
|---|---|---|
| B30 | **Cards do not account for what they did** — deferred effects and progression land on whichever card is on screen | DECISION 046 cause 1. `reducer.ts` + `view-model.ts`, both unfrozen. **Top of the board** |
| B31 | **Character is the invisible half of an outcome**, so cards whose real cost is character read as rewards — *"compliance flags the resale listing"* = **+1 OVR** | DECISION 046 cause 2. B17 with a mechanism. A fix needing an integer is a proposal against DECISION 002 and goes to the user |
| B32 | ~~**Declaring early reads as a trap, not a gamble**~~ **DONE — the decision is deleted (DEC 057/058)** — claim 2 **REFUTED**. The Declare card shows no projection, no stock, no warning, and frames it as *"Cash in now"* | Wave 9 made the penalty real; nothing tells the player a gamble is being taken. Note DECISION 025 refused a round projection by name — the fix is not `draftStock` |
| B33 | **`Undrafted` is set in the same gold display type, size and position as `Round 5, Pick 14`** | DECISION 032 said the fix for a congratulatory bad ending is hierarchy. It was applied to *drafted* endings; the undrafted case kept the trophy treatment |
| B34 | **The Moments reel printed 🏆 "Carried the team through bowl season" four times** on a player with no bowl win | The milestone fires every season. Repetition has now reached the ending screen |
| B35 | **Silent resolutions remain** — "Play this season", "Return to school" and "Stay at [school]" produce no outcome screen. **"Stay at Ole Miss" paid +10 as a bare number on a card with no sentence** | Wave 9 proved three hubs deserved silence *on the data then*. +10 is not silence-worthy. Re-measure before re-deciding |
| B36 | **Arithmetic and state defects**: ledger read `8 snaps · 3 FG · 6 Points`; status read `ON THE FIELD: on the scout team` beside 339 snaps and 31 tackles; *Bowl Opt-Out* says *"your name's already climbing draft boards"* at **60 OVR on the scout team**; *Playoff or Bust* says *"Ten wins is a disappointing season here"* beside a **5-7** ledger | Mixed causes — some content conditions, some view-model. Cheap and they cost credibility every time |
| B37 | **The redshirt card lies** — *"sit this season"* cost −3 and the season was played anyway | B13 was closed as a wording fix. The wording is still wrong |
| B41 | **Off-field beats should not author `snaps` at all** — *Cutting the Line*, *Bed Check* and *On the Sideline, On Camera* award ±15/−20 snaps, which is why DECISION 048's gate had to sweep them in | DECISION 051. The gate is the approximation; this is the clean fix. It changes those cards for every player, not just redshirts, so it is a balance question and goes to the user |
| B42 | **`Undrafted` may be a much rarer ending than the screen's prominence implies** — 400 careers under a deliberately bad policy produced **zero** undrafted results (59 drafted : 1 busted in a 60-career sample) | DECISION 052. Found while building a fixture to render the undrafted screen at all. Wave 9 made careers losable and 048's A/B puts the redshirt cohort at ~96% drafted. Balance observation, for the user |
| B43 | **The redshirt card pays the gamble out before the gamble** — it says it might backfire, then hands over **+5 OVR on the offer card**, before the season it is betting on | DECISION 055. The playtester: *"a free lunch dressed as a gamble."* The exact mirror of B32, where the card promises a gamble and delivers a dominated option. **The two offseason decisions mislabel their risk in opposite directions** |
| B44 | **Redshirt seasons need beats about redshirting** — 12 eligible events, none of them about sitting out; two actively wrong for a player who is not playing | DECISION 055. The best-aimed authoring target found in this phase: smaller than 045's offseason target, and the player has *chosen* to be there |
| B45 | ~~**Hub cards still print an unattributed number**~~ **DONE (`e414bea`)** — `"You chose: Stay at Memphis" → +5 OVR with no sentence`, in 3/3 careers | DECISION 056 hole 1. `reducer.ts:93` gives a one-option hub `account = null` by construction, so it falls back to the whole-`advance` total. Known at ship time; 026's denominator could not see it |
| B46 | ~~**The character sentence renders and loses to the number**~~ **DONE (`e414bea`)** — *"Cost you in the locker room."* beside a bold **+1 OVR** still reads as a reward | DECISION 056 hole 2. Hierarchy, not a missing feature. Does **not** reopen DECISION 002 |
| B47 | ~~**`EVERYTHING ELSE` is a labelled bucket with no sentence**~~ **DONE (`e414bea`)** — never once explained to the player | DECISION 056. Same defect as B45 wearing a label |
| B38 | **A playing-time phrase is printed beside `0 snaps`** — at Signing Day and preseason the header reads `ON THE FIELD: in the rotation` with `0 snaps` directly above it | Found by the PM's own click-through, wave 12. It is defect 2's mirror image: 027 fixed the low-phrase-beside-high-snaps direction and deliberately did not gate on `season.inProgress` (027 §7). A pre-season zero is "has not played yet", not "is not playing" — the phrase should probably be suppressed, not lowered. Small, `bands.ts` + `view-model.ts` |
| B39 | **`delayPhases: 2` does not exist in practice** — all 14 deferred effects are `delayPhases: 1` and land inside their own card's `advance`, so "this will cost you later" never does | 026 §6.1. Content, frozen. Cheap (one field on 14 effects) and it is the only way an author can write a genuinely-later consequence |
| B40 | **`suspension` is unaccounted on the card** — it zeroes snaps for two phases, moves no OVR, and the card says nothing | 026 §6.3. Same class as B30, out of that brief's scope |
| B29 | **The empty room — CONFIRMED badly at 1456×824.** A ~755px band in a 1456px window, ~350px dead black each side; card bottom at y≈560 with ~260px empty below. **The decision screen uses about a third of its area** | *"Looks like a phone layout that was never given a desktop breakpoint."* The year rail sits marooned top-right over a void that would hold the season stat detail the ending screen already knows how to lay out |

**Position — PARTIAL, and precisely split:** real in-season (the Kicker cards were the only thing the
playtester said they enjoyed — *"The Yips, the wind read, the onside kick"*), **identical in the
offseason at all four positions.** That is B24, now with a boundary.

**No visual defects at all.** Nothing clipped, overflowed, collided; contrast fine. Every finding in
§8 is semantic. The type and colour work from waves 4–8 is done and should not be reopened.

## Wave 12 — complete and committed (PM session 6)

| Brief | What | Owns |
|---|---|---|
| `briefs/026-a-card-accounts-for-itself.md` | **B30 + B31**, DECISION 046. A card's number reports what *that card's chosen outcome* did; deferred effects and progression get their own beat with their own sentence. Character stops being the invisible half of an outcome, without an integer | `reducer.ts`, `view-model.ts`, `types.ts`, `CareerScreen.tsx`, `career.css` |
| `briefs/027-the-credibility-defects.md` | **B36 + B37**. `3 FG · 6 Points`; `ON THE FIELD: on the scout team` beside 339 snaps; "climbing draft boards" at 60 OVR; "ten wins is a disappointing season" beside 5-7; the redshirt card saying sit. Diagnosis is the deliverable — cause in source, file and line, for each | `labels.ts`, `bands.ts`, `ledger.ts` |

**Two lanes, not the three PM session 5 planned — see DECISION 047.** Lane B (B29, the empty room) is
sequenced into wave 13 because it is *not* file-disjoint from lane A: the card's delta is computed at
`CareerScreen.tsx:149-150`, not in the view model, so 046's fix necessarily rewrites the block lane B
would be re-laying-out. The order is better on the merits too — B29 decides how to fill ~260px of
empty vertical space, and lane A changes how much vertical content a resolved card carries.

**Baseline at dispatch, verified by the PM by hand:** 613 tests green, both typecheck passes exit 0,
tree clean at `bad12de`, dev server serving 200 on 5173.

**Cross-lane protocol.** 027 may trace a defect to lane A's cause (`reducer.ts:61-64`) or need a fix
in `view-model.ts`. It is told to write the exact diff into its report and stop, not to edit. The PM
lands those after 026 commits.

### What shipped — wave 12, commit `99456d4`

**636 tests green (was 613), both typecheck passes exit 0, build clean, `npm run play` byte-identical
on seeds 24/77/101 against a pristine `git archive HEAD` extraction, `src/engine` and `src/content`
untouched.** The PM played a full career by hand and confirmed all four card shapes on screen.

- **A card's number is its own chosen outcome**, identified by matching `lastOutcome.description`
  against the chosen option's candidate outcomes — from content, no engine change, **0 unidentified
  outcomes in 12,847 measured cards**. 13.5% of cards were reporting a number that was not theirs,
  **227 with the wrong sign**, 758 printing a movement on a card that authored none. The remainder
  gets its own beat, `EVERYTHING ELSE`.
- **The biggest offender was `effects: []`, not the deferred effect.** Four of the six playtest rows
  author nothing and were printing **eight distinct numbers across 352 resolutions**. All say
  `No change` now.
- **Character needed no integer and DECISION 002 is untouched.** The card says *"Cost you in the
  locker room."* above the figure — words, weight, position, no hue, no magnitude. Confirmed on
  screen: the Ticket Hookup now carries that line above its `+1`.
- **Defect 2 fixed** (`ON THE FIELD: on the scout team` beside 339 snaps) — fires on 45.7% of careers,
  measured over 1,200 careers / 30,739 decisions.
- 027 diagnosed all five credibility defects to file and line. Four were frozen-file proposals, and
  three of them share one cause — DECISION 048.

### Three things from wave 12 worth not rediscovering

- **`reducer.ts:61-64` was only half the story.** DECISION 046 named the deferred effect as cause 1,
  and the measurement inverted it: **every deferred effect in the bundle is `delayPhases: 1` and lands
  inside its own card's `advance`**, so the Position Switch's `−2` *is* that card's number. Disowning
  it would have been the same bug reversed. The account asks `pendingEffects` rather than assuming.
  026 §6.1 proposes `delayPhases: 2` if a genuinely-later cost is ever wanted — that is content, and
  frozen.
- **A literal NUL byte in `view-model.ts` made `grep` silently skip the entire file.** Lane A wrote it
  as a key separator in a template string; `file` reported the source as `data`. The PM lost real time
  to greps that returned nothing on a file that plainly contained the string. Replaced with a
  `\u0000` escape — same runtime value, greppable source. **If a grep over a source file returns
  nothing you are certain is there, run `file` on it.**
- **A handoff diff written against a live file can be stale by the time it lands.** 027 §7's
  `view-model.ts` diff assumed one `currentSeasonLine(state)` call site; there are two. It was applied
  by hand against what the file actually said. Cross-lane diffs get re-read, not pasted.

## Wave 13 — complete and committed (PM session 6)

| Brief | What | Owns |
|---|---|---|
| `briefs/028-the-freeze-lift.md` | **DECISIONS 048/049/050.** `requiresPlaying` on all 52 + a `validateContent` rule; `minOverall` + `minClass: "JR"` on the four draft-board cards; the redshirt card's two engine strings; *Playoff or Bust* reworded; twelve `points` siblings in `k.ts` | `src/content/**`, and **only** `engine/types.ts`, `engine/select-event.ts`, `advance.ts:74/:76` |
| `briefs/029-the-empty-room.md` | **B29.** The ~755px band in a 1456px window; the decision screen using a third of its area. The void under the year rail takes the season stat detail | `CareerScreen.tsx`, `career.css` |
| `briefs/030-undrafted-is-not-a-trophy.md` | **B33.** `Undrafted` in the same gold display type, size and position as `Round 5, Pick 14`. DECISION 032 applied to the case it missed | `SummaryScreen.tsx`, `summary.css` |

### Lane B — shipped. The room is used, and one reference feature was rejected on measurement

- **Width:** the band goes 760px → **1016px** at 1456×824; dead black **348/348 → 220/220** each side,
  70% of the viewport against the reference shell's 69%. Two columns of one `--measure` each with a
  hairline rule between. The decision column is still *exactly* `--measure` and nothing inside it
  moved. **PM-verified independently:** `.frame.career` x=220 w=1016, `.career-main` and `.ledger`
  both 480 wide.
- **Vertical:** the right column carries `min-height: calc(100svh - 6.5rem)` and ends at y=760. The
  257px of dead black under the card and the 224×475 void under the year rail are both gone.
- **The reference's `overflow:hidden` height-lock was REJECTED, on a measurement.** The tallest
  resolved card over 120 cards bottoms at y=644; clipping it would create a new defect where 025 found
  none. Zero scroll in 120/120 cards. *This is the third reference feature adopted, adapted or
  rejected on purpose rather than copied.*
- **What filled the void:** the ledger row now carries what the ending screen's season row carries —
  school, class year, record, snaps, season-end OVR and its step from the season before — plus the
  summary's column head and an `Across N seasons 60 → 71 +11` foot line pinned to the floor. **All
  from fields already on `CareerView.ledger`; no view-model change needed or made.** Rows are now all
  the height of a played row, so the table no longer grows as the career fills — DECISION 007's actual
  point.
- Four pre-existing rules kept and verified: no OVR, step, record or **snaps** on the current row
  (snaps would contradict the frozen rail, DECISION 019), and the dashed fifth row keeps its open edge
  (DECISION 010).
- Verified at 1456, 1920, 1280, 1024, 768, 400 and 360 across plain cards, the tall 4-part account
  card, transfer hub, offseason, ending, and empty and full ledgers. **PM re-measured 360/400: 20px
  gutters, no overflow.**
- **Left deliberately empty, with reasons:** 180–280px under the card in the left column (centring was
  rejected because it would move the card between a decision and its outcome), the framed air inside
  the right column, and the 220px side gutters. An optional `LedgerRow.stats` view-model diff is
  written out in the report if the per-season stat line is ever wanted.

**028 is alone in `src/content/**` on purpose** — its balance measurement is over the whole bundle, so
a parallel lane touching any content would pollute it. That is the wave-10 lesson restated.

**`npm run play` byte-identity is suspended as a check for 029 and 030 this wave**, because 028 moves
it deliberately and by approval. Their check is `git status`: nothing modified under `src/engine/`,
`src/content/`, or their out-of-bounds list. **028 records the new seed hashes for 24/77/101 so the PM
can re-baseline at commit.**

### Lane D — shipped, commit `ce36cbf`. 644 tests green

**The stop condition did not fire.** Redshirt-cohort draft rate `0.9567 → 0.9592` over an
identical-seed A/B of 7,200 careers. Redshirting still beats the never-redshirt control on top-3 rate
(0.5917 vs 0.4792), stock median (76 vs 72) and OVR mean (82.95 vs 80.43). The cost landed in **round
quality** — 68 careers out of round 1, spread across 2–7 — which is the intended sacrifice. Nothing
was tuned.

- **Production cards firing at a sitting player: 1,655 → 0.** The PM re-derived the coverage
  independently from `CONTENT.events`: 59 production on-field events, **0 still ungated**.
- **`minOverall: 70`**, and the number is defended: 70–74 is the lowest 5-point band in which every
  measured career was drafted (653/653); at 65–69 more than one in five goes undrafted, which was
  027 §3's own stated falsifier. All four cards still fire (36–45% of prior firings retained); FR/SO
  firings **68.6–70.9% → 0%**.
- **`points < 3 × fieldGoals`: 5.9% of K season rows → 0 / 4,569.**
- The agent **declined** 027's proposed `"Redshirt:"` glossary prefix as off-voice and wrote its own.
  The PM read every line before committing, per DECISION 030.

**DECISION 051 — the measurement the approval did not cover.** The gate collapses a redshirt season's
eligible pool from **81 events to 12** (3 `nonconf` / 5 `conference` / 4 `postseason`), which points
straight at this phase's top finding. Measured on the committed probe against a pristine pre-048 tree,
cohort C: first verbatim repeat median **17 → 17**, re-shown share unchanged, repeat-by-decision-16
**41.0% → 44.4%**. +3.4pp on one rate and nothing else moves, because a redshirt season is one of
five and the metric is career-wide. **Kept.** Falsifier: a playtester who redshirts and reports the
season as thin — *the next playtest brief must send someone through a redshirt season deliberately
and ask.*

**New `npm run play` md5 baselines** (bit-identity moved by approval, precedent 040):
`24 random cd2d3895e9c68e8dc485bfa5cc0fc832` · `77 random 7d6ee0df708a92555edb968ccc65ce64`

> **STALE — do not use these. Correct at `ce36cbf`, moved at `d310e87` (wave 16) and never updated.
> See DECISION 064: the recorded-hash method is replaced by a detached-worktree diff.** Current
> values are in the "Verification method" section near the end of this file.
(**unchanged** — that career never sits and never draws a gated card) ·
`101 random f2ffe2b55fdbf8bf710182f64b871edb`.

### Lane E — done, awaiting commit with lane B. It was small, and it says so

**The defect was position, not size or hue.** `Undrafted` and `Round 5, Pick 9` already differ in
size, weight, width and opacity — and those values are *locked* by DECISION 026's floor, which 032
froze, so shrinking the word was never available. What was identical was **the slot**: both occupy
the first position after the eyebrow, so the block announced the absence of a result where the result
goes.

The fix is two CSS blocks and one ternary: on `!wasDrafted` the verdict block's three elements run in
reverse order — the career's closing figure leads, the ending states itself last. `.verdict` computes
`rgb(240, 180, 41)` on **both** branches; DECISION 021's refusal of a chalk/gold split is untouched.
Drafted careers render byte-identically.

It also **completes DECISION 032** rather than extending it: on a *declining* undrafted career the
promoted arc was being promoted underneath the trophy, so the honest number still ranked second.

**One gap, stated by the agent rather than papered over:** phone width was argued from the tokens,
not measured, because another agent was driving the shared browser. **The PM has since closed it —
DECISION 052.** No defect: no overflow at 360/400/1456, the reorder holds at every width, and
`.verdict` stays gold on both branches.

**028 carries a stop condition** (DECISION 048): if the redshirt cohort's draft rate collapses rather
than shifting modestly, it stops and reports rather than tuning. That is a PM/user call.

**Held back to wave 14 deliberately:** B32 (the declare card reads as a trap) touches the declare hub
in `advance.ts` and `view-model.ts`, both spoken for this wave; B34 (the Moments reel printing one
milestone four times) is content, which 028 holds. B30/B31's follow-ons — 026 §6.2 (hub cards still
report the whole movement, by DECISION 037's choice) and §6.3 (`suspension` is unaccounted on the
card) — are both real and both unqueued.

## Wave 14 — in flight (PM session 7)

**Baseline verified by the PM before dispatch:** `1bf7a1c`, tree clean, **644 tests green**, both
typecheck passes exit 0, dev server serving 200 on 5173.

Two lanes. They share no files, and — the constraint that actually shaped the wave — **no browser.**

| Brief | What | Owns |
|---|---|---|
| `briefs/031-post-wave13-playtest.md` | Playtest, three careers. The first fresh eyes since 025, four waves of change ago | the browser; `reports/031-*`, `PLAYTEST-LOG.md` |
| `briefs/032-how-losable-is-it-now.md` | Terminal-only measurement: the undrafted rate (B42) and the true cost of declaring early (B32) | `reports/032-*` only. Probes go to the scratchpad, **not** into `src/` |

**Why no development lane this wave.** Not caution — the playtest would be invalid with one. Vite
hot-reloads the dev server on any `src/` write, so a dev lane would be changing the build underneath
the playtester mid-career. That is also why 032 is told to keep its probe scripts out of the repo
tree: it is a terminal agent, but a new file under `src/` still touches the watcher. The serial-browser
rule (one browser agent at a time, always) is the other half of the same constraint.

**Both lanes died on their first turn and were re-dispatched.** An API session limit (HTTP 429)
killed both agents at *"I'll start by reading the brief"* — zero tool calls, zero output, nothing
written. This is the third distinct way an agent has died in this phase (foreground `npm run dev`,
mid-flight session limit, and now a limit hit *before any work at all*). The re-dispatch adds one
rule that every future brief should carry, because it is the only defence that works against a kill
you cannot predict:

> **Write incrementally.** Append each career's notes, or each section's numbers, to the report file
> as you get them. A report file with one career in it is worth more than a complete report that dies
> in an agent's context.

The measurement lane was re-dispatched on **Sonnet** rather than Opus — it is mechanical (run
committed probes, write one A/B, report numbers) and the judgment content is low, so it is the right
lane to spend less capacity on. The playtester stayed on Opus: its entire value is nuanced
qualitative self-observation, and that is exactly what does not survive a model downgrade.

**What 031 carries that this session could not answer itself** — the three questions are DECISION
051's falsifier (redshirt deliberately; did that season feel thin now its pool is 81 → 12?), whether
waves 12–13 actually made the card's number agree with its words, and the skimming-onset number that
DECISION 045's redirected authoring budget is waiting on.

**What 032 exists for.** Both of its numbers are currently anecdotes that are about to be put to the
user as balance questions, and the house style is that a contested call gets a number first. B42 came
from a fixture-building accident (400 bad-policy careers, zero undrafted); B32's fix cannot be
designed without knowing the size of the gamble. 032 is explicitly forbidden from proposing a fix
that shows `draftStock` or a projected round — DECISION 025 refused that by name.

### Lane 032 — done. Both questions answered, and one of them changes what the next wave is

**The PM measured this lane personally.** The dispatched agent stalled at 600s having written
nothing; the probe then turned out to run 57,600 careers in **25 seconds**, so re-dispatching into
the same capacity wall would have cost more than doing it inline. 74,400 careers measured in total.
Report: `reports/032-how-losable-is-it-now.md`. Nothing under `src/` was touched.

- **B42 is REFUTED — DECISION 053.** `Undrafted` is not rare: **12.4–17.1%** of ordinary
  (`baselineRandom`) careers end there. 052's "zero in 400" used a policy that plays badly *and stays
  all five seasons*, where the true rate is ~0.2% — so zero in 400 was the expected draw. **The
  variable that produces an undrafted career is leaving early, not playing badly.** The ending
  screen keeps its prominence; nothing to build.
- **"I could not lose" is dead as a live concern.** Both failure axes work and stay separate: tanking
  ability gives low picks, tanking character gives **busts at 12–15%** via the authored bust events.
- **B32 is reframed and escalated — DECISION 054.** Declaring early is **strictly dominated at every
  offer**, monotonic across all four arms of a paired identical-seed A/B with no crossover at any
  position. Round 1 is **0.0000 over 2,400 careers** at the first *and* second offer — not unlikely,
  very nearly arithmetically excluded, because `draft.ts:54` subtracts 8 before a round-1 threshold
  of 91. **The planned fix — "make a gamble look like a gamble" — does not exist**, because it is not
  a gamble. Two honest routes, A (reword; UI-only) and B (give it real upside; engine, every seed
  moves). **On the user's desk.**
- **The authored penalty is not the culprit.** `EARLY_DECLARE_PENALTY` + the lost senior `classPart`
  is 10 points; the measured gap is **48**. The other ~38 is foregone development the player is never
  told about. DECISION 038's tax is correctly calibrated and is not what is wrong.
- **One tooling defect recorded, not fixed.** `lazyFull` and `saboteurFull` produce **byte-identical
  output across all ~45 fields** (JSON-diffed at n=400), as do their `Early` variants — so does
  nothing in the tooling actually maximise for career-ending outcomes. `saboteur`'s own comment
  claims it is "the upper bound on reachable failure"; it is `lazy` under another name. Any future
  decision citing it as a distinct cohort is citing the wrong thing. `src/sim/` was out of bounds for
  this brief, so it is written up as a proposal.

### Lane 031 — the playtest. It refuted the last two waves' central claim

**Three careers, 1456px** (the harness was *not* pinned narrow this time, so the layout answers are
real desktop answers). Report: `reports/031-post-wave13-playtest.md`.

- **The north-star curve did not move, and it broke one career earlier than the best previous run:
  yes → no → no**, with a fourth career refused *"not from curiosity either."* Career 2's verbatim
  line is the one to keep: *"By the middle of this one I was no longer playing, I was auditing."*
- **Skimming onset: 15 → 1 → 1.** Exactly as predicted, and the third independent confirmation.
  **DECISION 045's redirected authoring budget now has its number and is unblocked.**
- **DECISION 051's falsifier fired — DECISION 055.** The redshirt season is thin (5 cards against a
  played season's 8, none about redshirting, two actively wrong for a player who is not playing).
  The career-wide +3.4pp was the wrong instrument for a single-season change. **B44.**
- **Waves 12–13's central claim is refuted in practice — DECISION 056**, and the PM verified both
  causes in source rather than taking the report at face value. Hole 1 (**B45**): hub cards get
  `account = null` at `reducer.ts:93` by construction, so `"Stay at Memphis" → +5 OVR` prints bare —
  026's denominator was *cards with prose* and could not see it. Hole 2 (**B46**): the character
  sentence **does** render; it just loses to a bold signed integer. **The fix is right; its coverage
  was wrong.**
- **Declare independently confirmed as a trap** from the player side, matching 032's numbers from
  the engine side.

**The convergence that should drive the next wave.** 032 and 031 met in the middle without being
told about each other: **the two offseason decisions mislabel their risk in opposite directions.**
The *declare* card has no risk language and is strictly dominated (B32); the *redshirt* card says
*"it might backfire"* and pays +5 before the season it is betting on (B43). That is one problem, not
two, and it is why the offseason reads as a menu.

**The methodological lesson, logged because it will recur:** a measurement that shares its fix's
assumptions cannot falsify the fix. 026 found 0 failures in 12,847 cards and every real failure was
outside its population. Future briefs of this shape must state the excluded population and name who
checks it.

## Wave 15 — complete and committed (PM session 7)

Two lanes. File-disjoint, and only one of them uses the browser.

| Brief | What | Owns |
|---|---|---|
| `briefs/033-the-card-finishes-the-job.md` | **B45 + B46 + B47.** Finish waves 12–13: hub cards stop printing a bare number, the character sentence stops losing to it, `EVERYTHING ELSE` gets a sentence | `reducer.ts`, `view-model.ts`, `types.ts`, `CareerScreen.tsx`, `career.css` + tests. **The browser.** |
| `briefs/034-a-career-can-go-wrong.md` | **DECISION 057.** Design + measure the declare removal *and* its replacement downside. **Proposal only — changes nothing** | `reports/034-*` only. Prototypes in a scratch copy outside the tree |

**033 is finishing a correct fix, not redoing a wrong one**, and the brief says so in those words —
the failure mode here is an agent rewriting six pieces of working code. It is pointed at DECISIONS
056, 046, 037 and 002 before it writes anything. The live tension it must resolve rather than ignore:
DECISION 037 *wants* the transfer hub to report the whole movement, so the defect is not "hubs lack
an account", it is **a number with no sentence.**

**034 is the largest thing this phase has attempted and it deliberately builds nothing.** The
mechanism gets chosen from measurements, not from plausibility — the DECISION 003 habit. Its two
acceptance tests are pre-specified so a candidate cannot be talked into looking good: restore
failure to roughly the **12–17% undrafted** the declare card was providing under `baselineRandom`,
**and** leave a well-played `good` career at ~0% undrafted / 95–97% drafted / 28–52% round 1. **A
mechanism that makes good play fail is disqualified regardless of how it scores on the first test.**

**The root cause is handed to 034 rather than left for it to find:** `developmentDelta`
(`advance.ts:172`) cannot return a negative number, so overall is a one-way ratchet and the
washout floor at 45 is never approached. Every other failure path is an event rolling badly; none
is the career itself going wrong.

### Wave 15 results

**Lane 033 — shipped, commit `e414bea`. 651 tests green.** The PM verified it independently before
committing: frozen dirs empty, typecheck both passes, build clean, play md5 unchanged at `cd2d3895`,
and the diff read for constraint leaks (no `draftStock`, no character integer, zero `GameState`
reads outside the view model).

- **The finding that made a real sentence possible.** `applyChoice`'s recruiting/declare/transfer
  branches write **no `overall` at all**, so a hub card's whole movement is *always* one of exactly
  four other causes — heal, a deferred effect landing, development, ambient injury — and all four are
  derivable in `view-model.ts` from the before/after pair. No engine change was needed.
  `"Stay at TCU" → +5 OVR` now reads **`SINCE YOUR LAST CARD / +5 OVR / "An injury healed and gave
  the points back."`**
- **B46 was fixed by moving the card's single emphasis slot**, which fires on character *credit* as
  well as cost, so the accent never becomes a valence signal (DECISION 012). DECISION 037 verified
  intact — the hub figure is unchanged in value *and* loudness (24.48px, accent); it only gained a
  label and a sentence. DECISION 002 untouched.
- **A completeness falsifier shipped with it:** 5,325 cards, 58 hub cards, 681 remainders, **0**
  without a sentence. That is the test 026 needed and did not have.
- **Gotcha for every future brief:** `npm run play` prints npm's banner on **stdout**, so `| md5`
  hashes the banner. Use `npx tsx src/sim/play-headless.ts <seed> random | md5`.

**Lane 034 — done, and the PM ran it personally** after two dispatched agents were killed by capacity
stalls without writing anything. ~150,000 careers. **It produced a user decision (058).** Full detail
in `reports/034-a-career-can-go-wrong.md`; the two findings worth carrying forward:

- **The obvious fix is disqualified.** Snap-based decline stops discriminating exactly when it starts
  working — `good` 7.6%, `random` 8.4%, `lazy` 7.7%. It punishes luck, not play. **Gating it to
  upperclassmen** fixes both the fiction and the maths.
- **The real cause was never the ratchet.** Stock already separates quality (89 / 75 / 60) and the
  undrafted line sits at **35**, below all three. Raising it to 50 leaves a good career
  byte-identical and fails 15% of lazy ones.

## Wave 16 — complete and committed (PM session 7)

One lane, deliberately alone: `briefs/035-remove-declare-and-restore-the-downside.md`. It implements
DECISIONS 057 + 058 — delete the declare decision, raise the draft bar, add upperclass decline.

**Why one lane.** The change moves every seed and its acceptance test is a draft-rate measurement
over the whole bundle; a parallel lane touching engine or content would pollute it. That is the
wave-10 and wave-13 lesson restated.

**The brief forbids tuning.** Constants are fixed from 034's measurements, and the agent is told to
**stop and report** rather than tune if its numbers miss. The hard disqualifier is restated in the
brief: if a well-played career starts failing above ~1%, or its round-1 rate drops below 28%, stop.

### Wave 16 result — shipped, commit `d310e87`. The game is losable

**PM-verified independently before commit**, and the verification caught a ship-blocker (below).
650 tests green, both typecheck passes exit 0, build clean. Constants confirmed in place and
**untuned**. Report: `reports/035-remove-declare-and-restore-the-downside.md`.

| profile | undrafted | round 1 | before this wave |
|---|---|---|---|
| `good` | **0.10%** | **44.31%** | 0.0% / 45.1% |
| `randomFull` | 3.22% | 9.09% | 0.1% / 9.9% |
| `lazyFull` | **15.18%** | 0.01% | **0.7%** |
| `antisocialFull` | 1.27% | busted **13.71%** | busted 13.7% |

- **A well-played career is as safe as it was before any of this** (0.10% undrafted, 44.31% round 1)
  and a badly-played one now fails **22× more often**. That is the whole point of the wave.
- **`EARLY_DECLARE_PENALTY` deleted as provably dead** — the only path to `declared` is
  out-of-eligibility, which is always SR: SR in **36,000 of 36,000** careers.
- **The agent found and fixed a defect the change introduced**: the card printed *"A season of
  development came in."* over a −3 drop. It now reads *"A season on the sideline cost you ground."*
  **That is DECISION 058's own falsifier being served** — the decline exists to be legible.
- **DECISION 059 — the ship-blocker the acceptance test could not see.** Aggregate `good` hit its
  target exactly (0.86% vs ~0.9%), while **K alone was 4.53% undrafted and 5.47% round 1** against a
  QB's 0.07% / 50.7%. A flat 200-snap decline floor sits *above a kicker's entire season*. Fixed by
  position-scaling both decline numbers on the 0.34 workload factor `postseason.ts` already documents
  and already applies to development. It improved everything: `good` 0.86% → **0.10%**, round 1
  40.73% → **44.31%**.
- **Second granularity error of the wave.** 034 §5 calibrated a replacement failure rate against the
  trap it replaces; 058 specified acceptance on an aggregate that hid a per-position failure. **State
  acceptance tests at the granularity the defect can hide in** — for this game that means
  per-position, because the engine already treats K differently everywhere else.

### Three things wave 16 leaves open, all for PM session 8

1. **B43 is only half-fixed, and the half that is fixed is the half nobody sees.** A *junior* redshirt
   went from +2.0 mean OVR / +7.4pts round 1 to **−1.0 OVR / +3.2pts undrafted** — a real gamble at
   last. But the hub offers the redshirt **at SO in 2,991 of 3,000 careers**, and a sophomore is
   exempt by design, so **the card players actually see is still a free buy.**
2. **The upperclass offseason is now the flattest part of the game, exactly where the stakes are
   highest.** Removing declare took a beat out of a sequence three playtests already called
   repetitive. This is DECISION 045's target and it now has a hole in it.
3. **K's round-1 rate is 26.9% against 44–51% for field positions.** **Pre-existing** — it measured
   28.7% before this wave — and deliberately not tuned in a wave that was not about position balance.
   Worth a decision, not an assumption.

## Wave 17 — complete (PM session 8)

One lane, deliberately alone: `briefs/036-the-losable-career-playtest.md`. It is the playtest session
7 ended by declaring not optional. **No code ships while it runs** — a build that changes under the
player invalidates the run, and the playtest is the only thing that can tell us whether wave 16's
change did the job it was chosen for.

| Brief | Agent | Owns files | Dispatched |
|---|---|---|---|
| `briefs/036-the-losable-career-playtest.md` | playtester | `reports/036-the-losable-career-playtest.md`, `PLAYTEST-LOG.md` | 2026-09-15 |

**What it is built to answer**, in priority order:

1. **DECISION 058's falsifier** — *a playtester who loses a career and cannot say why.* Career 2 is
   played deliberately badly, with an **in-the-moment** journal at every season boundary rather than a
   hindsight read, because hindsight cannot distinguish "the game told me" from "I knew what I was
   doing." The headline bullet is a yes/no plus a decision number.
2. **DECISION 059's falsifier** — career 1 is a **Kicker**, the position the flat decline floor was
   silently punishing and the one no playtest has ever played. Also carries K's pre-existing round-1
   gap.
3. **Open item 2 from wave 16** — is the upperclass offseason emptier now that declare is gone.
4. **B43's remaining half** — the playtester is asked which class year the redshirt was offered in and
   whether it read as a gamble or a free yes. This is deliberately a question, not an assumption: the
   measurement says it is a free buy at SO, and we want a player's word before briefing a fix.
5. The north star, re-asked. The curve has been *yes → no → no* for three playtests; this is the first
   wave that changed what the game **is** rather than how it reads.

**Deliberately not asked:** skimming onset (settled at decision 1 across three playtests), and type,
colour or contrast (three playtests, zero visual defects). Both are struck from the brief to buy room
for the questions above.

**A result to expect and not misread:** a deliberately-bad career goes undrafted **15.2%** of the
time, so the playtester will most likely be **drafted anyway**. The brief says so and asks them to
report it plainly with what they had expected. A drafted bad career still answers question A — it is
"did the game show you it was going wrong", not "did you lose."

### The 036 agent died mid-flight, and the fix is a brief rule every future playtest must carry

The playtester was killed by a session limit **after finishing career 2** and had written **nothing
to disk** — two careers of findings existed only in its context. It was resumable, so the PM woke it
and told it to stop playing and write up the two careers it had. Recovered, not lost. But it is the
third agent this phase to die mid-flight and the second to die holding unwritten work (DECISION 016).

**The brief already said "writing the report is the deliverable" and that was not enough.** An agent
reads that as an instruction about priorities at the *end*, not about *when* to write. The rule that
would have made this a non-event:

> **Append to the report file after EACH career, before starting the next one.** Do not hold three
> careers in your head and write at the end. If you are killed between careers, everything you have
> not written is gone.

**Put that line in every future playtest brief.** Session length is the stall risk the 003 brief
already identified; this is the same risk with a different ending, and incremental writing is the
only defence that does not depend on the agent surviving.

### Wave 17 result — the playtest refuted the wave, and found the cause of the whole phase's problem

Report: `reports/036-the-losable-career-playtest.md`. **Two careers, not three** — the agent was
killed by a session limit and was resumed to write up what it had. Career 1 a Kicker played straight;
career 2 five seasons of deliberate sabotage.

**The north-star curve: yes → no. And the "no" is aimed at the game, not at the shaping:**

> *"No — and this one is the game, not the bad-career instruction. I ducked, cheated and quit for
> five straight seasons and the ending handed me All-American in gold. I don't want a third because
> **I stopped believing the game is counting what I do.**"*

**DECISION 058's falsifier did not fire as written — the player did not lose.** They finished
**Round 4 with an All-American**, five overall points behind the straight career. See DECISION 060:
the literal falsifier is intact and the premise under it is not.

| Claim | Verdict |
|---|---|
| A bad career now visibly fails | **REFUTED** — 72 vs 77 OVR after three seasons of sabotage |
| Sitting out is a real decision | **REFUTED as stated** — offered at SO and JR, pays **+5 OVR on the offer card**, before the season it bets on. *"An obvious free yes."* **This is B43's remaining half, now confirmed by a player** |
| The ending screen ranks honestly | **REFUTED — sharpest finding.** The sabotage career gets a gold, boxed **HONORS** panel with *All-American*; the straight career, drafted a full round higher, gets **no honours block at all.** The endings **rank backwards at a glance** |
| You always know where you are | **PARTIAL** — `5TH-YR SR` is exactly right; four defects behind it, all in wave 18's `briefs/038` |
| The card's number agrees with its words | **REFUTED — four instances, all one direction:** prose says you behaved badly, number says **+1 OVR** |
| Anything cut off or colliding | One real defect — the disabled START button renders full-opacity gold |

**Did they know it was going wrong? Partly, and on the thing that matters, no.** They knew their
*standing* was bad from **decision 20** (*"a problem they are managing"*). They never knew the
*career* was bad — because it was not. At the ending they were surprised **upward**.

### The one thing that works, and it is worth protecting

The **locker-room ladder** — *"the staff trusts you"* → *"just a guy in the building"* → *"a problem
they are managing"* → *"the staff has stopped defending you."* The playtester: it made them want to
change how they were playing, **twice**. It is the only mechanism in the game that did that.

**And it is sealed off from every other number on the screen** — it never touches the OVR, the season
ladder, the draft slot or the honours, so it argues alone against all of them. That is not a reason to
weaken it. It is the strongest evidence the phase has about what does work, and the rest of the screen
should be brought into line with **it**, not the other way round.

### The PM's own finding, from the code, after reading the report — this is the headline

**`src/content/events/offfield.ts` has 14 effect blocks pairing a character LOSS with an overall
GAIN.** Misbehave off the field and the number the player watches **goes up**. At the draft-stock
weights, `-6 character, +1 overall` is **net positive** — the clean option is strictly dominated.

**Every bad-play measurement this phase has taken is blind to it.** The `lazy` policy scores by draft
stock and therefore *declines* those cards. The simulated bad player behaves well off the field; the
human one does not. See **DECISION 060** — this is why 15.2% and Round 4 are both true at once.

### New backlog from 036

| ID | Item | Status | Notes |
|---|---|---|---|
| B48 | **Off-field misbehaviour pays overall** — 14 blocks in `offfield.ts`, clean option strictly dominated | **measuring (037), then USER** | DECISION 060. Balance + content. The likely root of *"the game isn't counting what I do"* |
| B49 | **The ending screen ranks backwards** — HONORS is the loudest element and the saboteur earned it | **held pending 037** | DECISION 060 §2. Fix the cause or the display — 037 says which. PM owns this file in wave 18 |
| B50 | **The locker-room ladder is sealed off from every other number** | **in flight (043)** | **Now the top item on the board.** Second playtester in a row to name it the only mechanism that changed how they played — and it is absent from every ending screen. DECISION 067 |
| B59 | **Prose/number contradictions, round 2 — four quotable cards** | todo | *"Cost you in the locker room"* → **+1 OVR** ×2; *"Earned you credit"* → **−3 OVR** ×2. None carried the THIS CARD / EVERYTHING ELSE split that exists to prevent exactly this. **The +1 cases are the upside DECISION 063 deliberately preserved** — so this is a legibility fix, not an economy one. The −3 cases are different and may be B57 |
| B60 | **`Fall Camp Battle`: the button says "Win the job", the outcome says you panicked** | todo | Fired in **all three** careers. A label that reads as a promise resolving to −1. PM-sized prose fix under the 043/050 precedent, but check first whether it is the negative branch of an honest gamble |
| B61 | **A per-season locker-room trajectory is impossible today** | **CLOSED — do not build it** | `SeasonLine` records `overall` and not `character`. 043's agent was asked to propose and **recommended against it even as an engine change**: most careers would print the same phrase four times, which reads as broken rather than as an arc. Accepted. The ladder on the ending screen is the better answer to the same want |
| B51 | **Four orientation defects** — rail vs header OVR, rail runs a year ahead, phantom year 5, disabled START button lies | **in flight (038)** | All unambiguous, none a matter of taste |
| B52 | **`Next Man Up` tells an injured player to take every snap** | in flight (038) — proposal only | Missing `requiresPlaying`-class condition. Content, frozen |
| B53 | **Kicker is position-neutral outside its stat line and ~4 cards** — and finished **Round 3 Pick 8**, which the playtester called *"not a thing for a kicker"* | **USER** | **DECISION 059's falsifier has fired.** 037 measures the distribution |
| B54 | **`bowl-game-winner` arithmetic** — *"down two"* offered *"take the tie"* | **DONE (`17b5b2c`)** | DECISION 061. PM prose fix under 043/050 precedent |
| B55 | **Three low-character cards now fire ~0.06×/career for a good player** (`entourage`, `curfew-check`, `exit-interview`, gated `maxCharacter: 55`) | **CLOSED — rounding error (DECISION 065)** | 042 counted it: the band is **5 cards / 653 words**, **67.2% of ordinary careers** still read one, `humanLazy` reads it **2.08×/career**, and **100.0% of the corpus is reachable**. Nothing was buried. Fifth call this phase refuted by measuring it |
| B56 | **A career shows a player 12.3% of the authored prose** — 1,115 of 9,037 words. Ten careers at one position ≈26%, ten varied ≈39% | context, not a defect | The corpus is deep and each pass is shallow. Argues replay value is real, and warns that *"author more words"* is not automatically a way to be read |
| B57 | **1,413 words (15.6% of the corpus) sit behind options neither optimiser ever chooses** — `gym-grind:rest`, `the-knee:cart`, ~15 others, all strictly dominated | **USER** — balance | 2.2× the whole B55 band, and the single largest block of unread writing. **Must not be fixed by re-gating** — it is a draft-stock pricing problem. Bring it with a measurement |
| B58 | **A redshirt season has no content of its own** — 4.0 cards / 195 words from a 14-card pool, ~20% of a career | **aimed — wave 23** | DECISION 065. PM verified the 12 survivors by hand: **every one is an off-field temptation or a bust card.** No football card, nothing about redshirting. Needs DECISION 066's schema field first |

## Wave 18 — complete and committed (PM session 8)

Two lanes, file-disjoint. **The ending screen is held by the PM and out of bounds to both.**

| Brief | Agent | Owns files | Dispatched |
|---|---|---|---|
| `briefs/037-does-the-game-count-what-you-do.md` | research/measurement | `src/sim/**`, `reports/037-*.md` | 2026-09-15 |
| `briefs/038-where-am-i.md` | developer (UI) | `src/ui/**`, `reports/038-*.md` | 2026-09-15 |

**037 is the important one.** It adds a `humanLazy` policy that chooses by *authored intent* rather
than draft-stock score, and measures `good` vs `humanLazy` per position on undrafted %, round 1 %,
overall spread, and **award rates** — the number nobody has ever looked at. It decides B48, B49 and
B53, all three of which are user calls. It changes nothing: engine and content stay frozen, proposals
only.

**Uncommitted in the tree:** the B54 prose fix in `src/content/events/k.ts` (PM). Verification is
deferred to commit time **on purpose** — two agents hold in-flight work, so a test run now would
measure their half-finished state rather than the change.

### Wave 18 results — shipped in `17b5b2c`, `378e5c1`, `f345e1a`

**PM-verified before commit:** 671 tests green, both typecheck passes exit 0, build clean,
`src/engine/**` untouched, `src/content/**` limited to the authorized prose fix, and `npm run play`
**byte-identical to HEAD on 2 seeds × 2 policies** — checked in a detached worktree so the working
tree was never disturbed. Reports: `reports/037-*.md`, `reports/038-*.md`.

**Lane 038 — the four orientation defects, all fixed.** The important one is defect 1, and it went the
way the brief's second explanation predicted: **the value was right and the label was wrong.**
`enterOffseason` finalizes a season line at the overall it ended on and *then* applies development, so
the rail and the header were two different true quantities. Fixed by relabelling
`OVR AT SEASON'S END` → `OVR BEFORE THE OFFSEASON`, not by touching a number. The PM matched the
summary screen's column, which the agent correctly flagged and correctly did not touch.

- A new `LedgerRow.finished` flag lets a boundary row be current and finished at once — which also
  stopped a genuinely stale kickoff overall printing for a career that ends mid-season. `tentative`
  and its dashed-row CSS deleted as unreachable.
- **B52 has no content-only fix.** `requiresPlaying` only tests `redshirtSeasonActive`, not injury, so
  `Next Man Up` can tell a player in a walking boot to take every snap. The proposal is an engine
  change at `select-event.ts:37` affecting **~73 events** — a balance change, so it needs the user.
  The narrower alternative is a new `requiresHealthy` condition. **Not started.**

**Lane 037 — the measurement, and it inverted the phase's vocabulary.** See DECISION 062 for the full
table and the calls. The finding that matters most:

> **The policy this phase has called `good` is a jerk.** It takes a character-losing branch on 9 of 13
> off-field cards and ends at median character **41** — *"a problem they are managing"*. The policy
> called `lazy` takes the clean option on 5 and the virtuous one on 4. Draft-stock-optimal play is to
> misbehave, and **every bad-play number in waves 15–17 was measured on a bad player who behaves
> better off the field than the good one.**

### Two PM framings that the measurement corrected — worth not repeating

1. **B49 "the ending screen ranks backwards" was wrong**, and the PM wrote it up as the playtest's
   sharpest finding before checking. The playtester compared a **Kicker** with a field position, and
   All-American rates differ across positions by **more than 10×**. The gap they read as merit was
   position. **Holding that screen rather than fixing it was the only reason this did not ship as a
   wrong fix** — the hold is the transferable lesson, not the luck.
2. **B53 "the Kicker is too easy" is refuted as a difficulty claim.** Round 3 Pick 8 is the **centre**
   of K's distribution, and K is hard mode on every other axis. The complaint was **plausibility**;
   the cause is that `deriveDraftStock` has no position term. Closed and deferred — DECISION 062.

**That is four times this phase that measuring a complaint instead of implementing it changed the
answer.** B3, B5, B6, and now B49/B53. The habit is the house's most valuable asset.

## Wave 19 — complete and committed (PM session 8)

One lane, deliberately alone — a balance change cannot share a wave with anything that touches engine
or content, which is the wave-10, 13 and 16 lesson.

| Brief | Agent | Owns files | Dispatched |
|---|---|---|---|
| `briefs/039-misbehaving-stops-paying.md` | developer (content + engine, freeze lifted) | `src/content/events/offfield.ts`, the `allAmerican` band table, `src/sim/**` | 2026-09-15 |

Implements **DECISION 062's two user calls**: the `overall` gain comes off the `negativeOutcome`
branch of the 14 off-field blocks only, and All-American gets rungs above 85.

**The brief forbids tuning.** Acceptance is stated **per position** — `good` stays ≤1% undrafted
everywhere, `good`'s median character rises out of *"a problem they are managing"*, the All-American
gap widens beyond 72.2 vs 52.6, and **OL and K do not fall to near-zero**. A miss is reported, not
engineered away. Seed baselines move by construction (DECISION 040 precedent).

### Wave 19 result — it shipped exactly as specified and changed nothing. Commit `2ed2f9c`

`reports/039-misbehaving-stops-paying.md`. **The agent was told not to tune and did not.** The
honest miss is why wave 20 exists and is correctly aimed — this is the single best argument for the
no-tuning rule the phase has produced.

- `good` made the **identical pick on all 13 off-field cards**. Median character **41 → 41** at every
  position. Expected stock fell on all four edited options and **stayed above the clean option's
  0.00** everywhere.
- **The structural reason nobody predicted:** only **4** paired blocks sat on a caught branch;
  **17 sit on the branch where you get away with it**, which DECISION 062 deliberately kept. The
  upside the user preserved *is* where the economy lives.
- **What it did buy, invisible to the policy measurement:** the caught branch stopped paying +1 OVR,
  killing one of the four prose/number contradictions the 036 playtester quoted. **Change 1 fixed the
  legibility defect, not the economy defect** — the two had been conflated by 037, by the PM, and by
  062 itself.
- All-American rungs kept. Every position's good-vs-bad ratio improved (QB 1.37× → 1.66×). **K falls
  to 3.2% All-American, ~1 career in 31 — thin, and the thing to watch.**

## Wave 20 — complete and committed (PM session 8)

`briefs/040-getting-caught-has-to-bite.md` → `reports/040-getting-caught-has-to-bite.md`, commit
`bec5736`. **All four acceptance criteria pass.**

**PM-verified independently before commit:** 671 tests green, both typecheck passes exit 0, build
clean, and the content diff audited line by line — **six `character` amounts changed, all six on
`negativeOutcome` branches, zero `positiveOutcome` branches touched**, and no `overall`, probability,
condition or weight anywhere in the diff. The PM re-derived two of the six penalties by hand and both
reproduced exactly.

| | before | after |
|---|---|---|
| `good` median character | 40–44 | **61–65** |
| `good` at *"staff has stopped defending you"* | 12.7–19.1% | **0.0%** |
| `good` careers ending for a character reason | 24 per 3,000 | **0** |
| `good` undrafted | 0.2–0.5% | 0.2–0.5% |
| `good` round 1 | — | **−1.1 to −5.5pp**, median round unchanged |

- **Six of thirteen cards flipped their pick.** The penalties were **derived, not searched**:
  `a > [p·S(pos) − S(alt)] / (0.15·(1−p))` from the shipped `optionScore`, with one further point
  where the bound hit an exact integer and the strict-`>` tiebreak kept the incumbent.
- **`humanLazy` now bottoms out at median character 0** and busts ~9pp more often. The locker-room
  ladder finally has something driving it.
- **Round 1 fell and was deliberately not protected** — DECISION 063 reversed that criterion, because
  the figure was partly purchased by cheating.

### The side effect worth not rediscovering — and it is DECISION 051's pattern again

Three cards (`entourage`, `curfew-check`, `exit-interview`) sit on `ride-it-out`, a `probability: 1`
option with **no `negativeOutcome`**, gated behind `maxCharacter: 55`. Because `good` now rarely falls
that low (**90.4% → 12.6%** of careers), those three fire **~0.06× per career instead of 1.0×**.

**This is correct behaviour, not a bug** — content written for a player whose standing is in the tank
should not fire for a player whose standing is fine. But it is the third time this phase that a
correctness fix has quietly shrunk an event pool (DECISION 051: a redshirt season's pool fell 81 → 12).
**Logged as B55.** The content authored for a bad character arc is now mostly seen only by players
having one, which is either good design or buried writing depending on how much of it there is — and
nobody has counted.

## Wave 21 — in flight (PM session 9)

Two lanes, file-disjoint. **No code ships while the playtest runs** — a build that changes under the
player invalidates the run. Lane 042 is a pure measurement that edits nothing and adds only new,
unimported files under `src/sim/`, so the running app cannot change underneath 041.

| Brief | Agent | Owns files | Dispatched |
|---|---|---|---|
| `briefs/041-does-the-game-count-what-you-do.md` | playtester | `reports/041-*.md`, `PLAYTEST-LOG.md` | 2026-09-15 |
| `briefs/042-how-much-of-the-writing-does-a-player-see.md` | research/measurement | `src/sim/**` (new files only), `reports/042-*.md` | 2026-09-15 |

**Baseline verified by the PM before dispatch:** 671 tests green, tree clean at `e6e47a4`, dev server
serving 200 on 5173.

**041 is the wave.** The economy changed in waves 19–20 and no player has seen it. The shaping is
deliberately narrower than 036's: career 2 plays **hard on the field and selfishly off it** — the
ticket hookup, the NIL money, ghosting the media — rather than 036's blanket "lazy at everything."
That isolates the exact domain waves 19–20 repriced, and it is the only shape that can tell us
whether the cost now routes through the locker-room ladder in a way a player *feels in the moment*.
Career 1 is a straight baseline; career 3 is a Kicker (3.2% All-American, the thin position nobody has
seen an honours-free ending for). The headline question is the sentence 036 lost on, asked verbatim:
**does the game count what you do?**

Three things carried into 041 from prior failures, all deliberate:

- **The write-after-each-career rule** the wave 17 postmortem demanded. It is in the brief as its own
  section, framed as *when* to write rather than as a priority at the end — which is how 036's agent
  read the old wording, and why it nearly lost two careers.
- **Claim 4 forbids cross-position comparison of endings.** That is the exact mistake that produced
  B49, which the PM wrote up as the playtest's sharpest finding and which 037 then refuted. The brief
  names it so it cannot recur.
- **Struck to buy room:** skimming onset (settled), type/colour/contrast (five playtests, zero
  defects), and B43's redshirt-year question (already confirmed, fix queued).

### Lane 042 — done and committed. It refuted its own premise, and found the hole somewhere else

Report: `reports/042-how-much-of-the-writing-does-a-player-see.md`. **DECISIONS 065 and 066.**
**PM-verified before commit:** 684 tests green (671 + 13 new in `src/sim/prose-probe.test.ts`), both
typecheck passes exit 0, build clean, `src/engine/**` and `src/content/**` untouched in `git status`,
and **byte-identical to HEAD on 2 seeds × 2 policies** by the DECISION 064 worktree method.

- **B55 is closed as a rounding error.** 100.0% of the 9,037-word corpus is reachable; 67.2% of
  ordinary careers read a `maxCharacter: 55` card; only 410 words (4.5%) are out of a good player's
  reach and **358 of those are the bust cards**, which is their entire purpose. **Fifth call this
  phase refuted by measuring instead of implementing** — B3, B5, B49, B53, B55.
- **The headline nobody had ever measured: a career shows a player 12.3% of the prose.** Logged B56.
- **The hole is the redshirt season, and the PM verified it by hand rather than taking the report's
  word.** 81 → 12 reproduces exactly, and listing the twelve survivors makes it sharper than the
  report put it: gambling, skipping the install, a ticket hookup, catfished, a speeding ticket, a
  curfew, ghosting the media, an exit interview, a watch list, a coaching carousel, a failed drug
  test, an arrest. **Not one football card, and two of the twelve are ways to bust.** The engine
  promises "scout team and the weight room" in 44 words and then deals four cards about your phone.
  Logged B58.
- **The largest block of unread writing is not behind a gate at all** — 1,413 words sit behind
  strictly dominated options. That is draft-stock pricing, not gating, and it is a user call. B57.
- 042 asked for the metrics to hold an authoring wave to, and **explicitly warned that "% of corpus
  read" is the wrong target** — authoring grows the denominator, so a successful wave can lower it.
  Use its table instead: distinct cards/career, sit-season pool size, cross-replay collision ≤17%.

**042 answers next-actions item 5 before anyone authors a word.** Three correctness fixes have now
shrunk event pools (DECISION 051's 81 → 12, and B55's 90.4% → 12.6%) and nobody has counted the cost
once. It asks for the headline the phase has never had — *what percentage of the authored prose does
one career show a player* — and it is explicitly permitted to conclude "rounding error, go author new
content." Either answer saves a wave, which is why it is worth running now rather than after B44.

### Wave 21 result — lane 041, the playtest. It withdrew the charge the whole wave was built to answer

Report: `reports/041-does-the-game-count-what-you-do.md`. Three careers, 46 + 40 + 48 decisions,
**written to disk after each one — the wave 17 postmortem's rule worked and should stay in every
playtest brief forever.**

**The north-star curve: yes → no (asked) → no.** Still not won. But read the two "no"s, because they
are not the same animal and neither is the wave-17 "no":

- C2: *"No, but I did it because you asked — and not because of the shape of the run. Playing the jerk
  was the most **fun** I had and the writing on those cards is the best in the game. It is that I
  found out the villainy was free."*
- C3: *"No. A softer no — the kicker was the most interesting run of the three and I finished it
  wanting more kicker cards. **If the ending screen had a locker-room line on it I would start a
  fourth right now to try to move it.**"*

**The correction that reframes the phase — the playtester volunteered it, unasked.** They do **not**
think *"the game isn't counting what I do"* is still true: the redshirt, the shrinking transfer menu
at low OVR, the four-tier ladder, MOMENTS and the per-season delta column all visibly counted them.
**The defect is narrower and sharper: the one track the game narrates most is the one it shows least,
and it is absent from every ending screen.** DECISION 067, and it is now B50 at the top of the board.

**The PM measured before briefing, and the measurement changed the fix.** A selfish career
(`humanLazyAmbitious`, 400 careers) ends at average character **6.8**, p25 **0**, 99.3% under 55,
against `good`'s **62.3** — it crosses every rung in the table. The ladder has the full range; the
player cannot see it move, because the per-card line is direction-only by design and the only state
display is five bands 15–30 points wide. **Six "Cost you in the locker room" verdicts, one phrase
change, on the final click, unhighlighted.** Widening the deltas would have been a wrong fix to a real
complaint. Sixth time this phase.

| Claim | Verdict |
|---|---|
| Getting caught costs you something you can see | **REFUTED as state, CONFIRMED as prose** — see above |
| The card's number agrees with its words | **REFUTED — four quotable cards.** B59 |
| You always know where you are | Clean — wave 18's four fixes held |
| Each ending matches its own career | Held. The Kicker's *"Undrafted / No team called."* matched honestly |
| The program's opinion is something you track | **REFUTED as stated** — they tracked it because they went looking |
| Anything cut off or colliding | **Zero visual defects in ~130 decisions.** Sixth playtest running. Type/colour/contrast stays closed |

**The Kicker is vindicated and B53 is fully closed.** *"A different career, and the best-served
position I played"* — five bespoke cards against one for offensive skill over four seasons — *"
interrupted by generic cards that read worse on a kicker than on anyone else."* The position that two
sessions ago was suspected of being too easy and too thin is the one the playtester wanted more of.

## Wave 22 — in flight (PM session 9)

Two lanes, file-disjoint: one owns `src/ui/**`, the other owns two named files under the frozen
directories and nothing else.

| Brief | Agent | Owns files | Dispatched |
|---|---|---|---|
| `briefs/043-the-ladder-the-game-narrates-but-never-shows.md` | developer (UI) | `src/ui/**`, `reports/043-*.md` | 2026-09-15 |
| `briefs/044-a-card-can-say-it-is-for-the-season-you-sit.md` | developer (engine + schema, DECISION 066 lift) | `src/engine/select-event.ts`, `src/content/schema.ts` + tests, `reports/044-*.md` | 2026-09-15 |

**043 is the wave**, and it is the cheapest top item the board has had: the data already exists, the
view model already computes `trust`, and `SummaryScreen.tsx` simply never renders it. The brief
forbids any integer, bar, meter or magnitude-encoding — DECISION 002 is not reopened and 046 already
rejected magnitude-as-typography on this exact axis. It also explicitly **forbids** the per-season
trajectory, because the PM checked and `SeasonLine` has no `character` field (B61).

### Lane 044 — done, awaiting commit with 043. Inert, and the proof is not vacuous

Report: `reports/044-a-card-can-say-it-is-for-the-season-you-sit.md`. **8/8 byte-identical**, 693 tests
(684 + 9 new), both typecheck passes, build clean. **PM audited the diff line by line:** 131 lines,
**all additive**, across exactly five files, zero cards authored, no probability/weight/effect touched.

- **The pass is not vacuous and the agent proved it rather than asserting it** — the 8 outputs are
  mutually distinct and **6 of the 8 careers ran five seasons**, so the new clause is evaluated inside
  a live sit season on most runs and still moves nothing. That is the difference between "the check
  passed" and "the check could have failed."
- **One deviation, flagged and not buried, and the agent was right.** The brief said the field goes in
  `schema.ts`; `EventConditions` actually lives at `src/engine/types.ts:78`. **The brief named the
  wrong file.** The agent put the one-line optional field where the type is, rejected module
  augmentation as worse, and said so. Type-only, erased at compile, covered by the 8/8. **Accepted.**
- **The contradiction question, ruled and implemented:** both flags together is unsatisfiable by
  construction, so it is now a schema error worded to match the existing `minOverall > maxOverall`
  precedent — and the engine selects nothing in *both* season types rather than letting one flag win,
  so an impossible card can never look like it worked.
- A new schema test asserts **zero shipped cards set the field**, as a standing property. That is the
  lift's premise turned into a test so it cannot rot before the pack wave — the DECISION 064 habit,
  applied without being asked.

**One follow-up the pack wave must not lose:** `src/sim/prose-probe.ts:407` (`gatesOf`) enumerates
gate labels by hand and has no arm for `requiresRedshirt`. **The first sit-season card authored will
be silently under-reported by the prose probe until one line is added there** — and the prose probe is
the instrument the pack wave's acceptance is measured on. Fix it in the same wave as the pack.

**044 is inert by construction and that is its acceptance test** — byte-identity on 4 seeds × 2
policies, reported as eight explicit results, with "a single difference means stop and report
`needs-decision`, do not adjust the clause to make it pass." It unblocks the redshirt pack without
authoring a word of it.

### Wave 22 result — shipped in `5ce88c5` and `c4c4487`. Both lanes did better than their briefs

**PM-verified before commit:** **698 tests green** (671 → 684 → 693 → 698 across the two waves), both
typecheck passes exit 0, build clean, and **byte-identical to HEAD on 4 seeds × 2 policies with all 8
outputs mutually distinct** — the non-vacuous form of the check, by the DECISION 064 worktree method.
The engine lift is committed **separately** from the UI so the freeze lift stays reviewable on its own.

**Lane 043 — the ending screen got a ladder, not the line the brief asked for, and the agent was
right.** All five rungs render in order with the one the career ended on filled in and tagged *"You
ended here."* The reasoning, which is better than the brief's: *what a rung has that a phrase does not
is four other rungs — the building could have thought something else about you, and here is what.*
That is the read that makes a fourth career worth starting, and it is still only position-in-an-order,
never distance.

- **The no-number constraint is enforced structurally, not promised.** `trustMove()` returns only
  `"up" | "down" | null`, so a three-rung fall and a one-rung fall are **literally the same value**
  (asserted in a test); the card freezes the band **phrase** (`Resolved.trustBefore: string | null`),
  never a `character` integer, **so the arithmetic that would produce a distance is not available to
  any screen** — nothing subtractable reaches `localStorage` either. This is the right way to hold
  DECISION 002: make the violation unrepresentable instead of forbidden.
- **No accent colour in the new work, and the agent said why:** gold on *"the staff has stopped
  defending you"* would put a trophy treatment on the worst outcome in the game — DECISIONS 021/032
  inverted. Nobody asked it to check that.
- One deliberate deviation, flagged: the previous rung is derived from the pre-`advance` state rather
  than from the card's character delta as the brief suggested, **because recovering that delta would
  have meant widening `CardAccount` with a character magnitude — the one thing the task must not
  create.** The brief's suggested route was the unsafe one. Accepted.
- Verified by playing a full career to a Round 3 Pick 16 ending, catching a live rung fall mid-career,
  exercising the `up` path, and checking a 360px frame.

**Both lanes rejected something they were asked to consider, on reasoning, and both were right.** 043
recommended against B61's per-season column; 044 rejected the brief's file placement. **A wave where
two agents push back on the brief and the PM accepts both is the wave working as designed** — the
alternative is a PM's guess executed faithfully into the tree.

## Wave 23 — complete (PM session 10)

Two lanes, file-disjoint. One is a browser playtest of the live build; the other implements nothing
at all and prototypes in a throwaway worktree, so the served tree does not move under the player.

| Brief | Agent | Owns files | Dispatched |
|---|---|---|---|
| `briefs/045-the-fourth-career.md` | playtester | `reports/045-*.md`, `PLAYTEST-LOG.md` | 2026-09-15 |
| `briefs/046-is-the-redshirt-actually-a-free-yes.md` | measurement + proposal | `reports/046-*.md` only | 2026-09-15 |

**The order was changed from session 9's list, and DECISION 068 says why.** Session 9 left
B43 → pack → playtest. Session 10 runs playtest ‖ B43-measurement and leaves the pack unauthored.
Wave 22 is committed and **no player has seen it**; authoring the pack first would put the next
playtester in front of two changes at once, which is the attribution error DECISION 066's own rule
exists to prevent. The pack is also the biggest spend left on the board and it is downstream of a
question answerable this week for the cost of one playtest.

**045's instrument is new and it is the point of the brief.** Two careers are assigned — one
straight, one deliberately selfish — and **the third is not.** At career 2's ending screen the
playtester answers *"do I want to play again right now, and what am I going to try to do
differently"*, writes it down, and then acts on their own answer, including *"no."* Every previous
playtest assigned three careers and then asked whether the player wanted them, which destroys the
measurement this phase is defined by. DECISION 067's falsifier rides on it, and the 041 playtester's
prediction — *"if the ending screen had a locker-room line on it I would start a fourth right now"* —
is now testable, because wave 22 shipped exactly that line. The brief never names the ladder; it asks
whether anything **besides the rating** was being tracked, so a *"no, just the rating"* is reachable.

**045 also explicitly parks the redshirt** — two playtesters have already called the offer a free
yes, it is confirmed, and re-asking would spend words on a closed question. The one exception is a
single line on whether a sat season felt like *a season* or *a gap*, which is the pack's premise.

**046 implements nothing.** B43 is a balance change; under the engine freeze that is the user's call,
and DECISION 066's lift was spent on `requiresRedshirt` alone. The brief measures the status quo
first (Part 1, written to disk before Part 2 begins) and asks whether the complaint is even true —
`developmentDelta` cannot return a negative number, so a sit season may cost nothing, in which case
the gamble has no stake regardless of when it resolves. Four routes are priced including **R0, change
nothing and fix the telling**, and the deliverable is a table plus an acceptance criterion stated in
advance so the implementing wave can report a miss instead of tuning until it passes.

### Done by the PM directly, committed as `808fb99`

`src/sim/prose-probe.ts:421` — `gatesOf` now has an arm for `requiresRedshirt`. Session 9 flagged
that the first sit-season card authored would otherwise be **silently under-reported by the exact
instrument the pack is measured on**. One additive line; 698 tests green, both typecheck passes exit
0, build clean, and `npm run play` byte-identical to HEAD on seeds 1337 and 424242 by the DECISION
064 worktree method (both sides recomputed, no transcribed hash trusted). No shipped card sets the
field, so the new line does not execute yet — the check is real but not yet non-vacuous, and the pack
wave is what makes it fire.

### Wave 23 result — the falsifier did not fire, the display worked, and it uncovered the real defect

**045 — the playtest. Three careers, ~107 decisions, and the third one was not assigned.** Curve:
**yes → yes (to check something specific) → no.** DECISION 069 has the full reading; the short form:

- **DECISION 067's falsifier did not fire.** The ladder was tracked constantly, all five rungs quoted
  back, and the six-rung ending list with *"YOU ENDED HERE"* called **"the best element in the game."**
  The delta banner caught **every** standing change across three careers.
- **The unassigned third career happened, and the 041 prediction came true verbatim.** The player
  reached career 2's ending, was asked, answered *"yes — but narrow... there is one line I have never
  reached and I want to find out if it is reachable,"* and then played a fourth-wall-free controlled
  experiment to reach the top rung. **Nobody asked them to.** That is the north star's mechanism,
  bought with one display wave. Keep the unassigned-third-career instrument — it works.
- **The experiment came back negative, and that is the wave's real output.** A maximum-virtue career
  finished **one rung below where it started**: zero *"Earned you credit"*, five *"Cost you."*
- **The "no" is conditional and it names its own fix:** *"If a fix makes the team-first branch reliably
  pay — even a little, even invisibly-but-consistently — I would come straight back, because the thing
  the ladder promises is genuinely the best idea in this game."*
- Also good, and worth protecting: THIS CARD / EVERYTHING ELSE (*"I never once had to wonder where a
  point came from"*), *"The OVR comes back when the injury heals"*, `ACROSS N SEASONS, 54 → 85`, and
  *"All-America caliber"* stacked over *"the staff has stopped defending you"*. **Zero visual defects
  at 1470px across three careers — the seventh playtest in a row to find none.**

**046 — the redshirt measurement. Part 1 complete and on disk; the agent was killed by a session rate
limit partway into Part 2 (routes R1–R3 are unpriced).** Part 1 alone changed the plan — see DECISION
071. Its headline refutes the brief's premise, and it found a bug nobody asked for.

### The PM's own measurement, and it corrects the playtester's diagnosis — DECISION 070

The playtester said *"the good-teammate branch is a coin flip."* **The observation is real; the
diagnosis is wrong, and the difference is the whole fix.** A pass over all 106 events / 199 options:

- **Virtue is not a coin flip.** 42 options whose success branch pays character: mean **E[character]
  +2.35** at mean probability **0.81**; only 3 of 42 are non-positive. Selfish options average
  **−3.14** character for **+1.29** OVR.
- **The opportunity is flat across all six positions** (23–26 virtuous options each, mean E ≈ +3.2).
  The DECISION 058 per-position check was run and found nothing.
- **The defect is one-button cards.** Of 18 single-option cards, **7 move character and all seven can
  only move it down. Zero can move it up.** Five of those seven are the `milestone-opener-*` Season
  Opener cards, which **B11 established fire in 100% of careers, one per season**, each `+0/−2` at
  p=0.75. **Every career, every season, draws a guaranteed no-choice card that can cost standing and
  never earn it.**

**So the guaranteed traffic is a one-way tax and the earnable credit is stochastic.** That is why a
maximum-virtue career can end below where it started while the corpus says virtue pays. **Do not widen
virtuous payouts** — that is the fix the report as written would have bought, and it would have left
all seven one-way cards in place.

### New backlog from wave 23

| ID | Item | Status | Notes |
|---|---|---|---|
| B62 | **Seven one-button cards can only cost standing; zero can earn it** — five are the Season Opener milestones and fire in 100% of careers | **MEASURED — DECISION 070. Top of the board** | *"Being punished for something you were not asked about is the only thing in this game that felt unfair rather than hard."* **The target is the no-choice cards, not the virtue economy.** Content-economy change → user |
| B63 | **The redshirt trapdoor** — `advance.ts:251` counted a ~25-snap sit season as a "buried" season, so an injured freshman who then redshirted was busted **100%** of the time at overall ~64 | **DONE — DECISION 072, committed** | User chose *skip*. One clause; `SeasonLine.redshirt` was already recorded. Bug reproduced in a failing test first. **Side effect, stated not buried: the "Buried on the depth chart" ending is now nearly extinct (0.03% good/QB) — ~95% of it was redshirts being misread as benchings.** Ordinary bust rate 6.72% → 5.67%; the game stays losable |
| B64 | **The season ledger disagrees with the season the player played** — a cluster, all from 045 career 3 | todo — needs a debugging lane | SR recorded **9-3, 0 snaps, 87 overall, +15** after a season the player played through; header read **"0 snaps — 2 Sacks Allowed"** for four screens; **"A season on the sideline cost you ground" (−4) while the sidebar scored the year +15**; final overall 83 vs the row's 87 |
| B65 | **Stats mutate after a season closes** | todo | Season 2 finished at **47 Pancakes**; the next screen said **46** for the same completed season; the ending screen says 46. Snaps seen decreasing **308 → 300** |
| B66 | **Effects with no card** | todo | *"You got hurt between decisions"* attached to a −3/−4 with no screen and no injury, twice. Once with two contradictory explanations in one line: *"An injury healed and gave the points back. You got hurt between decisions."* |
| B67 | **MOMENTS silently skips seasons** | todo | Career 3 skipped season 3; career 2 skipped seasons 2 and 4. No placeholder — the season just is not there. Note 011 deliberately groups by season, so a missing group is a hole in that grouping |
| B68 | **Signing Day gives three options the same reason** | todo | Career 3: North Texas, Bethune-Cookman **and** San Diego State all read *"— the two-deep is thin"*. *"More confusing than no reason at all."* Compare B4/B16 |
| B69 | **Staying gets no ceremony** — claim 5 PARTIAL | todo | Transferring now gets a card; **staying** produces nothing at all. B16's other half |
| B70 | **Two prose/number contradictions reproduce deterministically** across careers and positions | todo — **merge into B59** | *"Win the job"* → *"pressing looks exactly like panicking on film"* → **−1 OVR**; *"Stay on campus and train"* → *"in August it shows that you did"* → **cost + −1 OVR**. Not bad luck — the same text and sign both times |
| B71 | **Does standing do anything?** — still invisible after three careers | todo | Career 2 ended on the bottom rung and still went round 3 with a Washington offer; career 3 ended mid-ladder, also round 3. *"If it is wired to something, the player cannot see it; if it is not, then the best-written thing in the game is scenery."* It **is** wired (±7.5 draft stock) — so this is a legibility item, and it is the natural companion to B62 |

## Wave 24 — complete and committed (PM session 10)

**B63, the redshirt trapdoor. The user was asked *skip* vs *break the streak* and chose skip.** Done
by the PM directly — it is one clause and the decision was already made. Full numbers in DECISION 072.

- `advance.ts:251`: `s.seasons.slice(-n)` → `s.seasons.filter((line) => !line.redshirt).slice(-n)`.
- **The bug was reproduced in a failing test before it was fixed**, and a second test pins the *skip*
  semantics against *break*: a redshirt cannot launder a buried season on the other side of it.
- **700 tests** (698 + 2), both typecheck passes exit 0, build clean.
- **`npm run play` byte-identical on 12 seed/policy pairs, all 12 mutually distinct** — but this fix
  is *supposed* to move ~1.6% of careers, so identity alone would have been the vacuous kind of pass.
  A differing seed was hunted: **113/best was busted `"Buried on the depth chart"` at overall 73 and
  now runs to overall 82 before busting as `"Ran out of rope with the staff"`.**
- **The side effect, stated rather than buried:** the buried-washout ending drops to ~0 everywhere
  (good/QB 1.67% → 0.03%). It was ~95% artifact. The game does not get less losable — ordinary play
  still busts 5.67% and a badly-behaved career 35.00% — because the character spiral and the overall
  collapse were always carrying it.

## Wave 25 — in flight (PM session 11)

Two lanes, file-disjoint, and deliberately two rather than three — DECISION 068's successor rule about
the session rate limit that killed 046 mid-task. Both lanes carry the "write findings to disk before
moving on" rule for the same reason.

| Brief | Agent | Owns files | Dispatched |
|---|---|---|---|
| `briefs/047-does-virtue-actually-pay.md` | measurement + proposal | `reports/047-*.md` only; prototypes in a detached worktree | 2026-09-16 |
| `briefs/048-the-ledger-disagrees-with-the-season.md` | debugging + fix | `src/ui/**`, `reports/048-*.md` | 2026-09-16 |

**047 is the falsifier DECISION 070 wrote against itself.** The corpus says virtue pays +2.35 at
p=0.81; the 045 playtester's maximum-virtue career saw zero *"Earned"* lines and five *"Cost."* One of
those is not describing what happens, and the realized-frequency sweep settles it before B62 goes to
the user. The brief states explicitly that a refutation — an ordinary good career *does* see more
Earned than Cost, so 045 was unlucky rather than structural — is a fully successful outcome that
shrinks B62 to a variance/legibility item. It also flags that `good` uses `events: "best"`, which is
**not** "always be a good teammate", and requires a virtue-maximising strategy be added **in the
worktree** as a fourth cell, because without it Part 1 does not measure the career the playtester
actually played. Part 2 prices DECISION 070's three routes (symmetrise / make them choices / strip the
effect) against `bustedRate` and the badly-behaved profiles, because a route that makes standing
harder to lose helps the antisocial player too. **Widening virtuous payouts is explicitly off the
table** per DECISION 070 and 063.

**048 is B64–B67 as one debugging lane, not four tickets.** They are all the season ledger and the
*"0 snaps on a season I played"* symptom is the thread — a wrong snaps count would explain the wrong
overall delta, the wrong standing phrase, the "sideline" verdict on a played season, and possibly an
empty moment group. The brief names `view-model.ts:766-770`'s own comment (*"null is the absence of a
number, never a zero"*) as the shape of the headline symptom, and warns the agent **not** to "fix"
B64 by hiding low-snap seasons, because wave 24 just made redshirt seasons legitimately low-snap. If
the cause is in `src/engine/**` the lane stops at a reproduction plus a proposal and reports
`needs-decision` — the freeze holds, and a reproduction is a successful outcome.

### Wave 25 result — three UI bugs fixed, one diagnosis refuted, and the falsifier fired

**048 — the ledger lane. Committed as `fa399fd`. 708 tests.** B64–B67 are **four** bugs, not one:

- **B64/B65 are one bug and it is not a mutation.** The rail printed season N's *heading* over season
  N−1's *figures* on **every offseason screen of every career** (3,985 screens / 360 careers). The
  reported *"stats mutate after a season closes"* was the rail switching which season it described
  without saying so. The mutation hypothesis was **tested and refuted** — zero closed-line mutations in
  360 careers; `schema.ts:326` rejects offseason `stat`/`snaps` effects outright. Recorded so nobody
  reopens it.
- **B66** — `remainderFacts.hurt` counted suspensions as injuries, so a card that suspended you printed
  *"You got hurt between decisions."* The *other* source of that sentence is the `wideOpen` trait's
  ambient injury (108/360 careers), where the sentence is **true** and naming the trait is forbidden.
  Correctly left alone.
- **B67** — `groupMoments` walked moments rather than seasons, so a season with nothing in it vanished
  (172/360 careers). A quiet season now gets a row that says it was quiet.
- CSS used existing tokens only; no new colour, size or row. `npm run play` byte-identical to HEAD on
  **12 seed/policy pairs, all 12 mutually distinct**, both sides recomputed in a detached worktree.

**B64's fourth bug — the engine one — was escalated, approved, implemented, and then reverted. See
DECISION 073, and read it before touching B64 again.** 048 named `effects.ts:61`'s snap clamp. The
symptom repro was right; the mechanism was inferred from source, not measured. The PM's non-vacuous
check — the change was *supposed* to move 0.035% of rows — found it changed **nothing**: 29 bad rows
before, 29 after, across 56,481 season rows, and instrumenting every snap-effect application showed
**the clamp never touched one of the 29.** The real cause is one of the **123 authored `stat` effects**
in `src/content/events/**` landing production on a line with no playing time (`oskill.ts:108` matches an
observed row verbatim). **B64 is reopened with the cause correctly located, and it is now a
content-semantics question for the user, not a one-line clamp.**

**047 — the virtue sweep. Complete on disk; the agent stalled on hand-back *after* writing everything.
No re-dispatch needed.** DECISION 074 has the full reading. The short form:

- **DECISION 070's falsifier fired.** A genuinely virtuous career sees **2.71 Earned vs 2.13 Cost**.
  The `good` profile sees **1.42 vs 4.34** — and `good` is **not a good teammate**, it is a draft-stock
  maximiser worth **−8.04 expected character per career**. Every report from 018 on has called it *"the
  player who plays well."* **The name has been carrying an unearned claim through a dozen reports.**
- **The playtester's 0-Earned/5-Cost tally occurs in 0.26% of max-virtue careers and 10.60% of `good`
  careers — 40× more consistent with optimising overall than with playing team-first.**
- **B72, and it outranks the brief that found it:** on **34 of 60** character-differentiating events the
  most-virtuous option is **strictly worse on the only number the game shows**, by a mean 0.91 OVR. A
  player steering by the visible signal takes the corrosive branch on the majority of character cards
  *without intending to*, then gets a moral verdict printed on each one.
- **R2 recommended, R1 rejected on measurement** (it would hand +6.0 character/career to everyone
  unconditionally, against a virtuous career's entire realized budget of +4.85). Full route table in the
  report; the escalation is below.
- Recommends adding a `virtue` event strategy permanently (Appendix A) — **not applied**, diff is in the
  report.

### New backlog from wave 25

| ID | Item | Status | Notes |
|---|---|---|---|
| B64 | **A played season can store `snaps: 0` beside a live stat line** | **reopened — cause relocated, DECISION 073.** With the user | Not the clamp. One of 123 authored `stat` effects landing on a line with no playing time. Downstream: ledger row, the −4 upperclass decline, the *"season on the sideline"* verdict, and lost draft stock |
| B72 | **A card can cost standing without signalling standing was on the table** — 34 of 60 character cards make the virtuous option strictly worse on the only visible number | **MEASURED — DECISION 074. Ranks with B62** | Legibility, not balance. **Run the cold label audit before authoring R2's prose** — if it fails, R2 is still correct and still will not close the complaint |
| B73 | **`good` is misnamed** and a dozen reports lean on it | todo — cheap | Rename/retire, or add the `virtue` strategy beside it (047 Appendix A). Any baseline quoting `good` as "plays well" is describing a stock-maximiser |
| B75 | **The four expensive off-field cards are a balance question, not a display one** — *Portal Rumor*, *Entourage*, *Exit Interview*, *Bed Check*; −2.7 net draft stock on option C | todo — **user** | They carry 3.54 of the 0.91 mean OVR gap between them. The auditor read all four **perfectly** — legible, cued, correctly named — and the player is charged ~3 overall anyway. **Display work will not touch this** |
| B76 | **The effort inversion** — on 22 of 34 cards character rewards the lower-effort branch, against the convention `offfield.ts` states in its own header | **MEASURED — DECISION 075. With the user** | One currency carrying two authored meanings. Delete the 22 sub-3 character effects (cheap, costs ≤0.22 draft stock) or rewrite so character tracks integrity. `kickoff-duties-too` is mandatory either way |
| B77 | **`Family Business` narrates a locker-room verdict for a scene with no locker room in it** | todo — **user**, 1 card | −4/−23 character over NIL money and a cousin. The single unambiguous B72 case in the corpus; highest value per word on the board |
| B78 | **The invisible thing is forgone *credit*, not hidden cost** — on 10 of the 34, taking the best-OVR option prints no line at all while the player gives up +1 to +2 character | todo | *"You cannot learn a rule you are never shown missing."* The auditor considered a forgone-credit line (R5) and **recommends against it**; the item is kept because the diagnosis outlives the rejected remedy |
| B74 | **OL is the worst position on the virtue axis** — fewest virtuous options offered (2.87/career vs DL 3.84), only position with a negative median character delta under max-virtue play | todo | Every route helps it least |

**Not dispatched this wave, on purpose:** 046 Part 2 (routes R1–R3 unpriced) and the redshirt pack.
Both are live and both are below B62 and B64 per session 10's re-ranking. 046 Part 2 is a third
measurement lane and the rate-limit rule says two.

## Wave 26 — in flight (PM session 11)

**Both of wave 25's escalations went to the user and both came back on the recommended route.**
B62 → **R2**, and B64 → **measure the routes first, do not fix yet**. Two lanes, file-disjoint.

| Brief | Agent | Owns files | Dispatched |
|---|---|---|---|
| `briefs/049-the-season-opener-becomes-a-decision.md` | content authoring + measurement | `src/content/events/milestones.ts` + its test, `src/sim/policies.ts`, `reports/049-*.md` | 2026-09-16 |
| `briefs/050-can-a-player-tell-which-option-the-locker-room-is-watching.md` | blind audit | `reports/050-*.md` + scratchpad phase files only | 2026-09-16 |

**049 is the first authorised lift of the content freeze, and it is narrow:** a second option may be
added to the five `milestone-opener-*` events and **nothing else**; existing options are untouched, so
no existing prose is rewritten and no existing assertion changes. The brief carries 047's pre-stated
acceptance criterion verbatim and **requires 10,000 careers per cell rather than 047's 3,000**, because
one cell (`baselineRandom/QB` bustedRate, 4.83% against a ≥5.00% floor) is a known 0.17pp miss inside
two standard errors at the smaller sample. **A miss is reported as a miss**; the named repair is a
character cost on the new option's failure branch, **not** a loosening of the losability floor. The
brief also warns that five near-identical new options would be a B11 regression — these five cards are
the exact spine that fires every season.

**050 is a blind audit and the blind is the thing that makes it evidence.** Three phases, each written
to disk before the next begins: extract what a player sees (labels and prompt only — no effects, no
EV), judge cold, *then* reveal and score. It carries an **unmarked control group** of cards where the
virtuous option is *not* worse on OVR; if the 34 and the controls flag at the same rate, B72 is refuted
and the difficulty is general. Remedies must live inside the constraint that EV, probability and a
character number can never be shown — the interesting space is prose and framing, and this project has
a strong precedent that the fix for an invisible mechanism is display, not balance.

### Lane 050 — done. It refuted B72, and corrected two numbers the PM had written into DECISION 074

**Full reading in DECISION 075. The blind held and the control group is what made it evidence.**

- **B72 is REFUTED.** Flagged as standing decisions: **58.8% of the 34 vs 46.2% of the unmarked
  controls** — indistinguishable at n=60 (p≈0.33) and pointing the *wrong way*. Label-cue rate dead
  flat; "silent traps" were **more** common among the controls.
- **The 34 was never one population.** On the **12 real moral forks (spread ≥3): 11/12 legible cold,
  12/12 on naming the rewarded branch.** On the **13 flavour nudges (spread <1.5): 4/13** — worth ≤0.22
  draft stock. **The hard-to-read cards are the ones where nothing is at stake.** Re-run the source
  measurement with a ≥3 character floor; every number downstream of "34 of 60" inherits the conflation.
- **074's central inference was partly circular** — on the 34, an OVR-steering player prints 0 "Earned"
  *by construction*, because that is how the set was defined. Against the controls the same player earns
  credit 34.6% of the time. The playtester's tally is still real and still needs explaining; it is not
  evidence for this mechanism.
- **The finding nobody asked for, and the one to act on: an effort inversion.** On **22 of the 34**,
  character rewards the **lower-effort** branch, contradicting the convention `offfield.ts` states in
  its own header. **PM-verified reductio:** `kickoff-duties-too` credits *"Ask them to find someone else
  for kickoffs"* **+1 character** and gives *"Take both jobs and don't complain"* **none**. (Stated
  precisely: the game does not charge you for taking the work, it credits you for declining it.)
- **Exactly one card is a true B72 case, PM-verified:** `Family Business`, **−4/−23 character** for
  letting a cousin manage NIL money, **with no locker room anywhere in the scene.**
- **`src/ui/session/view-model.ts` is not touched by any in-flight lane**, so R1 is free to dispatch.

### Lane 049 — done and committed as `ae03d50`. All eight acceptance cells pass at 10,000 careers

**The first authorised lift of the content freeze, and it held its own pre-stated criterion.**

| | criterion | base (QB/OL/DL) | measured |
|---|---|---|---|
| A1 | below-start ≤25% | 43.9 / 50.9 / 38.9 | **8.74 / 11.50 / 7.38** ✓ |
| A2 | median Δcharacter ≥+2 | 0 / −1 / +1 | **+6 / +5 / +6** ✓ |
| A3 | Cost lines ≤1.40 | 2.15 | **1.16** ✓ |
| B1 | busted ≥5.00% | 5.37 / 5.83 / 5.27 | **5.10 / 5.89 / 5.24** ✓ |
| B2/B3 | badly-behaved unchanged | — | **bit-identical** ✓ |
| B4 | no virtuous payout widened | — | **39 options byte-identical, 0 edited, 5 added** ✓ |
| B5 | Earned ≤7.0 | 2.73 | **6.29** ✓ |

- **B1/QB passes by 0.10pp against σ=0.22pp — one cell from binding, and the agent reported it that way
  rather than as comfortable.** 047's predicted 0.17pp miss did not reproduce at 10k (the 3,000-career
  base was 5.37; at 10k it is 5.84), so the sample size was the problem, exactly as the brief supposed.
- **047's named B1 repair was deliberately NOT applied, and the reasoning is a do-not-undo.** A character
  cost on the new option's failure branch would have added 0.40 Cost lines and **failed A3** at ~1.56.
  The branch charges `overall −1` instead, which is what the prose says: disappearing in the opener is a
  tape problem, not a locker-room one.
- **Seeded output moved as intended** on all five seeds (`demo`: character 37→43, OVR 84→86, stock
  74→77, matching the 10k table in direction and size). First-option careers are byte-identical **by
  construction** — the new option is appended second — which is what keeps every prior baseline
  comparable. **"Earned you credit in the locker room." now appears on a Season Opener for the first
  time.**
- Adds the `virtue` event strategy and `virtue-probe` to `src/sim`, so *"plays well"* and *"is a good
  teammate"* stop being the same row. **727 tests** (708 + 19).

### A latent UI bug that 049 surfaced, landed as its own commit `0a05843` — and the PM verified the latency rather than taking it

049 went red on `remainderFacts`' **own B45/B47 falsifier** once the new option reshuffled the RNG walk.
The agent repaired it in `view-model.ts` rather than hand back a red suite, flagged it as outside its
brief, and offered to have it land separately. **It did, ordered first, because it is independent.**

- `healed` tallied injuries by `injuryKey` and compared counts, so **a card that caused an ankle in the
  same `advance()` that an older ankle healed read as no heal** — and then printed the restored points
  as a bare unattributed figure with no sentence under it, which is the exact defect DECISION 056 exists
  to remove. The fix matches each prior injury to a **decremented** survivor (`remainingPhases` is
  deliberately outside `injuryKey`, which is what makes it the discriminator).
- **The PM verified "latent, not new" instead of accepting it.** At HEAD *without* wave 26's content,
  with the falsifier's seed sweep widened **8 → 120**, it fails on *"Wave for the trainer"* with an
  unattributed 5. **The repair alone, applied to that same HEAD, turns it green.** Both halves were run.
- **Open question for session 12, cheap:** the falsifier only catches this at 8 seeds *because* the
  content changed. **Consider widening its sweep permanently** — a falsifier that a future reshuffle can
  hide is a falsifier that will go quiet exactly when it matters. It is `view-model.test.ts:1107`.

**Not dispatched, and it is the next thing:** B64's measurement lane (the user chose *measure, then
bring me the routes*). It is read-only and independent of both lanes above; it was held only to keep
the wave at two after the 046 rate-limit death. **It is the top of session 12's list.**

## Wave 27 — in flight (PM session 12)

**HEAD at dispatch `4076822`, tree clean, 727 tests green.** Two lanes, chosen straight off session
11's list: item 1 (R1 + B76) and item 3 (B64's measurement lane, which the user already routed as
*measure, then bring me the routes*).

| Brief | Agent | Owns files | Dispatched |
|---|---|---|---|
| `briefs/051-one-currency-one-meaning.md` | dev + measurement | `src/ui/session/view-model.ts` + tests, `src/sim/virtue-probe.ts`, the B76 content deletions, `reports/051-*.md` | 2026-09-16 |
| `briefs/052-which-card-hands-you-yards-in-a-season-you-never-played.md` | measurement, read-only | `reports/052-*.md` only; all instrumentation in a detached worktree pinned at `4076822` | 2026-09-16 |

**051 is R1 and B76 in one lane, deliberately.** Session 11's handoff said they are not file-disjoint
*in effect* even though they are on disk, and DECISION 076 requires measuring the realized Earned/Cost
counts after each. One agent, six steps, a measurement between every pair. The brief carries DECISION
076's stop condition verbatim: **if R1 and B76 pull in different directions on the realized counts,
B76 is reverted and the two ship in separate waves.**

**The PM's own correction, written into the brief, and it is the thing most likely to have gone wrong
unattended.** DECISION 075 suggests ≈±1.5 for R1's threshold "from the bucket split in §3". **That is
the wrong measure.** §3 buckets `charSpread` — the spread *across an event's options*. R1 thresholds
the summed character delta **on the option the player actually took**. They are different numbers and
the second does not follow from the first. 051 Step 1 requires a census of per-option summed deltas and
requires the threshold to be picked from that, with the overlap shown if no clean cut exists.

**051 also carries item 4 as Step 6** — re-run 047's "34 of 60 / 0.91 OVR" source measurement with a
≥3 character floor, on the post-B76 corpus. It is the same census sweep, so it costs nothing extra.

**052 is pinned to `4076822` in a detached worktree** because 051 is editing `src/content/events/**`
in the main tree at the same time. The two lanes share no file. 052's brief forbids landing any change
to engine or content — including the fix it becomes confident about — because that is exactly what
DECISION 073 was written about.

**The lane not dispatched, on purpose:** the playtest. It is the highest-value item on the board and it
must come *after* wave 27 lands, because no player has yet seen wave 25's ledger fixes, wave 26's
Season Opener options, or wave 27. It is wave 28's first and probably only lane.

### Wave 27 result — both lanes landed, and both refuted the premise they were dispatched on

**R1 shipped as `323971b`. `LOCKER_ROOM_MIN_CHARACTER = 2`, `lockerRoom` only, `later` untouched.**
Over 54,000 careers it removes **55–67% of all locker-room verdicts** (Earned/career 5.40 → 1.25 under
`good`), with character and draft stock bit-identical — the correct signature for a display change, and
nowhere near the vacuous pass. 728 tests. **DECISION 077.**

**The correction that outlives it, and it reaches back three decisions.** Every character amount a card
can print is an **integer**, magnitudes `{1,2,3,4,5,6,8,9,10,12,13,20,23,32}`, with no fractional value
anywhere in 131 effect entries — verified independently by the PM. **The `−0.15` and `−13.4` this board
has quoted since DECISION 074 cannot be printed by any card**; they are probability-weighted
expectations, and `charSpread` is a property of an option set rather than of anything a player reads.
The real dynamic range is **32:1**, not 89:1, and **every threshold in 1.01–2.00 is the identical
function**. The PM's own pre-dispatch correction — that R1 thresholds the *branch* and 075 had measured
the *spread* — was right, and 051 found the error runs both ways: **The Captain Vote has an 0.9 spread
and a −4 branch.**

**B76 stopped on its own stop condition, and that was the wave's best outcome.** The set is **not 22**:
resolved card by card it is **11 inverted, 10 correct, 1 ambiguous**. 050 tabled ten cards and all ten
check out verbatim; **the extrapolation from those ten to all 22 is what broke.** The twelve 050 never
tabled contain the four *"help the man trying to take your job"* cards plus *Playing Through the Hand* —
the clearest statements in the corpus of the convention `offfield.ts` states in its own header, and the
one card that **charges the player for sitting**. B76 as written deleted all five.

**The user's ruling — DECISION 078: character tracks integrity, not effort.** B76 re-cut to the eleven,
shipped as `2521027`: 14 entries, eight files, ten spared cards verified intact. `targeting-review`
resolved *correct* by the same sentence rather than left ambiguous.

- Non-vacuous check passes at **55 SE**: mean character under `good` 67.88 → 70.25, and an ordinary
  optimising player now ends a career **above** his starting character (−2.12 → **+0.25**) for the first
  time on this board.
- **DECISION 076's stop condition was evaluated and does not fire** — R1 and B76 move Earned and Cost
  down together on all six measurements. The wave stays one bundle for one playtest.
- **051's own Step 5 prediction was refuted and it said so.** It held for virtue (−0.11) and failed for
  `good` at −1.32, 92% of it `milestone-bowl-season` — a `fixed` card firing every played season. **The
  agent named the surviving cards correctly and never checked their frequency.** Combined with R1,
  verdicts/career under `good` go **8.9 → 2.7**.
- **The number that contradicts DECISION 076's own premise.** 076 adopted the route because *"at ≤0.22
  draft stock apiece it costs the balance nothing."* **Measured, the eleven deletions return +8.6 draft
  stock to both virtue profiles** (87–95 SE) — **a 10.5% tax on playing for the locker room**, and the
  reason virtue had measured *below* `good` on stock ever since 047. Per-card was right; the aggregate
  never accounted for realized frequency. **Left in the tree, surfaced to the user, direction is the one
  074 argued for.** The commit is atomic if it is ever to be undone.

**052 — B64, measured, and the bug it was sent after is the smaller half of what it found. DECISION
079.** All 138 bad rows in 72,000 careers name an authored `stat` effect by instrumentation, so 073's
relocation is confirmed. **But on all 138 the player was sidelined in every on-field phase** — so
`snaps: 0` is true, the `−4` is correct, the *"season on the sideline"* verdict is accurate, and **only
the stat line is false.** Zero careers change draft stock, round, status **or award set** when it is
removed; the award-crossing falsifier was run and does not fire. Frequency **0.192% of careers**, median
fake stat **4**. `humanLazy` is the *least* affected profile, answering 073's open question: no.
**Three claims in DECISION 073 are corrected, one of them the headline.**

**Call: R0 this wave** — a scheduling call, not a balance call, which is why it did not go to the user.

### New backlog from wave 27

| ID | Item | Status | Notes |
|---|---|---|---|
| B79 | **`requiresPlaying` checks the redshirt and not the injury** — `select-event.ts:38`. **20.8% of all authored production (44,028 of 212,085 `stat` writes) is awarded to injured or suspended players.** The 138 bad rows are only the visible tail | **MEASURED — DECISION 079. With the user, behind a re-baselining wave** | RE is one line and fixes the cause, at **−2.09 mean stock, +1.33pp undrafted, −1.96 cards/career, −5.07 on `good`**. Every balance baseline retaken. **Highest-value follow-up, and it is cheap: an RE variant that lets the selector draw a replacement card** — most of RE's cost is the ~2 cards a career that stop firing, not the lost production |
| B80 | **`milestone-opener-*/stay-within` is the same inversion B76 just deleted** — +1 character for the conservative branch, five variants, once a season | todo — cheap, and it is **now the largest character effect by frequency in the bundle** | Authored in wave 26, so it post-dates every audit on this board. Out of B76's scope by date, not by kind |
| B64 | **A played season can store `snaps: 0` beside a live stat line** | **CLOSED at R0 — DECISION 079** | Cosmetic, 1 career in 520, median 4 yards, zero measured mechanical cost. Reopens if a player reports a *large* fake line, or an award crossing is found at higher N. **RA is one line and nearly free if the user weighs "the ledger must never contradict itself" above "a card must always deliver what it narrates"** |

## Wave 28 — in flight (PM session 12)

**One lane: the playtest, `briefs/053-can-you-earn-it.md`.** It is the highest-value item on the board
and it had to wait for wave 27 — no player has seen wave 25's ledger fixes, wave 26's Season Opener
options, or wave 27's two changes.

**The question: is standing with the program something you can *earn*, or only something you can lose?**

Built on `briefs/045`'s instrument, which session 11 asked every future playtest to reuse: **careers 1
and 2 assigned, the third deliberately not.** Career 1 is *the good teammate* — the career the whole
wave is about — and career 2 is *the mercenary*. Nine claims, and **two of them name falsifiers this
board has already written down**:

- **Claim 1 carries DECISION 077's falsifier explicitly**, and says in the brief that *"the game has
  gone quiet about your standing"* is exactly as valuable as a confirmation. 051 predicts proportionate;
  a playtester saying *silent* kills the threshold.
- **Claim 4 carries DECISION 078's falsifier** — do the ten spared cards read as recognition, or as the
  game paying you to do less? The brief states there is no answer we are hoping for, because on the
  effort axis 050's reading is the better one and 078 is precisely the choice of axis.
- Claim 7 (*the card's number agrees with its words*) is kept because it has historically been the
  highest-yield question on this board.
- One line, and no more, on 079's falsifier: a **large** fake stat line beside a zero-snap season.

**Dev server:** the PM killed a stale Vite on 5175 and started a clean one on **5173** at HEAD.

**The first playtester died, and the cause is now written into the brief.** It stalled with **600
seconds of no progress at its very first tool call** and left nothing on disk — the same shape as
wave 17's 036. The PM checked the dependency rather than assuming: `list_connected_browsers` shows one
local Chrome, so the tooling was fine. **The likely hang point is the browser-selection prompt: the
Chrome tool requires asking the user which browser to use, and a background agent that stops to ask a
question has no one to ask and hangs until it is killed.** Two mitigations are now in `briefs/053`
and belong in every future playtest brief:

1. **Write the report stub to disk as the first action**, before the skill and before the browser.
2. **Never ask which browser to use.** The confirmed one is `8b77ec6f-1f42-4ea4-bca7-4869156e4634`
   ("Browser 1", local, macOS). Name it in the brief so the agent never reaches the question.

### Wave 28 result — the playtest answered its one question *no*, and the PM's sweep found the cause. Read DECISION 080 before planning anything

**Three careers played, written to disk after each. Curve: *yes → yes (checking) → no*.** The third
career was **self-assigned and actually played** — the first time on this board that a playtester chose
to keep going with a stated goal of their own. That is movement toward the north star and it should not
be lost in the rest of this section.

**The one question — is standing something you can earn, or only something you can lose? — answered
*only something you can lose*.** Upward rung movements **zero** across two careers played deliberately
to earn it and six *"Earned you credit"* messages. Downward **two**, the first on **decision 2**. The
playtester's own framing, and it is the correct one: *"The display is not the problem. The asymmetry
is."*

**The cause is four numbers and the PM measured it rather than taking the report's word for it —
DECISION 080.** `STARTING_CHARACTER = 70` and `TRUST_BANDS` puts rung 2's floor at exactly **70**.
**A fall costs 1 point; a climb costs 15.** Over **7,200 careers** (3 profiles × 6 positions × 400),
maximally virtuous play returns a **median +6**, and the **best p95 in the entire sweep is +14**.
**Not one cell reaches 85. The top rung cannot be occupied by any policy at any position** — and the
playtester spent their whole third career chasing it by name.

**This retires three hypotheses at once.** DECISION 077's named falsifier **does not fire** — the player
called the system loud in one direction, not silent, so **R1's threshold is not implicated and must not
be the first thing session 13 reaches for.** DECISION 078 is not implicated either and **is also not
vindicated**: wave 27 moved `good` from −2.12 to +0.25 and virtue to ~+6, which against a 15-point rung
is real and completely inaudible. **The wave improved the currency and could not possibly have shown
it.**

**The fix is in bounds and cheap.** `src/ui/session/bands.ts` is **UI and not frozen**; the thresholds
are display calibration and `character` swings draft stock identically whatever the ladder says. **No
engine, content or balance change is required.** `STARTING_CHARACTER` is frozen and does not need to
move — the bands move around it.

**Claim 4 refuted, in a direction nobody had proposed.** The spared teammate cards do not read as
paying the player to do less — they read as **inert**. *"Sit and let the backup play"* returned
*"You get grief in the meeting room for missing it"* with **no number**, twice. The playtester's line:
***"written to be good, wired to be inert."*** DECISION 078's integrity ruling is not overturned by
this, but the cards it spared are not landing as recognition either.

**Claims 6, 8 and 9 CONFIRMED** — the ledger, the where-am-I readouts and the visuals were clean at
500px, and the stats-beside-zero-snaps check came back **none seen**, which is 079's R0 surviving its
player test.

### New backlog from wave 28

| ID | Item | Status | Notes |
|---|---|---|---|
| B81 | **The top rung of the trust ladder is unreachable** — start 70 sits on rung 2's floor, so a fall is 1 point and a climb is 15, against a measured median career budget of +6 | **MEASURED — DECISION 080. Wave 29 lane 1.** The calibration question is **the user's** | `bands.ts` is UI and unfrozen. The user's question is *how rare should "they would run through a wall for you" be?* — rare and impossible are different and the sweep says which one ships today |
| B82 | **Claim 7 refuted again, five instances, and one is a reproducible pattern** — a single-option card whose button asserts success and whose outcome is failure with a negative number, **seen three times across three careers** | todo — **highest-yield defect class on this board**, wave 29 lane 2 | Named in 053 §"bugs worth a developer's time": D30 *Missed Tackle Reel* (only button "Answer it on the practice field", outcome *"the whiffs don't stop"*), D33 *Targeting Review* (card says the booth reviewed, outcome says *"no flag, no review"*), D28 (prose says it showed, verdict says cost, −1 OVR) |
| B83 | **The teammate cards are inert** — the spared B76 cards return prose with no number at all | todo | *"Written to be good, wired to be inert."* Distinct from B81: even a correctly-sized ladder shows nothing if the card carries no effect |
| B84 | **Smaller 053 defects** — duplicate narration of one healed injury (+1 then +5), an injury that lasted exactly one card, four years of *"your name is written in pencil"* to an All-America senior, ON THE FIELD label thrash on a 1-point 85↔84 change | todo — cheap, cosmetic, several are one-liners | All in 053 §"bugs worth a developer's time" |

## Wave 29 — in flight (PM session 12)

Two lanes, file-disjoint, both straight off wave 28's backlog.

| Brief | Agent | Owns files | Dispatched |
|---|---|---|---|
| `briefs/054-a-rung-you-can-actually-reach.md` | dev + measurement | `src/ui/session/bands.ts` + tests, `reports/054-*.md` | 2026-09-16 |
| `briefs/055-the-button-promises-and-the-outcome-refuses.md` | diagnosis + conditional fix | the event-outcome display path, `reports/055-*.md` | 2026-09-16 |

**054 is B81 and it carries two numbers the PM derived from the sweep**, plus the sweep itself so the
agent can argue with them: **top rung 85 → 80** (a +10 climb against virtue's +6 median and +12–14 p95,
so a minority of virtuous careers reach it and nothing else does) and **rung 2's floor 70 → 66** (four
points of buffer, so a single −1 can no longer move the marker off the start). The brief says in terms
that these are a starting point and not a specification. **The bottom of the ladder is explicitly not
to be touched** — the playtester singled out the downward callout as *"large, clear, well-designed"*,
and the measured distribution shows the lower rungs are already well-used.

**054 carries both halves of the identity rule, pointing opposite ways, which is why it is worth
reading as a brief:** the rung-occupancy table is *supposed* to move, so **byte-identity there is a
failure**; draft stock, undrafted rate and bust rate are *supposed* not to move, so **identity there is
the pass.** A display calibration that shifts balance is a bug.

**055 is B82 plus the separable small defects of B84.** It is a diagnosis lane with a conditional fix:
`src/content/**` and `schema.ts` are frozen, so the label-rewrite and lint routes are **proposals
only**, and the brief tells the agent to implement nothing if the honest answer is that the defect
lives in prose. It also has to check its own classifier by hand-scoring 20 cards against it.

**The two lanes share no file.** 055 is told explicitly that `bands.ts` belongs to 054 this wave, and
that the `standingPhrase` thrash it will notice is 054's file, to be proposed and not edited.

### Wave 29 result — both lanes shipped, and both found the brief's framing wrong before fixing the thing underneath it

**054 — the ladder, `f2c3188`. DECISION 081.** `TRUST_BANDS` top two floors **85 → 80** and **70 → 66**;
lower three untouched. Top-rung reach over 14,400 careers: `virtueAmbitious` **2.3% → 23.1%**,
`virtueLoyal` 0.5% → 15.7%, `good` 0.1% → 1.8%, random/lazy/saboteur **0.00% → 0.00%**. Of virtuous
careers whose ladder moves at all, the share that **falls before ever climbing** goes **94.5% → 31.9%**,
and a fall inside the first two decisions goes **3.75% → 0.00%**. **Both identity checks pass pointing
opposite ways:** `npm run balance` and the virtue probe byte-identical, rung table moved hard.

- **The agent corrected the PM's reasoning while keeping the PM's number.** "Four points of buffer" is
  equally satisfied by 69; the real argument is that **49 of the 72 authored negative character outcomes
  land in −1..−4**, so 4 points absorbs two thirds of single bad cards. Quote that one.
- **The old early-fall rate was identical for virtuous play and for `good`.** The decision-2 fall had
  **nothing to do with how the player played** — it was the boundary firing on whoever drew a −1 first.
- **One metric moved the wrong way and the agent surfaced it:** the ladder is quieter (`good`
  never-moves 35.7% → **69.1%**), almost all of it lost *downward* movement. **`80/67` is measured and
  ready as a one-character change; a playtester calling the ladder inert is the named falsifier.**
- **New instrument, committed and tested: `src/sim/rung-probe.ts`** — scores the full per-decision
  character trajectory against **a band table passed in as a parameter**, so any future recalibration is
  compared on identical seeds instead of by diffing two samples.

**055 — the one-option card, `65b057a`. DECISION 082.** **The brief's premise was wrong and that is what
made the fix possible: there is no button.** `openCard` auto-resolves a one-option card on arrival
(DECISION 018), and its label was rendered as a **bare declarative line above the outcome** — the UI
narrating an option label as a completed event. Multi-option cards carry *"You chose:"*; one-option
cards had that frame stripped with nothing in its place. **The beat now reads *"The plan: <label>"*,
unconditional on both branches** (captioning only failures would reveal the roll). Nine instances
resolved, **no prose touched**.

- **053's "three in three careers" CONFIRMED and it is common:** **72–74% of careers** meet a
  contradicted one-option card, ~1.1 per career, **flat across all four profiles** — the player cannot
  decline these cards, so skill cannot avoid them.
- **The second bug, found unasked, is bigger than the lane's own subject. 74.7% of every *"An injury
  healed and gave the points back"* line the game has printed was false** — 7,693 of 10,298 across
  78,605 advances, **78% of careers**. `someInjuryLeft` required a *strictly* smaller `remainingPhases`,
  but only a phase tick decrements one, so any advance inside a phase failed to match an unchanged
  injury list against itself. `<` → `<=`, **0 false positives, 0 missed true heals**, verified in source
  by the PM. **This is exactly what 053 reported as "duplicate narration of one healed injury."**

### New backlog from wave 29

| ID | Item | Status | Notes |
|---|---|---|---|
| B85 | **95% of the one-option contradiction is a single label** — `milestone-fall-camp`'s *"Win the job"*, a fixed card gated `minClass: SO`, firing ~3×/career and failing **35%** of the time = **1.048 of the 1.10 per career** | todo — **user**, 1 label. **Highest value per word on the board** | Also 053's stale-flavour card (*"your name is written in pencil"* to an All-America senior). The caption softens it; rewriting the label removes it. Content is frozen, so it is an RB proposal |
| B86 | **A lint rule for "the label asserts a result" cannot be written** — not lexically decidable, and the flagship instance shares no word with its failure branch | **refused in its obvious form — DECISION 082** | 055 proposes a required-acknowledgement field across the 12-card one-option population instead. Schema is content, so it is the user's |
| B87 | **The ladder is quieter after 054** — `good` never-moves 35.7% → 69.1%, almost all of it lost downward movement | watch, do not act | `80/67` is measured and is a one-character change. **Act only if a playtester reports the ladder as inert** — that is DECISION 081's named falsifier |

## Wave 30 — in flight (PM session 13)

Two lanes, file-disjoint. Item 1 of session 12's list, plus the measurement item 4 asked for.

| Brief | Agent | Owns files | Dispatched |
|---|---|---|---|
| `briefs/056-can-you-earn-it-now.md` | playtester | `reports/056-*.md`, `PLAYTEST-LOG.md` | 2026-09-24 |
| `briefs/057-does-the-good-branch-ever-say-anything.md` | measurement + proposal | `reports/057-*.md`, a **new** probe under `src/sim/` only | 2026-09-24 |

**056 is the playtest, and it was the only thing that should have happened next.** Six changes have
landed since a player last saw the game (077, 078, 081, 082) and the last playtest's central complaint
— *"standing is only something you can lose"* — had been answered with numbers and never by a person.
It uses 053's shape: two careers assigned, the third **not**, both anti-death rules, and the one
question asked straight. **Three named falsifiers are in it, each flipping a live decision:** the
ladder reading as **inert** (DECISION 081 — `80/67` is measured and one character away), *"The plan:"*
reading as a **hedge or as telegraphing failure** (DECISION 082), and the spared teammate cards reading
as **payment for passivity or as nothing at all** (DECISION 078, still unanswered — 053 found them
inert, which answers neither).

**057 is B83, and it is deliberately the other half of the last two waves.** Waves 28–29 both worked on
the *size* of the rungs. 057 asks whether the card the player actually took carries anything for the
ladder to size. Its brief states a three-step mechanism — the `LOCKER_ROOM_MIN_CHARACTER = 2` floor
(077) silences the `+1` branches and the `+2` branches clear it by nothing, and the cards are not
`fixed` so a whole career may meet one once or never — and says in terms that refuting it is a success
condition. It carries both of this board's denominator lessons: **resolve every card to source by
hand** (a "22" that was 11), and **count careers, not cells.**

**No product code ships from 057 this wave, and the reason is 056.** `src/ui/**` is out of bounds for
it — including `view-model.ts`, whose one constant is the suspected cause — because a playtester is
playing HEAD in a browser concurrently and changing the build under them invalidates the most
expensive measurement on the board. 057 measures and prices routes; the PM ships after 056 lands.

**Done directly by the PM, no lane:** DECISION 083 retires 046 Part 2 and takes the redshirt pack off
the wave board (item 7, carried unexecuted for seven sessions).

**Escalated to the user, not dispatched:** B85. See the escalations section.

### Lane 057 — done, not committed as product code (it ships no product code). It refuted the brief's mechanism and named a better one

**Verified independently by the PM:** 756 tests green, `npm run typecheck` **exit 0**, `git status`
clean under `src/engine/**`, `src/content/**`, `src/ui/**`; two new files only
(`src/sim/spared-card-probe.ts` + test). Balance byte-identical against a pristine `git archive HEAD`
export on two commands — **identity is the pass here and it passed.** Note for future briefs: HEAD was
**740** tests, not the 728 this board had been quoting since wave 27; brief 057 carried the stale number.

**The headline, and it is worse than B83 stated.** A good branch of the ten spared cards says
*something* in 59.4% / 66.0% of `virtueLoyal` / `virtueAmbitious` careers — but counting only a
**credit** (the game recognising the choice rather than charging its failure) it is **43.3% / 51.8%**,
and **for `virtueLoyal` — the playtester's literal shape — the per-career median number of credits from
these ten cards across a whole career is zero.**

**The brief's mechanism is refuted and the replacement is sharper.** The `LOCKER_ROOM_MIN_CHARACTER = 2`
floor is real and the +2/+1 figures check out verbatim, but the floor is the **smallest** of three
causes — it eats 16.0% of good-branch takes while **27.5% carry no character effect at all.** Three
shapes:

- **Shape A — the good branch can only ever be charged, never credited (3 cards).** *The Two-Deep*,
  *The Holding Call*, *The Captain Vote*: success +1/+1/**0**, all silent; failure −3/−2/−3, all of
  which print *"Cost you in the locker room."* **0 credits and 719 costs in 3,600 `virtueLoyal`
  careers.** This is the playtester's *"only something you can lose"* and **it was never the ladder
  calibration** — it is what these three cards are.
- **Shape B — the card cannot speak on any branch (2 cards + the eleventh).** *Playing Through the
  Hand* printed a locker-room line **zero times in 10,800 careers.** The prose the playtester quoted —
  *"You get grief in the meeting room for missing it"* — is its −1 sit branch, and its good branch is
  empty too.
- **Shape C — the floor eats a real ±1 (4 branches).** The brief's mechanism, and the smallest.

**Two structural findings the aggregate hid:** 66% of all credit comes from **one card** (*Up Forty at
Halftime*) — remove it and `virtueLoyal` goes 43.3% → 15.6%; and *The Five-Star Behind You* fired **0
times in 3,600** non-transferring careers. **Every one of the eleven cards was resolved to source at
HEAD and no id or effect in DECISION 078 / report 051 §4 is wrong** — the denominator lesson was
applied and this time the set held.

### The PM's own measurement on top of 057, and it turns that 0-of-3,600 from rare into impossible

057 reported *The Five-Star Behind You* never firing for non-transferring careers and inferred Signing
Day does not offer tier 3/4. **It does not, and the reason is arithmetic, not sampling.**

`eligibleTiers` (`draft.ts:21`) needs **stock ≥ 45** for tier 3. At career creation every career has
`overall 60`, `character 70`, no seasons, trophies or awards, so
`deriveDraftStock` = `(60−40)×1.4 + (70−50)×0.15` = **31, exactly, for every career**. Measured across
all 35 (position × home-state) pairs: **one distinct value, 31**, and eligible tiers `1,2` in every
case. **No player can ever sign with a tier 3/4 school.** Tier 3/4 is transfer-only, by construction.

Measured reach, 1,400 careers per profile, all six positions:

| profile | ever at tier 3/4 | share of decisions there | first arrival |
|---|---|---|---|
| `virtueLoyal` (transfer: stay) | **0.0%** | 0.00% | never |
| `baselineRandom` | 31.5% | 11.53% | mostly SR |
| `good` (transfer: up) | 98.7% | 55.03% | JR, then SR |
| `virtueAmbitious` (transfer: up) | 98.4% | 54.70% | JR, then SR |

**Three authored `random` events are gated `tier: [3,4]`, all in `universal.ts`** — *The Five-Star
Behind You*, *Playoff or Bust*, *Scouts on the Sideline*. **A loyal player sees none of them, ever.**
And `blueblood-five-star`'s `minClass: "SO"` gate is **dead** — nobody reaches tier 3/4 before JR.

**Why this matters beyond one card.** *The Five-Star Behind You* is one of the four cards DECISION 078
called *"the clearest statement in the whole corpus"* of what the character currency means. It is
unreachable to the exact player the currency rewards. The authored comment above it in `universal.ts`
reasons about *"signing with a blueblood"* — a thing that cannot happen.

**Whether this is a defect or the design is a user call**, and it is not obviously a bug: everyone
starting as a middling recruit who earns his way up is coherent. What is not defensible is the
combination — the loyal player is locked out of content, and one of the eleven cards the board reasons
about as load-bearing is invisible to half the profiles.

### New backlog from wave 30 (lane 057 + the PM's measurement)

| ID | Item | Status | Notes |
|---|---|---|---|
| B88 | **Shape A: three spared cards can only be charged, never credited** — *The Two-Deep*, *The Holding Call*, *The Captain Vote*. 0 credits / 719 costs in 3,600 careers | **todo — user.** The single best explanation of *"only something you can lose"* this board has found | 057's R2 fixes it with six content magnitude edits at **+0.17 draft stock, 2% of DECISION 078's landed change, exactly 0.00 on `good`**. **The authorial question is whether the asymmetry is a bug or a statement about locker rooms** — R2 assumes bug |
| B89 | **Shape B: two cards cannot speak on any branch** — *Playing Through the Hand* printed nothing in 10,800 careers | todo — folded into R2 | Its −1 sit branch is the exact line the playtester quoted |
| B90 | **Tier 3/4 is unreachable at Signing Day for every career, by arithmetic** — stock is the constant **31**, the gate is 45. Three authored events and one of DECISION 078's load-bearing cards are transfer-only; `virtueLoyal` reach is **0.0%** | todo — **user**, and it touches frozen engine constants *or* frozen content conditions | Cheapest route is content: `tier: [3,4]` → `[2,3,4]` on the three cards. Engine route (starting stock / the 45 gate) is balance and moves everything. `minClass: "SO"` on `blueblood-five-star` is dead either way |
| B91 | **The credit supply is one card** — 66% of all credit is *Up Forty at Halftime*; without it `virtueLoyal` is 15.6% | watch | Fixing B88 removes the single point of failure as a side effect |

**R1 (lower the floor) is disqualified by measurement, not by taste:** floor 1 takes locker-room lines
from 2.5 to 7.1 per career and only **5.5%** of the extra lines come from these ten cards. **DECISION
077's floor survives its first real challenge.**

## Next actions — for PM session 13, in order

**Read this section and `DECISIONS.md` 077–082. Nothing else.**

**Session 12 in one line: five waves' worth of diagnosis got corrected by measurement — three of the
corrections were the PM's own — and the two biggest fixes on the board came from agents who found their
brief's premise wrong and said so before fixing what was actually there.**

1. ~~**Playtest.**~~ **DONE — dispatched as `briefs/056` (wave 30).** Since a player last
   saw this game, **six** things changed: the locker-room floor (077), the eleven character deletions
   (078), the trust ladder recalibration (081), the one-option caption and the heal-report fix (082).
   **The last playtest's central complaint — *"standing is only something you can lose"* — has been
   answered with numbers and has never been answered by a person.**
   - **Use `briefs/053`'s shape**, which is `045`'s: two careers assigned, the third **not**. It has now
     produced a self-assigned third career, which is the closest this board has come to its north star.
   - **Carry `briefs/053`'s two anti-death rules** — write the report stub to disk *first*, and **never
     ask which browser to use** (`8b77ec6f-1f42-4ea4-bca7-4869156e4634`). A playtester died without them
     this session and it cost a re-dispatch.
   - **Three named falsifiers must be in the brief**, and each one flips a decision: *(a)* **is the
     ladder inert?** — DECISION 081, and `80/67` is measured and ready as a one-character change;
     *(b)* **does *"The plan:"* read as a hedge or as telegraphing failure?** — DECISION 082; *(c)* **do
     the spared teammate cards read as recognition or as being paid to do less?** — DECISION 078, still
     unanswered because 053 found them **inert** instead, which answers neither.
   - **Ask the one question straight: can you earn it now?** Do not ask it as nine sub-questions.

2. **B85 — ESCALATED to the user 2026-09-24, awaiting an answer.** One label —
   `milestone-fall-camp`'s *"Win the job"* — is **95%** of a defect class that eight playtesters have
   refuted in a row. It fires ~3× a career and fails 35% of the time. Content is frozen, so bring the
   proposal in `reports/055-*.md` to the user. **It is also 053's stale-flavour card**, so one rewrite
   closes two findings.

3. **B79 is still the biggest thing on the board and still not urgent.** A fifth of all authored
   production goes to injured or suspended players. **Do not dispatch RE as a lane.** Build the
   replacement-card variant first (one probe run, `reports/052-*.md` §5) — if most of RE's −2.09 stock
   is the ~2 cards a career that stop firing rather than the lost production, the variant lands RE's
   correctness at RA's price. Then take the routes to the user.

4. ~~**B83 — the teammate cards are inert.**~~ **DONE — dispatched as `briefs/057` (wave 30), measurement first exactly as this item asked.** The cards DECISION 078 spared return prose with **no number
   at all** (*"You get grief in the meeting room for missing it"*, twice). Distinct from the ladder:
   a correctly-sized ladder still shows nothing if the card carries no effect. **Measure before
   proposing** — how many of the ten spared cards actually carry a character effect on the branch a
   good teammate takes?

5. **B73 — `good` is misnamed and wave 27 made it worse.** It was a draft-stock maximiser called *"the
   player who plays well"*; after B76 it ends careers at **+0.25 character**, so the name is about to
   mislead in the opposite direction. Renaming is cheap. **Any report before wave 27 quoting `good` is
   describing a stock-maximiser.**

6. **B84 leftovers, all cheap:** the injury that lasted exactly one card, the ON THE FIELD label thrash
   on a 1-point 85↔84 change (`standingPhrase`, and 055 left a proposed fix shape for it), and the
   coach who left for a bigger job in two consecutive seasons.

7. ~~**046 Part 2 and the redshirt pack.**~~ **CLOSED — both retired, DECISION 083.** That is
   itself a decision. **Either schedule them or retire them** — do not carry them an eighth time.

8. **Do not reopen type, colour or contrast.** Eight playtests, zero visual defects. 053 checked at
   500px and found none.

9. **Four process rules this board has paid for. All four are cheap and all four fired this session.**
   *(a)* When a change is supposed to move the numbers, **byte-identity is the vacuous pass** — and its
   mirror: when a change is supposed **not** to move balance, identity **is** the pass. 054 ran both at
   once. *(b)* A blind audit needs an **unmarked control group**. *(c)* **A set defined by a measurement
   is not a set verified card by card** — B76's "22" was 11. *(d)* **New: when a claim is about what a
   player can experience, the denominator is careers, not cells.** An aggregate over 400 runs cannot
   answer a question about the 95th percentile of one of them, and this board has now been caught by
   that twice, both times on the PM's own numbers.

10. Increment the **PM session** counter at the top of this file.

### What session 12 would tell session 13 if it could only say one thing

**The best agents this session all did the same thing: they discovered the brief was wrong about the
mechanism, said so plainly, and then fixed what was actually there.** 051 was told to delete 22 cards
and found the set was 11. 052 was sent after a stat bug and found the gate that causes it. 054 was
handed two numbers and kept them while replacing the PM's reasoning for one. 055 was briefed to fix
*"a button that asserts success"* and found **there is no button** — and that framing error is exactly
what led it to the missing intention frame, and then to a separate bug making **three quarters of the
game's heal reports false across 78% of careers.**

**A brief that states its mechanism confidently and invites contradiction outperforms one that hedges.**
Every one of those agents was given a specific, falsifiable, wrong-in-part story and a stop condition
with a number in it. None of them needed judgement to push back; they needed something precise enough
to be provably wrong. **Write briefs that can be refuted, and say in them that refuting the brief is a
success condition.**

## Next actions — for PM session 12, in order

**Read this section, `DECISIONS.md` 073–076, and the wave 25–26 sections above. Nothing else.**

**Session 11 in one line: three diagnoses were refuted by measurement — a playtester's, an agent's, and
the PM's own — and in all three the observation was sound while the explanation was not.**

1. **Wave 27 is written in outline and is two lanes. Both are authorised; neither needs the user.**
   - **R1 — threshold the locker-room line by magnitude.** `cardAccount` at
     `src/ui/session/view-model.ts:371` maps *any* non-zero character delta to `direction(character)`,
     so a −0.15 and a −13.4 print the identical sentence. Suppress below ≈±1.5 (050 §3's bucket split
     suggests the number; pick it from the data, not from taste). **~5 lines, zero content files.** The
     line is currently read on 37.5% of resolved cards and means nothing on a third of them. **This is
     the `lockerRoomLine` docblock's stated intent, not a new one.** DECISION 075 adopted it as a PM
     call **and recorded it as a one-wave measure** — it hides the effort inversion; item 2 resolves it.
   - **B76 — delete the 22 sub-3 inverted character effects.** The user's call, DECISION 076. Content
     files across `oskill.ts`, `dskill.ts`, `ol.ts`, `dl.ts`, `k.ts`, `qb.ts`, `season-life.ts`,
     `milestones.ts`. **The content freeze is lifted for this specific deletion and nothing else.**
     `kickoff-duties-too` is mandatory — it credits *"Ask them to find someone else for kickoffs"* +1
     and gives *"Take both jobs and don't complain"* nothing.
   - **These two lanes both touch character accounting, so they are NOT file-disjoint in effect even
     though they are on disk.** Run them in one lane, or run R1 first and B76 second. Measure the
     realized Earned/Cost counts after each — DECISION 076 says that if they pull in different
     directions they ship in separate waves and the playtest waits.
   - **B76 must not start until wave 26's `milestones.ts` work is committed.** Both touch that file.

2. **Then playtest, and it is the highest-value thing on the board.** No player has seen wave 25's
   ledger fixes, wave 26's Season Opener options, or wave 27. The user explicitly held B75 and B77 for
   this. **Use `briefs/045`'s shape: two careers assigned, the third NOT assigned** — ask at career 2's
   ending whether they want another and what they would chase, then let them act on their own answer
   including *"no."* That instrument produced the most specific *"no"* on record and a self-directed
   experiment; every future playtest brief should use it. The question this one answers: **does standing
   now read as something you can earn?**

3. **B64's measurement lane — the user chose *measure, then bring me the routes*.** Held from wave 26
   only to keep it at two lanes. **Read DECISION 073 first**: the cause is one of the **123 authored
   `stat` effects** in `src/content/events/**` landing production on a season line with no playing time,
   **not** the `effects.ts:61` clamp, which was escalated, approved, implemented and reverted when the
   non-vacuous check showed it touched none of the 29 bad rows in 56,481.

4. **Re-run 047's source measurement with a ≥3 character floor.** DECISION 075 item 1: the "34 of 60"
   number conflates ±1 flavour nudges with −13 moral forks, and every figure downstream inherits it.
   Cheap, and it makes B72's neighbourhood legible for whoever looks next.

5. **046 Part 2 is still unfinished** (redshirt routes R1–R3 unpriced; DECISION 071 already picked R0 as
   the likely answer). **The redshirt pack is still unauthored.** Both remain below the items above.

6. **B73 — `good` is misnamed and a dozen reports lean on it.** 047 measured it at **−8.04 expected
   character per career**; it is a draft-stock maximiser, not "the player who plays well." The `virtue`
   strategy added in wave 26 gives it a proper counterpart. Renaming is cheap; **any old baseline
   quoting `good` as "plays well" is describing a stock-maximiser** and should be read that way.

7. **Do not reopen type, colour or contrast.** Seven playtests, zero visual defects.

8. **Two process rules this session paid for, keep both.** *(a)* When a change is **supposed** to move
   the numbers, byte-identity is the **vacuous** pass — hunt the difference, and if you cannot find it,
   the change is not doing what it says. That reverted an approved engine fix. *(b)* A blind audit needs
   an **unmarked control group**, or a high flag rate reads as confirmation of whatever you went looking
   for. That refuted the PM's own hypothesis.

9. Increment the **PM session** counter at the top of this file.

### What session 11 would tell session 12 if it could only say one thing

**Check the diagnosis, not just the observation — including your own, and especially when it is your
own.** Session 10 learned that a player's observation and their explanation are different artifacts.
Session 11 found the same split in an agent's report (048 reproduced the `0 snaps` row exactly and named
the wrong line, and the approved fix changed nothing in 56,481 rows) and then in **the PM's own
DECISION 074**, whose headline number turned out to be partly a tautology of how its own sample was
drawn. In all three cases the observation was real and worth acting on, and in all three the proposed
fix would have missed. **The two cheap instruments that caught it are a hunted difference and an
unmarked control group.** Neither costs a wave. Both belong in every brief that measures anything.

## Next actions — for PM session 11, in order

**Read this section, `DECISIONS.md` 069–071, and the wave 23 section above. Nothing else.**

**Wave 22 was the right call and it is confirmed by a player who did not know it shipped.** The ladder
is now the best element in the game and it produced an unasked-for third career. **It also made the
real defect visible for the first time** — while the standing was invisible, nobody could see it was
also unearnable. Making a mechanism visible is what makes it falsifiable; that is the lesson of the
session.

1. **[DISPATCHED — wave 25, `briefs/047`] B62 is the top of the board, and it needs one measurement before it goes to the user.** Run the
   realized-frequency sweep DECISION 070 names as its own falsifier: over a few thousand `good`-policy
   careers, **how many *"Earned you credit"* vs *"Cost you"* character events does a career actually
   see, and what is the distribution of final-minus-starting character?** The corpus says virtue pays
   +2.35 at 81%; the player saw 0 up and 5 down. **One of those is not describing what happens.**
   Settle it, then escalate B62 with the number.
   - **Do not widen virtuous payouts.** The measurement says they are fine, and DECISION 063's
     preserved upside is not reopened.
   - Routes for the user, all content-economy: symmetrise the milestone openers so the 75% branch
     earns what the 25% branch costs; or turn them into real choices; or strip their character effect.
2. ~~**B63 to the user as a bug.**~~ **DONE** — the user chose *skip*, wave 24 shipped it, DECISION
   072. Note its side effect when reading any future bust measurement: the *"Buried on the depth
   chart"* ending is now nearly extinct and every washout baseline recorded before `f46b64e` is stale.
3. **[DISPATCHED — wave 25, `briefs/048`] B64–B67 are a single debugging lane, and it should be one agent with `systematic-debugging`.**
   They are all the same subsystem — the season ledger — and the *"0 snaps"* senior season is the
   thread to pull. **These are the first hard correctness bugs found in seven playtests**; everything
   before was feel. They may be view-model rather than engine, which would make them cheap.
4. **046 Part 2 is unfinished** — the agent was rate-limited after Part 1. Routes R1–R3 are unpriced.
   **Do not re-run Part 1**; it is complete, on disk, and 5,000–8,000 careers per cell. Re-dispatch
   `briefs/046` scoped to Part 2 only, and note that DECISION 071 already picked **R0** as the likely
   answer, so Part 2 is now about pricing the alternatives rather than choosing among them.
5. **The redshirt pack is still unauthored and it is no longer obviously next.** DECISION 068 deferred
   it to see whether the ending screen earned the fourth career. It did — but the reason the fourth
   career did not come is B62, not a thin sit season. **Re-rank the pack below B62 and B64.** Its
   enabling work is done and inert (`requiresRedshirt`, plus the `gatesOf` arm committed in `808fb99`).
6. **Keep the unassigned-third-career instrument.** `briefs/045` stops assigning the third career and
   asks the player at career 2's ending whether they want another and what they would chase. It
   produced the most specific *"no"* on record **and** a self-directed experiment. Every future
   playtest brief should use this shape.
7. **Do not reopen type, colour or contrast.** Seven playtests, zero visual defects. 045 found none in
   ~107 decisions at 1470px.
8. **Watch the session rate limit.** 046 died mid-task at the limit and lost Part 2. Prefer two lanes
   over three, and keep the "write Part 1 to disk before starting Part 2" rule in every brief — it is
   the only reason 046 produced anything at all.
9. ~~Increment the **PM session** counter at the top of this file.~~ **DONE** — session 11.

### What session 10 would tell session 11 if it could only say one thing

**A player's observation and a player's explanation are two different artifacts, and you must take the
first seriously and check the second.** 045 reported a maximum-virtue career ending below where it
started — true, and the most important finding of the phase. It also explained why: *"the team-first
branch is a coin flip."* The corpus says virtue pays **+2.35 at 81% reliability, flat across all six
positions.** Building the reported fix would have inflated 42 healthy payouts and left the actual
defect — **seven one-button cards that can only cost standing, five of them firing in every career** —
completely untouched.

**Seven calls have now been reversed by measurement; none by argument.** This session added two (B43's
reframing, and the virtue economy) and, for the first time, one where **the measurement confirmed the
player's experience while refuting their explanation.** Both halves were load-bearing.

## Next actions — for PM session 10, in order

**Read this section, `DECISIONS.md` 065–067, and the wave 21–22 sections above. Nothing else.**

**The phase's central complaint was withdrawn this session, by the player who was in a position to
make it.** *"Does the game count what you do?"* — the sentence session 8 lost on — got a **yes** from
someone who spent a career being a bad teammate, with a much narrower defect named in its place: the
ladder the game narrates most was the one it showed least. Wave 22 shipped the fix. **Nobody has
played it.**

1. **B43 and the redshirt pack, in that order, then a playtest.** They are the same subsystem and they
   must not share a wave — three simultaneous changes to redshirt EV would be unattributable
   (the wave-10/13/16 lesson, restated in DECISION 066).
   - **B43 first, alone:** the redshirt offer is made in 2,991 of 3,000 careers, pays **+5 OVR on the
     offer card** — before the season it bets on — and two playtesters have now called it *"an obvious
     free yes."* Small, well-understood, and it is a **balance** change, so state acceptance in
     advance and report a miss rather than tuning it away (the wave-19 precedent, which is this
     phase's best argument for the no-tuning rule).
   - **Then the pack:** `requiresRedshirt` now exists and is proven inert. Author ~9–12 sit-season
     cards — scout team, the weight room, look-team scripting, watching a rival take your reps, the
     November Saturday in street clothes. **Target from `reports/042`: sit-season on-field pools 3/3/3
     → 6/6/6, cross-replay collision ~33.8% → ≤17%** (a played season is 14.7%).
   - **The pack wave must also add one line to `src/sim/prose-probe.ts:407` (`gatesOf`)**, which
     enumerates gate labels by hand and has no arm for `requiresRedshirt`. Without it **the first card
     authored is silently under-reported by the exact instrument the wave is measured on.** This is
     DECISION 064's failure shape — an instrument drifting from what it measures — caught early for
     once.
   - **Do not hold "% of corpus read" as the target.** Authoring grows the denominator, so a
     successful wave can lower it. Use 042's metric table.
2. **Then the playtest, and it carries DECISION 067's falsifier.** *A playtester who still reports the
   locker-room ladder as invisible* — which would mean the band resolution itself is too coarse, and
   that is a DECISION 002 question rather than a display one. Also re-ask the north star: the curve is
   *yes → no (asked) → no*, and the 041 player named the precise thing that would buy a fourth career.
   **Keep the write-after-each-career rule in every playtest brief.**
3. **B59 — the four prose/number contradictions.** *"Cost you in the locker room"* → **+1 OVR** ×2,
   *"Earned you credit"* → **−3 OVR** ×2, none carrying the THIS CARD / EVERYTHING ELSE split that
   exists to prevent exactly this. **The +1 cases are the upside DECISION 063 deliberately preserved,
   so this is legibility, not economy — do not reopen the user's call.** The −3 cases are a different
   animal and may be B57.
4. **B57 needs the user** — 1,413 words (15.6% of the corpus, 2.2× the whole B55 band) sit behind
   strictly dominated options (`gym-grind:rest`, `the-knee:cart`, ~15 more). Largest block of unread
   writing in the game. **Must not be fixed by re-gating** — it is draft-stock pricing. Bring it with
   a measurement.
5. **B52 needs the user** — `requiresPlaying` only tests for a redshirt, not injury, so `Next Man Up`
   tells a player in a walking boot to take every snap. ~73 events. Bring it with a measurement.
6. **The engine is re-frozen.** DECISION 066's lift is spent — it covered `requiresRedshirt` and
   nothing else. `src/sim/**` stays open.
7. **Do not reopen type, colour or contrast.** Six playtests, zero visual defects. 041 found none in
   ~130 decisions.
8. **B53 is fully closed.** The Kicker is *"a different career, and the best-served position I
   played."* Two sessions ago it was suspected of being too easy and too thin.
9. **Verify with the worktree diff, not recorded hashes** (DECISION 064), and check that the 8 outputs
   are **mutually distinct** — 044 showed a byte-identity pass can be vacuous if no run reaches the
   code path.
10. Increment the **PM session** counter at the top of this file.

### What session 9 would tell session 10 if it could only say one thing

**Measure the complaint, then check whether the fix you inferred from it is the one the measurement
supports.** Session 9 was handed *"the villainy was free"* and *"six cost verdicts, one phrase
change."* The obvious fix — make misbehaving hurt more — was wrong, and 400 careers per policy said so
before a line was written: a selfish career already ends at character **6.8** and crosses every rung.
The defect was that the player could not *see* a mechanism that was working perfectly. Session 9 also
went hunting for buried writing on a premise it had inherited, and found **100% of the corpus
reachable** and the real hole somewhere nobody had looked — an empty redshirt season.

**Six calls have now been reversed by measurement — B3, B5, B49, B53, B55, and the character-penalty
fix that was never written. None has been reversed by argument.** And this session added a corollary
worth keeping: **two agents pushed back on their briefs and both were right.** Write briefs that can
be argued with.

## Next actions — for PM session 9, in order (executed by session 9; kept for anything unstruck)

**Read this section, `DECISIONS.md` 060–064, and the wave 17–20 sections above. Nothing else.**

**The economy is fixed and nobody has played it.** Four waves landed this session: the playtest that
refuted the last one, the orientation defects, the measurement that inverted the phase's vocabulary,
and the two-stage fix that finally made misbehaving cost something. 671 tests green, both typecheck
passes exit 0, build clean, five commits. **And the last player to touch this game quit after two
careers saying the game was not counting what they did — which is exactly the thing waves 19 and 20
changed, and it has not been seen by anyone.**

1. **The next wave is a PLAYTEST and it is not optional.** Same standing as session 8's, for the same
   reason. Copy `briefs/036-the-losable-career-playtest.md`'s shape. The brief must:
   - **Add the rule that would have saved the last one: append to the report after EACH career,
     before starting the next.** 036's agent was killed holding two careers of unwritten findings and
     was only recovered because it was resumable. See the postmortem in the wave 17 section.
   - Send someone through a career **playing selfishly off the field** — the ticket hookup, the NIL
     money, ghosting the media — and ask whether the cost ever became visible, **in the moment**.
     DECISION 063's mechanism routes it through the locker-room ladder, which the 036 playtester
     named as the only thing in the game that made them want to change how they played. **Does it
     still do that when it is carrying real weight?**
   - Ask directly: **does the game count what you do?** That is the sentence the last playtest lost
     on, verbatim, and it is the one to re-ask.
   - **Play a Kicker again** if the session has room — K's All-American rate is now 3.2%, about one
     career in 31, and nobody has seen what a kicker's ending screen looks like with no honours on it.
   - Re-ask the north star. The curve is *yes → yes → no*, *yes → yes → no → no*, *yes → no → no*,
     *yes → no*. **Nothing has moved it yet.**
2. **Then B43's remaining half** — the redshirt card is offered at SO in 2,991 of 3,000 careers and
   the 036 playtester confirmed it reads as *"an obvious free yes"* that pays **+5 OVR on the offer
   card**, before the season it bets on. Small, well-understood, and it finishes what wave 16 started
   by accident.
3. **Then B44** — redshirt-specific beats. Still the best-aimed authoring target in the phase.
4. **B52 needs the user** — `requiresPlaying` only tests for a redshirt, not for injury, so
   `Next Man Up` tells a player in a walking boot to take every snap. The one-line fix at
   `select-event.ts:37` changes eligibility across **~73 events**, which makes it balance. Bring it
   with a measurement, not a guess.
5. **B55 is worth one cheap count** before anyone authors new content: how much of the existing
   writing is now gated behind a character band that a good player no longer reaches?
6. **The engine is re-frozen.** 057's and 062's lifts are both spent. `src/sim/**` stays open.
7. **Do not reopen type, colour or contrast.** Four playtests, zero visual defects.
8. **Do not re-measure skimming onset.** Settled at decision 1 for replays.
9. **Verify with the worktree diff, not the recorded hashes** — see the Verification method section.
   DECISION 064: the written-down baselines rotted for two waves and nobody noticed.
10. Increment the **PM session** counter at the top of this file.

### What session 8 would tell session 9 if it could only say one thing

**Measure the complaint before you implement it, and check the instrument before you trust the
reading.** This session refuted its own playtester twice (the ending screen was not ranking backwards;
the Kicker was not too easy), shipped a user-chosen fix that provably did nothing, and found a
verification step that had silently decayed into a ritual two waves earlier. **Every one of those was
caught by measuring rather than assuming, and every one would have shipped as a wrong fix otherwise.**
Four of this phase's calls have now been reversed by measurement — B3, B5, B49, B53 — and not one has
been reversed by argument.

## Next actions — for PM session 8, in order

**Read this section, `DECISIONS.md` 053–059, and the wave 14, 15 and 16 sections above. Nothing else.**

**The build has never been in better shape, and it has never been less playtested.** 650 tests green,
both typecheck passes exit 0, build clean, three waves committed this session — and the largest
behavioural change of the entire phase (`d310e87`) has not been seen by a single player.

1. **The next wave is a PLAYTEST and it is not optional.** The game can now be lost. Nothing else on
   this board matters until someone has lost a career and told us whether they understood why.
   **DECISION 058's stated falsifier is exactly this:** *a playtester who loses a career and cannot
   say why.* If that fires, the decline is not doing the job it was chosen for and the cheaper
   floor-only version was the better buy. The brief must:
   - send someone through a career **deliberately played badly**, and ask — at the moment it
     happened, not in hindsight — **did you see it going wrong, and what told you?**
   - **play a Kicker.** Two open items ride on it: DECISION 059's falsifier (is K too easy now?) and
     K's pre-existing round-1 gap.
   - ask whether the offseason feels emptier now that the declare card is gone (open item 2 above).
   - re-ask the north star. The curve has been *yes → no → no* for three playtests running; this is
     the first wave that changed what the game **is** rather than how it reads.
   Copy `briefs/031-post-wave13-playtest.md`'s shape. **Serial — one browser agent at a time, always.**
2. **Then B43's remaining half** — the redshirt card is still a free buy at SO, which is when
   essentially every player sees it. Small, and it finishes what wave 16 started by accident.
3. **Then B44** — redshirt-specific beats. Best-aimed authoring target in the phase, and open item 2
   makes the upperclass offseason a second target beside it.
4. **The engine is re-frozen.** DECISION 057's lift was for the declare removal and the downside
   mechanism. Both spent.
5. **Do not reopen type, colour or contrast.** Three playtests, zero visual defects.
6. **Do not re-measure skimming onset.** Settled at decision 1 for replays across three playtests.
7. Increment the **PM session** counter at the top of this file.

1. **B45 + B46 + B47 are the top of the board** — they are waves 12–13 finished, not new work, and
   they are the reason reading still does not pay. B45 is a real code gap at `reducer.ts:93`; B46 is
   pure hierarchy, which is this phase's strongest muscle; B47 is one sentence. All three are UI and
   none needs the user.
2. **B32/B43 is ONE item and it is blocked on the user** — routes A and B in DECISION 054. Do not
   start it without an answer; A and B produce different cards.
3. **B44 — redshirt beats.** The best-aimed authoring target this phase has found. Content, frozen,
   so it is a proposal. Smaller than DECISION 045's offseason target.
4. **Onset is settled at decision 1** for replays, three playtests running. Stop re-measuring it.
5. **The engine is frozen.** 049's lift is spent.
6. **Do not reopen type, colour or contrast.** Three playtests, zero visual defects.
7. **A playtest measured at 1456px is now available** — previous layout answers were taken at a
   pinned ~800px and should not be trusted over 031's.
8. Increment the **PM session** counter at the top of this file.

## Next actions — for PM session 7 (executed by session 7; kept for anything unstruck)

**Read this section, `DECISIONS.md` 045–052, and the wave 12 and 13 sections above. Nothing else.**

**The build is in the best state it has been in.** 644 tests green, both typecheck passes exit 0,
build clean, three waves committed. Waves 12 and 13 closed the mechanism DECISION 046 identified:
cards account for themselves, the header stops contradicting itself, a player who sits does not make
plays, the desktop room is used, and a bad ending stops looking like a trophy.

1. **The next wave is a PLAYTEST, not more building.** Four waves of change have landed since 025 and
   nothing has been played by fresh eyes since. The north star is *a playtester who has never seen it
   playing three careers in a row without being asked to* — that is a measurement, and it is overdue.
   **The brief must carry three questions this session created and cannot answer itself:**
   - **DECISION 051's falsifier.** Send them through a **redshirt season deliberately** and ask
     whether it felt thin or repetitive. The gate collapsed that season's event pool 81 → 12 and the
     career-wide metric would not notice.
   - **Does the card's number now agree with its words?** That is what waves 12–13 were for. 025's
     mechanism was that contradictions made skimming rational; ask directly whether they still find
     any, and hand them 026's six rows to confirm or refute.
   - **Onset, again.** 025 put it at decision 1 for careers 2–4 because every career opens on Signing
     Day. Nothing since has changed the offseason. Expect it to still be decision 1 — and get the
     number, because DECISION 045's redirected authoring budget is waiting on it.
   Copy `briefs/025-post-wave9-playtest.md`'s shape. **Serial — one browser agent at a time, always.**
2. **Then B32** — the declare card reads as a trap, not a gamble. Held out of waves 12 and 13 because
   it wants `advance.ts` and `view-model.ts`. **DECISION 025 refused a round projection by name**, so
   the fix is not `draftStock` and not a projection: a gamble should look like one before it is taken.
3. **B34** — the Moments reel prints one milestone four times. Confirmed with evidence this session
   (DECISION 052: a fixture career carries *"Enjoyed the bowl trip more than the bowl game"* in four
   consecutive seasons). The cause is content — the milestone fires every season.
4. **B38, B39, B40, B41, B42 are the new backlog.** B41 and B42 are balance and go to the **user**;
   B38 is small and UI-side; B39 is cheap content; B40 is the same class as B30.
5. **The engine is re-frozen.** DECISION 049's lift was for three named sites. All spent.
6. **Do not reopen type, colour or contrast.** 025 found zero visual defects; waves 12–13 added none
   that any measurement has found.
7. **Tooling that cost this session real time — do not rediscover it (DECISION 052):**
   - `resize_window` **silently no-ops** in this browser. Measure breakpoints by running the app in a
     **same-origin iframe** sized to the exact viewport and reading real rects from it.
   - Driving a career by clicking in a JS loop **hits the 45-second CDP timeout** after ~3–10 clicks.
     Batch small, or skip the UI: write a terminal `GameState` straight into
     `localStorage['cfb-career-sim:v1:current']` as `{schema: 1, state, resolved: null}` and the app
     restores to it.
   - **If a grep over a source file returns nothing you are certain is there, run `file` on it.** A
     literal NUL byte in a template string made `grep` skip `view-model.ts` entirely.
   - `npx tsx src/sim/repetition-probe.ts 24 B card` (or `C`, or `all`) is the committed gate for any
     repetition claim. Use both cohorts; neither alone exercises all five opener variants.
8. **`npm run play` baselines moved this wave, by approval.** Current md5s:
   `24 random cd2d3895e9c68e8dc485bfa5cc0fc832` · `77 random 7d6ee0df708a92555edb968ccc65ce64` ·
   `101 random f2ffe2b55fdbf8bf710182f64b871edb`.
9. Increment the **PM session** counter at the top of this file when you take over.

## Next actions — the wave 12/13 list, kept for anything unstruck

### The original PM-session-6 list, now executed

#### Next actions — for PM session 6, in order

**Read this section, `DECISIONS.md` 042–047, and the wave 10, 11 and 12 sections above. Nothing else.**

1. ~~**Wave 12 is three lanes and they are file-disjoint. Dispatch them together.**~~ **Dispatched as
   two lanes** (026, 027) — DECISION 047 moved lane B to wave 13 because it shares `CareerScreen.tsx`
   with lane A. Lane B's detail is kept below; it is the top of wave 13.
   - **Lane A — B30 + B31, the reason reading stopped paying.** DECISION 046. A card accounts for
     what *it* did; a deferred effect falling due is its own beat with its own sentence. Owns
     `src/ui/session/reducer.ts`, `view-model.ts`, `types.ts`. **Read 046 before writing the brief
     and paste its three causes into it** — the failure mode is an agent "fixing" six pieces of
     correct writing. B31's remedy must work without an integer, or it is a proposal against
     DECISION 002 and goes to the user.
   - **Lane B — B29, the empty room.** Now measured: a ~755px band in 1456px, the decision screen
     using about a third of its area, *"a phone layout that was never given a desktop breakpoint."*
     The playtester names the fix themselves — the void under the year rail would hold the season
     stat detail the ending screen already lays out. Owns `CareerScreen.tsx`, `career.css`. **This is
     no longer blocked on B10/imagery**; 025 reports no visual defects and plenty of dead space, so
     the room is real and empty independent of art.
   - **Lane C — B36 + B37, the credibility defects.** `3 FG · 6 Points`; `ON THE FIELD: on the scout
     team` beside 339 snaps; *"climbing draft boards"* at 60 OVR; *"Ten wins is a disappointing
     season"* beside 5-7; the redshirt card saying sit when the season was played. Cheap, mixed
     causes, and each one is a small proof that the words are not to be trusted. Owns `labels.ts`,
     `bands.ts`, `ledger.ts` and — where a fix needs a condition rather than a label — a **proposal**,
     not an edit.
   **Do not put B32/B33/B34 in this wave**; they touch `SummaryScreen.tsx` and the declare card, and
   lane A is changing what a resolved card means underneath them.

2. **B33 is dispatched as wave 13 (brief 030). B32 is held to wave 14** — the ending and the declare
   card. B32 is the sharper one: wave 9
   made declaring early genuinely cost 8 points of stock and the card still frames it as *"Cash in
   now"* with no warning. **DECISION 025 refused a round projection by name**, so the fix is not
   `draftStock` and not a projection; it is that a gamble should look like one before it is taken.

3. **The seven milestone events are NOT written — DECISION 045.** Onset is decision 1 in careers 2–4.
   If the authoring budget is spent at all, 025 names the target: the **offseason sequence**
   (Redshirt? → Declare? → Transfer Portal → Fall Camp Battle → New Workout Regimen), identical words
   and order every year at every position. Three of those five are hub strings in `advance.ts`, so
   that is an engine proposal and a **user** decision under DECISION 030's shape. It is smaller than
   the seven events and aimed at the measured cause.

4. **B24 has a boundary now.** Position is real in-season — the Kicker cards were the only thing the
   playtester said they *enjoyed* — and identical in the offseason at all four positions tried. Scope
   it to the offseason, where it merges with (3).

5. The engine is **re-frozen.** 029's lift was for B18/B19, 039/040's for three named defects, 042's
   for one additive condition field. All spent. A further change writes a proposal and asks.

6. **Do not reopen type, colour or contrast.** 025 found zero visual defects at 1456px — nothing
   clipped, overflowed or collided, contrast fine. Waves 4–8 are done.

7. **`npx tsx src/sim/repetition-probe.ts 24 B card`** (or `C`, or `all`) is the committed gate for
   any repetition claim. Use both cohorts; neither alone exercises all five opener variants.

8. Increment the **PM session** counter at the top of this file when you take over.

## Next actions — the older list, kept for anything unstruck

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

## Verification method — read this before committing anything

**The PM commits.** Agents never do. Before a commit, the PM verifies:

1. `npm test` — all green (**671** as of `2ed2f9c`).
2. `npm run typecheck` — **both** passes exit 0.
3. `npm run build` — clean.
4. `git status --porcelain src/engine src/content` — **empty**, unless this wave carries an explicit,
   logged freeze lift, in which case read the whole diff and confirm it matches what was authorized.
5. **Bit-identity, by detached worktree — not by comparing against a written-down hash.**

### The bit-identity check, the way that does not rot

**DECISION 064.** The md5s recorded in this file went stale at wave 16 and nobody noticed for two
waves, because a hand-copied hash is evidence of what someone once saw, not of what the code does
now. Recompute **both** sides instead:

```sh
SCRATCH=<your scratchpad dir>
git worktree add -q --detach $SCRATCH/head-check HEAD
ln -sfn $PWD/node_modules $SCRATCH/head-check/node_modules
for seed in 12345 98765; do for pol in random first; do
  npm run play -- $seed $pol > $SCRATCH/now-$seed-$pol.json
  (cd $SCRATCH/head-check && npm run play -- $seed $pol > $SCRATCH/head-$seed-$pol.json)
  diff -q $SCRATCH/now-$seed-$pol.json $SCRATCH/head-$seed-$pol.json
done; done
git worktree remove --force $SCRATCH/head-check && git worktree prune
```

It never touches the working tree, which matters because the tree routinely holds two agents'
uncommitted work. **Do not `git stash` or `git checkout` to get a clean baseline — use a worktree.**

**Current md5s** (at `2ed2f9c`; recorded as an eyeball aid, *not* as the check):
`24 random` and `77 random` moved with wave 19 by construction — recompute rather than trusting any
number written here. The banner gotcha still applies: `npm run play` prints npm's banner on stdout,
so hash with `npx tsx src/sim/play-headless.ts <seed> random | md5`.

**When a wave legitimately moves the seeds** (any engine or content change), say so in the commit
message and move on — bit-identity is a check on *unintended* movement, not a prohibition.

## Handoff protocol

Full PM instruction set: `docs/superpowers/polish/PM-PROMPT.md`. Read it, then this file.

Agents write findings to `reports/NNN-slug.md` and return **only** status, ≤5 bullets, and the path.
Never full findings — this is the main lever on PM context size.

After ~3–4 waves, or whenever the session feels long: finish updating this file, then tell the user
to start a fresh PM session with:

> You are the PM for the CFB polish phase. Read `docs/superpowers/polish/PM-PROMPT.md` and begin.

Increment the **PM session** counter at the top when you take over.
