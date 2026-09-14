# 007 — Stop the header lying: live season state through the view-model

**Status:** done · data only · `src/ui/session/**` and its tests · no CSS, no screen component touched.

Nothing looks different yet except one thing that had to change: the header no longer renders a
record during the season, because there is no record during the season. Everything else is data made
available for the next brief to draw.

---

## 1. The final `CareerView` shape

```ts
export interface CareerView {
  playerName: string;
  positionLabel: string;
  schoolName: string | null;
  classYear: ClassYear;

  // CHANGED — honest now. Null unless the postseason resolver has actually run.
  seasonRecord: string | null;

  // NEW
  phaseLabel: string;              // "Offseason" | "Non-Conference" | "Conference Play" | "Postseason"
  seasonNumber: number;            // 1-based; seasonIndex is 0-based and never shown raw
  season: SeasonLineView | null;   // the line the player is currently writing

  overall: number;
  standing: string;
  trust: string;
  status: Status;
  decision: PendingDecision | null;
  summary: CareerSummaryView | null;
}

export interface SeasonLineView {
  seasonNumber: number;       // 1-based
  schoolName: string;
  record: string | null;      // null until the resolver has assigned a real W-L
  snaps: number;              // accumulates live — effects.ts:36,41, simulate.ts:27
  stats: StatView[];          // position-aware labels, zero-valued stats omitted
  inProgress: boolean;        // true while this is the season being played
}

export interface StatView { label: string; value: number }
```

Also changed: `SeasonView.record` (the summary rows) went `string` → `string | null`, from the same
helper. See §4.

### `season` is "the most recent line", not "the live line"

Deliberate. The line is pushed only on entering an on-field phase (`advance.ts:273-277`), so during
an offseason the most recent line is the season that just **closed**, complete and with a real
record — and the offseason is exactly where DECISION 013 says orientation is wanted (Redshirt?,
Transfer Portal, Declare for the Draft are all offseason hub cards). `inProgress` disambiguates the
two readings without a second field. `season` is `null` only during recruiting, before any season
exists — a state to name, not a row of zeroes.

### Why `seasonRecord` is, in practice, always null

`recordOf` returns null when the line is still stamped with the live `seasonIndex`. Measured over 36
careers (6 positions × 6 seeds), `seasonRecord` was non-null at **0 of every observable state**.
That is not a bug in the helper — it is DECISION 014 restated as a measurement:
`runPostseasonResolver` assigns W-L and `advancePhase` rolls `seasonIndex` inside the same tick of
`autoProgress` (`advance.ts:305-306`), with no decision able to fire between them. There is no
moment a player can be looking at the screen while the current season has a record.

The field is kept rather than deleted because it is what `CareerScreen.tsx:17` reads, and because it
stays correct — rather than becoming a stale constant — if the engine ever does move the resolver.
Nothing estimates, projects, or substitutes a placeholder. The record is either real or absent.

---

## 2. Item 4 — the class badge flipping mid-card

**Confirmed, reproduced, measured, and the fix needs a screen change I did not make.**

**Cause.** `App.tsx:34` builds the view from `ui.state`, which is the **post-`advance`** state, while
`ui.resolved` holds the prose of the choice made in the **pre-`advance`** state. `advance()` does not
stop at the decision boundary: `autoProgress` runs on through `advancePhase`, and at a season
boundary through `enterOffseason`, which advances `classYear` (`advance.ts:221-225`). So the header
above a resolved card is showing the state the engine has *already moved into*.

**Measured** over 36 careers / 378 resolved cards:

| | |
|---|---|
| Resolved cards whose class year was not their own | 69 / 378 (18%) |
| Resolved cards whose phase was not their own | 270 / 378 (71%) |
| Resolved cards whose season number was not their own | 69 / 378 (18%) |
| Careers hitting it at least once | **36 / 36** |

The phase number is the striking one: on 7 of every 10 resolved cards the player is reading an
outcome under the wrong part of the season. The playtester noticed the class badge because FR→SO is
the legible one, but it is the smaller half of the problem.

**What I built (data half, in my lane).** `Resolved` gains `stamp: SeasonStamp | null`, taken from
the pre-`advance` state in `reducer.ts` before `advance()` is called:

```ts
export interface SeasonStamp {
  seasonNumber: number;
  classYear: ClassYear;
  phaseLabel: string;
  schoolName: string | null;
}
```

It carries **no progression values on purpose**. `overall`, the standing band and the trust phrase
are supposed to move on a resolved card — DECISION 012 wants the magnitude of a change visible, and
freezing them would hide the exact delta the card exists to report. Only the season's *identity* is
frozen. A test asserts the stamp's key set is exactly those four, so nobody adds `overall` to it
later without arguing with the test.

**What is left, and it is a screen change — NOT MADE.** `CareerScreen.tsx` still draws its rail from
`view`. The remaining work is in that component:

```tsx
// CareerScreen.tsx — the rail, when `resolved` is showing
const stamp = resolved?.stamp;
<span>{stamp?.classYear ?? view.classYear}</span>
<span className="rail-school">{(stamp ? stamp.schoolName : view.schoolName) ?? "Uncommitted"}</span>
```

`stamp` is nullable and must be treated as optional: a save written before this change restores with
`stamp: null` (`storage.ts` normalizes the missing property rather than discarding the career), and
hub decisions produce no resolved card at all. Falling back to `view` is correct in both cases.

**Recommended for the next brief**, together: freeze class year, school and phase on the resolved
card, and then *show* the phase label — which the rail does not render at all today.

---

## 3. Second finding — the header changes shape between cards

The playtester's other report ("record present, then absent") has the same root and is now
structural rather than accidental. `CareerScreen.tsx:17` renders the record inside
`{view.seasonRecord && ...}`, so the element appears and disappears and the rail reflows. Before this
change it was present all season as `0-0`; now it is absent all season. **This is a layout bug for
the CSS/screen lane, not a data bug** — the rail needs a fixed slot that reads as empty rather than a
node that vanishes. Flagging it because removing the lie makes the reflow *more* visible at the
season boundary, not less, and the styles lane owns the fix.

---

## 4. `SeasonView.record` became nullable too

Same helper, same reason. A career killed mid-season by a content `ending` effect leaves a line the
resolver never reached; the summary was rendering that row as `0-0`, which is the identical
falsehood one screen over. Every season that actually closed out still has its record, so the only
rows affected are ones that were previously lying.

`SummaryScreen.tsx:49` renders `{season.record}`, which type-checks and renders as an empty span for
null. **Follow-up for the screen lane:** that cell wants an em dash or an explicit "season
unfinished", not a hole. Not made here — it is a screen component.

---

## 5. Fields considered and rejected

| Field | Why rejected |
|---|---|
| `projectedRecord` / `recordSoFar` | Would need W-L to accrue in-season. That is DECISION 014's explicitly untaken engine change — it moves the RNG draw order and diverges every existing seed. Estimating one in the UI would be worse: a fabricated number the engine will later contradict. |
| `phaseAbs`, or any absolute phase counter | `FORBIDDEN_KEYS`. It is the deferred-effect clock, not player-facing. A test in `view-model.test.ts` now asserts specifically that the phase work in this brief did not reach for that name. |
| `tier`, `snapModifier` on the season line | Hidden-mechanics rule. `snapModifier` in particular would let a player read school quality straight off the snaps. |
| `isRedshirtSeason` on `SeasonLineView` | `redshirtSeasonActive` is *current* state, not per-line, so it would be wrong for any line that is not in progress. Correct per-season redshirt labelling (DECISION 010's `RS` row) needs the stored `classYear` that brief 006 is adding. Left for the ledger brief. |
| Anything valence-shaped — `isGood`, a signed delta flag, `trend` | DECISION 006/012. Magnitude may be rendered loudly; the branch may never be rendered at all, and a field named for valence invites exactly the hue mapping that is forbidden. |
| Reusing `SeasonLine.overall` / `.classYear` | Frozen-engine lane (brief 006) owned those; assumed absent per instructions. `SeasonView.classYear` is therefore still hard-coded `null`. **They have since landed** — the ledger brief can populate it. |

---

## 6. Verification

| | |
|---|---|
| `npm test` | **444 passed / 34 files** (430 baseline + 14 new) |
| `npm run typecheck` | both passes exit **0** |
| `npm run build` | clean, 82 modules, 507ms |
| Files changed | `src/ui/session/**` only — confirmed with `git diff --stat` |
| Screens / CSS / engine / content | untouched |

New tests, 14:

- **`view-model.test.ts` (+9)** — the boundary walk covers every new field; a live season asserts the
  engine's own line is literally `0-0` *and* that the view returns `null` for it; no observable state
  shows a record for the current season, across all six positions; a closed season does report a real
  record matching `\d+-\d+`; a career that never finished its season gets a null record; the live
  line carries snaps and non-zero stats; `season` is null before the first on-field phase; the stat
  line is position-aware (`INT Thrown` for QB vs `INT` for DSKILL, asserted unequal); all four phases
  are reachable, labelled, distinct, and never a raw id; and a dedicated `phaseAbs` re-assertion that
  also checks the new keys are actually present, so the walk cannot pass vacuously.
- **`reducer.test.ts` (+2)** — the stamp is taken pre-`advance` (asserts the flips are non-zero and
  that every position's career hits a class flip, so the test fails if the stamp is ever moved after
  `advance`); the stamp's key set is exactly the four identity fields and carries no progression.
- **`labels.test.ts` (+1)** — every phase has a distinct display name, never the raw id.
- **`storage.test.ts` (+1, 1 updated)** — a pre-stamp save restores with `stamp: null`, not
  `undefined`, and is not discarded.

No commits made. Work left in the working tree.
