# Design Decisions

Append-only. One entry per decision, with its reasoning, so nobody re-litigates it three waves later.
If a decision is reversed, **do not delete it** — add a new entry that supersedes it and say why.

Format: `## NNN — <decision>` · date · who · rationale · what would change our mind.

---

## 001 — Outcome narration comes from the engine, via `GameState.lastOutcome`
**2026-09-13 · pre-polish (Phase 3 build)**

`advance()` resolved an outcome, applied its effects, and discarded `Outcome.description`. 330
authored descriptions across the event files were unreachable by any UI; only 39 of those outcomes
also push a `moment`. The field is additive and the public API stayed at five exports.

It deliberately carries **no positive/negative branch flag** — a UI that colours an outcome red or
green is leaking the option's probability. The prose carries the tone.

## 002 — `character` is never shown as a number; `overall` is
**2026-09-13 · superseded 003 in part — read both**

`character` moves draft stock by about ±7.5 against `overall`'s ~82 points of range. Rendering both
as integers would misrepresent character's influence by roughly an order of magnitude. Character is
shown only as a band phrase.

*Would change our mind:* if character's mechanical weight is ever increased substantially.

## 003 — `overall` shown as an integer throughout (reversed 002's original half)
**2026-09-13 · after measurement — full writeup in spec §15**

Originally `overall` was hidden behind qualitative bands until the summary, to avoid inviting
reload-and-compare optimization play. Measurement over 300 careers / 7,926 decisions killed it:

| | |
|---|---|
| Decisions where `overall` moved | 44.5% |
| Decisions where the *band* moved | 12.2% |
| Band changes per career | median 3 |
| Careers with zero band change | 19 / 300 |

The bands absorbed ~3/4 of all progression feedback. And the optimization argument assumes cheap
retries, which this game does not have — no undo, choices commit on click, and re-rolling one
decision means clearing `localStorage` and replaying a median 24 decisions.

The band phrase survives as a **gloss** on the number, not a replacement.

*This is the model for how calls get made here: measure, then decide.*

## 004 — `view-model.ts` is the only module that reads `GameState`
**2026-09-13 · pre-polish (Phase 3 build)**

Screens receive a `CareerView`. Values the hidden-mechanics rule forbids — `tier`, `draftStock`,
`probability`, `weight`, `snapModifier`, trait names — never enter it, so they cannot be rendered.
This makes the rule a property one test asserts over one boundary rather than a promise repeated
across five components.

**Do not let an agent bypass this boundary.** If a screen needs new data, it goes through the
view-model.

## 005 — Copy-as-text share card, no rasterizer
**2026-09-13 · pre-polish (Phase 3 build)**

No `html-to-image` dependency. Text survives being pasted into a chat better than an image, works on
every device, and the summary screen is designed to be screenshot-worthy on its own. The seed line is
never omitted — it is the only thing that makes a shared result checkable.

*Would change our mind:* if playtesters report the text block feels thin next to the reference
game's shareable artifact.

## 006 — The reference's three most attractive mechanisms are rejected on purpose
**2026-09-13 · PM, from the 002 teardown**

The teardown found the reference game does three things that look like the best ideas in it and that
we will **not** copy. Recorded here because each will look like an obvious win to a future agent
reading the reference cold:

1. **Explicit probabilities on the option chip** — verified live: "Take it → +5 OVR 75% / Suspension
   25%". Flatly forbidden by the hidden-mechanics rule. It is also what makes their game a calculator
   rather than a gamble.
2. **Pre-colouring outcomes emerald/rose before the player chooses.** `src/engine/types.ts` names this
   exact leak in its `lastOutcome` comment — a UI that colours an outcome by branch is leaking the
   option's probability. The engine deliberately strips the flag; the prose carries the tone.
3. **The slot-machine outcome reveal** — chips cycling green/red every 200ms before landing. The most
   tempting thing in their build, and a probability leak by construction: it discloses the branch set
   before the result.

*Would change our mind:* nothing short of reversing the hidden-mechanics rule itself, which is master
spec Phase-2 §4 and not a polish-phase call.

## 007 — Time orientation is a persistent ledger, not a counter
**2026-09-13 · PM, from the 002 teardown**

B2 ("no orientation in time") gets solved the way the reference solves it: **not** with "Season 3 of
5" or a progress bar, but with a fixed-length table that is on screen at all times — one row per
career slot, completed rows filled, the current row lifted, future rows visible as empty chrome. The
reference runs 12 hard-wired rows at 56% of the width and 100% of the height of the play area, and
the player reads rise, peak and decline straight off it.

Ours is 4–5 season rows × 4 phases. It answers "where am I" and "how much is left" with zero copy,
and it turns the season boundary into a row filling in rather than an interstitial screen.

Needs **no engine change**: `seasonIndex`, `phase`, `eligibility.classYear` and `seasons` all exist.
It needs one new field on `CareerView` via `view-model.ts` — which is the only module allowed to read
`GameState`, and stays that way.

*Would change our mind:* a playtester reading the ledger as a spreadsheet rather than a story.

## 008 — Type register inverts: smaller and much heavier
**2026-09-13 · PM, from the 002 teardown**

Measured: 125 of 156 size declarations in the reference bundle are ≤12px; 112 of 142 weight
declarations are `font-bold` or heavier; `leading-none` appears 43 times against `leading-tight` 8.
Live, the decision headline is 18px/800, its description 12px/500, the option label 15px/700, rail
labels 8–9px/700 uppercase at 0.15–0.2em tracking. We are running large, light and airy — the
opposite register.

We adopt the **ratio, weight and leading**, and raise the floor: no 8px or 9px body text, and the
4/6/7px tier in their bundle is rejected outright as a rendering artefact, not a design decision.
Prose stays at 500 weight; 900 is reserved for numerals.

*Would change our mind:* legibility complaints from a playtester at the raised floor.

## 009 — Engine proposal P1 approved: `overall` and `classYear` join `SeasonLine`
**2026-09-13 · PM, from the 004 audit · the first deliberate crossing of the frozen-engine line**

`SeasonLine` (`src/engine/types.ts:24-31`) carries `seasonIndex`, `schoolId`, `snaps`, `stats`,
`teamWins`, `teamLosses` — and no `overall`, no `classYear`. Two consequences, both fatal to the
ledger DECISION 007 commits us to:

- The career arc — the reference's single most-praised read, a right-hand column going 50 → 82 → 66 —
  **cannot be reproduced.** The view-model is a pure function of *current* `GameState`, and nothing
  anywhere records what OVR was at the end of each season.
- A redshirted career labels its rows **FR, SO, JR, SR, SR**. `enterOffseason` advances `classYear`
  on every boundary including the redshirt year (`advance.ts:221-225`) and `CLASS_ORDER` runs out.
  Past class years are stored nowhere, so the view-model must derive them backwards by index, which
  is ambiguous exactly when a redshirt has been taken.

**Approved.** Two fields, written at write sites that already exist (`advance.ts:274`, and the
development step at `:194-202`). Conditions on the implementing agent:

1. **Additive only.** No behaviour change, no public-API change — the API stays at five exports. The
   values written are ones the engine has already computed; nothing is recalculated, reordered or
   re-rolled.
2. **No balance effect, and this is the test of that:** `npm run play -- <seed> random` must produce
   byte-identical JSON before and after for the same seed. Run it on three seeds and paste the diff
   (empty) into the report. If any seed's output moves, stop and report — the change was not additive.
3. **Old saves must not crash.** `localStorage` holds serialized `GameState`; saves written before
   this change have no `overall` on their `SeasonLine`s. The ledger renders those rows with a null OVR
   rather than `NaN` or `undefined`, and storage does not discard the save over it.
4. 430 tests green, both typecheck passes exit 0. Engine tests asserting `SeasonLine`'s shape get
   updated deliberately, not deleted.

*Why this was mine to call:* the frozen-engine rule sends balance changes to the user. This records a
number the engine already computed and changes no outcome — it is plumbing, and it has the same shape
as DECISION 001's additive `lastOutcome`. The user is being told, not asked. **The alternative was
worse:** snapshotting OVR per season in `UiState` scatters career history outside the one module that
owns it and would survive exactly until someone cleared a save mid-career.

*Would change our mind:* if condition 2 fails on any seed.

## 010 — The ledger is always five rows; the fifth is the redshirt slot
**2026-09-13 · PM, from the 004 audit §4.3**

Our career is 4 rows until the player takes a redshirt, then 5. A table that grows a row mid-career
changes the "how much is left" signal underneath the player — which is the one job the ledger exists
to do (DECISION 007), so a variable-length table is self-defeating.

**Always render five rows.** The fifth is drawn as a redshirt slot, visibly more tentative than an
ordinary future row until `eligibility.redshirtUsed` is true, at which point it becomes a normal row.

This shows a player who has not redshirted that a fifth year is *possible*. That is not a hidden
mechanic — redshirting is a real decision the game offers, not a tier, a probability or a trait — and
teaching it through the interface is a gain, not a leak.

Row labels come from stored `classYear` once DECISION 009 lands; the redshirted row is labelled `RS`.

*Would change our mind:* a playtester reading the fifth row as a promise rather than a possibility.

## 011 — `app.css` gets split before any visual work starts
**2026-09-13 · PM, from the 004 audit "files most contended"**

Ten of thirteen identified gaps touch `src/ui/styles/app.css` — one flat 475-line file whose only
internal boundaries are `/* ---------- */` comments. Two agents cannot work in it concurrently, so
the entire visual backlog is one serial lane.

A mechanical split into `tokens.css` / `base.css` / `career.css` / `summary.css` / `creation.css` /
`log.css` (imported once at `main.tsx:4`) turns that lane into three. It is S-effort, changes no
selector, no value and no rendered pixel, and needs no test change.

**It runs first and alone.** Nothing else is dispatched into `src/ui/**` until it lands, because
every other CSS task would conflict with it.

*Would change our mind:* if the split cannot be done without changing cascade order. Selector order
across the concatenated files must be preserved exactly — that is the one correctness risk, and the
verification is a visual diff of all four screens before and after.

## 012 — Dynamic range comes from magnitude, never from a branch flag
**2026-09-13 · PM, from the 003 playtest · refines 006, does not reverse it**

The playtest's second-ranked finding: *"My kicker tore something in his leg — 66 → 58, demoted from
'in the rotation' to 'on the scout team' — and it looked exactly like the card where he talked his
way out of a speeding ticket. Nothing in this game is ever louder than anything else."*

The obvious fix — red for bad, green for good — is the thing DECISION 006 forbids. It is still
forbidden. The line, precisely:

**Forbidden:** any colour, icon or emphasis attached to an option *before the player chooses*; any
signal derived from an outcome's positive/negative branch flag; anything that reveals the branch set.
The engine strips the flag deliberately and `src/engine/types.ts` names this exact leak.

**Permitted:** emphasis on a *resolved* outcome, keyed to **the magnitude of change in values the
player can already see** — the OVR delta, a band crossing, an injury becoming active. This discloses
nothing new: `overall` is on screen at all times (DECISION 003), so a −8 is already visible as a
number. Rendering it *quietly* is the bug; rendering it *loudly* is not a leak.

The practical rule: **scale, weight and motion may track magnitude. Hue may not track valence.** A
−8 and a +8 may both be loud; they may not be red and green. This also fixes the playtester's other
complaint — that the Continue card "is the one screen whose whole job is 'here is what happened' and
it does not tell you what happened."

*Would change our mind:* if a playtester can predict an unchosen option's branch from the resolved
card's treatment.

## 013 — The current season's row comes first; the full ledger follows
**2026-09-13 · PM, from the 003 playtest · refines 007 and 010, reverses neither**

DECISION 007 committed to the reference's always-visible fixed-length ledger. The playtest partly
contradicts it, and the correction is worth having:

> *"At the moment of a normal card I did not want a progress table — those are character beats and I
> answered them as myself. A table would have been furniture."*

Orientation was wanted badly at exactly **three** cards — Redshirt?, Declare for the Draft?, Transfer
Portal — and what was wanted there was not a progress bar but **the season line already owed**:
record, snaps, stat line, *this* year. *"Show me the row I'm currently writing, not how many rows are
left."*

One thing did want the full table: **career length.** *"'Four years to get drafted' is on the title
screen and then never referenced again. I finished career 1 as a senior having genuinely lost track
of whether a fifth year existed."*

**Revised build order:** the current season's row ships first and is the priority. The full
five-row ledger (DECISION 010) still ships — it answers the career-length question and delivers the
current row as a side effect — but it is no longer the lead item, and it must not turn the decision
screen into furniture. The three high-stakes cards are where it must be legible.

*What this does not change:* 007's mechanism (a table, not a counter) and 010's fixed five rows both
stand.

## 014 — The season record does not exist mid-season. This is an engine fact, not a display bug
**2026-09-13 · PM, from the 003 playtest + source verification**

The playtest's top-ranked finding was *"the header said `0-0` for my entire quarterback career; at the
draft screen it told me I had gone 5-7, 3-9, 5-7. The data already exists and is withheld."*

**It does not already exist.** Verified in source: `runPostseasonResolver`
(`src/engine/postseason.ts:69-73`) calls `simulateTeamRecord` **once, at the end of the postseason
phase**, and assigns the whole season's W-L in one shot. `SeasonLine` is pushed with
`teamWins: 0, teamLosses: 0` at `advance.ts:276` and stays that way all season. `0-0` is not a lie
the UI tells; it is the true state of an unsimulated record.

**Snaps and stats are different — those do accumulate live** (`effects.ts:36,41`, `simulate.ts:27`).

So the finding splits in two:

1. **UI, ours, shipping now:** stop rendering a record that does not exist yet. Show the *live* stat
   line and snaps during the season, and the record only once it is real. This delivers most of what
   the playtester actually wanted and needs no engine change.
2. **Engine, the user's call, not taken:** making W-L accrue game-by-game means moving
   `simulateTeamRecord` out of the postseason resolver and changing the RNG draw order — every
   existing seed would produce a different career. That is a balance change and a save-compat break.
   **Not proposed.** The UI fix above is most of the value at none of the risk.

*Would change our mind:* a playtester who gets the live stat line and still reports the missing
in-season record as a hole.

## 015 — `RS` is not derivable; the ledger labels rows without it for now
**2026-09-13 · PM, from the 006 engine report**

DECISION 010 said the redshirted ledger row would be labelled `RS`. It cannot be, and the engine
change did not fix it: a redshirted career stores `FR, SO, JR, SR, SR` with **the duplicate at the
end, never at the redshirt year**. The stored `classYear` is therefore ambiguous exactly where the
label matters. The 006 agent raised this rather than adding a third engine field — correct call.

**Not taken: a third engine field.** DECISION 009 authorized two fields on the argument that they
record values the engine already computes. A redshirt marker is a new fact, the frozen-engine line
has been crossed once already this phase, and the payoff is one row label.

**The ledger brief decides between:**
1. Infer the redshirt row from `snaps` ≈ 0 on a row whose `classYear` duplicates its successor's, and
   **measure how often that inference is right** before shipping it. The audit already flagged this as
   an inference rather than data.
2. Label rows by sequence (Year 1–5) with the class year as a secondary read, sidestepping the
   duplicate entirely.
3. Ship the duplicate honestly — two `SR` rows — and let the empty snaps column say which was sat.

Option 2 is the safe default if the measurement in option 1 is not clean. **Do not ship two
identically-labelled rows with no distinguishing mark** (option 3 unadorned) — that is the "header
lies" failure in a new place.

*Would change our mind:* if the snaps inference measures clean across a few hundred redshirt careers,
option 1 is both free and correct.

## 016 — A killed agent's work is verified, not discarded, and not trusted
**2026-09-13 · PM, from the rate-limit incident**

All three wave-2 agents were killed mid-flight by a session limit. One had already written a six-file
CSS split but died before verifying it: correct-looking work, zero evidence.

Both reflexes are wrong. Discarding it wastes a completed task; trusting it ships an unverified
refactor of the file 10 of 13 gaps depend on. **The PM verified it by hand** — concatenating the six
files in import order, normalizing whitespace and comments, and diffing against the original: 379
identical lines, 75 selectors in identical order, then 430 tests, both typecheck passes, clean build.

Then the brief was rewritten to mark step 1 done *with the proof inline*, so the re-dispatched agent
could not waste a session redoing it or "improving" it.

**Standing rules this produced, now in every brief:**
- The dev server is already running; never run a foreground command that does not exit. (`npm run dev`
  killed the first playtester.)
- If a tool call fails 3 times, stop and write up what you have.
- **Do not commit, and never `git checkout`/`restore`/`stash`** — the tree routinely holds verified
  uncommitted work from two or three concurrent agents, and one revert would destroy it.

## 017 — The repetition problem is five events, not a content shortage
**2026-09-13 · PM, from the 008 measurement (864 instrumented careers, all six positions)**

The playtester's boredom was real, reproducible, and locatable to a decision number:

| | |
|---|---|
| Five fixed `milestone-*` events as a share of a four-year career | **40%** of decisions (60% with hub cards) |
| Careers where they fire every season | **100%** |
| First verbatim repeat | **decision 13**, in **99.3%** of careers (`milestone-opener` in 62% of cases) |
| Decisions re-showing an already-seen event | **45%**; worst decile 50.7% |
| Events one career sees | 18 of 102 (**17.6%**) |
| Outcome strings one career sees | 24 of 330 (**7.3%**) |
| New content on a 4th career, same position | **18.5%** of decisions |

**The finding that changes the plan: this is not a content-volume problem.** 98 of 102 events fire;
the random pool works fine. The damage is concentrated in five metronomic cards — and **three of them
have exactly one option** (Season Opener, Fall Camp Battle, Senior Day). So on 40% of decisions the
player is not choosing anything. They are re-pressing a button they have pressed before, in a game
whose entire proposition is choosing.

That reframes it from "write more content" to "stop the five cards that fire every season from being
identical, and stop three of them from pretending to be decisions."

**Ranked, cheapest first:**

1. **Do not let a one-option milestone cost a tap.** Spec §4 already says one-option beats skip the
   outcome step; these cards can carry their prose on the *following* card or resolve without an
   interaction. Pure UI, no content edit, removes the most galling repetition at zero balance risk.
2. **Show what the card did.** "Win the job" — the only option — silently cost 1 overall. DECISION 012
   already authorizes rendering the delta. Repetition hurts far less when the card reports something.
3. **Vary the five milestone texts.** Content authoring, and the only fix that actually solves it.
   **Start with `milestone-opener` alone** — 62% of first repeats — write per-season variants, and
   re-run the 008 harness to confirm the first-repeat decision number moves. Prove the approach on one
   event before committing to five.
4. **Gate the early all-star/combine invite.** ~25% of QB/OL/DL/DSKILL careers get it as a FR or SO,
   and its whole fiction is "your last impression before the draft."

**Two claims this measurement refuted, both worth recording:**

- **`Redshirt?` is not being offered to stars.** The playtester suspected it; median OVR at the offer
  is **65** and only **3.4%** are ≥75. The real oddities are different: a true freshman is *never*
  offered it, and **48.8%** of careers are asked twice.
- **B13 is not a bug.** `sitSnapModifier` is 0.05, so **100%** of redshirt seasons credit snaps
  (median 26 — the playtester's 9 was the p10). That is almost certainly the four-game redshirt rule
  being modelled, not a contradiction. **The bug is the telling, not the mechanic:** the UI says you
  sat out and then credits you snaps. Fix the wording, not the engine.

*Would change our mind on item 3:* if the `milestone-opener` pilot does not move the first-repeat
number, the problem is structural (the fixed season skeleton itself) and content volume will not fix
it either.

## 018 — A one-option card is a narrated beat, not a decision: it resolves on arrival and keeps its prose
**2026-09-13 · PM session 2, from reading `reducer.ts:85-89` against DECISION 017 item 1**

DECISION 017 ranked "do not let a one-option milestone cost a tap" as the cheapest fix for the 40%
of a career that is metronomic. Reading the code changes the diagnosis. `reducer.ts:88`:

```ts
const skipOutcome = outcome === null || decision.options.length === 1;
if (skipOutcome) return settle(ui, next, null);
```

**The tap was already saved. What it was bought with is the prose.** Every one-option card already
resolves in a single press — and throws `next.lastOutcome.description` on the floor. DECISION 001
made those 330 authored descriptions reachable precisely so this could not happen. So "Win the job"
costing 1 overall and showing nothing is not a styling failure and not a content failure; it is this
line trading the writing away to save an interaction.

Both are available. **A one-option decision resolves the moment the player arrives on it**, and the
card renders title, description, the option label as a quiet line, the authored outcome, and the
delta (DECISION 012), behind a single Continue. One interaction, prose intact, and the card never
pretends to offer a choice it does not have.

Invariants the implementation must hold:

- Exactly one `advance` per card. Auto-resolution must be **inside the reducer**, not a `useEffect` —
  React re-invokes effects in StrictMode and a double `advance` would silently consume a decision.
- It resolves **at most one level** and stops with `resolved` non-null. Two consecutive one-option
  cards must produce two cards, not one skipped one.
- Multi-option decisions are untouched. Hub cards (Signing Day, transfer, declare) author no prose
  and keep today's behaviour.
- The engine is not called differently, only at a different moment in the UI's own sequence. Same
  seed, same draws, same career.

*Why this is a PM call and not the user's:* no engine or content file changes, no balance effect, and
it restores authored text the game already ships rather than adding any.

*Would change our mind:* if a playtester reads the merged card as two events run together — that
would mean the beat needs a visual seam, not that the merge was wrong.

## 019 — The context rail is a fixed slot that never reflows, and it reports the season the card belongs to
**2026-09-13 · PM session 2 · implements 013/014, and fixes what report 007 found**

Three separate findings land on the same strip of interface:

1. Report 007: **71% of resolved cards showed the wrong phase** (270 of 378 cards, 36 of 36 careers).
   `App.tsx` builds the view from post-`advance` state while `resolved` carries pre-`advance` prose.
   `Resolved.stamp` already exists and is taken before `advance()`; nothing reads it yet.
2. Report 007: removing the fake `0-0` (DECISION 014) makes the rail **reflow worse**, because the
   node vanishes instead of emptying. The playtester's "the header changes shape between cards" is a
   layout fault, not a content one.
3. DECISION 013: orientation is wanted at the **season-line** level — record, snaps, stat line, this
   year — not as a progress bar.

**The rail is a fixed-height slot with fixed cells.** A cell with nothing to say renders empty and
keeps its space; no cell appears or disappears between cards. It carries the season identity and the
live season line, and it reads the **stamp** whenever a resolved outcome is on screen, so the strip
always describes the card being read rather than the state the engine has already moved to.

The record still renders only once it is real (DECISION 014). Its slot is held regardless.

*Would change our mind:* a playtester who reads the held-empty cells as broken rather than pending.

## 020 — Ledger rows are labelled by sequence. DECISION 015's open question is closed, and its "would change our mind" clause is withdrawn
**2026-09-13 · PM session 2, from the 010 measurement (1,536 careers, 4 cohorts, all six positions)**

DECISION 015 left three ways to label a redshirted career's ledger rows and required a measurement
before choosing. The measurement is in, and it settles it: **option 2 — rows are labelled `Year 1`
through `Year 5`, with the stored class year as a secondary read.**

What decided it is not the snaps signal everyone expected to decide it:

| | |
|---|---|
| Redshirt careers where the duplicate-`classYear` gate is present at all | **40.6%** (427 of 1,051) |
| Of those, cases where the gate points at the **wrong row** | **99.8%** (426 of 427) |
| Careers where the redshirt actually sits at season index 1 | 955 of 1,051 |
| Snaps separation, redshirt vs. ordinary rows | median **26 vs 461** — clean |
| Best snaps threshold (T=52) over 5,390 rows | 0 false negatives, 31 false positives |

**The snaps inference works and is still wrong.** It identifies a redshirt row with ~99.4% accuracy
— and that row is not the ambiguous one. The stored duplicate lands at the *end* of the career while
the redshirt is taken at season index 1, so labelling the snaps-identified row `RS` leaves the two
identically-labelled `SR` rows exactly where they were. That is option 3 unadorned, which DECISION
015 forbids: a correct label in the wrong place buys nothing and costs the row that needed it.

**DECISION 015's "would change our mind" clause is hereby withdrawn.** It read: *"if the snaps
inference measures clean across a few hundred redshirt careers, option 1 is both free and correct."*
It measured clean. It is neither free nor correct, and the clause as written would send the next
agent to re-derive a 99.4% accuracy figure and re-propose a label that fixes nothing. The clause was
wrong because it assumed accuracy was the binding constraint; the binding constraint is *which row*.

*What would actually change our mind:* an engine field recording the redshirt season index — which
DECISION 015 already declined, on the grounds that the frozen-engine line has been crossed once this
phase and the payoff is one row label. That reasoning still holds, and sequence labels make it moot:
`Year 1`–`Year 5` is unambiguous by construction and answers the career-length question (DECISION
013's one genuine demand on the full table) more directly than class years ever did.

## 021 — The summary verdict is one hue at two intensities. The 011 agent's call stands
**2026-09-13 · PM session 2, ruling on a judgement call raised by the 011 agent**

The summary headline is the most consequential sentence the game prints: a draft round and pick, or
`Undrafted`, or an ending reason. It was set in `--chalk` when the career failed and `--milestone`
(the accent) when it succeeded. The 011 agent moved the failed case to a **dimmed `--milestone`** and
flagged it for review, reading DECISION 012 as forbidding the split.

**Upheld, and the agent read it correctly.** The old treatment was a hue tracking valence — the one
thing 012 and 006 both forbid — sitting unnoticed on the screen where it is loudest. What replaced it
is one hue at two intensities, which is exactly the axis 012 permits: *scale, weight and motion may
track magnitude; hue may not track valence.*

**The argument for allowing a hue split here, and why it loses.** The leak rationale genuinely does
not apply at the summary: the career is over, every branch is resolved, and there is nothing left for
a colour to disclose. A red washout would leak nothing. It loses anyway, on two grounds. First, the
rule is worth more as a categorical one than as a rule with a carve-out a future agent has to
re-derive — and the carve-out would sit one screen away from the resolved outcome card, where the
same colours *would* leak. Second, `--milestone`'s own definition in `tokens.css` is "a career fact
already known and already on screen, given its headline." A career ended by injury is exactly that.

The intensity drop is doing real work: it is the magnitude of the career, not a verdict on the
player.

*Would change our mind:* a playtester who reads the dimmed accent on `Career-ending injury` as
congratulatory, or who cannot tell a washout from a draft at a glance. This is a direct question for
the next playtest — it goes in the brief. One line to revert if it lands wrong.

## 022 — `--chalk-faint` is raised to clear WCAG AA. The type pass's own "would change our mind" clause, honoured

**Date:** 2026-09-13 · **Made by:** PM session 3 · **Follows:** 008, 012

Report 012 shipped the register inversion and flagged, without fixing it, that `--chalk-faint`
(`#64776c`) carries **thirteen 11px text roles** at a measured **3.83:1 on `--turf`, 3.37:1 on
`--card`, 3.00:1 on `--card-raised`** — all under the 4.5:1 AA floor, and none of those roles is
large enough for the 3:1 large-text allowance. The agent was right not to fix it: colour was not its
brief, and `tokens.css` palette values are a PM call.

**The call: raise the token to `#849a8d`.** One line. Every role assignment the type pass made
deliberately is preserved.

**Why not the value the report proposed.** 012 suggested "roughly `#7e9488`". Re-measured here, that
clears AA on `--card` (4.97) and **fails on `--card-raised` (4.42)** — and `--card-raised` is live at
`career.css:245` and `:392`. A fix that clears one of the three grounds a token is set on is not a
fix. `#849a8d` measures **6.09 / 5.36 / 4.76** across turf / card / card-raised: AA on all three,
with the binding case being the raised card.

**Why not the other option — re-pointing the thirteen roles to `--chalk-dim`.** It also clears AA,
but it retires the bottom tier of the grey ramp as a *text* colour, and does it by editing thirteen
selectors instead of one value. If the tier has to go, it should go as a deliberate collapse, not as
a side effect of an accessibility fix.

**What would change our mind.** The honest cost of this call is that the ramp's bottom two steps
move closer together: `--chalk-dim` is 6.38:1 on `--card` and `--chalk-faint` is now 5.36:1, about
7 L\* apart. That is a real but subtle step. **If the next playtester cannot tell the two tiers
apart — if the de-emphasised micro-copy stops reading as de-emphasised — the answer is to collapse
the tier deliberately (re-point the 11px roles to `--chalk-dim` and stop using faint for text), not
to darken faint back below AA.** This question is added to `briefs/014-post-wave4-playtest.md`.

Note the shape of this one: DECISION 008's own "would change our mind" clause named legibility at
the raised floor as the thing to watch, the type pass measured it, and the clause was honoured in
the same wave rather than three waves later. That is the clause working as intended.

## 023 — DECISION 022 is amended, not reversed: the AA floor holds, and the strip gets size, not tone

**Date:** 2026-09-13 · **Made by:** PM session 3 · **Amends:** 022 · **Evidence:** `reports/014-post-wave4-playtest.md`

022 raised `--chalk-faint` to clear AA and named its own risk: that the ramp's bottom two greys
would stop reading as two tiers. The 014 playtester was asked the question blind and **split the
answer**, which is more useful than either verdict alone:

- **Holds** where the two greys sit on lines of different size and opposite meaning — the rail's
  bright headline against its dim sub-line, the "You chose: X" line against the outcome paragraph.
  *"Unmistakable."*
- **Fails** in the context strip, where rows 2 and 3 are adjacent and similar: *"the tonal step
  between them is gone — what tells them apart is that row 3 is smaller."*

**The call: keep `#849a8d`. Do not darken it back, and do not collapse the tier.** The failure is
local to one component, and 022's alternative (retire faint as a text colour everywhere) would throw
away the two places the playtester says it is working.

**In the strip specifically, separation becomes size and structure rather than tone** — and note the
playtester's second sentence, which matters more than the first: row 3 is *too small to read
comfortably* (claim 7's one casualty). Fixing legibility there likely fixes the tonal complaint as a
side effect, because the rows stop being near-identical in size. Do the legibility fix first and
re-ask; do not reach for a new grey.

**What would change our mind.** If a later playtester reports the strip's rows still merge *after*
row 3 is legible, the answer is a structural separator or a label, not a fourth grey. The ramp is
four steps and stays four steps.

## 024 — The rail does not contradict itself. Two axes are being read as one sentence, and that is B17

**Date:** 2026-09-13 · **Made by:** PM session 3 · **Supersedes nothing; upgrades B17** · **Evidence:** `reports/014-post-wave4-playtest.md` §"The rail contradicts itself constantly"

The 014 playtester flagged, as a **likely regression from the wave-4 rail work**, that the standing
block contradicts itself: *"All-America caliber / just a guy in the building"*, and the sub-line
stuck on one phrase for ~35 consecutive decisions across three seasons and two schools.

**Checked in source before acting. It is not a regression, and nothing in wave 4 touched it.**
`CareerScreen.tsx:85-91` renders `.ovr-band` from `standingPhrase(overall)` and `.trust` from
`trustPhrase(character)` as two unlabelled children of one `.ovr-gloss`, stacked beside the OVR
number. They are **two different axes**. `All-America caliber` is `overall >= 85`; `just a guy in
the building` is `character` in 50–69 (`bands.ts:16,30`). A great player the staff is neutral on is
a coherent and interesting state — the game is describing it correctly.

**So the data is right and the presentation is wrong, which is exactly what B17 said** and what
DECISION 002 could not have anticipated. Three elements — a number, a standing phrase, a trust
phrase — sit adjacent in one dimming ramp with no labels, so they read as one continuous sentence
about *overall*. Read that way, the second clause can only parse as a contradiction of the first.
The ~35-decision stasis compounds it: `TRUST_BANDS` are deliberately coarse (DECISION 002 — character
moves draft stock ~±7.5 against overall's ~82, so a finer dial would misrepresent it tenfold), which
is correct, but a line that never moves *and* appears to describe overall reads as broken rather
than as stable.

**The call: the two axes must be visually separable as two statements.** The fix is structural —
labelling, spatial separation, or attaching trust to something other than the OVR number's gloss.
It is **not** to make the character bands finer (that re-litigates 002, which measured), and **not**
to hide character (B17 says it is already too ignorable).

**What would change our mind.** If a playtester who sees the separated version still reads the two
as one claim, the problem is the phrasing of the trust bands, not the layout.

## 025 — "Currently projected: 6th round" is refused. The playtester asked for `draftStock` by name

**Date:** 2026-09-13 · **Made by:** PM session 3 · **Evidence:** `reports/014-post-wave4-playtest.md` §"If I could change three things", item 2

The 014 playtester's second-highest ask was to *"contextualise OVR"* by showing what the number
means — *"currently projected: 6th round."* Their reasoning is sound: OVR 71 means nothing to a new
player, and the game's biggest number is uninterpretable.

**Refused. That value is `draftStock`, which the hidden-mechanics rule names explicitly as never
displayed** (PHASE3-KICKOFF; spec §7). A live round projection turns every decision into a
reload-and-compare against a visible score, which is the precise failure DECISION 002's reasoning
and the whole hidden-mechanics rule exist to prevent. A playtester cannot be expected to know this,
and the ask is not evidence the rule is wrong — it is evidence the *underlying need* is unmet.

**The need is real and is granted in a different currency.** The other half of the same ask —
**print the transfer delta** — is approved without reservation: the player moved schools and the
OVR moved, and we said nothing. Showing a change that already happened is not a projection of a
hidden score. Beyond that, OVR is already contextualised qualitatively by the standing band, which
DECISION 024 is about to make legible as a statement about overall; that is the sanctioned channel
for "what does this number mean."

**What would change our mind.** Nothing short of the user reversing the hidden-mechanics rule, which
is a game-design decision and not a PM call. If the qualitative channel still leaves players unable
to read their own OVR after 024 ships, the escalation is to the user, not to `draftStock`.

## 026 — The verdict scale: DECISION 021 extended to five steps, still one hue

**Date:** 2026-09-13 · **Made by:** PM session 3 · **Extends:** 021 · **Governed by:** 012 · **Evidence:** `reports/016-the-ending-has-a-range.md`

021 settled the verdict as **one hue at two intensities**. The 014 playtester then found the case it
did not cover: *"#69 overall and #194 overall print identically — same gold, same size, same weight,
same position. I can't even tell a good draft from a bad one at a glance."*

**Approved as proposed by 016.** Five steps — R1 / R2–3 / R4–5 / R6–7 / no call — cut on a measured
round distribution over 600 careers rather than on round numbers chosen by eye. Range is carried by
**scale, weight, the width axis, opacity and entrance travel only.** No new token; `tokens.css`
untouched.

**Why this does not reopen 012.** Hue is constant and was verified in the live page, not asserted:
`.verdict` computes `rgb(240, 180, 41)` at both step 1 and step 4. A great ending and a bad one are
the same colour and differ in how loudly they are said. That is exactly the axis 012 permits and the
one it forbids, in the right order.

**Why it does not overturn 021.** Step 1 is 021's values exactly, so the washout end of the range is
unchanged. 021 is extended at the top, not replaced.

**What would change our mind.** A playtester who still cannot rank two *drafted* endings at a
glance. The lever then is the scale spread (1.12 → 0.72 today), **not** a second hue.

## 027 — HONORS means distinctions. Routine results stay on the page, under a different word

**Date:** 2026-09-13 · **Made by:** PM session 3 · **Evidence:** `reports/016-the-ending-has-a-range.md` §2

The 014 playtester found a two-season career that went 7-5 then 5-7 presented with an **HONORS**
block: *"The screen reads as a celebration regardless of input."*

016 measured why. `allConference` lands on **50.5%** of careers and `bowlWin` on **45.3%**; the
HONORS block fired on **70.5%** of all careers, and on **17.8%** its entire content was the single
line `Bowl Win`. A block that appears for seven careers in ten is not marking distinction, it is
marking participation.

**Approved: honors means distinctions only, rarity-tiered. Routine results are not deleted** — they
remain on the page as chalk chips under an `Also earned` heading. Nothing is taken away from the
player; the screen stops calling a coin-flip outcome an honour. Share text is byte-identical.

**The counter-argument, stated because it is a fair one:** a bowl win *is* an achievement to a real
player, and demoting it is us editorialising. The answer is the measurement — at 45.3% it is not a
distinction — and the context: this is the screen a playtester answered *"no"* to a fourth career
on, having named exactly this as a reason.

**What would change our mind.** A playtester reporting the `Also earned` row reads as a consolation
prize or a demotion. The fix then is the heading's wording, not restoring a block that fires 70% of
the time.

## 028 — Two open questions go to the next playtest rather than being guessed at

**Date:** 2026-09-13 · **Made by:** PM session 3 · **Evidence:** `reports/016-the-ending-has-a-range.md` notes 3 and 5

Two things 016 surfaced are deliberately **not** being decided now, because in both cases the house
habit says a number or a player's reaction beats a PM's taste.

1. **`FINAL OVERALL` can differ from the last season's stored OVR** (80 vs 78 on the `m0` fixture),
   because the verdict reports post-offseason development and the ledger reports the season as
   played. Both labels are accurate and the new span row now states the gap twice on one screen.
   Closing it properly is either an **engine** change (record a post-development OVR on the final
   `SeasonLine`) or a wording change. It is a real confusion but not obviously a bug, so the next
   playtest is asked directly whether the two numbers read as a contradiction.
2. **Re-pointing the `trophy` icon** on `Won the rivalry game`, `Carried the team through bowl
   season` and `First to his feet when a teammate took the award`. The trophy is the most common
   mark in the game and is almost never on an actual trophy (506 and 423 instances of the top two).
   016 shipped the display-layer half — glyphs desaturated, since emoji were the only uncontrolled
   colour on a screen whose rule is that hue never tracks valence — and left the three content
   strings as a **proposal**, correctly, since `src/content/**` is frozen. Not urgent now that the
   colour is under control.


## 029 — The engine comes unfrozen for one scoped balance pass. Numbers are approved before code moves

**Date:** 2026-09-13 · **Made by:** the user, asked by PM session 4 · **Amends:** the `src/engine/**` freeze · **Evidence:** `reports/014-post-wave4-playtest.md` (B18, B19)

The 014 playtester played deliberately badly — skipped the install, ghosted the media twice, played
hurt, declared after two seasons at **OVR 65 on a 5-7 record** — and was drafted **Round 7, Pick 2**.
*"I could not lose."* They had separately worked out that transferring up every offseason is free
OVR, so *"the offseason stopped being a decision."*

**Approved: a proposal-first balance pass.** The freeze is lifted for B18 and B19 only, in two
stages that must not be collapsed into one:

1. **Measure and propose.** An agent measures the current draft-outcome distribution and the
   offseason's option space over hundreds of careers and writes a proposal naming **specific
   numbers** — where an undrafted floor would sit, what a transfer should cost. It edits nothing.
2. **The user approves the numbers.** Only then does anyone touch `src/engine/**`.

**Why the two stages matter.** The engine is finished and good, and the failure mode here is not a
bad idea, it is a plausible idea applied at the wrong magnitude. A PM eyeballing "make it harder"
can quietly destroy a system that works. DECISION 003 and 006 are the house precedent: measure, then
decide.

**What stays frozen.** Everything in `src/engine/**` that is not B18 or B19. This is not a general
licence, and a later wave wanting an unrelated engine change still writes a proposal and asks.

**What would change our mind.** The 017 playtester reporting that failure *does* feel reachable —
in which case B18 is a presentation problem after all and stage 2 is cancelled, with stage 1's
measurement kept.

## 030 — The content freeze is lifted for one pilot event, and the pilot must prove itself on a number

**Date:** 2026-09-13 · **Made by:** the user, asked by PM session 4 · **Amends:** the `src/content/**` freeze · **Evidence:** DECISION 017, `reports/014-post-wave4-playtest.md`

Measured: roughly eight events fire every season and make up ~40% of a career; the first word-for-word
repeat lands at decision 12–13 in 99%+ of careers. Its cost is **indirect and worse than boredom** —
by career 3 the 014 playtester was skimming *every* card body, including brand-new ones they had
never seen. Repetition trains the player out of reading, and the prose is this game's best asset.

**Approved: per-season variants for `milestone-opener` only, agent-written.** It is 62% of first
repeats. Then re-run the 008 harness and **confirm the first-repeat decision number actually moves**
before a word of the other seven events is written.

**Why one event and not eight.** The assumption under this work — that variants fix the *skimming*,
not merely the repeated cards — is untested. One event is cheap to abandon and the harness gives a
yes/no on it. Writing all eight first would be spending the phase's largest authoring budget on an
unvalidated premise.

**On voice.** The user was offered the writing and chose agent-written. So the brief must carry the
voice constraint explicitly and the PM reads every line before it is committed — the 014 playtester
praised the prose by name, and the one thing this pilot must not do is dilute it.

**What would change our mind.** The harness showing the first-repeat number barely moves. The
conclusion then is that variants are not the lever and the remaining seven are not written.

## 031 — Imagery, if it happens, is per-category and reusable. Not per-event, not per-outcome

**Date:** 2026-09-13 · **Made by:** the user, asked by PM session 4 · **Evidence:** `reports/002-reference-teardown.md` §6

The reference gives every option a picture at ~50% of the option card. We have none, and 002 found
the scale problem: ~102 events, ~330 outcomes, 39 photos in the original.

**Approved: a per-category set of roughly 12–20 flat vector pieces** in the turf/chalk palette —
practice, game day, injury, off-field, academics — reused across events. Per-event (~102) and
per-outcome (~330) are both rejected on cost.

**Not yet scheduled, and deliberately so.** This is a sourcing decision with a real cost in money or
the user's time, and it is the one item on the board that the remaining UI waves do not block on.
The shape is now settled so that nobody re-opens it; *when* is still open.

**What would change our mind.** A playtester reporting the screens read as deliberately typographic
rather than empty — in which case no art at all becomes a live option, and the honest move is to
commit to the broadcast-graphic register instead of half-filling it.

## 032 — DECISION 021 is reversed on its own terms: a bad ending is congratulatory, and the fix is hierarchy, not hue

**Date:** 2026-09-13 · **Made by:** PM session 4 · **Reverses:** the "would change our mind" clause of 021, extends 026 · **Still governed by:** 012 · **Evidence:** `reports/017-post-wave6-playtest.md` claims 5 and 6

021 said a washout would print in a dimmed gold rather than a second hue, and named its own
falsifier: *a playtester reporting it reads as congratulatory.* **That report has arrived.** The 017
playtester tanked a career on purpose — transferred *down*, refused the trainer, declared at 61 OVR
off a 2-10 season — and wrote: *"the floor is a gold headline, two trophies and a sunshine emoji."*

026 named its own falsifier too: *a playtester who still cannot rank two drafted endings at a
glance.* **Also arrived.** Round 2 vs Round 3 is unrankable; Round 3 vs Round 7 is easy. The scale
works where careers do not land and fails where they do.

**Both are accepted. 012 is not reopened — hue stays constant.** The two levers are:

1. **The scale spread widens**, as 026 pre-specified. 1.12 → 0.72 does not separate adjacent rounds
   in the band where most careers land (1–4). This was the pre-committed lever and it is taken.
2. **The hierarchy inverts on a bad career.** This is the new part and it is the bigger one. The
   playtester found the one honest element on the screen — `ACROSS 2 SEASONS · 63 → 59 · −4` — and
   noted it is *"set in the smallest, dimmest type available, three screens above the giant gold
   headline. The hierarchy is exactly inverted."* A career that went **down** has that fact rendered
   as its quietest element. On a declining career the arc is promoted; on a rising one nothing
   changes.

**Why this is not "make it red."** The screen is not being made to scold. It is being made to say
the true thing at the size the true thing deserves. A −4 arc stated loudly is a fact, not a verdict,
and it is the same mechanism 012 has permitted all along: magnitude drives scale, never hue.

**What would change our mind.** A playtester reporting the end screen now reads as punitive, or that
a *good* career's ending got quieter as a side effect of making a bad one honest.

## 033 — The dashed fifth ledger row is making a promise the UI cannot keep. Stop promising, and propose the field

**Date:** 2026-09-13 · **Made by:** PM session 4 · **Evidence:** `reports/017-post-wave6-playtest.md` claim 1

The ledger's fifth row is dashed and captioned *redshirt year*. The 017 playtester read it correctly
without being told — *"a fifth season, but conditional, I only get it if I redshirt"* — then **took
the redshirt (+10 OVR, the biggest swing in the game) and the row did not change.** It changed only
on *arriving* in season 5. The caption is keyed to a condition the UI never checks.

This is not an oversight; it is DECISION 015/020 surfacing as a player-visible broken promise. Report
010 measured that "which season was the redshirt" is **not reliably derivable** from stored data:
the duplicate-`classYear` signal is present in 40.6% of redshirt careers and points at the wrong row
426 times out of 427.

**Two moves, in this order:**

1. **Now, within the freeze: stop making the claim.** The row keeps its dashed rule — which the
   playtester read correctly as "conditional, not really part of the plan" — and loses the caption
   that asserts *why*. The structural signal was doing the work; the caption was writing a cheque
   the data could not cash.
2. **Propose the field.** `SeasonLine` gains an explicit redshirt flag, set by the engine at the
   boundary where the fact is actually known. This is additive and is the same shape as the already-
   approved DECISION 009 (`overall` and `classYear` joined `SeasonLine` the same way). It goes to
   the user as a proposal; it is **not** covered by 029's narrow B18/B19 lift.

**The related bug, same cause.** During season 5's offseason the header read `SEASON 5` while the
YEAR 5 row was still dashed and **not highlighted as current** — for three decisions the two
disagreed about what year it was. That is the only place in three careers the playtester was
genuinely lost, and it is a correctness bug in the current-row logic, fixable now with no engine
change.

**What would change our mind.** Nothing about (1) — a UI must not assert a fact it cannot check. The
user rejecting (2) would simply leave the dashed row permanently uncaptioned, which is honest.

## 034 — DECISION 027's falsifier fires, exactly as written. The fix is the heading it named

**Date:** 2026-09-13 · **Made by:** PM session 4 · **Amends:** 027 · **Evidence:** `reports/017-post-wave6-playtest.md` claim 7

027 said: *a playtester reporting the `Also earned` row reads as a consolation prize or a demotion —
the fix then is the heading's wording, not restoring a block that fires 70% of the time.*

The playtester never saw the heading at all. `SummaryScreen.tsx:241` renders
`distinctions.length > 0 ? "Honors" : "Also earned"` — so when a career has **both**, the routine
chips appear underneath the distinctions with **no heading of their own**. What they saw was a gold
All-American box and then a bare grey Bowl Win chip: *"with nothing naming the second tier it reads
as 'and this lesser thing'... Bowl Win was a genuinely nice thing to have won and it looked like a
leftover."*

**027 was right and its implementation was half-applied.** The routine group gets its own heading
whenever it renders, including — especially — when distinctions render above it. No block is
restored, no rarity tiering is undone.

**What would change our mind.** Nothing outstanding; this is 027's own pre-specified fix, applied
where it was missed.

## 035 — DECISION 028 is answered: the two overall numbers stay, and the label does the work

**Date:** 2026-09-13 · **Made by:** PM session 4 · **Closes:** 028 item 1 · **Evidence:** `reports/017-post-wave6-playtest.md` claim 8

028 asked a playtester directly whether `FINAL OVERALL` differing from the last ledger row reads as a
contradiction. The answer is **no — and the reason is a warning, not a reassurance:**

> *"It did not read as a contradiction — because the ledger had trained me on it for four seasons
> first... the end screen is being carried by a side effect of the rail. A player who reaches the
> draft screen without having stared at the rail would see `61 FINAL OVERALL` two inches above a
> table whose last row says `59`, and I think they'd call it a bug."*

**Decision: no engine change, no number removed. The label closes the gap.** Both numbers are true
and both earn their place — one is the season as played, the other counts the offseason that
followed it. What is missing is any word saying so. The fix is in wording at the point of collision,
which costs nothing and does not depend on a player having learned the rule elsewhere.

**Why not the engine fix 028 floated** (recording a post-development OVR on the final `SeasonLine`):
it would make the two numbers agree by making the ledger's last row stop meaning what every other
row means. That trades a labelling gap for an inconsistency inside the ledger, which is worse.

**What would change our mind.** A playtester who reads the labelled version and still calls it a bug.
Then the honest move is to show one number, not two.

## 036 — The content pilot keeps its gate but changes its target selection

**Date:** 2026-09-13 · **Made by:** PM session 4 · **Amends:** 030 · **Evidence:** `reports/017-post-wave6-playtest.md`, "Repetition — I am the data point you asked for"

030 authorised a pilot on `milestone-opener` alone, chosen because it is 62% of first verbatim
repeats. 017 confirms the count (Season Opener ×10 across three careers, first repeat at career 1
decision **12**, exactly as predicted) but adds three findings that change *which* repeats cost the
most:

- **The worst repeats are the no-choice ones.** *"A repeated card that at least asks me something
  still needs me awake. A repeated card that only asks me to click is a training exercise in not
  reading."* Season Opener and Fall Camp Battle are both Continue-only.
- **The repeats cluster exactly where a beat belongs.** Twice, the first three cards after
  transferring to a new school were all verbatim repeats — *"arriving at a new school, the most
  dramatic thing the game can do to you, is delivered as three cards I'd already read."*
- **Skimming generalised in career 1, not career 3.** By decision 21 the playtester was skipping
  bodies on brand-new cards, including the best-written injury card in the game.

**The gate from 030 stands unchanged:** write one event's variants, re-run the 008 harness, confirm
the first-repeat decision number actually moves before writing the rest. **What changes is that
`milestone-opener` is now the right pilot for two reasons rather than one** — highest count *and*
Continue-only, so it tests the sharper hypothesis.

**Added to the pilot's scope, because they are defects rather than new writing:** the third-person
`Had the time of his life at a bowl game` on a second-person screen; `Ninety thousand people, a noon
kickoff` firing at an FCS school; and the same bowl-trip line being awarded as a warm memory for the
option a tanking player picks *to waste the season*. That last one is not a typo — it is the single
most congratulatory element on a failed career's end screen.

**What would change our mind.** Unchanged from 030: the harness showing the first-repeat number
barely moves.

## 037 — B19 is refuted by measurement. The offseason is a legibility problem, not a balance one

**Date:** 2026-09-13 · **Made by:** PM session 4 · **Refutes:** B19 · **Evidence:** `reports/018-failure-and-the-offseason.md` §3

Two independent playtesters reported the same thing — *"transferring up every year is free OVR"* and
*"the offseason stopped being a decision."* Held to the same seeds with transfer choice as the only
variable, it is **the opposite of true.**

Transferring up **costs 0.43–0.91 overall and 0.85–2.23 draft stock per move**, roughly halves the
round-1 rate, and is **the worst of the five offseason lines at all six positions.**

**No engine change.** The engine is already charging a real price. What it never does is show it —
`pickedRate` is flat to ±0.007 across the transfer lines, so the cost lands entirely in the upside,
which is exactly the part a player cannot see. Two players in a row therefore built a confident,
inverted model of a mechanic that was working correctly.

**This is now a UI item, and it is a good one**, because the fix is not "reveal the number" — it is
that a transfer currently produces no resolution card at all (B23). The most consequential offseason
choice in the game is delivered as one word changing in the header.

**Why this entry exists even though nothing changed.** B19 sat on the board as a balance defect for
two PM sessions and was escalated to the user as one. It was wrong. Anyone who reads the playtests
without this entry will re-raise it.

**What would change our mind.** A measurement contradicting §3.1, run the same way — same seeds,
transfer choice the only variable.

## 038 — DECISION 029 stage 2 approved at P=8. "Two seasons is not enough, for anyone"

**Date:** 2026-09-13 · **Made by:** the user, asked by PM session 4 · **Completes:** 029 · **Evidence:** `reports/018-failure-and-the-offseason.md` §2 and §4 item 1

**The cause of B18 is not "the game is too easy." It is one arithmetic gap.** `UNDRAFTED_FLOOR` is
**35**; a career that makes *no decisions at all* scores **35.8**, rising to **42.93** once automatic
development is banked. The floor sits below a no-effort career. Tanking across a **full** career
already ends in disaster 12.7% of the time — the loophole is declaring after two seasons, which
busts 0.6% of the time and is drafted 89.2%.

**Approved: `EARLY_DECLARE_PENALTY = 8`, applied in `computeDraftResult` only.**

- **8 is the measured gap** (42.93 − 35 = 7.93), and 8/9.3 = 0.86 of one draft round, so it encodes
  "leaving a year of eligibility on the table costs you most of a round."
- **It must not go in `deriveDraftStock`**, which also feeds `eligibleTiers` and the offer generator.
  The tier thresholds are 25/45/70 and an 8-point shift moves players across them. This constraint
  is not optional; a stage-2 change that puts the term in the shared function is a *different*
  change with side effects nobody has measured.
- **Every full-eligibility profile is unchanged to four decimal places on every metric**, and round-1
  rates do not move for anyone. The floor and the 9.3 band divisor are untouched.

**What the user assented to, beyond a number.** After two seasons the engine cannot tell a good
player from a bad one: the entire achievable range is **~6 draft-stock points**, because
`STARTING_OVERALL` is 60 and `devCap` is 3 a season. So the penalty hits the *good* early declarer
too (95.2% → 76.5% picked). The design statement being adopted is **"declaring after two seasons is
a gamble"** — not "declaring early when you played badly is a gamble." Separating those would mean
widening the two-season stock range, a far larger change.

**STAGE4-HANDOFF's "picked 0.85–0.95" band is retired**, deliberately. It reads 0.798 (K) – 0.866
(QB) at P=8. The band was set when the design belief was "you essentially always get drafted," which
is the belief 029 existed to test. It was marked *proposed, not spec*. Holding it would cap the
penalty at P=4, where deliberately-bad play is still picked 76.7% — *holding the band guarantees the
change cannot fix the problem it was authorised to fix.*

**Two dead levers found on the way, recorded so nobody counts on them:** `washoutOverallFloor: 45`
fires in 0.00–0.07% of careers, and *trying* to lose is impossible — the saboteur policy is identical
to the lazy one to three decimals.

**What would change our mind.** A playtester finding that early declaring is now strictly dominated
and the declare screen has stopped being a decision. The report puts that failure mode at P=12.

**Consequent UI work, decided by the PM and not requiring a further ask.** A card that is now a real
gamble currently carries no warning at all, which makes it a hidden trap. DECISION 025's refusal
stands — no projection, no `draftStock`, no round estimate. But **stating the fact that eligibility
remains leaks no number**, and it goes in. See B25.

## 039 — Two additive engine changes approved outside 029's lift

**Date:** 2026-09-13 · **Made by:** the user, asked by PM session 4 · **Evidence:** `reports/020-the-ledger-keeps-its-promise.md`

029 lifted the `src/engine/**` freeze for B18/B19 only. These two are outside it and were asked
separately.

1. **`SeasonLine` gains an explicit redshirt flag.** One additive boolean, written where the engine
   already knows the fact — the same shape as DECISION 009, which put `overall` and `classYear` on
   this exact type. Report 010 measured that the redshirt is **not** recoverable from stored data
   (the duplicate-`classYear` gate exists in 40.6% of redshirt careers and points at the wrong row
   426 times out of 427), so there is no inference left to try. Without it, a `+10 OVR` redshirt is
   the only decision in the game that leaves no trace the player can see.
2. **`FG -1` gets its missing floor.** `effects.ts` applies an authored negative `stat` effect with
   no lower bound; a redshirt season's `sitSnapModifier: 0.05` rounds every generated stat to 0, so
   `0 + (-1) = -1`. Measured at 6 careers in 1,500, **all six redshirted**. It prints in the rail and
   permanently on the summary.

**What the UI may not then do with the flag.** `classYearLabel` stays derived from sequence — a
fifth-year senior is a fifth-year senior however the fifth year was earned. Re-captioning the dashed
row and marking the sat-out row are copy-and-treatment calls that get their own brief **with a
playtest question attached**: the 017 playtester read the uncaptioned dashed rule correctly without
help, so adding words back is not self-evidently an improvement.

**What would change our mind.** On (1), nothing outstanding. On (2), nothing — it is a bug.

## 040 — The `snaps` floor is approved, and the bit-identity baseline moves with it

**Date:** 2026-09-14 · **Made by:** the user, asked by PM session 4 · **Extends:** 039 item 2 · **Evidence:** `reports/022-engine-stage-two.md` §4

`applyEffect` does `s.snaps += effect.amount` with no lower bound, and content authors three negative
snap effects (−15, −20, −8). In a redshirt season, where `sitSnapModifier: 0.05` leaves single-digit
snaps, the result goes negative: **15 careers in 9,000, all 15 redshirted.** Mechanically the
identical bug to the `FG -1` one 039 already approved.

**The 022 agent did not fix it and was right not to.** Same *mechanism*, different *change*: `snaps`
is not a display value. `productionScore` sums `seasons[].snaps` across a career and feeds
`deriveDraftStock`, so clamping it moves draft stock — including for full-eligibility five-season
careers, which are precisely the rows DECISION 038's acceptance test requires to come back
bit-identical. Fixing it inside 022 would have confounded the one test that proves the early-declare
penalty did not leak. Stopping at a measured carve-out instead of quietly bundling it is the
behaviour we want from an agent holding a freeze.

**Approved: `s.snaps = Math.max(0, s.snaps + effect.amount)`.** Magnitude, measured and bounded: at
most **1 draft-stock point** (≤20 snaps against 200 snaps per point), on **0.17%** of careers.

**The consequence that matters more than the fix.** The full-eligibility rows in `reports/018` §4 and
`reports/022` §1 **stop being the reference numbers.** They were the baseline for "the penalty did
not leak", and that test has now passed and is banked. A fresh probe run, taken *after* this clamp,
becomes the baseline any future engine change is measured against. **Anyone comparing to 018's table
after this point will see a difference that is this decision, not a regression.**

**Why not "leave it, document it".** A physically impossible value in stored state is invisible only
until something displays it. The ledger already prints season snaps, and `FG -1` reached a player's
screen by exactly this route — a negative that nothing was expected to surface, until it was.

**What would change our mind.** The re-run showing movement larger than the predicted ≤1 stock point
on ≤0.2% of careers, which would mean the reasoning above is wrong about magnitude.

## 041 — DECISION 040's magnitude clause was wrong. The bound is 2 points, and the reason makes the fix more clearly right

**Date:** 2026-09-14 · **Made by:** PM session 4 · **Supersedes the magnitude clause of:** 040 · **Evidence:** `reports/022-engine-stage-two.md` §8

040 approved the `snaps` clamp and predicted the movement at **≤1 draft-stock point on ≤0.2% of
careers**, and named a larger movement as the thing that would change our mind. Measured
career-by-career on identical seeds against a pre-clamp copy of the engine (n=60,000):

- Share of careers affected: **0.1017%** — within bound.
- Per-career draft stock: **up to 2 points** (+1 on 39 careers, +2 on 22) — **over the bound.**
- Eight careers changed round; one went `undrafted → round 7`.

**Why the prediction was low.** 040 traced one path — `snaps` into `productionScore` into
`deriveDraftStock`, worth 0.005 stock per snap, so ≤20 snaps is ≤0.1 points. It missed a second:
`snaps` also feed `developmentDelta`, whose `Math.floor(seasonSnaps / perPoint)` goes **negative** on
negative snaps. The bug was therefore also docking the player an overall point, worth ~1.4 stock at
`overall`'s ×1.4 weight. **54 careers changed final overall, all +1, none −1.**

**The decision stands, and is strengthened rather than weakened.** Every movement is upward: the
clamp takes nothing from anyone. The bug was strictly punishing a small number of players twice over
— once in production and once in development — for having taken a redshirt. Headline rates
(`picked`, `round 1`, `undrafted`, `busted`) are unchanged for every full-eligibility *and* every
early profile, so DECISION 038's result is intact.

**What is being corrected is our estimate, not our choice.** 040's ≤1-point clause is superseded by
**≤2 points, via two paths, all movement upward.**

**Why this entry exists at all.** The 022 agent hit its own instruction's falsifier, reported it
plainly instead of quietly shipping inside the bound it had been given, and explicitly declined to
edit the decision file to match its findings. That is the behaviour the "would change our mind"
convention exists to produce, and it is worth more than the estimate being right first time.
DECISIONS are superseded, never rewritten — 040's text stays as it was written.

**What would change our mind.** A third path from `snaps` into the draft, which would mean the bound
is still wrong. None was found: `overall` and `injury` clamp through `clampOverall`, `character`
through `clampCharacter`, `trophy` only increments.

## 042 — The content pilot needs one additive engine field, because per-season variants are not expressible today. Approved, bounded, and gated on a no-change proof

**Date:** 2026-09-14 · **Made by:** PM session 5 · **Amends:** the `src/engine/**` freeze, for one field · **Evidence:** `src/engine/select-event.ts:48-56`, read directly

DECISIONS 030 and 036 approved per-season variants of `milestone-opener`. **They cannot be written
against the current schema.** `selectFixedEvent` fires *every* matching fixed event, one per
`advance`, in content order — it does not pick one from a pool. So five variants with no
discriminating condition would fire five openers per season, and the discriminators that exist
(`minClass` is `>=`, `tier`, `requiresFinalSeason`) cannot partition seasons into disjoint sets.
The pilot is blocked on a schema gap, not on writing.

**Approved: one optional field, `seasonIndex?: number[]`, on `EventConditions`**, plus its check in
`eventMatches`, its validator clause in `src/content/schema.ts`, and tests. Nothing else in
`src/engine/**` moves.

**Why `seasonIndex` and not `classYear`.** `classYear` is the fiction and it was the obvious choice,
but `advance.ts:228-229` caps it at `SR`, so a five-year redshirt career is `FR SO JR SR SR` and the
two `SR` seasons would still serve a verbatim repeat — the pilot would fail for exactly the players
who play the most football. `seasonIndex` is 0–4 and partitions cleanly. The cost is that a variant
cannot safely name a class year in its prose, which pushes the writing toward naming the *stage*
(your first opener ever; the one where you are the guy) rather than the label. That is better prose
anyway, and DECISION 017's diagnosis is about the card being re-read, not about it being annotated.

**This is not a balance change and it is not going to the user.** The field is unused by all 102
existing events, so the engine's behaviour is unchanged until content opts in; and the pilot's
variants keep option ids, probabilities and effects identical, so opting in changes prose only. That
is a testable claim, and it is the wave's acceptance gate: **the nine full-eligibility profiles from
`reports/022` §8 must come back identical on every measured field.** If they do not, the variants
have moved a number and the pilot stops until we know why.

**What would change our mind.** The no-change proof failing, or the variants requiring a second
condition axis to read well — that would mean the pilot is growing an engine dependency and should
be re-scoped rather than extended.

## 043 — The three text defects get fixed in place, with prose, not with new gates

**Date:** 2026-09-14 · **Made by:** PM session 5 · **Implements:** DECISION 036's added scope · **Evidence:** `src/content/events/milestones.ts:39, 152`

036 folded three defects into the pilot. Each has a cheap wrong fix that would cost more than the
defect, so the shape is fixed here rather than left to the agent:

1. **`Ninety thousand people, a noon kickoff` fires at an FCS school.** The tempting fix is a `tier`
   gate and a variant per tier. **Refused.** It multiplies against the season axis, and a tier-shaped
   prose split is one bad sentence away from being the school-tier badge the hidden-mechanics rule
   forbids. The fix is that **no opener variant asserts a crowd size, a venue, or a stature the
   player's school may not have.** Write the nerves, not the stadium.
2. **`Had the time of his life at a bowl game` is third person on a second-person screen.** Straight
   copy defect. Second person, and sweep `milestones.ts` for others while in there.
3. **The same line is awarded as a `moment` to the option a tanking player picks to waste the
   season** — the most congratulatory element on a failed career's end screen. The fix is **not**
   deleting the moment: it fires for everyone who picks `enjoy`, including players having a genuinely
   good time, and an option with no effects at all is a worse card. **Reword it so it reads as what
   it is** — a trip enjoyed, not an achievement earned. Wry, not punishing. The icon may change; the
   effect list keeps its shape.

**What would change our mind.** (1) reversing if a playtester reports the opener now reads as
placeless — the failure mode of refusing to name a venue is prose with nothing concrete in it, and
concrete-but-school-agnostic is the target, not vague.

## 044 — DECISION 030's clause fired. The pilot ships, the other seven do not get written yet, and the question that decides them goes to a playtest

**Date:** 2026-09-14 · **Made by:** PM session 5 · **Answers:** 030, 036 · **Evidence:** `reports/024-the-content-pilot.md`, gate re-run by the PM

030 authorised one event's variants and said: *the harness showing the first-repeat number barely
moves* would mean variants are not the lever. The number moved **13 → 15** on cohort B. The brief
named 13 → 14 as the refutation threshold, so this is one decision past it, and the second gate row
did not move at all — **100% of careers still hit a verbatim repeat by decision 16**, before and
after. Cohort C's median is flat at 17. The PM re-ran the committed probe independently and got the
agent's figures exactly.

**The pilot ships anyway, and this is not a contradiction.** Three of its four products are
unconditional wins that do not depend on the gate: the three DECISION 043 text defects are fixed, a
committed and validated harness now exists where a throwaway script used to be, and **re-shown
decisions fell 45.0% → 37.5% on cohort B and 43.2% → 36.4% on cohort C.** Reverting would throw those
away to honour a clause about a different number.

**What the gate actually measured, which is narrower than 030 anticipated.** Not "variants do not
work" — the opener now repeats *never*, in either cohort. What it measured is that **the fixed
milestone skeleton behaves as a queue.** Emptying one slot promotes the next: the first repeat is now
`milestone-rivalry` in 112 of 144 careers, sitting two decisions later. 024's counterfactual says
varying all five moves first-repeat to **19** and the by-16 rate to **37.5%** — a change of kind, not
degree — and that the wall after *that* is the three hub cards, which are string literals in
`advance.ts` rather than content.

**Why the seven are not simply approved on that counterfactual.** It is analytic, not played, and it
rests on the premise 030 itself flagged as untested: that skimming is a function of cumulative
**dose** rather than of **onset**. If skimming is triggered by the first repeat, moving it from
decision 13 to 19 buys six decisions and the phase's largest authoring budget buys very little. If it
is trained by dose, the 37.5% → 17.5% re-showing figure is the whole game. **A and B in 024 §10 are
the correct answer under opposite answers to that one question, and no harness can supply it.**

**The call: the next playtest carries that question, and the seven-event decision is the user's,
taken after it.** The playtest was already the next queued action for independent reasons (wave 9's
balance and transfer changes have never met a player), so this costs nothing and converts a guess
into a measurement — DECISION 003 and 037's habit.

**What would change our mind.** The playtest reporting that the player stopped reading bodies at or
near the *first* repeat regardless of how many followed. That is the onset answer, and it makes 024
§10 option A correct and retires the authoring budget for good.

## 045 — Onset, not dose. DECISION 044's falsifier fired, option A is taken, and the authoring budget is retired — then redirected

**Date:** 2026-09-14 · **Made by:** PM session 5 · **Answers:** 030, 036, 044 · **Evidence:** `reports/025-post-wave9-playtest.md` §2

044 pre-specified the falsifier: *the playtest reporting that the player stopped reading bodies at or
near the first repeat regardless of how many followed.* **That is what 025 reports**, and it reports
it harder than the clause anticipated:

- **Career 1: skimming began at decision 15, on a verbatim repeat, and it was "a snap, not a slide."**
  It generalised to brand-new cards by decision 23.
- **Careers 2, 3 and 4: decision 1.** Every career opens on Signing Day again. Onset was immediate
  and it never took a second repeat to get there.
- **Dose governs only the reversal length** — a new position-specific card bought back *exactly one
  card* of real reading before skimming resumed.

**024 §10 option A is taken. The other seven milestone events are not written.** The counterfactual's
13 → 19 is real and it is beside the point: onset in careers 2–4 is decision **1**, which no amount
of in-season variation can move. Writing seven more sets of variants would have bought a better
number on a measurement that 025 has just shown does not govern the behaviour we care about.

**But the budget is redirected, not simply cancelled, and this is the part a future PM must not
lose.** 025 names the target precisely and it is not the in-season milestones:

> *the offseason — Redshirt? → Declare? → Transfer Portal → Fall Camp Battle → New Workout Regimen,
> identical words and order every year at every position*

That is the answer to "the single thing most in the way of a fifth career," it is where onset lives
(decision 1 of every replay), and **three of those five cards are hub strings in `advance.ts`, not
content.** It is a smaller writing job than the seven events and it is aimed at the measured cause.

**What would change our mind.** A playtester whose onset is late and gradual, on a build whose
offseason has been varied. That would mean onset is a property of *this* opening sequence rather than
of repetition in general, and the dose hypothesis comes back.

## 046 — The six "prose contradicts the number" defects are not prose defects. Do not let anyone rewrite the writing

**Date:** 2026-09-14 · **Made by:** PM session 5 · **Evidence:** `reports/025-post-wave9-playtest.md` §8, plus `src/ui/session/reducer.ts:61-64` and three content sites read directly

025 supplies the mechanism that two playtests could not: repetition *starts* skimming, and **the
text/number contradictions are what make staying that way rational.** They apply to new cards as much
as repeated ones, which is exactly how skimming generalises to cards the player has never seen. That
makes this the highest-value item on the board.

**It would be very easy, and completely wrong, to brief this as "fix the six cards."** The PM checked
all six against source. **The prose is correct in every one.** There are three distinct causes:

1. **Deferred effects and progression are attributed to whichever card is on screen.**
   `reducer.ts:61-64` freezes `overallBefore` before `advance()`, so the card's delta is *everything
   that happened during that advance* — the outcome's own effects, plus any `timing: "deferred"`
   effect from an earlier card falling due, plus phase progression. *The Position Switch* really does
   author `−2 deferred` under *"the fit never quite comes together"*; the **+5** the player saw was
   other things landing. *Cutting the Line* authors `effects: []` and showed **−3**. The card was
   telling the truth and the number was answering a different question.
2. **The character half of an outcome is invisible, so cards whose real cost is character read as
   free wins or inversions.** *The Ticket Hookup*'s negative outcome is `character −6, overall +1` —
   accurate: getting caught does not make you worse at football. But only the `+1` is a number, so
   "compliance caught me" reads as a reward. This is **B17 with a measured mechanism**, and it is the
   collision between DECISION 002 (character is never a number) and the need for an outcome to be
   legible. 002 is not reversed by this entry; the fix has to work without an integer.
3. **The same card and choice give different results** (*Rivalry Week / Play through it*: +2, +2, −5)
   with no signal that a roll happened. That is probability working correctly and being indisputably
   read as "the text does not predict the result, so reading it stopped paying."

**The shape of the fix, so it is not re-derived:** a card should account for what *it* did. The
chosen outcome's `timing: "immediate"` effects are derivable from content without touching the
engine, and a deferred effect falling due is its own beat and deserves its own sentence — the
same argument DECISION 037 and B23 already won for the transfer hub. **`reducer.ts` and
`view-model.ts` are UI files and are not frozen.**

**What would change our mind.** Nothing about (1); it is read from source. (2) is open as to remedy —
if the only workable fix turns out to require an integer, that is a proposal against DECISION 002 and
goes to the user, not a decision an agent takes in passing.

## 047 — Wave 12 is two lanes, not three. The empty room waits for the card, because lanes A and B are not file-disjoint

**Date:** 2026-09-14 · **Made by:** PM session 6 · **Amends:** the wave-12 plan in `STATE.md` "Next actions — for PM session 6" · **Evidence:** `src/ui/screens/CareerScreen.tsx:149-150`

PM session 5 listed wave 12 as three file-disjoint lanes: A (`reducer.ts`/`view-model.ts`/`types.ts`),
B (`CareerScreen.tsx`/`career.css`), C (`labels.ts`/`bands.ts`/`ledger.ts`). **A and B are not
disjoint.** The number a card reports is not computed in the view model — it is computed in the
screen:

```
const delta = resolved && resolved.overallBefore !== null ? view.overall - resolved.overallBefore : 0;
```

DECISION 046's fix — a card accounts for what *it* did, and anything else that landed during the same
`advance` gets its own beat with its own sentence — deletes that line and renders beats where today
there is one `.delta` paragraph. That is `CareerScreen.tsx` and it is `career.css`, which is lane B's
entire allocation. PM-PROMPT rule 6 (*tasks in one wave must not touch the same files*) outranks the
earlier assumption that they did not.

**B29 is not dropped, it is sequenced second, and the order is better on the merits anyway.** B29 is a
decision about how to fill ~260px of empty vertical space and ~350px of dead space each side. Lane A
changes how much vertical content a resolved card carries. Laying out the room before the furniture
has settled would mean measuring twice.

**Wave 12 is therefore lane A (B30+B31) and lane C (B36+B37), which share no file.** Lane C is told
that `view-model.ts` belongs to lane A this wave: a defect whose fix lands there is written into its
report as an exact diff, not applied.

**What would change our mind.** Lane A reporting that it landed without touching `CareerScreen.tsx` —
in which case B29 could have run alongside it and wave 13 starts one lane lighter than planned.

## 048 — A player who sits does not make plays. `requiresPlaying` is added to all 52, and a schema rule stops it recurring

**Date:** 2026-09-14 · **Made by:** the user, on PM session 6's escalation · **Evidence:** `reports/027-the-credibility-defects.md` §6

`EventConditions.requiresPlaying` exists and works (`select-event.ts:38` rejects the event when
`state.redshirtSeasonActive`), and `milestones.ts:6` uses it correctly. Across the rest of the bundle
it is almost absent: **59 on-field events award `stat` or `snaps` production and 52 of them do not
set it.** Zero of K's ten on-field events set it.

Measured over 3,000 careers: **31.4%** of all production-card firings happen while the player is
sitting a redshirt, and **85.6%** of redshirt careers get at least one. A kicker who chose to sit is
offered *"Zero seconds on the clock, your team down two…"* and the moment it awards goes on his
permanent summary reel for a season he did not play.

**This is the proximate cause of three of the five defects in brief 027** — the `3 FG · 6 Points`
arithmetic (21.2% of redshirt K rows against 0.8% of played ones), the on-screen half of B37, and
about a third of defect 3's misfires. It was not in the brief; the agent found it underneath.

**Approved: `requiresPlaying: true` on all 52, plus a `validateContent` rule** — an on-field event
whose outcomes award `stat` or `snaps` production must set `requiresPlaying` — so the next authored
card cannot reopen the hole silently.

**It is a balance change and it was escalated as one.** Production cards award `snaps`; snaps drive
development. A redshirt season is currently generating development it should not, which is part of
why B19's "transferring up every offseason is free OVR" reading survived. Closing it makes the
redshirt a real sacrifice. **The implementing agent measures draft rate and final-OVR distribution
over ≥1,000 careers before and after, and stops to report rather than proceeding if the shift is
large.**

**`npm run play` bit-identity moves with this change** — the DECISION 040 precedent. It changes which
events are *eligible*, so seeds diverge by construction. The new baseline is re-established and
recorded at commit.

**The four-game nuance is deliberately not modelled with a new condition.** A redshirt does play up
to four games, and `sitSnapModifier: 0.05` already models that numerically (100% of redshirt seasons
credit snaps, median 26 — B13). Defaulting to gated is the safe direction; an
`allowedDuringRedshirt` opt-in was offered and declined for now.

**What would change our mind.** The before/after measurement showing redshirting becomes strictly
dominated — a draft-rate collapse in the redshirt cohort rather than a modest, intended cost.

## 049 — Two additive engine changes approved: `minOverall`, and the redshirt card stops promising a season you do not play

**Date:** 2026-09-14 · **Made by:** the user, on PM session 6's escalation · **Evidence:** `reports/027-the-credibility-defects.md` §3 and §5

The engine was re-frozen after 042. Both of these were proposed rather than taken, and both are
approved.

**1. `minOverall?: number` on `EventConditions`.** One field in `engine/types.ts` plus one check in
`select-event.ts`, the exact mirror of the existing `maxOverall`. Additive, no RNG movement.

Its purpose: *Bowl Opt-Out* tells a 60-overall sophomore on the scout team that *"your name's already
climbing draft boards."* It is a family of four (`bowl-opt-out`, `all-star-invite`,
`all-star-practice-week`, `senior-bowl-invite`), each firing at a freshman or sophomore ~69–71% of
the time. `minClass: "JR"` removes ~69% of the bad firings, but the median OVR at fire time is still
~66, so the claim is still occasionally made to a player who will go undrafted. `minOverall` is the
only condition that lets content say *this beat is for good players*, and there are 81 on-field
events that may want it.

**2. `advance.ts:74` and `:76` — the redshirt card's own two strings.** The redshirt decision is a
synthetic hub built in the engine, which is why grepping `src/content/**` for it finds nothing. Both
strings promise a season that is not played; `sitSnapModifier: 0.05` means every redshirt season
credits snaps. **The engine is right and the telling is wrong.** Two string literals in a
`getDecision` branch, no behaviour change, no RNG movement.

Proposal B — appending a `decisionNote()` in `view-model.ts`, the shape DECISION 038 settled for the
declare card — is **rejected in favour of A**: fixing the sentence that is wrong beats printing a
correction underneath it.

**What would change our mind.** Nothing on (2). On (1), a measurement showing `minOverall` gates
these four cards so hard they effectively stop firing — in which case the cards want rewording, not
gating, and 027 §3 records the fallback wording.

## 050 — Two content fixes the PM took without escalating, under DECISION 043's precedent

**Date:** 2026-09-14 · **Made by:** PM session 6 · **Evidence:** `reports/027-the-credibility-defects.md` §1 and §4

DECISION 043 established that a text defect in frozen content gets fixed in place, with prose, rather
than worked around from the UI. These two are that shape and carry no balance consequence, so they
were decided rather than escalated. They are logged because the freeze means every content edit needs
a written reason.

**1. `Playoff or Bust` — "Ten wins is a disappointing season here."** Read beside a **5-7** ledger in
**96.5%** of its 85 firings. The sentence is *meant* as a statement about the program's standard and
is read as a claim about this season, because the ledger's record is the nearest number on screen.
Gating on the record was rejected: it needs W-L to accrue mid-season, which moves the RNG draw order
and diverges every seed. **Reword so the standard cannot be mistaken for a scoreboard, and delete the
number that invites the comparison.** One string.

**2. `k.ts` — three field goals are nine points.** Twelve `{ kind: "stat", stat: "fieldGoals" }`
effects, only one of which (line 141) pairs a `points` sibling. Each gains one, including the two
negatives. Purely additive, `applyEffect` order unchanged so the `rng` cursor does not move; K seeds
change stat *values*, not draw order.

**Explicitly rejected: deriving `points` in the engine.** Removing `points` from `STAT_MODEL.K.per100`
deletes one `rng.next()` per phase per kicker and diverges every existing K seed, and `points` feeds
nothing downstream that would justify it (`postseason.ts:40` gates All-Conference on `fieldGoals`).
Also rejected, and recorded for the Stage-2 engine work rather than here: drawing one jitter per
*position* rather than per stat, which would fix the same class of incoherence in QB lines.
