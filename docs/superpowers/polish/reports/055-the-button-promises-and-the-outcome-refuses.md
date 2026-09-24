# 055 — The button promises, and the outcome refuses

Branch `polish/ui-phase`. `npm test` 740 passed / 42 files, `npm run typecheck` exit 0 (both
projects), `npm run build` clean. Verified in the browser at 1456×900 and at a 360px content box.

> **Test-count note.** The brief says 728, and 728 was the count at the commit it was written against
> (`4a1fc96`). Brief 054 landed while this task was running (`f2c3188`, `733c22a`) and brought the
> baseline to **739**, measured by stashing this task's changes. This task adds **one** test:
> 739 → **740**. Nothing owned by 054 — `src/ui/session/bands.ts` — was edited, and it was not read
> for content.

---

## The headline, stated first because it changes the brief

**There is no button.** `reducer.ts:openCard` resolves a one-option card the instant the player
arrives on it — DECISION 018, and the docblock says so: *"A decision with exactly one option is not a
decision — it is a narrated beat… Resolve it the moment the player arrives on it."* The single option
is **never rendered as an option**. The player never presses it.

What they read instead is `CareerScreen.tsx`'s narrated beat: the card's setup, then
`<p class="resolved-beat">{label}</p>` — the option label alone, as a **bare declarative line** — then
the outcome. So *"Answer it on the practice field"* over *"the whiffs don't stop"* is **not the prose
contradicting itself.** It is this screen **narrating an option label as a completed event** and then
printing prose that says it did not happen.

A multi-option card never does that. Its label goes out under **"You chose:"**, which frames it as an
intention. The one-option card had that frame deliberately stripped off it — correctly, because
"chose" is false — and was left with **nothing in its place**, which turned every intention into an
assertion of fact.

**That is a presentation defect, it is one layer above the prose, and it is in my lane.** The
acute case was acute because of the UI. RA is real and it is implemented.

---

## 1. The class, enumerated

Corpus: **106 events, 204 options**, of which **144 carry a failure branch** (`probability < 1` with a
`negativeOutcome`). An option with no failure branch cannot be contradicted and is out of the class by
structure.

### The rule (a second reader can apply this)

> **The declarative-rephrase test.** Rewrite the label as a completed past-tense statement about the
> player — *"Win the job"* → *"You won the job."* Then read the **failure branch**. If the failure
> branch makes that sentence **false**, the label **asserted a result**. If the sentence stays **true**
> and the failure branch only reports a consequence, the label **named an action**.

Worked, in both directions:

| Label | Rephrase | Failure branch | Verdict |
|---|---|---|---|
| Study the tape | *You studied the tape.* | *"You're gassed for practice."* | still true → **action** |
| Turn it up field | *You turned it up field.* | *"run down from behind at the ten"* | still true → **action** |
| Win the job | *You won the job.* | *"pressing looks exactly like panicking on film"* | false → **assertion** |
| Shake it off | *You shook it off.* | *"It sticks with you."* | false → **assertion** |
| Pin your ears back all game | *You pinned them back all game.* | *"you watch the fourth quarter from the sideline"* | false → **assertion** |

The test is deliberately **not lexical**. I tried to mechanise it (label content-words ∩ failure-branch
content-words, plus a denial cue) and it **misses the flagship instance**: *"Win the job"* and *"You
press, and pressing looks exactly like panicking on film"* share no content word at all. A keyword
classifier for this class is not available; the artifact is the rule, and the check below is on the
rule.

### 1a. One-option cards — the acute population

**13 authored one-option options. 12 are real cards** (`recruiting/commit` never renders — the engine
overrides that card's options at runtime with school offers). **All 12 carry a failure branch.**

**Contradicted — 6 of 12:**

| Card | Label | Failure branch |
|---|---|---|
| `milestone-fall-camp` Fall Camp Battle | Win the job | *You press, and pressing looks exactly like panicking on film.* |
| `the-missed-tackle-reel` The Missed Tackle Reel | Answer it on the practice field | *…the whiffs don't stop.* |
| `the-drop` The Drop | Shake it off | *It sticks with you…* |
| `cadence-trouble` Cadence Trouble | Reset and tighten the count | *…by the fourth quarter you're guessing at the snap.* |
| `stat-padding-saturday` Stat-Padding Saturday | Pin your ears back all game | *…you watch the fourth quarter from the sideline.* |
| `the-chip-shot` The Chip Shot | Stop thinking and trust your leg | *You think about it exactly one thought too many…* |

**Borderline — 3 of 12** (the rephrase is arguably survivable): `signature-win/ball-out` *"Leave it
all on the field"* → *"Nerves. Two picks"*; `milestone-senior-day/walk` *"Soak it in"* → *"crying
before kickoff"* (crying **is** soaking it in); `new-line-coach/rebuild-it` *"Trust the rebuild"* →
*"still fighting old habits"* (you did trust it).

**Clean — 3 of 12:** `speeding-georgia/cooperate`, `film-study/study`, `the-long-one/turn-it-upfield`.

### 1b. Multi-option cards — the chosen branch contradicted by its own outcome

**25 of the 132 multi-option options that carry a failure branch (18.9%).** 16 clear, 9 soft.

*Clear (16):* `the-knee/walk-it-off` ("Get up and finish the drive" → *"It does not hold."*),
`postseason-coaching-carousel/hold-the-room`, `nonconf-blowout-sideline/work-the-sideline`,
`conference-primetime/press-for-the-moment`, `offfield-skip-install/do-the-podcast`, `catfished/laugh`,
`transfer-qb/compete`, `facing-the-freak/handle-him-solo`, `coverage-install/memorize-the-whole-manual`,
`special-teams-gunner/sprint-the-lane`, `new-holder/grind-the-operation`, `the-yips/push-through-alone`,
`the-fake/run-the-fake`, `onside-kick/pooch-it-perfect`, `bowl-game-winner/trot-out-for-the-walk-off`,
`milestone-rivalry/play-through`.

*Soft (9):* `double-teamed-all-day/beat-the-double`, `the-pick-six/take-it-to-the-house`,
`blueblood-scouts-at-practice/make-them-write-it-down`, `iced/stay-locked-in`, and the five
`milestone-opener-*/handle-it` siblings that all read **"Take care of business."**

### 1c. The classifier, checked

A seeded shuffle drew **24 of the 204 options**; 6 had no failure branch (out of class by structure),
leaving **18 scorable**. I re-scored all 24 from label + failure text alone and compared to the
full-sweep pass.

**Disagreement: 1 of 18 = 5.6%.** The single disagreement is `milestone-opener-last/stay-within`
*"Let it be a football game"* → *"You hold something back for later. There is no later."* — **both
passes flagged it borderline**, they differed only on which side of the line to drop it. Among the
options neither pass called borderline, disagreement was **0 of 17**.

**Honest caveat, because the brief asked for the classifier to be checked like a diagnosis:** this is
**test-retest on one reader**, not inter-rater. The rule is a sentence-truth judgement and a second
human would move some of the 12 borderline calls (9 multi + 3 one-option). The load-bearing number —
the 6 clear one-option contradictions — is not where the ambiguity lives.

---

## 2. What a player actually meets

Probe: `scratchpad/meet.ts`, the real engine and the real `makePolicy`. **3,000 careers per profile**,
positions round-robined across all seven.

| profile | mean decisions | one-option contradictions / career | **careers with ≥ 1** | incl. borderline | multi / career | careers with ≥ 1 of any |
|---|---|---|---|---|---|---|
| `good` | 40.9 | **1.10** | **72.9%** | 1.37 (79.3%) | 2.56 | 98.7% |
| `virtueLoyal` | 38.3 | **1.12** | **74.1%** | 1.37 (80.3%) | 2.42 | 98.7% |
| `baselineRandom` | 40.1 | **1.09** | **72.4%** | 1.34 (79.2%) | 2.12 | 96.9% |
| `lazyFull` | 37.5 | **1.12** | **73.8%** | 1.37 (80.5%) | 1.81 | 96.4% |

**053's "three times in three careers" is CONFIRMED, not a fluke.** At ~73% per career, three careers
in a row all hitting one has probability ≈ 0.39 — ordinary. This is common.

**The profile column is flat on purpose, and that is the finding.** A one-option card is not a
decision, so *how well you play changes nothing about how often you meet this*. Skill cannot avoid it.
The multi-option column does move with policy (1.81 → 2.56), because there the player picks.

### The one-option load is essentially ONE CARD

8,000 careers, per-card:

| card | shown / career | contradicted / career | failure rate |
|---|---|---|---|
| **`milestone-fall-camp` Win the job** | **2.98** | **1.048** | 35.2% |
| `milestone-senior-day` Soak it in *(borderline)* | 0.98 | 0.199 | 20.4% |
| `signature-win` Leave it all on the field *(borderline)* | 0.10 | 0.042 | 41.4% |
| `new-line-coach` Trust the rebuild *(borderline)* | 0.07 | 0.030 | 41.9% |
| `the-missed-tackle-reel` Answer it | 0.05 | 0.020 | 37.8% |
| `the-drop` Shake it off | 0.06 | 0.017 | 30.5% |
| `cadence-trouble` Reset and tighten | 0.06 | 0.014 | 25.2% |
| `stat-padding-saturday` Pin your ears back | 0.08 | 0.012 | 14.4% |
| `the-chip-shot` Stop thinking | 0.05 | 0.012 | 22.5% |

**Fall Camp Battle is 1.048 of the 1.10 — 95% of the whole acute class.** It is a `kind: "fixed"` event
gated `minClass: "SO"`, so it fires **every offseason from sophomore year on**, three times in a normal
career, and loses its roll a third of the time. Everything else in the class is a rounding error.

That is worth saying plainly: **"the one-option contradiction" is, in practice, "Fall Camp Battle."**
It is also the card 053 filed under *stale flavour* — *"your name is written in pencil"*, four years
running, to an All-America-caliber senior. **One card carries both defects.**

---

## 3. Routes, priced

### R0 — do nothing
Rejected. 73% of careers, policy-independent, and the defect class the board has already had refuted
by eight playtesters in a row.

### RA — UI. **IMPLEMENTED.**

The one thing in the *presentation* that makes the label read as a promise is that it is presented as
**narration of a completed event**. The fix is to give it back a frame — not "chose", which is false,
but an **intention**:

```
The plan: Win the job
────────────────────────
You press, and pressing looks exactly like panicking on film.
−1 OVR
```

Under that reading the card is **coherent**: he went into camp meaning to win the job, and he pressed.
The contradiction does not survive the reframe. All 6 clear and all 3 borderline one-option instances
are resolved by it, on both branches, with **no prose touched**.

Three constraints it respects:

* **Unconditional.** Captioning only the failures — or dropping the beat on them — would tell the
  player which branch fired before they read it. *A card must never reveal the roll it made.* Every
  one-option card gets the same caption on both branches. (This is the reason the obvious alternative —
  suppress the beat when it is falsified — is **forbidden**, not merely worse.)
* **DECISION 018 is not reversed.** 018's objection is that "You chose:" is a lie on a card that was
  never a choice. "The plan" is true of a card the player never decided. The single narrated beat, the
  hairline seam, and the auto-resolve all stand.
* **DECISION 012 is not touched.** The caption is `--chalk-faint`, one weight, no second colour; the
  emphasis slot stays on what the card *did*.

Files: `src/ui/screens/CareerScreen.tsx`, `src/ui/styles/career.css` (`.beat-frame`).
Measured at a 360px content box: every one-option label in the bundle, captioned, is **one text line**
(longest is *"Stop thinking and trust your leg"*, 42 chars with the caption) — well inside the existing
5-line clamp. Clicked through in the browser on both branches of Fall Camp Battle and on Senior Day.

**What RA does NOT fix, stated so nobody thinks it did:**
* The **25 multi-option** instances. Those already carry "You chose:" — the intention frame is already
  there — so the contradiction that remains is genuinely in the prose. **RB.**
* **D33 Targeting Review.** That is not a label/outcome defect at all: the *card description* says
  *"the booth stops the game to review it for targeting"* and option 2's outcome says *"no flag, no
  review."* Description vs outcome, one layer deeper than anything the screen can reframe. **RB.**
* **D28.** *"You do exactly what you did last summer, and in August it shows that you did."* passes the
  rephrase test — you did stay and train. Its defect is that the **failure branch is written as a
  positive sentence** and then priced at −1 OVR and −2 character. Prose. **RB.**

### RB — content. **PROPOSAL ONLY** (`src/content/**` frozen)

Ranked by measured player-facing load:

1. **`milestone-fall-camp` — the whole ballgame.** Label *"Win the job"* → an action, e.g. *"Take every
   rep like it's the last one"* (which is already the positive outcome's own words, so the card is
   telling you what the action was). **95% of the acute class, one string.** While that card is open:
   its description is served three times per career unchanged. `EventConditions` already carries
   `seasonIndex`, `minOverall` and `requiresFinalSeason`, so per-season and per-quality variants are
   authorable with **no engine change** — *"your name is written in pencil"* does not have to be said
   to a senior All-American.
2. The other 5 clear one-option labels (§1a) — same treatment, negligible measured load, but they are
   the cards that read worst when they do land.
3. The 16 clear multi-option labels (§1b). Highest-traffic first:
   `milestone-rivalry/play-through` ("Play through it" → the ankle goes on the second series) and
   `offfield-skip-install/do-the-podcast` (the label's *second clause*, "catch the install later", is
   the part the failure branch denies).
4. **D33 `targeting-review`**: the description asserts a booth review that option 2's outcome says did
   not happen. Either the description stops asserting the review, or option 2's prose stops denying it.
5. **D28 `offseason-going-home/stay-and-train`**: rewrite the negative branch so a −1 OVR / −2
   character result does not read as a compliment.

### RC — schema/lint. **PROPOSAL ONLY** (`schema.ts` is content)

A build-time rule in `validateContent`. **I do not recommend the obvious form of it.** §1's own finding
is that "asserts a result" is **not lexically decidable** — the flagship instance shares no word with
its failure branch, and any keyword list that catches *"Win"* also catches *"Wave for the trainer"*.
A lint that fires on a verb list would be noise with a build failure attached.

What *is* mechanically decidable, and worth having:

```ts
// One-option cards are a special population (DECISION 070, and TASK 055's
// measurement: the player cannot decline them, so no amount of skill changes
// how often they land). Require each one to be reviewed against the
// declarative-rephrase test and to record that it was.
for (const ev of bundle.events)
  if (ev.options.length === 1 && ev.options[0]!.negativeOutcome && !ev.options[0]!.labelReviewed)
    errors.push(`Event ${ev.id}: one-option card with a failure branch must carry labelReviewed`);
```

A required acknowledgement field on a population of 12, not a guess at English. It costs one boolean
per card, it cannot produce a false positive, and it makes the next author of a one-option card read
this rule. **A verb-list lint should be refused.**

---

## 4. The separable small defects

### 4a. Duplicate narration of one healed injury — **FIXED** (`view-model.ts`)

053 saw *"An injury healed and gave the points back"* at the end of season 2 beside **+1**, then again
on the first card of season 3 beside **+5** (the real restoration). One heal, narrated twice, with two
different numbers.

**Root cause, found and falsified rather than guessed.** `someInjuryLeft` matched each prior injury to a
survivor with a **strictly smaller** `remainingPhases`. But `tickPhaseStart` is the only thing that ever
decrements one — so on **every advance that did not cross a phase**, which is most of them, a perfectly
healthy, unchanged injury list **failed to match itself** and was reported as a heal.

Measured over 2,000 careers (`good`/`virtueLoyal`/`baselineRandom`/`lazyFull`, 500 each, **78,605
advances**):

| | before | after |
|---|---|---|
| `healed: true` reports | 10,298 | **2,542** |
| …of which the injury list was **byte-identical** before and after (impossible heals) | **7,693 (74.7%)** | **0** |
| careers carrying ≥ 1 false line | **1,565 (78.3%)** | **0** |
| unambiguous true heals (injury count strictly fell) | 2,491 | 2,491 |
| …**missed** | 0 | **0** |

**Three quarters of every heal sentence the game has ever printed was false.** The playtester saw two
of them because `remainderLine` only surfaces when there is an unattributed figure to explain; the rest
fired silently.

The fix is `<` → `<=`. It does **not** cost the case the strict comparison was written for (brief 049:
an old injury healing underneath a fresh one of the same type) — a fresh injury carries a **full**
`recoveryPhases`, which `validateContent` already floors at 2, so it is always larger than the
remaining phases of anything about to heal and still fails to match. Confirmed by the existing 049
test, which passes unchanged. One regression test added: *"does not read an untouched injury list as a
heal."*

Residual, stated: an advance that ticks **twice** while also causing a fresh injury of the same type
whose `recoveryPhases` exactly equals the healed one's remaining count would be missed. It did not
occur once in 78,605 advances.

### 4b. ON THE FIELD label thrash — **propose, not touched**

*"All-America caliber"* → *"one of the best in the conference"* on an 85→84 change, and back three
cards later. `standingPhrase` lives in `bands.ts`, **owned by brief 054 this wave. Not read for
content, not edited.** For 054: the shape is a hard band edge with no hysteresis — a 1-point wobble
across a boundary restates the whole claim. The cheap fix is a stickiness margin (a phrase you already
hold is kept until you are ≥ N points past the edge you came in on), which costs one extra input (the
previous phrase) and no new vocabulary.

### 4c. Stale flavour — **propose** (content)

*"your name is written in pencil"*, four years running, including to an All-America-caliber senior.
Folded into RB item 1 above, because it is the same card as the whole acute class. `EventConditions`
already has everything needed.

---

## What changed

| file | change |
|---|---|
| `src/ui/screens/CareerScreen.tsx` | RA — the narrated beat carries `The plan:` as an intention frame, unconditionally, on both branches |
| `src/ui/styles/career.css` | `.beat-frame` (caption register); `.resolved-beat` comment updated for the measured 360px line count |
| `src/ui/session/view-model.ts` | `someInjuryLeft`: survivor match `<` → `<=`, with the measurement in the docblock |
| `src/ui/session/view-model.test.ts` | +1 regression test: an untouched injury list is not a heal |

`src/content/**`, `src/content/schema.ts`, `src/engine/**` and `src/ui/session/bands.ts` untouched.

## Open, for the PM

1. **RB item 1 is the whole finding.** Rewriting one label on `milestone-fall-camp` removes 95% of the
   measured acute class. Everything else in RB is polish by comparison.
2. **RC's verb-list form should be refused** and the acknowledgement-field form taken instead. §1
   contains the evidence that the lexical version cannot work.
3. **4b is 054's**, with a suggested shape and no code written.
