# 046 — B43: is the redshirt actually a free yes, and what would make it a decision?

**Type:** measurement + proposal · **Wave:** 23 · **Status:** Part 1 + Part 2 complete
**Nothing in `src/` was edited.** All prototyping happened in a detached worktree that was removed.

---

## Headline

**No. Taking the redshirt is not strictly better, and it is not free.** It is a real fork with a real
price — but the price is not the one the card describes, it is not paid at the moment it is decided,
and it is invisible in every number the player is shown. The two playtesters are reporting a **telling**
failure accurately and diagnosing it as an **economy** failure incorrectly.

Three separate findings, in descending order of how much they should change the plan:

1. **There is an unconditional trapdoor.** A player whose freshman season was wiped out by injury
   (~1% of careers) and who then takes the redshirt is **busted 100% of the time**, at the end of the
   sit season, for "Buried on the depth chart". The same player who declines gets drafted 95–98% of the
   time. The sit season is counted as a *buried* season by `enterOffseason`'s consecutive-seasons
   check. This is a bug, not a balance number, and it fires on precisely the archetype the redshirt
   fiction is written for.
2. **The real trade is ceiling-for-floor, and it is never stated.** Taking roughly **doubles the
   round-1 rate** and **raises the bust rate 2–4×**. The extra season is another year of exposure.
   For a badly-played career the trade is strongly negative: `humanLazy` drafted 80.7% declining vs
   **65.6%** taking.
3. **The advertised stake is fake.** The card says a sit season is "a year of reps you did not get".
   Measured, a sit season costs **exactly 0 overall** — median *and* mean `seasonOverallDelta` of
   0.00 across every position and strategy tested.

---

## Part 1 — is it a free yes?

### Method and sample size

A/B on the `redshirt` field of `PolicyProfile` alone, everything else held fixed, **same
`seedPrefix`** so the two arms are paired (the take arm and the decline arm play the same seeds,
which removes most of the between-arm variance).

- **n = 5,000 careers per cell**, 6 positions × 2 event strategies × 2 arms = 120,000 careers.
  At p≈0.2–0.5 a single cell's SE is 0.6–0.7pp; paired seeds put the *difference's* effective SE well
  under 1pp, so the 1–2pp resolution the brief asked for is met with room to spare. The effects that
  matter here are 5–17pp, an order of magnitude above the noise floor.
- Strategies: `best` (the `good`-style optimiser: `events: best`, `highestTier`, `transfer: up`) and
  `random` (the `baselineRandom` house baseline). Later cells add `humanLazy`, `antisocial`, `lazy`.
- `homeState: "TX"` for the main table (matches every recorded baseline); a separate 6-state sweep
  below checks whether state changes the sign.

### The table (n = 5,000 per row)

| strategy | pos | redshirt | drafted% | undrafted% | **round1%** | allConf% | avgSeasons | avgFinalOverall | busted% | washout% |
|---|---|---|---|---|---|---|---|---|---|---|
| best | QB | **take** | 98.06 | 0.50 | **38.58** | 61.24 | 4.946 | 86.78 | 1.94 | 1.46 |
| best | QB | decline | 99.46 | 0.72 | 21.84 | 60.42 | 3.988 | 84.47 | 0.54 | 0.02 |
| best | OSKILL | **take** | 97.92 | 0.36 | **35.78** | 60.84 | 4.945 | 86.61 | 2.08 | 1.56 |
| best | OSKILL | decline | 99.34 | 0.54 | 19.84 | 60.70 | 3.986 | 84.35 | 0.66 | 0.08 |
| best | OL | **take** | 97.54 | 0.22 | **40.48** | 57.90 | 4.929 | 87.85 | 2.46 | 1.76 |
| best | OL | decline | 99.26 | 0.24 | 24.36 | 57.98 | 3.985 | 85.85 | 0.74 | 0.10 |
| best | DL | **take** | 98.08 | 0.40 | **33.36** | 55.68 | 4.947 | 86.69 | 1.92 | 1.52 |
| best | DL | decline | 99.24 | 0.52 | 19.06 | 55.54 | 3.985 | 84.68 | 0.76 | 0.10 |
| best | DSKILL | **take** | 97.80 | 0.42 | **36.08** | 59.52 | 4.943 | 86.92 | 2.20 | 1.64 |
| best | DSKILL | decline | 99.20 | 0.32 | 19.06 | 60.02 | 3.985 | 84.73 | 0.80 | 0.10 |
| best | K | **take** | 95.06 | 0.60 | **21.08** | 48.92 | 4.879 | 87.13 | 4.94 | 4.38 |
| best | K | decline | 99.42 | 0.94 | 7.58 | 49.44 | 3.989 | 85.25 | 0.58 | 0.08 |
| random | QB | **take** | 91.92 | 3.30 | **11.96** | 75.64 | 4.875 | 81.14 | 8.08 | 1.70 |
| random | QB | decline | 96.28 | 3.18 | 4.80 | 76.58 | 3.958 | 79.48 | 3.72 | 0.04 |
| random | OSKILL | **take** | 91.64 | 3.40 | **9.46** | 76.86 | 4.871 | 80.80 | 8.36 | 2.02 |
| random | OSKILL | decline | 96.36 | 3.54 | 2.54 | 79.20 | 3.958 | 78.88 | 3.64 | 0.04 |
| random | OL | **take** | 90.48 | 2.20 | **12.10** | 75.60 | 4.855 | 81.91 | 9.52 | 1.64 |
| random | OL | decline | 96.66 | 1.92 | 5.02 | 77.24 | 3.962 | 80.41 | 3.34 | 0.02 |
| random | DL | **take** | 92.08 | 3.04 | **8.76** | 73.74 | 4.879 | 81.01 | 7.92 | 1.36 |
| random | DL | decline | 96.92 | 2.92 | 3.28 | 72.90 | 3.967 | 79.49 | 3.08 | 0.02 |
| random | DSKILL | **take** | 92.64 | 3.34 | **10.74** | 77.84 | 4.884 | 81.39 | 7.36 | 1.48 |
| random | DSKILL | decline | 96.72 | 2.58 | 4.12 | 79.22 | 3.962 | 79.68 | 3.28 | 0.04 |
| random | K | **take** | 91.24 | 7.50 | **3.14** | 68.70 | 4.847 | 81.11 | 8.76 | 2.86 |
| random | K | decline | 96.58 | 8.74 | 0.62 | 70.76 | 3.963 | 79.46 | 3.42 | 0.18 |

The shape is identical in all twelve pairs: **round 1 up a lot, drafted down a little, busted up a
lot in relative terms, All-Conference flat.**

### Bad play, and the home state (n = 2,000 per row, QB)

`lazy` / `antisocial` / `humanLazy` use their canonical profiles (`lowestTier`, `transfer: stay`) with
only the redshirt field varying. Six states were swept (TX, CA, FL, OH, MT, VT); state never changes
a sign, so one representative state is shown.

| strategy | redshirt | drafted% | round1% | busted% | avgSeasons |
|---|---|---|---|---|---|
| best (TX) | take | 97.55 | 38.25 | 2.45 | 4.93 |
| best (TX) | decline | 99.45 | 23.20 | 0.55 | 3.99 |
| random (TX) | take | 92.35 | 10.50 | 7.65 | 4.88 |
| random (TX) | decline | 96.80 | 4.10 | 3.20 | 3.97 |
| **humanLazy (TX)** | take | **65.60** | 17.50 | **34.40** | 4.54 |
| **humanLazy (TX)** | decline | **80.70** | 9.05 | **19.30** | 3.84 |
| antisocial (TX) | take | 64.20 | 11.25 | 35.80 | 4.51 |
| antisocial (TX) | decline | 81.35 | 3.20 | 18.65 | 3.84 |
| lazy (TX) | take | 86.80 | 0.25 | 13.20 | 4.80 |
| lazy (TX) | decline | 94.55 | 0.00 | 5.45 | 3.93 |

A misbehaving player who takes the redshirt is **15 percentage points less likely to be drafted**. The
fifth season is another year of character-corroding cards; the bust engine gets one more swing.

### The five answers

**1. Does taking the redshirt improve the career, on the outcomes a player cares about? By how much?**
On the ceiling, enormously, and uniformly: round 1 roughly doubles in every position and strategy
(best QB 21.84% → 38.58%, +16.7pp; random QB 4.80% → 11.96%, +7.2pp; K 7.58% → 21.08%), and
`avgFinalOverall` rises +2.2 to +2.3. On the floor it is worse everywhere: `draftedRate` falls
1.2–1.4pp for a good player, 4.3–6.2pp for a random one, and **15pp for a misbehaving one**, and
`bustedRate` rises 3.6× (best QB 0.54% → 1.94%) to 2.2× (random QB 3.72% → 8.08%). All-Conference is
flat or very slightly down. **It is a ceiling-for-floor trade, not a free lunch.**

**2. Is there any position, strategy or state in which declining is better?** **Yes, three of them**,
and the strongest is unconditional: *(a)* the **injured-freshman cohort** — if season 1 finished under
60 snaps, taking the redshirt busts the career 100% of the time (see §Trapdoor); *(b)* **any badly-played
career** — `humanLazy` and `antisocial` are both ~16pp more likely to be drafted if they decline, and
`lazy` ~8pp; *(c)* **the losing branch of the roll for an ordinary player** — see answer 5. No home
state flips any sign; state is not a factor.

**3. What does sitting a season actually cost?** **Exactly nothing in overall.** Measured over 3,000
careers per cell: a QB sit season is **25 snaps median** (mean 24.7, p90 29) against a played season's
**343 median**; `seasonOverallDelta` for a sit season is **median 0, mean 0.00, p10 0** — every cell,
every position. The mechanism is doubled: `developmentDelta` is `floor(25/180) = 0` and cannot go
negative, and the *decline* rule that could charge it is gated to JR/SR while **the sit season is
played as SO in 2,995 of 3,000 careers**. So the only cost is the *foregone* development of a played
season, which is **+1 overall (best) or +2 overall (random)** — median. The card's sink branch
advertises a −3, i.e. the fiction's own stated stake is 1.5–3× larger than the thing it is describing.

**4. What does the extra year of eligibility buy?** Measured by neutralising the roll
(`successProb: 1, bumpOverall: 0, sinkOverall: 0`, so the only difference from declining is the fifth
season), n = 4,000:

| | best/QB round1% | random/QB round1% | avgFinalOverall (best/QB) |
|---|---|---|---|
| decline | 22.00 | 4.72 | 84.45 |
| take, roll neutralised (**year only**) | **28.25** | **5.40** | 85.06 |
| take, status quo (+5/−3) | 38.25 | 11.72 | 86.73 |

The fifth season alone is worth **+6.3pp round 1** for a good player and **+0.7pp** for a random one;
the roll is worth the remaining +10.0pp / +6.3pp. So for a good player the extra year is ~40% of the
prize and the overall roll is ~60%. The fifth season is worth **very slightly less** than the fourth
in raw production (mean snaps 347 vs 366, best/QB) but it is played at a higher overall, so it is
roughly a wash — the fifth season is a normal season, not a bonus one. **Note that the year-only
variant still busts more than declining (2.27% vs 0.55%), which isolates the trapdoor and the extra
exposure as costs the roll has nothing to do with.**

**5. Is the downside branch ever actually bad?** **Yes — and this is where the "free yes" claim
breaks.** Splitting the take arm by which branch the roll landed on (recovered from the season lines;
n = 4,000 paired seeds):

| strategy/pos | arm | drafted% | round1% | undrafted% | avgFinalOverall |
|---|---|---|---|---|---|
| best/QB | take, **bump +5** | 97.94 | 42.66 | 0.61 | 87.64 |
| best/QB | take, **sink −3** | 99.09 | **20.80** | 0.80 | 83.25 |
| best/QB | decline | 99.33 | **23.03** | 0.55 | 84.82 |
| random/QB | take, **bump +5** | 92.43 | 15.35 | 1.81 | 83.00 |
| random/QB | take, **sink −3** | 92.99 | **1.99** | **6.54** | 76.38 |
| random/QB | decline | 97.02 | **4.38** | **3.25** | 79.52 |
| best/DL | take, sink −3 | 98.65 | 16.03 | 0.37 | 83.36 |
| best/DL | decline | 99.48 | 18.50 | 0.35 | 84.71 |

A −3 career **does not land where a decline would.** For a good player it lands slightly worse
(round 1 20.80% vs 23.03%, undrafted 0.80% vs 0.55%) — the extra season does not repay the three
points. For an ordinary player it lands *much* worse: round 1 **1.99% vs 4.38%** and undrafted
**6.54% vs 3.25%**, i.e. the sink branch **doubles the chance of going undrafted** relative to simply
having played. The gamble has a real losing side, occupied 40% of the time, and it is the side the
complaint says does not exist.

### The trapdoor (nobody asked for this; it is the most important thing in the report)

`enterOffseason`'s soft-washout check busts a career when the last
`washoutConsecutiveSeasons` (2) season lines are both under `washoutSnapFloor` (60 snaps). **A sit
season is ~25 snaps (a kicker's is ~8), so it always counts as one of the two.** It is a *buried*
season by the engine's definition, despite being the one kind of non-playing season that is a
coach's decision rather than a failure.

Measured over 6,000 careers per cell, **100% of the extra "Buried on the depth chart" busts in the
take arm have the redshirt season as one of the two counted seasons** (best/QB 102/102,
best/DL 107/107, random/QB 97/98, random/DL 105/107). It accounts for essentially all of the
washout-rate rise in the Part 1 table (best/QB 0.02% → 1.46%).

The cohort it lands on, paired seeds, n = 8,000 per cell, cohort = careers whose **first season
finished under 60 snaps** (an injury-wrecked freshman year):

| strategy/pos | cohort size | **take: busted** | take: drafted | decline: busted | decline: drafted |
|---|---|---|---|---|---|
| best/QB | 96 / 8,000 (1.2%) | **100.0%** | 0.0% | 5.2% | 94.8% |
| best/DL | 108 / 8,000 (1.4%) | **100.0%** | 0.0% | 2.8% | 97.2% |
| random/QB | 60 / 8,000 (0.8%) | **100.0%** | 0.0% | 1.7% | 98.3% |
| random/DL | 77 / 8,000 (1.0%) | **100.0%** | 0.0% | 3.9% | 96.1% |

A representative career: FR 25 snaps (two injuries), SO 26 snaps (redshirt), **busted, overall 64** —
nineteen points clear of the `washoutOverallFloor` of 45. He was not washed out. He was medically
redshirted and the engine read it as being cut.

This is ~1% of all careers, and it is the *exact* player the redshirt exists for. It is also the one
outcome in this report that is unambiguously wrong rather than merely untold.

