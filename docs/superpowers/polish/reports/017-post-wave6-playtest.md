# 017 — Playtest after wave 6 (the ledger, and the ending's range)

**Type:** playtester report · **Wave:** 7 · **Date:** 2026-09-13
**Careers:** 3 — Quarterback (38 decisions), Kicker (33), Offensive line (18, deliberately bad)
**Played at:** 1456×757–813 CSS px. Content column ~480px wide, centred, with the ledger rail to its
right; roughly the right third and the bottom half of the window were empty dark green on every
screen. Not cramped — the opposite. The page never felt like it was using the room it had.

---

## The headline metric: do I want to play again right now?

**After career 1 (QB, Round 2 Pick 12):**
> *Yes — but specifically because I want a different position, not because I want more of this.
> Nothing about Marchetti feels unfinished. What's pulling me is a question — "is the kicker a
> different game or the same game in a different hat" — and by season four I was clicking Continue
> on card bodies I hadn't read.*

**After career 2 (Kicker, Round 3 Pick 21):**
> *No. I finished the kicker because I said I would. The kicker-specific cards are the best writing
> in this thing and they'd have got a yes out of me after season two — but I read "Your ankle has
> been barking since Tuesday" for the seventh time in season five and I stopped being a person
> reading a story and became a person clearing a queue.*

**After career 3 (OL, Round 7 Pick 1, played to lose):**
> *No. And it's a harder no than career 2's, because the tank run answered the only question I had
> left. I wanted to find out what the floor looked like and the floor is a gold headline, two
> trophies and a sunshine emoji.*

Where that lands versus the previous playtester (*yes → reluctantly yes → no*): **the curve did not
move.** Mine is *yes → no → no*, which is if anything slightly worse, and for the same reason both
times — repetition, not the new work. **The wave-6 work is not what's losing me. The ledger and the
ending are both better than what they replaced and neither one is the reason I stopped.**

---

## Where I got bored, confused, or lost

**Boredom, precisely located.** Career 1, decision 12: "Season Opener / Ninety thousand people, a
noon kickoff, and a cupcake opponent nobody will forgive you for losing to" arrived word for word
for the second time. Career 1, decision 14: "Rivalry Week / Your ankle has been barking since
Tuesday," second time. **The moment I stopped reading card bodies was career 1, decisions 21–22** —
I had just transferred from UTSA to Baylor, and the first two cards at my brand-new Power-conference
school were "Fall Camp Battle / the pencil becomes ink" and "The Captain Vote," both verbatim
repeats, both about a building I had been in for zero days. From there to the end of three careers I
read titles and option labels and skipped bodies unless the title was new.

That is **earlier than the last playtester's career 3. It happened to me in career 1.**

By career 3 the skimming had generalised exactly the way the brief feared: I was skipping bodies on
brand-new cards too. "Somebody Rolls Up On You" — the best-written injury card in the game, and the
one that cost me 8 OVR — I read the title, read the two options, clicked, and only learned what
happened because I went back and looked at the text afterwards.

**Confusion.** One real moment: career 1 decision 24, my OVR dropped 79→74 and my role went from
"one of the best in the conference" to "a week-one starter," and I had no idea why, because I had
auto-continued past the resolution. Nothing on the persistent screen says *you are hurt* or *you
just lost five points.* The standing block shows the new state as if it had always been that way.

**Lost.** Almost never — see career length below. The one place I genuinely did not know where I was
was career 2, season 5, which is covered under claim 1.

---

## Did I know where I was?

**Yes, and this is the clearest win of the wave.** `SEASON 3 · JR` in the header plus the
highlighted ledger row is unambiguous. At no point in three careers did I have to guess which year
it was. This is a real improvement and it cost me nothing to read.

**Career length: the ledger tells you the shape, but nothing tells you the end is coming.** I always
knew *which* year. I never knew *whether this was the last one* — career 1 ended after season 4 with
no warning, on a resolution Continue that turned out to be the last click. A "last chance" or "final
season" signal is missing.

---

## Claims

### 1. The career ledger — CONFIRMED (used it), and the dashed row is REFUTED

**Did I use it?** Yes, genuinely, three times, and all three were the same kind of decision:

- Career 1, "Declare for the Draft?" as a junior: the rail read `65 / 75 / —`. Rising. I returned to
  school because of the shape of that column.
- Career 1, season 4: the rail read `65 / 75 / 74`. I had *transferred up* to Baylor and gone
  **down**. That is the only place in the game that fact exists, and it changed how I played the
  rest of the career (I stopped taking the "play through it" gamble).
- Career 2, "Declare?" as a senior: `58 / 67 / 64 / —`. I was going backwards at 65 OVR from Coastal
  Carolina. I returned to school specifically because of that column.

**It did not become wallpaper.** It became the thing I looked at on exactly the screens where the
game asks me a career-shaped question, which is the right amount. Cost: near zero — it sits in dead
space that was empty before.

**What I thought the dashed fifth row meant, before being told:** *"There is a fifth season
available, but it's conditional — I only get it if I redshirt."* Roughly right, arrived at from the
dashed rule reading as "not really part of the plan" plus the caption.

**And then I tested it, and the mechanic described in the brief does not exist as described.**
Career 2, season 2: I took the redshirt. It paid **+10 OVR**, the single biggest swing in the game.
And:

- The YEAR 5 row **did not change.** Still dashed, still captioned *redshirt year*, identical.
- The YEAR 2 row filled in as `67 overall / SO Toledo / 4-8`, **indistinguishable from a played
  season.** Nothing anywhere in the game records that I sat that year.
- The row that eventually changed was YEAR 5 itself, and only when I *arrived* in season 5 — the
  caption vanished and it became `SR Pittsburgh`. That is keyed to reaching year 5, not to
  redshirting.
- Worse: during the whole of season 5's offseason, the header read `SEASON 5` while the YEAR 5 row
  was still dashed, still said *redshirt year*, and was **not highlighted as the current year.** For
  three decisions the rail and the header disagreed about what year it was. That is the one place I
  was genuinely lost.

So the dashed row is a decent guess-prompt and a broken promise: it advertises a conditional fifth
year, I met the condition, and the rail never acknowledged it.

Two more ledger notes:
- The redshirt season's stat line is nonsense and it is permanent: `7 snaps · FG -1 · Points 3`.
  **Negative field goals**, printed in the rail and again on the career summary screen.
- The word "overall" under each ledger number is in the DOM but invisible on screen. Not a problem —
  the number reads fine as an OVR without it — but worth knowing it isn't doing any work.

### 2. Career length — PARTIAL

I always knew which year I was in. The **title screen's "Four years to get drafted" and the ledger's
five rows do disagree**, and I noticed it inside ten seconds of my first decision screen: the game
had just told me four and was now showing me five. The dashed rule mostly resolved it ("the fifth is
special"), so it read as a deliberate tease rather than a bug — but it is the first thing in the
game and it contradicts the second thing in the game.

Career 2 then ran five seasons with the class label stuck on **`SR` for both year 4 and year 5**,
which made the last season feel like a glitch rather than a fifth-year victory lap.

### 3. The standing block — CONFIRMED

It reads as two different things about me. The big number is visibly welded to the top phrase; the
rule and the indent make the second phrase clearly a separate claim. I never once read it as one
sentence arguing with itself. This is fixed.

**But the second line is now visibly broken in a way the old single-sentence version hid.** In
career 1 the locker-room phrase read `just a guy in the building` for **33 consecutive decisions**,
across two schools, three seasons, and this list of choices I made specifically to move it: stayed
on campus to train, sat the install meeting instead of doing a podcast, coached up a true freshman
("The staff notices who did that"), campaigned for captain and backed it up, and held the entire
locker room together through a coaching change ("the interim notices, and so does everyone above
him"). It ended the career reading `All-America caliber / just a guy in the building` while the
summary screen handed me All-American honours.

The wave-6 change made the two lines legible as two claims. It did not make the second claim true.

### 4. Character — PARTIAL, leaning REFUTED

**Did I notice it change?** Yes, four times in three careers. **Did I ever understand why?** Once.

- Career 1, decision 3: `the staff trusts you` → `just a guy in the building`, with no preceding
  choice of mine. Then frozen for 33 decisions.
- Career 2, after "Bowl Season → Treat it like a playoff game" (the *diligent* option):
  `the staff trusts you` → `just a guy in the building`. It went **down** for doing the work.
- Career 3, after "The Watch List → Put the graphic up": `the staff trusts you` →
  `just a guy in the building`. **This one I understood immediately** and it felt great — I posted
  the graphic, I got read as a guy who posts graphics.

**Did I ever choose differently because of it?** Yes, once: career 1 decision 4, I skipped the
podcast to be in the install room *specifically* to shift that line. The resolution was "You get the
install cold. The podcast books someone else," nothing moved, and I never tried to steer it again.
That is the whole lifecycle of the feature in one career: I engaged with it, it ignored me, I
stopped.

Making it a phrase and bumping the size is right. The problem is upstream: two of the three moves I
saw were unexplained, one was backwards, and it is far more often frozen than moving.

### 5. The ending's range — PARTIAL, and the part you just called is the part that fails

The three headlines I got:

| Career | Headline | At a glance |
|---|---|---|
| 1 (QB) | **Round 2, Pick 12** | bright gold, large display |
| 2 (K) | **Round 3, Pick 21** | bright gold, large display |
| 3 (OL) | **Round 7, Pick 1** | visibly smaller, and to my eye a duller, more olive gold |

**Could I rank two drafted endings at a glance, without reading the round and pick numbers?**

- **Round 2 vs Round 3: no.** Side by side those two headlines are the same size, the same weight
  and the same colour. If you covered the digits I could not tell you which career went better.
- **Round 3 vs Round 7: yes, easily.** Round 7 is smaller and noticeably less bright. I could rank
  those without reading.

So the loudness scale exists but is far too coarse: it distinguishes *good* from *bad* and does not
distinguish *good* from *slightly better*. Since the space where most careers land is rounds 1–4, it
is not working where it needs to.

One thing to check against your own intent: **"Round 7, Pick 1" did not look the same colour to me
as "Round 3, Pick 21."** It read as duller and more muted. If the call was "same colour at every
level," either that isn't what's rendering, or the size drop is reading to me as a colour drop. Worth
verifying, because the dimming is the half that's actually working.

### 6. A bad ending — REFUTED. It reads as congratulatory.

I tanked it on purpose: no extra work, posted the watch-list graphic, ducked the install meeting for
a podcast, played through the ankle, got rolled up on and refused the trainer, took the vacation
option at both bowls, transferred *down* to Mercer, and declared after two seasons at 61 OVR off a
2-10 team.

Named elements that read as congratulatory:

1. **`Round 7, Pick 1`** — the largest, brightest, gold-display element on the page, in the same
   typeface and colour family as a second-rounder's. It is a headline. It announces an achievement.
   Being smaller than career 2's is not the same as reading as bad.
2. **The MOMENTS reel** — the whole thing, verbatim:
   > 🏆 Won the rivalry game
   > ☀️ Had the time of his life at a bowl game
   > 🏆 Won the rivalry game
   > ☀️ Had the time of his life at a bowl game

   Two trophies and two sunbursts. **"Had the time of his life at a bowl game" is the game giving me
   a warm memory for the exact choice I made to sabotage myself** — I picked "Enjoy the trip" to
   waste the season and it went into my keepsake as a highlight. That is the single most
   congratulatory thing on the screen and it is the part a player would screenshot.
   (Also: "his," third person, on a screen that is second person everywhere else.)
3. Absence, not commission: nothing anywhere says *this went badly.*

**The one element that did notice:** `ACROSS 2 SEASONS · 63 → 59 · −4`, and the `−4` on the Mercer
row. That is the only honest sentence on the page, and it is set in the smallest, dimmest type
available, three screens above the giant gold headline. The hierarchy is exactly inverted.

Also honest by omission: **no HONORS block at all** on the bad career. Good. But careers 2 *and* 3
both had no honours block, so its absence doesn't mark failure — it just means you didn't win one.

### 7. `Also earned` — CANNOT CONFIRM, I never saw that heading

In three careers I never got a row headed "Also earned." What I got was career 1: a `HONORS` heading,
then **All-American** as gold text in a filled box with a gold left rule, then **Bowl Win** as a
small grey outlined chip directly underneath with **no heading of its own.** Careers 2 and 3 had no
honours section at all.

On what I did see: the unlabelled chip does read as a demotion — the gap between a filled gold box
and a grey outline chip is large, and with nothing naming the second tier it reads as "and this
lesser thing." A heading like *Also earned* would probably fix exactly that by giving the chip a job.
Worth noting Bowl Win was a genuinely nice thing to have won and it looked like a leftover.

### 8. Two overall numbers — NOTICED, and it did **not** read as a mistake, for a reason you should
probably not rely on

I noticed on all three end screens (87 vs 85, 90 vs 88, 61 vs 59).

It did not read as a contradiction — **because the ledger had trained me on it for four seasons
first.** Mid-career, the rail row and the header number are routinely two apart (rail says 65, header
says 67) and I had already built the model "the row is the season snapshot, the big number is now."
By the time I reached the end screen the gap was a confirmation of a rule I'd already learned, not a
discrepancy.

Which means the end screen is being carried by a side effect of the rail. A player who reaches the
draft screen without having stared at the rail would see `61 FINAL OVERALL` two inches above a table
whose last row says `59`, and I think they'd call it a bug.

Related and more annoying: **the offseason lump is invisible.** Career 1, "Stay at Baylor" took me
75 → 82 with **no resolution screen and no delta shown at all** — the biggest single jump in the
career happened in the gap between two clicks. Career 2, "Stay at Coastal Carolina" did 65 → 72 the
same way. Structural choices (Redshirt "Play this season", Transfer, Declare) mostly produce **no
resolution screen whatsoever** — you click and the next card is just there, at a different school,
with a different number. Transferring from UTSA to Baylor — the most dramatic thing that happened to
Marchetti — was acknowledged by one word changing in the header.

(The one exception is *taking* the redshirt, which does get a resolution and a very loud `+10 OVR`.
So the machinery exists; it's just not wired to the other three.)

### 9. The small print — PARTIAL

**On the end screen: yes, it works.** `Pancakes 27 · Sacks Allowed 8` sits a clear step behind
`6-6 · 525 snaps`, and both sit behind the school name. Three tiers, legible at a normal glance.

**In the decision-screen header: no.** These two rows read to me as one flat block of grey:

```
Brumfield #7        Offseason
525 snaps    27 Pancakes  8 Sacks Allowed
```

I never distinguished them, and I never read the stat line on purpose in three careers — I only
looked at it when hunting for the negative-FG bug. The "You chose: X" line on a resolved card *does*
recede correctly (the whole card dims and the outcome sentence stays bright), and that's a nice
effect.

### 10. Hard to read / cut off / overflowing / colliding

Nothing overflowed, collided, or clipped at 1456px. Exact text problems found:

1. **`FG -1`** — negative field goals. Header stat line, career 2 season 2 (`7 snaps · FG -1 ·
   Points 3`), the ledger row, and permanently on the career summary. Caused by taking the redshirt.
2. **`1 Game-Winners`** — plural on a count of one. Career 2, seasons 3 and 4, header stat line.
3. **`Had the time of his life at a bowl game`** — third person in a second-person game. Moments
   reel, career 3.
4. Not a rendering fault but a collision of fiction: **`Ninety thousand people, a noon kickoff`**
   fired for me at **Mercer**, an FCS school. The universal cards don't know what division they're
   in.
5. **Year-4 and year-5 both labelled `SR`** in the header and the ledger, career 2.

---

## Repetition — I am the data point you asked for

Cards I saw more than once across three careers: Season Opener **×10**, Rivalry Week **×7**, Bowl
Season **×5**, The Captain Vote **×5**, Fall Camp Battle **×4**, Fifteen Extra Practices ×3,
Redshirt? ×4, Transfer Portal ×5, Declare? ×4, The Carousel ×3, The Group Chat ×2, The Team Banquet
×2, The Two-Minute Drill ×2, The Wind at Home ×2.

First word-for-word repeat: **career 1, decision 12.** Exactly as predicted.

**When did I start skimming everything?** Career 1, around decision 21. Not career 3. And the cost is
larger than "the repeated cards are dull," for three reasons I can name:

- **Season Opener and Fall Camp Battle are no-choice cards.** They're pure text with a Continue
  button. A repeated card that at least asks me something still needs me awake. A repeated card
  that only asks me to click is a training exercise in not reading.
- **The repeats cluster at the exact points that should be beats.** The three cards immediately
  after a transfer were, twice, all repeats — so arriving at a new school (the most dramatic thing
  the game can do to you) is delivered as three cards I'd already read.
- **Even the good position cards repeat**, and when they do they break continuity. "The Wind at
  Home" — my two-year theory about *my own stadium's* upper deck — fired at Pittsburgh one card
  after I transferred there.

And the repetition follows you into the keepsake. Career 1's Moments reel printed **"Carried the
team through bowl season" three times** and "Won the rivalry game" twice, out of six entries. Career
3's four entries are two lines repeated. The Moments reel is the single best thing on the end screen
and it is currently a repetition log with emoji.

---

## Could I lose? — No, and here's when I worked it out

The tank run had two genuine scares and I want to be fair about them: **"Somebody Rolls Up On You" →
"Get up and finish the drive" → `−8 OVR`** is the hardest hit in the game and it felt like a real
consequence. "Play through it" cost me 5 twice more. **So the game can hurt you.** For about four
decisions in career 3 I thought I might actually be sinking.

Then I noticed the shape of it. Playing badly is *rate-limited*, not *directional*:

- **The lazy option is frequently rewarded.** "Skip the Install → Do the podcast, catch the install
  later" — ducking a team meeting for press — paid **+1 OVR**. In career 1 I chose the disciplined
  option on the same card and got **nothing**.
- "Play like it is a Tuesday practice" (the non-committal option) paid +1.
- "Use the three weeks to get healthy" (the coast option) paid +1.
- The offseason hands out ~+5 regardless of what you did.

So my deliberately-terrible lineman went **60 → 65 → 61** and ended a two-season, 2-10, FCS-transfer,
refused-the-trainer career at **Round 7, Pick 1** — 193rd overall, which is a real NFL player.

**The point where I knew failure was off the table was the "Declare for the Draft?" card in season 3
of career 3** — not because of anything it said, but because of what it didn't. It gave me no
projection, no "you would go undrafted," no warning. The game was willing to let a 61-overall
lineman from Mercer declare after two seasons with no comment. At that moment I understood there was
no losing state, only a slower version of the winning one.

Related: **that card is also the most arbitrary choice in the game.** "Declare for the NFL Draft /
Return to school" is the single most consequential decision available and it carries **zero
information** about what declaring now would get you. Choosing it is a coin flip dressed as a
decision.

---

## Did the three careers feel different?

**Partly, and the split is clean.**

**In-season position cards are excellent and carry the whole difference.** Kicker got The Chip Shot,
Kickoff Duties Too, Onside Kick, The Long Attempt, The Wind at Home, Iced. Those six cards are the
best writing in the game and they made Okonkwo feel like a kicker in a way no stat line could. QB got
The Silent Count and The Two-Minute Drill. Offensive line got "Somebody Rolls Up On You," which is
the best injury card here. Stat lines are properly positional too (`Pass Yds / Pass TD / INT` vs
`FG / Points / Game-Winners` vs `Pancakes / Sacks Allowed`).

**Everything structural is a costume.** All three careers open at OVR 60, "in the rotation," "the
staff trusts you" — a kicker and a left tackle are the same person on decision zero, and "in the
rotation" isn't even a thing kickers are in. The offseason block (Redshirt / Declare / Transfer /
Fall Camp Battle / Captain Vote) is identical for all six positions. My kicker "took every rep like
it was the last one and the pencil became ink" to win a job. My kicker was voted team captain — in
his redshirt year. My kicker ranted about the coordinator's play calls in a group chat.

The rough ratio in my three careers: about one card in four was position-specific, and those were
the only cards I was still reading by career 3.

**The one thing that made the three careers genuinely feel like different lives was the ledger** —
`65/75/74/85` versus `58/67/64/75/88` versus `63/59` are three different stories, and they're three
different stories you can see in one glance. That is the wave's best work.

---

## What made me want to play again / stop

**Play again:** the kicker cards, specifically Onside Kick and The Wind at Home. Wanting a different
shaped column in the ledger. Curiosity about what the floor looked like.

**Stop:** the seventh barking ankle. Being handed the same three cards on arrival at a new school.
Realising I could not lose. The Moments reel printing the same sentence three times.

**The single change I'd make:** the three cards after a transfer or a redshirt should be about the
transfer or the redshirt. Right now the two biggest things that can happen to a career are delivered
as a one-word header change followed by reruns, and they're also the two places where the game has
already earned a beat.
