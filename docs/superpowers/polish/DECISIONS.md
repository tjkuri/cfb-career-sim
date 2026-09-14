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

