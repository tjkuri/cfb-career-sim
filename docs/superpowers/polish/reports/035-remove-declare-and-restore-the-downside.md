# 035 — Remove the declare decision, and make a career able to go wrong

**Type:** developer (engine + UI) · **Wave:** 16 · **Status:** done — implemented, measured, verified
**2026-09-15** · Implements DECISIONS 057 + 058, brief 035, report 034 §6.
**Not committed.** Working tree only; no `git checkout`/`restore`/`stash`/`clean` was run.

---

## Headline

| | |
|---|---|
| Acceptance | **All four rows reproduce, to two decimal places.** No tuning was done |
| The declare decision | Deleted from the engine hub, the policy layer, the view model and the screen |
| The downside | `UNDRAFTED_FLOOR` 35 → 50, round-band divisor 9.3 → 6.8, JR/SR-only decline below 200 snaps at one point per 60 short |
| `EARLY_DECLARE_PENALTY` | **Proven unreachable and deleted** — 36,000 measured careers declare as SR, 100% of the time |
| Tests | **650 passed**, 38 files. 651 → 650: 10 tests that encoded declare behaviour were removed or replaced, 9 new ones added, every change commented in place |
| One defect found and fixed | The card said *"A season of development came in."* over a **−3 OVR** drop. See §10 |
| Typecheck / build | Both `tsc` passes exit 0; `vite build` clean |
| B43 (the redshirt card) | **Half-fixed for free.** A *junior* redshirt is now a real gamble; the *sophomore* one — the common case — is still a good buy |

---

## 1. The four acceptance rows

Command, per profile (six positions × 1,500 = **9,000 careers each**, 36,000 total):

```
npx tsx src/sim/failure-probe.ts 1500 good all
npx tsx src/sim/failure-probe.ts 1500 randomFull all
npx tsx src/sim/failure-probe.ts 1500 lazyFull all
npx tsx src/sim/failure-probe.ts 1500 antisocialFull all
```

The probe reports per position; the rows below are the run-weighted aggregate across all six.

| profile | undrafted | brief | round 1 | brief | busted | avg seasons | OVR P50 |
|---|---|---|---|---|---|---|---|
| `good` | **0.86%** | ~0.9% | **40.73%** | ~40.7% | 3.57% | 4.92 | 90.3 |
| `randomFull` | **5.56%** | ~5.6% | **8.79%** | ~8.8% | 3.31% | 4.73 | 80.5 |
| `lazyFull` | **19.21%** | ~19.2% | **0.01%** | 0.0% | 1.27% | 3.98 | 71.0 |
| `antisocialFull` | **2.69%** | ~2.7% | 3.79% | ~3.8% | **13.70%** | 3.92 | 83.3 |

**Every row lands on the brief's number.** Nothing was tuned to fit; the constants went in as
specified and these are the first and only measurements taken of them.

**The disqualifier is not close to firing.** `good` fails at 0.86% (bar: ~1%) and takes round 1
40.73% of the time (bar: 28%). It is 12.7 points clear of the round-1 floor.

**Where the failure actually lives, by position** (undrafted, `good` / `randomFull` / `lazyFull`):

| | QB | OSKILL | OL | DL | DSKILL | K |
|---|---|---|---|---|---|---|
| `good` | 0.07 | 0.40 | 0.07 | 0.07 | 0.00 | **4.53** |
| `randomFull` | 2.33 | 2.93 | 2.33 | 2.40 | 2.40 | **20.93** |
| `lazyFull` | 11.27 | 15.33 | 6.47 | 13.40 | 12.53 | **56.27** |

**K carries a disproportionate share of the new failure and the PM should know.** A kicker's draft
stock is structurally lower (the 0.05 prestige multiplier is the deliberate hard-mode ceiling), so
raising the bar bites K first: a *well-played* kicker still goes undrafted 4.5% of the time against
a field player's 0.07%, and a lazy kicker fails 56% of the time. This is the intended shape of the
position — 034 measured the same skew — but it is the one place where "a well-played career is
safe" is weaker than the aggregate row suggests. **Not tuned here:** touching K's economics is
outside this brief and would need its own measurement.

## 2. Blast radius of the declare removal — grepped, not guessed

`grep -rni "declare" src` before editing, split by what the reference actually was.

**Live code, changed:**

| file | what was there |
|---|---|
| `src/engine/advance.ts` | `DECLARE_EVENT_ID`, the `HubStep`/`HUB_ORDER` entry, the `getDecision` card (title, prose, two options), the `applyChoice` branch and its guard clause, the `raiseNextHubDecision` step |
| `src/engine/draft.ts` | `EARLY_DECLARE_PENALTY` and its subtraction in `computeDraftResult` |
| `src/sim/policies.ts` | `DeclareStrategy`, `PolicyProfile.declare`, the `id === "declare"` branch in `makePolicy`, and **20 of 21 `PROFILES` rows** |
| `src/sim/repetition-probe.ts` | cohorts `B` and `C` both set `declare: "never"` |
| `src/sim/failure-probe.ts` | the comment on `stockCountsByClass` (the split itself is kept — see §3) |
| `src/ui/session/view-model.ts` | the mirrored `DECLARE_EVENT_ID`, `decisionNote()`, `eligibilityLeft()`, `seasonsPhrase()`, `COUNT_WORDS`, the `CLASS_ORDER` import, and four comments |
| `src/ui/session/types.ts` | `CareerView.decisionNote` and three comments |
| `src/ui/screens/CareerScreen.tsx` | the `card-note` render and its comment block |
| `src/ui/session/reducer.ts` | two comments naming declare as a hub branch |
| `src/content/events/index.ts` | one comment listing the synthetic hub decisions |

**Tests, changed** (all 8 files, detailed in §5): `engine/advance.test.ts`, `engine/draft.test.ts`,
`engine/last-outcome.test.ts`, `engine/pending-flush.test.ts`, `sim/policies.test.ts`,
`sim/failure-probe.test.ts`, `ui/session/reducer.test.ts`, `ui/session/view-model.test.ts`.

**Comment-only, left alone** (the word means something else, or names a still-true fact):
`engine/types.ts` (`Status = "declared"` is still a real status), `engine/school-effects.ts`,
`ui/session/ledger.ts`, `content/schema.ts`, and `styles/tokens.css` / `career.css` / `summary.css`
(where "declared" means a CSS declaration).

**Two things the grep found that were not in 034 §6's list:** the `ui/session/types.ts` view field
and the `CareerScreen` render site — i.e. the note under the declare prompt (DECISION 038, B25) was
a whole feature, not a mention. It is removed rather than left dangling: it stated remaining
eligibility, which existed *because declaring early was a hidden trap*, and with the trap deleted it
has nothing to warn about. The slot is deliberately not kept for reuse; DECISION 025 forbids the
kind of line that would fill it.

**`src/sim/policies.ts` — five profiles deleted, one kept and re-documented.** `lazyEarly`,
`saboteurEarly`, `antisocialEarly`, `randomEarly` and `goodEarly` each differed from their `*Full`
twin in the `declare` field alone, so keeping them would have left five names promising a behaviour
the engine can no longer produce. `baselineRandom` is **kept** under its historical name — it is
`failure-probe`'s CLI default and every report from 018 to 034 cites it — with a comment recording
that it no longer means what those reports mean by it: it used to declare at random, and essentially
all of the "12–17% under ordinary play" attributed to it was that coin flip firing (DECISION 058).

## 3. `EARLY_DECLARE_PENALTY` is unreachable, proven, and deleted

The brief asked whether anything else reaches it. **Nothing does.** The argument and its measurement:

1. `computeDraftResult` is called from exactly one place — `finalizeIfEnded`, and only for
   `status === "declared"`.
2. After the removal, exactly one line sets that status: `enterOffseason`'s out-of-eligibility
   branch, `yearsUsed >= CLASS_ORDER.length + (redshirtUsed ? 1 : 0)`.
3. `enterOffseason` advances `classYear` through `CLASS_ORDER` and **stops at SR**, so any career
   that survives long enough to exhaust its eligibility is a SR when it does.
4. Measured, not just argued: `failure-probe`'s `stockCountsByClass` over the 36,000 acceptance
   careers reports **SR and nothing else** — `good` 8,679, `randomFull` 8,702, `lazyFull` 8,886,
   `antisocialFull` 7,767. Zero non-SR draft entries.

The split is kept in the probe for exactly this reason, and `draft.ts` carries a comment saying that
if a future change ever lets a career declare as an underclassman again, the cost has to come back
with it. The surviving half of DECISION 038 — that no draft-time-only term may live inside
`deriveDraftStock`, because it is shared with `eligibleTiers` and would move the 25/45/70 offer
gates — is still tested, under its own name.

## 4. What changed, exactly

**`src/content/schema.ts` + `src/content/postseason.ts`** — the two decline constants go in the
progression config beside `washoutOverallFloor`, as the brief preferred: `declineSnapFloor: 200`,
`snapsPerDeclinePoint: 60`. This is the only `src/content/**` edit and it is the one the brief
authorised.

**`src/engine/advance.ts`** — a new `seasonOverallDelta(snaps, classYear, cfg, position)` wraps
`developmentDelta`. It is the only place in the engine where a season can cost overall:

```ts
const upperclass = classYear === "JR" || classYear === "SR";
if (upperclass && seasonSnaps < cfg.declineSnapFloor) {
  return -Math.ceil((cfg.declineSnapFloor - seasonSnaps) / cfg.snapsPerDeclinePoint);
}
return developmentDelta(seasonSnaps, cfg, position);
```

The gate reads `lastSeason.classYear` — the year the completed season was *played as*, recorded at
kickoff, before `CLASS_ORDER` advances a few lines below. That is the question DECISION 058 asks
("was he an upperclassman for the season that just ended?"), and it is identical to
`s.eligibility.classYear` at that instant.

**`src/engine/draft.ts`** — `UNDRAFTED_FLOOR` 35 → 50, and the inline `9.3` is now a named
`ROUND_BAND_DIVISOR = 6.8`. Both carry the measurement and the "do not re-derive" note.

## 5. Tests: 651 → 650, and why each one moved

Ten tests that encoded the old behaviour were removed or replaced; eight were added. **Every edit
carries an in-file comment saying what it used to assert and why that is no longer true**, per the
brief's rule.

**Removed (7)** — the behaviour they described no longer exists:

- `draft.test.ts`: four of the six `EARLY_DECLARE_PENALTY (DECISION 038)` tests (`is 8`, `costs a
  non-senior 8`, `costs a senior nothing`, `cannot drive stock below zero`). The other two —
  the no-leak-into-`deriveDraftStock` and no-leak-into-`eligibleTiers` pair — **survive**, rewritten
  under the constraint's own name, because that constraint outlives the constant.
- `view-model.test.ts`: all three of "the declare card states the eligibility that remains".

**Replaced or narrowed (6)**, with the reason recorded in each:

- `advance.test.ts` "rejects a bogus choiceId at the declare decision" → now asserts the declare
  decision is **never offered** and exercises the surviving guard clause on the redshirt hub.
- `advance.test.ts` "still offers declare at JR" → its opposite.
- `advance.test.ts` "populates a team record for every played season" → **a real behaviour change,
  not a test fix.** A record is written by the postseason resolver, so a career that ends *inside* a
  season leaves a 0–0 final line. Careers used to end at the declare card, between seasons, so the
  case never arose; now every career plays to the end of its eligibility and it does. The test now
  allows a 0–0 **final** line only on a career whose status is `busted`.
- `last-outcome.test.ts` "is undefined after a declare choice" → dropped; the recruiting and
  transfer cases cover the same rule for every hub branch left.
- `pending-flush.test.ts` (both tests) → rewritten. They hand-built a state sitting on the declare
  card; they now walk a real career to its last decision and inject a deferred penalty queued past
  any tick, which is the only way the "orphaned effect at career end" shape now occurs.
- `reducer.test.ts` "shows outcome prose on a multi-option content event" and "leaves multi-option
  cards as choices" → **both were passing for a reason nobody intended.** A first-option policy used
  to press "Declare for the NFL Draft" the moment it was offered, which ended the career *before the
  transfer hub was ever reachable* — the one multi-option card that authors no prose. With declare
  gone the walk reaches it, so the first test now distinguishes authored cards from hub cards, and
  the second matches a resolution to the decision it came from (a hub that moves nothing resolves to
  nothing, and `openCard` then auto-resolves the following one-option beat, whose `narrated` is
  correctly `true`).
- `reducer.test.ts` "shows nothing when declaring" → now pins the absence of the card at every
  position, and that the click ending the career still lands on the summary.
- `policies.test.ts` "declare:asap ends the career at the first eligible offseason" → now pins the
  consequence: every career runs 4 seasons, or 5 with a redshirt.

**Added (9)** — `advance.test.ts` gains an `upperclass decline` block (the per-60 arithmetic, the
FR/SO exemption, that a playing upperclassman still develops exactly as before, and that
`enterOffseason` applies the drop to the number the player watches), and `draft.test.ts` gains a
round-band test pinning that round 1 is still reachable at the top of the scale — the failure mode
the divisor exists to prevent. `view-model.test.ts` gains the decline-vs-development test from §10.

## 6. Repetition — measured before and after, on the same content

`npx tsx src/sim/repetition-probe.ts 24 <cohort> card`, for `B`, `C` and `all`. "Before" is a
pristine `git archive HEAD` copy measured with the same command, so this is a true A/B rather than a
comparison against report 024's numbers.

| cohort B (n=144) | before | after |
|---|---|---|
| Decisions per career (median) | 40 | **38** |
| First verbatim repeat (median) | 15 | **15** |
| First repeat P10 / P90 | 12 / 15 | 12 / 15 |
| Careers repeating by decision 16 | 100% | 100% |
| Repeat share of a career (median) | 37.5% | 36.8% |

| cohort C (n=144) | before | after |
|---|---|---|
| Decisions per career (median) | 44 | **41** |
| First verbatim repeat (median) | 17 | **16** |
| First repeat P10 / P90 | 10 / 20 | 10 / 20 |
| Careers repeating by decision 16 | 44.4% | **54.9%** |
| Repeat share of a career (median) | 36.4% | 34.1% |

`all` runs both cohorts and reproduces both rows exactly.

**Reading it honestly.** Careers did not get longer *for these cohorts* — B and C already declined
the draft every year, so their season counts are unchanged. What moved is that the declare card was
itself a decision, two or three per career, and removing it **shortens the click count without
removing any content**: the same repeats now arrive slightly earlier in the sequence. That is why
cohort C's "repeating by decision 16" rises 10.5 points while its first repeat *improves* by one
decision and its repeat share *falls*. **Nothing got more repetitive; the padding between repeats
got thinner.** The first-repeat attribution is unchanged — `milestone-rivalry` serves it in 111 of
144 cohort-B careers, as it did before.

**The caveat the PM should carry:** 034's "careers get longer (4.73 vs 3.10 seasons)" is about a
player who *used* to declare early and now cannot — a real human playtester, not these cohorts. For
that player the exposure to repeated content genuinely rises by 50%, and no probe cohort measures
it, because no cohort declares any more. Repetition remains this phase's top complaint and this
change does not help it.

## 7. B43 — the redshirt card, measured rather than assumed

The brief asked whether the decline turns the redshirt's free +5 into a real gamble. **It does, but
only for the junior who takes it — and almost nobody is offered it as a junior.**

`redshirtOffered` fires at SO, at JR, or on an injury, and the hub raises it at the first
opportunity, so a "take the redshirt" policy takes it as a **sophomore in 2,991 of 3,000 careers**.
A sophomore is exempt from the decline by design, so the common path is untouched.

Forcing the junior case (decline at SO, take at JR), 3,000 careers per arm, ordinary play, stay put:

| | no redshirt | JR redshirt | delta |
|---|---|---|---|
| **before**: mean final OVR | 80.8 | 82.8 | **+2.0** |
| **before**: round 1 | 6.43% | 13.87% | **+7.4 pts** |
| **before**: undrafted | 0.00% | 0.13% | +0.1 |
| **after**: mean final OVR | 79.8 | 78.8 | **−1.0** |
| **after**: round 1 | 6.27% | 7.17% | +0.9 |
| **after**: undrafted | 4.93% | 8.17% | **+3.2 pts** |

**Before, a junior redshirt was free money: two points of overall and double the round-1 rate.**
After, it costs a point of overall on average and raises the chance of going undrafted by two
thirds. That is B43's complaint answered — for that player.

The sophomore redshirt, which is the one players actually see, is **still a strong buy**: taking it
lifts round 1 from 5.73% to 13.43% and slightly *lowers* the undrafted rate (5.83% → 5.10%), paid
for only with a higher bust rate (1.37% → 4.20%, from one more season of exposure). **B43 is half
fixed for free, and the brief's instruction not to separately fix the card is respected** — no
change was made to it.

## 8. What the offseason looks like now

The hub is `redshirt → transfer`, where it was `redshirt → declare → transfer`.

- **The beat that is gone is the only one that ever ended a career on the player's own decision.**
  Every other offseason card asks where to play; declare asked whether to stop. Nothing left in the
  offseason carries that weight, and the last click of a career is now an ordinary content card
  followed straight by the summary.
- **The junior and senior offseasons are the ones that lost content.** A freshman offseason was
  already redshirt-then-transfer; an upperclass offseason was redshirt-then-declare-then-transfer
  and is now the same two cards as everyone else's. **A senior offseason is frequently a single
  transfer card.**
- **The screen has no hole in it.** The card was a synthetic decision, not a slot: with no
  `currentEventId` the hub simply raises the next step, and `CareerScreen` renders whatever decision
  is live. There is no empty container and no layout shift — verified in the browser (§10).
- **What was lost with it:** the one line of rule-of-the-game fact under a prompt (remaining
  eligibility). No card carries a note now, and `card-note` is unused CSS. Left in place rather than
  deleted, as a style change nobody asked for.

**Not designed here, per the brief.** The observation to hand up is that the offseason is now
*shorter and flatter for upperclassmen specifically* — which is the same stretch of career the new
decline makes most dangerous. There is a beat missing exactly where the stakes now are.

## 9. Seed baselines — moved by construction, as DECISION 040 allows

`npx tsx src/sim/play-headless.ts <seed> random | md5` (not `npm run play`, whose npm banner would
be hashed with the output).

| seed | before | after |
|---|---|---|
| 24 | `cd2d3895e9c68e8dc485bfa5cc0fc832` | **`6ef539d4ff71aa7637672aa09abd4292`** |
| 77 | `7d6ee0df708a92555edb968ccc65ce64` | **`5c2066ec5023c158267406285db3d35e`** |
| 101 | `f2ffe2b55fdbf8bf710182f64b871edb` | **`4930e62258eb61aaede71b328ce4ee61`** |

All three move, as expected: the random policy no longer consumes an RNG draw at the declare card,
so the whole stream shifts from the first eligible offseason onward.

## 10. A defect the change introduced, found in the browser and fixed

**Clicking it through is what caught this.** With the decline live, the resolved card read:

> `THIS CARD` **No change** · `EVERYTHING ELSE` **−3 OVR** — *"A season of development came in."*

`Remainder.developed` meant "a season boundary was crossed", which until today could only mean
development. It can now subtract, so the one sentence on the card contradicted the one number on the
card — **worse than the bare integer the sentence was added to replace (DECISION 056, B45)**, and a
direct hit on the falsifier DECISION 058 records for itself: *the decline exists to make failure
legible.*

Fixed in the view model, not the engine:

- `Remainder` gains `declined?: boolean` — optional, so a card already resolved in `localStorage`
  reads as "not a decline", which is what those saves were.
- `remainderFacts` answers it by calling the engine's own `seasonOverallDelta` on the completed
  season line, for the same reason `clampOverall` is imported rather than re-spelled: the JR/SR gate
  must not exist in two places.
- `CareerScreen` prints **"A season on the sideline cost you ground."** when it is set, and the old
  sentence otherwise.
- One test pins all three cases: a junior who sat (declines), a junior who played (develops), a
  sophomore who sat (exempt).

The card now reads `EVERYTHING ELSE −3 OVR — "A season on the sideline cost you ground."`

**In scope because the engine change broke it**, not because the card was up for redesign. No other
card copy was touched.

## 11. The click-through

`localhost:5173`, a `GameState` written into `localStorage['cfb-career-sim:v1:current']` to land on
a junior who missed the season (25 snaps, MCL) rather than clicking 40 cards to find one.

1. **The drop is visible in the number the player watches.** The header OVR goes **56 → 53** across
   one click, the ledger's Year 3 row stamps **56 (−4)**, and the season rail's footer reads
   `ACROSS 3 SEASONS 59 → 56 −3`. Nothing about this career is ambiguous while it is happening.
2. **The card explains it** — §10's corrected sentence, under `EVERYTHING ELSE −3 OVR`.
3. **The offseason has no declare card and no hole.** The senior offseason opened on *Redshirt?*,
   then *Transfer Portal* — the exact point where a draft-eligible SR was previously asked to
   declare. No empty container, no layout shift; the hub simply raises the next step.

**Housekeeping:** the injected save was removed from `localStorage` afterwards, so the dev server's
next load starts clean. If a career was saved in that browser before this session, it was
overwritten by the fixture — the career log (`:v1:log`) is untouched.

## 12. Verification

- `npm test` — **650 passed**, 38 files, 0 failed.
- `npm run typecheck` — both passes exit 0.
- `npm run build` — clean, 392.58 kB JS / 27.31 kB CSS.
- Acceptance: §1, four profiles × six positions × 1,500 runs.
- Repetition: §6, cohorts `B`, `C` and `all`, each measured against a pristine `HEAD` copy.
- Seed md5s: §9.
- Click-through: §11.
- **Nothing committed.** No destructive git command was run at any point.

---

## PM addendum — the kicker regression, found in verification and fixed before commit

**By:** PM session 7, 2026-09-15. The agent flagged this correctly and left it, per the brief. On
inspection it was a ship-blocker, not a follow-up, so it was fixed in the same wave.

**What the aggregate hid.** Acceptance was specified on the `good` profile *in aggregate* — ~0.9%
undrafted — and the implementation hit it exactly (0.86%). Broken out by position:

| `good` | undrafted | round 1 | OVR P50 |
|---|---|---|---|
| QB / OL / DL | 0.07% | 44–51% | 91–93 |
| DSKILL | 0.00% | 47.5% | 92 |
| **K** | **4.53%** | **5.47%** | **84** |

A well-played kicker was failing **65× more often** than a well-played quarterback, and its
first-round rate had collapsed from a pre-change 28.7% to 5.47%. The aggregate absorbed it because
K is one position in six.

**The cause was in the brief, not the implementation.** `declineSnapFloor: 200` is a flat threshold,
and `postseason.ts` already documents that *a kicker's full season is ~165 snaps against a field
player's ~480, i.e. ~34% of the workload* — which is why `snapsPerDevPointByPosition: { K: 62 }`
(180 × 0.34) exists. A well-played kicker accumulates ~559 career snaps against a field player's
~1,450, so it sat **below the flat floor every season of every career** and declined all the way
through.

**The fix is the precedent the file already set:** `declineSnapFloorByPosition: { K: 68 }` and
`snapsPerDeclinePointByPosition: { K: 20 }` — 200 × 0.34 and 60 × 0.34, the identical workload
factor, with both scaled so the decline stays proportional rather than merely rarer.

**Result — K restored, and the whole distribution is better:**

| profile | before fix | after fix |
|---|---|---|
| `good` undrafted | 0.86% | **0.10%** |
| `good` round 1 | 40.73% | **44.31%** |
| `good` K undrafted | 4.53% | **0.00%** |
| `good` K round 1 | 5.47% | **26.93%** |
| `randomFull` undrafted | 5.56% | 3.22% |
| `lazyFull` undrafted | 19.21% | **15.18%** |
| `antisocialFull` busted | 13.70% | 13.71% |

**The honest trade:** fixing K softened the whole curve, because K was absorbing a disproportionate
share of failures under every profile. Bad play now fails **15.2%** of the time rather than 19.2% —
still 22× the pre-wave 0.7% — and a good career is now *safer* than the target (0.10% vs ~0.9%) with
a *higher* round-1 rate (44.31% vs the 45.1% it had before any of this). K's remaining round-1 gap
(26.9% vs 44–51%) is **pre-existing** — it measured 28.7% before this wave — and is not this
change's doing.

**The transferable lesson:** an acceptance test specified on an aggregate cannot see a per-position
failure. This is the second time this wave that a pre-specified measurement was correct in form and
wrong in granularity — the first was calibrating the replacement failure rate against the trap it
replaces (report 034 §5). **Specify acceptance tests at the granularity the defect can hide in.**

**Verification after the fix:** 650 tests green, both typecheck passes exit 0, build clean, seed
md5s for 24/77/101 unmoved by the K scaling (they are QB seeds) and matching the values the
implementation reported.
