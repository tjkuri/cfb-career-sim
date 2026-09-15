# 033 — A card accounts for itself (report, IN PROGRESS)

**Status:** DONE. All three defects fixed and verified in the browser. One item for the PM, in §Proposals.

## Plan
1. Read DECISIONS 056, 046, 037, 002.
2. Read reducer.ts / view-model.ts / types.ts / CareerScreen.tsx / career.css.
3. B45: hub card bare number with no sentence.
4. B46: character sentence loses hierarchy to a small +1 OVR.
5. B47: EVERYTHING ELSE bucket unexplained.
6. Verify: npm test, typecheck, frozen dirs clean, play md5, browser at 1456/360.

## Findings
(to be appended)

## Diagnosis (read from source, before any edit)

**B45 root cause is narrower than "hubs have no account".** `advance.ts`'s `applyChoice`
transfer branch sets `s.school`, `s.snapModifier`, clears `pendingOptions` and raises the
next hub. **It applies no `overall` effect at all.** Same for the recruiting and declare
branches. So a hub card's entire OVR movement is, by construction, *never* the hub's own
doing — it is always one of exactly four other things:

1. an injury healing (`effects.ts:144-145`, `tickPhaseStart` restores `restoreAmount`),
2. an earlier card's deferred effect coming due (`effects.ts:136-138`),
3. a season of development (`advance.ts:207-210`, `enterOffseason`),
4. an ambient injury rolled outside a card (`school-effects.ts:50`).

Those four are the complete set of non-`applyChoice` `overall` writers in the engine
(grepped: `advance.ts:141,207-209`, `effects.ts:26,67,145`). All four are **derivable in
the view-model from the before/after `GameState` pair**, which is the module already
allowed to read `GameState`. That makes the fix a real sentence rather than a vague one.

**This resolves the DECISION 037 tension without picking a side.** 037 wants the hub to
report the whole movement; the defect is that the number has no attribution and no prose.
So the number is left **byte-identical** — same value, same `.delta` accent register, same
magnitude scaling — and it gains a name and a sentence. Nothing is demoted, nothing is
re-attributed to the transfer (which would be a fiction: the transfer's real ~0.43-0.91
price that 037 measured is a statistical expectation, not a term in this arithmetic).

**B47 is the same fix.** `EVERYTHING ELSE` gets the same derived sentence.

**B46 is one emphasis slot with the wrong occupant.** `.consequence` already owns a
magnitude system (`--rule`, `--delta-size`, `--delta-weight`) and `--emphasis` is the
accent for "what the card did". On *The Ticket Hookup* the card did `character -6` and
`overall +1`, and the accent is nailed to the +1 because it is the only numeral.

## Approach
- `Remainder` type + `remainderFacts(before, after)` in view-model.ts; stored on `Resolved`.
- Hub delta gains a label + the derived sentence. EVERYTHING ELSE gains the same sentence.
- `data-lead="character"` on `.consequence` moves the single accent slot to the character
  line when `|own| <= 2` and a character effect fired (BOTH directions, so the accent is
  never a valence signal - DECISION 012).

## Implemented

| File | Change |
|---|---|
| `src/ui/session/types.ts` | new `Remainder` (4 booleans); `Resolved.remainder` |
| `src/ui/session/view-model.ts` | `remainderFacts(before, after)` — diffs the state pair |
| `src/ui/session/reducer.ts` | computes it in `play()`; `normalize` defaults it to null |
| `src/ui/screens/CareerScreen.tsx` | `remainderLine()`; hub label + sentence; else sentence; `data-lead` |
| `src/ui/styles/career.css` | `.else-why`; `[data-lead="character"]` emphasis swap |
| 3 test files | 7 new tests, incl. the completeness falsifier |

## Measurement (the falsifier DECISION 056 asked for)

Population deliberately defined over **what the screen draws a figure for**, hub cards
included — not over cards with authored prose, which is the population that let report 026
be right and useless at the same time.

5,325 resolved cards, all 6 positions x 40 seeds, randomised choice policy:

| | count | with no cause found |
|---|---|---|
| hub cards with a non-zero figure | 58 | **0** |
| authored cards with a non-zero remainder | 681 | **0** |
| figures left with no sentence after `ownInjury` suppression | — | **0** |

Cause distribution: `developed` 535, `healed` 173, `hurt` 28, `developed+hurt` 1,
`healed+hurt` 2. **`landed` fired 0 times**, which agrees with the existing note in
`types.ts`: all 14 deferred effects in the bundle are `delayPhases: 1` and land inside
their own card's advance, so they are `own`, not remainder. The branch is live for content
that defers further and a test covers it directly.

## Gotcha for the next agent: the md5 in the brief

`npm run play -- 24 random` prints npm's own two banner lines **on stdout**, so
`2>/dev/null | md5` hashes the banner too and returns `6b158140d4a84e942200ca6e4c8473ea`.
The brief's `cd2d3895e9c68e8dc485bfa5cc0fc832` is the program output alone. Verified both
ways against a pristine `git archive HEAD` extraction: **identical in both trees**, so the
baseline is untouched. Use `npx tsx src/sim/play-headless.ts 24 random` (or
`npm run play -- 24 random 2>/dev/null | tail -n +3`).

## Verification
- `npm test` — **651 passed** (644 + 7 added), 38 files.
- `npm run typecheck` — both passes exit 0.
- `git status --porcelain src/engine src/content src/sim` — **empty**.
- `npx tsx src/sim/play-headless.ts 24 random | md5` — `cd2d3895e9c68e8dc485bfa5cc0fc832`.
- Browser: done — see below.

## Browser verification (localhost:5173, Chrome)

Careers were not clicked through — per the brief, a terminal `GameState` was written straight
into `localStorage['cfb-career-sim:v1:current']`. A small finder script drove the reducer
headlessly to locate the exact pre-choice state for each of the playtester's two quoted cases,
then the state was injected and the option clicked by hand. Scripts were deleted afterwards.

### The playtester's case 1 — B45, reproduced exactly

Found a state parked on the Transfer Portal at TCU with an `ankle` injury holding
`restoreAmount: 5, remainingPhases: 1`, i.e. the deferred refund about to come due. Clicking
**Stay at TCU** produced, before this wave:

> You chose: Stay at TCU
> **+5 OVR**        ← and nothing else on the card

and now produces:

> You chose: Stay at TCU
> SINCE YOUR LAST CARD
> **+5 OVR**
> An injury healed and gave the points back.

Measured on the card: figure at **24.48px in `rgb(240,180,41)`** — the accent, at the
magnitude-2 size it has always had. **DECISION 037's number is untouched in value and in
loudness.** What it gained is the label and the sentence.

### The playtester's case 2 — B46, reproduced exactly

*The Ticket Hookup* / "Sell the comp tickets", negative branch. Before, the accent sat on the
`+1 OVR` and the character line was grey body text under it. Now:

> Compliance flags the resale listing with your name still in the metadata.
> **Cost you in the locker room.**   ← accent, `--delta-size`/`--delta-weight`
> +1 OVR                              ← `--chalk-dim` at `--t-label`

No integer appears for character. The slot moved; it was not duplicated.

### B47, plus all three at once

*Ghosting the Media* / "Don't show up" lands on a postseason-to-offseason boundary and shows
every fix on one card:

> Sports media runs a week of 'availability' takes with your name in the headline.
> **Cost you in the locker room.**
> THIS CARD / No change
> ──────────────────────
> EVERYTHING ELSE  +2 OVR
> A season of development came in.    ← B47

### The accent is not a valence signal

*Going Home for the Summer* / "Go home for the summer" resolves to `character +`, `overall 0`.
It takes the **same** accent treatment: *"Earned you credit in the locker room."* The rule fires
on `lockerRoom !== null`, both directions, so nothing here tells a cost from a credit by colour
(DECISION 012). The words carry the direction, as they always did.

### Plain cards unchanged

Four consecutive ordinary cards measured: `data-lead` null, no extra lines, delta at **18px in
the accent**, exactly as before. The 46.6%-of-cards common case is byte-identical.

### Breakpoints

| width | result |
|---|---|
| **1456** | `scrollWidth` 1456, no horizontal overflow; card bottom y=514, inside the shell |
| **360** | `scrollWidth` 360, no horizontal overflow; every row at x=63, w=255; ledger below the card |

Both measured in a same-origin iframe sized to the viewport — `resize_window` no-ops in this
browser, as the brief warned.

## Accessibility

The explanatory sentence is visible text and is deliberately **not** repeated into the
`.delta-else` sr-only span, which would make a screen reader say it twice. The hub card's
sr-only sentence is "Since your last card: overall up 5, now 85." with the cause following as
ordinary text. The `[data-lead]` animation is added to the existing
`prefers-reduced-motion` block.

## Proposals — for the PM, not taken here

**1. DECISION 037 and this brief do not conflict, but 037's stated goal is still unmet.**
The brief asked me to say so if they did. They do not: 037 wants the hub to report the
movement, and it still does, unchanged. But the thing 037 actually wanted a player to learn —
that transferring up *costs* 0.43–0.91 overall — is **not** what this number is. `applyChoice`
writes no `overall` on the transfer branch, so a transfer hub's figure is always development,
a heal, a deferred effect or an ambient injury, and never the transfer's price. That price is
an expectation across seeds; a single card cannot show it without an engine-side counterfactual.
The label now says truthfully what the number IS, which stops the card *mis*-teaching. It does
not teach 037's lesson. **If the PM still wants that lesson taught, it is a separate item and
probably not a card.**

**2. `remainder.hurt` can surface an ambient injury** (`school-effects.ts`'s `rollAmbientInjury`,
which only fires for one school trait). It prints *"You got hurt between decisions."* — it
states the injury, never the trait name, and injuries are already a visible concept from
authored cards. It fired on 31 of 5,325 cards. **Flagged rather than assumed safe**: if the PM
reads "an injury with no card attached" as a discoverable tell for a trait, say so and the
clause can be dropped (the figure then keeps its label with no sentence, which is 0.6% of
cards).

**3. `landed` is live but unexercised** (0 of 5,325). Correct today — all 14 deferred effects
are `delayPhases: 1`. It is tested directly, so content that defers further gets the sentence
for free.
