# 026 — A card accounts for what it did

**Type:** UI + measurement · **Status:** done · **2026-09-14**
**Changed:** `src/ui/session/types.ts`, `view-model.ts`, `reducer.ts`, `src/ui/screens/CareerScreen.tsx`,
`src/ui/styles/career.css`, plus their tests and two one-line fixture updates
(`storage.test.ts`, the `Resolved` literal in `view-model.test.ts`).
**Nothing committed.** `src/engine/**` and `src/content/**` are untouched — `git status --porcelain
src/engine src/content` is empty and `npm run play -- 24 random` is byte-identical to a pristine
`HEAD` checkout (`6c53a276f70a983ff4342ef24beaff1269dc9235` both sides, verified by extracting
`git archive HEAD` to a temp dir and running it there rather than by assertion).

---

## Headline

| | |
|---|---|
| Resolved cards measured | **12,847** with prose, 600 careers, all six positions |
| Outcomes the UI failed to identify from its prose | **0** |
| Cards that were reporting a number that was not theirs | **1,736 (13.5%)** |
| — of those, the old number had the **wrong sign** | **227** |
| — of those, a card that authored **no** OVR movement printed one | **758** |
| — of those, a card that **did** move OVR printed nothing | **68** |
| Cards carrying a character effect, now stated in words | **4,117 (32.0%)** |
| — of those, a character **cost** that printed a non-negative OVR (the "free win" shape) | **2,774** |
| Cards that now carry a second beat | **1,736 (13.5%)** |
| Did character need an integer? | **No.** DECISION 002 holds unchanged |
| Tests | 620 → **636 green** · typecheck both passes exit 0 · build clean |

**The one-sentence finding:** the six defects are three different bugs wearing one costume, and the
largest of them is not the deferred effect the brief expected — it is that **`effects: []` was
printing four different numbers.** *The Ticket Hookup*'s "just give them to your actual family"
authors nothing at all and was measured printing **−5, 0, +2 and +5** across 154 resolutions.

---

## 1. What a card's number means now

Three numbers where there was one. The screen computes:

* **`total`** — `view.overall − resolved.overallBefore`, exactly what the card printed before. It is
  everything `advance()` moved: this outcome, an earlier card's deferred effect coming due, a season
  of development, an injury healing.
* **`own`** — what *this card's chosen outcome* did, derived from `src/content/**`. Rendered under
  **THIS CARD** when there is a second number to tell it apart from, and unlabelled when there is
  not.
* **`elsewhere`** — `total − own`. Real, never dropped, and given its own beat under **EVERYTHING
  ELSE**, below a hairline, at `--chalk-dim` and never scaled by magnitude.

`own` is what `--emphasis` and the magnitude tiers now read. That matters on its own: a card that
authored `effects: []` was being set at magnitude tier 2 — thicker rule, bigger numeral — because a
deferred effect from three cards ago happened to land underneath it. The emphasis rule was
amplifying a misattribution.

When the outcome cannot be identified (a hub card, or a save written before the field existed) the
account is `null` and the card falls back to `total` — which is exactly what it always did, and what
DECISION 037 wants on the transfer hub specifically.

## 2. How the fired outcome is identified

No engine change, and none needed. `GameState` carries only `lastOutcome: { description }` —
DECISION 001 strips the positive/negative flag on purpose — but an `EventOption` has at most two
authored outcomes with distinct descriptions. Matching the reported description against the two
candidates of the option the player took identifies which fired, from content the UI already reads.

`cardAccount(before, after, decision, optionId)` lives in `view-model.ts` beside `hubFacts`, takes
both sides of the `advance` for the same reason `seasonStamp` does, and is called once in the
reducer's `play()`. Four properties worth stating:

1. **It is computed only for the option the player chose**, and is never handed `probability`. No
   unchosen branch is reachable through it (DECISIONS 006, 012).
2. **It refuses to guess.** Zero candidates, or two candidates that disagree, returns `null`. An
   ambiguous match is not resolved by picking one: a wrong attribution is the defect being removed.
3. **It clamps the way the engine clamps.** `applyChoice` runs first inside `advance()`, before any
   tick or development, so replaying the outcome's effects from `overallBefore` through the engine's
   own `clampOverall` reproduces its arithmetic exactly. Without this, a player at 99 taking a `+1`
   would be credited a point the engine refused, and a phantom `−1` would be pushed into the
   remainder. `clampOverall` is imported from `src/engine/effects` rather than re-spelled, on the
   same reasoning the file already gives for importing `CLASS_ORDER`.
4. **It covers the redshirt card**, whose prose the engine reads off `content.redshirt` rather than
   `content.events`. That is the only decision outside the event pile that authors prose.

Measured: **0 unidentified outcomes in 12,847 prose cards.** A test asserts that over a played
sample, because a silent fallback to `null` would restore the defect with nothing on screen to show
it.

## 3. The second beat, and why that wording

**"EVERYTHING ELSE  +2 OVR"**, under a hairline, after **THIS CARD**.

The brief left the specificity to me and said accuracy beats detail. What the UI can honestly know
is the arithmetic: this much moved, this much of it was this card, the rest was not. What it cannot
know is *which* of development / a deferred effect / a healing injury supplied the remainder — that
is in `pendingEffects` and `phaseAbs`, both forbidden keys, and a card that guessed would be
inventing. "Everything else" is the largest true statement available, and it is two words, so it
does not compete with the prose.

It is deliberately **not** magnitude-scaled. DECISION 012 attaches emphasis to a *resolved outcome*;
the remainder is the part the card did not resolve.

Two footnotes can attach to the card's own figure, and only these two:

* **`The OVR comes back when the injury heals.`** — fires on 479 cards. `effects.ts` restores the
  full `overallDelta` on heal, so the number is a loan. A card that prints `−5` and says nothing
  contradicts itself twice: once now, and again later when the points reappear as somebody else's
  remainder.
* **`The cost of this one lands later.`** — for a deferred effect still queued when the card is
  read. **This fires zero times on current content**, deliberately; see §6.

## 4. Character, with no integer

**DECISION 002 stands. No integer, no bar, no meter, no dot count, and nothing keyed to magnitude.**
The account carries a direction only — `"cost"` or `"credit"` — so no screen can print a size even
if a later one wanted to.

The screen says one of two fixed sentences:

> **Cost you in the locker room.**
> **Earned you credit in the locker room.**

The three levers 002 leaves open are all spent here and none of them is hue:

* **Words** — the same vocabulary the standing block uses two inches above ("In the locker room"),
  so the card and the header are naming the same axis.
* **Position** — *above* the OVR figure, inside the same rule. On a card whose real cost was
  character the eye must not land on `+1 OVR` first and stop. This is the direct answer to B17.
* **Weight** — 700 at `--chalk`, against the outcome prose's 500 at `--chalk-soft` directly above.
  Same size, same width, same hue: the next sentence of the same paragraph, said harder.

The sentences are terse and invariant on purpose. A character effect fires on **32.0%** of resolved
cards, so this line is read constantly, and a line read that often has to behave the way `+1 OVR`
behaves — a stated fact that never varies — rather than like narration, which is what would turn it
into the wallpaper this wave exists to stop people skimming.

**It did not need an integer, and there is no proposal against 002 in this report.**

Considered and rejected for this wave: making the line louder when the *trust band* crossed. It is
legal (DECISION 012 names a band crossing as permitted emphasis) and it would have needed
`trustBefore` frozen on `Resolved` plus a read of `bands.ts`, which brief 027 owns concurrently. The
unconditional treatment already does the job the defect asked for; the band-crossing variant is
available later at the cost of one field.

## 5. The six rows, before and after, as measured

600 careers, all six positions, varied policy. `old` is the set of distinct numbers that outcome was
measured printing; `own` is what it prints now.

| # | Card / outcome | n | old | **now** | plus |
|---|---|---|---|---|---|
| 1 | **Position Switch** — "the fit never quite comes together" | 7 | `−2` | **−2** | — |
| 1b | Position Switch — "you hold your spot, but the staff quietly notes…" | 29 | `0, +2` | **No change** | *Cost you in the locker room.* |
| 2 | **Ticket Hookup** — "compliance flags the resale listing" | 56 | `+1, +4` | **+1** | *Cost you in the locker room.* |
| 2b | Ticket Hookup — "cash in hand, nobody notices" | 87 | `+1, +6` | **+1** | *Cost you in the locker room.* |
| 2c | Ticket Hookup — "less money, zero risk" (`effects: []`) | 154 | `−5, 0, +2, +5` | **No change** | — |
| 3 | **The Long Attempt** — "off the upright and away" | 7 | `−1, 0, +2` | **−1** | — |
| 3b | The Long Attempt — the 57-yarder made | 6 | `+1, +3, +4` | **+1** | — |
| 4 | **Bowl Opt-Out** — "zero new risk, zero new tape" (`effects: []`) | 20 | `0, +1, +2, +3` | **No change** | — |
| 4b | Bowl Opt-Out — "you take a hard hit" | 11 | `−9, −7, −6` | **−9** | *The OVR comes back when the injury heals.* |
| 5 | **Cutting the Line** — "nobody notices" (`effects: []`) | 128 | `−5, −3, 0, +3` | **No change** | — |
| 5b | Cutting the Line — "somebody films it anyway" | 50 | `−5, −3, 0, +3` | **No change** | *Cost you in the locker room.* |
| 6 | **Somebody Rolls Up On You** — "Sprain, not a tear" | 43 | `−5` | **−5** | *The OVR comes back when the injury heals.* |
| 6b | — "it does not hold" / "the scan finds more" | 48 | `−8, −6, −3` | **−8** | *The OVR comes back when the injury heals.* |

Three things this table says that the brief's version could not:

* **Row 1 inverts the brief's expectation, and the brief's shape was right anyway.** *The Position
  Switch*'s authored `−2` is `delayPhases: 1`, which fires at the next `tickPhaseStart` — and
  `advance()` runs `autoProgress` until the next decision is raised, so whether that tick happens
  before the player sees the card depends on whether the next decision falls in the same phase. On
  this card it always lands inside its own `advance`. **So the `−2` IS this card's number**, and
  disowning it would have printed "No change" under "the fit never quite comes together" — the same
  defect pointing the other way. The account asks `pendingEffects` instead of assuming: an effect
  still queued after the call is a footnote; one that is no longer queued has landed, and is counted
  in `own`. The
  playtester's `+5` was a season of development on top of a real `−2`, and now reads
  `THIS CARD −2 / EVERYTHING ELSE +7`.
* **Row 6 was already correct and is still worth the wave.** The `−5` is the ankle's `overallDelta`
  and nothing else landed, in all 43 resolutions. What was missing is that it is a loan. The card
  now says so, which also pre-explains the `+5` that would otherwise reappear on an unrelated card
  two decisions later as somebody else's remainder.
* **`effects: []` was the biggest offender, not the deferred effect.** Rows 2c, 4, 5 and 5b are
  outcomes that author nothing, or nothing on the OVR axis, and between them they printed **eight
  distinct numbers** across 352 resolutions. All four now say `No change`.

## 6. What I found and did not fix

1. **"Deferred" does not defer, for the player.** All 14 deferred effects in the bundle are
   `delayPhases: 1`, and in 600 careers **every one of them landed inside its own card's
   `advance`** — because the next decision was always in a later phase. An author writing "this will
   cost you later" gets a cost that lands on the same card. The UI now reports that honestly, and
   the `The cost of this one lands later.` branch is unreachable on today's content (it is unit
   tested against a synthetic still-queued state so it cannot rot). **Proposal for the PM:** if a
   genuinely-later cost is wanted, it needs `delayPhases: 2` in content, which is frozen. This is a
   content question, not a UI one, and it is cheap — one field on 14 effects.
2. **Hub cards still report the whole movement**, by design (`account === null` → fall back to
   `total`). Strictly this is the same misattribution: the transfer card's OVR delta is development,
   not the transfer. DECISION 037 chose that deliberately and I did not reopen it. If it is ever
   revisited, the fix is one line — a hub card's `own` is 0, so it would render
   `EVERYTHING ELSE +7` with no `THIS CARD` row.
3. **Non-OVR effects are still unaccounted on the card.** `stat` and `snaps` land on the rail;
   `suspension` lands nowhere. A suspension zeroes snaps for two phases, moves no OVR, and the card
   says nothing about it. Out of this brief's scope, and it is a real gap.
4. **DECISION 046 cause 3 (the same choice giving different results) is partly a measurement
   artefact, and the honest part of it is now visible.** A large share of what looked like variance
   was misattribution, not probability: *wait your turn* authors nothing and printed four different
   numbers. What remains is genuine — *Rivalry Week / play through it* really does roll an injury —
   and that branch now carries `The OVR comes back when the injury heals.`, so the outlier result is
   explained **by the card**, in words, rather than looking like noise. **No probability signal was
   added**; the brief allowed one only if cheap and honest, and everything cheap here would have
   leaked `probability`. I recommend it stay closed until a playtest says the remaining variance is
   still being read as "the text does not predict the result".
5. **`No change` is set in `--emphasis`**, the same gold as a delta, at the lowest magnitude tier.
   It occupies the slot a number would occupy and is asserting the absence of one, which I judged
   should be as legible as the number it replaces. It is the one call in this wave a reviewer might
   reverse on sight; reversing it is a one-line colour change.
6. **The account is persisted, not re-derived.** It is written to `localStorage` on `Resolved` and
   restored through `normalize()`; a pre-026 save restores `account: null` and its card falls back
   to the whole delta. It cannot be re-derived on restore — the option id and the baseline are both
   gone by then.

## 7. Verification

* `npm test` — **636 passed, 0 failed** (620 before; +16 from this wave: 12 in `view-model.test.ts`,
  4 in `reducer.test.ts`). The six table rows are six named test cases, plus branch identification,
  the clamp at 99, the still-queued deferred effect, the redshirt card, the three `null` refusals,
  and an assertion that character never reaches the account as a number.
* `npm run typecheck` — both passes exit 0.
* `npm run build` — clean.
* `npm run play -- 24 random` — byte-identical against a pristine `git archive HEAD` extraction.
* `git status --porcelain src/engine src/content` — empty.
* Clicked through at `localhost:5173`: a character-cost card (*Ghosting the Media* —
  `Cost you in the locker room.` / `THIS CARD +1 OVR` / `EVERYTHING ELSE +2 OVR`), an injury card
  (*Rivalry Week* — `−5 OVR` / `The OVR comes back when the injury heals.`), a `No change` card
  (*Going Home for the Summer* — `THIS CARD No change` / `EVERYTHING ELSE −3 OVR`, where the card
  used to print `−3` under prose saying it went well), an unchanged single-delta card, and an
  unchanged transfer hub card. At a 221px content column — narrower than a 360px phone — no element
  overflows its box and the document does not scroll horizontally.
