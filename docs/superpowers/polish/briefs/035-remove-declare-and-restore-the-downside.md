# 035 — Remove the declare decision, and make a career able to go wrong

**Type:** developer (engine + UI) · **Wave:** 16 · **Status:** ready
**Repo:** `/Users/tkuri/Documents/personal_projects/cfb-career-sim`

## Goal

Implement the two coupled changes the user has approved: **delete the declare-early decision**, and
**restore a real failure path** using the mechanism chosen from measurement.

## Why — read these first, in this order

1. **`docs/superpowers/polish/DECISIONS.md` entry 057** — the user's decision and its reasoning.
2. **`docs/superpowers/polish/DECISIONS.md` entry 058** — the chosen mechanism and the two findings
   that decided it.
3. **`docs/superpowers/polish/reports/034-a-career-can-go-wrong.md`** — the measurements, the
   candidates that were rejected and why, and §6's open items, which are your task list.

Short version: declaring early was **strictly dominated at every offer** — a button whose only
correct use is never — so it is being deleted rather than reworded. But it was carrying essentially
all of the game's failure: remove it alone and a deliberately-bad player is drafted **97.8%** of the
time. The replacement was chosen over ~150,000 measured careers.

**This is a lift of the engine freeze for this work and only this work** (DECISION 057). Everything
not named below is still frozen.

## What to build

### 1. Remove the declare decision

- It is a **synthetic hub built in the engine**, not in content — grepping `src/content/**` for it
  finds nothing. Start at `src/engine/advance.ts` and the `getDecision` hub branches.
- **Enumerate the blast radius before editing.** 034 §6 names: `src/sim/policies.ts:242`'s `declare`
  strategy, the `PROFILES` table (many profiles set `declare`), the view model, the ledger's
  class-year display, and tests. **Do not guess at it — grep and list it in your report.**
- `EARLY_DECLARE_PENALTY` in `src/engine/draft.ts` becomes dead once nobody can declare early.
  **Check whether anything else reaches it** (a career that ends early for another reason may still
  be a non-senior) before deleting it. If it is still reachable, leave it and say so.

### 2. The downside — DECISION 058's mechanism

**(a) Raise the bar the draft applies.** In `src/engine/draft.ts`: `UNDRAFTED_FLOOR` 35 → **50**, and
the round-band divisor `9.3` → **6.8**. The divisor is not optional — without it round 1 needs a raw
stock of 99/100 and becomes unreachable. Both numbers were measured; do not re-derive them.

**(b) Upperclass-only decline.** At the development call site in `src/engine/advance.ts` (currently
around lines 199–210): when the completed season's `snaps` are below **200** *and* the player is a
**JR or SR**, the season costs `ceil((200 - snaps) / 60)` points of overall instead of granting
development. Freshmen and sophomores are unaffected — that gate is load-bearing, not a detail: an
ungated version was measured and **disqualified** for punishing luck rather than play.

Prefer expressing the three constants the way the surrounding code expresses such things — the
progression config in `src/content/postseason.ts` already holds `washoutOverallFloor` and friends.
**If putting them there means touching `src/content/**`, that is in scope for this brief only, for
these constants only.**

### 3. Expect to find, and handle

- **The redshirt card may fix itself.** Under the new decline a *junior* who redshirts loses real
  ground, which could turn today's free +5 into an actual gamble (B43). **Measure it and report;**
  do not separately "fix" the redshirt card in this brief.
- **Careers get longer** without declare (4.73 seasons vs 3.10), and repetition is this phase's top
  complaint. **You must run `npx tsx src/sim/repetition-probe.ts 24 B card` and again with `C` and
  `all`** — both cohorts, neither alone exercises all five opener variants — and report whether
  first-repeat and re-shown numbers move.
- **The UI will have a hole where the declare card was.** The offseason loses a beat. Report what the
  offseason now looks like; do not design a replacement beat in this brief.

## Acceptance — the numbers this must reproduce

Measured over **≥1,500 careers per profile across all six positions**, using
`npx tsx src/sim/failure-probe.ts <runs> <profile> all`:

| profile | undrafted | round 1 |
|---|---|---|
| `good` | ~0.9% | ~40.7% |
| `randomFull` | ~5.6% | ~8.8% |
| `lazyFull` | **~19.2%** | 0.0% |
| `antisocialFull` | ~2.7% | busted ~13.7% |

**If your numbers differ materially from these, stop and report rather than tuning to fit.** The
mechanism was chosen on these numbers; a mismatch means something else changed and the PM needs to
know what.

**The disqualifier, restated:** a well-played career must stay safe. If `good` starts failing
materially above ~1%, or its round-1 rate drops below 28%, **stop and report.**

## Constraints — HARD, paste-in block

- `overall` **is** shown as a number. `character` is **never** shown as a number, only as a band
  phrase. It swings draft stock ~±7.5 against overall's ~82; an integer would overstate it tenfold.
- Never display: school tier or any badge implying it, `draftStock`, event `probability` or `weight`,
  EV, or school trait names. Traits are meant to be discovered by replaying, never stated.
- `src/engine/**` and `src/content/**` are frozen **except** for the specific sites named in this
  brief. Anything else needs a proposal, not an edit.
- `src/ui/session/view-model.ts` is the only module allowed to read `GameState`. Do not bypass it.
- All **651** tests stay green, or a test that encodes the old behaviour is updated with a comment
  saying why. Both typecheck passes exit 0.
- Aesthetic direction is fixed: dark theme, clean sans-serif, card-based, generous whitespace,
  minimal chrome, the decision and its options are the clear focal point.

## Working rules

- **Do not commit**, and never run `git checkout`, `git restore`, `git stash` or `git clean`.
- The dev server is **already running** at `http://localhost:5173`. Never run `npm run dev` — it
  never exits. Never run a foreground command that does not terminate on its own.
- **`npm run play` prints npm's banner on stdout**, so `| md5` hashes the banner too. Use
  `npx tsx src/sim/play-headless.ts <seed> random | md5` for a real hash.
- `resize_window` silently no-ops in this browser; measure breakpoints via a same-origin iframe.
- Clicking a career through in a JS loop hits a 45s timeout after 3–10 clicks. Batch small, or write
  a `GameState` into `localStorage['cfb-career-sim:v1:current']` as
  `{schema: 1, state, resolved: null}`.
- If a tool call fails 3 times, stop that line of attack and write up what you have.
- **Write your report incrementally, starting early.** Agents have been killed mid-flight repeatedly
  in this phase.

## Verify before reporting

- `npm test` and `npm run typecheck` (both passes), and `npm run build`.
- The four acceptance rows above, with the exact command lines.
- The repetition-probe output for cohorts `B`, `C` and `all`.
- **Seed baselines move by construction and that is approved** (DECISION 040 precedent). Record the
  new md5s for seeds **24, 77 and 101** via `npx tsx src/sim/play-headless.ts <seed> random | md5`.
- A click-through at `localhost:5173`: an offseason with no declare card, and a career you can see
  declining — confirm the drop is visible in the OVR the player watches.

**REPORT:** write findings to
`docs/superpowers/polish/reports/035-remove-declare-and-restore-the-downside.md`.
Return to the PM **only**: status, **at most five bullets**, and that path. **Never the full
findings.** Lead with the four acceptance rows and the new seed md5s.
