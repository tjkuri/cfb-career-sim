# 058 — Where do I stand, while I am still standing there?

**Type:** developer (UI) · **Wave:** 31 · **Status:** done

Files changed: `src/ui/screens/CareerScreen.tsx`, `src/ui/styles/career.css`,
`src/ui/screens/career-screen.test.ts` (new). Nothing else. `view-model.ts` and
`bands.ts` were not touched and did not need to be — `view.trust`, `TRUST_LADDER`
and `trustRungOf` were all already exported and already sufficient.

---

## Item 1 — the ladder, during play

### The choice: permanent, on every screen, replacing the single phrase

The brief asked me to argue between "on screen permanently" and "appears when it
moves and rests as a phrase". Three things point the same way, and they are not
close:

1. **The complaint is about a state, not an event.** *"34 decisions of deliberate
   good-teammate play… nothing ever felt at risk because the readout never
   moved."* Risk is a property of where you are standing, not of the moment you
   move. A ladder that renders only on the click it changes is blind on exactly
   the decisions the complaint is about. It is also not a new thing: it is
   `.trust-move`, which task 043 already shipped, drawn larger.

2. **Measured, it would almost never be on screen.** Over 140,935 decisions (six
   positions × five policies, `playCareer` + `makePolicy`, scratch probe), a
   character effect large enough to print anything at all fires on **20.2%** of
   cards, and only a fraction of those cross a rung. An on-move ladder is absent
   from roughly nine cards in ten — including every one of the 34 the playtester
   was counting.

3. **The second finding forbids it outright.** The five rungs being *"shown for
   the first time in the credits"* is not fixed by showing them at the moment
   the player falls down one. That is still a scale you can only learn by
   losing.

So all five rungs are on screen at all times. They **replace** the single
`.trust` line rather than joining it — the inked rung *is* the phrase that was
already there — so the block gains four quiet lines, not five.

### The form: the summary's ladder, seen earlier and smaller

Read `SummaryScreen.tsx:279-302` and `summary.css:389-472` first, as instructed.
The in-play version keeps the three things that identify that object:

* the five phrases in the order `bands.ts` writes them, best regard first;
* a 2px chalk mark in a fixed gutter column, present on all five rows, inked on
  one — so it can never be read as a quantity, because it is the same mark at
  every rung it can appear on;
* the player's rung told apart by **ink** — full `--chalk`, `--w-ui` — never by
  size. All five rungs are one size, one leading, one row height, and the four
  that are not the player's are identical to each other, so the rung directly
  above yours is set exactly like the rung three below it.

It drops everything that made that block the *subject* of its screen: the
0.68rem row padding, the hairline between every row, the closing rule, the
`--t-label` setting, and the "YOU ENDED HERE" caption. Standing is context here;
five rules and a caption would be five more pieces of chrome arguing with the
card, and the mark plus the ink already say which rung is the player's.

One type decision that is a deliberate split from the summary: the rungs are set
at `--t-body` (13px), not the summary's `--t-label` (15px) and not the rail's
`--t-meta` (12px). 15px would compete with the decision. 12px would drop the
player's own standing phrase into interface chrome, which spends DECISION 024 —
it raised this claim to the band's size on purpose after B17 found it too easy
to ignore. 13px is the prose step, and these five phrases are prose.

### What it is not

**Order only.** Nothing in the block encodes how far:

* No bar, no meter, no dot count, no number, no percentage.
* No mark on the rung the player *left*. This was the one tempting addition and
  it is the one that breaks the rule: two marks on one list is a span, and a
  span three rows long versus one row long is a distance. `trustMove` refuses to
  return a size; the layout must not reintroduce one.
* The move beat stays exactly as task 043 shipped it — direction-only, one hue,
  one weight, both directions identical. Its only change is the noun (item 2).
* On a move, the ladder's single contribution is that the current rung's mark
  steps from `--chalk-dim` to `--chalk`. `[data-moved]` is set for "up" and
  "down" alike and the selector cannot see which, so this is direction-free by
  construction — no valence told by colour (DECISION 012).
* No accent colour anywhere in the block, matching the summary: a gold mark on
  *"the staff has stopped defending you"* would perform a trophy over the worst
  state in the game (DECISIONS 021, 032).

### Cost, stated honestly

| | before | after |
|---|---|---|
| `.standing` height, decision screen | ~95px | 182px |
| `.card` top, desktop 1456×813 | 255px | 366px (card bottom 678, viewport 813) |
| `.card` top, 360px | ~235px | 322px |
| last option's bottom, 4-option card at 360px | ~611px | 698px |

The decision and its options are still the largest, brightest, first thing below
the header at both widths. The one real regression: **a four-option card at
360px on a viewport shorter than ~700px now needs a short scroll to reach the
last option**, where before it just fitted. On current phone viewports (≥780px)
nothing is below the fold. I judged that worth the whole premise of the task and
am flagging it rather than hiding it.

One small thing it fixes on the way: the old `.trust` line was `-webkit-line-clamp: 2`
and wrapped to two lines at 360px for the longest band, so the card's top edge
moved when the rung changed. The ladder is five `nowrap` rows at a fixed height
whatever the player's rung, so the block no longer reflows. Verified: at 358px
no rung clips (longest band sets in 227 of 273 available px).

### Alignment note

`.standing-ladder` carries `margin-left: calc(-0.7rem - 2px)` — it is pulled left
by exactly the gutter it adds, so the *phrases* keep the left edge that
`.claim-where`, `.ovr-band` and the old `.trust` line all share, and the mark
hangs outside it in the empty column under the numeral. Without this every rung
sat 13px right of everything else and the text column had two left edges.

---

## Item 2 — the vocabulary. **The count says change it.**

I tried to refute the PM's reading and could not. The count is below; the verdict
is that the blanket rewrite does **not** make the common case worse, because the
replacement is not a trade.

### Method

Every outcome in `src/content/events/**` whose summed `character` delta clears
the display floor (`LOCKER_ROOM_MIN_CHARACTER = 2`) — **88 outcomes across 45
cards** — was dumped with its card title, option label and outcome prose, and
hand-scored into three classes:

* **A — the room itself.** Teammates, the team, the locker room as a place.
  *"the room quietly picks a side"*, *"you lose trust in the room"*.
* **B — the program.** Coaches, coordinators, the building, compliance meetings,
  team curfew. True of the currency, but not of a room.
* **C — outside the program entirely.** Money, family, media, fans, police,
  academics, the player's own head. *"in the locker room"* is plainly false.

Cards whose outcomes split across classes were scored half to each (four cards:
`postseason-coaching-carousel`, `nonconf-watch-list`, `bust-drug-test`,
`bust-arrest`).

Then the same classes were **weighted by how often each card actually fires**,
because 88 authored outcomes are not what a player reads. A scratch probe played
140,935 decisions — six positions × five policies (`baselineRandom`, `good`,
`humanLazyAmbitious`, `virtueAmbitious`, `lazyFull`), 120 seeds each — recording
the event id every time `character` moved by ≥2 across an `advance`. 28,450
firings.

### The count

| | authored (88) | of lines a player reads (28,450) |
|---|---|---|
| **A** the room itself | 26 (30%) | **51.3%** |
| **B** the program, not a room | 33 (38%) | 17.8% |
| **C** outside it entirely | 29 (33%) | **30.9%** |

Per policy, so the result is not an artefact of how the measured player behaves:

| policy | A | B | C |
|---|---|---|---|
| `baselineRandom` | 49.0% | 19.8% | 31.2% |
| `good` | 49.5% | 16.6% | 33.9% |
| `humanLazyAmbitious` | 46.8% | 19.6% | 33.6% |
| `virtueAmbitious` | 55.6% | 13.3% | 31.1% |
| `lazyFull` | 56.4% | 16.2% | 27.4% |

No row varies by more than nine points across five very different players.

### The reading

**"In the locker room" was literally true of about half the lines a player is
shown, a stretch on another sixth, and plainly false on about a third.** Only
30% of the authored outcomes are locker-room-shaped at all; the frequency-weighted
51% is carried by two cards (`milestone-rivalry` at 22.0% of all firings and
`postseason-awards-banquet` at 4.6%).

Some of the C class, in the player's own words:

* `offfield-money-manager` +2 OVR, character −4 — *"He actually gets you a decent
  deal."* The PM's exhibit, confirmed.
* `catfished` — **22.6% of a virtuous career's character lines on its own**, and
  it is a joke about fans: *"Fans love the good sport."*
* `offfield-entourage` +8 character — *"Your mother feeds you and nobody asks you
  for anything."* Reported as *earning credit in the locker room.*
* `bust-academics` +12 character — clawing a GPA back.
* `the-yips` +2 character — talking to a sports psychologist.
* `offfield-sportsbook-nil` −32 character — a ninety-minute compliance meeting.

### Why this is not the trade the brief warned about

The brief's stop condition was *"if most are genuinely about the team, a blanket
rewrite makes the common case worse to fix the rare one."* Most are not — but
more importantly, **the replacement loses no truth anywhere.** "Cost you with
the program" is true of *"the room quietly picks a side"*, true of a compliance
meeting, and true of a summer spent at home. It costs class A some vividness and
buys class C accuracy. The old string was false a third of the time; the new one
is false none of the time. That asymmetry, not the headcount, is the argument.

### What changed

* `lockerRoomLine` → `programLine`, and the CSS class `.locker-room` →
  `.program-line`.
  * `"Cost you in the locker room."` → **`"Cost you with the program."`**
  * `"Earned you credit in the locker room."` → **`"Earned you credit with the program."`**
* The standing block's `.claim-where` label: `In the locker room` → **`With the
  program`**. It has to move with the line or the header and the card name two
  different currencies, which is the defect DECISION 024 exists to prevent.
* The move beat's screen-reader text: *"Your standing with the program moved…"*.
* The noun is held once as an exported `PROGRAM_LABEL` and interpolated into all
  three, so they cannot drift apart.

**Why "the program" and not something else.** The binding constraint is that the
label now sits directly above the five rungs, so it must not repeat one. *"The
staff"* collides with two rungs (*the staff trusts you*, *the staff has stopped
defending you*) and *"in the building"* with a third (*just a guy in the
building*) — a label that repeats a rung makes that rung read as the heading of
its own list. *"The people who decide"* is accurate but is a phrase, not a place,
and breaks the parallel with *"On the field"*. `career-screen.test.ts` pins the
no-collision rule so a later band edit fails a test instead of shipping it.

**Not card-aware, deliberately.** The honest per-card version needs a field on
`Outcome`; `src/content/**` is frozen and a schema change is the user's call. See
the proposal below.

---

## Verification

* **`npm test` — 810 passed, 45 files, 0 failed.** HEAD (measured from a clean
  `git archive HEAD` tree) is **756**. The delta is +47 from lane 059's
  `src/sim/credit-proposal-probe.test.ts`, which landed in the working tree
  during this task, and **+7 from this lane** (`src/ui/screens/career-screen.test.ts`).
* **`npm run typecheck` — exit 0, both passes** (`tsconfig.engine.json`, then
  `tsconfig.json`). Run twice, clean both times.
* **Identity — `npm run balance` is byte-identical to HEAD on two seeds.** A
  pristine HEAD tree was built with `git archive HEAD | tar -x` (no `checkout`,
  `restore` or `stash` was run at any point) and the same command run in both:

  ```
  npx tsx src/sim/balance.ts 2000 random QB   IDENTICAL  472 bytes  md5 50daf004e2229d9dd5cb0f2bf5a6dc34
  npx tsx src/sim/balance.ts 2000 first  OL   IDENTICAL  471 bytes  md5 56d5f9e8b1df064b8272865df4452287
  ```

  `cmp -s` reported no difference on either. This is expected and structurally
  guaranteed: nothing under `src/sim`, `src/engine` or `src/content` imports
  `CareerScreen.tsx` or `career.css` (grepped; the only `src/ui` import reaching
  the sim is `virtue-probe.ts` → `view-model.ts`, which this lane did not touch).

* **Clicked through at `http://localhost:5173`** (the already-running server; no
  server was started). What I actually saw, in one QB career at Fresno State →
  North Texas:
  * **The five rungs are on screen from the Signing Day card onward**, under
    `WITH THE PROGRAM`, with the 2px mark on *"the staff trusts you"*.
  * **The PM's exhibit card came up second.** *Family Business* → *"Let him
    handle it"* → *"He actually gets you a decent deal…"* now prints **"Cost you
    with the program."** over `+1 OVR`, in the emphasis slot, matching the header
    label two inches above it.
  * **A fall, watched:** the mark moved from *"the staff trusts you"* to *"just a
    guy in the building"*, brightened to full chalk, and *Down from "the staff
    trusts you"* arrived under the ladder. The rung it left was visible two rows
    up, unmarked.
  * **A climb, watched:** the same treatment, exactly — mark up to *"the staff
    trusts you"*, *Up from "just a guy in the building"*, same hue, same weight,
    same entrance. A fall and a climb are indistinguishable except by the two
    words.
  * **At 360px** (rendered in a 360px iframe, since `resize_window` did not take
    on this host): all five rungs set on one line each with no clipping, the
    ladder 105px tall, the card below it, `Continue` at y=587 in a 780px
    viewport.

---

## Flagged, not done

1. **`SummaryScreen.tsx:281` still reads `In the locker room`** over the same
   five rungs, for the same currency. It is read-only this wave. It should move
   to `With the program` so the in-play block and the ending name the same thing;
   it is a two-word change in a file this lane may not open.
2. **A per-card noun would be better than any blanket phrase.** The truly honest
   version is a field on `Outcome` — something like `standingAudience: "room" |
   "program" | "outside"` — letting the card say *"Cost you in the locker room"*
   on `offseason-captain-vote` and *"Cost you with the program"* on
   `offfield-money-manager`. That is a `src/content` schema change and therefore
   the user's call, not this lane's. The hand-scored classification of all 88
   outcomes exists and would seed it: 26 `room`, 33 `program`, 29 `outside`.
3. **`bands.ts` could export the ladder's identity assertion** that
   `career-screen.test.ts` now duplicates (the literal five phrases). Left alone
   — `bands.test.ts` already owns the bands, and duplicating the list in a screen
   test is what makes a band edit fail *here*, which is the point.
4. **The narrow-viewport cost above** (a 4-option card at 360px on a sub-700px
   viewport) is real and unmitigated. If it matters, the cheapest lever is
   `.standing-rung { padding }` — 0.17rem → 0.08rem buys ~9px — but I did not
   spend it, because it would tighten the row rhythm below the point where the
   five rungs read as a list.
