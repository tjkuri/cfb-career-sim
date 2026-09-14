# 006 — `SeasonLine` gains `overall` and `classYear`

**Status:** done · **Authorization:** DECISION 009 · **Date:** 2026-09-13

Additive engine change only. No RNG touched, no draw reordered, no public API change
(`src/engine/index.ts` is byte-unchanged and still has five `export` lines). `src/content/**` and
`src/ui/**` untouched. Nothing committed.

## 1. The diff (source)

Three source files. A fourth write site the brief did not name — `recruiting.ts` — was found and is
covered; `create-career.ts` needed no change, as the brief predicted (it pushes no line, it starts
`seasons: []`).

```diff
diff --git a/src/engine/types.ts b/src/engine/types.ts
@@ -28,6 +28,14 @@ export interface SeasonLine {
   stats: Record<string, number>;
   teamWins: number;
   teamLosses: number;
+  // Recorded, never recomputed. `overall` is the OVR the line is finalized at:
+  // written at kickoff so a truncated career still has a number, then rewritten
+  // once at the season boundary with the end-of-season value, before offseason
+  // development (which belongs to the next line). `classYear` is the year the
+  // season was PLAYED AS -- written once at creation, never on the boundary
+  // where enterOffseason advances eligibility into the next year.
+  overall: number;
+  classYear: ClassYear;
 }

diff --git a/src/engine/recruiting.ts b/src/engine/recruiting.ts
@@ -50,6 +50,8 @@ function newSeasonLine(state: GameState): SeasonLine {
     stats: {},
     teamWins: 0,
     teamLosses: 0,
+    overall: state.overall,
+    classYear: state.eligibility.classYear,
   };
 }

diff --git a/src/engine/advance.ts b/src/engine/advance.ts
@@ -199,6 +199,12 @@ export function enterOffseason(...)
   const lastSeason = s.seasons[s.seasons.length - 1];
   if (lastSeason) {
+    // Finalize the completed line's OVR *before* development is applied: the
+    // development points come from last season's snaps but are earned for the
+    // next season, so they belong to the next line. classYear is deliberately
+    // not touched here -- it was recorded at kickoff, and CLASS_ORDER advances
+    // a few lines below.
+    lastSeason.overall = s.overall;
     s.overall = clampOverall(
       s.overall + developmentDelta(lastSeason.snaps, content.progression, s.setup.position),
     );
@@ -273,7 +279,10 @@ function autoProgress(...)
         if (!last || last.seasonIndex !== s.seasonIndex) {
-          s.seasons.push({ seasonIndex: ..., teamLosses: 0 });
+          // classYear is the year this season is PLAYED AS: enterOffseason has
+          // already advanced eligibility into it before kickoff, so the value
+          // read here is the correct one and must not be rewritten later.
+          s.seasons.push({ ...same..., overall: s.overall, classYear: s.eligibility.classYear });
         }
```

### Why these three write points, and not others

- **`classYear` is written exactly once, at line creation.** By the time a season's first on-field
  phase runs, `enterOffseason` has *already* advanced `s.eligibility.classYear` into the year this
  season will be played as. Reading it at kickoff is therefore the year *played as*. It is never
  rewritten — in particular not in `enterOffseason`, which is the boundary where `CLASS_ORDER`
  advances. That is the off-by-one the brief warned about, and the ordering is asserted by a new test
  (§4) as well as demonstrated empirically (§3).
- **`overall` is written twice on purpose.** At kickoff (so the field is *never* `undefined`, even for
  a career that ends mid-season), then finalized once at the season boundary with the end-of-season
  value — taken **before** the offseason development bump, because those development points are earned
  from last season's snaps but are *spent* in the next season and belong to the next row. Recording it
  before the development line also means a soft-washout career, whose `enterOffseason` returns early a
  few lines later, still gets its final row finalized.

## 2. Three-seed byte-identical proof (the condition that matters)

Captured before the edit, re-captured after, same seeds, same command.

```
npm run play -- 12345 random
npm run play -- 777 random
npm run play -- 20260913 random
```

**`diff before after` — all three empty:**

```
--- seed 12345
(identical)
--- seed 777
(identical)
--- seed 20260913
(identical)
```

The CLI summary does not serialize `seasons`, so that diff proves determinism but cannot show the new
fields. A second, stronger capture was taken: the **entire final `GameState`** (including `rngCursor`)
for the same three seeds, via the same `playCareer` entry point. Those diffs contain the two new
fields **and nothing else** — every stat, outcome, award, draft result, moment, and the RNG cursor are
byte-identical:

```
--- seed 12345
44c44,46
<       "teamLosses": 4
---
>       "teamLosses": 4,
>       "overall": 55,
>       "classYear": "FR"
56c58,60
<       "teamLosses": 7
---
>       "teamLosses": 7,
>       "overall": 55,
>       "classYear": "SO"
68c72,74
<       "teamLosses": 5
---
>       "teamLosses": 5,
>       "overall": 71,
>       "classYear": "JR"
80c86,88
<       "teamLosses": 5
---
>       "teamLosses": 5,
>       "overall": 75,
>       "classYear": "SR"

--- seed 777
44c44,46
<       "teamLosses": 7
---
>       "teamLosses": 7,
>       "overall": 66,
>       "classYear": "FR"
56c58,60
<       "teamLosses": 5
---
>       "teamLosses": 5,
>       "overall": 67,
>       "classYear": "SO"
68c72,74
<       "teamLosses": 4
---
>       "teamLosses": 4,
>       "overall": 68,
>       "classYear": "JR"

--- seed 20260913
42c42,44
<       "teamLosses": 3
---
>       "teamLosses": 3,
>       "overall": 61,
>       "classYear": "FR"
54c56,58
<       "teamLosses": 8
---
>       "teamLosses": 8,
>       "overall": 66,
>       "classYear": "SO"
66c70,72
<       "teamLosses": 5
---
>       "teamLosses": 5,
>       "overall": 73,
>       "classYear": "JR"
```

No line in any diff is a removal of, or a change to, an existing value. Nothing re-rolled.

## 3. How the class-year ordering was confirmed

Three independent checks.

**(a) Every season 0 is `FR`.** If the year *advanced into* had been recorded, every career's first
row would read `SO`. Across 800 random careers, no row was wrong and none was missing a field:

```
{ careers: 800, badLines: 0, redshirtCareers: 626, statuses: { drafted: 794, busted: 6 } }
```

(`badLines` counts any line with a non-numeric/NaN `overall` or a falsy `classYear` — including the
6 busted careers, which end mid-career and are the case a kickoff-only write would have left
`undefined`.)

**(b) A redshirt career labels the rows the engine actually played.** Sample:

```
redshirt career scan-2: status=drafted finalOVR=74 yearsUsed=4 finalClass=SR
   season 0: classYear=FR overall=64 snaps=555
   season 1: classYear=SO overall=74 snaps=28     <- the redshirt year (collapsed snaps)
   season 2: classYear=JR overall=77 snaps=144
   season 3: classYear=SR overall=73 snaps=330
```

Note `season 3: overall=73` against `finalOVR=74`: the row holds the end-of-SR-season value and the
`+1` development bump (floor(330/180)) landed *after* the row was finalized. That is the intended
split, visible in the data.

**(c) A full five-season redshirt career** (the DECISION 010 case):

```
f5-2 redshirtUsed=true status=drafted
   season 0: classYear=FR overall=58 snaps=309
   season 1: classYear=SO overall=62 snaps=194
   season 2: classYear=JR overall=67 snaps=23      <- the redshirt year
   season 3: classYear=SR overall=56 snaps=315
   season 4: classYear=SR overall=61 snaps=358
```

Season-count histogram over 3000 random careers: `{1:14, 2:1131, 3:904, 4:567, 5:384}` — the
five-row ledger is common, so this case matters.

## 4. Tests

**All green.** The total moved during the task because the concurrent `src/ui/session/**` agent was
adding tests to the same tree: 429/430 at first run (the one failure its own in-flight
`storage.test.ts`), 433/433 after this task's fixture updates and new test, **444/444 on the final
run**. No run ever had a failing engine test after the fixtures were updated, and the count rose only
from tests being added — never from one being deleted or weakened.

**Updated deliberately (fixtures only, no assertion changed):** every hand-built `SeasonLine` literal
in the suite now supplies the two required fields, because `SeasonLine` is no longer satisfiable
without them and `tsc` said so. Files: `advance.test.ts` (5 sites), `postseason.test.ts` (5),
`simulate.test.ts` (2), `effects.test.ts`, `transfer.test.ts`, `school-effects.test.ts`,
`sim/trait-probe.test.ts`. Where a `GameState` was in scope the fixtures use
`overall: s.overall, classYear: s.eligibility.classYear` rather than literals, so they stay honest;
`trait-probe.test.ts`'s helper uses fixed values with a comment, matching the comment already there
("build whole ones so this test keeps compiling honestly if SeasonLine grows"). **No test was deleted
and no assertion was relaxed.**

**Added (1):** `advance.test.ts` — *"finalizes the completed line with the class year it was PLAYED
AS, not the one advanced into"*. It pins the exact boundary the brief flagged as untestable today:
after `enterOffseason`, `s.eligibility.classYear` is `JR` while `s.seasons[0].classYear` is still
`SO`, and `s.seasons[0].overall` is the pre-development end-of-season value. Without it, reversing
the ordering of these two writes is a silent one-year shift of every ledger row that no other test in
the suite would fail on. Flagged here because adding a test was not in the brief.

## 5. Old saves

**They load, they continue, and nothing crashes.**

`src/ui/session/storage.ts` (read only — not edited) gates a save on `saved.schema !== SCHEMA` and
`!saved.state` alone. It does no structural validation of `GameState`, so a save whose `SeasonLine`s
lack both fields is **not discarded**; it is returned as-is.

Verified empirically rather than by inspection: 60 careers were played two seasons deep, serialized
through `JSON.parse(JSON.stringify(...))` exactly as `localStorage` does, had `overall` and
`classYear` **deleted** from every season line to imitate a pre-change save, and were then played to
completion through the real `advance`:

```
continued old save -> status: drafted seasons: 4
   season 0: classYear=undefined overall=undefined snaps=574
   season 1: classYear=undefined overall=63 snaps=27
   season 2: classYear="JR" overall=71 snaps=657
   season 3: classYear="SR" overall=81 snaps=541
{ oldSavesContinued: 60, crashed: 0 }
```

Precisely what the ledger view-model must tolerate, from that output:

- Rows for seasons **already complete** when the save was written keep `overall: undefined` and
  `classYear: undefined` forever. Nothing rewrites them.
- The row **in progress** at save time gets its `overall` back-filled at its next season boundary,
  but its `classYear` stays `undefined` — `classYear` is only ever written at line creation, which
  already happened.
- Every row created after the upgrade is complete.

**Finding for the ledger brief (not fixed here, no UI touched):** the view-model must render a
missing `overall` as a null/blank cell rather than `NaN` or `"undefined"` — DECISION 009 condition 3
already requires this — and must do the same for a missing `classYear`, which condition 3 does not
mention. A pre-change save mid-career will show one or two blank class-year labels above correct
ones.

## 6. Second finding for the ledger brief: `RS` is still not derivable

DECISION 010 wants the redshirt row labelled `RS`. Stored `classYear` is faithful to engine state but
**does not identify that row**. A redshirted career's stored years run `FR, SO, JR, SR, SR` — the
duplicate is always at the *end* (CLASS_ORDER clamping at `SR`), never at the redshirt year, which in
sample (c) above is the `JR` row. The only in-`SeasonLine` signal for the redshirt season is its
collapsed `snaps` (23 against 194–358 for played seasons), which is a heuristic, not a fact:
`redshirtSeasonActive` is per-state and is reset every offseason, so it is recorded nowhere per
season.

This is raised, not acted on: it would be a **second** engine field, and DECISION 009 authorized
exactly one change. If the ledger needs a hard `RS` label rather than a snaps heuristic, that is a
new decision.

## 7. Other checks

- `npm run typecheck` — **both passes exit 0.** Pass 1 (`tsconfig.engine.json`, pinned to
  `src/engine/**` + `src/content/**`, tests excluded) was clean from the first run; every error the
  change produced was in pass 2's test fixtures, now fixed.
- `npm run build` — clean. `✓ 82 modules transformed`, built in 530ms.
- `src/engine/index.ts` — unchanged, five exports.
- Nothing committed; no `git commit` / `checkout` / `restore` / `stash` was run. `npm run dev` was
  never started.

**Note on the concurrent agent:** mid-task, `npm run typecheck` and `npm test` transiently reported
failures in `src/ui/session/labels.ts` and `src/ui/session/storage.test.ts` (missing `SeasonPhase`
export; a `stamp` field on `Resolved`). Those were the concurrent `src/ui/session/**` agent's
in-flight edits, unrelated to `SeasonLine`, and they resolved themselves as that agent landed its
work. The final runs above are all green.
