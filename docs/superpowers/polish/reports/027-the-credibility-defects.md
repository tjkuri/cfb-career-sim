# 027 — The credibility defects

**Brief:** `briefs/027-the-credibility-defects.md` · **Wave 12, lane C** · **Status:** done, with four
proposals (three frozen-file, one `view-model.ts` handoff)

**Headline.** Five defects, five causes named in source. **One is mine and is fixed** (defect 2,
`bands.ts`, gated behind a one-line `view-model.ts` diff in §7 below). **Four are not mine**: two are
`src/content/**`, one is `src/engine/**` + `src/content/**`, one is `src/engine/**`. None of the five
traces to DECISION 046 / brief 026's delta-attribution bug — I checked defect 5's `−3` specifically
and it is the redshirt card's own authored effect (§5).

**The most important thing in this report is not one of the five.** It is §6: **52 of the 59 on-field
content cards that award production carry no `requiresPlaying` gate**, so they fire at a player who
is sitting out a redshirt — measured at **31.4% of all production-card firings**, and **85.6% of
careers that redshirt get at least one.** That single hole is the direct cause of defect 1, the
visible half of defect 5, and a third of defect 3's misfires. Fixing it is one field on ~52 events.

**Verification** (§8): `npm test` all green, 0 failed (613 baseline + 7 I added = 620; 636 by the
time lane A's concurrent tests landed in the same tree), `npm run
typecheck` both passes exit 0, `npm run build` clean, `npm run play -- 24 random` byte-identical
before and after, `git status` clean under `src/engine/`, `src/content/` and every out-of-bounds
file. Defects 1 and 2 confirmed on screen at `localhost:5173` with deterministic reproductions.

---

## 0. How each defect was reproduced and measured

Two throwaway probes in the scratchpad (not committed, `repetition-probe.ts` untouched), sweeping
1,200–4,800 `randomPolicy` careers evenly across all six positions, inspecting `GameState` at every
decision. Where a rate is quoted below it comes from one of those sweeps and the N is stated.

Both header defects were then reproduced **deterministically**: a hunt found a seed and a decision
index exhibiting each, dumped the `GameState` as a `cfb-career-sim:v1:current` save, and I injected
it into `localStorage` at `localhost:5173` and read the header. Both seeds are recorded below so
anyone can re-see them in ten seconds without playing a career.

> **Housekeeping note for the PM.** Injecting those saves **overwrote whatever career was in that
> browser profile's `localStorage`**, and I cleared the key afterwards rather than restoring it (I
> did not back it up first — my mistake). If a playtester had a career in progress on that profile,
> it is gone. Nothing in the repo was touched.

---

## 1. Defect 1 — `8 snaps · 3 FG · 6 Points`

**Not mine. Cause is `src/content/events/k.ts` (frozen), amplified by `src/engine/simulate.ts`
(frozen).**

### Cause, in source

`src/content/events/k.ts` authors **twelve `stat` effects on `fieldGoals`** (lines 97, 105, 140, 171,
215, 223, 258, 299, 318, 341, 383, 401) and **exactly one `stat` effect on `points`** (line 141,
`+3`, paired with the `fieldGoals +1` on line 140). So eleven of the twelve award field goals that
**score nothing**. `points` and `fieldGoals` are two independent counters that content moves
separately, and there is no invariant anywhere that ties them.

`src/engine/effects.ts` applies each `stat` effect additively and independently; nothing derives
`points` from `fieldGoals`.

**The engine's own simulation is not the cause and is very nearly innocent.**
`src/engine/simulate.ts:16` sets `K.per100 = { fieldGoals: 9, points: 42, gameWinners: 0.8 }` — a
ratio of 4.67 points per field goal, which is correct (3 per FG plus PATs). But
`simulate.ts:29–33` rolls each stat with its **own** jitter and its **own** `Math.round`:

```
const jitter = 0.85 + rng.next() * 0.3;        // simulate.ts:30
const yield_ = (per100 * snaps) / 100 * skill * jitter;
season.stats[stat] = (season.stats[stat] ?? 0) + Math.round(yield_);   // simulate.ts:32
```

I ran the counterfactual — 20,000 Monte-Carlo seasons per cell replicating that arithmetic exactly,
with **no card effects at all**, across `snapModifier ∈ {1.0, 0.6, 0.3, 0.05}` × `overall ∈
{45, 60, 75, 90}`:

| | P(points < 3 × FG) from simulation alone |
|---|---|
| every cell at snapModifier 1.0 / 0.6 / 0.3 | **0.00%** |
| snapModifier 0.05 (a redshirt season) | 0.00–0.01% |

Add **one** authored `fieldGoals +3` with no matching `points`, and the same arithmetic gives
**0.06%** at a full season and **100.00%** at snapModifier 0.05.

That last row is the whole defect. **The contradiction is a low-snap-season phenomenon**, because in
a sat-out season every generated FG rounds to 0 while the card-awarded ones are integers:

| measured over 3,000 careers (1,538 K season rows) | |
|---|---|
| K season rows where `points < 3 × fieldGoals` | 91 / 1,538 = **5.9%** |
| …among **redshirt** K rows | 82 / 386 = **21.2%** |
| …among **played** K rows | 9 / 1,152 = **0.8%** |
| K-position cards that fired while the player was sitting a redshirt | 543 / 1,799 = **30.2%** |
| K careers showing it at least once | 42 / 200 = **21.0%** |

### Reproduction (seen on screen)

Seed `repro-fg-0`, position K. Header reads **`11 snaps   2 FG   4 Points`**. Two field goals cannot
be four points. That state is a **redshirt season** (`redshirt: true`, `snapModifier: 0.05`) and the
card on screen is **`bowl-game-winner`** — see §6.

### Proposal (frozen — content, and optionally engine)

**Preferred, content-only, no RNG movement, no seed divergence.** In `src/content/events/k.ts`, every
`{ kind: "stat", stat: "fieldGoals", amount: N }` gains a sibling
`{ kind: "stat", stat: "points", amount: 3 * N }` — including the two negatives (lines 105 and 223
become `points: -3`). Line 140/141 already does this and is the template. Twelve edits, purely
additive, `applyEffect` order is unchanged so the `rng` cursor does not move, and
`npm run play -- 24 random` stays byte-identical for every non-K seed (K seeds change *values*, not
draw order — the acceptance test should be run to confirm).

**Do not** make `points` derived in the engine. Removing `points` from `STAT_MODEL.K.per100` deletes
one `rng.next()` per phase per kicker and diverges every existing K seed, and `points` feeds nothing
downstream that would justify that (`postseason.ts:40` gates All-Conference on `fieldGoals`, not on
`points`). If it is done anyway it belongs with the other Stage-2 engine work, not here.

**Secondary, engine, optional.** `simulate.ts` could draw one jitter per *position* rather than one
per stat, which would make a position's stat line internally coherent across the board (a QB's
`passYards` and `passTds` have the same independence problem, it is just not arithmetically
falsifiable). This **does** move the draw order and diverges every seed. Recorded, not recommended
now.

---

## 2. Defect 2 — `ON THE FIELD: on the scout team` beside 339 snaps — **MINE, FIXED**

**Cause, in source:** `src/ui/session/bands.ts:20` (`{ min: 50, phrase: "on the scout team" }`) and
`:21` (`{ min: 0, phrase: "hanging on to a roster spot" }`), reached from
`view-model.ts` `buildView` → `standing: standingPhrase(state.overall)`, rendered by
`CareerScreen.tsx` in the `.standing` block under the literal caption `On the field`.

**The category error.** Every phrase in `STANDING_BANDS` is derived from `overall` alone, but the
vocabulary is *depth-chart* language, and the bottom two rungs are not claims about how good the
player is — they **assert that he is not playing**. `overall` cannot support that claim. Playing time
is `snapModifier`, which comes from the recruiting offer, the transfer offer, the school trait and
the redshirt (`transfer.ts`, `school-effects.ts`, `advance.ts:144`) and is a different number
entirely. A 55-overall starter at a school that plays him is routine, and the header called him a
scout-teamer 40 pixels below his own snap count.

**Measured**, 1,200 careers / 30,739 decisions, all six positions:

| | |
|---|---|
| decisions printing an off-field phrase while ≥ 100 snaps are on screen | 1,807 / 30,739 = **5.9%** |
| **careers** that show it at least once | 548 / 1,200 = **45.7%** |

**Reproduction (seen on screen).** Seed `repro-band-11`, position DSKILL, `overall` 59: the header
reads `344 snaps   34 Tackles   3 INT   7 PBU` on one line and `ON THE FIELD / on the scout team`
on the next. That is the playtester's report almost exactly (339 / 31).

### What I did — `src/ui/session/bands.ts`

`standingPhrase` gains an **optional** second argument:

```ts
export function standingPhrase(overall: number, snapsThisSeason?: number | null): string
```
(`bands.ts:95–101`, with `PLAYING_SNAP_FLOOR` at `:59`, `OFF_FIELD_PHRASES` at `:63`,
`PLAYING_FALLBACK` at `:68`.)

The rule is a **refusal, not an inference**: a phrase that *denies* playing time is not printed when
the number printed beside it refutes it. Four properties, each covered by a test:

1. **Only the two denials can move**, and only upward, and only to `"in the rotation"` — the weakest
   phrase compatible with taking snaps. No other phrase is ever altered by any snap count.
2. **The floor is the engine's own number.** `PLAYING_SNAP_FLOOR = 60` is
   `progression.washoutSnapFloor` (`content/postseason.ts:53`) — the engine's own definition of "did
   not play enough for this season to count". It is not imported (this module has no content
   dependency, deliberately, same as `labels.ts`); instead `bands.test.ts` asserts the constant
   still equals the content value, so a balance change fails a test rather than drifting.
3. **The redshirt season falls out correctly without a special case.** `sitSnapModifier: 0.05` gives
   a sat-out season a **median of 26 snaps and a measured max of 54** over 2,315 redshirt rows — all
   below 60 — so a redshirt still reads `on the scout team`, which is exactly true.
4. **Omitting the argument returns the old value unchanged**, so every existing caller is
   byte-identical until the diff in §7 lands.

**This is not the inference DECISION 020 withdrew and does not re-derive it.** 020 withdrew "which
stored season was the redshirt", which report 010 measured as underivable. This asks nothing about
any other season, labels no ledger row, and reads one number that is already on screen next to the
phrase. The code comment at `bands.ts:29–58` says so at length so nobody re-litigates it.

**Tests added:** 7 in `bands.test.ts` (anchor equals the content floor; unchanged with no argument;
never denies what the count refutes; still says scout team below the floor and through a redshirt
season; lifts only to the weakest compatible phrase; never moves a non-denial; survives `NaN`,
`±Infinity` and a negative snap count — negatives are reachable, DECISION 040).

**It is inert until §7 lands.** The current call site passes one argument, so the rendered output is
unchanged today. I did not apply the `view-model.ts` change myself; lane A owns that file this wave.

### The alternative I did not take

Rewriting the seven band phrases into pure ability language ("scout-team caliber") would also remove
the contradiction and would be entirely inside my file. I rejected it: the depth-chart vocabulary is
the thing players actually understand, four of the seven rungs are correct as they stand, and
rewriting all seven to fix two is a bigger prose change than a lane-C brief should take unasked. If
the PM prefers it, it is a ten-line change to `STANDING_BANDS` and the §7 diff is then unnecessary.

---

## 3. Defect 3 — Bowl Opt-Out says "climbing draft boards" to a 60-overall sophomore

**Not mine. Cause is `src/content/events/oskill.ts:308–315` (frozen), and it is one of four.**

### Cause, in source

```
src/content/events/oskill.ts:312   conditions: { position: ["OSKILL"], tier: [1, 2] },
src/content/events/oskill.ts:315   "...and your name's already climbing draft boards..."
```

There is **no gate on class year, on `overall`, or on whether the player is even playing**. And it
cannot be gated on `overall` today: `EventConditions` (`src/engine/types.ts:78–94`) has
`maxOverall` and `maxCharacter` but **no `minOverall`** — `select-event.ts:40` only ever tests the
maximum. There is no draft-stock condition either, which is correct (DECISION 025).

### This card is not alone — it is a family of four

All four are `phase: "postseason"`, all four address a player being scouted for the NFL, and **none
of the four gates on class year, overall, or playing status**:

| card | file:line | prose that assumes a prospect |
|---|---|---|
| `bowl-opt-out` | `oskill.ts:308` | "your name's already climbing draft boards" |
| `all-star-invite` | `qb.ts:340` | "show out in front of every scout… or skip it and protect your stock" |
| `all-star-practice-week` | `dskill.ts:365` | "a dozen scouts on every rep… somebody's first-round pick" |
| `senior-bowl-invite` | `ol.ts:308` | "**Senior** Bowl Invite" / "every offensive line coach in the league" |

Measured over 4,800 careers:

| card | fires | median OVR | min OVR | **fires at FR/SO** | fires with an off-field band | **fires while sitting a redshirt** |
|---|---|---|---|---|---|---|
| `bowl-opt-out` | 353 | 65 | 47 | 243 (**68.8%**) | 45 (12.7%) | 116 (**32.9%**) |
| `all-star-invite` | 395 | 66 | 51 | 271 (**68.6%**) | 66 (16.7%) | 119 (**30.1%**) |
| `all-star-practice-week` | 379 | 65 | 52 | 263 (**69.4%**) | 60 (15.8%) | 106 (**28.0%**) |
| `senior-bowl-invite` | 385 | 66 | 48 | 273 (**70.9%**) | 50 (13.0%) | 138 (**35.8%**) |

**Roughly seven in ten firings of every one of these cards go to a freshman or a sophomore**, and a
third go to a player who chose to sit the season out. A card literally titled *Senior Bowl Invite*
fires at freshmen in 71% of its appearances.

### Proposal (frozen — content only, no engine change needed)

Two conditions that **already exist** close almost all of it:

1. `minClass: "JR"` on all four (`EventConditions.minClass`, `select-event.ts`). Removes ~69% of the
   bad firings and is the honest gate: draft boards do not carry sophomores.
2. `requiresPlaying: true` on all four (`select-event.ts:38`). Removes the redshirt firings. See §6 —
   these four are part of a much larger set that wants this.

Both are additive `conditions` keys on existing events; neither moves the `rng` draw order at the
point of authoring, but both **change which events are eligible**, so `npm run play -- 24 random`
will diverge and the bit-identity baseline moves with the change (the DECISION 040 precedent).

**Residual, and the only thing that would need the engine.** With `minClass: "JR"` the median OVR at
fire time is still around 66, so "climbing draft boards" is still occasionally said to a player who
will go undrafted. Closing that needs **`minOverall?: number` added to `EventConditions`** — one
field in `engine/types.ts:78–94` plus one line in `select-event.ts`, the exact mirror of the existing
`maxOverall` check, additive and no RNG movement. **Recommended as a small engine proposal**, because
it is the only condition that lets content say "this beat is for good players" and there are 81
on-field events that may want it. If it is refused, the cheaper fallback is to reword all four so the
claim is about the *event's* stakes rather than the *player's* stock — e.g. for `bowl-opt-out`,
"Directional bowl, low stakes, and a long season already on tape. Sit and protect what you have, or
suit up for the guys who got you here?" — which is true at any overall.

---

## 4. Defect 4 — Playoff or Bust says "Ten wins is a disappointing season" beside 5-7

**Not mine. Cause is `src/content/events/universal.ts:119–125` (frozen). The gate the card wants
cannot exist at the moment it fires.**

### Cause, in source

```
src/content/events/universal.ts:121   phase: "postseason",
src/content/events/universal.ts:123   conditions: { tier: [3, 4], requiresPlaying: true },
src/content/events/universal.ts:125   "Ten wins is a disappointing season here. ..."
```

`EventConditions` has **no condition on team record at all** — not wins, not losses, not last
season's. So the sentence fires regardless of how the team is doing.

**And a record-based condition would not help, because at the moment this card fires the current
season has no record.** `runPostseasonResolver` (`src/engine/postseason.ts:62–78`) writes
`season.teamWins` / `teamLosses` **once, at the end of the postseason phase**, and `advance.ts`
increments `seasonIndex` in the same tick. The card is `phase: "postseason"` — measured, **85 of 85
firings occur inside the postseason phase**, by construction — so the live season's record is still
`0-0`, which `view-model.ts`'s `recordOf` correctly refuses to render (DECISION 014). The **only**
record on screen beside the card is therefore the **previous** season's, in the ledger.

Measured over 4,800 careers:

| | |
|---|---|
| firings | 85 (1.8% of careers) |
| firings with a prior season on the ledger | 85 / 85 |
| median prior-season wins | **7** |
| firings whose visible prior record is **under ten wins** | 82 / 85 = **96.5%** |

So the card sits beside a sub-ten-win record **96.5% of the time**. The playtester's 5-7 was not bad
luck; it is the overwhelmingly common case.

### Proposal (frozen — content only)

The sentence is *meant* as a statement about the program's standard, not about this season, and it
reads as the latter because the ledger's record is the nearest number. **Reword so the standard
cannot be mistaken for a scoreboard**, and delete the number that invites the comparison:

> `"The standard here is the playoff, and everything short of it is a bad year. The message boards
> have been counting since September, and the staff can hear them through the walls."`

That is true at 5-7 and at 11-1, it still does the job of telling the player what a blueblood is, and
it is one string. **Recommended.**

**Rejected: gating on the record.** It would need (a) a new `EventConditions` key and (b) making W-L
accrue during the season, which is the engine change `view-model.ts:69–76` explicitly declines
because it moves the RNG draw order and diverges every existing seed. Not worth it for one card.

**Optional, if the "ten wins" framing is wanted:** move the card to `phase: "offseason"`, where the
season just finished **does** have a resolved record, and add the record condition from (a). That is
a bigger change and it lands the card in the offseason block the 025 playtest already named as the
single worst stretch in the game (§5 of that report). **Not recommended.**

---

## 5. Defect 5 — B37, the redshirt card lies

**Not mine. The wording lives in `src/engine/advance.ts:70–79` — an engine file, frozen. Proposal
below. The mechanism is confirmed exactly as B13 described it, and the engine is right.**

### Cause, in source

```
src/engine/advance.ts:74   description: "Sit this season to preserve a year of eligibility and gamble on coming back stronger — it might backfire.",
src/engine/advance.ts:76   { id: "redshirt", label: "Take the redshirt (sit the season)" },
```

The redshirt decision is a **synthetic hub card built in the engine**, not content — which is why
grepping `src/content/**` for it finds nothing. Both strings promise the season will not be played.

What actually happens (`advance.ts:138–146`):

```
advance.ts:144   s.snapModifier = cfg.sitSnapModifier;      // content/redshirt.ts:10 → 0.05
```

`0.05` is not `0`, so `simulatePhaseProduction` (`simulate.ts:26–27`) credits snaps every phase. That
is **the four-game redshirt rule modelled correctly** and it should not change.

**Measured, 3,000 careers, 2,315 redshirt season rows:**

| | |
|---|---|
| redshirt seasons that credit snaps | 2,315 / 2,315 = **100.0%** |
| median snaps | **26** |
| 99th percentile | 45 |
| max | 54 |

B13's numbers reproduce exactly. **The engine is right and the telling is wrong**, and the telling is
still wrong today.

### The `−3` is NOT DECISION 046 / brief 026's bug — I checked

The playtest's `−3` is the redshirt's **own authored effect**: `content/redshirt.ts:9`
`sinkOverall: -3`, applied at `advance.ts:141` as a `timing: "immediate"` overall effect on the
failed 40% branch, with `cfg.sinkDescription` set as `lastOutcome` in the very next line. The card
accounts for its own number. It is a card whose delta is correct and whose **setup sentence** is not.
(The screen's `delta` could still be contaminated by an unrelated deferred effect landing in the same
`advance` — that is 026's `reducer.ts:61-64` bug and I have not touched it — but `−3` matching
`sinkOverall` exactly means there is nothing for 026 to explain here.)

### The visible half, and why it is worse than a wording slip

Reproduction `repro-fg-0` (§1) is a redshirt season on screen, and the card in front of the player is
**`bowl-game-winner`** — *"Zero seconds on the clock, your team down two…"* — offered to a kicker in
the season he was told he would sit. The moment it awards, *"Called the stadium's wind correctly on a
game-deciding kick"*, goes on his permanent summary reel for a year he did not play. See §6: this is
not a kicker problem.

### Proposal A (frozen — engine, two strings, recommended)

`src/engine/advance.ts:74` and `:76`. The honest telling names the real rule instead of promising
zero:

```
advance.ts:74   description: "Redshirt: play four games at most and the season doesn't count against your eligibility. A year of development, and a gamble on coming back stronger — it might backfire.",
advance.ts:76   { id: "redshirt", label: "Take the redshirt (four games, then done)" },
```

Two string literals in a `getDecision` branch. **No behaviour change, no RNG movement**; `npm run
play -- 24 random` stays byte-identical (the headless harness prints no prose). This is the smallest
possible fix and it makes the card stop lying.

### Proposal B (`view-model.ts`, if the engine freeze holds)

If `src/engine/**` cannot be reopened even for two strings, the same fact can be attached from the
UI. `view-model.ts` already does exactly this for the declare card — `decisionNote()` returns
`"Two seasons of eligibility remain."` for `eventId === "declare"`, on the same "state a rule of the
game, leak no number" principle DECISION 038 settled. The redshirt card is the same shape:

```ts
const REDSHIRT_EVENT_ID = "redshirt";   // structural mirror of advance.ts:18, like DECLARE_EVENT_ID

// ...inside decisionNote():
if (decision.eventId === REDSHIRT_EVENT_ID) {
  return "A redshirt season still allows up to four games.";
}
```

This is a rule of the game, identical for every player, and leaks nothing. **It is a `view-model.ts`
edit, so I did not make it** — lane A owns that file this wave. Proposal A is better because it fixes
the sentence that is wrong rather than appending a correction beneath it.

### What I did NOT do, and why

`SeasonLine.redshirt` (`engine/types.ts:48`) — the flag DECISION 039 approved specifically so the UI
could mark the sat-out season — **is written by the engine (`advance.ts:289`) and read by nothing.**
I verified: no consumer anywhere in `src/ui/**`. `LedgerSeason` (`ledger.ts:41–48`) has no such
field, `seasonViews` (`view-model.ts`) does not copy it, `SeasonView` does not carry it. Marking that
row would visibly close the "the season was played anyway" gap in the ledger — but **DECISION 039
explicitly reserves it**: *"Re-captioning the dashed row and marking the sat-out row are copy-and-
treatment calls that get their own brief with a playtest question attached."* So it is recorded here
as a ready-to-brief item, not taken. It is a four-file change (`ledger.ts` mine, `view-model.ts` and
`types.ts` lane A's, `CareerScreen.tsx` lane B's) and needs a wave where those are disjoint.

---

## 6. The finding underneath three of the five — `requiresPlaying` is missing almost everywhere

**This is the highest-leverage item in this report and it was not in the brief.**

`EventConditions.requiresPlaying` exists and works: `select-event.ts:38` rejects the event when
`state.redshirtSeasonActive`. `content/events/milestones.ts:6` uses it correctly and says why. But
across the bundle:

| | |
|---|---|
| on-field events (`nonconf` / `conference` / `postseason`) | **81** |
| …carrying `requiresPlaying` | 17 |
| on-field events whose outcomes award `stat` or `snaps` production | **59** |
| …**without** `requiresPlaying` | **52** |
| K-position events carrying `requiresPlaying` | **0 of 10** |

Measured over 3,000 careers:

| | |
|---|---|
| production-card firings that happened while the player was sitting a redshirt | 3,298 / 10,501 = **31.4%** |
| careers that redshirted and got at least one | 1,995 / 2,331 = **85.6%** |

**A player who chooses to sit out a season is handed a bowl-winning field goal, a pancake highlight,
a pick-six and a trash-talk beat, and the stats go on his ledger row for that season.** It is the
proximate cause of defect 1 (21.2% of redshirt K rows vs 0.8% of played ones), the on-screen half of
defect 5, and about a third of defect 3's misfires.

**Proposal (frozen — content).** Add `requiresPlaying: true` to the 52 events listed by the probe
(the full id list is reproducible with a four-line script over `CONTENT.events`; the four §3 cards
are in it, as are all eight of K's on-field cards — the other two K events are `offseason` and out of
scope). Purely additive, one key per event. It **will** change which events
are eligible in a redshirt season and therefore move `npm run play` output, so the bit-identity
baseline moves with it — the DECISION 040 precedent. It is also worth a schema rule in
`validateContent` (`content/schema.ts:87+`): *an on-field event whose outcomes award `stat` or
`snaps` production must set `requiresPlaying`* — so the next authored card cannot reopen this.

**Caveat worth a PM decision:** a four-game redshirt *does* play four games, so a small handful of
these beats are arguably legitimate during a redshirt season. If that nuance is wanted it needs a new
condition (`allowedDuringRedshirt`, or similar) rather than leaving 52 events ungated by default.
Defaulting to gated and opting a few back in is the safer direction.

---

## 7. The exact `view-model.ts` diff, for the PM to apply after 026 lands

One call site. `buildView`, at the end of `src/ui/session/view-model.ts`. Applying it is what turns
defect 2's fix on; without it `bands.ts` returns exactly what it returned before.

**Before** (current text, verified against the file as 026 has it):

```ts
export function buildView(state: GameState): CareerView {
  const terminal = state.status !== "active";
  const decision = getDecision(state);
  return {
    playerName: `${state.setup.lastName} #${state.setup.jerseyNumber}`,
    positionLabel: positionLabel(state),
    schoolName: currentSchoolName(state),
    classYear: state.eligibility.classYear,
    seasonRecord: currentRecord(state),
    phaseLabel: phaseLabel(state.phase),
    seasonNumber: state.seasonIndex + 1,
    season: currentSeasonLine(state),
```
…and further down…
```ts
    overall: state.overall,
    standing: standingPhrase(state.overall),
```

**After** — hoist the season line into a const (it was already built here; this avoids building it
twice) and pass its snap count:

```ts
export function buildView(state: GameState): CareerView {
  const terminal = state.status !== "active";
  const decision = getDecision(state);
  // The season line is built once and used twice: the header prints its snap
  // count, and the standing phrase is checked against that same number so the
  // two halves of one strip cannot contradict each other (report 027, defect 2).
  const season = currentSeasonLine(state);
  return {
    playerName: `${state.setup.lastName} #${state.setup.jerseyNumber}`,
    positionLabel: positionLabel(state),
    schoolName: currentSchoolName(state),
    classYear: state.eligibility.classYear,
    seasonRecord: currentRecord(state),
    phaseLabel: phaseLabel(state.phase),
    seasonNumber: state.seasonIndex + 1,
    season,
```
…and…
```ts
    overall: state.overall,
    // `season?.snaps ?? null` -- null is the absence of a number, never a zero.
    // Deliberately NOT gated on `season.inProgress`: during the offseason the
    // header still prints last season's snap count beside this phrase, so that
    // is the number the phrase must not contradict.
    standing: standingPhrase(state.overall, season?.snaps ?? null),
```

`bands.ts` is already imported; no new import. Two known-and-accepted subtleties:

- **`standing` is live, the rail's snap count may be stamped.** When a resolved card is on screen,
  `railView` prints `stamp.season.snaps` while `standing` is computed from live state. Snaps only
  ever increase, so the live count is never smaller than the stamped one — meaning this can only ever
  *lift* a phrase that the stamped number would also have lifted, or lift one the stamped number
  would have left alone. The worst case is `"in the rotation"` printed beside a stamped 34 snaps,
  which is not a contradiction (`"in the rotation"` denies nothing). Making it exact would mean
  carrying `standing` through `RailView`, which is a bigger shape change for no defect.
- **Verification after applying:** `npm test` (the 7 new `bands.test.ts` cases already cover the
  logic; `view-model.test.ts` may want one case asserting the header's two halves agree),
  `npm run typecheck`, and `npm run play -- 24 random` — which stays **byte-identical**, because the
  headless harness never calls `buildView`.

---

## 8. Verification

| check | result |
|---|---|
| `npm test` | **636 passed / 0 failed**, 38 files. Baseline was 613; I added **7** in `bands.test.ts` (620 at the moment I finished), and lane A has since added 16 more in the same tree. |
| `npm run typecheck` | both passes exit 0 (`tsc -p tsconfig.engine.json`, `tsc -p tsconfig.json`) |
| `npm run build` | clean, 83 modules, no warnings |
| `npm run play -- 24 random` | **byte-identical** before/after (`diff` clean, 557 bytes both) |
| `git status` under `src/engine/` | **nothing modified** |
| `git status` under `src/content/` | **nothing modified** |
| out-of-bounds files (`reducer.ts`, `view-model.ts`, `types.ts`, `CareerScreen.tsx`, `career.css`) | **not touched by me** — all are modified in the tree by lane A/026, which is expected |
| my diff | `src/ui/session/bands.ts` and `src/ui/session/bands.test.ts` only |
| on-screen confirmation, defect 1 | **yes** — `11 snaps   2 FG   4 Points` at 1456px |
| on-screen confirmation, defect 2 | **yes** — `344 snaps   34 Tackles   3 INT   7 PBU` above `ON THE FIELD / on the scout team` |

**On "before and after" in the browser.** For defect 1 there is no "after" — the cause is frozen and
my proposal is unapplied. For defect 2 the after-state is **identical to the before-state by design**,
because the fix is gated behind §7's one-line diff in a file I am forbidden to edit this wave. The
fix's behaviour is proven by the 7 unit tests instead. I did **not** apply §7 to get a prettier
screenshot.

**One transient note:** at one point mid-run `npm test` showed 1 failure in `reducer.test.ts` and
`npm run typecheck` showed `Property 'account' is missing in type ... Resolved` in
`storage.test.ts` / `view-model.test.ts`. Those are lane A's `CardAccount` work landing in stages;
they were green again minutes later and are green now. Nothing to action — recorded only so the PM
knows a red window in this tree during wave 12 was not lane C.

**One thing for the PM before committing:** the tree has an untracked `scratch-measure.ts` at the
repo root, headed *"TEMPORARY measurement harness for brief 026. Deleted before reporting."* It is
lane A's and not mine (all of my probes live in the session scratchpad, outside the repo). It should
not reach a commit.

---

## 9. Summary of what is owed to whom

| # | defect | cause | owner | state |
|---|---|---|---|---|
| 1 | `3 FG · 6 Points` | `content/events/k.ts` — 12 `fieldGoals` effects, 1 `points` effect (line 141) | content (frozen) | **proposal §1**: pair every FG effect with `points: 3 × N` |
| 2 | `ON THE FIELD: on the scout team` beside 339 snaps | `bands.ts:20–21` — a playing-time claim derived from `overall` | **me** | **fixed** in `bands.ts`; needs §7's one-line `view-model.ts` diff to take effect |
| 3 | "climbing draft boards" at 60 OVR | `content/events/oskill.ts:312` — no class/overall gate; `EventConditions` has no `minOverall` | content (frozen) + optional engine | **proposal §3**: `minClass: "JR"` + `requiresPlaying` on all **four** cards of the family; optional `minOverall` field |
| 4 | "Ten wins is a disappointing season" beside 5-7 | `content/events/universal.ts:123–125` — no record condition, and none is possible mid-postseason (`postseason.ts:62–78`) | content (frozen) | **proposal §4**: reword; do not gate |
| 5 | the redshirt card lies | `engine/advance.ts:74, :76` — the strings promise zero snaps; `sitSnapModifier: 0.05` credits a median of 26 | engine (frozen) | **proposal §5A** (two strings, no RNG movement); **§5B** as the UI fallback |
| — | **52 of 59 production cards fire during a redshirt** | `requiresPlaying` missing across `content/events/**` | content (frozen) | **proposal §6** + a `validateContent` rule — *the highest-leverage item here* |
| — | `SeasonLine.redshirt` is written and read by nothing | DECISION 039 reserved it for its own brief | PM | **flagged, not taken** |

**Nothing was found wrong in `labels.ts` or `ledger.ts`.** I read both against all five defects: the
stat labels, the singular/plural rule, the sequence labels, the `classYearLabel` repeat qualifier and
the current-row logic are all correct and none of them is implicated.
