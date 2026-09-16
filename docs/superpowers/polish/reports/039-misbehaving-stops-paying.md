# 039 — Misbehaving stops paying, and the honour starts discriminating

**Type:** developer (content, under an explicit freeze lift) · **Wave:** 19 · **Status:** done —
**both changes implemented as specified; acceptance 2 MISSES outright, acceptance 1 and 3 miss in
part. Nothing was tuned.**
**2026-09-15** · **Careers measured:** 144,000 (2 profiles × 6 positions × 3,000 × 4 trees, seed
prefix `b037`, home state TX — the same seeds as report 037, so every number below is comparable to it)
**Changed in the repo:** `src/content/events/offfield.ts` (4 line deletions),
`src/content/postseason.ts` (1 line), `src/ui/session/view-model.test.ts` (one pinned assertion
re-baselined). **Nothing in `src/engine/**`.**

---

## Headline

| | |
|---|---|
| Change 1, as specified | Done. **4 line deletions**, not 14 — see §1, this is a fact about the content, not a shortfall |
| Change 2, as specified | Done. `allAmerican` bands are now `92→0.6, 88→0.4, 85→0.25, 80→0.12, 75→0.04`, exactly 037 §P3's shape |
| **Acceptance 2 — `good` stops cheating** | **MISS. `good`'s median character is 41 before and 41 after, at every position. It did not move by a single point.** |
| Why it missed | `good` picks the **identical option on all 13 off-field cards** after the change. The four edited options' EV draft stock fell — `let-it-fly` +0.71→+0.29, `sell-them` +0.68→+0.12 — but **all four stayed above the clean option's 0.00**, so nothing flipped. Proof in §2 |
| What change 1 did instead | It took ~2 points of overall off `good` **without changing a single decision**. A pure nerf to the optimiser's rating, not a change in its behaviour |
| **Acceptance 3 — the honour discriminates** | **Split. In ratio, yes: QB 1.37× → 1.66×, and every position improved. In percentage points, no: QB +19.6pp → +20.2pp, and the gap *shrank* at four of six positions** |
| **Acceptance 1 — a well-played career stays safe** | **Undrafted passes cleanly (≤0.5% everywhere). Round 1 does not: it fell at all six positions, 3.8–6.8pp, and `good`'s median round went 1 → 2 at QB and OL** |
| **Acceptance 4 — nothing zeroed** | **Non-zero, but K is now thin: `good` K All-American 5.6% → 3.2%. OL is 15.0% → 10.3%.** Reported, not fixed |
| The one-line answer | **Change 2 did its job and costs more than the brief priced. Change 1 did not do its job at all — it lowered the payout of the cheat without lowering it below the price of honesty, so the optimiser still cheats and is now simply worse at football for it.** |

---

## 1. What was changed, exactly

### Change 1 — `src/content/events/offfield.ts`, four deletions

**The brief says "in each of the 14 paired blocks… remove the `overall` gain from the
`negativeOutcome` branches only." Only 4 of those 14 blocks are `negativeOutcome` branches.** This is
not a reading of the brief against its intent — it is 037 §2's own table, which lists 14 rows of
which exactly four are marked `negative`. The other ten are `positive` branches the brief explicitly
says to leave alone. So the instruction resolves to four edits, and four is what was made:

| event | option | branch | was | now |
|---|---|---|---|---|
| `offfield-group-chat` | `let-it-fly` | negative (p 0.30) | −6 char, **+1 ovr** | −6 char |
| `offfield-money-manager` | `let-him-handle-it` | negative (p 0.40) | −5 char, **+1 ovr** | −5 char |
| `offfield-sportsbook-nil` | `take-the-money` | negative (p 0.30) | −7 char, **+1 ovr** | −7 char |
| `offfield-ticket-hookup` | `sell-them` | negative (p 0.40) | −6 char, **+1 ovr** | −6 char |

Every `character` amount is untouched on both branches. Every `positiveOutcome` is untouched. No
other event, option, probability, weight or description was edited. The asymmetry the brief asked
for is exactly what is in the file: get away with it and you still gain, get caught and you only pay.

A sweep of the whole file confirms no fifth case was missed: the only remaining `overall` gains
inside a `negativeOutcome` in `offfield.ts` are the two **−3** penalties on `clear-the-room` and
`kill-it-yourself`, which are losses on clean options, and the deferred −3 on `own-it-monday`.

### Change 2 — `src/content/postseason.ts`, one line

```
- { id: "allAmerican", bands: [{ min: 85, prob: 0.6 }, { min: 80, prob: 0.3 }, { min: 75, prob: 0.1 }], ... }
+ { id: "allAmerican", bands: [{ min: 92, prob: 0.6 }, { min: 88, prob: 0.4 }, { min: 85, prob: 0.25 }, { min: 80, prob: 0.12 }, { min: 75, prob: 0.04 }], ... }
```

037 §P3's suggested shape, verbatim, in Heisman's idiom (Heisman sits directly above it at
`92→0.5, 88→0.25, 84→0.08`). No constant was searched for, adjusted, or re-tried.

### The one test that moved, and why

`src/ui/session/view-model.test.ts` — *"row 2 — The Ticket Hookup: getting caught is a +1 AND a
cost"* asserted `own: 1` on the caught branch of `sell-them`. That is precisely the number change 1
deletes. It is re-baselined to `own: 0`, renamed *"getting caught is a cost and nothing else"*, and
its comment now records that the got-away-with-it branch still pays +1 so the card stays a gamble.
**This is the only assertion in 671 that these changes moved.** Nothing else was touched.

---

## 2. Acceptance 2 — MISS. `good`'s median character did not move at all

**The headline number the brief asked for, per position, before → after:**

| pos | `good` median final character | band |
|---|---|---|
| QB | **41 → 41** | *a problem they are managing* → *a problem they are managing* |
| OSKILL | **41 → 41** | unchanged |
| OL | **40 → 40** | unchanged |
| DL | **42 → 42** | unchanged |
| DSKILL | **41 → 41** | unchanged |
| K | **44 → 44** | unchanged |

The means do not move either (QB 40.9 → 40.9), and the band shares are identical to a tenth of a
point (QB *a problem they are managing* 58.0% → 58.0%, *the staff has stopped defending you*
17.0% → 17.1%). This is not a small movement that failed to cross a band edge. **It is no movement.**

### Why — the decision table, computed directly from the shipped content

`optionScore` (the `good` policy's own scorer) over all 13 off-field cards, QB, both trees:

| off-field event | `good` picks, HEAD | `good` picks, after | corrosive option's EV stock, HEAD → after | clean option |
|---|---|---|---|---|
| `offfield-group-chat` | **let-it-fly** | **let-it-fly** | +0.71 → **+0.29** | 0.00 |
| `offfield-money-manager` | **let-him-handle-it** | **let-him-handle-it** | +1.58 → **+1.02** | 0.00 |
| `offfield-sportsbook-nil` | **take-the-money** | **take-the-money** | +1.54 → **+1.12** | 0.00 |
| `offfield-skip-install` | skip-the-podcast | skip-the-podcast | −0.18 (unchanged) | 0.00 |
| `offfield-training-table` | wait-your-turn | wait-your-turn | −0.60 (unchanged) | 0.00 |
| `offfield-ticket-hookup` | **sell-them** | **sell-them** | +0.68 → **+0.12** | 0.00 |
| `offfield-bowl-curfew` | stay-in | stay-in | −0.53 (unchanged) | 0.00 |
| `offfield-ghost-media` | **no-show** | **no-show** | +0.12 (unchanged) | 0.00 |
| `offfield-entourage` | **ride-it-out** (−3 char) | **ride-it-out** | −0.45 (unchanged) | −3.19 |
| `offfield-portal-rumor` | **let-it-work** (−8.45 char) | **let-it-work** | +0.27 (unchanged) | −3.22 |
| `offfield-coordinator-blowup` | apologize-on-tape | apologize-on-tape | −1.39 (unchanged) | +0.98 |
| `offfield-curfew-check` | **ride-it-out** (−3 char) | **ride-it-out** | −0.45 (unchanged) | −3.12 |
| `offfield-exit-interview` | **ride-it-out** (−3 char) | **ride-it-out** | −0.45 (unchanged) | −3.12 |

**Thirteen cards, thirteen identical picks. `good` still takes a character-losing branch on 9 of 13,
including `let-it-work` at EV −8.45 character.** The change moved four EVs down and flipped none of
them, because the four negative branches carry only 30–40% of the probability mass and one point of
overall each: the most the edit can remove from an option's EV stock is `0.40 × 1 × 1.4 = 0.56`, and
the smallest HEAD margin over the clean option among the four was `sell-them`'s +0.68.

**The two nearest misses are `sell-them` at +0.12 and `no-show` at +0.12** — and `no-show` was not
even edited, because its caught branch never paid overall. I am recording those margins as
diagnosis, not as a proposal: **what number would flip them is the user's to choose, and I did not
search for one.**

### The finding inside the miss, and it is the one worth carrying forward

Change 1, in the shape chosen, is **not a behaviour change at all — it is a rating cut applied to
the unchanged behaviour.** Measured with change 1 alone, on an otherwise pristine HEAD tree:

| pos | `good` OVR P50, HEAD → change-1-only | `good` round 1, HEAD → change-1-only | `good` character P50 |
|---|---|---|---|
| QB | 92 → **90** | 50.0% → **45.4%** | 41 → 41 |
| OSKILL | 91 → **90** | 46.1% → **41.9%** | 41 → 41 |
| OL | 93 → **92** | 48.7% → **43.6%** | 40 → 40 |
| DL | 91 → **90** | 43.2% → **38.8%** | 42 → 42 |
| DSKILL | 91 → **90** | 45.9% → **41.2%** | 41 → 41 |
| K | 92 → **91** | 26.0% → **22.4%** | 44 → 44 |

The optimiser goes on paying the character price at the same rate and now collects less overall for
it. That is a coherent thing to want — the cheat is priced closer to honestly — but it is **not**
what acceptance 2 asked for, and it should not be read as progress toward it. The brief's prediction
(*"it should stop taking those branches as reliably"*) is falsified: it takes them exactly as
reliably.

---

## 3. The full re-measurement, per position

`good` vs `humanLazyAmbitious`, 3,000 careers each, seed prefix `b037`. `humanLazyAmbitious` differs
from `good` **only** in the event strategy, so every gap below is the event strategy's doing.

### `good`

| pos | undrafted | busted | round 1 | median round | OVR P50 | **All-American** | All-Conference | **char P50** |
|---|---|---|---|---|---|---|---|---|
| QB | 0.2% → **0.2%** | 2.7% → 3.0% | 50.0% → **43.2%** | 1 → **2** | 92 → **90** | 72.2% → **50.9%** | 62.1% → 61.8% | 41 → **41** |
| OSKILL | 0.3% → **0.4%** | 3.1% → 3.2% | 46.1% → **40.4%** | 2 → 2 | 91 → **90** | 61.3% → **42.0%** | 63.1% → 63.6% | 41 → **41** |
| OL | 0.0% → **0.1%** | 2.8% → 2.7% | 48.7% → **43.2%** | 1 → **2** | 93 → **92** | 15.0% → **10.3%** | 59.6% → 59.6% | 40 → **40** |
| DL | 0.3% → **0.5%** | 3.1% → 3.3% | 43.2% → **37.8%** | 2 → 2 | 91 → **90** | 37.0% → **24.1%** | 57.2% → 57.8% | 42 → **42** |
| DSKILL | 0.3% → **0.4%** | 2.9% → 2.9% | 45.9% → **40.3%** | 2 → 2 | 91 → **90** | 37.9% → **25.5%** | 60.9% → 59.7% | 41 → **41** |
| K | 0.4% → **0.5%** | 7.2% → 7.2% | 26.0% → **22.2%** | 3 → 3 | 92 → **91** | 5.6% → **3.2%** | 49.5% → 49.6% | 44 → **44** |

### `humanLazyAmbitious`

| pos | undrafted | busted | round 1 | median round | OVR P50 | **All-American** | All-Conference | char P50 |
|---|---|---|---|---|---|---|---|---|
| QB | 0.5% → 0.5% | 25.5% → 25.6% | 19.0% → 15.0% | 3 → 3 | 87 → 86 | 52.6% → **30.7%** | 72.9% → 73.6% | 7 → 7 |
| OSKILL | 0.2% → 0.3% | 25.1% → 24.7% | 14.7% → 11.6% | 3 → 3 | 86 → 85 | 42.0% → **23.9%** | 77.5% → 78.4% | 5 → 5 |
| OL | 0.2% → 0.2% | 28.3% → 28.5% | 15.2% → 12.0% | 3 → 3 | 87 → 87 | 10.3% → **6.0%** | 71.6% → 71.7% | 4 → 5 |
| DL | 0.2% → 0.4% | 24.4% → 24.8% | 12.4% → 9.7% | 3 → 3 | 87 → 86 | 24.8% → **12.6%** | 71.9% → 71.6% | 6 → 6 |
| DSKILL | 0.3% → 0.6% | 24.7% → 24.8% | 14.9% → 11.9% | 3 → 3 | 87 → 86 | 25.9% → **14.7%** | 75.4% → 75.2% | 6 → 6 |
| K | 1.0% → 1.4% | 25.9% → 25.8% | 4.5% → 4.0% | 4 → 4 | 88 → 87 | 4.2% → **2.2%** | 63.7% → 64.1% | 6 → 6 |

All-Conference moves by at most 1.2pp anywhere, in either direction: it is a snaps award and neither
change touches snaps, exactly as 037 §4 predicted.

### Which change caused what — isolated on separate pristine trees

`good`, four trees: HEAD, change 1 alone, change 2 alone, both.

| pos | metric | HEAD | c1 only | c2 only | both |
|---|---|---|---|---|---|
| QB | All-American | 72.2% | 67.8% | **55.7%** | 50.9% |
| QB | round 1 | 50.0% | **45.4%** | 47.9% | 43.2% |
| QB | OVR P50 | 92 | **90** | 91 | 90 |
| QB | char P50 | 41 | **41** | 41 | 41 |
| OL | All-American | 15.0% | 14.4% | **10.6%** | 10.3% |
| OL | round 1 | 48.7% | **43.6%** | 48.0% | 43.2% |
| K | All-American | 5.6% | 5.2% | **3.6%** | 3.2% |
| K | round 1 | 26.0% | **22.4%** | 25.8% | 22.2% |

**The All-American reduction is change 2's; the round-1 reduction is mostly change 1's.** Change 1
costs round 1 by taking overall directly; change 2 costs it indirectly, through `awards.length × 3`
in `deriveDraftStock`. They compound.

---

## 4. Acceptance, stated per position and honestly

### 1. A well-played career stays safe — **PASS on the hard disqualifier, MISS on round 1**

**Undrafted, `good`, after: QB 0.2% · OSKILL 0.4% · OL 0.1% · DL 0.5% · DSKILL 0.4% · K 0.5%.**
All ≤1%, all within 0.2pp of HEAD. The hard disqualifier does not fire, at any position. Bust rates
move by ≤0.3pp. Average seasons are unchanged to two decimals. **A well-played career is not
failing.**

**Round 1 is a different story and I am not going to soften it:**

| pos | round 1 | round 1–2 | round 6–7 | median round | median overall pick |
|---|---|---|---|---|---|
| QB | 50.0% → **43.2%** (−6.8pp, −14% rel.) | 63.5% → 57.0% | 4.4% → 5.5% | **1 → 2** | 32 → **44** |
| OSKILL | 46.1% → **40.4%** (−5.7pp) | 62.0% → 54.8% | 3.0% → 4.2% | 2 → 2 | 37 → **50** |
| OL | 48.7% → **43.2%** (−5.5pp) | 65.3% → 60.9% | 2.3% → 3.5% | **1 → 2** | 32 → **42** |
| DL | 43.2% → **37.8%** (−5.4pp) | 59.9% → 54.3% | 3.3% → 4.4% | 2 → 2 | 43 → **52** |
| DSKILL | 45.9% → **40.3%** (−5.6pp) | 62.1% → 55.7% | 3.6% → 4.8% | 2 → 2 | 37 → **49** |
| K | 26.0% → **22.2%** (−3.8pp) | 45.2% → 40.4% | 5.5% → 6.9% | 3 → 3 | 66 → **75** |

**Whether −5.5pp and a median round of 1 → 2 at QB and OL is "material" is the user's call, not
mine — so I am reporting it as a miss and stopping.** My read: the median-round move is the one a
playtester will feel, because the round is the number on the final screen and *"a perfectly played
QB is now typically a second-rounder"* is a sentence someone will write in a playtest log. Note that
**this is mostly change 1's doing, not change 2's** (§3 isolation), which makes it the cost of a
change that bought no behaviour change.

### 2. `good` stops cheating — **MISS, outright.** §2. Before **41**, after **41**, at every position. No band moved.

### 3. The honour discriminates — **PASS in ratio, MISS in percentage points**

| pos | HEAD `good` vs `hLazy` | ratio | after `good` vs `hLazy` | ratio | gap in pp |
|---|---|---|---|---|---|
| QB | 72.2% vs 52.6% | 1.37× | 50.9% vs 30.7% | **1.66×** | +19.6 → **+20.2** |
| OSKILL | 61.3% vs 42.0% | 1.46× | 42.0% vs 23.9% | **1.76×** | +19.3 → **+18.2** |
| OL | 15.0% vs 10.3% | 1.46× | 10.3% vs 6.0% | **1.73×** | +4.7 → **+4.4** |
| DL | 37.0% vs 24.8% | 1.49× | 24.1% vs 12.6% | **1.91×** | +12.2 → **+11.5** |
| DSKILL | 37.9% vs 25.9% | 1.46× | 25.5% vs 14.7% | **1.74×** | +12.0 → **+10.9** |
| K | 5.6% vs 4.2% | 1.34× | 3.2% vs 2.2% | **1.43×** | +1.4 → **+1.0** |

**Every position's ratio improved, and at four of six the percentage-point gap got smaller.** Both
statements are true and they are not in tension: the band table lowered both rates, and it lowered
the bad player's by proportionally more, which is exactly what "discriminates above 85" means. The
brief's own phrasing — *"beat a bad one's by materially more than today's 72.2% vs 52.6%"* — reads
most naturally as the pp gap, and on that reading it **misses**. On the ratio reading it passes
comfortably. **Flagging the ambiguity rather than picking the reading that lets me claim a pass.**

**The honour still does not go to the better career in the aggregate**, because All-Conference is
untouched: `humanLazyAmbitious` still ends with **more** total awards than `good` at five of six
positions (`anyAward`, after: OSKILL 82.9% vs 79.3%, OL 73.4% vs 65.3%, DL 75.5% vs 69.3%, DSKILL
78.8% vs 71.2%, K 64.9% vs 51.7%). QB is now a tie at 80.7% vs 80.7%, up from 84.2% vs 87.5% — that
is the only position where the change flipped the sign. **The playtester's actual sentence —
"I finished with an All-American" — is addressed; the adjacent one — "and more trophies than a good
career" — is not, and could not be by either of these changes.**

### 4. Nothing is zeroed — **PASS on the letter, FLAGGED on K**

| pos | `good` All-American | `humanLazyAmbitious` All-American |
|---|---|---|
| OL (×0.15) | 15.0% → **10.3%** | 10.3% → **6.0%** |
| K (×0.05) | 5.6% → **3.2%** | 4.2% → **2.2%** |

Neither is near zero in the arithmetic sense, and both keep a working ratio (OL 1.73×, K 1.43×). But
**a perfectly played kicker now earns an All-American in about 1 career in 31, down from 1 in 18.**
Whether that is "non-trivial" is a judgement about what a K career is meant to feel like, and per the
brief I am stopping at reporting it rather than fixing it. For scale: a K season at overall 92+ draws
`0.6 × 0.05 = 0.030` both before and after — **the ceiling is untouched** — while a season at 85–87
drew `0.6 × 0.05 = 0.030` and now draws `0.25 × 0.05 = 0.0125`, a 58% cut. That shoulder is where a
large share of K seasons sit. **The rungs did not hurt K's ceiling; they hurt its shoulder.**

Heisman is untouched by construction and confirms the measurement is clean: `good` QB 41.5% → 37.8%,
moving only through the small overall drop change 1 causes.

---

## 5. What I did not do

- **I did not tune.** Both constants are exactly what the brief specified: the four deletions, and
  037 §P3's band shape verbatim. No value was tried and replaced. The margins in §2 are reported as
  diagnosis of *why* acceptance 2 missed, and deliberately **not** turned into a recommended number.
- **I did not touch `src/engine/**`,** and in `src/content/**` I touched only the two files the
  freeze lift names.
- **I did not fix the round-1 drop or K's thinner All-American.** Both are reported for the user.
- **I did not commit.** No `git checkout`, `git restore` or `git stash` was run. Working tree
  contains the change for the PM.

---

## 6. `npm run play` baselines — moved, and a correction

Bit-identity moves by construction here (DECISION 040 precedent), and it did. **Two things to record:**

1. **The md5s written in `STATE.md` §8 were already stale before this brief.** `STATE.md` records
   `24 random cd2d3895…`, `77 random 7d6ee0df…`, `101 random f2ffe2b5…`. Measured on a pristine
   `git archive` of HEAD (`f345e1a`), those seeds actually hash to `6ef539d4…`, `5c2066ec…` and
   `4930e622…`. Something between the recorded wave and HEAD moved them without the note being
   updated. **Flagging rather than absorbing — this is a bookkeeping defect in `STATE.md`, not in
   this work.**
2. **New baselines after this brief's changes:**

| seed | policy | HEAD (`f345e1a`) | after 039 |
|---|---|---|---|
| 24 | random | `6ef539d4ff71aa7637672aa09abd4292` | **`59da6b803bf76655b5279c99342c815d`** |
| 77 | random | `5c2066ec5023c158267406285db3d35e` | **`791b3ceba6e191ac8055f4b3a9a13e47`** |
| 101 | random | `4930e62258eb61aaede71b328ce4ee61` | **`4930e62258eb61aaede71b328ce4ee61`** (unchanged — that career draws none of the four edited branches and never crosses a new band edge) |

Measured with `npx tsx src/sim/play-headless.ts <seed> random | md5`, per `STATE.md`'s own gotcha
about npm's banner polluting stdout. Spot-checked `demo` and `b037-seed-A` on `first` and `random`
as well: three of four identical, `demo/first` differs — consistent with a targeted content change.

---

## 7. Verification

- **`npm test` — 671 passed, 39 files, 0 failed.** Same count as HEAD. One assertion was
  re-baselined (§1) and it is the only one these changes moved; no test was skipped, deleted or
  loosened.
- **`npm run typecheck` — both passes exit 0** (`tsconfig.engine.json`, then `tsconfig.json`).
- **`npm run build` — clean**, 83 modules, `dist/assets/index-DLaJltE3.js` 393.79 kB.
- **Method.** Four trees, all from `git archive HEAD` into a scratch dir with `node_modules`
  symlinked, so nothing outside the working tree was modified: HEAD, HEAD+change 1, HEAD+change 2,
  and the working tree. Every probe run used the committed
  `npx tsx src/sim/human-lazy-probe.ts 3000 good,humanLazyAmbitious all`, seed prefix `b037`, home
  state TX — **the same seeds report 037 used**, so §3's "before" columns reproduce 037 §3 exactly
  where they should (QB `good` 72.2% / `hLazy` 52.6% All-American, both matched to the tenth) and
  the comparison is like-for-like.
- **The decision table in §2** was produced by calling the shipped `optionScore` /
  `optionCharacterScore` from `src/sim/policies.ts` against each tree's own `OFFFIELD_EVENTS`, so it
  is the policy's real scorer and not a re-derivation of it.
- **Reproduce:** `npx tsx src/sim/human-lazy-probe.ts 3000 good,humanLazyAmbitious all` (~20s,
  36,000 careers).

---

## 8. For the user — the decision this leaves open

Stated plainly, because the brief says reporting a miss is the successful outcome:

**Change 2 works.** The honour now reads the rating: every position's good-vs-bad ratio improved, no
position is zeroed, and it cost round 1 about 2pp. If it stood alone it would be a clean win with a
priced cost.

**Change 1, in the shape chosen, does not do what it was chosen to do.** The measured result is that
`good` makes the identical thirteen decisions and ends with the identical character, ~2 points worse
at football. The asymmetry the user chose — keep the gamble alive — is what makes it so: leaving the
gain on the 55–70% branch leaves the whole option net-positive, and `good` only responds to the
sign. The four remaining options clear the clean option by +0.12 to +1.12 EV stock.

**Three things the user could decide next, none of which I have done or costed as a recommendation:**
accept change 1 as a rating-price change and drop acceptance 2 as the wrong goal for this shape;
revisit the shape (037 §P1's other half — moving the gain to the clean branch — was the alternative
that would flip picks); or reprice character (037 §P2), which flips all four without touching the
content but re-opens DECISION 058, as 037 already warned.

**And one to weigh against all of them:** the round-1 cost measured here is mostly change 1's, and
change 1 bought no behaviour change. If change 1 is reshaped or dropped, `good`'s round 1 comes back
to within ~2pp of HEAD and the median round returns to 1 at QB and OL, while change 2's
discrimination is kept.
