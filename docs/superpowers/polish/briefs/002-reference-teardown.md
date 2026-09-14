# 002 — Reference game teardown (research only, no code changes)

**Type:** research · **Wave:** 1 · **Status:** ready to dispatch

Repo: `/Users/tkuri/Documents/personal_projects/cfb-career-sim`

## Goal

Produce a structural teardown of the reference game this project reinterprets, so that wave-2
developer briefs can specify layout, type scale, and screen composition from evidence instead of
taste.

**You change no files except your report.** No edits to `src/**`. No dependencies. No design work.

## Why

Our UI works but reads like an MVP. Three divergences from the reference have been noted already and
are the starting hypotheses, not the answer:

| | Reference | Ours |
|---|---|---|
| Layout | Full-viewport, vertically centred (`h-full`, `flex-1`, `items-center justify-center`) | Top-anchored scrolling document |
| Type | Small and very heavy: `text-xs`/`text-sm` dominate (83 uses), `font-bold`/`black`/`extrabold` (112) | Large, lighter, airy |
| Imagery | A large image per event, 60–90% of viewport | No art at all |

## Sources

- Local bundle: `reference/soccer-original/CareerSimulatorPage-BtSZ7OIp.js` — 440K minified
  React+Tailwind, one line. This is the primary source. Mine it:

```
grep -o 'className:"[^"]\{10,120\}"' <file> | sort -u
grep -oE 'text-(xs|sm|base|lg|xl|[0-9]xl)\b' <file> | sort | uniq -c
grep -oE 'font-(medium|semibold|bold|extrabold|black)' <file> | sort | uniq -c
grep -oE '(bg|text|border)-(slate|zinc|gray|neutral|emerald|amber|red|blue)-[0-9]{2,3}' <file> | sort | uniq -c
```

- Live build, if reachable: `https://copero.com.ar/juegos/simulador-carrera` (Spanish, soccer).
  You have browser automation via the `claude-in-chrome` skill; load its tools with a single
  ToolSearch call. Use it to screenshot the decision screen, a season/summary screen, and whatever
  "where am I in time" affordance exists. **If browser access is blocked or the site is
  unreachable, do not spin — note it and complete the teardown from the bundle alone.**

## Questions to answer, in priority order

1. **Where does the player read their position in time?** Season number, week/phase, how much career
   is left. What element shows it, where does it sit, how prominent is it, is it persistent or
   per-screen? This is the single highest-value question — our build surfaces none of it.
2. **Screen composition of the decision screen.** What regions exist top to bottom, what proportion
   of the viewport does each take, where is the focal point, and how is the option list constructed
   (spacing, borders, hover/active treatment, how many options typically)?
3. **Type scale, concretely.** Which sizes/weights are used for which role (headline, body prose,
   option label, metadata/rail). Give the actual Tailwind classes and their px equivalents.
4. **Colour roles.** How many accents, and what job does each do — is one colour doing buttons and
   status and emphasis, or are they separated? Extract the palette as a role table, not a swatch list.
5. **Rhythm.** Is there any screen or treatment that is *not* the standard decision card — a season
   boundary, an interstitial, a milestone, a summary? What breaks the repetition across a career?
6. **Imagery.** Confirm or refute the 60–90%-of-viewport claim. What is actually rendered — photos,
   illustrations, generated art, icons? How are they sourced/referenced in the bundle? Is the image
   per-event or per-category? Estimate how many distinct images exist.
7. **Anything it does that we have not thought of.** Micro-interactions, transitions, persistence
   affordances, progress indicators, share mechanisms.

For each of 1–7: state the evidence (grep output, class strings, screenshot), then say what it
implies for us. **Recommend adopt / adapt / reject** with a one-line reason. We are reinterpreting,
not cloning — do not recommend copying its assets or literal palette.

## Hard constraints (these bind the recommendations you make)

- `overall` **is** shown as a number. `character` is **never** shown as a number, only as a band
  phrase — it swings draft stock ~±7.5 against overall's ~82; an integer would overstate it tenfold.
- Never display: school tier or any badge implying it, `draftStock`, event `probability` or `weight`,
  EV, or school trait names. Traits are meant to be discovered by replaying, never stated.
- `src/engine/**` and `src/content/**` are **frozen**. A change there needs a written proposal, not
  an edit.
- `src/ui/session/view-model.ts` is the only module allowed to read `GameState`. Any new data a
  screen needs goes through it.
- 430 tests stay green; both typecheck passes exit 0. (You change no code, so just do not break the
  working tree.)
- Aesthetic direction is fixed: dark theme, clean sans-serif, card-based, generous whitespace,
  minimal chrome, the decision and its options are the clear focal point. Plain CSS with custom
  properties — **no Tailwind, no CSS-in-JS.** Translate the reference's Tailwind into our token
  vocabulary; do not propose adopting Tailwind.

## Report

Write the full teardown to `docs/superpowers/polish/reports/002-reference-teardown.md`.
Include a short "if you only implement three things" section at the top.

**Return to the PM only:** status, at most five bullets, and the report path. Nothing else — the PM
is deliberately keeping its context small.
