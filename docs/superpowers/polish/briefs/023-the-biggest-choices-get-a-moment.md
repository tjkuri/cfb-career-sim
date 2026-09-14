# 023 — The biggest choices in the game get a moment

**Type:** developer · **Wave:** 9 · **Status:** ready
**Repo:** `/Users/tkuri/Documents/personal_projects/cfb-career-sim`

## Goal

Stop the four most consequential decisions in the game from resolving invisibly, and give the
declare card the one fact it is currently hiding.

## Why

From `reports/017-post-wave6-playtest.md`, claim 8:

> *"Career 1, 'Stay at Baylor' took me 75 → 82 with **no resolution screen and no delta shown at
> all** — the biggest single jump in the career happened in the gap between two clicks... Transferring
> from UTSA to Baylor — the most dramatic thing that happened to Marchetti — was acknowledged by one
> word changing in the header."*

And their closing sentence, asked what single change they would make:

> *"The three cards after a transfer or a redshirt should be about the transfer or the redshirt.
> Right now the two biggest things that can happen to a career are delivered as a one-word header
> change followed by reruns, and they're also the two places where the game has already earned a
> beat."*

**The machinery already exists.** *Taking* the redshirt produces a resolution and a loud `+10 OVR`.
It is wired to one of four hubs.

This also turns out to be the fix for a mechanic nobody could see. Report 018 measured that
transferring up **costs** 0.43–0.91 overall per move and is the *worst* offseason line — yet two
playtesters in a row concluded it was free. The price is real and is charged entirely in the
upside, which is the part the screen never shows. See DECISION 037.

## The cause, already located

`src/ui/session/reducer.ts:68-70`:

```
// Hub decisions (Signing Day, transfer, declare) author no prose because
// their result is the next screen. Nothing to read, so no card.
```

`outcome === null` for these, so `resolved` is `null` and no card renders. That reasoning was sound
when written and the playtest has now falsified it: the result is *not* the next screen when the
consequence is a seven-point overall swing the next screen does not mention.

## Task 1 — hub decisions get a resolution when they carry a material consequence

Transfer, Stay, Declare and Signing Day. A resolution should appear when something actually changed
— a school, an overall movement — and **must not** appear as an empty ceremonial card when nothing
did.

**`src/content/**` is frozen, so there is no authored prose for these and you are not to write any
into content.** Compose the card from facts the view model already holds: where you went, and what
moved. A stated fact is not a leak and is not editorialising — *"Baylor · +7 overall"* says only
what happened. Do **not** characterise the choice, compare it to the road not taken, or imply
whether it was wise (DECISION 012, and the leak check 014 ran).

If you conclude some hubs should stay silent, say which and why in the report — that is a legitimate
finding, not a failure to complete the task.

## Task 2 — the declare card states that eligibility remains

The user has just approved an engine change (DECISION 038) making an early declaration a real
gamble: the deliberately-bad two-season career goes from 89% drafted to 56%. **That agent is working
in `src/engine/**` right now; you do not need their change to land to do this, and you must not
touch their files.**

A card that is now a genuine gamble currently carries no warning whatsoever, which makes it a hidden
trap. The 017 playtester called it *"the most arbitrary choice in the game... a coin flip dressed as
a decision"* — and it is the exact moment they concluded failure was impossible.

**DECISION 025 stands and is not being reopened:** no projection, no `draftStock`, no round estimate,
no "you would go undrafted." What goes in is the **fact** that eligibility remains — how many years
of it, which the player is entitled to know and which leaks nothing about the outcome. Keep it to a
few words and let the ledger's dashed row do the rest of the work.

## Task 3 — nothing tells you the end is coming (B26)

> *"Career 1 ended after season 4 with no warning, on a resolution Continue that turned out to be
> the last click."*

If a final season can be identified without leaking anything, mark it. If it cannot be known in
advance — that is a real possibility and the ledger may already be the honest answer — **say so in
the report and drop the task.** Do not invent a signal the data cannot support; that is exactly the
mistake DECISION 033 was written about.

## Files

**You own:** `src/ui/session/reducer.ts`, `src/ui/session/types.ts`, `src/ui/session/view-model.ts`,
`src/ui/screens/CareerScreen.tsx`, `src/ui/styles/career.css`, and their tests.

**Out of bounds — another agent owns these in this same wave:** all of `src/engine/**` and
`src/sim/**`. They are implementing an approved change to `computeDraftResult`. **If one of your
tests breaks because a draft result moved, report it and leave it** — do not reach into their files
and do not "fix" the number.

Also out of bounds: `src/content/**` (frozen), `src/ui/styles/tokens.css` (settled),
`src/ui/screens/SummaryScreen.tsx` and `src/ui/styles/summary.css` (last wave's work, no reason to
touch them).

## Constraints (hard — design intent, not preferences)

- `overall` **is** shown as a number. `character` is **never** shown as a number, only as a band
  phrase. It swings draft stock ~±7.5 against overall's ~82; an integer would overstate it tenfold.
- Never display: school tier or any badge implying it, `draftStock`, event `probability` or
  `weight`, EV, or school trait names. Traits are meant to be discovered by replaying.
- `src/engine/**` and `src/content/**` are **frozen** for you. Write a proposal; do not edit.
- `src/ui/session/view-model.ts` is the only module allowed to read `GameState`. Do not bypass it.
- **All existing tests stay green. Both typecheck passes exit 0.**
- Aesthetic direction is fixed: dark theme, clean sans-serif, card-based, generous whitespace,
  minimal chrome, the decision and its options are the clear focal point.
- Magnitude may drive scale, weight, opacity and motion. **Valence may never drive hue** (DECISION
  012).

## Verify before reporting

`npm test` and `npm run typecheck` (**two** passes, both exit 0). Then see it: **start the dev server
in the background, never in the foreground** — `npm run dev` does not exit and has hung agents here.
You need a career that transfers and one that stays; seed `localStorage`
(`cfb-career-sim:v1:current`) from a headless run rather than clicking for twenty minutes —
`npm run play -- <seed> random` prints the JSON and `src/sim/policies.ts` has transfer strategies.

Use the `frontend-design` skill for the visual work.

## Report

Write to `docs/superpowers/polish/reports/023-the-biggest-choices-get-a-moment.md`.
Return to the PM **only**: status, **at most five bullets**, and that path.
