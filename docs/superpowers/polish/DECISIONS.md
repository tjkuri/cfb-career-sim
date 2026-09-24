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

## 051 — DECISION 048's gate is kept after measuring its second-order cost: a redshirt season's event pool falls from 81 to 12

**Date:** 2026-09-14 · **Made by:** PM session 6 · **Evidence:** measured by the PM against a pristine pre-048 tree

048 was approved on the strength of the defect it closes. Applying it, the PM checked what it costs
on the axis this whole phase says matters most — repetition — because the approval did not cover that
and an unmeasured side effect on the top finding would have been a bad trade taken silently.

**The pool collapse is real and large.** Events eligible during a redshirt season, by phase:

| phase | before | after |
|---|---|---|
| `nonconf` | 31 | **3** |
| `conference` | 30 | **5** |
| `postseason` | 20 | **4** |

81 → 12. A redshirt season is now served from a very small pool, and DECISION 045 established that
repetition is what starts players skimming.

**The measured consequence is small.** Committed probe, cohort C (the redshirt cohort), 144 careers,
against a pristine pre-048 tree:

| | before | after |
|---|---|---|
| first verbatim repeat, median decision | 17 | **17** |
| repeat by decision 16 | 41.0% | **44.4%** |
| re-shown share, median / p90 | 36.4% / 40.9% | **36.4% / 40.9%** |

**+3.4pp on one rate, and nothing else moves.** The reason is that a redshirt season is one season of
five, and the repetition metric is career-wide. **The gate is kept.**

**Three off-field cards are inside the gate and that is deliberate.** *Cutting the Line*, *Bed Check*
and *On the Sideline, On Camera* are off-field beats a redshirting player could plausibly live
through — but each awards `snaps` (+15, +15, −20), and a direct `snaps` award bypasses
`sitSnapModifier` entirely, so they were paying real playing time to a player who was not playing.
048's rule is about what a card *pays*, not where it happens. The cleaner long-term fix is that an
off-field beat should not author `snaps` at all; that changes those cards for every player, not just
redshirts, and is a bigger balance question than this wave. **Recorded as B41.**

**What would change our mind.** A playtester redshirting and reporting the season as thin or repetitive
in a way the career-wide numbers do not capture. The next playtest brief should send someone through a
redshirt season deliberately and ask.

## 052 — Lane E's phone-width gap is closed by the PM, and the method is worth keeping

**Date:** 2026-09-14 · **Made by:** PM session 6 · **Evidence:** measured in-browser against the built app

Brief 030's agent stated a gap rather than papering over it: phone width was argued from the tokens,
not measured, because another agent was driving the shared browser and resizing it would have
disturbed their measurement. **That was the right call and the check was owed.** It is now done.

**Result — no defect.** Undrafted summary, measured at **360, 400 and 1456**: no horizontal overflow
at any width, no element wider than the viewport, and the reorder holds everywhere — `.final-ovr` at
y=154, `.verdict` at y=228. `.verdict` computes `rgb(240, 180, 41)` on the undrafted branch at every
width, so DECISION 021's refusal of a chalk/gold split is intact. The career screen was measured the
same way: `.frame` at 20px gutters both sides at 360 and 400, no overflow.

**Two methods worth keeping, because both cost this session real time to find:**

1. **`resize_window` silently no-ops in this browser.** Lane B found it and worked around it by running
   the app in a same-origin iframe sized to the exact viewport and reading real rects from it. That
   technique is how both the desktop and phone numbers in waves 12–13 were obtained, and it is the
   only reliable way to measure a breakpoint here.
2. **Driving a career by clicking in a JS loop hits the 45-second CDP timeout** after roughly 3–10
   clicks, because each click is a full engine `advance` plus a React render. Batch small, or skip the
   UI entirely: a terminal `GameState` can be written straight into
   `localStorage['cfb-career-sim:v1:current']` as `{schema: 1, state, resolved: null}` and the app
   restores to it. **That is how the undrafted screen was rendered at all** — see below.

**A finding that outlived the check.** Under a deliberately bad policy (always take the last option),
**400 careers produced zero undrafted results** — 59 drafted to 1 busted in a 60-career sample. The
undrafted branch had to be rendered from a hand-built fixture. Wave 9 made careers *losable*
(`lazyEarly` 89% → 56% drafted) and DECISION 048's A/B puts the redshirt cohort at ~96% drafted, so
"undrafted" may now be a much rarer ending than the screen's prominence implies. **Recorded as B42.**
It is a balance observation, not a polish one, and it goes to the user rather than being assumed.

**Also confirmed in passing, with evidence:** B34 is real and reproducible. The fixture career's
moments list carries *"Enjoyed the bowl trip more than the bowl game"* in **four consecutive seasons**.

## 053 — B42 is refuted. `Undrafted` is a common ending, and the screen keeps its prominence

**Date:** 2026-09-14 · **Made by:** PM session 7 · **Answers:** B42 · **Evidence:** `reports/032-how-losable-is-it-now.md` §1

DECISION 052 recorded, from a fixture-building accident, that *400 careers under a deliberately bad
policy produced zero undrafted results*, and raised B42: the ending screen may be giving headline
treatment to an outcome almost nobody reaches. **Measured over 57,600 careers, that is wrong.**

| policy | undrafted |
|---|---|
| `good` (plays well, stays) | **0.0%** |
| `baselineRandom` (ordinary play) | **12.4–17.1%** |
| `lazyFull` (plays badly, **stays**) | 0.17–2.7% |
| `lazyEarly` (plays badly, **leaves early**) | **35.8–65.5%** |

**The anecdote is explained rather than contradicted.** 052's policy never declared early, and that
cell genuinely is ~0.2% for a QB — zero in 400 is the expected draw. **The variable that produces an
undrafted career is leaving early, not playing badly.** Roughly one ordinary career in eight ends
undrafted. The screen's treatment is earned; nothing changes.

**This also closes the "I could not lose" complaint** from the 014 playtest as a live concern. The
two failure axes both work and do not collapse into each other: tanking ability produces low picks,
tanking character produces **busts at 12–15%** through the authored bust events.

**What would change our mind.** Nothing on the rate. The open question is the *reverse* one — whether
12–17% is too punishing for an unoptimised first-time player — and that is a balance question nobody
has asked yet. It is not raised as one now because no playtester has complained of it.

## 054 — Declaring early is strictly dominated, so B32's planned fix does not exist. It goes to the user

**Date:** 2026-09-14 · **Made by:** PM session 7 · **Supersedes the framing of:** B32 · **Evidence:** `reports/032-how-losable-is-it-now.md` §2

B32 was scoped as *"a gamble should look like one before it is taken."* **A paired identical-seed
A/B says it is not a gamble.** Base profile `good` — everything else played optimally — 2,400 careers
per arm, the only difference being which offer of the Declare card is taken:

| declare at | seasons | undrafted | **round 1** | stock P50 |
|---|---|---|---|---|
| offer #1 | 2.00 | **22.8%** | **0.0000** | 41 |
| offer #2 | 2.98 | 0.6% | **0.0000** | 60 |
| offer #3 | 3.95 | 0.0% | 7.8% | 73 |
| never | 4.91 | 0.0% | **44.0%** | 89 |

**Monotonic in every column, with no crossover at any position.** The sole thing staying costs is
bust risk, **2.2% → 4.5%** — 2.3 percentage points bought at the price of 44 points of round-1
probability. A gamble widens the outcome distribution; this one shifts it down and **truncates the
top**. Round 1 is not unlikely after an early declaration, it is very nearly arithmetically excluded:
`computeDraftResult` needs stock ≥ 91, `draft.ts:54` subtracts 8 first, so a non-senior needs a raw
`deriveDraftStock` of ≥ 99 out of a cap of 100.

**The authored penalty is not what does the damage, and this is the part that matters for any fix.**
`EARLY_DECLARE_PENALTY` (8) plus the lost senior `classPart` (2) is **10 points**. The measured gap
is **48**. The other ~38 are foregone development, production, trophies and awards — opportunity cost
the player is never told about. DECISION 038 calibrated the tax correctly and the tax is not the
problem.

**Therefore the planned UI fix is unavailable.** Making a dominated option *look* like a fair gamble
would be the interface lying in the opposite direction from today's *"Cash in now."* Two honest and
mutually exclusive routes, and choosing between them is a game-balance call:

- **Route A — say it is a bad idea.** UI-only, no balance movement, no `draftStock` and no projected
  round (DECISION 025 refused both by name; neither is needed, because "you have two years of
  eligibility left" is a fact the player already owns). Cost: the option stays dominated, so one of
  two offseason decisions becomes a formality.
- **Route B — give it a real upside.** The fiction already implies declaring protects you from
  something; today it protects you from 2.3pp of bust risk. Making the downside of *staying* real
  would turn the existing prose accurate without rewriting it. Cost: `src/engine/**`, every seed
  moves, and it is larger than anything this phase has attempted.

**PM recommendation: A now, B only on an explicit user decision.** Escalated rather than taken,
because B32 is now a balance question wearing a UI question's clothes, and DECISION 030's shape says
those go to the user.

**What would change our mind on A.** A playtester who reads the reworded card, declines, and reports
the offseason as having become a non-choice — that would mean the decision needed balance, not
wording.

## 055 — DECISION 051's falsifier fired. The redshirt season is thin, and the card pays the gamble out before the season starts

**Date:** 2026-09-14 · **Made by:** PM session 7 · **Reverses the "kept" clause of:** 051 · **Evidence:** `reports/031-post-wave13-playtest.md` Question A

051 kept DECISION 048's gate after measuring that collapsing a redshirt season's event pool from
**81 to 12** moved the career-wide repetition metric by only +3.4pp. It wrote its own falsifier:

> *A playtester redshirting and reporting the season as thin or repetitive in a way the career-wide
> numbers do not capture. The next playtest brief should send someone through a redshirt season
> deliberately and ask.*

**It was asked, and it fired.** The playtester took the redshirt on purpose and reported the season
as **thin — five cards where a played season gets eight, none of them about being redshirted, and
two actively wrong for a player who is not playing.** The career-wide metric did not notice because
a redshirt season is one of five; the player noticed immediately because they were living in it.

**The gate is not reversed.** 048 closed a real defect — a player who sits was making plays, 1,655
production cards firing at a sitting player — and that is worth more than pool size. What 051 got
wrong was concluding that a +3.4pp career-wide number meant the cost was small. **A career-wide
average was the wrong instrument for a single-season experience**, and that is the transferable
lesson: when a change is scoped to one season, measure that season, not the career.

**The remedy is content, not the removal of the gate.** Twelve events for a season the player chose
to enter is the actual defect. A redshirt season needs beats *about redshirting* — the scout team,
the year of watching, the four-game rule — which is the smallest and best-aimed authoring target
this phase has identified, and it is better aimed than DECISION 045's offseason target because the
player is *already* choosing to be there.

**A second and worse finding sits underneath it, and it is not about pool size.** The redshirt card
**pays +5 before the season it is gambling on.** The playtester: *"a free lunch dressed as a
gamble."* The card says it might backfire; the mechanics hand over the reward up front. That is
logged as **B43**.

**What would change our mind.** Nothing on the thinness; it is a direct observation against a
pre-specified falsifier. On the remedy, a second playtester who redshirts on a build with
redshirt-specific beats and still reports the season as dead would mean the problem is the mechanic
rather than its coverage.

## 056 — B30's fix works where it was measured and fails where it was not. Two holes, both known at ship time, both found by the first player through

**Date:** 2026-09-14 · **Made by:** PM session 7 · **Amends:** 046 · **Evidence:** `reports/031-post-wave13-playtest.md`, verified by the PM at `reducer.ts:93` and `CareerScreen.tsx:80-87, 349`

Waves 12–13's central claim was *a card accounts for what it did*. Report 026 measured 12,847
resolved cards and found **0** it could not identify. The playtester found it failing in all three
careers. **Both are correct**, and the gap between them is the finding.

**Hole 1 — hub cards were excluded by construction, and that is where the defect surfaced.**
`reducer.ts:93` reads `outcome === null ? null : cardAccount(...)`. A one-option hub card has no
authored outcome, so its account is `null` and the card falls back to the whole-`advance` total —
exactly what 026 documented it would do, and what DECISION 037 wanted for the transfer hub. The
playtester's reproducible case is that hole: **`"You chose: Stay at Memphis" → +5 OVR with no
sentence at all`**, in all three careers, being the deferred injury refund landing on an unrelated
card. 026's denominator was *cards with prose*; hub cards have none, so the measurement that proved
the fix could not see the case that breaks it. **The fix is right and its coverage was wrong.**

**Hole 2 — the character sentence renders, and loses.** `lockerRoomLine` produces *"Cost you in the
locker room."* and `CareerScreen.tsx:349` renders it, so 026's 4,117 cards are real. The playtester
still read *"Compliance flags the resale listing with your name still in the metadata"* → **+1 OVR**
as a reward. **The remedy for DECISION 046 cause 2 was built and it is not winning the card.** A
grey sentence does not outrank a bold signed integer, which is a hierarchy problem, not a missing
feature — and hierarchy is the one thing this phase knows how to fix.

**Neither is a reason to revisit DECISION 002.** Character still needs no integer. Hole 2 is about
which element the eye reaches first.

**Also unfixed and now named by a player: `EVERYTHING ELSE` is never explained.** It is a labelled
bucket with no sentence, which is the same defect as hole 1 wearing a label.

**The transferable lesson, and the reason this is a decision and not a bug report.** 026 measured
the population its fix was defined over and reported zero failures inside it. The failures were all
outside it. **A measurement that shares its fix's assumptions cannot falsify the fix** — future
briefs of this shape must state the excluded population and say who checks it.

**What would change our mind.** Nothing; both holes are read from source.

## 057 — The user's call: the declare decision is removed, and a real downside is built to replace what it was carrying

**Date:** 2026-09-14 · **Made by:** the user, on PM session 7's escalation · **Answers:** 054, B32, B43 · **Evidence:** `reports/032-how-losable-is-it-now.md` §2, `reports/031-post-wave13-playtest.md`

054 put three routes to the user: reword the card (A), give declaring a real upside (B), or the
user's own fourth option — delete the decision. The PM surfaced the consequence that made the
choice non-obvious: **declaring early is where essentially all the losing comes from.** Ordinary
play with the decision present goes undrafted **12–17%** of the time; the same play with the
decision removed goes undrafted **0–0.3%**. Deleting it alone would delete the game's only failure
mode along with it.

**The user chose: remove the decision AND restore the downside elsewhere.** This is the largest
scope decision of the phase and it is deliberately larger than a polish task.

**Why "always wrong" beats "honestly labelled".** A choice that is dominated at every offer, at
every position, with no crossover, is not a decision that needs better wording — it is a button
whose only correct use is never. 054's route A would have shipped an honestly-labelled non-choice.
Removing it is the stronger form of the same honesty.

**The root cause of unlosability is identified and it is one line.** `developmentDelta`
(`advance.ts:172`) returns `Math.min(cfg.devCap, Math.floor(seasonSnaps / perPoint))` — **it cannot
return a negative number.** Play and you improve; sit and you stay flat. Overall is a one-way
ratchet, the washout floor is 45, and an ordinary career peaks in the 80s, so the floor is never
approached. **Every other failure path in the game is an event rolling badly; none of them is the
career itself going wrong.** That is why a bad player still gets drafted, and it is a better target
than anything 054's route B named.

**The engine freeze is lifted for this work, and only for this work.** Scope: the declare hub, and
whatever downside mechanism is chosen after measurement. `npm run play` bit-identity moves by
construction and will be re-baselined at commit — the DECISION 040 precedent.

**Nothing is implemented until the mechanism is measured and chosen.** Candidates are prototyped
against a scratch copy of the engine, measured over thousands of careers, and brought back with
numbers. The PM does not pick a balance mechanism from a list of plausible ones — that is the
DECISION 003 habit and it is the reason this phase's calls have held.

**What would change our mind.** A measurement showing that no downside mechanism restores a
failure rate near the 12–17% the declare card was providing without also making a
well-played career fail. In that case removing declare costs more than it saves, and 054 route A
comes back.

## 058 — The mechanism is chosen: raise the bar the draft applies, and let an upperclassman lose ground

**Date:** 2026-09-15 · **Made by:** the user, on PM session 7's measured options · **Implements:** 057 · **Evidence:** `reports/034-a-career-can-go-wrong.md`

057 approved removing the declare decision and restoring a downside, with the mechanism to be chosen
from measurement. ~150,000 careers later, it is chosen: **candidate F2 — a raised undrafted floor
with rescaled round bands, plus a gentle decline that applies only to upperclassmen.**

| profile | undrafted | round 1 | today |
|---|---|---|---|
| `good` | **0.9%** | 40.7% | 0.0% / 45.1% |
| `randomFull` | 5.6% | 8.8% | 0.1% / 9.9% |
| `lazyFull` | **19.2%** | 0.0% | **0.7%** / 0.0% |

**Two findings decided this, and neither was in the brief's candidate list.**

1. **The snap-based decline everyone would reach for first is disqualified.** At the intensity where
   it finally produces failure it **stops discriminating** — `good` 7.6%, `random` 8.4%, `lazy` 7.7%.
   It punishes bad luck rather than bad play, because snaps are sim-driven, and it taxes every
   freshman because freshmen do not play. **Gating it to upperclassmen fixes the fiction and the
   maths at once**: a freshman who does not play is normal, a junior who does not play is falling
   behind.
2. **The larger cause was never the ratchet.** Draft stock *already* separates career quality — 89
   good, 75 ordinary, 60 lazy — and the undrafted line sits at **35**, below all three. Nothing was
   failing because the bar was on the floor, not because the engine could not tell careers apart.
   Raising it to 50 leaves a good career **byte-for-byte identical** while failing 15% of lazy ones.

**Why both, rather than the cheaper floor alone.** The raised floor is two constants and costs good
careers nothing — but nothing *during* the career tells the player it is going wrong; they find out
on the final screen. **That is the same defect class this phase just deleted from the declare card**,
a cost hidden until it is too late to act on. The decline makes a failing career visibly fail, in the
number the player already watches. The user chose both.

**The acceptance test was miscalibrated and the user was told before choosing.** 034 pre-specified
restoring ~12–17% undrafted under ordinary play. No candidate reaches it without breaking good
careers. That figure came from `baselineRandom`, which declares at random — **essentially all of it
was the declare trap firing**, so calibrating the replacement against it would rebuild the trap's
severity under a new name. F2 instead moves failure from a gotcha to a judgement: ordinary play fails
*less* (5.6%), bad play fails *far more* (0.7% → 19.2%). **Recorded because 057's approval cited the
12–17% number and this does not deliver it.**

**Scope of the engine lift (057's, still open for this work only):** `draft.ts` (the floor and the
band divisor), the development call site in `advance.ts`, the declare hub, and `sim/policies.ts`'s
now-meaningless `declare` strategy. Seed baselines move by construction — re-baseline at commit,
DECISION 040 precedent.

**What would change our mind.** A playtester who loses a career and cannot say why. The decline
exists to make failure legible; if it fails that test, the mechanism is not doing the job the user
picked it for, and the cheaper floor-only version was the better buy.

## 059 — The decline floor is position-scaled, because a flat one declined every well-played kicker for its whole career

**Date:** 2026-09-15 · **Made by:** PM session 7 · **Amends:** 058 · **Evidence:** `reports/035-remove-declare-and-restore-the-downside.md` PM addendum

DECISION 058's `declineSnapFloor: 200` is a flat threshold. A kicker's season is **~34%** of a field
player's workload — a fact `postseason.ts` already documents, and already compensates for in
`snapsPerDevPointByPosition: { K: 62 }` (180 × 0.34). The decline floor got no such treatment, so a
well-played kicker sat **below it every season** and declined for its entire career: **4.53%
undrafted and 5.47% round 1**, against 0.07% and 50.7% for a quarterback played identically well.

**Fixed with the precedent the file already set:** `declineSnapFloorByPosition: { K: 68 }` and
`snapsPerDeclinePointByPosition: { K: 20 }` — the same 0.34 factor, applied to both numbers so the
decline stays proportional rather than merely rarer.

**It improved the whole change.** `good` went 0.86% → **0.10%** undrafted and 40.73% → **44.31%**
round 1 — a well-played career is now essentially as safe as before this wave began, with its
round-1 ceiling intact. Bad play fails **15.2%** rather than 19.2%, because K had been absorbing a
disproportionate share of failures under every profile. 15.2% against a pre-wave 0.7% is still the
intended order-of-magnitude change.

**Why this is logged as a decision and not a bug fix.** 058's acceptance test was specified on the
`good` profile *in aggregate*, and the implementation hit it exactly — 0.86% against a ~0.9% target.
**The aggregate could not see that one position in six was failing 65× more often than the others.**
That is the second measurement this wave that was right in form and wrong in granularity; the first
was 034 §5, calibrating a replacement failure rate against the trap being replaced. **Specify
acceptance tests at the granularity the defect can hide in** — and for this game that means
per-position, because the engine already treats one position differently everywhere else.

**What would change our mind.** A playtester who plays a kicker and reports it as too easy now. K's
remaining round-1 gap (26.9% against 44–51%) is pre-existing — it measured 28.7% before this wave —
and is deliberately left alone rather than tuned in a wave that was not about position balance.

## 060 — DECISION 058's falsifier did not fire as written. Something worse did, and every bad-play number this phase has taken may describe a player who does not exist

**Date:** 2026-09-15 · **Made by:** PM session 8 · **Amends:** 058, 059 · **Evidence:** `reports/036-the-losable-career-playtest.md`, and the PM's own read of `src/content/events/offfield.ts`

058 named its falsifier: *a playtester who loses a career and cannot say why.* The 036 playtester
played five seasons of deliberate sabotage — *"ducked, cheated and quit"* — and **did not lose.**
They finished **drafted in Round 4 with an All-American**, five overall points behind a career played
straight, and wrote the sentence this phase should be most afraid of:

> *"I stopped believing the game is counting what I do."*

**The literal falsifier is untouched; the premise underneath it is not.** 058 and 059 were calibrated
on the `lazy` policy, which fails 15.2% of the time. The playtester's sabotage career cruised. Those
two facts are only compatible if `lazy` and a human playing badly are **different players** — and the
PM found the mechanism that makes them different.

**`src/content/events/offfield.ts` contains 14 effect blocks that pair a character LOSS with an
overall GAIN.** `offfield-group-chat` / *"Let the screenshot ride"* awards `character -6` **and**
`overall +1` on its **negative** outcome — the branch whose prose reads *"The coordinator does not
think it is funny."* The clean option, *"Text the coordinator and own it"*, awards **nothing**.
`offfield-ticket-hookup` is identical: sell the tickets, get caught by compliance, **+1 overall**.

At the draft-stock weights in `sim/policies.ts` — overall **1.4**/point, character **0.15**/point —
`-6 character, +1 overall` is **net +0.5 draft stock**. **Off-field misbehaviour is strictly
profitable**, and the clean choice is strictly dominated. This is B32's defect class exactly, the one
DECISION 057 deleted the declare card to be rid of, still alive in fourteen places.

**And it is invisible to every measurement this phase has taken.** `lazy` picks the *worst-scoring*
option by draft stock, so at these cards it scores `apologize` at 0 against `let-it-fly` at +0.5 and
**takes the clean one.** The simulated bad player systematically *declines* the exact cards a human
bad player is drawn to. Every failure rate in 034, 058 and 059 was measured on a bad player who
behaves well off the field.

**This is the third granularity error in three waves, and they rhyme.** 034 calibrated against the
trap it was replacing; 058 specified acceptance on an aggregate that hid a per-position failure; now
060 finds that the *policy standing in for the player* does not play like the player. **A measurement
is only as good as its definition of the thing being measured** — and this project has now been
bitten once per wave on that.

**What is decided now:**

1. **Nothing is changed in content or balance yet.** The pattern is 14 blocks and a weights table; the
   playtester's career is n=1. `briefs/037` measures a `humanLazy` policy that chooses by authored
   intent rather than draft-stock score, per position, with award rates. **The DECISION 003 habit: get
   the number before making the call.**
2. **The ending screen's honours hierarchy is held, deliberately.** The playtester's sharpest finding
   is that the **HONORS** panel — gold, boxed, the loudest thing under the round and pick — gave
   *All-American* to the sabotage career while the straight career, drafted a full round higher, got
   no honours block at all. The endings **rank backwards at a glance.** But whether the fix is
   *hierarchy* or *the award itself* depends on 037: if a saboteur genuinely earns All-American at
   high rate, demoting the panel would be hiding a true thing rather than fixing a false one. **Fix
   the cause, not the display, and find out which it is first.**
3. **The off-field pattern goes to the user**, as balance and content both. It is not a PM call.

**What would change our mind.** 037 showing that `humanLazy` fails at a rate close to `lazy`'s 15.2%
and earns honours no more often than `good` — in which case the playtester met bad luck, the 14 blocks
are priced acceptably, and the ending screen's hierarchy is the whole of the problem after all.

## 061 — Two content fixes the PM took without escalating, under DECISION 043's and 050's precedent

**Date:** 2026-09-15 · **Made by:** PM session 8 · **Precedent:** 043, 050 · **Evidence:** `reports/036-the-losable-career-playtest.md` claim 5

Both are factual incoherence in prose, with **no effect, weight, probability or condition changed**,
which is the exact class 043 established and 050 exercised. Logged rather than escalated because the
freeze makes silent content edits the thing that erodes it.

**`k.ts` / `bowl-game-winner`.** The card reads *"your team down two"* and offers **"Take the tie and
send it to overtime."** Down two, a field goal **wins**; there is no tie on the board. The playtester
caught it. The scenario is only coherent with the score **tied** — then the kick wins it and declining
sends it to overtime, and both options become true. Fixed as prose.

**Not fixed, deliberately:** the four *"prose says I did badly, number says +1 OVR"* cards from claim 5
are **not** a prose defect. The prose is accurate; the effects are the problem. Rewriting the words to
match a reward we may be about to remove would destroy the evidence. They wait for 037. See 060.

## 062 — The user's calls on the off-field economy. Misbehaving pays only when you get away with it, and the honour learns to discriminate

**Date:** 2026-09-15 · **Made by:** the user, on PM session 8's measured options · **Answers:** B48, B49, B53 · **Implements:** 060 · **Evidence:** `reports/037-does-the-game-count-what-you-do.md`

060 sent the off-field economy to measurement. 037 came back with the cause, and it is **inverted
from how the whole phase has described it**: the policy called `good` takes a character-losing branch
on **9 of 13** off-field cards and ends with median character **41** — *"a problem they are
managing"* — while the policy called `lazy` takes the clean option on 5 and the actively virtuous one
on 4. **Draft-stock-optimal play is to be a jerk.** One overall point is worth 9.33 character points,
so all 14 paired blocks are net-positive.

| QB, 3,000 careers each | undrafted | round 1 | OVR P50 | All-American | All-Conference |
|---|---|---|---|---|---|
| `good` | 0.2% | 50.0% | 92 | 72.2% | 62.1% |
| `humanLazy` | 0.5% | 19.0% | 87 | 52.6% | **72.9%** |

Deliberately bad play stays **under 1% undrafted at every position**. Its only real cost is a
1-in-4 bust; conditional on surviving, it ends with **more** honours than a good career.

**Change 1 — the user chose the gamble shape over three alternatives.** The `overall` gain comes off
the `negativeOutcome` branch only; the `positiveOutcome` keeps it. **The obvious fix was rejected for
a specific reason:** stripping the gain from both branches makes the selfish option pure downside —
a strictly-dominated non-choice, *the exact defect class DECISION 057 deleted the declare card to be
rid of.* The fiction is sound; the price is wrong. Repricing character in `draft.ts` (037's P2) was
rejected as re-opening 058's calibration and undermining the reason character is a band rather than a
number: at ×0.6 it would swing ±30 against overall's ±82 and the band would start under-representing
it.

**Change 2 — All-American gets rungs.** It is currently a **flat 0.60 band from 85 to 99**, so the
five-point gap between a good and a bad career buys **literally zero** extra probability. The honour
the player reads as the verdict cannot tell a 92 from an 87. Heisman already demonstrates the shape.

**B49 is answered, and the PM's own framing of it was wrong.** The ending screen is **not** ranking
backwards. The playtester compared a **Kicker** against a field position, and All-American rates
differ across positions by more than 10× (K ×0.05, OL ×0.15). The honours gap they read as merit was
**position**. Holding that screen in wave 18 was right; demoting the panel would have hidden a true
thing. What remains is telegraphing, not hierarchy.

**B53 is closed as measured, against the playtester's word.** *"Round 3 Pick 8 is not a thing for a
kicker"* is **refuted as a difficulty claim** — it is the **centre** of K's distribution (median round
3, median pick 66), and K is hard mode on every other axis (All-American 5.6%, 32.6% undrafted under
`lazy`). The real complaint is **plausibility**, and the cause is that `deriveDraftStock` has **no
position term at all**. 037's P5 recommends not adding one until the award economy settles, and the
PM agrees: K's round-1 rate may move on its own once change 2 lands. **A playtester's feeling was
right that something was wrong and wrong about what it was** — the fourth time this phase that
measuring the complaint rather than implementing it has changed the answer.

**All-Conference is left alone deliberately.** It goes to the bad career because it is snap-gated and
`good`'s transfer-up policy costs snaps (292 a season against 492). **That is a real strategic
tension — climb the ladder or pile up honours — and it is the most interesting thing 037 found.** It
is invisible rather than broken. Surfacing it is a UI job for a later wave; changing it is not on the
table.

**What would change our mind.** Change 1 taking `good`'s round-1 rate down materially, or change 2
taking OL or K to a near-zero All-American rate. Both are pre-specified per position in
`briefs/039-misbehaving-stops-paying.md`, and the brief forbids tuning to hit them: a miss is reported,
not engineered away.

## 063 — DECISION 062's change 1 missed, and the shape of the miss says where the economy actually lives

**Date:** 2026-09-15 · **Made by:** the user, on PM session 8's report of a measured miss · **Amends:** 062 · **Evidence:** `reports/039-misbehaving-stops-paying.md`

062's change 1 — strip the `overall` gain from the caught branch, keep it on the branch where you get
away with it — **shipped exactly as specified and changed no behaviour at all.** The `good` policy
makes the **identical pick on all 13 off-field cards** afterwards. Expected stock fell on all four
edited options and **every one stayed above the clean option's 0.00**, so nothing flipped. `good`'s
median final character: **41 before, 41 after, at every position.**

**The structural reason, which nobody predicted and which aims the next wave.** Only **4** of the
paired character-loss/overall-gain blocks sat on a `negativeOutcome`. **17 sit on `positiveOutcome`
branches** — the ones 062 deliberately preserved. The upside the user chose to keep *is* where
essentially all of the economy lives, so removing the caught-branch gain was never going to move the
arithmetic. **The measurement was right and the prediction underneath it was wrong**, which is the
fourth time this phase and the reason the brief forbade tuning.

**What it did buy, which the policy measurement cannot see.** The caught branch no longer pays
`+1 overall`, which kills one of the four prose/number contradictions the 036 playtester quoted
verbatim: *"Compliance flags the resale listing with your name still in the metadata"* → **+1 OVR**.
**Change 1 fixes the legibility defect and not the economy defect.** The two were conflated — by
report 037, by the PM, and by 062 itself.

**The user's call: keep change 1 and complete it with a bite.** Raise the **character** cost on the
caught branches until the selfish option's expected stock falls below the clean option's, deriving
each penalty from the shipped scorer rather than searching for it. This fixes both defects at once,
stays content-only, preserves the gamble, and routes the cost through the **locker-room ladder** —
the mechanism the 036 playtester named as the only one in the game that made them want to change how
they were playing. `briefs/040-getting-caught-has-to-bite.md`.

**An acceptance criterion is deliberately reversed, and the reversal is the interesting part.**
039 treated a fall in `good`'s round-1 rate as a cost to be protected against. **That was wrong.**
`good`'s 50% round-1 rate was *partly purchased by cheating*; a clean player's number is the honest
one, and the safety test that actually matters — undrafted ≤1% at every position — passed everywhere.
040 reports round-1 per position and **does not protect it**. Recorded because it inverts a criterion
the PM wrote two waves earlier, and because protecting a figure an exploit was inflating would have
locked the exploit in.

**The All-American rungs are kept.** Every position's good-vs-bad ratio improved (QB 1.37× → 1.66×,
DL 1.49× → 1.91×) and the honour is now genuinely scarce. The counter-reading was recorded and
rejected by the user: the *percentage-point* gap barely moved (+19.6 → +20.2) and shrank at four of
six positions, and a player only ever experiences "did I get it or not". **K falls to 3.2%**, about
one career in 31, which is thin and is logged as the thing to watch.

**What would change our mind.** 040's derived penalties flipping `good`'s picks but taking a
well-played career's undrafted rate above 1% at any position — in which case the character route is
exhausted and 037's P2 (repricing character in `draft.ts`, with a full re-sweep of 034) is the only
remaining mechanism.

## 064 — The `npm run play` baselines in STATE.md rotted for two waves, and the method is replaced, not just the numbers

**Date:** 2026-09-15 · **Made by:** PM session 8 · **Evidence:** PM verification in a detached worktree

The bit-identity baseline is this project's main safety net for engine and content changes: a wave
that must not move a seed is checked against a recorded md5. **Those recorded hashes have been wrong
since wave 16.** `24 random` is documented as `cd2d3895…`; it hashes to `6ef539d4…` at `f345e1a`.

**Traced precisely:** correct at `ce36cbf` (wave 13), moved at `d310e87` (wave 16) — **the very
commit whose decision said "re-baseline at commit, DECISION 040 precedent."** Wave 16 moved every
seed by construction, as approved, and did not update the recorded numbers. Two waves then passed
with a documented check that would have failed against anything.

**It cost nothing only by luck of method.** PM session 8 verified wave 18's byte-identity by checking
out HEAD into a detached worktree and diffing freshly-computed output on both sides, rather than
comparing against the written-down hash. That method cannot rot, because it recomputes both sides and
never trusts a transcribed value.

**The call: the worktree diff replaces the recorded md5 as the documented method.** Hashes are still
recorded — they are useful for a quick eyeball — but **a hand-copied hash is evidence of what someone
once saw, not of what the code does now.** A check whose failure mode is silent staleness is worse
than no check, because it is trusted.

**The general lesson, which is this phase's third of its kind.** 034 calibrated against the thing it
was replacing; 058 specified acceptance on an aggregate that hid a per-position failure; 060 found the
policy standing in for the player did not play like the player. **Now a verification step decayed into
a ritual.** Every one is the same error: *the measurement drifted from the thing it was supposed to
measure.* Check the instrument, not only the reading.

## 065 — B55 is closed as a rounding error, and the buried-content hunt found the opposite of what it went looking for

**Date:** 2026-09-15 · **Made by:** PM session 9 · **Closes:** B55 · **Evidence:** `reports/042-how-much-of-the-writing-does-a-player-see.md`, 18,000 careers

B55 asked whether waves 19–20 had quietly buried a body of writing behind a character band that a good
player no longer reaches. **It had not.** The measurement:

- **100.0% of the 9,037-word corpus is reachable.** The union over 18,000 `baselineRandom` careers is
  9,037 of 9,037 words. Nothing in this game is unreachable, which is the first time anyone has
  checked and is worth recording on its own.
- **67.2% of ordinary careers still read at least one `maxCharacter: 55` card.** The band is 5 cards
  and 653 words, not the 3 cards B55 assumed, and `humanLazy` reads it **2.08× per career**. Band 2
  of the off-field ladder is working exactly as designed.
- Only **410 words (4.5%)** are genuinely out of a good player's reach, and **358 of those are the
  bust cards** — a well-played career is *supposed* never to read the arrest card.

**The pattern this makes five of.** B3, B5, B49, B53 and now B55 were all refuted by measuring them
instead of implementing them. **Not one call this phase has been reversed by argument.** The cost of
the check was one agent; the cost of acting on B55 would have been an authoring wave aimed at content
that was never buried.

**What it found instead, which no one had looked for.** A career shows a player **12.3% of the
authored prose** (1,115 of 9,037 words, `good`, 18,000 careers). Ten careers at one position is ~26%;
ten varied is ~39%. The corpus is deep and each pass through it is shallow — which is an argument that
replay value is real, and a warning that *"add more words"* is not automatically a way to be seen.

**The one real hole, verified by the PM independently.** DECISION 051's 81 → 12 reproduces exactly:
of 81 on-field events, 12 lack `requiresPlaying` and survive a sit season. The PM listed those twelve
by hand. Every one is an off-field temptation or a bust card — gambling, skipping the install, a
ticket hookup, catfished, a speeding ticket, a curfew, ghosting the media, an exit interview, a watch
list, a coaching carousel, a failed drug test, an arrest. **There is not one football card in a
redshirt season, and nothing anywhere in the bundle is about redshirting.** The engine writes 44 words
promising "a year of scout team and the weight room" and then deals the player four cards about his
phone. A sit season is ~20% of a career and has no content of its own.

**The 5,942 locked-out words stay locked out.** DECISION 048/051 is right: a card that credits snaps
to a player who did not play writes stats onto a redshirt's permanent ledger. The remedy is to author
*for* the sit season, never to loosen the gate.

**What would change our mind.** A future content wave growing the corpus enough that "% reachable"
stops being 100% — in which case something authored has become unreachable and that is a bug, not a
gating preference.

## 066 — A narrow, provably inert engine lift: `requiresRedshirt`, taken as a PM call and not escalated

**Date:** 2026-09-15 · **Made by:** PM session 9 · **Amends:** the engine freeze · **Evidence:** `reports/042-*.md` §4 proposal R1a

A redshirt pack **cannot be authored today.** `requiresPlaying: true` excludes a sit season and its
absence puts a card in *both*, so there is no way to say "this card is for the season the player
sits." DECISION 048 left that deliberately inexpressible; 042 shows it is now the thing in the way.

**The call: take R1a — add `conditions.requiresRedshirt?: boolean`, checked in `eventMatches` as the
exact mirror of the existing `requiresPlaying` clause at `select-event.ts:38`.** Rejected R1b
(content-only, phrasing every card to read correctly whether or not the player is on the field),
because it dilutes the played-season pools with sit-season beats and constrains the writing badly —
and the writing is the asset.

**Why this is a PM call and not a user escalation.** The freeze says escalate what touches balance.
This touches none: no existing event sets the field, so no existing event's eligibility changes, and
the change is falsifiable by the standing bit-identity check — **it must be byte-identical on every
seed and policy, and if it is not, it is wrong and it comes out.** That is DECISION 006's precedent,
where an engine change was proved additive on three seeds and taken on the same reasoning.

**What is explicitly NOT covered by this lift.** The *pack* that will use the field. New sit-season
cards carry effects, and a redshirt season's contents are part of what the redshirt gamble buys — so
the pack moves balance by construction, must state its acceptance in advance, and is reported rather
than tuned. **The schema field and the content that uses it are two different waves, and B43's fix to
the redshirt offer card is a third.** Three simultaneous changes to redshirt EV would be
unattributable, which is the wave-10/13/16 lesson.

**What would change our mind.** The bit-identity check moving on any seed — which would mean the
clause is not the inert mirror it is claimed to be.

## 067 — The game does count what you do. It narrates the count six times and shows it once, and that is a display problem — measured, not assumed

**Date:** 2026-09-15 · **Made by:** PM session 9 · **Supersedes the framing of:** DECISION 060 · **Evidence:** `reports/041-*.md`, plus the PM's own 400-careers-per-policy sweep

Wave 17's playtester quit saying *"I stopped believing the game is counting what I do."* Waves 19–20
were built to answer that. The 041 playtester — who played hard on the field and selfishly off it for
a full career — **withdrew the charge unprompted**:

> *"I do not think that is still true. The redshirt, the shrinking transfer menu at low OVR, the
> four-tier locker-room ladder, MOMENTS and the per-season delta column all visibly counted me. The
> broken thing is narrower: **the one track the game narrates most is the one it shows least, and it
> is completely absent from every ending screen.**"*

**The mechanism, found in the code and confirmed by measurement.** `lockerRoomLine` in
`CareerScreen.tsx` is **direction-only by design** — it prints "Cost you in the locker room." for any
negative character delta, whatever the size, because DECISION 002/046 correctly refuse to give
character a magnitude. The only *state* display is `TRUST_BANDS`, five rungs with 15–30 point widths.
So a player can be told six times that something cost them and cross **zero** band boundaries. The
041 playtester got exactly that: **six cost verdicts, one phrase change**, on the final click of the
career, unhighlighted. Their words: *"Yes in sentences, no in state."*

**It is not a balance problem, and this was checked before briefing a fix** — 400 careers per policy,
QB:

| policy | avg final character | p25 | % under 55 | band at the average |
| --- | ---: | ---: | ---: | --- |
| `good` | **62.3** | 59 | 10.0% | *just a guy in the building* |
| `humanLazyAmbitious` (selfish off-field) | **6.8** | 0 | 99.3% | *the staff has stopped defending you* |

The ladder has the full range and a selfish career crosses **every rung of it**. The human simply
could not see it happening. **Widening the deltas would have been the wrong fix to a real complaint**
— which is why the sweep was run first. That is the sixth time this phase that measuring a complaint
changed what got built.

**The call: wave 22 makes the existing state visible and changes no number.** `briefs/043`. The
ending screen gets the standing (the PM verified `SummaryScreen.tsx` never renders `trust` — the view
model computes it for the live career only), and a band change is marked as the moment it is. No
integer, no meter, no gradation: DECISION 002 is not reopened, and 046 already rejected
magnitude-as-typography on this exact axis.

**Why this is the highest-value item on the board.** Asked what would produce the fourth career this
entire phase exists to earn, the playtester answered with a build instruction:

> *"If the ending screen had a locker-room line on it I would start a fourth right now to try to move
> it."*

Two playtesters in a row have independently named this ladder as the only mechanism in the game that
changed how they played. It is also the cheapest thing on the board.

**What would change our mind.** 043 shipping and the next playtester still reporting the ladder as
invisible — which would mean the band resolution itself is too coarse to register, and that *is* a
DECISION 002 question rather than a display one.

## 068 — Wave 22 gets played before the redshirt pack is authored, and the third career is not assigned

**Date:** 2026-09-15 · **Made by:** PM session 10 · **Reorders:** session 9's next-action list, item 1 vs item 2 · **Evidence:** DECISION 067's own falsifier; the wave-10/13/16 attribution lesson

Session 9 left the order **B43 → redshirt pack → playtest**. Session 10 runs **playtest ‖ B43
measurement**, and leaves the pack unauthored until the playtest is back.

**The reason is session 9's own rule, applied one level up.** DECISION 066 forbids B43 and the pack
from sharing a wave because three simultaneous changes to redshirt EV would be unattributable. But
wave 22 — the ladder on the ending screen, the highest-value item the board has had — **is committed
and no player has seen it.** Authoring the pack first would put the next playtester in front of two
unrelated changes at once, which is the same attribution error the rule exists to prevent. DECISION
067 pre-registered a falsifier (*a playtester who still reports the ladder as invisible*); a
falsifier is only worth having if it is fired on a build where the thing it tests is the newest
thing on the screen.

**The pack is also the largest authoring job left on the board, and it is being deferred
deliberately.** Committing ~9–12 cards to a sit season is a real spend, and the question it is
downstream of — *did the ending screen earn the fourth career?* — is answerable this week for the
cost of one playtest. Spending the authoring wave before that answer is spending it on a guess.

**B43 runs concurrently but implements nothing.** It is a balance change, so under the engine freeze
it is the user's call, and DECISION 066's lift was explicitly spent on `requiresRedshirt` alone.
`briefs/046` prototypes in a throwaway worktree and returns a table plus an acceptance criterion
stated in advance; the PM escalates from that table. This also puts a check under a complaint that
two playtesters have made and **nobody has measured** — 042/065 is the fifth time this phase that
measuring a complaint changed what got built, and *"an obvious free yes"* is exactly the shape of
claim that has been wrong before.

**The third career is not assigned, and that is the point.** Every playtest so far has assigned three
careers and then asked whether the player wanted to play them — which destroys the measurement the
phase is defined by (*a playtester who has never seen it plays three careers in a row without being
asked to*). `briefs/045` assigns two, then asks the question at career 2's ending screen and tells
the playtester to act on their own answer, including *"no, do not play a third."* The 041 playtester
made a testable prediction — *"if the ending screen had a locker-room line on it I would start a
fourth right now to try to move it"* — and wave 22 shipped exactly that line. An unasked-for third
career is now a real result the instrument can return.

**What would change our mind.** A playtest that comes back with the ladder confirmed, the north star
still a *no*, and the reason naming the redshirt season — which would mean the pack was the blocking
item all along and the deferral cost a wave.

## 069 — Wave 22 worked, the falsifier did not fire, and the ladder's success is what exposed the thing underneath it

**Date:** 2026-09-15 · **Made by:** PM session 10 · **Confirms:** DECISION 067 · **Evidence:** `reports/045-the-fourth-career.md`

DECISION 067 pre-registered its own falsifier: *a playtester who still reports the locker-room ladder
as invisible.* **It did not fire, and the opposite happened.** The 045 playtester tracked the ladder
constantly, quoted all five rungs back verbatim, called the six-rung list with *"YOU ENDED HERE"*
**"the best element in the game"**, and said they caught **every** locker-room change across three
careers because the delta banner sits where their eye already was.

**The 041 prediction came true as stated, and it is the first time this phase has predicted a player's
behaviour in advance and been right.** 041 said: *"if the ending screen had a locker-room line on it I
would start a fourth right now to try to move it."* 045 — a different player, never told what shipped
— reached career 2's ending screen, was asked whether they wanted another, and answered:

> *"Yes — but it is a narrow yes... there is one line I have never reached and I want to find out if
> it is reachable."*

They then played an unassigned third career **as a controlled experiment to reach the top rung.** The
brief did not ask for it. That is the north star's mechanism working, and it came from a display
change that cost one wave.

**And it is also how the phase learned its real problem.** The experiment came back negative, and the
*"no"* to a fourth career is the sharpest one yet recorded because it is conditional and specific:

> *"If a fix makes the team-first branch reliably pay — even a little, even invisibly-but-consistently
> — I would come straight back, because the thing the ladder promises is genuinely the best idea in
> this game."*

**The lesson, and it reframes four sessions of work.** Sessions 8 and 9 treated *"the game does not
count what you do"* as a display problem and were right to. But the display was the **lid**: while the
standing was invisible, nobody could see that it was also unearnable. **Making a mechanism visible is
what makes it falsifiable.** The correct sequence was the one that happened — and the next wave is
only possible because wave 22 shipped.

**What would change our mind.** Nothing on 067; it is confirmed by a player who did not know it
existed. The open question moved to 070.

## 070 — The standing ladder is a one-way ratchet, but not for the reason the playtester said. Seven one-button cards can only cost, and five of them fire in every career

**Date:** 2026-09-15 · **Made by:** PM session 10 · **Opens:** B62 · **Evidence:** `reports/045-*.md`, plus the PM's own pass over all 106 events / 199 options

The 045 playtester ran a maximum-virtue career — team-first on every card, one school, no transfers,
four seasons — and finished **one rung lower than it started**, with **zero** *"Earned you credit in
the locker room"* and **five** *"Cost you."* Their diagnosis:

> *"The good-teammate branch is a coin flip, so the reputation the whole second track is built on is
> something you cannot actually earn."*

**The observation is real and the diagnosis is wrong, and the difference is the whole fix.** Measured
over the entire corpus:

| | n | mean E[character] | mean success | mean p |
|---|---:|---:|---:|---:|
| options whose success branch pays character (*"virtuous"*) | 42 | **+2.35** | +3.31 | **0.81** |
| options whose success pays OVR and whose failure costs character (*"selfish"*) | 34 | **−3.14** | +1.29 OVR | 0.60 |

**Virtue is not a coin flip. It pays +2.35 expected at 81% reliability**, only 3 of 42 virtuous
options have non-positive EV, and the opportunity is **flat across all six positions** (23–26 virtuous
options each, mean E ≈ +3.2 — so this is not the per-position hole DECISION 058 taught us to check
for, and that was checked).

**The actual mechanism is one-button cards.** Of 18 single-option cards, **7 move character. All seven
can only move it down. Zero can move it up:**

```
fixed   milestone-opener-first      p=0.75  +0/-2   "The First One"
fixed   milestone-opener-no-excuse  p=0.75  +0/-2   "No Longer New"
fixed   milestone-opener-your-team  p=0.75  +0/-2   "Your Team Now"
fixed   milestone-opener-counting   p=0.75  +0/-2   "You Start Counting"
fixed   milestone-opener-last       p=0.75  +0/-2   "The Last One"
random  speeding-georgia            p=0.85  +0/-4   "Speeding Ticket in Georgia"
random  the-missed-tackle-reel      p=0.60  +0/-1   "The Missed Tackle Reel"
```

The five `milestone-opener-*` cards are the Season Opener, and **B11 established that the
`milestone-*` events fire in 100% of careers** — one per season. **So every career, every season,
draws a guaranteed one-button card that can cost standing and can never earn it.** Four seasons at 25%
is a ~68% chance of at least one hit, and the playtester took two. *Speeding Ticket in Georgia* is the
same shape and convicted a player who was never asked whether to speed.

**This is why the good career felt unearnable while the numbers say virtue pays.** The *guaranteed*
traffic is a one-way tax with no choice attached; the *earnable* credit is stochastic and competes in
a weighted pool. The playtester named the consequence exactly: *"Being punished for something you were
not asked about is the only thing in this game that felt unfair rather than hard."*

**The call: the target is the no-choice cards, not the virtue economy.** Do not widen virtuous payouts
— the measurement says they are fine and DECISION 063's preserved upside is not reopened. **A card
with one button should not be able to move the player's standing in only one direction.** The routes
(symmetrise the milestone openers so the 75% branch earns what the 25% branch costs; or make them
choices; or remove their character effect entirely) are content-economy changes and go to the user
with a measurement, per the freeze.

**This is the seventh time this phase that measuring a complaint changed what got built**, and the
first time the measurement *confirmed the player's experience while refuting their explanation*. Both
halves mattered: acting on the report as written would have inflated 42 virtuous payouts and left all
seven one-way cards in place.

**What would change our mind.** A realized-frequency sweep showing a `good`-policy career actually
sees more *"Earned"* than *"Cost"* lines — which would mean the playtester's run was unlucky rather
than structural. **That sweep has not been run and it is session 11's first job.**

## 071 — The redshirt is not a free yes. B43 is reframed from an economy bug to a telling bug, and a real trapdoor was found underneath it

**Date:** 2026-09-15 · **Made by:** PM session 10 · **Reframes:** B43, DECISION 055 · **Opens:** B63 · **Evidence:** `reports/046-is-the-redshirt-actually-a-free-yes.md` Part 1 (5,000–8,000 careers per cell)

Two playtesters called the redshirt offer *"a free lunch dressed as a gamble"* and *"an obvious free
yes."* **Nobody had measured it. Measured, it is a real fork:**

- **Ceiling-for-floor, both directions large.** Taking roughly **doubles the round-1 rate** (best QB
  21.8% → 38.6%) and **raises the bust rate 2–4×**. A badly-played career is drafted **80.7%
  declining vs 65.6% taking** — declining is correct for `humanLazy`, `antisocial` and `lazy`.
- **The losing branch is genuinely bad and is occupied 40% of the time.** A −3 career does not land
  where a decline lands: for an ordinary player, round 1 **1.99% vs 4.38%** and undrafted **6.54% vs
  3.25%** — the sink branch **doubles the chance of going undrafted** relative to just playing.
- **But the advertised stake is fake.** The card says *"a year of reps you did not get."* A sit season
  costs **exactly 0 overall** — median *and* mean `seasonOverallDelta` 0.00, every position, every
  strategy. `developmentDelta` is `floor(25/180) = 0` and cannot go negative. The real cost is the
  *foregone* +1 to +2 of a played season, so the fiction overstates its own stake by 1.5–3×.

**The call: B43 is reclassified from a balance defect to a telling defect, and its priority drops.**
The player is not being offered a free lunch; they are being offered a real bet whose terms are
described wrongly and whose outcome is paid out before the season it names. That is route R0 —
**change no number, fix the telling** — and it is far cheaper than the retune two playtesters'
language implied. **This is the sixth call reversed by measurement and the second this session.**

**Underneath it, an unambiguous bug, which nobody asked for.** `advance.ts:251` busts a career when
the last two season lines are both under `washoutSnapFloor` (60 snaps). **A sit season is ~25 snaps,
so it always counts as one of the two.** Measured: a player whose freshman year was wrecked by injury
(<60 snaps, ~1% of careers) and who then takes the redshirt is **busted 100% of the time** for
*"Buried on the depth chart"* — against 2–5% for the same player declining. A representative career:
FR 25 snaps (two injuries), SO 26 snaps (redshirt), **busted at overall 64**, nineteen points clear of
the `washoutOverallFloor` of 45. He was not cut. He was medically redshirted and the engine read it as
being cut — **on precisely the archetype the redshirt fiction is written for.**

**The PM verified the mechanism in source.** `SeasonLine.redshirt` **already exists and is already
recorded** (`types.ts:48`, written at `advance.ts:319`); the buried check simply does not consult it.
The fix is one clause. It is an engine change that moves bust rates, so it goes to the user — but it
is a **bug**, not a tuning preference, and the open design question is narrow: should a redshirt
season be *skipped* by the consecutive-seasons window, or *break* the streak?

**What would change our mind.** On the trapdoor, nothing — it is read from source and reproduced over
8,000 careers per cell. On the reframing of B43, a playtester who understands the redshirt's real
terms and still calls it an obvious yes.

## 072 — The redshirt trapdoor is closed by skipping, not streak-breaking. The user's call, and the fix reveals the buried-washout path was ~95% artifact

**Date:** 2026-09-15 · **Made by:** the user, on PM session 10's escalation · **Closes:** B63 · **Evidence:** `reports/046-*.md` §Trapdoor, plus the PM's own before/after sweep at n = 6,000 per cell

DECISION 071 escalated B63 with one open question: should a redshirt season be **skipped** by the
consecutive-seasons buried window, or **break the streak**? **The user chose skip.**

**The change, one clause at `advance.ts:251`:** `s.seasons.slice(-n)` becomes
`s.seasons.filter((line) => !line.redshirt).slice(-n)`. `SeasonLine.redshirt` was already recorded
(`types.ts:48`, written at `advance.ts:319`); the check simply never consulted it.

**Skip, not streak-break, and the distinction is tested.** Two tests were added, and the first one
**failed before the fix and passes after** — the bug was reproduced before it was repaired:

- *"does not count a redshirt season as a buried season"* — FR 25 snaps (injury-wrecked), SO 26 snaps
  (redshirt), overall 64. Busted before; active after.
- *"still busts when the two PLAYED seasons around a redshirt are both buried"* — FR buried, SO
  redshirt, JR buried. Still busts. **A sit cannot launder a prior buried season**, which is exactly
  what "skip" buys over "break".

**Measured, before and after, both sides recomputed by the DECISION 064 worktree method, n = 6,000:**

| profile/pos | busted% | washout% | drafted% | round1% |
| --- | ---: | ---: | ---: | ---: |
| good/QB | 2.27 → **0.63** | 1.67 → **0.03** | 97.73 → 99.37 | 38.32 → 38.55 |
| good/DL | 2.13 → **0.42** | 1.73 → **0.02** | 97.87 → 99.58 | 34.37 → 34.67 |
| baselineRandom/QB | 6.72 → **5.67** | 1.13 → **0.00** | 93.28 → 94.33 | 8.77 → 8.78 |
| baselineRandom/DL | 6.80 → **5.73** | 1.12 → **0.00** | 93.20 → 94.27 | 7.43 → 7.43 |
| humanLazyAmbitious/QB | 35.38 → **35.00** | 0.47 → **0.00** | 64.62 → 65.00 | 12.88 → 12.90 |

**The consequence that is larger than "one clause" implies, and it is stated rather than buried: the
*"Buried on the depth chart"* ending is now nearly extinct** — 0.03% for a good player, and below
1-in-6,000 for an ordinary one. It was not doing the work its name claimed. **~95% of it was
redshirts being misread as benchings.** A genuinely buried career needs two consecutive sub-60-snap
*played* seasons against a median of 343, which almost never happens.

**The game does not become less losable, and that was checked because wave 16 exists.** Ordinary play
still busts 5.67% (6.72% before) and a badly-behaved career still busts 35.00% (35.38% before) — the
character spiral and the overall collapse carry the failure rate, as DECISION 057 intended. **What was
removed is a failure mode that fired on the wrong player**, not a failure mode.

**Verified end to end, and non-vacuously.** 700 tests (698 + 2), both typecheck passes, build clean.
`npm run play` is **byte-identical on 12 seed/policy pairs**, all 12 outputs mutually distinct — but
byte-identity here means the fix is *narrow*, not that it is inert, so a differing seed was hunted
down to prove it fires: **seed 113/best was busted `"Buried on the depth chart"` at overall 73, and
now survives to overall 82 before busting as `"Ran out of rope with the staff"`.** The mislabelled
ending was replaced by an honest one. That is the 044 lesson applied in reverse: when a change is
*supposed* to move something, a passing identity check is only meaningful once you have found the
case that moves.

**What would change our mind.** A playtester reporting that a career which should clearly have ended
on the bench instead ran to the draft — which would mean the buried path needed to survive in some
form rather than being a near-pure artifact.

## 073 — The `0 snaps` bug is real, the mechanism the report gave for it is not, and the approved fix was applied and then reverted

**Date:** 2026-09-16 · **Made by:** PM session 11, with the user · **Closes:** the `effects.ts:61` route · **Reopens:** B64's cause · **Evidence:** the PM's own probe over 56,481 season rows, `reports/048-*.md` §5

Report 048 reproduced B64's symptom exactly — a played season storing `snaps: 0` beside a live stat
line — and named `src/engine/effects.ts:61` as the cause: `Math.max(0, s.snaps + amount)` flooring an
authored −20 against a low-snap season. It proposed a one-line floor-of-1 when the line carries
production, priced at +1 snap on 0.035% of rows. **The user approved it and it was implemented, TDD,
with a failing test first. It is not in the tree, because the non-vacuous check refuted it.**

The fix is *supposed* to move output, so byte-identity would have been a vacuous pass. A probe counted
season rows with `snaps === 0` and at least one positive stat, before and after:

```
BEFORE (HEAD)        rows 56,481   zeroSnapWithProduction 29
AFTER  (fix applied) rows 56,481   zeroSnapWithProduction 29
```

**The fix changed nothing.** Instrumenting every `snaps` effect application and attaching the history
to the line it touched:

```
bad rows 29 · with any snap effect at all 0 · with no snap effect ever applied 29
```

**The clamp never touched a single one of the 29 rows.** It fires 34 times across the corpus, always
on lines with no production, where flooring at 0 is correct. `effects.ts:61` is exonerated completely.

**The real mechanism is an authored `stat` effect landing on a line with no playing time.** There are
**123 authored `stat` effects** in `src/content/events/**`, and they write production onto the current
season line without adding snaps. `simulate.ts:26-32` cannot produce the defect — stats are derived
from the same phase's snaps, so zero snaps yields zero stats — and `season.snaps` only ever increases
outside of effects. The observed rows match authored amounts verbatim: `OSKILL scrimmageYards: 20` is
`oskill.ts:108`. **So a card hands the player 130 passing yards in a season the engine says they never
played**, and every downstream consumer inherits it: the ledger prints `0 snaps` beside the stats,
`seasonOverallDelta` reads the zero and charges the upperclass decline — the −4 and the *"A season on
the sideline cost you ground"* verdict on a season the player lived through — and `productionScore`
loses the snaps from draft stock.

**The call: revert, and re-diagnose before re-escalating.** An engine edit that provably changes
nothing is exactly what the freeze exists to prevent, and committing it under a message claiming it
fixed B64 would have put a false record in the log. The tree is back at 708 tests. **B64's cause is
reopened**, now correctly located, and the fix is in different territory — the `stat` case of
`applyEffect`, or gating those outcomes on having played — which is a **content-semantics** question
and therefore the user's, not a one-line clamp.

**The lesson, and it is the reason this was caught.** 048 was an unusually strong report: it refuted
its own obvious hypothesis (closed-line mutation) with a measurement, reproduced the symptom at a
named seed, found the playtester's own save, and verified everything it claimed. **Its symptom repro
was right and its mechanism was inferred from reading the source rather than measured.** That is the
same shape as DECISION 070 — where a playtester's observation was real and their explanation wrong —
one level up. **An agent's diagnosis is an artifact to check, exactly like a player's.** The check that
caught it cost one probe, and the rule that produced it is already on the board: when a change is
supposed to move the numbers, identity is the vacuous pass — hunt the difference, and if you cannot
find it, the change is not doing what it says.

**What would change our mind.** A repro of a bad row whose snap-effect history is non-empty. 56,481
rows under `baselineRandom` produced none; a human-shaped policy might, and 048's own `z-206` repro
should be re-checked under the instrumented build before the clamp is ruled out forever.

## 074 — Virtue does pay, the `good` profile is not a good teammate, and the complaint is probably a legibility bug wearing a balance bug's clothes

**Date:** 2026-09-16 · **Made by:** PM session 11 · **Answers:** DECISION 070's falsifier · **Opens:** B72 · **Evidence:** `reports/047-does-virtue-actually-pay.md`

DECISION 070 named its own falsifier and session 11 ran it. **It fired, in a way nobody predicted.**

| the player | Earned/career | Cost/career | net |
|---|---:|---:|---:|
| `good` (`events: "best"`) | 1.42 | 4.34 | **−2.92** |
| max-virtue, the playtester's shape | 2.71 | 2.13 | **+0.58** |
| ordinary play | 2.13 | 9.11 | −6.98 |

**A genuinely virtuous career does see more *Earned* than *Cost*. The `good` profile does not, and it
never was a good teammate** — it is a draft-stock maximiser that takes options worth **−8.04 expected
character per career** and declines half the virtuous options it is offered. Every report on this board
from 018 onward has cited `good` as *"the player who plays well"*; on the locker-room axis it is a mild
`humanLazy`. The name has been carrying an unearned claim through a dozen reports.

**The finding that outranks the brief.** The playtester's exact tally — 0 Earned, 5 Cost, four seasons
— occurs in **0.26%** of max-virtue careers and **10.60%** of `good`-profile careers. *Their reported
experience is 40× more consistent with a player optimising overall than with one taking the team-first
branch.* And the corpus says how that happens to a player who was sincerely trying:

> Of the **60** multi-option events where character differentiates the options, on **34 (56.7%)** the
> most-virtuous option is **strictly worse on the only number the game shows the player**, by a mean of
> **0.91 expected OVR**.

`overall` is an integer on screen; character is a band phrase (DECISION 002, and that asymmetry is
correct — ±7.5 against ±82). The consequence is that a player steering by the visible signal takes the
corrosive branch on the **majority** of character cards **without intending to**, and then gets a moral
verdict printed on each one. **A card can cost standing without ever signalling that standing was on
the table.** That is B72, it is a legibility defect, and no route in DECISION 070 touches it.

**The call on the routes, for the user.** **R2** — give the five Season Opener cards a real second
option — is recommended: virtuous below-start 43.9% → 8.0%, Cost lines 2.15 → 1.14, badly-behaved rows
**bit-identical**, ordinary bust 5.37% → 4.83%, the mildest dilution of any route. Cost is ~15 prose
strings, ~180 words, one authoring session. **R1 is rejected on measurement**: symmetrising the openers
hands **+6.0 expected character per career to every player unconditionally**, against a max-virtue
player's entire realized virtue budget of **+4.85** — more than half of a virtuous career's gain would
come from cards nobody was asked about, making the unchoosable spine the largest character source in
the game. It inverts the thing the playtester was complaining about. **R1all is indefensible** — it
would pay +4 character for talking your way out of a 96mph speeding ticket. **R3op** (strip the
openers' character effect, keep `speeding-georgia`'s, which is the one one-button hit that is clearly
earned) is the fallback if authoring capacity is unavailable, and is explicitly half a fix.

**What would change our mind.** On B72: a cold read of the 34 conflict cards' labels finding that a
player *can* tell which option the locker room is watching. That audit is cheap and should run before
anyone authors R2's prose, because if it fails, **R2 is worth doing anyway and still will not close the
complaint** — and the next brief is about the 34 cards, not the 5.

## 075 — B72 is refuted by a blind audit with a control group, and the real defect is the opposite shape: character pays for doing less

**Date:** 2026-09-16 · **Made by:** PM session 11 · **Refutes:** B72, and corrects DECISION 074 · **Opens:** B75, B76, B77 · **Evidence:** `reports/050-*.md`, plus the PM's own reads of `k.ts:79-121` and `offfield.ts:54-82`

DECISION 074 proposed that *a card can cost the player standing without ever signalling standing was on
the table*, on the strength of **34 of 60** character cards where the virtuous option is strictly worse
on the only visible number. **A blind audit with an unmarked control group refutes it**, and the control
group is what makes that a result rather than an opinion:

```
                         THE 34          CONTROLS (26)
flagged as a standing decision   58.8%           46.2%      z=0.98, p=0.33
label carried a cue              55.9%           53.8%      flat
"silent trap"                    26.5%           38.5%      WRONG WAY
```

Three of four legibility measures are flat and **every one that moves, moves against the hypothesis.**

**Two further corrections to 074's numbers, and they matter more than the verdict.**

1. **The 34 is not one population.** Split by character magnitude: on the **12 genuine moral forks
   (spread ≥3) the auditor scored 11/12 legible cold and 12/12 on naming the rewarded branch.** On the
   **13 flavour nudges (spread <1.5) it scored 4/13.** *Difficulty of seeing the cost is inversely
   correlated with its size* — the unreadable cards are the ones where nothing is at stake (≤0.22 draft
   stock). **074's "34 of 60" counts a ±1 nudge and a −13.4 moral fork as the same event, and every
   number downstream of it inherits that.** Re-run the source measurement with a ≥3 character floor.
2. **The 0.91 mean OVR gap is four cards in a costume** — 3.54 across the four 3-option off-field
   cards, 0.56 across the other thirty — and **26 of 34 gaps are below one displayed OVR point**, i.e.
   below the resolution of the very signal 074 says players steer by. Options render label-only at
   decision time, so that signal does not exist pre-choice anyway.

**074's central inference was also partly circular, and this is the uncomfortable part.** The
playtester's *"0 Earned, 5 Cost"* was read as 40× evidence for B72. But on the 34, an OVR-steering
player prints **0/34 "Earned"** *by construction* — the set was drawn as "cards where the virtuous
option is not the OVR-best one", so a player optimising OVR can never earn credit on them. Against the
controls the same player earns credit **34.6%** of the time. **The tally is partly an arithmetic
signature of how the set was defined.** The playtester's experience is still real and still needs
explaining; it just is not evidence for this mechanism.

**What the audit found instead, unasked, and it is the thing to act on: an effort inversion.** On **22
of the 34**, character rewards the **lower-effort** branch — *"Decline and rest the injuries"*, *"Ask
for a series off"*, *"Lean on the veterans"*, *"Enjoy the trip"*. That contradicts the convention
`offfield.ts` states in its own header — *"the corrosive option charges character on the branch you
take; the descent is a chosen cost"* — and inverts the intuition every player brings to a locker room.

**The PM verified the reductio in source.** `kickoff-duties-too` (`k.ts:79-121`) offers *"Take both jobs
and don't complain"* (+1/−1 OVR, **no character effect at all**) against *"Ask them to find someone else
for kickoffs"* (p=1, **+1 character**). Stated precisely, because the report slightly overstates it: the
game does not *charge* the player for taking the extra work — **it credits them for declining it and
gives them nothing for doing it.** The authored justification is in the prose (*"It's not a fight you
needed to win loudly, and the staff notices you didn't"*), so the card is defensible as written and
indefensible as a pattern repeated 22 times. **One currency is carrying two authored meanings, and it
will keep generating bug reports under new names until it is named once.**

**The single card where B72 is genuinely true is `Family Business`** (`offfield.ts:54-82`), verified:
**−4 character on success, −23 on failure**, for letting a cousin manage NIL money. **There is no locker
room anywhere in the scene** — a cousin, a business card, some money — and then the UI prints a verdict
about the locker room. That is not a legibility bug in the label; it is character being narrated as one
thing while modelling another.

**The calls.**

- **R1 is adopted as a PM call and is wave 27's first item.** Threshold the locker-room line by
  magnitude in `view-model.ts` (~5 lines, **zero content files**) so a −0.15 and a −13.4 stop printing
  the same sentence. The line is currently read on 37.5% of resolved cards and means nothing on a third
  of them. This is the `lockerRoomLine` docblock's stated intent, not a new one. **It is explicitly a
  one-wave measure: R1 hides the effort inversion, R2 resolves it.** Adopting R1 and then never doing
  R2 would be silencing a contradiction rather than fixing it, and this entry exists so a later session
  cannot claim the work was finished.
- **R2, R3 and R4 are content and go to the user** — see B76, B77, B75.
- **DECISION 074's route call for B62 is unaffected.** R2-on-the-openers was chosen on its own
  measurement (one-button cards that can only cost), which this audit does not touch. **What is
  withdrawn is 074's claim that B62 is "a legibility bug wearing a balance bug's clothes."** The audit
  says the opposite: the four expensive off-field cards were read **perfectly** — legible, cued, named
  correctly — and charge ~3 overall anyway. That is a balance question wearing nothing.

**What would change our mind.** On the refutation: a second blind audit, by a different reader, with the
control group, landing a materially different hit-rate gap. On the effort inversion: an authorial
statement that character is *meant* to reward protecting yourself, which would make 22 cards correct and
the `offfield.ts` header wrong.

**This is the eighth call reversed by measurement on this board, the third this session, and the second
in two days where the refuted claim was the PM's own.**

## 076 — The user's calls on the character currency: delete the 22 inverted effects, and play the game before authoring anything else

**Date:** 2026-09-16 · **Made by:** the user, brought by PM session 11 · **Closes:** B76 · **Defers:** B75, B77 · **Evidence:** `reports/050-*.md` §4 and §8

**B76 — delete the 22 sub-3 character effects.** The cheapest of the three routes, no prose rewrite,
and at ≤0.22 draft stock apiece it costs the balance nothing. **`kickoff-duties-too` is mandatory**
regardless of route: an authored, explicit standing cue pointing at the *uncredited* branch is a bug no
player can route around. After this, character stops paying for doing less, and the currency carries
one authored meaning instead of two.

**B75 and B77 — held for a playtest, deliberately, and the reasoning is the better half of the call.**
Both are small and both are defensible on their own measurement. **No player has seen wave 25's ledger
fixes or wave 26's Season Opener options.** Authoring two more content items on top of that would put
the next playtester in front of four changes at once — the attribution error DECISION 066 and 068 both
exist to prevent, and which this board has now paid for twice. **Play first, then decide what is
actually worth authoring.**

**The sequencing question this raises, and the PM's answer.** Wave 26 ships the Season Opener options;
wave 27 will ship R1 (the locker-room line threshold) and B76 (the 22 deletions). That is three changes
before a playtest, which is exactly what the paragraph above warns against — **and it is still the right
order.** R1 and B76 are not independent of each other or of the openers: all three are the same
subsystem answering the same complaint (*"I was told I cost the locker room and never once asked about
it"*), and shipping them apart would mean playtesting a currency that is half-corrected. The
attribution rule exists to stop *unrelated* changes being bundled, not to force a coherent fix to ship
in pieces. **The playtest that follows measures whether standing now reads as something you can earn —
one question, one bundle.** If it comes back negative, the three are separable after the fact by the
prose-probe and the realized-frequency sweep, both of which are already built.

**What would change our mind.** If wave 27's measurement shows R1 and B76 pulling in different
directions on the realized Earned/Cost counts, they ship in separate waves and the playtest waits.

## 077 — The locker-room line gets a floor of 2, and the character currency turns out to be coarser than this board's own numbers

**Date:** 2026-09-16 · **Made by:** PM session 12 · **Implements:** DECISION 075's R1 · **Corrects:** the magnitudes quoted in 074, 075 and report 050 · **Evidence:** `reports/051-one-currency-one-meaning.md` §2, §3, §6

**R1 shipped as `323971b`.** `LOCKER_ROOM_MIN_CHARACTER = 2` in `src/ui/session/view-model.ts`, applied
to `lockerRoom` only and not to `later`. 728 tests, both typecheck passes, build clean, click-through
verified. Measured over 54,000 careers, locker-room verdicts per career fall **55–67%** — Earned
5.40 → 1.25 under `good`, 6.83 → 1.84 under `virtueLoyal` — with character and draft stock bit-identical,
which is what a display-only change should look like. Identity on the printed counts would have been the
vacuous pass; it was nowhere near it.

**Two corrections that outlive the change itself.**

1. **Every character amount a player can be shown is an integer.** 348 outcome branches in
   `src/content/events/**`, 129 carrying non-zero character, magnitudes
   `{1,2,3,4,5,6,8,9,10,12,13,20,23,32}` and **no fractional value anywhere** — independently verified
   by the PM across 131 effect entries. **The `−0.15` and `−13.4` this board has quoted since DECISION
   074 cannot be printed by any card.** They are probability-weighted expectations, and `charSpread` is
   a property of an option set rather than of anything a player reads. The real dynamic range is
   **32:1**, not 89:1, and **every threshold in 1.01–2.00 is the identical function.** DECISION 075's
   suggested `≈±1.5` was not wrong; it was unresolvable, and stated as an implementable number it is 2.
2. **`charSpread` and realized branch magnitude disagree in both directions, and the second direction is
   new.** The brief warned that a small spread can hide a large branch; **The Captain Vote** is the
   proof — spread 0.90, branch **−4**, because both options carry similar-sized penalties. Five of
   050's thirteen "flavour nudges" keep their line at T=2 for this reason. No threshold separates the
   buckets cleanly, and the report shows the overlap rather than picking the tidy number.

**Why 2 and not 3.** T=2 is the largest value that keeps all twelve moral forks — *The Team Banquet*'s
credit branch is `+2` and T=3 would silence it — and the smallest value that does anything at all. What
it silences corpus-wide is the **37 single-point branches across 34 events**.

**The largest single source of R1's effect is the Season Opener authored last wave**, at 73% of the
drop, and no report had measured it. Anyone reading wave 26's numbers should know that its five new
cards also added five character-differentiating events to 047's denominator: **047's headline "34 of 60"
is "39 of 65" at HEAD.**

**Step 6, owed from DECISION 075 item 1, and it upholds it.** Re-floored, *"34 of 60 at 0.91 OVR"* is
really **"12 of 19 at 1.62 OVR"**, with 22 of 41 sub-threshold cards at 0.53 making up the rest. The
rate barely moves (56.7% → 63.2%); the **population is a third of the size and the gap on it is 78%
larger**. The twelve that clear a ≥3 floor are precisely 050's twelve moral forks — 050 cut the corpus
in the right place even though it cut it on the wrong quantity for R1's purposes.

**R1 remains explicitly a one-wave measure.** DECISION 075 says adopting it and never resolving the
underlying contradiction would be silencing a contradiction rather than fixing it. That resolution is
B76, and B76 did not run — see DECISION 078.

**What would change our mind.** A playtester reporting that the character system reads as having gone
silent. Report 051 predicts the opposite — that it now reads as proportionate — and that is the first
thing wave 28's playtest can check.

## 078 — Character tracks integrity, not effort. B76 is re-cut from 22 cards to eleven, and the ten it spares are the ones that teach what the currency means

**Date:** 2026-09-16 · **Made by:** the user, brought by PM session 12 · **Re-scopes:** DECISION 076 · **Evidence:** `reports/051-one-currency-one-meaning.md` §4

**DECISION 076 authorised deleting "the 22 sub-3 inverted character effects." The set is not 22.** Lane
051 resolved all 22 to source and checked orientation card by card: **11 inverted, 10 correct, 1
ambiguous.** Report 050 §4 tabled ten cards; all ten check out verbatim, and an eleventh
(`blueblood-scouts-at-practice`) is the same defect in a different shape. **The extrapolation from those
ten to all 22 is what broke** — and the twelve cards 050 never tabled contain a coherent,
correctly-oriented family it did not notice.

**The four "help the man who is trying to take your job" cards** — *The Five-Star Behind You* (+2 to
"Teach him the install"), *The Transfer QB* (+2 to "Take him under your wing"), *The Two-Deep* (+1 to
teaching the walk-on and **−6** to hoarding reps), *Up Forty at Halftime* (+2 to coaching up the
freshman over lobbying for yourself) — are the clearest statement in the whole corpus of the convention
`offfield.ts` states in its own header. Beside them, *Playing Through the Hand* is **the one card that
charges the player for sitting**, which is the exact opposite of the pattern B76 exists to delete.
**B76 as written deleted all five.** Deleting them does not make the currency mean one thing; it removes
the cards that teach what the one thing is and leaves the corpus proportionally *more* inverted.

**The question was authorial and it went to the user:** *when character rewards a player for teaching
the five-star who is about to take his job, is that the currency working or inverted?*

**The user's answer: the currency working. Character tracks integrity, not effort.** The eleven real
inversions are all the narrower thing — **character paying the player to protect himself** (rest the
injuries, ask for a series off, lean on the veterans, enjoy the trip). That is what gets deleted.

- **Delete:** §4.1 rows 1–8 and 10–12. `kickoff-duties-too` is row 7 and remains mandatory.
- **Keep:** all ten correctly-oriented cards.
- **`targeting-review` (row 9) keeps its effects.** 051 scored it ambiguous because it is effort-negative
  and integrity-positive; on the integrity reading it resolves as **correct**, not ambiguous. The same
  sentence that decided the ten decides it.
- **The file list is ten, not eight.** 051 §4 found `universal.ts` and `school-life.ts` missing from the
  brief's list.

**This does not revisit 076's substance.** The user's call there was made on 050's claim that all 22
were inverted; that claim is **50% true**, and this is the first measurement of the other half. The
stated intent — *character stops paying for doing less, and the currency carries one authored meaning* —
is unchanged and is better served by eleven deletions than by 22.

**The uncertainty, stated honestly, because 051 stated it first.** The orientation call is a judgement,
not a measurement. On the **effort** axis alone 050's claim holds up much better: most of the spared
cards are effort-neutral and win on **integrity**. This decision is precisely the choice of axis, and
it is recorded as such so that a later session reversing it knows exactly what it is reversing.

**What would change our mind.** A second reader scoring the same 22 cold and landing a materially
different split. Or a playtester reading the spared cards as rewarding passivity, which is the losing
side of the integrity reading and is worth one question in a future playtest.

### What it measured after it landed, and one number contradicts the premise this decision was made on

**Shipped as `2521027`:** 14 character entries deleted across the eleven cards and eight files. Ten
spared cards verified intact (all 21 entries), eleven verified empty. No test changed; 728 green, both
typecheck passes exit 0, build clean, verified independently by the PM.

- **The non-vacuous check passes at 55 SE.** Mean character under `good` **67.88 → 70.25**. An ordinary
  optimising player now ends a career **above** his starting character (−2.12 → **+0.25**) for the first
  time on this board.
- **DECISION 076's stop condition was evaluated and does not fire.** R1 and B76 move Earned and Cost
  **down together on all six measurements**. The wave stays one bundle for one playtest, as 076 intended.
- **051's own Step 5 prediction was refuted, and the agent reported it as such.** It held for the virtue
  profiles (−0.11, −0.12 lines/career) and failed for `good` at **−1.32**, of which 92% is
  `milestone-bowl-season`'s −2 — a `fixed` card firing **every played season**. The agent named the
  surviving cards correctly and never checked their **frequency**. Combined with R1, verdicts per career
  under `good` go **8.9 → 2.7**.

**The number that contradicts 076's premise.** DECISION 076 adopted this route on the grounds that *"at
≤0.22 draft stock apiece it costs the balance nothing."* **Measured, deleting the eleven returns +8.6
draft stock to both virtue profiles** (87–95 SE) — **a 10.5% tax on playing for the locker room**, and
the reason the virtue profiles had measured *below* `good` on draft stock ever since 047. The
per-card figure was right and the aggregate was not, because it never accounted for realized frequency.

**This is a balance change, not a cosmetic one, and it was authorised on a premise that has now been
measured false.** It is left in the tree because its direction is the one DECISION 074 argued for —
virtue paying rather than taxing — and because reverting a landed, green, measured improvement to
preserve the accuracy of a superseded rationale would be the wrong trade. **It is surfaced here, and to
the user, rather than absorbed into the wave's summary.** If the user wants the tax restored in whole or
in part, the commit is atomic and isolated.

**B80, flagged by 051 and out of B76's scope.** `milestone-opener-*/stay-within` (+1, five variants,
once a season) is **the same inverted shape** — character credit for the conservative branch — and is
now **the largest character effect by frequency in the bundle.** It post-dates every set 050 measured,
having been authored in wave 26, so no audit on this board has ever seen it.


## 079 — The `0 snaps` bug is cosmetic, costs nothing measurable, and sits on a much larger hole: a fifth of all authored production is awarded to injured players

**Date:** 2026-09-16 · **Made by:** PM session 12 · **Closes:** B64 for this wave, at R0 · **Corrects:** DECISION 073 in three places · **Opens:** B79 · **Evidence:** `reports/052-which-card-hands-you-yards-in-a-season-you-never-played.md`

**Attribution is complete and DECISION 073's relocation is confirmed by instrumentation, not inference.**
All **138** bad rows in 72,000 careers name an authored `stat` effect; none has an empty history. 048's
`z-206` repro is resolved — no snap effect ever touched that line.

**But the harm 073 priced does not exist, and the report says so against its own brief's framing.**
On all 138 rows the player was **sidelined in every on-field phase**. So `snaps: 0` is *true*, the `−4`
upperclass decline is *correct*, and *"A season on the sideline cost you ground"* is *accurate*. **Only
the stat line is false.** Measured: **zero** of the 138 careers change draft stock, round, status **or
award set** when the defect is removed. The sharpest available test — a false line crossing
`postseason.ts:56`'s production-award gate and handing a sidelined player an All-Conference — was run
and does not happen at 72,000 careers.

**Frequency, at the denominator that matters.** 0.192% of careers, 0.442% under `virtueLoyal` (the
playtester's shape), peak 0.75% at virtueLoyal×OSKILL. **Median fake stat is 4**; only 17 of 138 are
≥100 yards. 073's open question about human-shaped policies is answered: **no** — `humanLazy` is the
*least* affected profile.

**The call: R0 this wave.** Paying anything to fix a cosmetic defect in 1 career in 520 is the wrong
trade while a playtest is the highest-value item on the board. **This is a scheduling call, not a
balance call**, which is why it did not go to the user.

**The finding that outranks the bug it was sent after, and it is B79.** `select-event.ts:38` reads
`c.requiresPlaying && state.redshirtSeasonActive` — **the gate DECISION 048 requires on every on-field
production card knows about the redshirt and not about the boot.** Verified in source by the PM.
Consequence, measured: **20.8% of all authored production in this game — 44,028 of 212,085 `stat`
writes — is awarded to players who are injured or suspended.** The 138 bad rows are only the tail where
it is *visible*, because the player never played later in the season to paper over it.

**RE is the real fix and it is deliberately scheduled, not rejected.** One line —
`|| isSidelined(state)` — needing no content change, because `validateContent` already guarantees the
flag. It takes 138 → 0 and 44,028 → 0. **It costs −2.09 mean draft stock, +1.33pp undrafted (a 52%
relative rise), −1.96 decisions per career, and it hits the `good` profile hardest (−5.07 stock,
undrafted 0.57% → 2.90%)** — which fails the board's own standing test that a change a good player
should not notice barely moves that row. **Every balance baseline on the board would have to be
retaken.** It needs the engine freeze lifted and a re-baselining wave behind it, and it is the user's
call when that wave comes.

**RA — `stat` is a no-op on a zero-snap line — is one line, nearly free (−0.0003 stock), and fixes
100% of the visible defect. It is not adopted, and the reason is the user's to overrule.** It converts
138 loud contradictions into **672 quiet ones** of the same family: cards whose prose promises
production that never arrives. That is a choice between *"the ledger must never contradict itself"* and
*"a card must always deliver what it narrates"*, and if the user weighs it the first way, RA is correct
and costs one line.

**Three corrections DECISION 073 owes, all measured.**

1. *"The clamp never touched one of the 29"* — **false as a general statement.** 21% of bad rows carry
   snap-effect history and on 24 the clamp ate an authored `+10`. **073's conclusion stands** — the
   reverted fix would still have saved **0 of 29**, on ordering — but the supporting claim was wrong.
2. *"`productionScore` loses those snaps from draft stock"* — **false.** There are no snaps to lose;
   draft-stock impact is 0 careers in 72,000.
3. *"The −4 and the verdict on a season the player lived through"* — **the player lived through it on
   the sideline.** Both are correct.

**What would change our mind on R0.** A measured mechanical cost at higher N (an award crossing kills
R0 immediately); or a player report where the fake line is large, which would make the visibility
argument stronger than the rate suggests and buy RA its collateral. **The highest-value follow-up**, and
it is cheap: an RE variant that lets the selector draw a **replacement** card when a production card is
gated out. Most of RE's cost is the ~2 cards a career that stop firing, not the lost production — if
that holds, the variant lands RE's correctness at RA's price.

**A third diagnosis corrected by measurement, in a row.** Session 11's parting line was *check the
diagnosis, not just the observation*. B64's observation was real in every telling, and the explanation
has now been wrong three times: closed-line mutation (refuted by 048), the `effects.ts:61` clamp
(approved, implemented, reverted by 073), and *"the player lived through that season"* (refuted here).
**Each refutation came from instrumentation and none from re-reading source.**

## 080 — Standing can only be lost, and the cause is four numbers in `bands.ts`: the player starts on a rung's floor, one point above a fall and fifteen above a climb

**Date:** 2026-09-16 · **Made by:** PM session 12, measuring the 053 playtest's observation · **Answers:** wave 28's one question · **Refutes:** DECISION 077's and 078's optimistic readings · **Opens:** B81 · **Evidence:** `reports/053-can-you-earn-it.md`, plus the PM's own 7,200-career sweep

**The playtester's verdict, after three careers and ~100 decisions:** *"Only something you can lose."*
Upward rung movements **zero**, across two careers played deliberately to earn it and six *"Earned you
credit in the locker room"* messages. Downward rung movements **two**, in the one career where they
misbehaved, **the first on decision 2**, each with a large well-designed callout naming the rung left
behind. Their sentence: *"the same widget that fires within ninety seconds of a bad choice will not
fire after four years of good ones."*

**The observation is right and this time the mechanism is measurable, so the PM measured it before
anyone proposed a fix.** It is four numbers:

```
STARTING_CHARACTER (create-career.ts:8) = 70

TRUST_BANDS (ui/session/bands.ts:73)      distance from a starting player
  85  "they would run through a wall for you"      +15
  70  "the staff trusts you"          <-- START IS EXACTLY THE FLOOR
  50  "just a guy in the building"                  -20
  30  "a problem they are managing"
   0  "the staff has stopped defending you"
```

**Every player begins standing exactly on a band boundary.** Down is therefore a **1-point** fall and
up is a **15-point** climb. That is the asymmetry, and it is not a metaphor: it is `>=`.

**The climb is not merely hard, it is unreachable. Measured over 7,200 careers — three profiles × six
positions × 400 runs.**

| profile | median Δcharacter | p95 Δ | best average final | reaches 85? |
|---|---|---|---|---|
| `virtueLoyal` | **+5 to +6** | +10 to +12 | 75.91 | **no — not one cell** |
| `virtueAmbitious` | **+5 to +6** | +12 to +14 | 75.92 | **no — not one cell** |
| `good` | 0 to +2 | +7 to +10 | 70.94 | **no — not one cell** |

**Maximally virtuous play returns a median +6 against a +15 requirement, and the best 95th percentile
in the entire sweep is +14.** The top rung of the ladder the summary screen draws **cannot be reached
by any policy at any position.** The playtester chose, unprompted, to spend their entire third career
chasing the phrase *"get to 'they would run through a wall for you'"* — a rung the game renders one
step above their marker and no player can occupy.

**This is why every other wave-28 answer came back the way it did**, and it retires three separate
hypotheses in one line:

- *"I could not tell the game was counting"* — it was counting, at a third of the resolution needed to
  show a result.
- **Claim 2 (standing can be earned) refuted** — not because credit is not awarded, but because the
  credit awarded is a quarter of a rung.
- **Claim 1 (proportionate) partial** — loud downward and silent upward is exactly what a 1-point fall
  and a 15-point climb produce.
- **A.4, *"neither built anything nor defended anything"*** — you cannot build (+15 unavailable) and
  you are not defending, because standing on a floor means it is not at risk, it is already spent.
- **DECISION 077's own named falsifier does not fire.** The player did not report the character system
  as gone silent; they reported it as **loud in one direction**. R1's threshold is not implicated and
  should not be the first thing a session reaches for.
- **DECISION 078 is not implicated either, but it is not vindicated.** Wave 27 moved `good` from −2.12
  to +0.25 and virtue to roughly +6. Against a 15-point rung that is still invisible. **The wave
  improved the currency and could not possibly have shown it** — which is worth recording, because the
  obvious reading of a failed playtest is that the last wave was wrong, and here it was merely
  inaudible.

**Where the fix lives, and the good news.** `src/ui/session/bands.ts` is **UI, not frozen**, and the
band thresholds are display calibration: `character` still swings draft stock identically whatever the
ladder says. **No engine change, no content change, and no balance change is required to fix this.**
`STARTING_CHARACTER` lives in frozen engine code, but it does not need to move — the bands can move
around it.

**The one question that is genuinely the user's: how reachable should the top rung be?** The phrase
*"they would run through a wall for you"* should presumably be rare. Rare and impossible are different,
and the numbers above say which one is currently shipped. This is B81 and it is wave 29's first lane.

**What would change our mind.** A measurement showing some policy or position does reach 85 — the sweep
covers three profiles and six positions at 400 runs each and found no cell, but a human player is not a
policy. A second playtester reaching the top rung would refute this entirely.

**The instrument note worth keeping.** The playtester's observation and the playtester's explanation
were, for once, *both* right — but only because they stopped at *"the display is not the problem, the
asymmetry is"* and did not guess at a cause. **The numbers came from the PM's sweep, not from the
report.** That is the division of labour session 11 asked for, working as intended.

## 081 — The ladder is recalibrated to 80/66, the playtester's experience is eliminated as a number, and DECISION 080 overstated its own evidence by one word

**Date:** 2026-09-16 · **Made by:** PM session 12 · **Implements:** DECISION 080 / B81 · **Corrects:** DECISION 080 · **Evidence:** `reports/054-a-rung-you-can-actually-reach.md`, 14,400 careers

**Shipped as `f2c3188`.** `TRUST_BANDS` top two floors **85 → 80** and **70 → 66**; the lower three
untouched. 740 tests, both typecheck passes, build clean, clicked through.

**The PM proposed the pair and the agent endorsed it on measurement rather than implementing it blind,
which is the outcome the brief was shaped to get.** It also **corrected the PM's reasoning for 66**:
the "four points of buffer" argument is equally satisfied by 69, so it was too weak to pick the number.
**The real argument is the bundle's own effect distribution — 49 of the 72 authored negative character
outcomes land in −1..−4, so a 4-point buffer absorbs two thirds of single bad cards.** Same number,
sound reason; the board should quote the second one.

**Top-rung reach, 14,400 careers (6 profiles × 6 positions × 400), old → new:**

| profile | reaches the top rung |
|---|---|
| `virtueAmbitious` | **2.3% → 23.1%** |
| `virtueLoyal` | **0.5% → 15.7%** |
| `good` | 0.1% → **1.8%** |
| `baselineRandom`, `lazyFull`, `saboteurFull` | 0.00% → **0.00%** |

**Exactly the target shape: a clear minority of virtuous careers, near-zero for the stock-maximiser,
zero for everyone else.** The bottom of the ladder is confirmed untouched — `lazyFull` occupancy
`0.220/0.435/0.345` → `0.219/0.435/0.345`.

**The playtester's sentence, eliminated as a number.** Of virtuous careers whose ladder moved at all,
the share that **fell before ever climbing** goes **94.5% → 31.9%**. That statistic *is* *"only
something you can lose."* And a fall inside the first two decisions goes **3.75% → 0.00%** across 7,200
non-mercenary careers.

**The detail in that which is worth more than the fix.** The old 3.75% early-fall rate was **identical**
for `virtueAmbitious`, `virtueLoyal` and `good`. **The early fall had nothing to do with how well the
player played** — it was the boundary, firing on whoever drew a −1 first. The playtester's decision-2
fall was not a judgement of their career. It was arithmetic.

**Both identity checks pass, pointing opposite ways, as the brief required.** `npm run balance` and the
virtue probe come back **byte-identical** — no balance moved — while the rung-occupancy table moved
hard. The only keys that change anywhere are the three trust-band phrases.

**The one metric that moved the wrong way, reported by the agent rather than found by the PM.** The
ladder is **quieter**: `virtueAmbitious` never-moves 60.2% → 66.1%, `good` 35.7% → **69.1%**. Almost all
of the loss is *downward* movement (ups 0.36 → 0.34, downs 0.44 → 0.16). That is the intended effect of
removing a trapdoor, but a ladder nobody moves on is the failure mode on the other side of this fix.
**`80/67` is the measured alternative** — it holds activity at the old level (61.6% never-moves) at 4×
the early-fall rate, and it is a one-character change. **This is the named falsifier: a playtester
reporting the ladder as inert flips it.**

### The correction, and it is the PM's

**DECISION 080 says the top rung *"cannot be reached by any policy at any position."* That is one word
stronger than its evidence.** The sweep behind it measured **cell aggregates** — medians, p95s and
per-cell averages — and no cell average reached 85. Per **career**, **2.25% of `virtueAmbitious` careers
did touch 85.** The conclusion is unaffected: at ~2% it was unreachable in every sense a player
experiences, and the playtester who chased it for a full career was not unlucky. But *"cannot"* should
read ***"is reached by roughly 2% of maximally virtuous careers and by nobody else."***

**This is the second time on this board that a cell aggregate hid a per-career tail**, and both times
the aggregate was the PM's own. The rule it earns: **when a claim is about what a player can
experience, the denominator is careers, not cells.** An average over 400 runs cannot answer a question
about the 95th percentile of one of them.

**The instrument that makes the next recalibration cheap.** `src/sim/rung-probe.ts`, committed and
tested: it scores the full per-decision character trajectory against **a band table passed in as a
parameter**, so any future calibration is compared on **identical seeds** rather than by running two
samples and diffing summary statistics. That design is what let this lane answer "old versus new"
honestly, and it is why the 80/67 alternative already has numbers attached.

## 082 — The one-option card was never a button, three quarters of the game's heal reports were false, and 95% of the remaining defect is one label

**Date:** 2026-09-16 · **Made by:** PM session 12 · **Closes:** B82 in the UI · **Opens:** B85, B86 · **Evidence:** `reports/055-the-button-promises-and-the-outcome-refuses.md`

**Shipped as `65b057a`.** 740 tests, both typecheck passes, build clean, clicked through at 1456×900
and at a 360px content box.

**The brief's premise was wrong, and being wrong is what made the fix possible.** The brief — and the
053 playtest, and the PM — all described *"a button that asserts success."* **There is no button.**
`openCard` auto-resolves a one-option card on arrival (DECISION 018). The label was being rendered as a
**bare declarative line above the outcome**, so the UI was narrating an *option label* as a *completed
event*. Multi-option cards carry *"You chose:"* — an intention frame. One-option cards had that frame
stripped and **nothing put in its place.**

**The fix is one caption: the narrated beat now reads *"The plan: <label>"*.** Unconditional on both
branches, because captioning only the failures would reveal the roll. **It resolves all 6 clear and 3
borderline one-option instances with no prose touched** — which is why a lane told *"implement the UI
route only if it genuinely fixes something"* was able to implement one.

**053's "three times in three careers" is CONFIRMED and it is not rare.** Measured over 3,000 careers ×
4 profiles: **72–74% of careers meet a contradicted one-option card**, at **~1.1 per career**. Class
size: **6 of 12** one-option cards, 25 of 132 multi-option branches. **The rate is flat across `good`,
`virtueLoyal`, `baselineRandom` and `lazyFull`, and that flatness is the finding** — the player cannot
decline these cards, so no amount of skill avoids them.

**B85 — 95% of the acute class is a single card, and it is the highest-value word-for-word action left
on this defect class.** `milestone-fall-camp`'s *"Win the job"*: a fixed event gated `minClass: SO`,
firing ~3× per career and failing **35%** of the time — **1.048 of the 1.10 per career.** It is also
053's stale-flavour card (*"your name is written in pencil"* served four years running, including to an
All-America senior). **The label asserts the outcome and the card then refuses it.** Content is frozen,
so this is an **RB proposal and goes to the user.** The caption now softens it; rewriting the label
removes it.

**The second bug, found unasked, and it is larger than the one the lane was dispatched for.**
**74.7% of every *"An injury healed and gave the points back"* line this game has ever printed was
false** — 7,693 of 10,298 reports across 78,605 advances, touching **78% of careers.**
`someInjuryLeft` demanded a **strictly** smaller `remainingPhases`, but only a *phase tick* decrements
one, so any advance **inside** a phase failed to match an unchanged injury list against itself and
reported a heal that had not happened. `<` → `<=` gives **0 false positives and 0 missed true heals**,
and brief 049's case still reports. Verified in source by the PM. This is what 053 met as *"duplicate
narration of one healed injury"* — **+1 at the end of season 2, then +5 on the first card of season 3.**
The player saw the tail of a 78%-of-careers defect and described it exactly.

**B86 — RC is refused in its obvious form, and the reasoning is worth keeping.** A lint rule that fails
the build when a one-option label *"asserts a result"* **cannot work: "asserts a result" is not
lexically decidable, and the flagship instance shares no word with its failure branch.** The report
proposes a required-acknowledgement field across the 12-card one-option population instead — schema,
therefore content, therefore the user's. **A refused route with a stated reason is a result**; this
board has twice paid for shipping a change that could not do what its name said.

**What would change our mind.** On the caption: a playtester reading *"The plan:"* as a hedge, or as
telegraphing that failure is coming. It is unconditional precisely so it cannot do the latter, but
that is an argument, not a measurement, and the next playtest is where it gets one.

## 083 — 046 Part 2 is retired; the redshirt pack is retired as a PM lane and stays on the user's authoring list

**Date:** 2026-09-24 · **Made by:** PM session 13 · **Closes:** next-action item 7, carried unexecuted
since session 6 · **Supersedes nothing; it resolves two items by declining them**

Both have sat below everything else on this board for **seven consecutive sessions.** Carrying an item
an eighth time without scheduling it is a decision being made by default, and a decision made by
default is one nobody can find the reasoning for later. So it is made here, explicitly.

**046 Part 2 — retired.** It exists to price redshirt routes R1–R3. DECISION 071 named **R0** as the
likely answer before the pricing was ever run, and DECISION 072 then closed the real defect underneath
it — the trapdoor — by a different mechanism entirely, on the user's call, and shipped it. **Pricing
three routes against a defect that is already fixed buys nothing but the pricing.** The parked work is
in `reports/046-*.md` if a future session needs it.

**The redshirt pack — retired as a PM lane, not as an idea.** It is authoring new content for sit
seasons, and `src/content/**` is frozen: it was never a lane this board could run, only a proposal it
could carry. It belongs with B10 (imagery) and B11 item 3 on the **user's** authoring docket, and it is
recorded there rather than on the wave board. DECISION 068 deferred it once already for the same
reason.

**What would change our mind.** For 046 Part 2: a measurement showing the redshirt offer still
distorts careers after 072's fix — which would mean a new defect, not this pricing. For the pack: the
user opening content authoring, at which point it is a strong first candidate, because the sit season
is the one stretch of a career with no authored material at all.

## 084 — "Only something you can lose" is an authored property of the corpus, not a calibration error. DECISION 081's falsifier fired and its prepared remedy is deliberately NOT applied

**Date:** 2026-09-24 · **Made by:** PM session 13 · **Evidence:** `reports/056-can-you-earn-it-now.md` (3 careers, ~114 decisions), `reports/057-does-the-good-branch-ever-say-anything.md` (3,600 careers/profile), plus the PM's own corpus sweep over all 106 cards · **Answers:** the question waves 28–30 were all built on · **Supersedes the mechanism in:** DECISION 080

**Two lanes that could not see each other landed on the same card.** 057 measured *Up Forty at
Halftime* as the source of 66% of all locker-room credit and *The Two-Deep* as structurally
credit-incapable. The playtester, with no access to any of that, wrote that *Up Forty* **is**
recognition and *The Two-Deep* — **the same fiction, teaching the man behind you** — is inert. When a
statistical probe and a person who has never read the source name the same two cards and the same
contrast, the finding is not an artifact of either method.

**The measurement that settles it, run by the PM over the whole corpus at HEAD:**

| | can earn a credit | can be charged | silent both ways |
|---|---|---|---|
| 204 authored options, floor applied | **22 (10.8%)** | **48 (23.5%)** | 136 (66.7%) |
| 204 authored options, floor removed | 38 (18.6%) | 59 (28.9%) | 114 (55.9%) |

**27 of 106 cards (25.5%) can charge the player and can never credit him. The mirror set is 9.** With
the display floor removed it is still **21 of 106 (19.8%)** — so **the asymmetry is in the writing, and
the floor widens it rather than causing it.** Roughly three options can take standing away for every
two that can give it.

**The one-way-down cards are over-represented in what a player actually meets**, which is why ~114
decisions produced zero upward rungs: the set includes all five `milestone-opener-*` variants and
`milestone-rivalry`, which are `fixed` and fire every season.

**The authored shape, stated plainly, because it is the whole finding:** restraint is written as the
null option. `offfield-bowl-curfew` / *"Stay in and get the rest"* and `offfield-ghost-media` /
*"Show up and answer the questions"* are both `effects: []` — literally nothing — while their
transgressive siblings carry −4/−5 and −4/−9. **The game scores misbehaving and declines to score
behaving.** Three more such cards were found by the playtester by hand; the sweep found 27.

**What this retires.** DECISION 080 diagnosed *"standing can only be lost"* as four numbers in
`bands.ts`, and 081 recalibrated them. That work is measured, green, and an improvement — **and it
could not have fixed this**, because the ladder was being asked to display movement that the corpus
never generates. **Waves 28 and 29 sized the rungs; nothing was pushing on them.**

**DECISION 081's named falsifier fired, and the prepared remedy is not applied. This is the call.**
081 said: *a playtester calling the ladder inert is the falsifier, and `80/67` is measured and ready as
a one-character change.* The playtester called it inert — *"in career 1 it read as inert and I stopped
tracking it around decision 12."* **The falsifier fired and `80/67` is still wrong**, because it
restores **downward** movement and the complaint is the absence of **upward** movement. Shipping it
would make the ladder fall more readily in answer to a report that it never rises. **A prepared remedy
is not owed execution by the trigger it was filed under; it is owed a check that it points at the
thing that fired it.** `80/67` stays on the shelf and B87 stays `watch`.

**What would change our mind.** A corpus edit that makes the credit and charge populations comparable,
after which a playtester still reports zero upward movement — that would put the fault back in
`bands.ts` and `80/67` becomes live again. Or a demonstration that the 27 one-way-down cards are rarely
met in play, which the `fixed` opener and rivalry cards make unlikely.

**The routes are the user's**, because every one of them edits `src/content/**`. They are B85, B88 and
B90 on the board, and they are carried to the user together rather than one wave at a time.

## 085 — DECISION 084 is corrected in one clause and upheld in the rest. The PM's two clearest candidates were both wrong, and the better principle is the lane's

**Date:** 2026-09-24 · **Made by:** PM session 13, accepting lane 059's corrections · **Corrects:** DECISION 084 (one clause) and the acceptance criterion in `briefs/059` · **Supersedes:** report 057 §6 R2 · **Evidence:** `reports/059-price-the-thing-the-user-has-to-approve.md`

**DECISION 084's numbers reproduce exactly.** 059 re-derived every figure from `CONTENT` rather than
transcribing it: 22/48/136 options, 27 one-way-down cards, 9 mirrors, 21 at floor 1, plus DECISION
077's 72-negatives and 49-in-−1..−4. No discrepancy. The corpus asymmetry stands as measured.

**The clause that is wrong.** 084 says the ladder *"was being asked to display movement that the corpus
never generates."* **The corpus does generate credits** — measured corpus-wide, the median `virtueLoyal`
career reads **2** locker-room credits. What it rarely generates is enough *accumulated* character to
cross a rung boundary from a start already sitting on rung 2. **Credits firing and rungs moving are two
different claims and 084 ran them together.**

**The PM made a denominator error and it was in the brief.** `briefs/059`'s acceptance criterion —
*credit p50 ≥ 1 on `virtueLoyal`* — is **already satisfied at HEAD** and therefore discriminates
nothing. Report 057's *"credit p50 = 0"* was true of **the ten spared cards only**, and the PM carried
it into a brief as a corpus-wide figure. This is next-action item 9(d) — *a set defined by a
measurement is not the corpus* — firing for the third time on this board, and for the second time on
the PM's own arithmetic. **The criterion that discriminates is credits sourced from the 27, which is 0
by construction at HEAD**, and 059 substituted it unprompted.

**The PM's two clearest candidates were both wrong, and the lane's principle is better than the PM's.**
084 named `offfield-bowl-curfew` / *"Stay in and get the rest"* and `offfield-ghost-media` / *"Show up
and answer the questions"* as the obvious cases. 059 refuses both: curfew is **a rule**, press
availability is **required**, and the cards' own prose closes the door — *"You watch a movie in the
hotel room"*, *"Nobody remembers it by dinner."* **Crediting them pays a player for doing his job.**

**The test adopted in place of the PM's, stated so a future session can disagree with it precisely: a
restraint branch should pay only if (a) somebody in the room can see it, and (b) it costs the player
something he wanted.** Paying for private prudence redefines `character` as a compliance score —
*"avoided doing a bad thing"* — which is **worse than the current silence, because it is wrong rather
than merely absent.** This is DECISION 078's integrity-not-effort axis applied one level down, and it
is the reason **14 of the 27 stay one-way-down on purpose.**

**084's "the game scores misbehaving and declines to score behaving" is true of the corpus and is
*also the design* on the eight-card `offfield-*` transgression family**, whose convention is stated in
`offfield.ts` itself: the corrosive option charges on the branch you take, and the null branch is the
author saying *nothing happened*. A wave that "fixed all 27" would ship a worse game than HEAD.

**Two corrections to report 057 §6 R2, which this supersedes.** Its +0.17 draft stock measures at
**+0.131** (~23% high), and its *"`good` moves exactly 0.00 by construction"* is **false** — measured
**+0.008**, because `good` takes `targeting-review/pull-up` in 6.4% of careers. R2's
`playing-through-the-hand` edit is **dropped**: that card is not one of the 27 (its only charge is −1,
already sub-floor), so crediting it would have created a one-way-**up** card.

**What is not decided here.** Tier 1, Tier 2 and the unsure three are content and go to the user
unchanged, with 059's §5.3 table attached. **The PM does not recommend Tier 2 to the user as a bundle
with Tier 1**: it takes the `good` profile's credit rate from 72.5% to 100%, so a player who never
thinks about the locker room once would be told he has standing every September — which is precisely
the signal `briefs/059` named as meaning the list is wrong. It is a real authorial question, not a
defect, and it is asked separately.

**What would change our mind.** On the clause: a measurement showing rung crossings are rare *given*
the credits that do fire, which would move the fault back toward `bands.ts`. On the principle: a
playtester reporting that declining the transgression feels unacknowledged — which is the losing side
of the compliance argument and is worth one question in the next playtest.
