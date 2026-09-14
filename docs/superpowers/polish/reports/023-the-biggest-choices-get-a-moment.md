# 023 — The biggest choices in the game get a moment

**Type:** developer · **Wave:** 9 · **Status:** done
**Brief:** `briefs/023-the-biggest-choices-get-a-moment.md`
**Board:** B23 (done), B25 (done), B26 (**delivered by B25's fix; the separate task is dropped, with evidence**)

---

## Summary

| Task | Outcome |
|---|---|
| 1 — hub decisions get a resolution when they carry a material consequence | **Done.** The transfer hub now resolves. Signing Day and the declare card are measured to carry nothing and stay silent — see §3. |
| 2 — the declare card states that eligibility remains | **Done.** `Two seasons of eligibility remain.` under the prompt, above the options. |
| 3 — nothing tells you the end is coming (B26) | **Dropped, and it did not need doing.** 100.0% of careers that end by running out of eligibility already pass through a declare card reading `One season of eligibility remains.` before their final season. The remaining 2.2% end on a bust or a content `ending` effect, which nothing in the save can see coming. §5. |

**Verification.** `npm test` 574 passed / 37 files. `npm run typecheck` run twice, exit 0 both times. Seen
in the browser at 500px and, with the frame clamped, at 360px: a career that transferred, a career
that stayed, and a junior on the declare card.

**Baseline note.** The brief's baseline was 545 tests. The suite was at **560** when this work started —
the concurrent engine agent had already landed 15. This task adds 14, giving 574. **No test of mine
broke on a moved draft result**, and no file under `src/engine/**` or `src/sim/**` was touched.

---

## 1. What was measured first

Nothing here was cut on intuition. A read-only probe drove **3,000 careers** (5 policy profiles ×
6 positions × 100 seeds, `src/sim/policies.ts`) and recorded, for every hub decision, the school
before and after and the `overall` delta across the single `advance()` the player's click produces.

| hub | n | school changed | `overall` moved | terminal after | **card fires** |
|---|---|---|---|---|---|
| Signing Day | 3,000 | — (there is no prior school) | **0.0%** | 0.0% | **0.0%** |
| redshirt | 4,899 | 0.0% | 31.2% | 0.0% | (already had prose) |
| declare | 5,975 | 0.0% | **0.0%** | 17.9% | **0.0%** |
| transfer | 6,676 | 38.5% | 17.0% | 0.0% | **50.0%** |

Transfer, split by what the player chose:

| | n | `overall` moved | mean \|Δ\| | max \|Δ\| |
|---|---|---|---|---|
| stay | 4,103 | 18.6% | 0.92 | 11 |
| moved | 2,573 | 14.5% | 0.74 | 11 |

So the card fires on about **1.1 hubs per career**. That is rare enough to mean something and common
enough to be the answer to B23.

## 2. Task 1 — how the hub card is built

`src/content/**` is frozen and there is no prose for these decisions, so the card is composed from
facts the view-model already holds. `view-model.ts` gains `hubFacts(before, after)`, which returns
`{ from, to }` or null. The rule reads facts only — **it matches no event id**, so nothing here has to
be kept in sync with `advance.ts`'s hub list:

1. `after.status !== "active"` → nothing.
2. No school **before** the choice → nothing.
3. Otherwise a card appears **iff** the school moved **or** `overall` moved.

`reducer.ts`'s discriminator is unchanged and still exhaustive: `applyChoice` sets `lastOutcome` for
every authored event, so `outcome === null` means "hub" by construction.

**What the card says.** Title, `You chose: <the label they pressed>`, then inside the existing
`.consequence` rule:

* **`Southern Mississippi → Middle Tennessee State`** when the school moved. The origin is set at
  `--chalk-faint`, the destination at `--chalk` / 700, so the eye lands on where the career *is*.
  This is the one fact the pressed button did not already carry, and it is the sentence the 017
  playtester said the game never wrote.
* The **OVR delta**, through the machinery DECISION 012 already built — same rule, same hue at every
  magnitude, scale and weight only.

**What it does not say.** No tier, no badge, no hint about whether the move was wise, no reference to
the offer not taken. A card that moved schools without moving OVR prints two school names and a
number of zero, and that is all it is entitled to print.

**Click cost.** `openCard` steps aside while a hub card is on screen, so the one-option beat that
landed behind it opens on the Continue the player was going to press anyway. A material hub costs
**one** extra click and never eats a beat. A hub that resolved to nothing behaves exactly as before.

## 3. Two hubs that should stay silent, and why

The brief invited this finding, and the measurement makes it, rather than taste.

**Signing Day — silent.** There is no school to have moved *from*: the career holds no school id at
all until the choice resolves. The only "move" available is from nowhere to the school the player
picked one click ago and the rail is already printing at the top of the screen. And there is never a
second fact to carry — Signing Day moved `overall` by **0 in 3,000 of 3,000 careers**. A card here is
the empty ceremonial card the brief forbids, wearing a school name.

**Declare — silent, on both branches.**

* *Declare* is terminal. The next screen **is** the resolution — the draft verdict wave 8 spent its
  whole budget making loud (DECISIONS 026/032). A card in front of it is a click, not a beat.
* *Return to school* changes nothing **measurably**: `raiseNextHubDecision` hands straight to the
  transfer hub, so `advance()` returns before any simulation runs. `overall` moved on **0 of 4,903**
  return-to-school choices. The consequence of returning is charged in the season that follows, and
  the transfer card one screen later is where it lands.

The redshirt hub was never in scope and is untouched — *taking* it authors its own prose, which is the
machinery report 017 observed already working.

## 4. Task 2 — the declare card states the eligibility that remains

`CareerView` gains `decisionNote: string | null`, printed under the decision's own prompt and above
the options, behind a hairline:

> **Declare for the Draft?**
> You're draft-eligible. Cash in now, or return for another season?
> ─────
> Two seasons of eligibility remain.

The count is `CLASS_ORDER.length + (redshirtUsed ? 1 : 0) − yearsUsed` — exactly the arithmetic
`enterOffseason` uses to force a declaration — and it **includes the season about to be played**, so a
junior who returns is told two and hears one the following offseason.

**DECISION 025 is untouched.** No projection, no `draftStock`, no round, no "you would go undrafted".
A test asserts the sentence is byte-identical for a 40-overall / 20-character player and a 95/95
player in the same class year, so it cannot be inverted into anything hidden. It is set at `--t-meta`
/ `--chalk-faint` on purpose: DECISION 025 refused advice, and a sentence that *looked* like advice
would smuggle the refusal back in through typography. The ledger's dashed row still does most of this
work.

Spelled out (`Two seasons`) rather than set as a numeral: every numeral on that screen is a measured
quantity — the OVR, the snap count, the record — and `2` beside them reads as a fourth statistic.

## 5. Task 3 (B26) — dropped, because Task 2 is the honest version of it

The ask was a "final season" signal. Over the same 3,000 careers:

| how a career ends | share | predictable? |
|---|---|---|
| ran out of eligibility | 62.1% | **yes** — it is arithmetic on `yearsUsed` |
| the player declared early | 35.7% | it is the player's own choice, made on the card |
| busted / content `ending` effect | 2.2% | **no** — an RNG roll with no antecedent in the save |

And the decisive number:

> **Of the 1,863 careers that ended by running out of eligibility, 100.0% passed through a declare
> card reading `One season of eligibility remains.` before their final season.**

A separate marker would reach *fewer* careers than the note already does (a during-the-season "last
eligible season" flag would have fired on 62.2%, against the declare note's 65.9%), and it would
arrive **later** — during the season, when nothing can be done — rather than in the offseason, on the
card where the choice actually is.

That leaves only the 2.2% that end on a bust or a career-ending injury. Marking those in advance
would mean inventing a signal from state that does not contain one, which is precisely the mistake
DECISION 033 was written about: the dashed ledger row was keyed to a condition the UI never checked,
and a "final season" badge on a career that ends in season 3 with a torn leg is the same broken
promise in a new place.

**Recommendation:** close B26 against this work rather than re-raising it, and put the phrasing in
front of the next playtester (§7).

## 6. Files

**Changed (all mine per the brief):**

* `src/ui/session/types.ts` — `HubFacts`; `Resolved.hub`; `Resolved.outcome` documented as `""` on a
  hub card; `CareerView.decisionNote`.
* `src/ui/session/view-model.ts` — `hubFacts()`, `eligibilityLeft()`, `decisionNote()`.
* `src/ui/session/reducer.ts` — `play()` composes the hub card; `normalize()` fills `hub` on an old
  save; the 68–70 comment the brief quoted is replaced with the reasoning that supersedes it.
* `src/ui/screens/CareerScreen.tsx` — the move line, the note line, and a guard so `.consequence`
  never renders as an empty bordered block.
* `src/ui/styles/career.css` — `.move` / `.move-from` / `.move-arrow` / `.move-to`, `.card-note`, and
  `.delta:first-child { margin-top: 0 }` (found by eye: with the delta alone in the block, its top
  margin became a gap between the rule and the numeral the rule is measuring).
* `src/ui/session/reducer.test.ts`, `view-model.test.ts`, `storage.test.ts` — 14 new tests plus three
  one-line fixture updates for the new required field.

**Not touched:** `src/engine/**`, `src/sim/**` (another agent's, this wave), `src/content/**`,
`src/ui/styles/tokens.css`, `SummaryScreen.tsx`, `summary.css`.

**One import worth flagging for review.** `view-model.ts` imports `CLASS_ORDER` from
`../../engine/types` rather than from `../../engine/index`, which is the first value import in
`src/ui/**` that does not go through the barrel. The barrel does not re-export it and the barrel is
`src/engine/**`, which I may not edit this wave. The alternative was writing `4` out as a literal —
a second copy of an engine rule that can change. If `engine/index` later re-exports `CLASS_ORDER`,
this import should be re-pointed at it.

## 7. For the next playtest

1. **Does the transfer card land?** The specific claim to test is the 017 playtester's: that a
   transfer was "acknowledged by one word changing in the header". Does `UTSA → Baylor` plus a delta
   now read as the career event it is?
2. **Does the stay card read as a *consequence* or as noise?** It fires on 18.6% of stays and shows
   only `+5 OVR` under the chosen label. This is the playtester's own 75 → 82 case, and it is the
   thinnest card the change produces.
3. **Does `Two seasons of eligibility remain.` read as a fact or as advice?** It is the one place
   this wave came near DECISION 025's line. If a playtester reports it as the game telling them to
   stay, the treatment is too loud and should lose the hairline before it loses the sentence.
4. **B26, closed on the strength of §5** — worth confirming the 1-season note is actually noticed at
   the moment it fires, not merely present.
