# 042 — How much of the writing does a player actually see?

**Type:** research / measurement · **Wave:** 21 · **Status:** done
**Behaviour changed:** none. One new file, `src/sim/prose-probe.ts`, imported by nothing the app loads.

---

## 0. Method and denominator

### The counting rule

"Authored prose a player actually reads" means, and only means:

- an event's `title`
- an event's `description`
- **every** option's `label` (the player reads all of them in order to choose)
- the `description` of the **one** outcome their choice resolved to

Ids, keys, effect blocks, and the outcome descriptions of branches that did not fire are not prose the
player read. A word is a whitespace-delimited token.

Prose is bucketed into **units**, so "read" can be deduped:

| unit key | content |
| --- | --- |
| `card:<eventId>` | title + description + all option labels |
| `out:<eventId>:<optId>:pos` | `positiveOutcome.description` |
| `out:<eventId>:<optId>:neg` | `negativeOutcome.description` |

A card seen twice is not twice as much reading, so **coverage is the union of units seen**. Volume
(total words rendered, repeats included) is reported next to it; the gap between the two is repetition.

### The denominator

**9,037 words, 105 events, 442 prose units.**

- 3,792 words (42%) are card blocks — title, description, option labels.
- 5,245 words (58%) are outcome descriptions. This split matters: **a player can only ever read one
  outcome per card per firing**, so more than half the corpus is structurally rationed even before a
  single gate is considered.

Excluded from the denominator: the `recruiting` event (12 words). Its title, description, option label
and outcome text are all overridden at runtime by `getDecision`/`applyRecruitingChoice`, so no player
can reach the authored placeholders. That is 12 words of genuinely dead prose and it is a placeholder,
not a card — noted, not a finding.

Also *not* in the denominator, because it does not live in `src/content`: the three synthetic hub
decisions the engine hardcodes in `advance.ts` (`Signing Day` 6 words, `Transfer Portal` 11 words,
`Redshirt?` 44 words). Every career reads these; a good career reads **83 words** of hub prose per
career (the redshirt card is shown once, the transfer card three times).

### Sample

`src/sim/prose-probe.ts`, 3,000 careers per position × 6 positions = **18,000 careers per policy**,
matching the 3,000-per-position convention of prior waves. Policies: `good` (the existing
`best`/`highestTier`/`up`/`take` profile) and `humanLazyAmbitious` (the authored-intent selfish
policy; identical to `good` except the event strategy, so the comparison isolates one variable).

---

*(sections 1–4 follow as they are measured)*

## 1. The headline number

> **One career shows a player about an eighth of the writing.**
>
> | policy | mean authored words read per career | share of the 9,037-word corpus |
> | --- | --- | --- |
> | `good` (plays to get drafted) | **1,115** | **12.3%** |
> | `humanLazyAmbitious` (plays selfishly) | **1,076** | **11.9%** |
> | `baselineRandom` (the mixed, inconsistent player) | **1,141** | **12.6%** |
>
> **A player who plays ten careers has read roughly 26–39% of what was written** — 26% if they
> always pick the same position, 39% if they vary it. Thirty careers gets a varied player to 57%.

Per-career detail, 18,000 careers per policy (3,000 × 6 positions):

| | `good` | `humanLazyAmbitious` | `baselineRandom` |
| --- | ---: | ---: | ---: |
| words read, distinct | 1,115 | 1,076 | 1,141 |
| words rendered incl. repeats | 1,594 | 1,452 | 1,551 |
| **repetition share** | **30.0%** | 25.9% | 26.4% |
| cards shown | 35.4 | 31.5 | 34.2 |
| distinct cards shown | 23.2 | 21.9 | 21.9 |
| decisions | 40.4 | 36.1 | 39.4 |
| coverage p05 / p50 / p95 | 10.5 / 12.4 / 14.3% | 6.0 / 12.6 / 14.7% | — |

Read that third row twice. **A good career shows 35 cards but only 23 different ones** — 30% of every
career's reading is prose the player has already read this career. That is a larger loss of novelty
than any single content gate in section 2.

The spread is also worth noting: the p05–p95 band for `good` is 10.5%–14.3%. Coverage per career is
almost a constant. There is no "lucky career" that shows you much more of the game.

### Why 12% and not more — the structural ceiling

Three multipliers, all of them by design, and none of them the recent correctness fixes:

1. **58% of the corpus is outcome text**, and a card renders exactly one outcome per firing. A card
   with three options and five outcome branches shows at most one of those five. This alone caps a
   single career near 45% of the corpus before any gate applies.
2. **60 of 105 events are position-gated.** A QB career can never see the other five positions'
   events. Union over 3,000 `good` QB careers is 31.4% of the corpus; a QB-only player has a hard
   ceiling roughly there.
3. **A career is ~40 decisions long** against a 105-event bundle, and only one random event fires per
   phase.

### Nothing is unreachable — the good news, stated first

Per the brief: *if anything is genuinely unreachable in any career, that is a bug and it leads the
report.* **Nothing is.** Union over 18,000 `baselineRandom` careers is **9,037 / 9,037 words = 100.0%
of the corpus**. Every authored word in `src/content/events/**` is reachable by some career.

Two static checks agree: there are **zero** dead branches from probability (no `negativeOutcome`
behind `probability: 1`, no `positiveOutcome` behind `probability: 0`), and no event has
contradictory conditions.

The single exception is a placeholder, not writing: the `recruiting` event's authored title,
description, option label and outcome (**12 words**) are all overridden at runtime by `getDecision`
and `applyRecruitingChoice`. That is deliberate and documented in `content/events/recruiting.ts`.

---

## 2. The buried-content inventory

Every gate in `src/content/**` that restricts reachability. 18,000 careers per policy.
"Fire rate per career" is the expected number of times a card behind that gate is shown in one
career; a gate can exceed 1.0 because several events sit behind it.

**Ranked by words a good player will never see** (words of events that fired **zero** times in
18,000 `good` careers):

| # | gate | events | options | words behind | fires/career `good` | fires/career `humanLazy` | **words never seen by `good`** |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | `requiresPlaying` (locked out of a redshirt season) | 70 | 127 | 5,987 | 22.842 | 19.788 | 116 |
| 2 | `maxCharacter <= 20` (`bust-arrest`) | 1 | 2 | 75 | **0.00000** | 0.113 | **75** |
| 3 | `maxCharacter <= 25` (`bust-doghouse`) | 1 | 2 | 72 | **0.00000** | 0.102 | **72** |
| 4 | `minClass: SO` | 10 | 18 | 868 | 4.111 | 3.570 | 71 |
| 5 | `maxCharacter <= 35` (`bust-academics`) | 1 | 2 | 71 | **0.00000** | 0.163 | **71** |
| 6 | `seasonIndex: [1]` (`milestone-opener-no-excuse`) | 1 | 1 | 44 | **0.00000** | **0.00000** | **44** |
| 7 | `maxCharacter <= 30` (`bust-drug-test`) | 1 | 2 | 77 | 0.00006 | 0.168 | 0 |
| 8 | `maxOverall <= 55` (`bust-lost-love`) | 1 | 2 | 63 | 0.00006 | 0.00011 | 0 |
| 9 | **`maxCharacter <= 55` (B55)** | **5** | **15** | **653** | **0.086** | **2.083** | 0 |
| 10 | `minOverall >= 70` | 4 | 8 | 331 | 0.119 | 0.087 | 0 |
| 11 | `schoolTrait: wideOpen` | 2 | 4 | 278 | 0.151 | 0.157 | 0 |
| 12 | `tier: [1,2]` | 6 | 12 | 539 | 0.158 | 0.157 | 0 |
| 13 | `tier: [3,4]` | 3 | 6 | 310 | 0.663 | 0.388 | 0 |
| 14 | `minClass: JR` | 12 | 24 | 1,010 | 0.759 | 0.495 | 0 |
| 15 | `requiresActiveInjury` (`bust-mri`) | 1 | 2 | 63 | 0.018 | 0.014 | 0 |
| 16 | `requiresFinalSeason` | 1 | 1 | 45 | 0.974 | 0.711 | 0 |
| 17 | `position: K` | 10 | 19 | 1,265 | 0.724 | 0.560 | 0 |
| 18 | `position: DSKILL` | 10 | 19 | 918 | 0.746 | 0.561 | 0 |
| 19 | `position: DL` | 10 | 19 | 830 | 0.772 | 0.584 | 0 |
| 20 | `position: OL` | 10 | 18 | 819 | 0.713 | 0.534 | 0 |
| 21 | `position: OSKILL` | 10 | 18 | 742 | 0.770 | 0.576 | 0 |
| 22 | `position: QB` | 10 | 18 | 633 | 0.770 | 0.589 | 0 |
| 23 | `seasonIndex: [0]/[2]/[3]/[4]` | 4 | 4 | 183 | ~0.98 each | 0.74–1.00 | 0 |

Events carry several gates, so the rows overlap; the `requiresPlaying` row is a superset of most of
the position rows.

### What that ranking actually says

**Only six events, 410 words, 4.5% of the corpus, are meaningfully buried from a good player**, and
five of the six are the authored bust cards, which is the entire point of them:

- `bust-arrest` (char ≤ 20), `bust-doghouse` (≤ 25), `bust-academics` (≤ 35) — **262 words, zero
  fires in 18,000 good careers**.
- `bust-drug-test` (char ≤ 30) and `bust-lost-love` (overall ≤ 55) — **140 words, one firing each in
  18,000 careers**.
- The sixth, `milestone-opener-no-excuse` (44 words), is section 2's only genuine oddity — see below.

A good player is supposed never to read the arrest card. **That is correct burial and this report
recommends nothing be done about it.**

### The one oddity: `milestone-opener-no-excuse`

`seasonIndex: [1] + requiresPlaying`. Fires **zero** times in 18,000 `good` careers *and* zero times
in 18,000 `humanLazyAmbitious` careers. It is not unreachable — `humanLazyFull` draws it 0.994×/career
and `baselineRandom` 0.512× — but it is unreachable **for anyone who takes the redshirt**, because the
redshirt is always offered before season 1 and `requiresPlaying` excludes the season the player sits.

The five `milestone-opener-*` cards partition `seasonIndex` 0–4, and every career reads exactly four
of them:

| | reads | never reads |
| --- | --- | --- |
| takes the redshirt (the optimal play) | `first`, `your-team`, `counting`, `last` | **`no-excuse`** |
| declines the redshirt | `first`, `no-excuse`, `your-team`, `counting` | `last` |

That is a clean partition and arguably fine — but it means "No Longer New," a card about a **second**
season, is the one opener that an optimally-played career can never see, while "Your Team Now" (a card
about being watched by the young guys) always lands on a redshirt's *second played* season. The
fiction is slightly off by one for exactly the careers that play well. Cheapest fix if the PM wants
one: `seasonIndex: [1, 2]` on `no-excuse` and `[2, 3]` on `your-team` would need re-partitioning; a
one-line alternative is to drop `requiresPlaying` from `no-excuse` and reword it for a sit season.
**Not recommended** — see section 4.

### The gate that dominates everything: dominated options, not conditions

The largest block of writing a good player never reaches is not behind a **condition** at all.

| why an outcome's prose was never rendered in 36,000 careers (`good` + `humanLazyAmbitious`) | units | words | share of corpus |
| --- | ---: | ---: | ---: |
| the option was never **chosen** by either policy | 90 | **1,413** | **15.6%** |
| the card never fired | 2 | 25 | 0.3% |
| the branch never rolled | 3 | 35 | 0.4% |
| dead by probability (static check) | 0 | 0 | 0% |

**1,413 words — more than twice the entire B55 band — sit behind options that neither an optimal
player nor a consistently selfish player ever picks.** Examples: `gym-grind:rest`, `the-knee:cart`,
`blueblood-five-star:bring-him-along`.

The honest caveat, stated plainly: both measured policies are **deterministic optimisers**. They pick
the same option every time they see a card. A human does not, and `baselineRandom` reaches 100% of the
corpus. So 1,413 words is the upper bound on option-driven burial, and the real number for a human
sits between that and zero. It is nonetheless the largest single lever on "how much writing gets
read," and it is a **balance** lever (make the dominated options less dominated), not a gate lever.

---

## 3. The two known cases, quantified

### 3a. B55 — the `maxCharacter: 55` band

**It is five cards, not three.** The brief names `entourage`, `curfew-check` and `exit-interview`;
`offfield-portal-rumor` and `offfield-coordinator-blowup` carry the same gate.

| event | phase | words | fires/career `good` | fires/career `humanLazy` |
| --- | --- | ---: | ---: | ---: |
| `offfield-entourage` | offseason | 115 | 0.0094 | 0.3465 |
| `offfield-portal-rumor` | offseason | 122 | 0.0098 | 0.3465 |
| `offfield-coordinator-blowup` | nonconf | 134 | 0.0181 | 0.3593 |
| `offfield-curfew-check` | conference | 138 | 0.0202 | 0.3758 |
| `offfield-exit-interview` | postseason | 144 | 0.0282 | 0.6553 |
| **total** | | **653** | **0.086** | **2.083** |

**653 words — 7.2% of the whole corpus — sit behind `maxCharacter: 55`.** The brief's B55 figure
(~0.06×/career) is confirmed and is if anything slightly conservative: 0.086×/career across all five.

How much is effectively unreachable to a clean player:

| | `good` | `baselineRandom` | `humanLazyAmbitious` |
| --- | ---: | ---: | ---: |
| careers whose character **ever** reaches ≤ 55 | **13.7%** | 89.0% | 99.8% |
| careers that see **at least one** B55 card | **6.03%** | **67.2%** | 87.6% |
| median final character | 63 | 40 | 0 |

The 13.7% corroborates the brief's independently-measured 12.6% band-crossing figure.

**The conclusion is not the one the brief expected.** B55 is buried *for a perfect optimiser* and
wide open for everyone else. **Two thirds of ordinary, inconsistent careers read at least one B55
card.** The band is doing exactly what band 2 of the off-field ladder was designed to do: find the
player who has already slipped. `good` is a machine that never slips — it is the *control*, not the
model of a human. Using it as the sole yardstick for "is this content reachable?" would condemn
content that a real player meets two careers in three.

Note also that all 653 words are reachable — B55 cards appear in the 18,000-career `good` union.
Nothing here is a bug; it is a rate, and the rate is fine.

### 3b. The redshirt pool — DECISION 051's 81 → 12, in words

The 81 → 12 figure reproduces **exactly**, and the definition is: of the **81** authored events whose
phase is on-field (`nonconf`/`conference`/`postseason`), **12** lack `requiresPlaying` and therefore
survive into a redshirt sit season.

| | events | **words** | share of the 9,037-word corpus |
| --- | ---: | ---: | ---: |
| on-field events (the 81) | 81 | 6,950 | 76.9% |
| still available in a sit season (the 12) | 12 | **1,008** | 11.2% |
| **locked out by `requiresPlaying`** | 69 | **5,942** | **65.8%** |

For a *real* redshirt — a clean FR QB at a tier-2 school, so position, tier, class and character gates
also apply — the season's whole pool is **14 events / 1,080 words**:

| phase | sit pool | words | the actual cards |
| --- | ---: | ---: | --- |
| offseason | 5 | 368 | `gym-grind`, `offseason-going-home`, `offfield-group-chat`, `offfield-money-manager`, `transfer-qb` |
| nonconf | **3** | 254 | `nonconf-watch-list`, `offfield-sportsbook-nil`, `offfield-skip-install` |
| conference | **3** | 152 | `offfield-ticket-hookup`, `catfished`, `speeding-georgia` |
| postseason | **3** | 306 | `postseason-coaching-carousel`, `offfield-bowl-curfew`, `offfield-ghost-media` |

Against a played season's pools of 5 / 8 / 7 / 6 (26 events, 2,035 words).

**What the player experiences.** Measured over 18,000 `good` careers that took the redshirt:

- a redshirt season shows **exactly 4.0 cards** and **195 words** — one random event per phase and
  nothing else, because all 9 fixed milestone cards carry `requiresPlaying`;
- **3.99 of those 4 cards are distinct**, so there is no within-season repetition;
- but **across replays the three on-field phases are served by three cards each.** Probability that
  two different redshirt careers draw the *same* card in a given on-field phase:

| phase | sitting | playing |
| --- | ---: | ---: |
| nonconf | **33.3%** | 12.7% |
| conference | **34.7%** | 14.8% |
| postseason | **33.3%** | 16.7% |
| offseason | 20.3% | 20.3% |

A redshirt season is therefore **2.3× as repetitive as a played one across replays**, and a player
who redshirts twice across two careers has a ~1-in-3 chance of reading the identical card in each of
the three on-field phases.

**And the tone is wrong.** Every one of the 9 on-field cards a clean redshirt can draw is an
off-field or peripheral beat: gambling, skipping the install, a ticket hookup, getting catfished, a
speeding ticket, a curfew, ghosting the media, a watch list, a coaching carousel. **There is not one
football card in a redshirt season**, and there is no card anywhere in the bundle that is *about*
redshirting — about scout team, about the weight room, about watching from the sideline in street
clothes. The engine writes 44 words of hub prose promising "a year of scout team and the weight
room", and then serves the player four cards about his phone.

That is the actual cost of DECISION 051, and it is not the 5,942 locked-out words — those are locked
out **correctly**, because a card that credits snaps to a player who did not play is the bug the
decision fixed. The cost is that **a whole season of the career — roughly 20% of it — has no content
of its own.**

---

## 4. Recommendation — a proposal, not a change

> **Verdict: B55 is a rounding error. The buried-content hunt found nothing worth re-homing. Go
> author new content — and author it for the redshirt season, which is the one real hole the
> measurement found.**
>
> The number that convinced me: **67.2% of ordinary (`baselineRandom`) careers read at least one B55
> card**, and **100.0% of the 9,037-word corpus is reachable**. Nothing is buried. Meanwhile **20% of
> every redshirt career — a whole season — is served by 9 cards, none of which is about football or
> about redshirting.**

### What is correctly buried — leave all of it alone

| | words | why it stays |
| --- | ---: | --- |
| `bust-arrest`, `bust-doghouse`, `bust-academics`, `bust-drug-test`, `bust-lost-love` | 358 | A good player is *supposed* never to read the arrest card. `humanLazy` reads them 0.10–0.17×/career. Correct. |
| the B55 band (5 cards) | 653 | 0.086×/career for `good` but **2.08×** for `humanLazy` and 67% of ordinary careers. Band 2 of the off-field ladder is working as designed. |
| the 69 `requiresPlaying` events (5,942 words) | 5,942 | DECISION 048/051 is right: a card that credits snaps to a player who did not play writes stats onto a redshirt's permanent ledger. Do not loosen this. |
| position gates (60 events) | — | Unseen in any one career **by design**; this is the replay engine. |

### The one thing worth a wave: content for the season the player sits

**Proposal R1 — a redshirt pack.** Author roughly 9–12 cards for a sit season: scout team, the
weight room, the look-team scripting, watching a rival at your position take your reps, the coach who
promises you the job next August, the November Saturday in street clothes. Target: take the sit
season's on-field pools from **3 / 3 / 3** to **6 / 6 / 6**, which drops the cross-replay collision
from ~33.8% to ~17% — level with a played season (14.7%) — and gives the redshirt gamble a season
that reads like the 44 words of hub prose that sold it.

**R1 has a blocker the PM must decide on.** There is currently **no way to express "this card is for
a redshirt season."** `requiresPlaying: true` excludes a sit season; its absence means the card fires
in *both*. The `ContentBundle` schema has no `requiresRedshirt`, and DECISION 048's note records that
opting a beat back into a redshirt season was *deliberately* left inexpressible. So R1 needs one of:

- **R1a** (engine + schema, ~10 lines): add `conditions.requiresRedshirt?: boolean`, checked in
  `eventMatches` as `if (c.requiresRedshirt && !state.redshirtSeasonActive) return false`. Exact
  mirror of the existing `requiresPlaying` clause, no balance surface, and it makes the redshirt
  season authorable forever. **This is the one I would take.**
- **R1b** (content only): write the pack without `requiresPlaying` and phrase every card so it reads
  correctly whether or not the player is on the field. Cheaper, but it dilutes the played-season
  pools with sit-season beats and it constrains the writing badly.

Both touch frozen directories, so both are proposals. R1a touches `src/engine/select-event.ts` and
`src/content/schema.ts`; it changes no balance number and no existing card's behaviour.

### The bigger lever, flagged but not recommended for this wave

**1,413 words (15.6% of the corpus) sit behind options that neither optimiser ever chooses** —
roughly 2.2× the whole B55 band. That is not a gating problem and it must not be fixed by re-gating;
it is a *balance* problem (`gym-grind:rest`, `the-knee:cart` and ~15 others are strictly dominated).
It touches draft-stock balance and would need the user, not just the PM. **Flag it; do not act on it
in an authoring wave.**

### What not to bother with

- **`milestone-opener-no-excuse` (44 words).** An optimally-played career never reads it, because the
  redshirt always eats season 1. Every clean fix costs more than 44 words are worth: the honest one
  is to index the openers by *played* season rather than absolute `seasonIndex`, which the engine does
  not expose. Recommend: accept, or fold it into R1 as a sit-season card if R1a lands.
- **The `recruiting` placeholder (12 words).** Documented, intentional, invisible.

### The metric to hold this wave to

"% of the corpus read" is the **wrong** target for an authoring wave — adding words grows the
denominator, so a successful wave can *lower* it. Hold the next wave to these instead, all of them
re-measurable with `npx tsx src/sim/prose-probe.ts`:

| metric | today (`good`) | target |
| --- | ---: | --- |
| distinct cards per career | 23.2 | up |
| within-career repetition share | 30.0% | down |
| cards in a redshirt season | 4.0 from a pool of 14 | 4.0 from a pool of ~23 |
| cross-replay collision, sit season on-field phases | 33.8% | ≤ 17% |
| words never seen in 18,000 `good` careers | 410 | stays small |

---

## 5. What was added, and verification

**New file, imported by nothing the running app loads:** `src/sim/prose-probe.ts` (+
`src/sim/prose-probe.test.ts`). No file under `src/engine/**`, `src/content/**` or `src/ui/**` was
touched. No behaviour changed.

CLI:

```
npx tsx src/sim/prose-probe.ts corpus
npx tsx src/sim/prose-probe.ts coverage 3000 good all
npx tsx src/sim/prose-probe.ts ten 3000 good
npx tsx src/sim/prose-probe.ts gates 3000
npx tsx src/sim/prose-probe.ts unseen 3000
npx tsx src/sim/prose-probe.ts options 1500
npx tsx src/sim/prose-probe.ts sitseason 3000 good
npx tsx src/sim/prose-probe.ts redshirt
```

### Known limitations

- Both measured policies are **deterministic**: given a card they always choose the same option. This
  is what makes the "1,413 words behind never-chosen options" figure an upper bound, and it is why
  `baselineRandom` is quoted throughout as the third reference point.
- Coverage counts an outcome branch as "read" the first time it renders. Word counts are
  whitespace tokens, so hyphenates and em-dashes count as one token; consistent across the corpus.
- `redshirtPools` builds a synthetic state (clean FR, tier 2, character 70, overall 65). Pool sizes
  for a dirty or injured redshirt differ; the character-gated additions are named in §3b.

### Verification

- `npm run typecheck` — **exit 0** (both passes: `tsconfig.engine.json`, then `tsconfig.json`).
- `npm test` — **40 files, 684 tests passed**. That is the existing **671 green**, plus the **13**
  tests in the new `src/sim/prose-probe.test.ts`. Nothing was modified in `src/engine/**`,
  `src/content/**` or `src/ui/**`, the dev server was not touched, and nothing was committed.
