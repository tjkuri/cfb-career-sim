# 038 — Four orientation defects and a button that lies

**Type:** developer (UI) · **Wave:** 18 · **Status:** done (defects 1–4 fixed; defect 5 diagnosed, proposal below)

Brief: `docs/superpowers/polish/briefs/038-where-am-i.md`

---

## The headline: defect 1 was the SECOND explanation

**The rail's value is right. The label was wrong.**

`enterOffseason` finalizes the completed season line and THEN applies the season's development,
in that order, on purpose:

```
// advance.ts:225-243
lastSeason.overall = s.overall;          // the line is finalized here...
s.overall = clampOverall(s.overall + seasonOverallDelta(...));   // ...and the player develops here
```

with the engine's own comment saying why — *"the development points come from last season's snaps
but are earned for the next season, so they belong to the next line"* — and an engine test pinning
it (`advance.test.ts`, "finalizes the completed line with the class year it was PLAYED AS":
`expect(s.seasons[0]!.overall).toBe(70)` against a live `overall` of 72).

So the two numbers are two different quantities, both true:

| | what it is | end of season 1, seed `1agnhl` |
|---|---|---|
| ledger row | OVR the season finished on, **before** the offseason | 64 |
| header | live OVR, **after** the offseason's development | 65 |

The gap is exactly the figure the card on screen is already explaining
(`EVERYTHING ELSE +1 OVR — A season of development came in.`). Measured across a real career it is
the development delta every time (1–3 points), never a stale figure: I walked a career headlessly
and checked the stored line against the live value at every boundary.

Nothing was stale, so nothing was recomputed. **The column head changed**, from

> `OVR AT SEASON'S END` → `OVR BEFORE THE OFFSEASON`

which turns the contradiction into the two ends of the sentence the card is already saying:
*Year 1 finished on 64 · a season of development came in · now 65.*

One genuinely stale case DID turn up while diagnosing this, and is fixed as part of the same change:
a career that ends **in the middle** of a season never reaches `enterOffseason`, so its last line
still carries the OVR it *kicked off* at (`advance.ts:319`) — and the ledger was printing that
number under a season's-end heading. `LedgerRow.finished` (below) now withholds it.

### ⚠ For the PM: the ending screen says the old words

`SummaryScreen.tsx:290` prints `Ovr at season's end` over the **same column of the same numbers**,
and I did not touch it (PM-owned this wave). It needs the same head, or the career ledger should
adopt whatever wording you prefer there — the two screens are supposed to share one vocabulary
(DECISION 035). Note the ending screen already hedges the other half of this: its `FINAL OVERALL`
carries the caption *"after the off-season"*, which is the same gap noticed and patched from the
other side.

---

## What changed

### 1. The label (above) — `CareerScreen.tsx`, the `.ledger-head`

### 2. The rail no longer runs ahead of the header — `ledger.ts` `followHeader()`, wired in `CareerScreen`

`buildLedger` keys the current row to the live `seasonIndex` (DECISION 033), which is right on a
live screen and wrong on exactly one: a resolved card, read under a frozen stamp (DECISION 019)
because `advance()` has already crossed the season boundary before it returns. The header said
`SEASON 1 · POSTSEASON`; the table lifted `YEAR 2`.

New pure function in `session/ledger.ts`:

```ts
followHeader(rows, seasonNumber)  // moves the highlight to the header's own season
```

`CareerScreen` passes `rail.seasonNumber` — the same number the header prints — so the two agree by
construction. It only ever *moves* a highlight, never adds one (a terminal career still has none),
and the row it moves off returns to `played` or to empty chrome depending on whether a season line
ever filled it. No-op when no card is on screen.

This is what forced the second half of the fix: the boundary row is now **current and finished at
once**, and the old renderer gated every figure on `state === "played"`, so the row would have lost
its record, snaps and OVR at the moment the player most wants to read them. `LedgerRow` therefore
grew a `finished` flag — "this season is over and its stored figures are final" — and the renderer
(cells, `ledgerDelta`, `ledgerArc`, the head's presence) reads that instead of `state`. That is also
what closes the mid-season-washout stale number described above.

### 3. The phantom fifth year — `BASE_SLOTS = 4` in `ledger.ts`

The table now stands **four rows**, and grows to five the moment `eligibility.redshirtUsed` is true.
Which means the fifth row appears in the same click as the card that says the redshirt was taken —
verified in the browser: the `Redshirt?` outcome card and the new `YEAR 5` row land together. No
eligibility rule is stated anywhere; the table reports a stored fact and says nothing about what
caused it, which keeps DECISION 020's withdrawal intact.

Defensive, and deliberately so: the table may refuse to *promise* a row, never hide one that exists.
A save carrying a fifth season line, or an **active** career standing in season 5 without the flag,
still gets five rows. The `active` gate is what stops a finished four-season career from growing the
empty row back at the very end (its `seasonIndex` is parked one past its last season).

`tentative` and the dashed fifth-row CSS are **deleted**: with slot 5 existing only when it is real,
the flag could never be true again, and a dead flag with live styling attached is what the next agent
trips over. `redshirtSlot` stays.

### 4. The START button — `CreationScreen.tsx`, `creation.css`

- **Disabled treatment.** `--action` is, per `tokens.css`, *"the one button that moves the career
  forward"*. A button that cannot move it forward does not wear that role: the gold fill goes and
  what is left is a hairline `--line` edge with `--chalk-faint` ink — the same empty chrome this
  interface already uses for a season that has not happened — plus `cursor: not-allowed`. The base
  rule gained `border: 1px solid transparent` so lighting the edge moves nothing.
- **The field is marked.** `Last name` now carries a lower-case `required` in the label (set against
  the label's own caps so it reads as a note, not a second field name), plus `required` /
  `aria-required` on the input. An asterisk was the alternative and says nothing to anyone who has
  not been taught it.
- **The click that did nothing now answers.** A line under the button names the one thing left to do
  — *"Add a last name to start."* — and disappears when it is done. It also covers the second silent
  case nobody reported: clearing the jersey number kills the button just as quietly, and now says
  *"Pick a jersey number from 1 to 99."*

`SummaryScreen` also uses `.primary` but is never disabled; the transparent border is a no-op there.

---

## 5. `Next Man Up` — diagnosis and proposal (no content edited)

**Event:** `wideopen-next-man-up`, `src/content/events/school-life.ts:24`
(phase `conference`, `conditions: { schoolTrait: ["wideOpen"], requiresPlaying: true }`).

**The condition it is missing does not exist yet.** The event already sets `requiresPlaying: true` —
the condition the brief expected. The bug is one level down: `requiresPlaying` is only half
implemented.

```ts
// select-event.ts:37 — the whole of the gate
if (c.requiresPlaying && state.redshirtSeasonActive) return false;
```

Its own comment says *"Milestones assume the player is on the field"*, but it only tests one of the
two ways a player is off it. The other is an injury: `simulatePhaseProduction` calls
`isSidelined(state)` — any active injury or suspension — and returns before a single snap is
credited (`simulate.ts:20-21`). A kicker in a walking boot is taking **zero** snaps, and the event
pool does not know it. Hence *"Take every snap and do not come off."*

This is wider than one card's prose. `schema.ts:263` **requires** any on-field event that awards
stat/snap production to set `requiresPlaying` (DECISION 048), precisely so a sidelined player is
never credited with production he did not earn — and the gate that rule depends on lets every one of
those events through to an injured player. ~73 events across the bundle carry `requiresPlaying`.

**Proposal A (recommended) — one line, engine, no content change:**

```ts
// select-event.ts:37
if (c.requiresPlaying && (state.redshirtSeasonActive || isSidelined(state))) return false;
```

It makes `requiresPlaying` mean what its name, its comment and DECISION 048 already claim it means.
It is one import and one clause. It is a **balance change** — an injured player draws from a smaller
pool for the phases he is out, so it goes to the user, not just the PM. Worth measuring before it
lands: whether any on-field phase can empty its pool for an injured player (`selectRandomEvent`
returns null and is handled, so the failure mode is "no card", not a crash).

**Proposal B (narrower) — new condition, engine + content:** add `requiresHealthy?: boolean` to
`EventConditions` (`types.ts:78`), one clause in `eventMatches`, one validator line in `schema.ts`,
then the one-line content change:

```ts
conditions: { schoolTrait: ["wideOpen"], requiresPlaying: true, requiresHealthy: true },
```

Fixes this card only and changes no other event's rate. It is the safer change and the less true one:
every other `requiresPlaying` event has the same hole, and B leaves it open.

There is **no content-only fix**: the schema has `requiresInjury` and `requiresActiveInjury` (both
positive gates) and nothing that excludes an injured player, so either path touches frozen code.

**Secondary, same card, not proposed here:** the event carries no `position` condition, so a kicker
draws *"the guy in front of you goes down… take every snap"* on its own merits. That is the
position-neutral-content finding already logged from the 036 playtest, not this defect.

---

## Verification

- `npm test` — **671 passed, 39 files.** Baseline at the start of this task was 650/38; +11 are mine
  (rewritten ledger shape tests, new `finished` and `followHeader` tests including a real-career walk
  that composes `seasonStamp` before `advance` and the ledger after it, exactly as the screen does),
  and the remaining file/tests are the in-flight `src/sim` task's, untouched.
- `npm run typecheck` — both passes exit **0**.
- **Browser, localhost:5173, 1456px, three careers played by hand/script:**
  - Creation screen: button renders hairline-and-faint with the note, flips to gold the moment a
    name is typed and the note goes.
  - Season 1 boundary (`SEASON 1 · POSTSEASON`): header `65`, card `EVERYTHING ELSE +1 OVR — A
    season of development came in.`, rail `YEAR 1` **still highlighted**, showing `5-7 · 335 snaps ·
    64` under `OVR BEFORE THE OFFSEASON`. Header and rail now name the same year and the two numbers
    reconcile on screen.
  - Redshirt taken in season 2's offseason: the table grows to five rows in the same click as the
    `Redshirt?` card.
  - A four-season career played to its end: four rows the whole way, `YEAR 4` current at the final
    postseason, no empty fifth slot, and the arc line reads `ACROSS 3 SEASONS 66 → 79 +13`.

## Files touched

`src/ui/session/ledger.ts` · `src/ui/session/ledger.test.ts` · `src/ui/session/types.ts` ·
`src/ui/screens/CareerScreen.tsx` · `src/ui/screens/CreationScreen.tsx` ·
`src/ui/styles/career.css` · `src/ui/styles/creation.css`

Not touched, as instructed: `src/engine/**`, `src/content/**`, `src/sim/**`, `SummaryScreen.tsx`.
Nothing committed.
