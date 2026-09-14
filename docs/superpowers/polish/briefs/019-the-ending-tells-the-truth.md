# 019 — The ending tells the truth about a bad career

**Type:** developer · **Wave:** 8 · **Status:** ready
**Repo:** `/Users/tkuri/Documents/personal_projects/cfb-career-sim`

## Goal

Make the end-of-career screen say the true thing at the size the true thing deserves — so a tanked
career stops reading as a celebration, and two *good* endings stop reading as identical.

## Why

A playtester deliberately tanked a career — transferred *down* to an FCS school, refused the
trainer, declared after two seasons at 61 OVR off a 2-10 record — and reported:

> *"The floor is a gold headline, two trophies and a sunshine emoji."*

And separately, on two successful careers:

> *"Round 2 vs Round 3: no. Side by side those two headlines are the same size, the same weight and
> the same colour. If you covered the digits I could not tell you which career went better."*

Both of those were the **pre-registered falsifiers** of decisions we made. Read
`docs/superpowers/polish/DECISIONS.md` entries **032** (the call this brief implements), **034**,
**035**, and — for the rule none of this may break — **012** and **026**. The full playtest is
`reports/017-post-wave6-playtest.md`; claims 5, 6, 7 and 8 are yours.

## The four tasks

### 1. Widen the verdict scale so adjacent rounds separate

The five-step scale (R1 / R2–3 / R4–5 / R6–7 / no call) currently spreads 1.12 → 0.72. It
distinguishes good from bad and **not** good from slightly better — and rounds 1–4 is where most
careers land, so it is failing in the only band that matters. 026 pre-specified this exact lever:
**widen the spread, do not add a hue.**

Measure the round distribution before choosing numbers (`src/sim/balance.ts` reports it) and put the
resolution where the careers actually are. Report the spread you chose and why.

### 2. Invert the hierarchy on a declining career — the big one

The playtester found the only honest element on the screen and told us where we had put it:

> *"`ACROSS 2 SEASONS · 63 → 59 · −4` ... is the only honest sentence on the page, and it is set in
> the smallest, dimmest type available, three screens above the giant gold headline. The hierarchy
> is exactly inverted."*

**On a career whose arc is negative, the arc gets promoted.** On a rising career, nothing changes —
this must not make a good ending quieter as a side effect.

This is not "make it red" and not a scolding. It is the same mechanism everything else on this
screen obeys: **magnitude drives scale, weight and position; hue never moves.** DECISION 012 is not
reopened. Verify your result the way 026 did — read the computed colour off the live page at both
ends of the range and confirm it is the same value.

### 3. The `Also earned` heading, where 027 missed it

`SummaryScreen.tsx:241` renders `distinctions.length > 0 ? "Honors" : "Also earned"`. So a career
with **both** gets a gold All-American box followed by a bare grey chip with **no heading of its
own**:

> *"With nothing naming the second tier it reads as 'and this lesser thing.' Bowl Win was a
> genuinely nice thing to have won and it looked like a leftover."*

The routine group gets its own heading **whenever it renders**, including when distinctions render
above it. Do not restore the old always-on HONORS block and do not undo the rarity split — see 027
and 034.

### 4. Label the two overall numbers

The screen can print `FINAL OVERALL 61` above a table whose last row reads `59`. Both are true: one
is the season as played, the other counts the offseason development that followed it. Nothing on
the screen says so. DECISION 035 is explicit: **fix this in wording at the point of collision — no
engine change, and do not remove either number.** Keep it to a few words; this screen does not want
a paragraph of explanation.

## Files

**You own, exclusively:** `src/ui/screens/SummaryScreen.tsx`, `src/ui/styles/summary.css`,
`src/ui/session/types.ts`, `src/ui/session/view-model.ts`, `src/ui/session/bands.ts`, and their
tests.

**Out of bounds — another agent owns these in this same wave:** `src/ui/session/ledger.ts`,
`src/ui/session/labels.ts`, `src/ui/screens/CareerScreen.tsx`, `src/ui/styles/career.css`,
`src/content/**`, `src/sim/**`.

**Also out of bounds:** `src/engine/**` (frozen), and `src/ui/styles/tokens.css` — the type scale
and palette were settled across three decisions and are not yours to adjust. If you believe a token
must change, write the case in your report instead.

## Constraints (hard — design intent, not preferences)

- `overall` **is** shown as a number. `character` is **never** shown as a number, only as a band
  phrase. It swings draft stock ~±7.5 against overall's ~82; an integer would overstate it tenfold.
- Never display: school tier or any badge implying it, `draftStock`, event `probability` or
  `weight`, EV, or school trait names. Traits are meant to be discovered by replaying.
- `src/engine/**` and `src/content/**` are **frozen.** An agent that believes a change there is
  needed writes a proposal in its report; it does not edit.
- `src/ui/session/view-model.ts` is the only module allowed to read `GameState`. That boundary is
  what makes the hidden-mechanics rule testable — do not bypass it.
- **501 tests stay green. Both typecheck passes exit 0.**
- Aesthetic direction is fixed: dark theme, clean sans-serif, card-based, generous whitespace,
  minimal chrome, the decision and its options are the clear focal point.
- **Magnitude may drive scale, weight, opacity and motion. Valence may never drive hue** (DECISION
  012). This is the rule the whole screen is built on.

## Verify before reporting

`npm test` (501 green) and `npm run typecheck` (**two** passes, both exit 0). Then look at the
result at `localhost:5173` — **start the dev server in the background, never in the foreground**;
`npm run dev` does not exit and has hung two agents in this project.

You need a *bad* career and a *good* one to compare. Generating one by playing is slow; prefer
seeding `localStorage` (`cfb-career-sim:v1:current`) from a headless run — `npm run play -- <seed>
random` prints the JSON. Compare a Round 2 ending against a Round 3 ending, and a declining career
against a rising one, **side by side**, and say in your report whether you could rank them without
reading the digits. That is the acceptance test.

Use the `frontend-design` skill for the visual work.

## Report

Write to `docs/superpowers/polish/reports/019-the-ending-tells-the-truth.md`.
Return to the PM **only**: status (done / blocked / needs-decision), **at most five bullets**, and
that path. Never the full findings.
