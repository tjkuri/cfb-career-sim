# 048 — B64–B67: the season ledger disagrees with the season the player played

**Status: `needs-decision`.** Three of the four symptoms were reproduced and fixed in
`src/ui/**`. The fourth — the literal `0 snaps / 2 Sacks Allowed` on the senior ledger
row — was reproduced and traced to one line in `src/engine/effects.ts`, which is frozen.
Proposal in §5. `src/engine/**` and `src/content/**` are untouched.

**Do B64–B67 share a single cause? No — there are three, and the brief's hypothesis was
half right.** B64 and B65 are one bug, and it is exactly the shape the brief predicted
("a `0` where a `null` was meant"), one layer up: the rail prints one season's *number*
over another season's *figures*. B66 is a separate one-line bug in `remainderFacts`.
B67 is a separate hole in the moments grouping. And the *headline* half of B64 — a
ledger row that genuinely stores `0 snaps` next to a real stat line — is a fourth cause
and the only one in the engine.

**Tests: 700 → 708.** All green, both typechecks clean, build clean, four seeds
byte-identical against a recomputed HEAD.

---

## 1. Phase 1 — what the source says, before any repro

Structural facts, read out of the frozen engine:

* `advance.ts:143-153 advancePhase` increments `seasonIndex` on **leaving the
  postseason**. `advance.ts:317-328` pushes the season **line** only on **entering the
  first ON-FIELD phase**. So through the whole of every offseason,
  `state.seasonIndex === N` while `state.seasons[last].seasonIndex === N-1`.
* `effects.ts:13-15 currentSeason()` is `seasons[seasons.length - 1]` — the last line,
  not the line for `state.seasonIndex`.
* `simulate.ts:20` is guarded by `ON_FIELD.has(state.phase)`, so production cannot
  reach a closed line.

## 2. The mechanism behind B64 and B65 — reproduced

`npx tsx tmp-rail-trace.ts probe-0 OL` (random policy, seed `probe-0`, OL; source in §7).
Screens 8–11 verbatim:

```
screen  8 | RAIL: Season 1 FR Postseason | rec=     snaps=369 stats=19 Pancakes,6 Sacks Allowed | line is Season 1
screen  9 | RAIL: Season 2 SO Offseason  | rec=7-5  snaps=369 stats=19 Pancakes,6 Sacks Allowed | line is Season 1
screen 10 | RAIL: Season 2 SO Offseason  | rec=7-5  snaps=369 stats=19 Pancakes,6 Sacks Allowed | line is Season 1
screen 11 | RAIL: Season 2 SO Non-Conf   | rec=     snaps=11  stats=1 Pancakes                  | line is Season 2
```

`railView`'s heading is `seasonNumber` (`state.seasonIndex + 1`); its record, snaps and
stat line are `currentSeasonLine()` = `seasons[last]`. **For every offseason screen of
every career those name different seasons.**

Measured — `npx tsx tmp-b64-probe.ts 60`, 60 seeds × 6 positions = 360 careers:
**3,985 mismatched screens, ≈11 per career.** Not an edge case; it is every offseason.

It reads as two different defects depending on how the player joins the two halves:

* **B64**, read downward — season N's heading over season N-1's figures. On the trace
  above, screen 14 reads `Season 3 JR Offseason — 5-7 — 33 snaps — 3 Pancakes`; the
  33 snaps and the 5-7 are **season 2's**, a redshirt year. A redshirt or injury-wrecked
  line landing under the next season's name *is* "a season I just played, decision by
  decision, reporting almost no snaps".
* **B65**, read across the boundary — at the first on-field phase the real line arrives
  under the **same** heading, so `369 snaps / 19 Pancakes` becomes `11 snaps /
  1 Pancakes` and the `7-5` disappears. A season the player believes is finished appears
  to *lose* snaps and stats. That is "47 Pancakes → 46, snaps 308 → 300, for a season
  already over".

### The closed-line-mutation hypothesis is REFUTED — recorded so nobody reopens it

`effects.ts:13` `currentSeason()` *does* target `seasons[last]`, which in an offseason is
the closed season. It cannot fire, for two independent reasons:
`content/schema.ts:326` rejects `stat` and `snaps` effects on any `offseason` event at
validation time, and `select-event.ts:12` matches `ev.phase === state.phase` exactly.
The probe snapshotted every closed line after every decision across 360 careers:
**0 closed-line mutations.** Nothing in the engine rewrites a season after it closes.

### Fix

`railView` now returns `seasonLabel` — the name of the season its figures belong to, and
**null whenever that is the season the heading already names** (every on-field screen).
`CareerScreen` draws it as the leading label of the rail's stats row, inside the existing
fixed slot, so the strip does not reflow and no new row, size or colour is introduced.

The figures were deliberately **not** removed: the offseason is where the redshirt and
transfer cards are read, and the season just completed is the evidence those decisions
are made on (DECISION 013, and `currentSeasonLine`'s own contract). What was missing was
the one fact that makes them legible — which season they are.

Verified in the browser (§6):
`Ohio | SEASON 5 5TH-YR SR` / `RAIL #7 OFFSEASON 9-3` / `SEASON 4  404 snaps  1,260 Pass Yds …`,
with the ledger's Year 4 row reading `SR 9-3 404 snaps 85` beside it. One click later, at
`SEASON 5 CONFERENCE PLAY`, the label is absent and the figures are Season 5's own.

Tests: `view-model.test.ts` → *"the rail says which season its figures belong to (B64, B65)"*,
two cases. The positive and negative populations are both asserted non-empty, so the test
cannot pass vacuously.

## 3. B66 — "You got hurt between decisions" when nobody got hurt

**Reproduced, fixed.** Seed `p-114`, QB, screen 20 (and again at screen 39); also
`p-43` OSKILL screen 20, `p-185` K screen 16. Event `speeding-georgia`, option
`cooperate`. Rendered line, verbatim and identical to the playtest quote:

> An injury healed and gave the points back. You got hurt between decisions.

The first clause is true (a real injury healed and returned its points). **The second is
false.** `remainderFacts.hurt` diffed the whole of `state.injuries`, and
`applyEffect`'s `suspension` case pushes into that same list. So a card whose own outcome
*suspended* the player was reported as an injury that arrived from somewhere else — with
no injury, and on a card that had just said in prose what actually happened.

`healed` has excluded suspensions from the start, via `restoreAmount > 0`, and for the
right reason: a suspension moves no `overall`, so it is not part of the number the
sentence exists to explain. **`hurt` was simply missing that rule's mirror.** Fixed by
diffing only `kind === "injury"`. `cardAccount` is unaffected — a suspension was never in
`own` either.

Rate: over 1,200 careers, 6,561 remainder lines were rendered and **6 carried the false
clause**. Rare under a random policy; the playtester hit it twice in three careers, which
is consistent — `speeding-georgia/cooperate` is a plausible human pick and a random walk
takes it a sixth as often.

Tests: *"remainderFacts and suspensions (B66)"*, three cases (a suspension arriving is not
a knock; a real injury arriving beside a suspension still is; a suspension cannot mask a
heal).

### The other source of that sentence is NOT a bug — flagged, not touched

108 of 360 careers show `hurt` with no card behind it, from
`school-effects.ts rollAmbientInjury` — the `wideOpen` trait's designed cost, which fires
between decisions by construction. The sentence is literally true there and is the only
surfacing that cost gets. Naming the trait is forbidden (traits are discovered by
replaying), so nothing was changed. If the PM wants the ambient injury to announce itself,
that is a content/engine question, not this task.

## 4. B67 — the moments timeline skipped seasons

**Reproduced, fixed.** `groupMoments` walked the **moments** and opened a group whenever
the season index changed, so a season in which no `moment` effect fired produced no group
at all: the timeline printed `Season 1 / Season 2 / Season 4` with nothing to say whether
season 3 was quiet or lost.

Measured over 360 careers: **172 have at least one played season with no moment.** The
hole is the common case. The probe also checked the two ways it could have been worse and
found neither — 0 moments recorded out of season order, 0 moments filed against a season
with no line — so the data was fine and the grouping was the bug, exactly as the brief
suspected.

Fix: `groupMoments` moved out of `SummaryScreen.tsx` into `view-model.ts` (so it is
testable — there is no screen-test harness in this project) and now walks the **seasons**.
Every played season gets a row; a quiet one renders
*"A year with nothing to put on this list."* A moment whose season has no line is still
printed, in its own group, rather than dropped. The `MOMENTS` section is now gated on
`s.moments.length > 0` rather than on the group count, so a career that earned nothing
does not open a heading over four rows saying so.

Confirmed on the playtester's own saved career in the browser (seed `94qt5y`): Season 3
now reads `SEASON 3 · JR · A year with nothing to put on this list.` where before it was
simply absent between Season 2 and Season 4.

Tests: *"groupMoments (B67)"*, three cases.

## 5. The engine bug — reproduced, NOT fixed, needs a decision

**The playtester's exact row is on screen in the running app.** Seed `94qt5y`, Doyle #7,
Offensive line, San Diego State — the summary's seasons block:

```
SR   San Diego State   9-3   0 snaps   Sacks Allowed 2      87   +15
ACROSS 4 SEASONS   63 → 87   +24                   FINAL OVERALL 83
```

That is B64's headline verbatim: *"9-3, 0 snaps, 87 overall, +15"*, the header's
*"0 snaps — 2 Sacks Allowed"*, and *"the career's final overall was 83 while that row
said 87"*. The ledger is **not** wrong here — it is printing exactly what the engine
stored.

Reproduced independently at **seed `z-206`, OL, season 2** (`npx tsx tmp-zero-probe.ts`):
`class JR, redshirt=false, rec=5-7, snaps=0, stats={"sacksAllowed":2}`. Rate: **4 of
11,344 season rows** (0.035%) under a random policy; the authored options that carry the
negative snap effects make it markedly more likely in human play.

**Mechanism.** `effects.ts:61`

```ts
if (s) s.snaps = Math.max(0, s.snaps + effect.amount);
```

Authored negative snap effects exist at −8, −15 and −20. On a season where the player was
sidelined for most of the year, one on-field phase can produce, say, 18 snaps and 2 sacks
allowed, and a later −20 then floors the snaps to exactly 0 while the stats it produced
stay on the line. The season line ends up asserting two contradictory things about the
same year, and every consumer downstream inherits it: the ledger row prints `0 snaps`
beside a stat line, `seasonOverallDelta` reads the 0 and charges the upperclass decline
(which is the −4 behind `87 → 83`, and the *"A season on the sideline cost you ground"*
verdict on a season that was played), and `productionScore` loses the snaps from draft
stock.

**Proposal — one line, `src/engine/effects.ts:61`.** Give the clamp a floor of 1 whenever
the line has recorded production, so a debit can never claim the player took no snap in a
season that produced a stat:

```ts
const floor = Object.values(s.stats).some((v) => v > 0) ? 1 : 0;
if (s) s.snaps = Math.max(floor, s.snaps + effect.amount);
```

This changes at most **+1 snap on 0.035% of season rows**. `deriveDraftStock`'s production
term is `min(15, totalSnaps / 200)`, so one snap is 0.005 draft stock — below the
resolution of every balance number on the board. It is still an engine write, so it will
diverge the seeded output of the careers it touches, which is why it is a proposal and not
an edit. The alternative — leave it and accept that a played season can store `0 snaps` —
is defensible too, but it is the defect the playtester actually reported, twice, in the
career above.

**A second, smaller thing for the same decision, not fixed here.** Nothing on the ledger
ever shows the boundary decline. `enterOffseason` stamps the row's `overall` and *then*
subtracts, so on a career that ends at that boundary the −4 exists only as the gap between
the last row (87) and `FINAL OVERALL` (83). The column head already says
*"Ovr before the offseason"*, which is the current mitigation. Related: the row's `+15` and
the card's `−4` are both honest but measure different windows — the ledger delta is
season-over-season and includes the card effects and the *previous* offseason's
development; the −4 is the boundary alone. They are not contradictory, but they read as
contradictory, and the screen does not currently say so anywhere.

## 6. Verification — all of it

| Check | Result |
|---|---|
| `npm test` | **708 passed**, 40 files (700 baseline + 8 new) |
| `npm run typecheck` | both passes exit 0 (`tsconfig.engine.json`, `tsconfig.json`) |
| `npm run build` | clean, 83 modules, 555 ms |
| `npm run play -- <seed> random`, 4 seeds | **byte-identical to a recomputed HEAD** |
| `git status --short` under `src/engine/**`, `src/content/**` | **no change** |
| Click-through at `localhost:5173` | done, full season close + ledger row + moments |

Seed diff was recomputed on both sides, not transcribed: a detached worktree at
`HEAD` (39e7cb7) with `node_modules` symlinked, run there, `diff`ed, worktree removed.

```
IDENTICAL  b64-seed-alpha  (sha256 820ce2a9521279d5…)
IDENTICAL  b64-seed-beta   (sha256 9bd17a995605d13b…)
IDENTICAL  probe-0         (sha256 cd77d8f865146fca…)
IDENTICAL  z-206           (sha256 13796fab655af948…)
```

Browser pass (dev server was already running; `npm run dev` was never invoked): loaded the
existing save (seed `94qt5y`) and confirmed the B67 placeholder and the engine row above;
started a fresh OL career, played it to the season-5 offseason and confirmed the rail
label present at the boundary and absent in-season, with the ledger row filling in as the
season closed. No console errors or React warnings. Tab closed afterwards.

### Files changed (all `src/ui/**`)

* `src/ui/session/view-model.ts` — `seasonLabel` on the rail; `hurt` restricted to
  injuries; `groupMoments` moved in and rewritten to walk seasons.
* `src/ui/session/types.ts` — `RailView.seasonLabel`, `MomentGroup`.
* `src/ui/session/view-model.test.ts` — 8 new tests.
* `src/ui/screens/CareerScreen.tsx` — draws the rail label.
* `src/ui/screens/SummaryScreen.tsx` — imports `groupMoments`; quiet-season row; section
  gated on moments rather than groups.
* `src/ui/styles/career.css` — `.rail-season-of`.
* `src/ui/styles/summary.css` — `.moment-quiet`.

No screen was given access to `GameState`; the boundary is intact and
`view-model.test.ts`'s leak assertion still covers it.

## 7. Reproductions, for the next session

Seeds worth keeping:

| Seed | Position | What it shows |
|---|---|---|
| `probe-0` | OL | the rail off-by-one at four season boundaries, incl. a redshirt year |
| `p-114` | QB | the false *"You got hurt between decisions"* at screens 20 and 39 |
| `z-206` | OL | a played JR season stored as `0 snaps` with `sacksAllowed: 2` |
| `94qt5y` | OL | **the playtester's own career** — B64's senior row, live in the app |

All four probes were run from `src/sim/` and then moved to the session scratchpad so the
repo stays clean. The two that matter are tiny and worth recreating if needed:

**`tmp-rail-trace.ts`** — drives the real reducer path (`seasonStamp` → `advance` →
`buildView` → `railView` → `followHeader`) one decision at a time and prints, per screen,
the rail's season number, phase, record, snaps and stat line, the season number of the
*line* it is drawing, the engine's live `seasonIndex`/`phase`, and every ledger row.

**`tmp-b64-probe.ts`** — the same walk over N seeds × 6 positions, asserting: closed lines
never mutate; no line carries `snaps === 0` with non-empty stats; `rail.season.seasonNumber
=== rail.seasonNumber`; `remainderFacts` never claims a knock with no injury; moments never
run out of season order or reference a season with no line.

Both behaviours are now pinned by tests in `view-model.test.ts`, so the probes are for
exploration rather than regression.
