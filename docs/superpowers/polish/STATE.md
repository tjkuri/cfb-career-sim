# CFB Polish Phase — Board

**This file is the single source of truth.** It must always be complete enough that a brand-new PM
session can take over from it alone. Update it after every wave.

**Last updated:** 2026-09-13 · **Wave:** 0 (not started) · **PM session:** 1

---

## The goal

A CFB reinterpretation of a soccer career simulator. Engine and content are finished and good; the
UI works but looks and feels like an MVP.

North star: match the reference game's visual polish and its intuitive, hard-to-put-down feel, while
being unmistakably college football rather than a reskin. When unsure whether something is worth
doing: *does this get us closer to how the reference game feels to play?*

**Done is not an empty backlog.** Done is a playtester who has never seen it playing three careers in
a row without being asked to.

## Reference game

- Live: `https://copero.com.ar/juegos/simulador-carrera` (Spanish, soccer)
- Local bundle: `reference/soccer-original/CareerSimulatorPage-BtSZ7OIp.js` (440K minified, one line)

Already extracted — three ways our build diverged:

| | Reference | Ours |
|---|---|---|
| Layout | Full-viewport, vertically centred (`h-full`, `flex-1`, `items-center justify-center`) | Top-anchored scrolling document |
| Type | Small and very heavy: `text-xs`/`text-sm` dominate (83 uses), `font-bold`/`black`/`extrabold` (112) | Large, lighter, airy |
| Imagery | A large image per event, 60–90% of viewport | No art at all |

Adopt, adapt or reject each **on purpose**. Do not copy its assets or literal palette.

## Current state of the build

- Phase 3 MVP complete and committed (`42ba561`), plus the OVR display reversal (`d600e69`).
- **430 tests passing**, both typecheck passes exit 0, production build clean (~109 kB gzipped).
- Playable end to end: creation → Signing Day → decisions → draft summary → share text → career log,
  with `localStorage` resume.

## Backlog

Status: `todo` · `in-flight` · `blocked` · `done` · `dropped`

| ID | Item | Status | Notes |
|---|---|---|---|
| B1 | Decision card floats in a large empty field at desktop width; reads unfinished rather than minimal | todo | See reference layout row above |
| B2 | **No orientation in time.** `GameState` has `phase` and `seasonIndex`; the UI surfaces neither. Cannot tell week three from the bowl game | todo | Breaks no rule to show. Best-value item on the board |
| B3 | Flat hierarchy inside the card — title, description and options too close in weight | todo | |
| B4 | Option buttons read as form fields, not choices with stakes | todo | |
| B5 | Summary is a uniform grey scroll after the one big number — and OVR is now visible throughout, so that number is no longer a reveal | todo | Does the screen still land? |
| B6 | Moment icons are emoji | todo | `iconGlyph()` in `src/ui/session/labels.ts` is the only place that knows — one-file swap |
| B7 | No rhythm across a career — ~24 decisions arrive identically, nothing marks a season ending | todo | |
| B8 | One accent colour does every job: buttons, draft verdict, focus rings, log headlines | todo | |
| B9 | Five parked *feel* items in `docs/superpowers/STAGE4-HANDOFF.md` — uneven injury exposure, character drift, decorative stats, +2 | todo | Deferred until a UI existed to judge them in. It exists now |

**B1–B8 are unverified.** They are one person's read of screenshots plus a short play session. Get
them confirmed or refuted by a playtester before anyone builds against them.

## In flight

*(nothing yet — wave 1 not dispatched)*

| Brief | Agent | Owns files | Dispatched |
|---|---|---|---|
| — | — | — | — |

## Next actions

1. Dispatch `briefs/001-baseline-playtest.md` (already written, ready to go).
2. From its report, confirm/refute B1–B8 and write wave 1 developer briefs (2–4, non-overlapping files).
3. Report to the user: what the playtester found, what is being done first, and why.

## Handoff protocol

Full PM instruction set: `docs/superpowers/polish/PM-PROMPT.md`.

## Handoff protocol

Agents write findings to `reports/NNN-slug.md` and return **only** status, ≤5 bullets, and the path.
Never full findings — this is the main lever on PM context size.

After ~3–4 waves, or whenever the session feels long: finish updating this file, then tell the user
to start a fresh PM session with:

> You are the PM for the CFB polish phase. Read `docs/superpowers/polish/STATE.md` and continue.

Increment the **PM session** counter at the top when you take over.
