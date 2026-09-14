# Design Decisions

Append-only. One entry per decision, with its reasoning, so nobody re-litigates it three waves later.
If a decision is reversed, **do not delete it** — add a new entry that supersedes it and say why.

Format: `## NNN — <decision>` · date · who · rationale · what would change our mind.

---

## 001 — Outcome narration comes from the engine, via `GameState.lastOutcome`
**2026-09-13 · pre-polish (Phase 3 build)**

`advance()` resolved an outcome, applied its effects, and discarded `Outcome.description`. 330
authored descriptions across the event files were unreachable by any UI; only 39 of those outcomes
also push a `moment`. The field is additive and the public API stayed at five exports.

It deliberately carries **no positive/negative branch flag** — a UI that colours an outcome red or
green is leaking the option's probability. The prose carries the tone.

## 002 — `character` is never shown as a number; `overall` is
**2026-09-13 · superseded 003 in part — read both**

`character` moves draft stock by about ±7.5 against `overall`'s ~82 points of range. Rendering both
as integers would misrepresent character's influence by roughly an order of magnitude. Character is
shown only as a band phrase.

*Would change our mind:* if character's mechanical weight is ever increased substantially.

## 003 — `overall` shown as an integer throughout (reversed 002's original half)
**2026-09-13 · after measurement — full writeup in spec §15**

Originally `overall` was hidden behind qualitative bands until the summary, to avoid inviting
reload-and-compare optimization play. Measurement over 300 careers / 7,926 decisions killed it:

| | |
|---|---|
| Decisions where `overall` moved | 44.5% |
| Decisions where the *band* moved | 12.2% |
| Band changes per career | median 3 |
| Careers with zero band change | 19 / 300 |

The bands absorbed ~3/4 of all progression feedback. And the optimization argument assumes cheap
retries, which this game does not have — no undo, choices commit on click, and re-rolling one
decision means clearing `localStorage` and replaying a median 24 decisions.

The band phrase survives as a **gloss** on the number, not a replacement.

*This is the model for how calls get made here: measure, then decide.*

## 004 — `view-model.ts` is the only module that reads `GameState`
**2026-09-13 · pre-polish (Phase 3 build)**

Screens receive a `CareerView`. Values the hidden-mechanics rule forbids — `tier`, `draftStock`,
`probability`, `weight`, `snapModifier`, trait names — never enter it, so they cannot be rendered.
This makes the rule a property one test asserts over one boundary rather than a promise repeated
across five components.

**Do not let an agent bypass this boundary.** If a screen needs new data, it goes through the
view-model.

## 005 — Copy-as-text share card, no rasterizer
**2026-09-13 · pre-polish (Phase 3 build)**

No `html-to-image` dependency. Text survives being pasted into a chat better than an image, works on
every device, and the summary screen is designed to be screenshot-worthy on its own. The seed line is
never omitted — it is the only thing that makes a shared result checkable.

*Would change our mind:* if playtesters report the text block feels thin next to the reference
game's shareable artifact.
