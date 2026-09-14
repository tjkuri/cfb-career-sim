# 024 — The content pilot: Season Opener stops being the same card four times

**Type:** content + measurement · **Status:** done, and the gate result is **mixed — read §4 before
approving the other seven** · **2026-09-14**
**Changed:** `src/content/events/milestones.ts`, plus the four additions DECISION 042 approved and a
new committed harness. **Nothing committed** — all changes are in the working tree.

---

## Headline

| | |
|---|---|
| **The gate: first verbatim repeat, cohort B** | **decision 13 → 15** |
| Careers with a repeat by decision 16, cohort B | **100% → 100%** (no movement) |
| Decisions that re-show a card already seen, cohort B | **45.0% → 37.5%** |
| Cohort C first verbatim repeat | **17 → 17** (median unmoved; p90 18 → 20) |
| Cohort C repeat share | **43.2% → 36.4%** |
| Who serves the first repeat now | `milestone-rivalry`, in **112 of 144** cohort-B careers |
| `reports/022` §8 no-change proof | **identical on all 7 fields × all 20 profiles** |
| Tests | 578 → **613 green** · typecheck both passes exit 0 · build clean |

**The one-sentence finding:** fixing one event in a five-event deterministic skeleton moves the wall
by exactly the distance to the next event in the skeleton. The first repeat did not go away; it is
now Rivalry Week, two decisions later.

---

## 1. The harness

`src/sim/repetition-probe.ts` + `src/sim/repetition-probe.test.ts` (20 tests). CLI:

```
npx tsx src/sim/repetition-probe.ts <careersPerPosition> <B|C|all> <card|id>
```

It drives the engine's own loop (`createCareer` → `getDecision` → `advance`), records the decision
**before** each `advance()` with `seasonIndex`, `phase` and `eligibility.classYear`, and reports
per-cohort percentiles plus the attribution of the first repeat.

### The repeat key, and the proof it is honest

The key is the rendered pair `(title, description)`, joined by U+001F so no title/body re-split can
collide. Three things establish it:

1. **`cardKeyOf` is unit-tested** against same-title/different-body, same-body/different-title, and
   the separator-collision case.
2. **Every event in the bundle renders a distinct card** — asserted over all of `CONTENT.events`, so
   on unmodified content the pair key and the id key cannot disagree.
3. **They are measured to agree.** Cohort B, 144 careers, run twice under `--card` and `--id`: the
   two JSON reports are byte-identical apart from the `key` field. A regression test asserts the
   same equivalence on a small cohort so it stays true.

That is the detail the brief called the most important one, and it holds: **on today's content the
card key reproduces 008's id-based numbers exactly.** After the variants land it stops agreeing, and
that divergence is the measurement, not an artefact of it.

**Cross-check, after the fact.** Re-running the post-change traces under a key that collapses the
five variants back to one card reproduces the pre-change numbers *exactly* (B: 13 / 100% / 45.00%;
C: 17 / 41.0% / 43.18%). So the traces are structurally identical before and after — the same
careers, the same decisions, the same order — and the only thing that moved is what the cards say.

### Cohorts

- **B** — full four-year career, 144 careers (24 × 6 positions): `declare: never`, `transfer: stay`,
  `redshirt: decline`, content choices random. Seeds `rep-B-<position>-<i>`.
- **C** — five-season redshirt career, 144 careers, same but `redshirt: take`. Seeds `rep-C-…`.

Before/after use the identical seeds.

---

## 2. Baseline reproduction — the gate was validated before any content moved

Run on **unmodified** content, before the engine field or a single word of prose existed.

| | 008 published | Tolerance | **Measured** | |
|---|---|---|---|---|
| First verbatim repeat lands at decision | 13 (p10–p90 12–13) | exactly 13 | **13** (p10 12, p90 13, min 12, max 13) | ✅ |
| Careers with a repeat by decision 16 | 99.3% | ≥ 98% | **100.0%** | ✅ |
| Decisions per career (median) | 40 | 39–41 | **40** (p10 40, p90 41) | ✅ |
| Decisions that re-show a card already seen | 45% | 43–47% | **45.0%** (p90 48.8%) | ✅ |

First-repeat attribution, cohort B: `milestone-opener` in **121 of 144** careers (84.0%). 008's 62%
figure is pooled across its four cohorts; in the maximum-exposure cohort alone the opener's share of
first repeats is higher than the brief assumed, which means the pilot went in with better odds than
its own premise claimed.

**The gate reproduced. Work proceeded.**

---

## 3. What changed

### 3a. The engine field — DECISION 042, and nothing beyond it

Four edits, exactly as authorised:

- `src/engine/types.ts` — `seasonIndex?: number[]` on `EventConditions`, with a comment recording
  that it is exact set membership and not a `>=` like `minClass`.
- `src/engine/select-event.ts` — one line in `eventMatches`, placed before the `minClass` clause:
  `if (c.seasonIndex && !c.seasonIndex.includes(state.seasonIndex)) return false;`
- `src/content/schema.ts` — validator clause next to `minClass`/`tier`: entries must be integers 0–4.
- Tests: 3 in `select-event.test.ts` (exact membership, multi-season sets, and that an **absent**
  `seasonIndex` still matches every season — the additivity claim DECISION 042 rests on), 3 in
  `schema.test.ts` (out-of-range, negative and fractional rejected; a full 0–4 set accepted).

Nothing else in `src/engine/**` was touched — not a helper, not a rename.

### 3b. Three test changes in `milestones.test.ts` that are worth flagging

The old test *"runs at most one per phase, except the final-season beat"* counted authored events per
phase. With five openers that count is wrong, but the invariant it was protecting was never about the
authored count — it is about how many fixed milestones can **fire** in one phase, because
`selectFixedEvent` fires every match. It is now evaluated through `eventMatches` across seasons 0–4.

Generalising it surfaced a pre-existing fact: **the offseason of a true freshman's first season has
zero milestones**, because Fall Camp carries `minClass: "SO"`. That is deliberate, it predates the
pilot, and the test therefore asserts *at most* one rather than exactly one, with the reason written
down. Flagged here because it is the one place the brief's stated invariant did not match the code.

---

## 4. The gate — the number, unargued

### Cohort B (n=144, full four-year career, the playtester's shape)

| | Before | After | Move |
|---|---|---|---|
| **First verbatim repeat lands at decision (median)** | **13** | **15** | **+2** |
| — p10 / p90 | 12 / 13 | 12 / 15 | |
| — min / max | 12 / 13 | 12 / 15 | |
| **Careers with a repeat by decision 16** | **100.0%** | **100.0%** | **0** |
| Decisions per career (median) | 40 | 40 | 0 |
| **Decisions that re-show a card already seen** | **45.0%** | **37.5%** | **−7.5 pts** |
| — p90 | 48.8% | 41.5% | −7.3 pts |
| Careers that repeat at all | 144 / 144 | 144 / 144 | 0 |

First-repeat index histogram, cohort B:

| decision | 12 | 13 | 14 | 15 |
|---|---|---|---|---|
| before | 23 | **121** | — | — |
| after | 23 | — | 9 | **112** |

First-repeat attribution: `milestone-opener` 121 → **`milestone-rivalry` 112**. The 23 careers whose
first repeat was already a random event at decision 12 are untouched, as they should be.

### What the number means, said plainly

**The pilot's stated hypothesis is that the first-repeat decision number moves materially.** The
brief names 13 → 14 as the refutation threshold. The measured move is 13 → 15, one decision past that
line, and it comes with a second row that did not move at all: **100% of careers still hit their
first verbatim repeat by decision 16, exactly as before.**

The mechanism is displacement, and it is visible in the attribution. Season Opener fires in `nonconf`
and Rivalry Week fires in `conference`, two decisions later. Removing the opener's repeat does not
remove *a* repeat — it promotes the next item in a fixed queue. **One event's variants buy exactly
the gap to the next fixed milestone, and nothing more.** Season 2's Rivalry Week now serves the first
repeat in 78% of careers where the opener served it in 84%.

So on DECISION 030's gate as literally written, this is a marginal pass, and on the substance behind
it — "does the player still hit a wall of re-read cards early in career 1?" — it is a **refutation**.
The wall is at decision 15 instead of 13, and it is still there for every single career.

### The row that did move, and is not nothing

**Total re-showing fell 45.0% → 37.5% of all decisions**, a 17% relative cut from one event out of
five. That is the quantity DECISION 036's playtester complaint actually maps onto — *"a repeated card
that only asks me to click is a training exercise in not reading"* is about the cumulative dose, not
about the onset. If skimming is trained by volume, this is a real reduction. If it is triggered by
the first repeat, it is not.

**That distinction is untested and this measurement cannot settle it.** It is the same open premise
DECISION 030 flagged, and it is now the only thing standing between these two readings of the result.

### The counterfactual, because it is the number the go/no-go actually needs

Computed analytically on the same 144 traces, treating every one of the five milestones as if it had
per-season variants (i.e. what writing the remaining seven events buys):

| cohort B | today | after this pilot | all five milestones varied |
|---|---|---|---|
| First verbatim repeat (median) | 13 | 15 | **19** |
| p10 / p90 | 12 / 13 | 12 / 15 | 12 / 19 |
| Careers with a repeat by decision 16 | 100% | 100% | **37.5%** |
| Decisions that re-show a card | 45.0% | 37.5% | **17.5%** |
| Who serves the first repeat | opener (84%) | rivalry (78%) | **`redshirt` hub (51%)** |

Two things fall out of that last row and both matter:

1. **The skeleton is the lever; no single event in it is.** The full set moves the first repeat +6 and
   cuts the by-16 rate from 100% to 37.5% — a change of kind, not of degree. The pilot's +2 is what
   one-fifth of that intervention looks like, and it is sub-linear because the events are queued
   behind each other.
2. **The next binding constraint after the milestones is not content at all.** It is the **hub
   cards** — `Redshirt?`, `Declare for the Draft?`, `Transfer Portal` — whose title and body are
   hard-coded strings in `advance.ts` and are byte-identical every time they are shown. 48.8% of
   careers are asked `Redshirt?` twice (008 §7), and in the counterfactual that hub becomes the first
   verbatim repeat in 74 of 144 cohort-B careers. Cohort C's is `declare`, in 31 of 143. Writing the
   other seven content events without addressing the hubs caps the achievable first-repeat number at
   19 and leaves the most consequential screens in the game as the most repeated ones.

---

## 5. Cohort C, reported separately — does `seasonIndex` actually cover the redshirt?

**Yes, and it is the case `classYear` would have failed.**

| cohort C (n=144, five-season redshirt career) | Before | After |
|---|---|---|
| First verbatim repeat (median) | **17** | **17** |
| — p10 / p90 | 10 / 18 | 10 / 20 |
| — max | 18 | 20 |
| Careers with a repeat by decision 16 | 41.0% | 41.0% |
| Decisions per career (median) | 44 | 44 |
| Decisions that re-show a card | 43.2% | **36.4%** |
| First-repeat attribution | `milestone-opener` 56 | `milestone-rivalry` 45 |

Index histogram: before `[10:18, 11:11, 12:13, 13:17, 17:28, 18:56]` → after
`[10:18, 11:11, 12:13, 13:17, 17:28, 19:11, 20:45]`. The 56 careers whose first repeat was the opener
at decision 18 moved to 19 and 20; **the median did not move at all**, because the distribution's
midpoint sits in the 17 bucket, which is random-event repeats the pilot never touched.

**On the mechanism, which is the question that was asked:**

- `milestone-opener-last` (`seasonIndex: [4]`) fired in **143 of 144** cohort-C careers — every one
  that reached a fifth season. Under class-year gating those 143 careers would have been served a
  verbatim repeat in their final season, because `advance.ts:228-229` caps `classYear` at `SR` and a
  redshirt career runs `FR SO JR SR SR`. **DECISION 042's reasoning is confirmed by measurement, not
  just by argument.**
- **Zero opener cards repeated in any career, in either cohort.** The partition is disjoint and
  exhaustive in practice as well as in the test.
- Cohort C never fires `milestone-opener-no-excuse` (`seasonIndex: [1]`) — under `redshirt: take` the
  offer always lands in season 1, so that season is always sat out. Cohort B never fires
  `milestone-opener-last`, since a four-season career has no season 4. **The two cohorts together
  exercise all five variants; neither alone does.** Worth knowing for any future run.
- The redshirt is never offered before season 1 (`redshirtOffered` needs SO/JR or an active injury),
  so season 0 is always played and `milestone-opener-first` can always honestly say it is the first.

---

## 6. The no-change proof — passed, on every field

`npx tsx src/sim/failure-probe.ts 3000 all QB`, compared field-by-field against `reports/022` §8 (not
§1, not `018` §4).

**All 20 profiles — the nine full-eligibility ones and the eleven early/mixed ones — came back
identical on all seven measured fields: `picked`, `round 1`, `undrafted`, `busted`, `avg stock`,
`avg final OVR`, `avg snaps.`** Not "within rounding" — identical to the fourth decimal place.

Spot-check of the nine full-eligibility rows:

| profile | picked | round 1 | undrafted | busted | avg stock | avg final OVR | avg snaps |
|---|---|---|---|---|---|---|---|
| `good` | 0.9783 | 0.5270 | 0.0000 | 0.0217 | 88.8521 | 90.5530 | 1450.1907 |
| `goodStay` | 0.9670 | 0.5720 | 0.0000 | 0.0330 | 90.2168 | 91.2323 | 1717.8387 |
| `goodUp` | 0.9783 | 0.5270 | 0.0000 | 0.0217 | 88.8521 | 90.5530 | 1450.1907 |
| `randomFull` | 0.9730 | 0.1527 | 0.0003 | 0.0267 | 76.4209 | 82.1457 | 1796.2133 |
| `longStay` | 0.9713 | 0.1667 | 0.0003 | 0.0283 | 76.7407 | 82.2703 | 1846.3633 |
| `longUp` | 0.9747 | 0.1023 | 0.0013 | 0.0240 | 74.0010 | 80.9597 | 1572.6533 |
| `lazyFull` | 0.9840 | 0.0000 | 0.0033 | 0.0127 | 60.2259 | 71.4480 | 1950.5070 |
| `saboteurFull` | 0.9837 | 0.0000 | 0.0033 | 0.0130 | 60.2290 | 71.4487 | 1950.5070 |
| `antisocialFull` | 0.8723 | 0.0517 | 0.0003 | 0.1273 | 74.2227 | 82.8300 | 1934.3927 |

A second, independent check — `npx tsx src/sim/balance.ts 3000 random all`, 18,000 careers — also
matches 022 §8 exactly on all six positions (QB `picked` 0.8343, `undrafted` 0.1517, `round 1`
0.0250, `busted` 0.0140, `avgFinalOverall` 72.9510; K `picked` 0.7913; all six rows identical).

DECISION 042's acceptance gate is met. The variants changed prose and nothing else.

---

## 7. The prose — every word, so it can be read without the diff

Five variants replace one event. All five keep `kind: "fixed"`, `phase: "nonconf"`, `weight: 1`,
`conditions.requiresPlaying: true`, one option `handle-it` / *"Take care of business"* /
`probability: 0.75`, positive effects `[{ snaps: +25 }]` and negative effects
`[{ character: −2 }]` — **byte-identical to what shipped**. A test asserts that directly, so the
no-change proof above cannot be passing for the wrong reason.

**The card being replaced** (42 words total across title, body and two outcomes):

> **Season Opener**
> Ninety thousand people, a noon kickoff, and a cupcake opponent nobody will forgive you for losing to.
> ▸ *Take care of business*
> — Comfortable win. You are out by the fourth quarter.
> — It is 17-14 in the fourth and the boo birds are warming up.

---

### `milestone-opener-first` — `seasonIndex: [0]` · 42 words

> **The First One**
> Everything until now was practice for this. Your hands are cold and it is seventy degrees.
> ▸ *Take care of business*
> — Two snaps in, you are fine. Nobody can tell it was your first.
> — It takes a half to stop feeling like a guest.

### `milestone-opener-no-excuse` — `seasonIndex: [1]` · 40 words

> **No Longer New**
> Last September the nerves were allowed. This year they are just nerves.
> ▸ *Take care of business*
> — You play like a man who has done this before, because you have.
> — You are a step late all afternoon and you know exactly why.

### `milestone-opener-your-team` — `seasonIndex: [2]` · 41 words

> **Your Team Now**
> The young guys watch how you take the field now. You noticed in August.
> ▸ *Take care of business*
> — You set the tone on the first series and the rest follow.
> — You play tight, and tight travels through a room that watches you.

### `milestone-opener-counting` — `seasonIndex: [3]` · 42 words

> **You Start Counting**
> More of these behind you now than ahead. You did that math in June.
> ▸ *Take care of business*
> — You play like a man not wasting one, and it looks like it.
> — Playing like every rep matters is not the same as playing well.

### `milestone-opener-last` — `seasonIndex: [4]` · 42 words

> **The Last One**
> Last one of these you get. Everybody in the building has mentioned it. Repeatedly.
> ▸ *Take care of business*
> — You are not sentimental about it until the second half. Then you are.
> — You spend the whole first half trying to feel something about it.

### The constraints these were written against, and how each is enforced

- **No crowd size, venue or stature** (DECISION 043 item 1). Nothing here asserts anything a Group of
  Five or FCS school does not have: cold hands, a warm September, young guys watching, arithmetic
  done in June, everybody in the building saying the same thing. A test greps the variants for a
  forbidden vocabulary (*stadium, sellout, sold out, capacity, thousand, packed house, nationally
  televised, primetime, the whole country, blue blood, powerhouse, playoff,* conference names) and
  fails on a hit.
- **No class year named.** Each names the *stage*: the first one ever, the one where the excuse is
  gone, the one where the room watches you, the one where you have started counting, the last one.
  A test asserts no variant contains *freshman / sophomore / junior / senior / redshirt.*
- **`The Last One` is the only variant that claims finality**, and it is safe to: season 4 is only
  reachable when a redshirt has been used, and the eligibility cap is then five, so it is always a
  final season. Recorded in a comment at the event.
- **Length.** 40–42 words each against the replaced card's 42. Not one variant is longer than what it
  replaces; a test enforces the ≤ 42 ceiling. Length was never the fix.
- **Titles vary**, which is deliberate — the heading is the first thing a skimming player
  re-recognises, and on the real card it is the line that says "this is not the card you read last
  year" before the body is reached at all.

---

### The other two DECISION 043 defects

**Item 2 — third person on a second-person screen.** `milestones.ts:152` was the only slip in the
file; the whole file was swept, prose and moment items alike, and there were no others. There is now
a test that fails on any third-person pronoun anywhere in `MILESTONE_EVENTS` — titles, bodies, option
labels, outcome descriptions and moment items — so it cannot come back quietly.

**Item 3 — the congratulatory moment on a failed career's end screen.** Same line. Not deleted, per
043: it fires for everyone who picks `enjoy`, including players genuinely enjoying a bowl trip, and
an option with no effects is a worse card. The effect list keeps its shape (one `moment`, icon
unchanged at `sun`); only the wording moves.

| | |
|---|---|
| before | `Had the time of his life at a bowl game` |
| after | `Enjoyed the bowl trip more than the bowl game` |

It is now a description of a trip rather than a citation for an achievement, it reads the same way
whether the career ended in round 1 or undrafted, and the joke is the player's own. Wry, not
punishing, as 043 asked.

---

## 8. Verification

| | |
|---|---|
| `npm test` | **613 passed, 38 files** (578 before + 20 harness + 6 engine/schema + 9 milestone) |
| `npm run typecheck` | **both passes exit 0** |
| `npm run build` | **exit 0**, clean |
| `reports/022` §8 nine-profile proof | **identical on every field** (§6) |
| `balance.ts 3000 random all` | **identical on every field** (§6) |
| Read on the real card at `localhost:5173` | **4 of 5** — see below |

**On the card.** One career played through at the real type scale, seasons 1–4: **The First One**,
**No Longer New**, **Your Team Now** and **You Start Counting** all render as intended — the body
wraps to two lines at most, the heading carries, and the change is legible *as a change* the moment
the second one arrives, which is the whole point. The reworded bowl moment was exercised by taking
`Enjoy the trip`.

**`The Last One` was not read on the card**, and that is an honest gap: it needs a five-season
redshirt career, which is ~40 clicks past where the run ended. It is structurally identical to the
four that were read (same component, same option shape, 14-word body against bodies of 16, 12, 14 and
14 that all rendered correctly), and its text is above for the PM to read. Flagging it rather than
implying it was checked.

---

## 9. What the brief got wrong, and one thing it got right that is worth saying

1. **"Careers with a repeat by decision 16 — 99.3%" is a dead gate row.** It measures 100.0% on
   cohort B, it cannot go up, and the pilot leaves it at 100.0%. As a gate it can only ever report
   failure-to-improve, which it does — but it was listed as a reproduction target, and the 0.7-point
   gap against 008 is cohort-composition noise, not drift.
2. **"The opener is 62% of first repeats"** is 008's pooled figure. In cohort B alone it is **84%**
   (121/144). The brief understated the pilot's own best case; the number still moved only +2.
3. **The "at most one milestone per phase" invariant has a pre-existing exception** the brief did not
   mention: a true freshman's offseason has none, because Fall Camp is `minClass: "SO"`. Deliberate,
   but the generalised test had to be written as *at most* one, and that is now documented in the
   test rather than discovered again later.
4. **Cohort C, as specified, never exercises the `seasonIndex: [1]` variant** — `redshirt: take`
   always lands the sit season in season 1. Neither cohort alone covers all five variants; both
   together do. Any future run of this gate should use both for that reason and not only for the
   class-year one.
5. **The brief got the ordering exactly right.** Building the harness first, validating the card key
   against the id key on unmodified content, and only then writing prose is what makes the +2 above
   trustworthy. Had the key been the event id, this report would have said the first repeat moved
   from 13 to "never" and the other seven events would have been approved on a number that measured
   nothing but the fact that five new ids exist.

---

## 10. The decision this hands back

DECISION 030's "what would change our mind" clause reads: *the harness showing the first-repeat
number barely moves.* It moved from 13 to 15 — one past the brief's own refutation threshold, with
the by-16 rate flat at 100% and cohort C's median flat at 17. **That is the fired clause, or very
close to it, and it is being reported as such rather than argued up.**

Three ways forward, with what each costs and buys:

**A. Stop. Do not write the other seven.** Takes 030's clause at its word. *Buys:* the phase's
largest authoring budget back, and the pilot's own gains (−7.5 pts of re-showing, the three 043
defects, a committed harness) are kept regardless. *Costs:* leaves 37.5% of every career as re-read
cards and every career hitting a verbatim repeat by decision 16. *Risk:* it reads the +2 as evidence
that variants do not work, when the measurement says something narrower — that variants do not work
**one event at a time**.

**B. Write all seven, as one batch, then re-run this harness.** *Buys:* the counterfactual says
first repeat 13 → **19**, by-16 rate 100% → **37.5%**, re-showing 45% → **17.5%**. That is a change
of kind. *Costs:* the phase's largest authoring budget, spent before the next measurement. *Risk:*
the counterfactual is analytic, not played — it assumes seven more sets of variants land as cleanly
as this one did, and it assumes the skimming premise (volume, not onset) that DECISION 030 flagged as
untested and this report still cannot settle.

**C. Write the seven *and* the three hub cards.** The hubs are `advance.ts` string literals, not
content, so this needs a new decision — but they are what the wall becomes at step B, they are the
most consequential screens in the game, and 48.8% of careers see `Redshirt?` twice. *Buys:* removes
the constraint that caps B at 19. *Costs:* B's cost plus an engine change and the decision to
authorise it.

**Recommendation: B, with C scoped alongside it rather than after it.** The pilot did not refute
variants; it measured that the skeleton behaves as a queue, and a queue is only shortened by
emptying it. Spending the budget on seven more events while knowingly leaving the hubs to inherit
the wall would repeat this report's finding at a much higher price. If the user wants a cheaper
answer first, the honest next measurement is not more content — it is a playtest that establishes
whether skimming is triggered by the first repeat or trained by the cumulative dose, because **A and
B are the right answers under different answers to that one question**, and it is the only input this
harness cannot supply.

---

*No commits. `src/engine/**` changes are exactly DECISION 042's four. `src/content/**` changes are
confined to `milestones.ts`. The UI was not touched.*
