# 061 — The route nobody priced, and the metric nobody measured

**Type:** measurement + proposal · **Wave:** 32 · **Status:** ready — dispatch now

Repo: `/Users/tkuri/Documents/personal_projects/cfb-career-sim`

**Goal:** price a third route for the five season-opener cards that report 059 named but was not asked
to cost — and, separately and more importantly, measure the one quantity this board has been arguing
about for four waves without ever having measured it: **how often a career's standing actually crosses
a rung boundary, up and down.**

**Why:** every remaining big item on this board is a content decision sitting with the user, and two of
them cannot be ruled on because the thing they are supposed to fix has never been measured directly.

## Hard constraints — read every line, a cold agent will not know any of this

- `overall` **is** shown to the player as a number. `character` is **never** shown as a number, only as
  a band phrase. It swings draft stock ~±7.5 against overall's ~82; an integer would overstate it
  tenfold.
- Never display: school tier or any badge implying it, `draftStock`, event `probability` or `weight`,
  EV, or school trait names. Traits are meant to be discovered by replaying, never stated.
- `src/engine/**` and `src/content/**` are **frozen**. **You edit neither, not even by one character.**
  If you believe a change there is needed you write it into the report as a proposal with the exact
  file, card id, option id, current effects array and proposed one. **You do not edit. The PM decides
  and the user approves.**
- `src/ui/session/view-model.ts` is the only module allowed to read `GameState`. Do not bypass it.
- **`src/ui/**` is entirely out of bounds for you this wave, including `view-model.ts`.** A playtester
  is playing HEAD in a browser at the same time as you. Changing the build under them invalidates the
  most expensive measurement on this board. **Ship no product code at all.**
- **Everything you write goes in NEW files under `src/sim/` plus your report.** Nothing else.
- 810 tests stay green. `npm run typecheck` runs TWO passes and both must exit 0.
- **Do not run `npm run dev`** — the server is already running and that command never exits. Never run
  a foreground command that does not terminate.
- **Do not commit, and never run `git checkout`, `git restore` or `git stash`.** The tree holds another
  agent's uncommitted work. The PM commits.
- If a tool call fails 3 times, stop that line of attack and write up what you have.

## Refuting this brief is a success condition

This board's four best results all came from an agent that found its brief's premise wrong and said so
before fixing what was actually there. The last measurement lane on this subject corrected the PM twice
and was right both times. **If the mechanism below is wrong, say so plainly, show the numbers, and
price what is actually there instead.** Do not build on a premise you have disproved.

Three denominator rules this board has paid for, in blood:

- **A set defined by a measurement is not a set verified card by card.** Resolve every card and option
  you touch to source by hand. A previous lane's "22 cards" was 11.
- **When a claim is about what a player can experience, the denominator is careers, not cells.**
- **A statistic measured on a sub-population is not a corpus statistic.** This one caught the PM: a
  "median 0" that was true of ten hand-picked cards got written into a brief as a corpus-wide figure,
  where the real value is 2.

## Background you need, and its exact provenance

Read these two and nothing else: `docs/superpowers/polish/reports/059-price-the-thing-the-user-has-to-approve.md`
(§4 the proposed diffs, §5 the price, §5.5 the recommendation) and `DECISIONS.md` **085**. Do not read
the rest of `DECISIONS.md`, `STATE.md`, or the other reports — they are long and mostly superseded.

Existing probe to **reuse rather than reinvent**: `src/sim/credit-proposal-probe.ts` already models
content edits as data (`TIER_1` / `TIER_2` / `UNSURE`) without editing `src/content/**`, and its test
asserts every row's `from` against the corpus at HEAD so the proposal fails a test rather than silently
drifting if content moves. **Extend that pattern.**

## Part 1 — the route

The five `milestone-opener-*` cards in `src/content/events/milestones.ts` are `fixed`, fire once a
season in 100% of careers, and each has two options:

- `handle-it` — p=0.75; success gives snaps; **failure carries `character −2`**
- `stay-within` — p=0.9; success gives snaps **and `character +1`**; failure carries `overall −1`

Two routes are already priced in 059:

- **Tier 2** — `stay-within` success `+1` → `+2` on all five. Measured: it is the only thing on the
  table that moves the median career, **and** it takes the `good` profile's credit rate from 72.5% to
  **100%**, which is why the PM will not bundle it with Tier 1.
- **Route 3, named by 059 and never priced** — instead of crediting `stay-within`, **remove the `−2`
  from `handle-it`'s failure outcome.** The claim is that this makes the openers *silent both ways*
  rather than one-way-down, costs the virtue profiles nothing, and **pays nobody for being calm.**

**Price Route 3.** Also price **Tier 2 + Route 3** together, and carry **Tier 1** and **HEAD** through
the same harness on identical seeds so all arms are comparable in one table.

### The thing that makes this interesting, and you must resolve it

**Wave 26's author already considered deleting this effect, called it R3, and rejected it** — the
reasoning is in a comment block in `milestones.ts` immediately above the five cards (around lines
55–90). Its words are that deleting the effect *"costs the openers the only thing they say."*

**The PM's reading is that the rejection does not straightforwardly transfer, and you should check it
rather than take it.** When R3 was rejected the opener was **one button** carrying `+0 / −2`, so
deleting the effect left the card saying nothing at all. DECISION 074 then made it two options, and
`stay-within` now carries a `+1`. So under Route 3 the card **still says something** — it just says it
only on the branch the player chose deliberately.

**Determine whether the wave-26 rejection still applies, and say so either way.** Concretely: under
Route 3, what fraction of careers read *any* character line from the openers at all, and on which
branch? If the answer is "almost none", the wave-26 objection survives DECISION 074 and Route 3 is
worse than it looks. **This is a question you can answer with a number. Answer it.**

## Part 2 — the metric nobody has measured, and it may matter more than Part 1

DECISION 085 corrected DECISION 084 on exactly one clause, and the correction opened a hole:

> *"Credits firing and rungs moving are two different claims and 084 ran them together."*

Every figure this board has on the subject is a count of **credit lines printed**. Nobody has ever
measured **rung crossings** — how often the player's standing band actually changes, which is the thing
a player sees move and the thing the last two playtests said never moves.

**Measure it, per profile, at HEAD first:**

- Distribution of **upward rung crossings per career** — mean, p50, p90, and **the share of careers
  with zero**.
- Same for **downward** crossings.
- The **starting** rung and the **ending** rung distribution.
- **Time to first crossing** in decisions, in each direction.
- How much accumulated `character` a crossing actually requires from the modal starting position, and
  how that compares to the median career's total character earned and total lost.

The rung boundaries and the band logic live in the UI layer (`TRUST_LADDER` / `trustRungOf`, exported).
**You may read `src/ui/**` — you may not write to it.** If the boundary values you need are not
importable without touching a UI file, **re-derive them in your probe and assert in a test that they
match the exported values**, so a later band edit fails a test instead of silently invalidating this
measurement.

Then run the same measurement across all four arms. **The acceptance question for the whole wave is
this, and it is deliberately about rungs rather than credits, because the credit criterion was already
satisfied at HEAD and therefore discriminated nothing:**

> **Does any arm take the median `virtueLoyal` career from zero upward rung crossings to at least one,
> without moving `good`'s draft stock or taking `good`'s credit rate to saturation?**

If the answer is **no arm does**, that is a first-class finding and probably the most useful sentence
you can write, because it would mean **no edit to these five cards can fix the complaint** and the
fault is in the rung boundaries after all — which would make DECISION 081's shelved `80/67` change live
again. Say so explicitly if the numbers say so.

## Profiles, sample sizes, and honesty about them

Use the existing profiles: `virtueLoyal`, `virtueAmbitious`, `good`, `baselineRandom`. **≥3,000 careers
per profile per arm**, identical seeds across arms so differences are the edit and not the sampling.
Report confidence intervals on every delta, and **do not report a difference smaller than its interval
as a difference.**

Note for your write-up: **`good` is misnamed.** It is a draft-stock maximiser, not "a player who plays
well" — it takes four of Tier 1's six branches exactly zero times because they are stock-negative. Say
which profile you mean by behaviour, not by name.

## What to deliver in the report

1. **The four-arm table** — draft stock, undrafted rate, bust rate, credit lines read, charge lines
   read, and **upward / downward rung crossings**, per profile, with intervals.
2. **The answer to the acceptance question**, stated as a yes or a no with the number attached.
3. **Whether the wave-26 R3 objection survives DECISION 074**, with the fraction of careers reading any
   opener character line under Route 3.
4. **A recommendation between HEAD / Tier 2 / Route 3 / both**, including "none of them" if that is
   what the numbers say — and **the strongest fair statement of the counter-case for shipping
   nothing.** The last lane on this subject wrote *"a wave that fixed all 27 would ship a worse game
   than HEAD"*, and that line was worth more than its recommendation.
5. **The exact proposed diff** for whatever you recommend: file, card id, option id, branch, current
   effects array, proposed effects array. Proposal only — you edit no content.
6. **Limitations.** Say what is modelled rather than observed, and what would falsify your own
   conclusion.

## Verify before reporting

- `npm test` — **810 green** at HEAD, plus whatever you add.
- `npm run typecheck` — both passes exit 0.
- `git status` — **`src/engine/**`, `src/content/**` and `src/ui/**` must all be untouched.** Your only
  changes are new files under `src/sim/` and your report. Paste the `git status` output into the
  report.
- Because you ship no product code, **balance must be byte-identical to HEAD.** Confirm it and say so.
  When a change is supposed *not* to move balance, identity **is** the pass.

**REPORT:** write to
`docs/superpowers/polish/reports/061-the-route-nobody-priced-and-the-metric-nobody-measured.md`.
Return to the PM **only**: status (done / blocked / needs-decision), **≤5 bullets**, and that path.
**Never the full findings.** Lead your bullets with the answer to the acceptance question, then whether
the wave-26 objection survives, then your recommendation.
