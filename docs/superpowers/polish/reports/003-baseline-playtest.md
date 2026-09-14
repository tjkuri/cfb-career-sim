# 003 — Baseline playtest

**Type:** playtester report · **Date:** 2026-09-13 · **Status:** done
**Build:** dev server, `localhost:5173`, desktop Chrome at 1456×824 (1440px window)

Three careers played end to end, `localStorage` cleared between each.

| # | Player | Position | Path | Seasons | Ending | Decisions (approx) |
|---|---|---|---|---|---|---|
| 1 | Vance #7 | Quarterback | Memphis → App State | 3 (FR–SR) | R5 P18, #146, OVR 72, All-Conference | ~32 |
| 2 | Oyelaran #7 | Kicker | Temple | 2 (FR–JR, declared early) | R6 P7, #167, OVR 74, Bowl Win | ~22 |
| 3 | Brzezinski #7 | Offensive line | Ohio → Missouri | 2 (FR–JR, declared early) | R5 P26, #154, OVR 78 | ~24 |

---

## Headline

The writing is the best thing here and the game keeps it in a box that makes it feel smaller than it
is. Individual cards are genuinely good — "the room claps while the camera stays on your table,"
"the coordinator looks at you like you're the one who has to decide this game now, which, for the
next ten seconds, you are." I read every one of those with pleasure.

But the single biggest problem is not visual. **The game hides the information it already has.** The
header said `0-0` for my entire quarterback career. At the draft screen it told me I had gone 5-7,
3-9, 5-7 and thrown 16 TDs to 16 picks. I played three losing seasons and did not know. The end
screen was the first time the career had a shape, and by then it was over.

The second biggest problem is the flat dynamic range. My kicker tore something in his leg — 66 → 58,
demoted from "in the rotation" to "on the scout team" — and it looked exactly like the card where he
talked his way out of a speeding ticket: one grey sentence, one yellow Continue. Later he crossed
into "a week-one starter" and I only caught it because I was reading a text dump. **Nothing in this
game is ever louder than anything else.**

I would play again — the third career (Missouri, offensive line, night game whiteout) was the most
fun, and I wanted a fourth. But by the third season of career one I had stopped reading the cards.

---

## The eight claims

### 1. The decision card floats in a large empty field at desktop and reads unfinished — **CONFIRMED, but cheap to fix and not what hurt**

At 1456px the card is 537px wide, centred, and ends around y=430 with ~400px of dead background
below it. The page never scrolls during play. It does read like a mobile layout that nobody laid out
for desktop.

**Cost to me as a player: low.** I noticed it in the first ten seconds and then stopped noticing. It
did not change a single decision. Real, but rank it below everything about legibility of state. The
narrow column itself is fine — it's a reading experience — it's the unused vertical space that reads
as unfinished, and that space is exactly where the missing season context would go.

### 2. You cannot tell where you are in the season or the career — **CONFIRMED, and worse than stated**

The header gives you a class badge (`FR`/`SO`/`JR`/`SR`) and a record. Both lie by omission:

- **The record never moves.** It reads `0-0` from Signing Day to the last card of the season. I went
  5-7 and the header said `0-0` the whole way.
- **The record intermittently vanishes.** Some screens show `Memphis FR Vance #7 0-0`, the very next
  shows `Memphis SO Vance #7` with no record at all. The header changes shape between cards.
- **The class badge flips mid-card.** The rollover FR→SO happened while I was looking at the outcome
  text of the *previous* season's final event. You are reading a sentence about the all-star game and
  the year silently becomes next year behind it.
- **There is no season position at all.** The game clearly has one — the skeleton is Season Opener →
  (event) → Rivalry Week → (event) → Bowl Season, every season, in that order. It knows. It never says.

**Cost: high.** This is what made the Redshirt and Declare choices unplayable as choices (see #4).

### 3. Hierarchy inside the card is flat — **PARTIAL, mostly REFUTED as stated**

Title/description/options are actually fine — the title is a large condensed display face, the
description is smaller and lighter, the options are boxed. That ladder reads.

The flatness is **between cards, not inside them**. A career-altering injury, a forced non-choice,
and a joke about being catfished all get identical treatment. The hierarchy problem is that there is
only one card design and every event in the game is poured into it.

### 4. Option buttons read as form fields rather than choices with stakes — **CONFIRMED**

They are grey-bordered rectangles with left-aligned regular-weight text at the same size as the
description. They look like radio rows. The tell: the **Continue** button — which does nothing,
carries no decision, and exists only to advance — is a solid gold filled button, while the actual
choice that changes your life is a grey outline. *The least consequential control on screen is the
most prominent one, on every single card.*

**Cost: medium-high.** Not because I mis-clicked, but because it drained the choices of ceremony. On
"Onside Kick" — the best-written card I saw, ninety seconds left, down eight — I was picking between
two form rows.

### 5. The summary is a uniform grey scroll after the one big draft number — **PARTIAL**

Refuted on content: the seasons block is the best screen in the game and the only place the career
becomes legible (per-season record, snaps, and position-correct stats — Pass Yds/TD/INT for the QB,
FG/Points for the kicker, Pancakes/Sacks Allowed for the lineman). I read it carefully all three times.

Confirmed on texture: after the gold `Round 5, Pick 18` everything is the same muted grey at roughly
two sizes, including the Honors line. "All-Conference" and "Bowl Win" — the only awards I earned all
session — are set smaller and quieter than the stat labels underneath them.

Also worth flagging: the primary gold button at the bottom is **Copy career**. **New career** — the
thing I actually wanted — is the ghost button next to it.

### 6. The moment emoji look cheap next to the rest of the type — **PARTIAL / low cost**

They are full-colour system emoji at ~18px against a refined condensed grotesque, so yes, a
different visual language. 📱 renders as a near-illegible glyph at that size.

But the emoji aren't the problem with that list — **repetition is**. My QB's eight moments were
🏆 Won the rivalry game, 📱 Got catfished handled it like a champ, 🏆 Carried the team through bowl
season, 🚗 speeding ticket, ☀️ bowl game, 🏆 Won the rivalry game, 📱 Weathered a catfishing saga,
🏆 Carried the team through bowl season. Three identical trophies, two catfishings, two rivalry wins.
It reads as an event log, not a highlight reel. And the moment I genuinely remembered — the onside
kick skipping a yard too far into the return man's hands — is not in the list at all.

### 7. Nothing marks a season ending; ~24 decisions arrive identically — **CONFIRMED, strongest finding of the session**

There is no season-end screen, no interstitial, no pause. The class badge changes inside the outcome
card of the last event and the record quietly disappears. I could not have told you where one season
ended and the next began without watching the two-letter badge.

Worse, the seasons are near-literal reruns. Career 1, season 2 gave me the same Season Opener
("ninety thousand people, a noon kickoff, and a cupcake opponent"), the same Rivalry Week ("your
ankle has been barking since Tuesday"), the same Bowl Season ("three weeks off, a gift suitcase"),
word for word. That ankle has now barked in six separate seasons across three different players.
**This is where I stopped reading and started clicking** — roughly decision 16, career 1.

Two structural consequences:

- **All-Star Game Invite closes every season, including freshman year.** Its whole fiction is "every
  scout in the building, your last impression before the draft." Getting it as a freshman, and again
  as a sophomore, retroactively made it mean nothing.
- **Redshirt? is offered every single year, unfiltered.** Career 3 offered it to a junior the game
  had just labelled "one of the best in the conference." In career 2 I took it — and then kept
  playing the same season, appeared in a game, and the summary credited me 9 snaps. The fiction and
  the mechanics disagree out loud.

### 8. One accent colour is doing every job at once — **CONFIRMED**

The same gold is: the jersey number on the start screen, the Start button, the quote bar on outcome
text, the Continue button, the draft position, and the Copy career button. There is no second colour
anywhere — no red for the injury, no green for the promotion, nothing for gain or loss.

**Cost: this is the mechanism behind the flat dynamic range.** With one accent and no semantic
colour, a −8 OVR catastrophe and a +1 OVR shrug are rendered identically. Rank this higher than its
"colour palette" framing suggests — it's not a taste problem, it's why nothing lands.

---

## The added question: did I actually want to know where I was?

Honestly: **not at the moment of the decision, and yes between them.**

At the moment of a normal card — the group chat, the podcast, the banquet — I did not want a
progress table. Those are character beats and I answered them as myself. A table would have been
furniture.

But there are exactly three cards where I wanted it badly and could not choose without it:

1. **Redshirt?** — sit a year, when I don't know how many I have.
2. **Declare for the Draft?** — "cash in now" against an unstated projection.
3. **Transfer Portal** — leave for "a bigger role" with no idea what role I have now.

For those three I did not want a progress bar, I wanted **the season line I was already owed**: my
record, my snaps, my stat line this year. The draft screen handed me all of it after the fact. That
is the actual ask — not a fixed-length career table, but *the current season's row, visible during
the season.* Report 002's permanent table would deliver that as a side effect, and the empty 400px
under the card is sitting there. But I'd frame the need as "show me the row I'm currently writing,"
not "show me how many rows are left."

The one thing I would have wanted a full table for is the **career-length** question, because
"Four years to get drafted" is on the title screen and then never referenced again. I finished career
1 as a senior having genuinely lost track of whether a fifth year existed.

---

## Did the three careers feel different? Mostly a costume, with a real body underneath

**Position is a costume during play and a real thing at the summary.**

- All three careers start at **exactly 60 overall, "in the rotation," "the staff trusts you."** A
  quarterback, a kicker and an offensive lineman are the same person on the first card.
- Position-specific events are rare and arrive late. QB got The Transfer QB (decision 2) and then
  nothing. Kicker got **Onside Kick at decision ~17** — the first and only kicker card I saw in that
  whole career. OL got New Line Coach and The Blindside, both in the second season.
- They are also the *best* cards in the game. Onside Kick and The Blindside were the two moments I
  leaned in for. The position deck is thin and it is carrying the experience.
- Cruelly, one of the OL cards — **New Line Coach** — has only one option. The position flavour
  showed up in a card with no decision in it.
- Generic cards land wrong on the wrong body. A kicker was offered "Skip the Install" (kickers do not
  attend the offensive install) and two schools where "the two-deep is thin" (a kicker's two-deep is
  a punter). A freshman third-string lineman was offered $40,000 NIL.
- **The summary knows the difference.** Pass Yds / Pass TD / INT vs FG / Points vs Pancakes / Sacks
  Allowed. That screen is position-aware in a way the whole rest of the game is not.

---

## Other things I hit that aren't on the list

**Single-option "decisions" cost two taps and explain nothing.** Season Opener, Fall Camp Battle,
Speeding Ticket in Georgia, Bowl Spotlight, New Line Coach. Worse, they have hidden effects: "Win the
job" — the only option — cost me 1 overall and showed me no outcome text at all. Forced, negative,
unexplained.

**The Continue beat is applied inconsistently.** "Play this season," "Stay at Memphis" and every
single-option card skip the outcome screen entirely and jump to the next decision. So the beat isn't
a rhythm, it's a coin flip. On the cards where it *does* fire, it earned its tap in season one — the
outcome sentences are good and I wanted to read them. By season three it was a speed bump, but I'd
blame that on the repeated events, not on the beat itself. **Do not cut Continue; cut the repeats.**
It would also earn its keep instantly if it showed me what changed — right now it is the one screen
whose whole job is "here is what happened" and it does not tell you what happened.

**The biggest choices get the least ceremony.** Transferring from Memphis to App State, and later
from Ohio to Missouri — leaving a school, an enormous thing — produced no outcome card, no
acknowledgement, nothing. The header word just changes. Meanwhile the podcast invitation got a full
card and a Continue.

**The ending number does not track the felt career.** My 78-overall lineman who was "one of the best
in the conference" at Missouri went #154. My 72-overall quarterback who was merely "a week-one
starter" went #146 — higher. There's presumably a positional-value model behind that and it's
probably correct, but the game lets you finish your best career feeling shortchanged with no
explanation offered.

**Character is ignorable, not subtle.** Two data points. "Laugh it off publicly" returned the outcome
text *"Fans love the good sport. Character intact."* — and the character phrase did not change. And
across three full careers the phrase moved exactly twice, both times from "the staff trusts you" to
"just a guy in the building," both times silently. I never once chose an option because of it. The
role phrase ("in the rotation" → "a week-one starter" → "one of the best in the conference") is
doing real work and *feels* meaningful; the character phrase sits directly under it in the same grey
and coasts on that adjacency without earning it.

**What I did not want:** a stat block at Signing Day. Committing blind was fine — it's the one place
the opacity felt like a real recruiting decision rather than missing information, and Ohio/Youngstown
State showing up for an Ohio kid was a nice quiet signal that something is modelled underneath. Leave
it alone.

---

## Where I got bored, confused, or lost

- **Bored:** decision ~16, career 1, the moment Season Opener repeated verbatim in season two.
  Everything after that I skimmed. Career 3 re-engaged me only because Missouri and the OL cards were
  new.
- **Confused:** the record. I spent the whole first career assuming `0-0` meant the game didn't track
  wins, then found three full season records on the draft screen.
- **Lost:** every FR→SO→JR rollover, all six of them, all invisible.
- **Arbitrary:** Redshirt?, Declare for the Draft?, and Signing Day when two of three schools carried
  the identical "the two-deep is thin" tag. Notable contrast — the Transfer Portal in career 3 offered
  "bigger role" *and* "tougher competition," which named the axis and made it a genuine decision. The
  game already knows how to annotate an option; it does it in one place out of four.

## What made me want to play again / stop

**Again:** the writing, when it's fresh. The Team Banquet, Onside Kick, The Carousel Comes for Your
Staff, Saturday Night Everybody Watching. Also the draft screen — seeing "Pancakes 37, Sacks Allowed
13" made me want to run a lineman who never transfers and see what the number does.

**Stop:** the ankle barking for the sixth time. Once you can predict the season skeleton, a career is
four laps of the same track with two or three new cards sprinkled in.

## If I ranked these

1. Surface the season state during the season (record/snaps/stats) — the data already exists and the
   header is currently lying.
2. Give consequence a visual voice — an injury must not look like a speeding ticket. Needs a second
   colour and a delta on the Continue card.
3. Mark the season boundary, and gate the season-specific events (All-Star, Redshirt, Declare) so they
   stop firing in nonsense years.
4. More position content, and never put position flavour in a single-option card.
5. Flip Continue and the options in visual weight; fix the Copy/New career button priority.
6. Fill the desktop dead space (which #1 largely does anyway).
7. Moments list — dedupe before restyling the emoji.
