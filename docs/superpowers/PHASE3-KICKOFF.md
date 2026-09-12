# Phase 3 (UI) — Kickoff

Read this first when starting **Phase 3** in a fresh session. Phases 1 and 2 are complete; the
engine and content library are finished and the engine's public surface has been stable since the
Phase-2 contract froze.

**Phase 3 is architectural, not bounded.** There is no existing UI flow in this repo to modify — a
new subsystem with no prior art here gets the full cycle: brainstorming → design doc in
`docs/superpowers/specs/` → plan in `docs/superpowers/plans/` → execution. Expect the first session
to produce a spec, not components. That is what every prior phase did.

## The engine surface a UI consumes

Five exports from `src/engine/index.ts`. This is the entire API; nothing else should be imported
from `src/engine/**`.

```ts
createCareer(setup: Setup, seed: string, content?: ContentBundle): GameState
getDecision(state: GameState, content?: ContentBundle): PendingDecision | null
advance(state: GameState, choiceId: string, content?: ContentBundle): GameState
WASHOUT_REASONS  // { overall, buried } — the two soft-washout ending strings
// types: GameState, Setup, Position, DraftResult, SchoolTrait, PendingDecision, ALL_POSITIONS
```

The whole loop is three calls:

```ts
let s = createCareer({ lastName, jerseyNumber, homeState, position }, seed);
while (s.status === "active") {
  const decision = getDecision(s);      // null between decisions
  if (!decision) break;
  s = advance(s, chosenOptionId);       // returns a NEW state
}
```

`PendingDecision` is deliberately render-ready and carries no mechanics:

```ts
interface PendingDecision {
  eventId: string;
  title: string;
  description: string;
  options: { id: string; label: string }[];
}
```

**Everything the player sees comes from this shape.** Option labels already carry their own flavour
(including school-trait hints like "— the two-deep is thin"); the UI must not compute, infer, or
display underlying numbers. See "Hidden from the player" below.

`src/sim/play-headless.ts`'s `playCareer` is a 15-line reference implementation of the loop — read
it before writing the React version.

### State a UI will want to read

`GameState` (`src/engine/types.ts`) — `status` (`active`/`declared`/`drafted`/`busted`),
`endingReason`, `overall`, `character`, `eligibility.classYear`, `school.schoolId`, `seasons[]`
(per-season `snaps`/`stats`/`teamWins`/`teamLosses`), `trophies`, `awards`, `moments[]`
(`{ seasonIndex, item, icon }` — authored for exactly this kind of display), `draftResult`,
`injuries[]`, `careerInjuries`.

School display names come from `CONTENT.schools` (`src/content/index.ts`), keyed by `school.schoolId`.

## What Phase 3 is scoped to

From the master spec (`docs/superpowers/specs/2026-07-25-cfb-career-sim-design.md` §12):
creation flow, decision screens, summary/share card, `localStorage` persistence.

**Stack** (§11): React + Vite, `localStorage`, no backend, deployable to static hosting.

**Aesthetic direction** (§11, quoted verbatim — this is design intent, not a suggestion):

> sleek, high-readability, **dark theme**, clean sans-serif type, **card-based** decision screens,
> generous whitespace, minimal chrome. Easy to read at a glance; the decision + its options should
> be the clear focal point.

**Out of scope for v1** (§10): NFL coda after the draft, global leaderboards, server-saved careers,
full 11-position granularity, mobile/Discord front-ends.

## Hidden from the player — a design rule, not a preference

The engine deliberately does not expose its mechanics, and the UI must not reintroduce them.

- **Tier logic and the transfer rebuild loop stay implicit** (master Phase-2 spec §4): "the player
  sees schools + flavor and infers the tradeoff; nothing is spelled out mechanically."
- **School traits are discovered through replay**, never stated. Offer labels carry a hint ("sends
  more guys to Sundays than anywhere else"); they never carry the effect. A stat block at Signing
  Day would defeat the entire design.
- Do not render `draftStock`, event `probability`, `weight`, EV, or trait names.

`overall` and `character` are the judgment call this phase has to make: they are real player-facing
progression numbers, but showing them as raw integers invites optimization play. Decide it
deliberately during brainstorming.

## State of the engine

- **361 tests, 27 files, all passing.** `npm test`.
- **`npm run typecheck` runs TWO passes** (`tsc -p tsconfig.engine.json && tsc -p tsconfig.json`),
  both must exit 0. The engine pass forbids Node globals in `src/engine/**` and `src/content/**` —
  **a React app lives outside those trees, so this does not constrain UI code**, but do not break it.
- Content: 102 events, 57 schools, 6 position buckets, all balance bands holding except one
  recorded exception (below).
- `npm run play -- <seed> [random]` plays a full career headlessly and prints JSON — useful for
  generating realistic fixture data for UI work without hand-writing `GameState`.
- `npm run balance -- <runs> random [position|all]` and `npm run traits -- <runs> [position] [state]`
  are measurement tools. Phase 3 should not need them.

### One recorded out-of-band metric

OL's "actually picked" rate (`draftedRate − undraftedRate`) is **0.9533 against a 0.85–0.95 band**.
This is **pre-existing** — it measured 0.9617 before the school-traits wave — and is deliberately
recorded rather than tuned. It is not a UI concern; it is noted so nobody "discovers" it and treats
it as new. Details in `STAGE4-HANDOFF.md`.

## Deferred work — do not pick this up during Phase 3

**School traits waves 2 and 3** (`factory`, `developmental`) are designed and specced but deferred.
They are configured in `src/content/school-traits.ts` with **unmeasured placeholder magnitudes** and
**no school carries them**, so they are inert and cannot affect the UI. Spec:
`docs/superpowers/specs/2026-09-07-school-identity-traits-design.md`. Everything a future session
needs to size them correctly — the null-trait A/B method, the development-cliff map, the tightened
injury budget — is in `STAGE4-HANDOFF.md`'s wave-1 section and in `school-traits.ts`'s header.

The rest of the Stage 4 backlog (five open items) is in `STAGE4-HANDOFF.md`. Several are *feel*
judgments — uneven injury exposure, character drift, decorative stats — and are deliberately parked
until there is a UI to judge them in. That was the reasoning for doing Phase 3 next.

## What to tell the next session

> Read `docs/superpowers/PHASE3-KICKOFF.md`, then start Phase 3 — the React/Vite front end.
> The engine is finished and its API is five exports; the kickoff doc has the loop, the render-ready
> decision shape, the aesthetic direction, and the hidden-mechanics rule. Phase 3 is architectural,
> so brainstorm to a spec in `docs/superpowers/specs/` before any component code.
> `main` is clean at the school-traits merge, 361 tests passing, both typecheck passes green.
