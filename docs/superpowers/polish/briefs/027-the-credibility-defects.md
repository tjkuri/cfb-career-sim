# 027 — The credibility defects

Repo: `/Users/tkuri/Documents/personal_projects/cfb-career-sim`

**Goal:** find the cause of, and where you own the file fix, each of the small contradictions the
fourth playtest logged — the ones where the HUD disagrees with itself or with the card beside it.

**Why.** Each one is individually trivial and collectively they are the reason a player stops
believing the text. The playtest's central finding is that players stop reading prose; these are the
cheapest available proof that the words are not to be trusted. Fixing them is a few hours; leaving
them undermines every other wave of this phase.

---

## The defects, verbatim from `reports/025-post-wave9-playtest.md` §8

1. **`8 snaps · 3 FG · 6 Points`** in the season ledger. Three field goals cannot be six points.
2. **`ON THE FIELD: on the scout team`** in the status header, beside **339 snaps and 31 tackles** in
   that same header.
3. **Bowl Opt-Out** says *"your name's already climbing draft boards"* — said to a player at
   **60 OVR, on the scout team, as a sophomore.**
4. **Playoff or Bust** says *"Ten wins is a disappointing season here"* — while the ledger beside it
   read **5-7**.
5. **B37, the redshirt card lies.** The card says *"sit this season"*; it cost −3 and the season was
   played anyway. Note the history: B13 closed this as a wording fix because `sitSnapModifier` is
   0.05, so **100%** of redshirt seasons credit snaps (median 26) — that is the four-game redshirt
   rule being modelled correctly. **The engine is right and the telling is wrong**, and the telling
   is still wrong today.

**Expect mixed causes, and expect some of them not to be yours.** Some are label logic (yours). Some
are event `conditions` that let a card fire in a state it does not describe — that is
`src/content/**`, which is **frozen**, so it becomes a *proposal in your report*, not an edit. Some
may be arithmetic in the engine's stat generation — also frozen, also a proposal.

**One of these may not be a defect in your files at all.** Defect 5's `−3` and possibly others are
being investigated concurrently by brief 026, which is fixing a known bug where a card's displayed
OVR delta includes deferred effects and progression that belong to earlier cards
(`reducer.ts:61-64` + `CareerScreen.tsx:149-150`, DECISION 046). **If you trace a defect to that
cause, say so in your report and stop — do not fix it.** That work is in flight in files you do not
own. Your half of defect 5 is the *wording*, wherever the wording lives.

**For each defect your report must name: the cause, in source, with a file and line.** A guess is
worth nothing here. Diagnosis is the deliverable; the fixes you own are a bonus on top of it.

---

## Files

You own, and no other agent is touching this wave:

- `src/ui/session/labels.ts` + `labels.test.ts`
- `src/ui/session/bands.ts` + `bands.test.ts`
- `src/ui/session/ledger.ts` + `ledger.test.ts`

**Out of bounds:** `src/engine/**`, `src/content/**` (frozen — proposals only), and
`src/ui/session/reducer.ts`, `view-model.ts`, `types.ts`, `src/ui/screens/CareerScreen.tsx`,
`src/ui/styles/career.css`, all of which brief 026 owns concurrently. Read them freely. **If a fix
you are confident about lands in `view-model.ts`, write the exact diff into your report** — the PM
will apply it after 026 lands. Do not edit it yourself; you would collide with another agent
mid-flight.

Relevant prior decisions to read before you touch anything: **020** (ledger rows are labelled by
sequence; its "would change our mind" clause was deliberately withdrawn — do not re-derive the snaps
inference), **033** (why the fifth ledger row stopped promising), **013**, and **046**.

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
  what makes the hidden-mechanics rule testable. Do not bypass it.
- Tests stay green (**baseline is 613**). Both typecheck passes exit 0. Verify before reporting done.
- Aesthetic direction is fixed: dark theme, clean sans-serif, card-based, generous whitespace,
  minimal chrome, the decision and its options are the clear focal point.
- **Do not reopen type, colour or contrast.** The 025 playtest found zero visual defects at 1456px —
  nothing clipped, overflowed or collided, contrast fine. That work is done.

## Shell rules — three agents have died on these

- **The dev server is already running on `localhost:5173`. Do not start one.**
- **Never run a foreground command that does not terminate** (`npm run dev`, watch modes). `npm test`
  is fine — it exits.
- **Do not commit.** Do not `git checkout`, `git restore`, `git stash`, or `git reset`. The tree holds
  another agent's uncommitted work at the same time as yours. The PM commits.
- If a tool call fails three times, stop and write up what you have.

## Tools you have that make this measurable

- `npm run play -- <seed> random` — headless full career, prints JSON. Sweep seeds to find how often
  each defect actually fires; a defect in 40% of careers and a defect in 0.5% are different items.
- `npx tsx src/sim/repetition-probe.ts 24 B card` — the committed probe (cohorts `B`, `C`, `all`).
  Useful as a model for writing a quick throwaway sweep; do not modify it.

## Verify before reporting

- `npm test` — 613 green or more, none failing
- `npm run typecheck` — **two passes**, both exit 0
- `npm run build` — clean
- `npm run play -- 24 random` before and after: **byte-identical output**
- `git status` shows **nothing** modified under `src/engine/` or `src/content/`, and nothing under
  the out-of-bounds list above
- Click through at `localhost:5173` and confirm at least the two header defects (1 and 2) with your
  own eyes, before and after

## REPORT

Write findings to `docs/superpowers/polish/reports/027-the-credibility-defects.md`.

For each of the five defects: the cause with file and line, how often it fires (measured), what you
did, and — where it is not yours — the exact proposal, written so the PM can hand it to the user or
to another agent without re-deriving it. Plus anything else of this kind you found while looking.

**Return to the PM only:** status (done / blocked / needs-decision), at most five bullets, and that
path. Never the full findings.
