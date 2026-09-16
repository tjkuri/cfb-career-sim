# 043 — The ladder the game narrates but never shows

**Type:** developer (UI) · **Wave:** 22 · **Status:** done

## What shipped

Two things, one shared mechanism.

### 1. The ending screen carries the locker-room standing — as a ladder

`SummaryScreen.tsx` now renders a section, `IN THE LOCKER ROOM`, directly under the verdict block
and above `SEASONS`. It draws **all five rungs** of `TRUST_BANDS`, in order, with the one the career
ended on filled in and tagged `YOU ENDED HERE`.

It is a ladder rather than a line on purpose. A line is what the career screen already had, and a
line is what did not land: the playtester was told *"Cost you in the locker room."* six times and
could not tell whether it had done anything. What a rung has that a phrase does not is **four other
rungs** — proof that the building could have thought something else about you, and what that
something else would have been. That is the read that makes a fourth career worth starting, which is
what the playtester said they wanted, and it is also the most this screen is allowed to say:
position in an order, never a distance along it.

Placed under the verdict so the two readings of the career are read together — what the league
decided, then what the building decided. On a real career this pairing is already doing work: a
Round 3, Pick 16 quarterback who finished at `the staff has stopped defending you` is one screen,
and neither half of it is a mistake.

### 2. The moment the rung moves is marked

While a resolved card is on screen, `.standing-room` reports a rung change:

```
IN THE LOCKER ROOM
just a guy in the building
Down from “the staff trusts you”
```

The trust phrase steps from `--chalk-soft` to `--chalk`, the line arrives with a 220ms fade-and-rise,
and both are gone on the next Continue — this marks an event, it does not describe a state. Both
directions are marked in one hue at one weight; `Up from “a problem they are managing”` is the same
element with two different words in it.

## The constraint, and how it is enforced rather than promised

No integer, no bar, no meter, no percentage, no dot count, and no size or weight encoding magnitude.
The enforcement is structural rather than editorial:

- **`trustMove(before, now)` returns `"up" | "down" | null` and has no other return type.** A fall of
  three rungs and a fall of one are the same value, so nothing downstream *can* render a distance.
  `bands.test.ts` asserts that identity directly: `trustMove(top, bottom) === trustMove(top, second)`.
- **The card never holds a `character` number.** `Resolved` gained `trustBefore: string | null` — the
  band *phrase* frozen before `advance()`, not the value behind it. `overallBefore` is a number
  because `overall` is a quantity the screen may subtract; `character` is not one, so what is frozen
  is the only character read a screen may hold. It also means the field round-trips through
  `localStorage` without putting a character value there.
- **The ladder has no magnitude axis.** All five rungs are one size, one line-height, one row rhythm.
  The four rungs that are not the player's are set **identically to each other** — the rung directly
  above theirs looks exactly like the rung three below it. Current vs. not-current is a binary, and
  it is told by ink (colour + weight + a 2px chalk mark), not by scale.
- **No accent colour anywhere in the new work.** `--milestone` is for a career fact given its
  headline; four of the five rungs this can land on are not that, and a gold mark on *the staff has
  stopped defending you* would perform a trophy over the worst ending in the game — the exact
  inversion DECISIONS 021 and 032 spent two waves undoing. The seasons block sets its whole arc in
  chalk; this matches it.

DECISION 046's refusal of magnitude-as-typography on the per-card line is untouched and, by the same
reasoning, extended: the marker's emphasis says *this changed*, and there is no arithmetic available
to it that could say *by how much*.

## One deviation from the brief's suggested derivation

The brief proposed deriving the previous band from the card's own character delta
(`band(character − delta)`). The shipped version freezes the phrase from the pre-`advance` state
instead. Two reasons:

1. `CardAccount.lockerRoom` deliberately carries **direction only** — the delta is summed in
   `accountOf` and discarded. Recovering it would have meant widening `CardAccount` with a character
   magnitude, which is the one thing this task must not create.
2. The card's own delta is not the right question anyway. The rung can move because something else
   in the same `advance()` moved `character`, and what the marker claims is "the building's read of
   you changed on this click". Only the before/after pair can answer that.

## Files

- `src/ui/session/bands.ts` — `TRUST_LADDER`, `trustRungOf`, `trustMove`. Phrases only; no threshold,
  count or `character` value is reachable through the new exports.
- `src/ui/session/types.ts` — `Resolved.trustBefore: string | null`.
- `src/ui/session/reducer.ts` — freezes it beside `overallBefore`; `normalize` maps a missing field to
  `null`, so a save written before it existed marks no move rather than inventing one.
- `src/ui/screens/SummaryScreen.tsx` — the ladder section, guarded on the phrase being a rung this
  ladder contains.
- `src/ui/screens/CareerScreen.tsx` — the change marker.
- `src/ui/styles/summary.css` — `.ladder`, `.rung*`.
- `src/ui/styles/career.css` — `.trust-move`, `@keyframes trust-move-in`, and the marker added to the
  `prefers-reduced-motion` block.
- Tests: `bands.test.ts` (+3), `reducer.test.ts` (+2), plus three existing `Resolved` fixtures updated.

## Verification

- `npm test` — **698 passed, 40 files.** (The brief said 684; the tree already held 693 from another
  agent's wave-22 work before this task added 5.)
- `npm run typecheck` — both passes exit 0.
- Clicked through at `localhost:5173`:
  - Played a career start to finish (QB, Memphis → Temple, Round 3 Pick 16) and read the ending
    screen: the ladder renders under the verdict with `the staff has stopped defending you` marked.
  - Also read the ladder on the pre-existing undrafted Kicker save (`a problem they are managing`).
  - Caught a live rung fall mid-career — `Down from “the staff trusts you”` under
    `just a guy in the building`, on the same card whose consequence block read *"Cost you in the
    locker room."* That adjacency is the whole point of the task and it reads as one statement.
  - Verified the `up` render path by restoring a save with a lower `trustBefore`:
    `Up from “a problem they are managing”`, identical treatment.
  - No console errors on load or during play.
  - At a 360px frame: `.trust-move` fits one line with zero overflow; all five rungs hold one line
    each, the marked row growing only for its tag.

## Proposals (not built — engine is frozen)

**1. A per-season locker-room column, and why it is probably not worth an engine change.**
Confirmed as the brief states: `SeasonLine` in `src/engine/types.ts` records `overall` and not
`character`, so the history does not exist. I would **not** recommend adding it. The column would
have to print a band phrase per row, and the five bands are coarse enough that most careers would
show the same phrase four times — a column of identical strings reads as broken, not as an arc, and
the honest alternative (a per-season *change* marker) reintroduces exactly the distance question this
task is built to refuse. The ending-screen ladder already answers "where did I end up"; "how did I
get there" is answered better by the per-card marker, where it is a beat rather than a table cell.
If the PM wants it anyway, the minimum engine change is one field — `character: number` on
`SeasonLine`, written where `overall` already is in `enterOffseason`.

**2. A cosmetic inconsistency this task did not own.** `SummaryScreen`'s `.arc-head-ovr` still reads
`Ovr before the offseason` — which is correct, and matches what `CareerScreen`'s ledger head was
changed to. No action needed; noting it because a prior report flagged it as open.
