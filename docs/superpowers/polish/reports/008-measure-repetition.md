# 008 — How repetitive is a career, actually?

**Type:** research/measurement · **Status:** done · **No source files changed.**
**2026-09-13 · 864 instrumented careers across 4 cohorts and all 6 positions.**

---

## Headline numbers

Primary column is the **full four-year career** — the shape the playtester actually played (never
declares early, never transfers, never redshirts). Second column is the `random` policy the balance
harness uses, kept because it reproduces DECISION 003's baseline exactly and is the wider net.

| | Full 4-year career (n=144) | `random` policy (n=384) |
|---|---|---|
| Decisions per career (median) | **40** | 24 |
| Distinct event ids per career (median) | **22** | 18 |
| **Decisions that re-show an event already seen** | **45%** (p90 47.5%) | 25% (p90 45%) |
| **First verbatim repeat lands at decision** | **13** (p10–p90: 12–13) | 13 |
| Careers with a repeat by decision 16 | **99.3%** | 72.4% |
| The 5 fixed "skeleton" milestones, share of decisions | **40%** | 31% |
| Skeleton + hub cards — the fully deterministic spine | **60%** | 53% |
| Times the single most-repeated event fires in one career | **4** (median *and* p90) | 2 (p90 4) |
| Library seen in one career | **17.6%** (18 of 102 events) | 13.7% (14) |
| Authored outcome prose seen in one career | **7.3%** (24 of 330) | 5.5% (18) |
| Library permanently unreachable to any one position | **49%** (50 of 102) | same |
| Worst decile: share of decisions that are re-showings | **50.7%** | 45.9% |
| Redshirt seasons that still credit snaps | **100%**, median 26 | 99.7%, median 25 |
| First all-star / combine invite seen as a FR or SO | **61.3%** of careers that get one | same |

---

## Is it as bad as one playtester made it sound?

**Worse, and more precisely diagnosable.** Every specific thing the playtester said is not only true, it
is true by construction and it is true earlier than they reported. The three cards they named —
Season Opener, Rivalry Week, Bowl Season — are `kind: "fixed"` events with no `minClass` gate, so they
fire **in 100% of careers, every single season, in a guaranteed phase order**, and the quoted prose is
verbatim from `src/content/events/milestones.ts` lines 41, 65 and 128. In a full four-year career the
five milestones account for **40% of all decisions** and the deterministic spine (milestones + the
recruiting/redshirt/declare/transfer hubs) accounts for **60%**. The first exact repeat does not land
at decision 16 — it lands at **decision 13**, in 99.3% of full careers, and it is Season Opener 205
times out of the 331 careers that repeat at all. The playtester was generous. But the shape of the
problem is *narrower than "the content is repetitive"*: the **random pool is doing its job** — 98 of
the 102 events fired at least once across the cohort, and a career's random draws are near-fully
distinct. The damage is concentrated in a **five-event deterministic skeleton that repeats at a fixed
cadence, three of whose five cards have exactly one option** (Season Opener, Fall Camp Battle and
Senior Day are single-choice cards: `options.length === 1`). The player is not choosing on 40% of
their decisions — they are pressing the same button on the same text for the fourth time. That is why
"four laps of the same track" is the right description and why the boredom is predictable to the
decision number.

---

## Method

- **Attribution is by event id, not by string matching prose.** I drove the engine's own loop
  (`createCareer` → `getDecision` → `advance`, the reference loop in `src/sim/play-headless.ts`) and
  recorded `getDecision(state).eventId` *before* each `advance()`, along with `seasonIndex`, `phase`,
  `eligibility.classYear` and `overall`. Hub decisions carry the engine's synthetic ids
  (`recruiting`, `redshirt`, `declare`, `transfer`); everything else carries the authored
  `GameEvent.id`.
- **Outcome attribution** is an exact 1:1 map from `state.lastOutcome.description` to
  `<eventId>:<optionId><branch>`, built from `CONTENT` plus the two engine-injected redshirt strings.
  All 330 authored outcome strings are distinct (verified — zero duplicates), and **zero** resolved
  outcomes across the cohort failed to match. The mapping is therefore exact, not heuristic.
- **Cohorts** (all six positions balanced in each; seeds `m008-*`, `stay-*`, `rs-*`, `rnd-*`):
  - **A — `random` policy**, 384 careers (96 simulated players × 4 consecutive careers), 10,046
    decisions. Half the players replay the same position, half rotate — this is what Q6 uses.
  - **B — full four-year career**, 144 careers: declines the redshirt, declines early declare, stays
    put. The playtester's shape, and the *maximum-exposure* case.
  - **C — five-year redshirt career**, 144 careers: takes the redshirt once, then as B.
  - **D — `random`**, 192 careers, pooled with B and C for the timing questions (Q4/Q5).
  - Plus 600 snaps-only careers for the negative-snaps check below.
- Cohort A reproduces DECISION 003's baseline (median 24 decisions, mean 26.2 vs 003's 7,926/300 =
  26.4), so the harness is measuring the same thing that decision was made on.
- Careers ended `drafted` 381/384 in cohort A; 3 washed out. Aggregation happened inside the script;
  no raw career JSON entered this report.

---

## Findings, ranked by player-facing damage

### 1. The skeleton is deterministic, unavoidable, and 40% of the game — and most of it isn't a choice

`selectFixedEvent` walks `content.events` in order and fires **every** matching `kind: "fixed"` event
once per phase, before the single random draw. The five milestones are the only ones. Their gates are
`requiresPlaying` (plus `minClass: "SO"` on Fall Camp and `requiresFinalSeason` on Senior Day) — no
once-per-career gate exists.

| | |
|---|---|
| Milestone share of decisions, 4-year career | 40% median (p10–p90: 39–40%) |
| Milestone + hub share | **60%** (p10–p90: 60–61%) |
| `milestone-opener` / `-rivalry` / `-bowl-season` | fired in **100%** of 384 careers, 888 times each |
| Times per career (4-year) | **4 each** — median and p90 identical |
| Authored outcome texts behind them | opener **2**, rivalry 3, bowl 3, fall camp 2, senior day 2 |
| Options on the card | opener **1**, fall camp **1**, senior day **1**, rivalry 2, bowl 2 |

A player seeing Season Opener four times draws from **two** result strings behind **one** button. Per
phase the composition is exactly: 888 milestone + 1,177 random in `nonconf` and `postseason`; 954 +
1,177 in `conference`.

*Implication:* the repetition the playtester felt is not a content-volume problem — it is five events
firing on a metronome, and the three loudest of them are cards with nothing to decide.

### 2. The first verbatim repeat lands at decision 13, not 16

| | |
|---|---|
| First-repeat decision index (4-year careers with one) | median **13**, min 12, max 13 |
| Cohort A, careers that repeat at all | 86.2%; median index **13** |
| Careers repeating by decision 16 | **99.3%** (4-year) / 72.4% (cohort A) |
| Which event is the first repeat | `milestone-opener` in **205 of 331** cases (62%) |
| Cohort A, share of careers where decision #13 is a repeat | 58.6% |
| Cohort A, decisions #26, #28, #30 | **100%** repeats |

Decision 13 is the `nonconf` phase of season 2 — the second Season Opener. The playtester said
"roughly decision 16"; they were three cards *late*, and by decision 16 the median career has already
seen 2 repeats.

*Implication:* the boredom onset is not variance — it is a fixed position in every career, and any
intervention has to land before card 13.

### 3. One career sees one-seventh of the library; half of it is locked behind a position

| | |
|---|---|
| Authored library | 102 events · 195 options · **330 outcomes** |
| Position-locked events | **60 of 102** (10 per position, exactly) |
| Reachable by any one position | **52 of 102 — 49% is permanently invisible** |
| Distinct authored events seen, 4-year career | median 18 → **17.6%** of library, **34.6%** of reachable |
| Cohort A | median 14 → 13.7% / 26.9% |
| Distinct outcome prose seen, 4-year career | median 24 → **7.3%** of 330 |
| Cohort A | median 18 → 5.5% |
| Events that never fired in 384 careers | 4 — `bust-academics`, `bust-drug-test`, `bust-arrest`, `bust-lost-love` |

*Implication:* there is far more authored content than a player ever sees — the library is not thin,
the delivery is — and a player who never changes position can never reach half of it no matter how
long they play.

### 4. The unseen pool empties fast — and fastest for the loyal player

Cumulative distinct authored events across four consecutive careers by the same simulated player:

| Career | Same position: new events | cum. coverage | % of decisions showing anything new | Rotating position: new events | cum. coverage |
|---|---|---|---|---|---|
| 1 | 13 | 12.7% | 100% | 14 | 13.7% |
| 2 | 6 | 20.6% | **41.7%** | 8 | 21.6% |
| 3 | 4 | 25.5% | **27.3%** | 8 | 28.4% |
| 4 | **3** | 28.4% | **18.5%** | 6 | 35.3% |

*Implication:* the north star is three careers in a row; by career 3 a same-position replayer sees
something new on barely a quarter of their decisions, and changing position roughly doubles the
freshness — which is the one lever already in the build.

### 5. The redshirt contradiction (B13) is universal, not a rare path

`content.redshirt.sitSnapModifier` is `0.05`, not `0`. `simulatePhaseProduction` therefore still runs
during the sit season and still credits snaps.

| | |
|---|---|
| Careers taking the redshirt (pooled B/C/D) | 291; season line found for 289 |
| Redshirt seasons crediting **non-zero** snaps | **100%** (289/289) |
| Snaps in a redshirt season | median **26**, p10 **9**, p25 21, p90 32, max 48 |
| Snaps in a normal season | median 468 |

The playtester's "9 snaps credited" is the **10th percentile** of this distribution — they got a
quiet example. Separately, 1 season line in 2,994 (`m008-p94-c1`, season 3, a redshirt year) finished
at **−10 snaps**: a negative snap effect landing on a season whose base production is 5% of normal.
Rare (0.03%), but it is a season row that would render a negative number.

*Implication:* this is not an edge case to be handled; a "you sat out this season" row that reports
snaps is what every redshirted career produces, and it is the only case where the ledger DECISION 010
commits to would be contradicting itself in print.

### 6. All-star and combine invites reach freshmen about a quarter of the time (B12)

None of the four late-career invite events carry a `minClass` condition — only `position` and, for
two of them, `tier`.

| Event | Position | Conditions | Fired in | Fired at FR/SO in | FR / SO / JR / SR fires |
|---|---|---|---|---|---|
| `all-star-invite` | QB | `position` only | 36.7% of careers | **25.3%** | 12 / 8 / 5 / 11 |
| `all-star-practice-week` | DSKILL | `position` only | 43.8% | **28.8%** | 10 / 15 / 6 / 11 |
| `senior-bowl-invite` | OL | `position`, `tier 1-2` | 44.4% | **24.7%** | 13 / 10 / 12 / 12 |
| `combine-buzz` | DL | `position`, `tier 1-2` | 45.7% | **25.9%** | 7 / 14 / 10 / 10 |

Across all four: **61.3%** of careers that ever see one of these see it **first** as a freshman or
sophomore (42 FR + 42 SO of 137). OSKILL and K have no equivalent event, so this is a four-position
problem.

*Implication:* roughly one career in four is told a Senior Bowl wants its true freshman — a
credibility break in the same class as the `0-0` header DECISION 014 dealt with, and it costs one
condition field, not a rewrite.

### 7. `Redshirt?` timing is defensible by `overall`, but it asks twice

This is where the brief's suspicion is **not** confirmed, and that is worth recording.

| | |
|---|---|
| Redshirt offers observed | 757 |
| Offered to a **true freshman** | **0** — `redshirtOffered()` fires only at SO/JR, or on an active injury |
| By class year | SO 479 · JR 234 · **SR 44** (injury clause only) |
| `overall` at the offer | median **65**, p75 68, p90 72, max 81 |
| Offered at `overall` ≥ 70 / ≥ 75 / ≥ 80 | 19.4% / **3.4%** / 0.5% |
| Careers offered the redshirt **twice or more** | **48.8%** |

*Implication:* the "offered to a star" complaint is not supported — 96.6% of offers go to a player
under 75 OVR. The real oddities are the opposite ones: a true freshman, the one year a redshirt
actually happens, is **never** offered it; 5.8% of offers go to seniors; and half of all careers are
asked the same high-stakes question twice, which is itself skeleton repetition wearing a hub's
clothes.

---

## Worst decile (the failure mode is one player giving up)

| | Full 4-year career | `random` policy |
|---|---|---|
| Worst decile by share of repeated decisions | **50.7%** of decisions are re-showings | 45.9% |
| — decisions in those careers | 40.5 | 41.1 |
| — distinct events in those careers | 20.0 | 22.2 |
| — most-repeated event, times | **4.0** | 3.8 |

Note the direction: in cohort A the worst decile is the **longest** careers, not the shortest. The
more of the game a player plays, the higher the repeat share climbs — which is exactly backwards from
what a three-careers-in-a-row north star needs.

---

## Caveats

- Choices inside content events were made by the `random` policy in all cohorts; a real player's
  choices correlate with state and would change which random events gate in (`maxCharacter`,
  `maxOverall`, `requiresInjury`). This affects *which* random events appear, not the skeleton — the
  fixed milestones and hubs are choice-independent, and they are where every headline number lives.
- Cohort B/C fix the three hub answers to a single strategy. A player who mixes them lands between
  cohort A and cohort B on every metric; both columns are given for that reason.
- Coverage percentages count an event as "seen" on first sighting; a player who sees Season Opener
  four times is credited with one event and, at most, two of its outcome strings.
- Per the brief: no content or engine change is proposed here, and nothing measured above —
  `tier`, `weight`, `probability`, `draftStock` — is recommended for display.

---

*Scripts lived in the session scratchpad and were not added to the repo. `src/**` unchanged.*
