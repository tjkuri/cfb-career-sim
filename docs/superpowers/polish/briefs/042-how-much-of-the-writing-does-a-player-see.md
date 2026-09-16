# 042 — How much of the writing does a player actually see?

**Type:** research / measurement · **Wave:** 21 · **Status:** ready — dispatch now

Repo: `/Users/tkuri/Documents/personal_projects/cfb-career-sim`

**Goal:** count, in words, how much of this game's authored prose a player ever reaches — and how much
of it is now gated behind conditions that a well-played career no longer satisfies.

**Why:** this project's own doctrine is *"the writing is the asset"* — every playtester has read the
cards with pleasure. But three separate correctness fixes have now quietly shrunk the pool of events a
player can reach, and **nobody has counted the cost even once**:

- A redshirt season's event pool fell from **81 to 12** when a gate was tightened (DECISION 051).
- Three cards (`entourage`, `curfew-check`, `exit-interview`) sit behind `maxCharacter: 55` on a
  `ride-it-out` option. A recent balance change moved a good player's median final character from ~41
  to ~63, so the share of good careers that ever drop below that gate fell **90.4% → 12.6%**, and
  those three cards now fire about **0.06× per career instead of 1.0×** (logged as B55).

Each of those is *correct behaviour* — content written for a player whose standing is in the tank
should not fire for a player whose standing is fine. But correct-and-buried and correct-and-reachable
look identical from inside the code, and the next planned wave is **authoring new content**. Nobody
should write a new word until we know whether the existing words are being seen. That is this task.

## What to produce

A report that answers these four questions with numbers, in this order of importance.

### 1. The headline number

**What percentage of the authored prose does one career show a player?** Give it for a well-played
career and for a selfishly-played one, as a mean over a large sample, and state the denominator you
used and why. A second, blunter framing is also wanted: *a player who plays ten careers has read
roughly N% of what was written.*

### 2. The buried-content inventory

Every gate in `src/content/**` that meaningfully restricts reachability — `maxCharacter`,
`minCharacter`, redshirt-only, injury-only, class-year, position, overall thresholds, anything else
you find — with, for each:

| gate | events/options behind it | words behind it | fire rate per career, `good` | fire rate per career, `humanLazy` |

Rank by **words a good player will never see**. That ranking is the deliverable — it is what tells the
PM whether B55 is a real problem or a rounding error.

### 3. The two known cases, quantified

- **The `maxCharacter: 55` cards** (B55): how many words sit behind that band in total, and how much
  of it is now effectively unreachable to a clean player? Is it three cards, or thirty?
- **The redshirt pool, 81 → 12** (DECISION 051): how many words does a redshirt season now have
  available versus before the gate tightened? A redshirt season is a whole season of a player's
  career — if it is served from 12 events, say how many words that is and how repetitive it is
  forced to be.

### 4. A recommendation, as a proposal — not a change

Which of the buried writing, if any, is worth re-homing or re-gating, and which is correctly buried.
Be willing to conclude **"this is a rounding error, go author new content"** — that is a completely
acceptable answer and it saves a wave either way. Say which you believe and why, with the number that
convinced you.

## How to measure

- A `good` policy and a `humanLazy` policy already exist in `src/sim/**` (the latter chooses by
  *authored intent* rather than draft-stock score, and is the better model of a human). Read
  `src/sim/` to find them before writing anything new. Prior waves used **3,000 careers** and
  measured per position; match that unless you have a reason not to, and state your sample size.
- `npm run play -- <seed> <policy>` runs a headless career and prints JSON. Note that `npm run play`
  prints npm's banner on stdout; `npx tsx src/sim/play-headless.ts <seed> <policy>` does not.
- Counting words: count the **authored prose a player actually reads** — card text, option labels,
  outcome text. State your rule and apply it consistently. Do not count ids, keys, or effect blocks.
- Distinguish **never reachable** from **rarely reachable**. A card that fires 0.06× per career is not
  the same finding as one that cannot fire at all, and if you find anything genuinely unreachable in
  any career, that is a bug and it leads your report.

## Constraints — design intent, not preferences

- `overall` **is** shown as a number. `character` is **never** shown as a number, only as a band
  phrase. It swings draft stock ~±7.5 against overall's ~82; an integer would overstate it tenfold.
- Never display: school tier or any badge implying it, `draftStock`, event `probability` or `weight`,
  EV, or school trait names. Traits are meant to be discovered by replaying, never stated.
- `src/engine/**` and `src/content/**` are **frozen**. If you believe a change there is needed, you
  write a proposal; you do not edit. The PM decides, and brings it to the user if it touches balance.
- `src/ui/session/view-model.ts` is the only module allowed to read `GameState`. Do not bypass that
  boundary.
- 671 tests stay green. Both `npm run typecheck` passes exit 0. Verify before reporting.
- Aesthetic direction is fixed: dark theme, clean sans-serif, card-based, generous whitespace, minimal
  chrome, the decision and its options are the clear focal point.

## Out of bounds

- `src/engine/**`, `src/content/**`, `src/ui/**` — **read freely, edit nothing.** This task changes no
  behaviour at all.
- **A playtester is playing the live build at `localhost:5173` while you work.** Do not touch anything
  the running app imports, do not restart or kill the dev server, and do not clear `localStorage`.
  New measurement scripts go in `src/sim/` as new files, imported by nothing the app loads.
- Do not commit. Do not `git checkout`, `git restore`, or `git stash` — the tree holds another agent's
  work. The PM commits.

## Operating rules — agents have died here

- **The dev server is ALREADY RUNNING at `http://localhost:5173`. Do NOT run `npm run dev`.** It never
  exits and it is the single most likely thing to hang you.
- Never run a foreground command that does not terminate on its own. A 3,000-career sweep should be
  run with a real timeout and, if it is slow, in the background or in chunks.
- If any single tool call fails 3 times, stop that line of attack, write up what you have, and report
  `blocked`. A partial honest report beats a stalled session.
- **Write your findings to the report file incrementally**, as each question above is answered. Do not
  hold the whole analysis in your head and write at the end — three agents on this project have been
  killed mid-flight, two of them holding unwritten work.

## Verify before reporting

`npm test` (671 green) and `npm run typecheck` (**both** passes exit 0). If you added files under
`src/sim/`, they must not break either.

**REPORT:** write to
`docs/superpowers/polish/reports/042-how-much-of-the-writing-does-a-player-see.md`.
Return to the PM **only**: status, ≤5 bullets, and that path. **Never the full findings.**
Lead your bullets with the headline percentage from question 1 and your one-line answer to question 4.
