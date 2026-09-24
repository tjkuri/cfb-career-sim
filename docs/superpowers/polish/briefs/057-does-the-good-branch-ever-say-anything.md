# 057 — The ten spared cards: does the good branch ever say anything?

**Type:** measurement + proposal. **No product code ships this wave.** · **Wave:** 30 · **Status:** ready

Repo: `/Users/tkuri/Documents/personal_projects/cfb-career-sim`

## Goal

Answer one question with numbers: **when a player takes the good-teammate branch of the ten cards
DECISION 078 deliberately spared, how often does the game say anything back?**

## Why

A playtester played two careers explicitly trying to earn standing with the program and reported
**zero** upward movement, and — separately — that the teammate cards "returned prose with no number at
all" (*"You get grief in the meeting room for missing it"*, twice). Two waves have now been spent on
the *size* of the rungs. This lane is the other half: **a correctly-sized ladder still shows nothing if
the card the player took carries nothing, or carries something the display floor eats.**

## The mechanism we think is at work — and proving it wrong is a success condition for this lane

Read this as a specific, falsifiable story, not as a specification. **Several lanes on this board have
done their best work by showing the brief's mechanism was wrong and then fixing what was actually
there. Say so plainly if that is what you find; it is the outcome we would rather have.**

The story:

1. `LOCKER_ROOM_MIN_CHARACTER = 2` in `src/ui/session/view-model.ts` (DECISION 077) gates the
   locker-room line. Character effects below the floor produce **no** locker-room comment.
2. The spared cards' good branches are documented in DECISIONS.md §078 as **+2, +2, +1, +2** for the
   four "help the man taking your job" cards. **A +1 branch is silenced outright** and a +2 branch
   clears the floor by exactly nothing.
3. These are not `fixed` cards. Their **realized frequency** may be low enough that a whole
   good-teammate career meets one of them once, or never.

If all three hold, the player is right and the ladder calibration could not have fixed it: the cards
that are supposed to teach what the currency means are, in practice, silent.

**The board has been burned twice on exactly the error this lane could repeat:** *a set defined by a
measurement is not a set verified card by card* (a "22" that was 11), and *when the claim is about what
a player can experience, the denominator is careers, not cells.* An aggregate over N runs cannot answer
"how often does a player see this." **Resolve every card to source by hand, and report per-career
distributions, not just means.**

## What to produce

### 1. The card table — resolved to source, card by card

The authoritative list of the ten spared cards is in `docs/superpowers/polish/DECISIONS.md` §078 and
`docs/superpowers/polish/reports/051-one-currency-one-meaning.md` §4. **Do not trust either list —
verify each card exists at HEAD with the stated effects, and say so if one does not.** (051's own
finding was that an earlier brief's file list was wrong.)

One row per card: file · card id · the branch a good teammate would plausibly take · that branch's
character delta at HEAD · **does it clear the floor** · gating (`minClass`, position filters,
`requiresPlaying`, one-shot vs repeatable) · anything else on the branch a player can see (OVR, snaps,
production, prose-only).

Include the eleventh card, `targeting-review`, which 078 resolved as correct.

### 2. The frequency measurement — denominator is careers

Over at least 3,000 careers per profile, for `virtueLoyal`, `virtueAmbitious`, and `good`
(`src/sim/policies.ts`; there are existing probes in `src/sim/` — `virtue-probe.ts` and
`rung-probe.ts` are the closest models, and reusing one beats writing a new harness):

- For each of the ten cards: **share of careers in which it fires at least once**, and mean/p50/p90
  firings per career.
- **Share of careers in which the player takes a good branch of any of the ten and the locker-room
  line fires** — this is the headline number.
- **The same, counted per career rather than in aggregate:** the distribution of "how many times in one
  career did a spared card say anything back." If the p50 is 0, say so in those words.
- Split by **what the floor eats**: how much of the silence is sub-floor magnitude versus the card
  never firing at all. These are different defects with different fixes and the report must not blur
  them.

### 3. The proposal — routes, priced, no recommendation smuggled in as the only option

Give at least: leave it alone; lower the floor for this family; raise the branch magnitudes (content —
frozen, so a proposal only); make the recognition arrive with ceremony rather than as a line. For each:
what it costs, what it breaks, what measurement would decide it. **Price them, then recommend one.**

## Hard constraints — design intent, not preferences

- `overall` **is** shown as a number. `character` is **never** shown as a number, only as a band
  phrase. It swings draft stock ~±7.5 against overall's ~82; an integer would overstate it tenfold.
  **A card returning "no number" for character is correct behaviour** — do not report that as the bug.
  The bug, if there is one, is that **nothing at all** is said.
- Never display: school tier or any badge implying it, `draftStock`, event `probability` or `weight`,
  EV, or school trait names. Traits are discovered by replaying, never stated.
- `src/engine/**` and `src/content/**` are **frozen**. Reading them is the job; editing them is not.
  If you believe a change there is needed, write a proposal.
- `src/ui/session/view-model.ts` is the only module allowed to read `GameState`. Do not bypass that
  boundary. **This wave you may not edit it either — see below.**
- 728 tests stay green. Both typecheck passes exit 0.
- Aesthetic direction is fixed: dark theme, clean sans-serif, card-based, generous whitespace, minimal
  chrome, the decision and its options are the clear focal point.

## Out of bounds — and why, this wave specifically

- `src/ui/**` — **no edits at all, including `view-model.ts`.** A playtester is playing HEAD in a
  browser right now. Changing the build under them invalidates the session, and their answer to
  "can you earn it" is the most expensive measurement on this board.
- `src/ui/session/bands.ts`, `src/engine/**`, `src/content/**`.
- The only files you may add are a **new** probe under `src/sim/` plus its test. Do not modify existing
  probes; if you need a variant, take a parameter.

## Verify before reporting

- `npm test` — green, and any new probe has a test.
- `npm run typecheck` — **two passes, both exit 0.**
- **Identity check, and get its direction right:** this lane is not supposed to move balance, so
  `npm run balance` must be **byte-identical** to HEAD on two seeds. Identity **is** the pass here. Say
  in the report that you ran it and what it printed.
- `git status` shows nothing modified under `src/engine/**`, `src/content/**`, or `src/ui/**`.

**Do not commit.** The PM commits. Never `git checkout`, `restore`, or `stash` — the tree may hold
another agent's work.

**Never run a foreground command that does not terminate** (`npm run dev` is already running on 5173 —
do not start one). If a tool call fails 3 times, stop and write up what you have.

**REPORT:** write findings to
`docs/superpowers/polish/reports/057-does-the-good-branch-ever-say-anything.md`.
Return to the PM **only**: status (done / blocked / needs-decision), **≤5 bullets**, and that path.
Never the full findings. Lead with the headline number: **the share of good-teammate careers in which
a spared card says anything back, and the per-career median.** Then whether the brief's mechanism held.
