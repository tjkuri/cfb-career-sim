# 058 — Where do I stand, while I am still standing there?

**Type:** developer (UI) · **Wave:** 31 · **Status:** ready

Repo: `/Users/tkuri/Documents/personal_projects/cfb-career-sim`

## Goal

Make the player's standing with the program **legible during play** — and stop the game narrating
every change to it as a thing that happened in a locker room.

## Why — two findings from one playtest, and one of them is a quote

A playtester played three careers, ~114 decisions, deliberately trying to earn standing. Asked at the
end of the good-teammate career whether they had **built something or only avoided losing it**, they
answered **neither**:

> 34 decisions of deliberate good-teammate play ended on the exact rung the character-creation screen
> handed me, and nothing ever felt at risk because the readout never moved.

They also reported that **the five-rung ladder is shown for the first time in the credits.** During a
whole career the player sees a phrase, and never the scale it sits on. They stopped tracking it around
decision 12.

Second finding, verified in source by the PM: on `offfield-money-manager` / *"Let him handle it"*, the
**positive** outcome reads *"He actually gets you a decent deal. You stop thinking about it, which is
the point."*, carries `overall +2` — and fires **"Cost you in the locker room."** Nothing on that card
connects a cousin managing NIL money to a locker room. The character currency tracks **integrity
broadly**; the display names **one specific room**.

## What to build — item 1: the ladder, during play

`TRUST_LADDER` and `trustRungOf` are already exported from `src/ui/session/bands.ts` and already drawn
by `SummaryScreen.tsx`. **Read how the summary draws it before you design anything** — a playtester
called that element *"large, clear, well-designed"*, so the in-play version should read as the same
object seen earlier, not as a second unrelated widget.

`view.trust` is already on the view model. **You should not need to change `view-model.ts` or
`bands.ts` at all**; if you believe you do, say so in the report and stop rather than reaching.

Design questions that are yours to answer, not mine:

- Does the ladder belong on screen permanently, or does it appear when it moves and rest as a phrase?
  The playtester's complaint is that nothing *felt at risk* — a scale you can see is a scale you can
  fall down. Argue your choice.
- The screen is already dense and the **decision and its options must stay the clear focal point**.
  Standing is context, not the subject. If your design competes with the options, it is wrong.
- The existing move callout (`CareerScreen.tsx:~486`, *"Your standing in the locker room moved…"*) is
  a **direction-only** beat and stays direction-only. Do not let the ladder become a progress bar.

## What to build — item 2: the vocabulary

`CareerScreen.tsx:95-96` hard-codes *"Cost you in the locker room."* / *"Earned you credit in the
locker room."* for every character change in the game.

**Our reading, which you should try to refute before implementing anything:** the sentence is wrong
whenever the card has nothing to do with teammates — NIL money, a speeding ticket, a financial
advisor, family — and right when it does. If that is true, the cheapest honest fix is a phrase that
covers the whole currency (*"with the program"*, *"with the people who decide"* — your call, and the
summary's own heading *"In the locker room"* may need to move with it).

**Before you change the string, measure how often it is actually wrong.** Read the cards in
`src/content/events/**` that carry character effects and hand-score how many are locker-room-shaped
versus not. If it turns out most are genuinely about the team, then a blanket rewrite makes the common
case worse to fix the rare one — **report that and change nothing.** That is a success, not a failure.
Say which it is with a count.

**Do not make the line card-aware by adding a field to content.** `src/content/**` is frozen and a
schema change is the user's call, not this lane's.

## Hard constraints — design intent, not preferences

- `overall` **is** shown as a number. `character` is **never** shown as a number, only as a band
  phrase. It swings draft stock ~±7.5 against overall's ~82; an integer would overstate it tenfold.
  **The ladder is order only — never a distance, a count, a percentage or a bar.** `trustMove` cannot
  return a size on purpose; do not reintroduce size as typography, length or motion.
- Never display: school tier or any badge implying it, `draftStock`, event `probability` or `weight`,
  EV, or school trait names. Traits are discovered by replaying, never stated.
- `src/engine/**` and `src/content/**` are **frozen.** A change you believe is needed there is a
  proposal, not an edit.
- `src/ui/session/view-model.ts` is the only module allowed to read `GameState`. Do not bypass that
  boundary — it is what makes the hidden-mechanics rule testable.
- Aesthetic direction is fixed: dark theme, clean sans-serif, card-based, generous whitespace, minimal
  chrome, the decision and its options are the clear focal point.
- Type, colour and contrast are **settled** across nine playtests. Do not reopen them.

## Files

**Yours:** `src/ui/screens/CareerScreen.tsx`, `src/ui/styles/career.css`, and their tests.
**Out of bounds:** `src/ui/session/view-model.ts`, `src/ui/session/bands.ts`, `src/engine/**`,
`src/content/**`, and `src/sim/**` (lane 059 owns a probe there this wave).
`SummaryScreen.tsx` is **read-only** — read it to match the ladder's existing design, do not edit it.

## Verify before reporting

- `npm test` — **756 green** at HEAD, plus whatever you add.
- `npm run typecheck` — **two passes, both exit 0.**
- **Identity is the pass for this lane:** it is display-only, so `npm run balance` must be
  **byte-identical** to HEAD on two seeds. Say what you ran and what it printed.
- **Click through it at `http://localhost:5173`** — the server is already running, do **not** start
  one. Play far enough to see the standing change in both directions, and say in the report what you
  saw, not what you expect.

**Do not commit.** The PM commits. Never `git checkout`, `restore`, or `stash`.

**Never run a foreground command that does not terminate.** If a tool call fails 3 times, stop and
write up what you have.

Use the `frontend-design` skill for the visual work.

**REPORT:** write findings to
`docs/superpowers/polish/reports/058-where-do-i-stand-while-i-am-standing-there.md`.
Return to the PM **only**: status, **≤5 bullets**, and that path. Never the full findings.
Lead with: what you chose for the in-play ladder and why; and the **count** behind your
locker-room-vocabulary call, including if that count told you to change nothing.
