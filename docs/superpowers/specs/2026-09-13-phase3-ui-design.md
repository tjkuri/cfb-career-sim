# Phase 3 (UI) — React/Vite Front End Design

**Date:** 2026-09-13
**Status:** Approved design, pre-implementation
**Predecessors:** master spec `2026-07-25-cfb-career-sim-design.md` §11–12; `PHASE3-KICKOFF.md`

Phase 3 wraps the finished engine in a React/Vite front end: creation flow, decision screens,
summary/share card, `localStorage` persistence. No backend. Deployable to static hosting.

## 1. What the engine gives us, and the one thing it doesn't

The engine's public surface is five exports from `src/engine/index.ts`, and the loop is three calls
(`createCareer` / `getDecision` / `advance`). `src/sim/play-headless.ts` is the reference
implementation.

Measured, on 200 random-policy careers across all six positions: a career is **10–45 decisions,
median 24, mean 26** — a five-minute sitting. Some decisions are single-option narrative beats
(`Season Opener [1]`), which the UI treats as acknowledgements rather than choices.

### The narration gap

`advance` calls `resolveOutcome`, applies the effects, and **discards `Outcome.description`**. The
content library authors **330 outcome descriptions** across the event files; only **39** of those
outcomes also push a `moment`. So roughly 290 pieces of authored prose are unreachable through the
current API. A UI built strictly on `getDecision` shows a card, takes a choice, and renders the next
card with no indication of what happened — which removes the beat the gamble events exist for.

Phase 3 therefore includes a small, additive engine change (§2).

A second, narrower hole: **the redshirt gamble resolves silently.** `REDSHIRT` is
`{ successProb: 0.6, bumpOverall: 5, sinkOverall: -3, sitSnapModifier: 0.05 }` with no text at all.
The player sits an entire season on a 60/40 bet and the game says nothing about which way it went.
That needs authored content, not just plumbing.

### Three id vocabularies with no display names

Nothing in the repo maps these to player-facing text:

- **Trophy ids** — `confTitle`, `cfpTitle`, `bowlWin`.
- **Award ids** — `heisman`, `allAmerican`, `allConference`.
- **Stat keys** — 15 across the six position buckets (`passYards`, `sacksAllowed`, `tfls`, …).
  `POSITIONS` carries a `label` for the position itself but nothing for its stats.
- **Moment icons** — 22 distinct `icon` strings in the event files (`trophy`, `shield`, `medical`, …).

The summary screen cannot render without a display-label layer (§5).

## 2. Engine change (additive)

One field on `GameState`:

```ts
lastOutcome?: { description: string };
```

- `advance` clears it at the top of every call.
- `applyChoice` sets it from `resolveOutcome(opt, rng)` on the content-event branch.
- **No new export.** The public API stays five exports. `GameState` is already plain JSON
  (`advance` JSON-clones it every call), so persistence gets the field for free.

### Two deliberate omissions

**No positive/negative branch flag.** A UI that colors an outcome red or green is telling the player
the roll went against them, which is `probability` leaking through the back door. The authored prose
already carries the tone. The field is a string and nothing else.

**Hub decisions set nothing.** Signing Day, transfer, and declare have no authored outcome because
their result *is* the next screen — you see the new school. `lastOutcome` stays `undefined` on those
branches and the UI skips the outcome beat.

### Redshirt (content + plumbing)

`RedshirtConfig` gains `bumpDescription` and `sinkDescription`; the schema and validator learn the
two required fields; `applyChoice`'s redshirt branch sets `lastOutcome` from whichever fired. The
two strings are authored in the content's existing register.

### Engine test additions

- `lastOutcome` is set on a content-event choice, matching the outcome the seeded RNG selected.
- `lastOutcome` is cleared at the start of the next `advance`.
- `lastOutcome` is `undefined` after recruiting, transfer, and declare choices.
- `lastOutcome` is populated from the redshirt strings on both the bump and sink paths.

The existing **361 tests must stay green**. The whole-career seeded-stability check diffs entire
final states, so the new field has to land identically on both sides of that diff.

## 3. Architecture

Single package. No workspace split.

```
src/ui/
  main.tsx            Vite entry
  App.tsx             shell; renders the current screen from reducer state
  session/
    types.ts          UiState, Action, Screen, CareerView
    reducer.ts        pure (UiState, Action) -> UiState — the screen machine
    view-model.ts     GameState -> CareerView — the one mechanics boundary
    bands.ts          overall -> depth-chart phrase; character -> trust phrase
    labels.ts         trophy/award/stat ids -> display names; icon -> glyph
    share.ts          CareerView -> pasteable text
    storage.ts        localStorage: in-progress save + career log
  screens/            CreationScreen, DecisionScreen, SummaryScreen, CareerLogScreen
  components/         Card, OptionButton, StatLine, MomentList, ContextRail, …
  styles/             token sheet + per-screen CSS
index.html            repo root (Vite default root)
```

**Pure reducer, thin components.** The reducer owns the screen machine, wraps the three engine calls,
and is a plain function tested headlessly. React wires it with `useReducer`. Components are render
functions over a view-model and hold no game logic.

**The load-bearing rule: `view-model.ts` is the only file that reads `GameState`.** Screens receive a
`CareerView`. They cannot display `draftStock`, `probability`, `weight`, `tier`, `snapModifier`, or
trait names because those values never enter the view-model. This makes the hidden-mechanics rule a
testable property of a single boundary instead of a promise repeated across five components (§7).

### Build config

- Add `react`, `react-dom`, `vite`, `@vitejs/plugin-react`; scripts `dev`, `build`, `preview`.
- `tsconfig.json` (pass 2) already has `include: ["src"]`, so `src/ui/**` is covered automatically.
  It needs `"jsx": "react-jsx"` added — **to pass 2 only**.
- `tsconfig.engine.json` (pass 1) stays pinned to `src/engine/**` and `src/content/**` and is not
  touched. Both passes must exit 0.
- `vitest.config.ts` needs no change: `include: ["src/**/*.test.ts"]` picks up session tests as long
  as test files stay `.ts` (§8).

## 4. The loop: resolve in place

The decision card is the screen. After a choice, the options are replaced **in place** by the
outcome paragraph on the card already being read; a single Continue advances to the next decision.
The layout never jumps and the card stays the sole focal point the aesthetic direction asks for.

**One-option beats skip the second step.** The option button is itself the acknowledgement, so
there is nothing to resolve.

### The call/render sequence

`advance` clears `lastOutcome`, sets it, *then* auto-progresses to the next pending decision. A
single `advance` therefore returns **both** the outcome of the choice just made and the next
decision. Continue is a pure UI transition, not a second engine call.

The reducer holds:

```ts
resolved: { title: string; choiceLabel: string; outcome: string } | null
```

Non-null → the card renders the outcome. Null → the card renders `getDecision(state)`. **Exactly one
`advance` per player choice.**

### When a choice ends the career

A content event can carry an `ending` effect, so one `advance` may return both a `lastOutcome` and a
terminal `status`. The outcome still resolves in place on the card — the player reads how it ended
— and **Continue then goes to the Summary instead of a next decision.** The reducer branches on
`status`, not on whether `getDecision` returned null, because those differ in exactly this case.

## 5. Screens

Four screens. No router; the reducer's `screen` field is the only navigation state.

### Creation

Last name; jersey number (1–99); position from `POSITIONS` (which already carries display labels);
home state.

**The state list comes from `REGIONS`** — its five regions cover 37 states — grouped in the select by
region name. States outside `REGIONS` are legal inputs but receive no region bonus, so offering all
50 would hand the player a silently worse choice with no way to know it.

Seed is auto-generated and displayed, not editable — a short random base36 string. The UI is free to
use `Math.random` for this; the no-`Math.random` rule binds `src/engine/**`, and the seed is an input
to the engine, not a draw inside it.

### Decision

A thin context rail above the card: **school name, class year, season record**, and the two band
phrases. Nothing else — **no tier, no conference badge, no overall number.** Tier is exactly what the
Phase-2 spec §4 keeps implicit.

`standing` is the primary read and `trust` is set secondary — smaller, quieter. The visual weight
deliberately mirrors the mechanical weight established in §6; a character phrase given equal
prominence would overstate its influence on the ending.

The card holds title, description, and either the option buttons or the resolved outcome.

### Summary

The headline is one of three: a draft round and pick; **Undrafted** when `draftResult.undrafted` is
set; or `endingReason` when `status` is `"busted"`. `endingReason` is not only the two
`WASHOUT_REASONS` strings — content `ending` effects supply their own ("Career-ending injury",
"Academically ineligible", "Removed from the program"), so the summary renders the field rather than
matching against a known set. Note that a career forced to declare
by exhausted eligibility is not an ending reason — it still produces a `draftResult` and reads as a
normal draft outcome. **This is the only place the raw OVR integer appears.** Then: school path, per-season stat lines, trophies and awards by
display name, the moments timeline with icons, the seed, and the copy-share button.

### Career log

A list of completed careers, reachable from Creation and Summary.

## 6. What the player sees of progression

Mid-career the player reads a **qualitative band**, never an integer. The raw OVR is revealed once,
on the summary. Nothing to optimize against turn by turn; the share card still carries a number.

Bands are anchored on thresholds that already exist in the content, not invented:

| `overall` | phrase | anchor |
|---|---|---|
| < 50 | hanging on to a roster spot | washout floor is 45 |
| 50–59 | scout team | below the 60 starting value |
| 60–68 | in the rotation | starting value |
| 69–76 | week-one starter | |
| 77–84 | one of the best in the conference | All-Conference range |
| 85–91 | All-America caliber | `allAmerican` min 85 |
| 92+ | the best player in the country | `heisman` min 92 |

`character` gets **five coarser bands**. Coarser on purpose: character moves draft stock by ±7.5
against `overall`'s ~82 range, and equal-looking dials would misrepresent that by roughly an order of
magnitude.

| `character` | phrase |
|---|---|
| < 30 | the staff has stopped defending you |
| 30–49 | a problem they are managing |
| 50–69 | just a guy in the building |
| 70–84 | the staff trusts you (starting value is 70) |
| 85+ | they would run through a wall for you |

Band wording above is structurally fixed but **verbally placeholder** — it gets a voice pass against
the content library's register during implementation.

### The label layer

`src/ui/session/labels.ts`, not in `src/content/`, so the engine typecheck pass stays untouched.

Two wrinkles:

- **`ints` means opposite things by position** — thrown by a QB, caught by a DSKILL. Stat labels are
  therefore position-aware, not a flat id→string map.
- **Unknown icons fall back to a default glyph**, so new content can never blank the summary.

Icons are a small hand-rolled inline SVG map. No icon-library dependency.

**Completeness guard:** a test asserts that every `trophyId`, every `awardId`, every `POSITIONS`
stat key, and every `icon` string appearing in `EVENTS` resolves to a label. Content that adds a new
id fails that test rather than shipping blank text to the player.

## 7. The hidden-mechanics rule, enforced

From `PHASE3-KICKOFF.md` and master spec Phase-2 §4: tier logic and the transfer rebuild loop stay
implicit; school traits are discovered through replay and never stated; `draftStock`, event
`probability`, `weight`, EV, and trait names are never rendered.

`CareerView` is the enforcement point. Its shape (approximately):

```ts
interface CareerView {
  playerName: string;           // "#7 Kuri"
  positionLabel: string;
  schoolName: string;           // from CONTENT.schools, keyed by school.schoolId
  classYear: ClassYear;
  seasonRecord: { wins: number; losses: number } | null;
  standing: string;             // band phrase from overall
  trust: string;                // band phrase from character
  status: Status;
  decision: PendingDecision | null;
  resolved: { title: string; choiceLabel: string; outcome: string } | null;
  summary?: CareerSummary;      // populated only on a terminal status
}
```

Explicitly **not** present at any point: `tier`, `draftStock`, `overall` (outside `CareerSummary`),
`character`, `snapModifier`, trait names, probabilities, weights.

**The test:** walk a full career through the reducer across several seeds, serialize every
`CareerView` produced, and assert the output never contains `draftStock`, `probability`, `weight`,
`tier`, `snapModifier`, `trait`, or any member of `ALL_SCHOOL_TRAITS`. One test, one boundary.

## 8. Persistence

Two keys under a `cfb-career-sim:v1:` prefix, both versioned, both read inside `try/catch` and
discarded on parse failure rather than crashing:

- **`current`** — the `GameState` plus the `resolved` block, so a refresh mid-outcome resumes
  mid-outcome. Written after every `advance`.
- **`log`** — completed careers as small summaries: seed, setup, school path, status, ending reason,
  draft result, final OVR, trophies, awards. **Capped at 50 entries, FIFO**, so storage never grows
  unbounded.

### The content-drift failure mode

Trait waves 2 and 3 are deferred but real, and more events are likely. A saved career whose
`currentEventId` points at an event that later stopped existing will make `getDecision` return `null`
while `status` is still `"active"`.

On resume, check exactly that condition. If it holds, tell the player the career can't be continued
and offer a fresh start — rather than rendering a blank card with no options.

## 9. Share card

Copy-as-text. No rasterizer dependency; the summary screen is designed to be screenshot-worthy on
its own, and text survives being pasted into a chat better than an image does.

```
Kuri #7 · QB
Iowa State → Ole Miss · 4 seasons
All-Conference · 2× Bowl Win
Round 3, Pick 19 (#83 overall) · OVR 81
seed ui-0
```

The seed line is non-negotiable: it is the only thing that makes a shared result checkable.

## 10. Styling

Plain CSS with custom properties. **No Tailwind, no CSS-in-JS.** A repo with zero runtime
dependencies should not grow a styling framework for four screens.

Aesthetic direction is fixed by master spec §11 and is design intent, not suggestion: sleek,
high-readability, **dark theme**, clean sans-serif type, **card-based** decision screens, generous
whitespace, minimal chrome; the decision and its options are the clear focal point.

Dark theme is expressed as a token set in one sheet, with per-screen CSS alongside each screen.
Layout is responsive with a mobile-first reading width — a card-based decision game is mobile-natural,
and "mobile front-ends out of scope" in master spec §10 means native apps, not a narrow viewport.

The exact typeface and spacing scale are **deliberately not fixed here**; they are chosen during
implementation under the frontend-design skill rather than guessed in a spec.

## 11. Testing

Vitest only. `.test.ts` files only. **No jsdom, no React Testing Library** in v1 — this keeps the
suite in the idiom of the existing 361 tests and avoids two dependencies.

Covered:

- the reducer state machine (every screen transition, including terminal statuses);
- the `CareerView` boundary — the forbidden-value test of §7;
- band thresholds at every boundary value;
- label completeness against `CONTENT` (§6);
- share-text formatting, including the undrafted and busted variants;
- storage round-trip, the 50-entry cap, corruption recovery, and the unplayable-save path of §8;
- a full-career integration test driving the reducer creation-to-summary across several seeds.

Components carry no logic and are verified by running the app, not by assertion. That is the
explicit trade for keeping the suite dependency-free.

## 12. Out of scope

Restated from master spec §10 plus decisions made in this design:

NFL coda after the draft; global leaderboards; server-saved careers; full 11-position granularity;
native mobile/Discord front-ends; PNG export of the share card; seed entry / replaying a typed seed;
school-trait waves 2 and 3; any balance tuning.

## 13. Decisions recorded

| Question | Decision |
|---|---|
| How does the UI get outcome narration? | Additive `lastOutcome` on `GameState`; API stays five exports |
| How are `overall` / `character` shown? | Qualitative bands mid-career; raw OVR revealed once on the summary |
| Loop shape | Resolve in place on the same card; one-option beats skip the outcome step |
| Persistence scope | Resume in-progress **and** a capped local career log |
| Share mechanism | Copy-as-text including the seed; no rasterizer |
| Where does logic live? | Pure reducer + view-model; thin components |
| Test strategy | Headless Vitest on the session module; no jsdom/RTL |
| Styling | Plain CSS with custom properties |

## 14. Implementation notes — where the build diverged from this spec

Recorded at MVP completion. Each of these is a deliberate change, not drift.

**Moment icons are emoji, not inline SVG (§6).** Twenty-two hand-authored SVG paths is a lot of
invented geometry to get right for an MVP, and badly drawn glyphs would read worse than none. The
design point survives intact: `iconGlyph()` is the only thing that knows, so swapping in an SVG set
later touches `labels.ts` and nothing else. The fallback behaviour is unchanged.

**One stylesheet, not per-screen files (§3).** `src/ui/styles/app.css` covers all four screens. At
this size, splitting it would spread four screens' spacing rules across four files and make the
cancel-each-other-out selector problems more likely, not less.

**`ClassYear` and `Status` were added to the engine's type exports.** The UI needs both, and the rule
is that nothing imports from `src/engine/**` except `index.ts`. Adding two type exports respects that
rule; deep-importing `./types` would have broken it. `bands.test.ts` likewise reads starting values
off a real `createCareer` result rather than deep-importing `STARTING_OVERALL`.

**`CareerView.schoolName` is `string | null`.** Found by playing it: before Signing Day the career
carries `schoolId: ""`, which rendered as a blank gap in the context rail. An uncommitted recruit is
a real state, so the rail names it ("Uncommitted") rather than showing an empty slot.

### Verified at completion

- `npm test` — **428 passing** across 34 files (361 pre-existing, 10 new engine tests for
  `lastOutcome`, 57 new session tests).
- `npm run typecheck` — both passes exit 0.
- `npm run build` — clean; 109 kB gzipped.
- Played end-to-end in the browser: creation → Signing Day → decisions with resolve-in-place →
  draft summary → share text → career log → reload-resume. No console errors, no horizontal
  overflow at 400px.

### Aesthetic decisions made during the build

The brief fixed dark, sans, card-based; the free axes went to:

- **Palette** — a night-game ground: turf green-black (`#0c1712`), lifted card (`#16241d`), chalk
  rules, and a single scoreboard-amber accent (`#f0b429`).
- **Type** — one variable family, Archivo, worked across its *width* axis: condensed for headlines,
  numerals and the rail, normal width for prose.
- **The one bold element** — the jersey numeral, oversized on creation, with the same treatment
  carrying the draft pick on the summary. Everything else stays quiet.
- **Options are depth-chart rows**, not identical pill cards: a flat row whose left edge lights amber
  on hover and focus.
