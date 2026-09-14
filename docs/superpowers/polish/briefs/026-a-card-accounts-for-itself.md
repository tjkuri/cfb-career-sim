# 026 — A card accounts for what it did

Repo: `/Users/tkuri/Documents/personal_projects/cfb-career-sim`

**Goal:** a resolved decision card's reported OVR number describes what *that card's chosen outcome*
did. Anything else that landed during the same engine step gets its own beat with its own sentence.
And the character half of an outcome stops being invisible.

**Why.** Four playtests in, the headline finding is that players stop reading the prose — and the
mechanism the fourth one finally supplied is this: *"Repetition is what starts it. The text/number
contradictions are what make it rational to stay that way, and they apply to new cards as much as
repeated ones — which is exactly how it generalises to cards I have never seen."* The writing is this
game's best asset and the numbers are currently telling players not to trust it.

---

## READ THIS FIRST OR YOU WILL DO THE WRONG WORK

The playtester logged six cards whose text contradicts the number:

| Card | Outcome text | Delta shown |
|---|---|---|
| The Position Switch | "The fit never quite comes together, and it shows on the depth chart." | **+5 OVR** |
| The Ticket Hookup | "Compliance flags the resale listing with your name still in the metadata." | **+1 OVR** |
| The Long Attempt | "It's got the leg. It does not have the accuracy — off the upright and away." | **+1 OVR** |
| Bowl Opt-Out | "You watch from the sideline in a polo. Zero new risk, zero new tape." | **+2 OVR** |
| Cutting the Line | "You eat ten minutes later than you wanted to. Nobody notices." | **−3 OVR** |
| Somebody Rolls Up On You | "Sprain, not a tear. They shut you down early." | **−5 OVR** |

**The PM checked all six against source. The prose is correct in every one.** This is not a writing
bug and `src/content/**` is frozen. Do not edit a word of it. DECISION 046 names three causes:

1. **Deferred effects and progression are attributed to whichever card is on screen.**
   `src/ui/session/reducer.ts:61-64` freezes `overallBefore` *before* `advance()`, and
   `src/ui/screens/CareerScreen.tsx:149-150` renders `view.overall - resolved.overallBefore`. So the
   number on a card is everything that happened during that `advance`: the outcome's own effects,
   **plus** any `timing: "deferred"` effect from an earlier card falling due, **plus** phase
   progression. *The Position Switch* really does author a deferred `−2` under "the fit never quite
   comes together"; the +5 the player saw was other things landing on top of it. *Cutting the Line*
   authors `effects: []` and displayed **−3**.
2. **The character half of an outcome is invisible.** *The Ticket Hookup*'s negative outcome is
   `character −6, overall +1` — which is accurate, getting caught does not make you worse at
   football. But only the `+1` is a number, so "compliance caught me" reads as a reward.
3. **The same card and choice give different results** (*Rivalry Week / Play through it*: +2, +2, −5)
   with no signal that a roll happened. That is probability working correctly and being read as "the
   text does not predict the result."

Read `docs/superpowers/polish/DECISIONS.md` **046** in full before you write code. Read **002**
(character is never a number) and **012** (what the delta block was for) too.

---

## What to build

Scope is (1) and (2). (3) is in scope only if you find a cheap honest signal; it is not the point of
the wave and a wrong answer there is worse than nothing.

**For (1) — the shape of the fix, so you do not have to re-derive it.** The PM has confirmed the
pieces exist:

- `Outcome` is `{ description, effects }` and an `EventOption` has at most two of them
  (`positiveOutcome`, `negativeOutcome`) — `src/engine/types.ts:65-76`. The engine reports only
  `lastOutcome: { description }` (`types.ts:183`), but matching that description against the chosen
  option's two candidate outcomes identifies which fired, from content, with no engine change.
- That gives you the card's **own** `timing: "immediate"` overall effects, its `kind: "injury"`
  effect (magnitude lives in the content bundle's `injuries` map, `overallDelta`), and its
  `kind: "character"` effect.
- The card's own number is then the card's own effects. The remainder — `total − own` — is real and
  must not be silently dropped: it is a deferred effect coming due, or a season of development, or
  both. It deserves its own beat with its own sentence, the same argument DECISION 037 already won
  for the transfer hub.
- Deciding how specific that second beat can honestly be is yours. "A deferred effect from three
  cards ago" is knowable only to the engine; "the rest of this stretch" is knowable to you. **Be
  accurate over being detailed.** A vague true sentence beats a precise invented one.

**For (2) — character, without an integer.** DECISION 002 stands: character is never shown as a
number. It swings draft stock ~±7.5 against overall's ~82; an integer would overstate it tenfold. The
remedy must make a character cost *land as a cost* using words, position, weight or motion. The band
phrase already exists (`src/ui/session/bands.ts`) and today it sits in the same grey directly under
the role phrase, which is B17: it coasts on that adjacency and the playtester moved it twice in three
careers without noticing. A card whose real cost was character should not be able to look like a free
win. **If the only fix you can make work requires an integer, stop and write it up as a proposal in
your report — that is a decision for the user, not for you.**

---

## Files

You own, and no other agent is touching this wave:

- `src/ui/session/reducer.ts` + `reducer.test.ts`
- `src/ui/session/view-model.ts` + `view-model.test.ts`
- `src/ui/session/types.ts`
- `src/ui/screens/CareerScreen.tsx`
- `src/ui/styles/career.css`

**Out of bounds:** `src/engine/**`, `src/content/**` (both frozen — a change you believe is needed is
a *proposal in your report*, not an edit), and `src/ui/session/labels.ts`, `bands.ts`, `ledger.ts`,
which brief 027 owns concurrently. Reading any of these is fine; writing to them is not. If your fix
needs a one-line change in `labels.ts` or `bands.ts`, put the exact diff in your report and the PM
will land it.

---

## Hard constraints — design intent, not preferences

- `overall` **is** shown as a number (recently changed — spec §15). `character` is **never** shown as
  a number, only as a band phrase. It swings draft stock ~±7.5 against overall's ~82; an integer
  would overstate it tenfold.
- Never display: school tier or any badge implying it, `draftStock`, event `probability` or `weight`,
  EV, or school trait names. Traits are meant to be discovered by replaying, never stated.
- `src/engine/**` and `src/content/**` are **frozen**. An agent that believes a change there is
  needed writes a proposal; it does not edit.
- `src/ui/session/view-model.ts` is the only module allowed to read `GameState`. That boundary is
  what makes the hidden-mechanics rule testable. Do not bypass it — in particular, do not start
  reading `GameState` from a component.
- Tests stay green (**baseline is 613**). Both typecheck passes exit 0. Verify before reporting done.
- Aesthetic direction is fixed: dark theme, clean sans-serif, card-based, generous whitespace,
  minimal chrome, the decision and its options are the clear focal point.

## Shell rules — three agents have died on these

- **The dev server is already running on `localhost:5173`. Do not start one.**
- **Never run a foreground command that does not terminate** (`npm run dev`, watch modes). `npm test`
  is fine — it exits.
- **Do not commit.** Do not `git checkout`, `git restore`, `git stash`, or `git reset`. The tree holds
  another agent's uncommitted work at the same time as yours. The PM commits.
- If a tool call fails three times, stop and write up what you have.

## Verify before reporting

- `npm test` — 613 green or more, none failing
- `npm run typecheck` — **two passes**, both exit 0
- `npm run build` — clean
- `npm run play -- 24 random` before and after your change: **byte-identical output**. You changed no
  engine and no content, so this must not move. If it moves, you broke the freeze; find out how.
- `git status` shows **nothing** modified under `src/engine/` or `src/content/`
- Click through at `localhost:5173` yourself: play a career far enough to see a deferred effect come
  due (take *The Position Switch* or any card whose outcome mentions a later cost), and a card whose
  cost is character. Confirm with your eyes that the number now agrees with the words.

Use the `frontend-design` skill for any visual work. Use `superpowers:test-driven-development` —
the six rows in the table above are six test cases.

## REPORT

Write findings to `docs/superpowers/polish/reports/026-a-card-accounts-for-itself.md`.

Cover: what the card's number means now; how you identified the fired outcome; what the second beat
says and why that wording is defensible; what you did for character and whether it needed an integer;
each of the six table rows, before and after, as measured; anything you found and did not fix.

**Return to the PM only:** status (done / blocked / needs-decision), at most five bullets, and that
path. Never the full findings.
