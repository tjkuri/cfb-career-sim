# 020 — The ledger keeps its promise, and the header stops disagreeing with it

**Type:** developer · **Wave:** 8 · **Status:** done
**Brief:** `briefs/020-the-ledger-keeps-its-promise.md` · **Implements:** DECISION 033, and
DECISION 023's pre-committed remedy · **Evidence:** `reports/017-post-wave6-playtest.md`
claims 1, 2, 9, 10

## Verification

| | |
|---|---|
| `npm test` | **518 passed, 35 files.** Baseline was 501; I added 17 (11 in `ledger.test.ts`, 6 in `labels.test.ts`). No pre-existing test was deleted; one was inverted, deliberately — see task 2. |
| `npm run typecheck` | both passes exit **0** (`tsconfig.engine.json`, then `tsconfig.json`). |
| On screen | a **five-season redshirt career**, seeded into `localStorage` from a headless run, read in the browser through the whole of season 5's offseason — four consecutive decisions — and on into conference play. Header and highlighted row agree at every step. Screens described under each task. |
| Files touched | `src/ui/screens/CareerScreen.tsx`, `src/ui/styles/career.css`, `src/ui/session/ledger.ts`, `src/ui/session/labels.ts`, `ledger.test.ts`, `labels.test.ts`. **Nothing else.** No engine, no content, no `types.ts`, no `view-model.ts`, no `bands.ts`, no `SummaryScreen.tsx`, no `summary.css`, no `tokens.css`. |

### How the career was produced

The brief is right that you cannot click your way to this state. A throwaway script in the
scratchpad played `createCareer`/`advance` under a policy that takes `redshirt`, answers `return`
to every declare and `stay` to every transfer, and stopped the moment
`seasonIndex === 4 && phase === "offseason" && eligibility.redshirtUsed`. Seed `seed-0` with an OL
hits it on the first try. The stopped `GameState` was wrapped as
`{"schema":1,"state":…,"resolved":null}` — `storage.ts`'s `CurrentSave` shape — and written to
`cfb-career-sim:v1:current`.

The resulting save is the playtester's career almost exactly: FR/SO/JR/SR stored over four lines,
**year 2 is the redshirt** (31 snaps against 677/701/705), `classYear` stuck at `SR`,
`redshirtUsed: true`, and **no season line for index 4 yet** — which is the whole of the bug in
task 2.

---

## 1. The dashed fifth row stops promising what the UI cannot check

**Done. The caption is gone; the dashed rule is untouched.**

`ledgerDetail` in `CareerScreen.tsx` returned `"redshirt year"` for slot 5 whenever the row was
`future`. It now returns `""` for every future row, with no exception. `.ledger-row[data-tentative="yes"]`
in `career.css` is unchanged — same dashed top border, same open bottom edge, same `--chalk-faint`.

Confirmed on screen: in a season-2 career with the redshirt unspent, YEAR 5 hangs off the dashed
rule with nothing but its own label. The structural signal is doing exactly what the 017 playtester
read it as doing, and it is no longer accompanied by a sentence the save cannot support.

The comment block above `ledgerDetail` now records why the caption cannot simply be re-keyed: report
010's 40.6% / 426-of-427 measurement, and the fact that this is an absent field rather than a wiring
slip. **The engine proposal is at the end of this report.**

Two smaller things went with it, both in comments only: `career.css`'s ledger header no longer claims
"slot 5 says what buys it", and the `[data-tentative]` rule's comment no longer ends "the words on it
say what makes it happen."

## 2. The season-5 desync — the one place the player was lost

**Done, and the bug was larger than reported.**

`buildLedger` marked a row `current` only where a stored season line's index matched
`currentSeasonIndex`:

```ts
row.state = active && index === currentSeasonIndex ? "current" : "played";
```

That test lives inside the loop over stored lines, so a slot with no line could never be current.
`advance.ts:285` pushes a line only on entering an **on-field** phase, while `advancePhase`
increments `seasonIndex` on leaving the postseason — so through **the whole of every offseason** the
header reads `Season N` and no line for index N-1 exists, and **no row was marked current at all.**

So this was never a season-5 bug. It fired in every season of every career, for an entire phase each
time, and went unreported for four of them because slot N was blank chrome either way and nothing
was actively contradicting the header. In season 5 the unhighlighted row was *also* dashed and *also*
captioned `redshirt year`, so the rail stopped being merely silent and started asserting a different
year than the header. That is why claim 1 found it there and only there.

The fix keys the current row to `currentSeasonIndex` alone, after the played rows are written:

```ts
const liveIndex = finiteOrNull(currentSeasonIndex);
if (active && liveIndex !== null) {
  const row = rows[liveIndex];
  if (row) {
    row.state = "current";
    row.tentative = false;
  }
}
```

The header prints `currentSeasonIndex + 1` and this marks slot `currentSeasonIndex + 1`, from the
same number, with nothing between them that can disagree. `active` still gates it, so a career that
ended mid-season leaves a finished row and a terminal career has no current year. Setting
`tentative = false` on arrival is the second half of claim 1: reaching season 5 settles the question
the dash was asking, and it settles it in the offseason, not at kickoff.

**Two existing tests changed, and both changes are the point:**

- *"has no current row during an offseason, when the last season has closed out"* pinned the bug as
  intended behaviour. It is replaced by its inverse, with the reasoning in a comment above it.
- *"returns exactly five rows for a career that has not kicked off"* asserted all five rows were
  `future`. Signing Day is season 1's offseason and the header already reads `SEASON 1`, so Year 1
  is now current there too. That is correct and consistent: the rule has no special case for the
  first screen.

**The test the brief asked for** is `"highlights slot N while the header reads Season N, in all five
slots and every phase"` — five slots × four phases (via `knownPhases()`), with the presence or
absence of a season line derived from the phase, asserting exactly one current row, at slot `N`,
labelled `Year N`, never tentative.

It is backed by a second one that would have caught this from the screen rather than the desk:
`"names one season, at every decision, from the first to the last"` walks a **real engine career**
(a redshirt policy, searching seeds until one produces a five-season redshirt career) and asserts at
every single state that the ledger's current slot equals `buildView(state).seasonNumber` — the
number the header actually prints. It ends by asserting that the walk really did reach season 5 and
really did pass through its offseason, so it cannot pass vacuously.

**On screen:** four consecutive decisions in season 5's offseason — Declare, Transfer Portal, Fall
Camp Battle, Academic Probation — all reading `SEASON 5` with YEAR 5 lifted, inset-edged and
undashed. The exact three-decision window the playtester lost their place in.

## 3. Two rows labelled `SR`

**Done, in the display layer, with one rule shared by the header and the table.**

`enterOffseason` advances `classYear` through `CLASS_ORDER` and stops at `SR` (`advance.ts:228-229`),
so a fifth season genuinely stores `SR` twice. New pure function in `ledger.ts`:

```ts
export function classYearLabel(rows, slot, classYear): string
```

It returns `""` for a missing class year, the class year itself when no earlier slot carries the same
one, and `5th-Yr SR` when one does — the ordinal coming from `slot`, which is the same number the
primary `Year N` label is built from, so the two can never disagree.

**This is not the redshirt inference DECISION 020 withdrew, and it does not re-derive it.** It asks a
strictly smaller question — *has this class year already been used by an earlier year of this
career?* — answered by comparing two stored values. It never claims to know which season was sat out.
Year 2 (26 snaps in the fixture, 31 in the live save) is left completely alone, and there is a test
asserting that.

`CareerScreen` uses the one function in both places: `.rail-class` in the header and
`ledgerDetail` for each row. On screen, season 5 reads `SEASON 5  5TH-YR SR` in the header,
`SR North Texas` on YEAR 4, and `5th-Yr SR North Texas` on YEAR 5. Five distinct labels, which is
what DECISION 015 required and what was broken.

Worst case measured in the browser: `5th-Yr SR  Eastern Washington` (the longest school name in
`CONTENT`) in the 14rem ledger column is 194px in a 194px cell — not clipped. At 360px the header
line carrying `Eastern Washington` + `SEASON 5` + `5TH-YR SR` does not overflow and the school name
does not even reach its ellipsis.

## 4. Strip rows 2 and 3 still merge — 023's pre-specified fix

**Done. Row 2 demoted. No new grey, `tokens.css` untouched.**

Row 2 was `--t-meta` (12px) in `--chalk-dim`; row 3 is `--t-body` (13px) in `--chalk-faint`. One
pixel of size apart, and the colour step runs *the wrong way* — row 2, the less important line, is
the **brighter** grey. There was nothing there for the eye to grab.

Row 2 now takes `--t-micro` and the label register the strip already speaks one line above in
`.rail-when`: condensed, `--w-ui`, `--track-label`, upper case (DECISION 008). Nothing tonal changed;
`--chalk-faint` stays exactly where DECISION 022 put it.

This is deliberately not a new treatment. Row 2 holds chrome — who you are, where the season is,
what the team has done — and the strip already has a role for that, used by `.rail-when`,
`.ledger-year`, `.claim-where` and `.continue`. Row 3 is the only line here that changes as you play
and is now the only one set as running text. It also discharges 023's second clause (*"a structural
separator or a label, not a fourth grey"*) without spending a token on it: this **is** the label.

Reading top to bottom the strip is now three registers rather than two-and-a-bit:
`North Texas` (15px name) / `BRUMFIELD #7  OFFSEASON  4-8` (11px label row) /
`705 snaps  38 Pancakes  13 Sacks Allowed` (13px running text).

**Two rendering faults surfaced the moment this landed, and both are fixed:**

1. `.rail-record` inherited the new 0.16em tracking and printed `4-8` as **`4 - 8`** — the hyphen
   floating free reads as a range, not a record. `letter-spacing: normal` restores it, which is also
   what DECISION 008's own rule says: tracking is polarised, wide on small uppercase labels and
   negative on large numerals, *nothing in between tracked at all*.
2. `statLine` has always joined stats with three ASCII spaces and **HTML has always collapsed them
   to one** — so `38 Pancakes 13 Sacks Allowed` printed as one run-on string rather than the spaced
   columns this strip is documented to draw. (You can see it in the playtester's own transcript of
   claim 9: they wrote the row out with the wide gaps they expected and the screen was not giving
   them.) The separator is now two EN SPACES (` `), which are not collapsible whitespace. One
   constant, no markup change, ellipsis truncation preserved.

The second one is arguably beyond the letter of the brief, but the goal of task 4 is a stat line the
player will read, and a stat line whose columns have silently collapsed is half the reason there was
nothing to read.

## 5. `1 Game-Winners`

**Done, generally.** New in `labels.ts`:

```ts
export function countedStatLabel(label: string, count: number): string
```

Plural everywhere except at `Math.abs(count) === 1`. `CareerScreen`'s `statLine` calls it with the
value it is already formatting.

Three decisions worth recording:

- **Keyed to the label, not the stat key.** By the time a screen holds a `StatView` the key is gone,
  and going back for it means changing the view-model boundary shape — which I may not touch this
  wave and which is not worth changing for this. Labels are already unique per stat and already the
  thing being printed.
- **No `-s` rule, because none is safe over this vocabulary.** The head noun is the *last* word in
  `Game-Winners` and the *first* in `Sacks Allowed`, and a third of the table is abbreviations
  (`FG`, `TFL`, `PBU`, `INT`, `Rec`) that do not inflect at all. Singular forms are stated in a
  table; `Rec` is listed as explicitly uninflected so "no singular needed" is distinguishable from
  "somebody forgot".
- **The coverage test is the actual fix.** `labels.test.ts` walks every stat key of every position,
  takes its label, and fails if a label ending in `s` has no singular form. A stat added to the table
  without one fails a test rather than printing `1 Fumbles` at a player. Eight stats were affected,
  not one: Pass Yds, Scrimmage Yds, Pancakes, Sacks Allowed, Sacks, Tackles, Points, Game-Winners.

Confirmed on screen with a kicker career carrying `gameWinners: 1`: the header reads
`171 snaps  14 FG  59 Points  1 Game-Winner`.

## Responsive and accessibility check

At a simulated 360px (desktop grid disabled, frame pinned to 360px) none of the three rail lines
overflows, and no cell clips: player name 86px, phase 113px, record 44px on a 360px row. The ledger
detail cell does not clip in the worst case. `aria-current="step"` now actually lands on a row during
an offseason, which it previously did not for an entire phase per season — a screen-reader
regression nobody had filed. No hue was added anywhere, so DECISION 012 is untouched.

## Not fixed, and why

**`SummaryScreen.tsx` carries two of these same bugs and I may not touch it.** Exact diffs below for
the PM. Both are one line.

**Duplicate `SR` on the career summary's season table** (`SummaryScreen.tsx:235`) — claim 10.5 says
"in the header **and the ledger**", and the summary table is the third place it appears:

```diff
-                  <span className="season-year">{season.classYear ?? `Y${season.seasonIndex + 1}`}</span>
+                  <span className="season-year">
+                    {classYearLabel(ledgerRows, season.seasonIndex + 1, season.classYear) ||
+                      `Y${season.seasonIndex + 1}`}
+                  </span>
```

`classYearLabel` is exported from `session/ledger.ts` and takes anything with `{ slot, classYear }`,
so the summary can pass its own seasons mapped to that shape rather than a real ledger — or, simpler
and with no new plumbing, an inline equivalent:

```diff
+// `enterOffseason` stops classYear at SR, so a fifth season stores SR twice.
+// Same rule the career screen applies (report 020, task 3).
+const repeated = s.seasons.some(
+  (o) => o.seasonIndex < season.seasonIndex && o.classYear === season.classYear,
+);
```

**Plural labels on a count of one in the summary's season stats** (`SummaryScreen.tsx:246`). This
screen prints label-then-value (`Pancakes 27`) rather than value-then-label, so it reads less badly
than the header did, but `Game-Winners 1` is the same error:

```diff
-                            {st.label} <b>{st.value}</b>
+                            {countedStatLabel(st.label, st.value)} <b>{st.value}</b>
```

with `import { countedStatLabel } from "../session/labels";`. No other change; `countedStatLabel` is
already exported and already covered by tests.

---

## The `FG -1` cause — found, measured, and proposed (not fixed)

The brief said to identify it cheaply if I was already in the data. I was, and it is a one-line
missing floor.

**Not stat generation.** `simulate.ts:29-33` cannot produce a negative: every `per100` is positive,
`snaps >= 0`, `skill > 0`, `jitter ∈ [0.85, 1.15]`.

**It is `effects.ts:34-37`**, which applies an authored `stat` effect with no lower bound:

```ts
case "stat": {
  const s = currentSeason(state);
  if (s) s.stats[effect.stat] = (s.stats[effect.stat] ?? 0) + effect.amount;
  return;
}
```

Thirteen authored outcomes carry a negative `stat` effect. Two of them are
`{ kind: "stat", stat: "fieldGoals", amount: -1 }` (`content/events/k.ts:105` and `:223`).

**Why the redshirt season specifically.** `content/redshirt.ts` sets `sitSnapModifier: 0.05`, so a
redshirt season accrues single-digit snaps and every stat rounds to **0**. An event then fires with
`-1`, and `0 + (-1) = -1`. The playtester's `7 snaps · FG -1 · Points 3` is that arithmetic exactly.

**Measured** over 1,500 random-policy careers, all six positions, 250 seeds each:

| | |
|---|---|
| Careers with a negative stored stat | **6 of 1,500 (0.40%)** |
| Of those, careers that redshirted | **6 of 6 (100%)** |
| Rate among redshirt careers | 6 of 1,152 (**0.52%**) |
| Season rows affected | 6, every one a low-snap redshirt row (8–31 snaps) |
| Positions | K ×4 (`fieldGoals: -1`), DL ×2 (`sacks: -1`) |

Once stored it is permanent: the rail, the ledger and the career summary all read the same line.

**Proposed fix — engine, one line, `src/engine/effects.ts:36`:**

```diff
     case "stat": {
       const s = currentSeason(state);
-      if (s) s.stats[effect.stat] = (s.stats[effect.stat] ?? 0) + effect.amount;
+      // A counting stat has no negative value: you cannot kick minus one field
+      // goal. A negative `stat` effect is "you lost one of those", and against
+      // a season that has none it must floor at zero rather than go under.
+      // Measured live in 0.52% of redshirt careers, where `sitSnapModifier`
+      // (0.05) rounds every generated stat to 0 and an authored -1 lands on it.
+      if (s) s.stats[effect.stat] = Math.max(0, (s.stats[effect.stat] ?? 0) + effect.amount);
       return;
     }
```

Draws no RNG and reorders nothing, so seeded replay is unaffected — but it does change stored stat
values for the ~0.4% of seeds that hit it, so DECISION 009's condition 2 (`npm run play -- <seed>
random` byte-identical) will **not** hold for those seeds, and any balance fixture pinning a stat
total on one of them needs re-recording. A display-layer clamp was considered and rejected: the
value is wrong in the save, three screens read it, and two of them are not one agent's to fix.

---

## PROPOSAL — `SeasonLine` gains an explicit redshirt flag

**Status: proposal only. Nothing below is implemented.** `src/engine/**` is frozen and DECISION 029's
narrow B18/B19 lift does not cover it. This is DECISION 033's move (2).

### Why the field has to exist

The UI cannot answer "which season was the redshirt" and there is no cleverness left to try. Report
010 measured both candidate signals over 1,536 careers and 5,390 season rows:

- The **duplicate-`classYear`** gate is present in only **40.6%** of redshirt careers (427 of 1,051),
  because a career stores its duplicate `SR` only if it survives to a fifth season — and where it is
  present it points at the **wrong row 426 times out of 427**, because `enterOffseason` advances
  `classYear` on the redshirt boundary too, so the duplicate lands at the *end* of the career while
  the redshirt sits at season index 1 in 955 of 1,051 cases.
- The **snaps** signal separates cleanly (median 26 vs 461; at T=52, zero false negatives and 31
  false positives over 5,390 rows) and is still useless, because it identifies a row that is not the
  ambiguous one. DECISION 020 withdrew DECISION 015's "would change our mind" clause specifically to
  stop this being re-measured. It has not been re-measured here.

DECISION 020 named the one thing that would change its mind: *"an engine field recording the redshirt
season index."* That is this.

### What it unlocks

1. **The dashed row can make its promise and keep it.** Slot 5 could re-caption honestly, and — the
   thing the playtester actually wanted — **the redshirted row could say so**, the moment the
   redshirt is taken, in the year it was taken. Claim 1's real complaint is not that the caption was
   wrong; it is that *"nothing anywhere in the game records that I sat that year"* after the single
   biggest swing in the game.
2. **The `-10 OVR` / `+10 OVR` swing gets a place to live** on the career arc, instead of an
   unexplained jump between two ledger numbers.
3. **A 26-snap row stops looking like a bad season.** It currently renders "indistinguishable from a
   played season" (claim 1), which reads as failure rather than as a choice that paid.
4. The `FG -1` bug above becomes explicable to a player even before it is fixed.

### The change

Same shape as DECISION 009, which put `overall` and `classYear` on this exact type: one additive
boolean, written at a site that already exists, from a value the engine has already computed.

**`src/engine/types.ts:24-39`**

```diff
 export interface SeasonLine {
   seasonIndex: number;
   schoolId: string;
   snaps: number;
   stats: Record<string, number>;
   teamWins: number;
   teamLosses: number;
   // Recorded, never recomputed. `overall` is the OVR the line is finalized at:
   // written at kickoff so a truncated career still has a number, then rewritten
   // once at the season boundary with the end-of-season value, before offseason
   // development (which belongs to the next line). `classYear` is the year the
   // season was PLAYED AS -- written once at creation, never on the boundary
   // where enterOffseason advances eligibility into the next year.
   overall: number;
   classYear: ClassYear;
+  // True when this season was sat out under a redshirt. Recorded, never
+  // inferred: it is read off `redshirtSeasonActive`, which `applyChoice` sets
+  // at the moment the player takes the redshirt (advance.ts:145) and
+  // `enterOffseason` clears on the next boundary (advance.ts:197). That window
+  // is the only place in the program where the fact is known -- `eligibility
+  // .redshirtUsed` says a redshirt was taken but not WHEN, and both derivations
+  // from stored data were measured and rejected (report 010; DECISIONS 015,
+  // 020, 033).
+  //
+  // Optional, because `localStorage` holds GameStates serialized before this
+  // field existed. `undefined` means "this save does not know", which is not
+  // the same as `false`, and a consumer must render the absence rather than
+  // assert the season was played.
+  redshirt?: boolean;
 }
```

**`src/engine/advance.ts:285`** — the one write, at the existing push site:

```diff
-          s.seasons.push({ seasonIndex: s.seasonIndex, schoolId: s.school.schoolId, snaps: 0, stats: {}, teamWins: 0, teamLosses: 0, overall: s.overall, classYear: s.eligibility.classYear });
+          s.seasons.push({ seasonIndex: s.seasonIndex, schoolId: s.school.schoolId, snaps: 0, stats: {}, teamWins: 0, teamLosses: 0, overall: s.overall, classYear: s.eligibility.classYear, redshirt: s.redshirtSeasonActive });
```

This is the correct boundary and the only one. The line is pushed on entering the first on-field
phase of the season; `redshirtSeasonActive` was set by `applyChoice` during the offseason decision
that precedes it and is cleared by `enterOffseason` at the *next* boundary, so at the instant of the
push it is true for exactly the season being sat out. `classYear` is already read at this same site
for the same reason, and its comment already says so.

Nothing else changes. No new export, no second write site, no rewrite of the line later.

### Conditions the implementing agent should be held to (DECISION 009's, restated)

1. **Additive only.** The public API stays at five exports. The value written is one the engine has
   already computed; nothing is recalculated, reordered, or re-rolled.
2. **No balance effect, and this is the test of it:** `npm run play -- <seed> random` prints JSON
   that does not include `seasons[].redshirt`, so it must be **byte-identical** before and after on
   at least three seeds. Paste the empty diff. If any seed moves, stop — the change was not additive.
   (Unlike the `FG -1` fix above, this one genuinely should pass: it writes a new key and touches no
   existing value.)
3. **Old saves must not crash.** The field is optional and `undefined` on every save written before
   it. A row whose flag is absent renders as it does today — never as `false`, never as `"played"`
   asserted, never as `NaN`.
4. **Both typecheck passes exit 0 and the suite stays green.** Engine tests asserting `SeasonLine`'s
   shape get updated deliberately, not deleted.

### What the UI would then do with it — and what it must still not do

`ledger.ts` would gain one field on `LedgerSeason`/`LedgerRow`, plumbed through `seasonViews` the way
`overall` and `classYear` already are. `classYearLabel` **stays as it is**: a fifth-year senior is a
fifth-year senior whether or not the fifth year came from a redshirt, and that label is derived from
sequence, not from this flag.

What would change is that slot 5's caption could return, and that the sat-out row could carry a mark
of its own. Both are copy-and-treatment calls rather than plumbing, and both should be a brief with a
playtest question attached — the 017 playtester's own reading of the dashed rule was good enough
unassisted that adding words back to it is not obviously an improvement.

### If the user declines

The dashed row stays permanently uncaptioned, which is what shipped in this wave and which DECISION
033 already calls honest. Nothing in tasks 1–5 depends on this field; everything above is live and
green without it. The cost of declining is that a `+10 OVR` redshirt remains the one decision in the
game that leaves no trace anywhere the player can see.
