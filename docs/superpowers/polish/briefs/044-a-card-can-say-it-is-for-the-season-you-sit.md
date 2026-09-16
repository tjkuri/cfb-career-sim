# 044 — A card can say it is for the season you sit

**Type:** developer (engine + schema, narrow authorized freeze lift) · **Wave:** 22 · **Status:** ready — dispatch now

Repo: `/Users/tkuri/Documents/personal_projects/cfb-career-sim`

**Goal:** add `conditions.requiresRedshirt?: boolean` to the content schema and one mirror clause to
`eventMatches`, so that a card can be authored **for a redshirt season**. Change nothing else, and
change no behaviour whatsoever.

**Why.** A redshirt season currently has no content of its own. Measured: of 81 on-field events, 12
survive a sit season, and the PM listed those twelve by hand — gambling, skipping the install, a
ticket hookup, getting catfished, a speeding ticket, a curfew, ghosting the media, an exit interview,
a watch list, a coaching carousel, a failed drug test, an arrest. **Not one is about football, and two
of them are ways to bust.** The engine promises the player "a year of scout team and the weight room"
in 44 words of hub prose and then deals them four cards about their phone. That is ~20% of a career.

The fix is to author a redshirt pack — and **it cannot be written today.** `requiresPlaying: true`
excludes a sit season, and its absence puts a card in *both*. There is no way to say "this card is for
the season the player sits." This task makes that sayable. **The pack itself is a later wave and is
not your job.**

## The authorization, and its exact limit

`src/engine/**` and `src/content/**` are frozen. **DECISION 066 lifts that freeze for this one change
and nothing else.** Read DECISION 066 in `docs/superpowers/polish/DECISIONS.md` before you start.

The lift was taken as a PM call rather than escalated to the user on one specific ground: **this
change has no balance surface, because no existing event sets the new field, so no existing event's
eligibility changes.** Your job is to keep that true.

## What to build

1. **Schema:** `conditions.requiresRedshirt?: boolean` in `src/content/schema.ts`, validated the same
   way `requiresPlaying` is (there is an existing `typeof !== "boolean"` check to mirror — find it and
   match its shape and its error message style).
2. **Engine:** one clause in `eventMatches` in `src/engine/select-event.ts`. The existing clause is
   `if (c.requiresPlaying && state.redshirtSeasonActive) return false;` at line 38. Yours is its exact
   mirror: `if (c.requiresRedshirt && !state.redshirtSeasonActive) return false;`
3. **Tests.** At minimum: a card with `requiresRedshirt: true` is offered in a sit season and not in a
   played one; a card with neither flag is offered in both (this is the regression that matters); the
   two flags together select nothing, which is a contradiction an author could write by accident —
   decide whether that deserves a schema error and say why in your report.
4. **Author no content.** Do not add, edit, or re-gate a single event. The field must remain unused by
   every card in the bundle when you are done.

## The acceptance test that defines "done"

**The change must be byte-identical on every seed and policy.** If it is not, the clause is not the
inert mirror it is supposed to be and it is wrong. Run this yourself before reporting — it is the
whole basis on which this freeze lift was granted:

```sh
SCRATCH=$(mktemp -d)
git worktree add -q --detach $SCRATCH/head-check HEAD
ln -sfn $PWD/node_modules $SCRATCH/head-check/node_modules
for seed in 12345 98765 24 77; do for pol in random first; do
  npx tsx src/sim/play-headless.ts $seed $pol > $SCRATCH/now-$seed-$pol.json
  (cd $SCRATCH/head-check && npx tsx src/sim/play-headless.ts $seed $pol > $SCRATCH/head-$seed-$pol.json)
  diff -q $SCRATCH/now-$seed-$pol.json $SCRATCH/head-$seed-$pol.json && echo "$seed $pol OK"
done; done
git worktree remove --force $SCRATCH/head-check && git worktree prune
```

Report the result of all eight comparisons explicitly. **A single difference means stop and report
`needs-decision`** — do not try to fix it by adjusting the clause.

## Out of bounds

- Every file under `src/engine/**` and `src/content/**` **except** `select-event.ts`, `schema.ts` and
  their tests.
- `src/ui/**` — another agent owns it this wave.
- `src/sim/**` — do not edit; you may run it.
- Do not commit. Do not `git checkout`, `git restore`, or `git stash` — the tree holds another agent's
  uncommitted work. **The PM commits.** (The `git worktree` commands above are fine: they never touch
  the working tree, which is exactly why the check is written that way — see DECISION 064.)

## Constraints — design intent, not preferences

- `overall` **is** shown as a number. `character` is **never** shown as a number, only as a band
  phrase. It swings draft stock ~±7.5 against overall's ~82; an integer would overstate it tenfold.
- Never display: school tier or any badge implying it, `draftStock`, event `probability` or `weight`,
  EV, or school trait names. Traits are meant to be discovered by replaying, never stated.
- `src/ui/session/view-model.ts` is the only module allowed to read `GameState`. Do not bypass it.
- 684 tests stay green. Both `npm run typecheck` passes exit 0.

## Operating rules — agents have died here

- **The dev server is ALREADY RUNNING at `http://localhost:5173`. Do NOT run `npm run dev`.** It never
  exits and is the single most likely thing to hang you.
- Never run a foreground command that does not terminate on its own.
- If any single tool call fails 3 times, stop, write up what you have, and report `blocked`.
- Write your report incrementally.

## Verify before reporting

`npm test` (684 green, plus your new ones), `npm run typecheck` (**both** passes exit 0),
`npm run build` clean, and the eight-way byte-identity check above.

**REPORT:** write to `docs/superpowers/polish/reports/044-a-card-can-say-it-is-for-the-season-you-sit.md`.
Return to the PM **only**: status, ≤5 bullets, and that path. Lead with the byte-identity result.
**Never the full findings.**
