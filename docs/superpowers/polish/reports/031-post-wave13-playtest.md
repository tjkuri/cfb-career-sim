# 031 — Playtest report: after waves 11, 12, 13

**Playtester session.** Viewport: **1456 × 757 CSS px** (the harness did NOT pin me narrow this time —
`window.innerWidth` reported 1456. Read every layout answer below as a **wide-desktop** answer, not a
narrow one). Chrome, localhost:5173, localStorage cleared before career 1 and between careers.

---

## Career 1 — Ramsey #7, Quarterback (TX)

North Texas → Memphis → SMU. 4 seasons. **Round 4, Pick 29 (#125 overall), final OVR 82.**
~48 decisions (well above the stated median of 24).

### "Do I want to play again right now?"

> **Yes.** What is pulling me: I want to know whether a different position actually plays
> differently, and whether the draft number is something I can move. What is pulling against:
> by season 3 I had figured out the offseason is the same three cards every year, and I stopped
> believing my choices were the thing moving the number.

### Skimming onset (question C)

1. **Decision 15.** Exactly the same number the last playtester reported.
2. **The card was a repeat: "Rivalry Week"** — word for word identical to decision 5, including
   *"Your ankle has been barking since Tuesday."* I read the title, recognised it, and went straight
   to the buttons without reading the body.
3. **A specific moment, not gradual.** It was the instant the title rendered. After that it
   generalised fast: by decision 21 I was skipping the body of *every* offseason card because the
   offseason is a fixed sequence (Redshirt? → Declare? → Transfer Portal) that fires every single year.
4. **Two things pulled me back into reading properly:**
   - Decision 15's outcome: *"The ankle goes on the second series and you watch the rest in a boot."*
     **−5 OVR**, followed by **"The OVR comes back when the injury heals."** That last line is the
     only time the game explained a mechanic to me, and it made me read the next several cards
     carefully to see if it was telling the truth.
   - Decision 27, **"Up Forty at Halftime"** — a brand-new card with a real situation
     (*"the twos are taking the reps you would have had"*). New, specific, and it had a genuine
     dilemma in it. I read every word.

### Question B — does the card's number agree with its words?

**B1 — sentences contradicted by their number. These are the ones I found:**

- **The biggest one. Decision 23, "Transfer Portal", "You chose: Stay at Memphis".** The entire
  outcome body was, verbatim and complete:

  > You chose: Stay at Memphis
  >
  > **+5 OVR**
  > Overall up 5, now 69.

  **There is no sentence at all.** Just a choice echo and the largest single gain of the whole
  career. This is exactly question B5. And it is worse than "missing prose": I am fairly sure that
  +5 was the injury-heal refund the game promised me eight decisions earlier ("The OVR comes back
  when the injury heals"), which then landed on an unrelated card. As a player, what I read was
  *"staying at Memphis was worth +5"* — which is not true.
- **The same thing happened again at decision 37.** "Transfer up to SMU (tougher competition)" →
  a transfer graphic, then **+5 OVR, now 72**, again immediately after an injury. Two for two: the
  injury refund silently attaches itself to whatever card happens to be on screen. This **refutes**
  the premise that "a card accounts for what it did" — twice, on the two largest numbers I saw.
- **Decision 31, "Somebody Rolls Up On You" → "Wave for the trainer":**
  > Sprain, not a tear. They shut you down early and **you keep the rest of the season.** — **−5 OVR**

  The sentence contradicts *itself* ("shut you down early" / "you keep the rest of the season"), and
  the reassuring half of it is paired with the biggest penalty in the game. Also: the cautious
  option here cost exactly the same −5 as recklessly playing through an injury did at decision 15.
- **Scale mismatch, decision 41, "Audible Authority" → "Take command at the line":**
  > You diagnose the front before the snap and **the offense hums all afternoon.** — **+1 OVR**

  The single most quarterback-specific card in the game, played perfectly, is worth **half** of
  showing up to bowl practice (+2). The prose promises a lot more than the number delivers.

**B2 — the two-part split: clarifying or clutter?** Mostly **clutter, and occasionally actively
confusing.** The worst instance, decision 11, "The MRI Comes Back" → "Attack the rehab":

> THIS CARD **−2 OVR** · This card: overall down 2.
> EVERYTHING ELSE **+2 OVR** · Everything else: overall up 2, now 67.

Four lines of reporting to tell me my rating did not move. I understood the arithmetic instantly;
what I never understood, in any of the six or seven splits I saw, was **what "everything else"
actually was.** Nothing else happened on that screen. No other event was named. It is a number with
a label that gestures at causes the game never shows me. I started skipping the EVERYTHING ELSE
block entirely by season 3 and only read the "now NN" at the end of it.

Separately, single-number outcomes are redundant: **"+3 OVR"** followed immediately by
**"Overall up 3, now 63."** says the same thing twice, one line apart, every single time.

**B3 — did I learn what an option cost me in something other than the rating?** Partly, and then it
broke. The game has a second currency it calls the locker room, and the *first* time it moved it was
genuinely great: decision 6, "Go get the moment" → *"Cost you in the locker room"*, and the header
line changed from **"the staff trusts you"** to **"just a guy in the building."** I felt that.

**Then it froze for the remaining 42 decisions.** The game told me *"Earned you credit in the locker
room"* at decision 28 ("Coach up the freshman behind you") and again at decision 48 ("Be the first
one on your feet") and told me *"Cost you in the locker room"* at decisions 12 and 30 — and the
label read **"just a guy in the building"** on every single one of those screens, before and after.
By the end I read "Earned you credit in the locker room" as flavour text, not as a consequence.

**B4 — same choice, different result?** Yes, and it read cleanly as **the dice, not a lie.**
"Rivalry Week" → "Play through it" gave me **+2** at decision 5 (*"You go the whole way and they
storm the field"*) and **−5** at decision 15 (*"The ankle goes on the second series"*). It worked
because the game **named the mechanism** in the prose. This is the model for how the rest of it
should read.

**B5 — a number with no sentence:** yes, see the "Stay at Memphis / +5 OVR" case above. That was the
single most jarring screen of the career.

### Claims

1. **Season table — CONFIRMED as wallpaper, with one exception.** I looked at it on purpose exactly
   once: at the season-4 "Transfer Portal" card, to check whether Memphis had actually been better
   for me than North Texas before deciding whether to move up to SMU. The delta column (`+3`, `+15`)
   is the only part I ever used. For the first two seasons it is mostly blank rows labelled YEAR 1–5,
   which read as an empty scaffold rather than information.
   **A real bug here: the table and the header disagree on the same screen.** At the end of season 1
   the table said `63 overall` while the header said `65`. Same for season 3: table `66`, header `67`.
   The table is labelled "OVR AT SEASON'S END", so I could not tell which of the two numbers was my
   actual rating.
2. **Did I know where I was — PARTIAL.** Season number, class year and phase (OFFSEASON /
   NON-CONFERENCE / CONFERENCE PLAY / POSTSEASON) were always clear. **How much was left was not.**
   The table shows five YEAR rows, I had "one season of eligibility remains" and chose "Return to
   school" — and then the career simply **ended after season 4 with the YEAR 5 row still empty and no
   card asking me anything.** I did not get a last season and nobody told me why. That is the one
   place I genuinely lost track, and it was at the ending.
   Also: the header stat line does not say *which* season's stats it is showing. In the season-2
   offseason it still read `3-9 · 456 snaps · 964 Pass Yds` — last year's numbers, unlabelled.
3. **Declaring early — deferred to career 3.** Recorded here for comparison: the card reads
   *"You're draft-eligible. **Cash in now**, or return for another season? Two seasons of eligibility
   remain."* There is **no risk language anywhere in it.** "Cash in" is upside framing.
4. **Ending screen — PARTIAL.** `Round 4, Pick 29` is set huge in gold and is instantly rankable,
   so a glance comparison would work. But the treatment is **celebratory regardless of content**:
   a fourth-round quarterback is a fringe pro, and it is rendered in the same trophy-gold display
   type that a first-overall pick would get. Deferring the full answer until I have a bad ending.
5. **Moments reel repeats — CONFIRMED, badly.**
   > 🏆 **Carried the team through bowl season** — printed **three times** (Season 1, Season 3,
   > Season 4).
   > 🏆 **Won the rivalry game** — printed **twice** (Season 1, Season 4).
   Four of my nine career moments were duplicates of each other. The reel is supposed to be the
   highlight of the ending and it reads like a log with the duplicates left in.
6. **Position — costume, almost entirely.** Across 48 decisions, exactly **one** card was about
   being a quarterback: **"Audible Authority"** at decision 41, in the fourth season. Everything
   else — Rivalry Week, Bowl Season, NIL, tickets, the portal, the banquet, the MRI — would read
   identically for any position. The only other QB signal is the stat line
   (`Pass Yds / Pass TD / INT Thrown`). **The offseason in particular was 100% position-neutral.**
7. **Status vs. the rest of the screen — REFUTED (they disagree constantly).** Quotes:
   - **Before I had committed to a school**, at decision 1, with the header reading `Uncommitted` and
     `0 snaps`, the status line already said **"ON THE FIELD / in the rotation"** and **"IN THE
     LOCKER ROOM / the staff trusts you."** I had not signed anywhere yet.
   - Immediately after *"The ankle goes on the second series and you watch the rest in a boot"*, the
     header still read **"ON THE FIELD / in the rotation."** It stayed that way for the rest of the
     season I spent in a boot.
   - "Fall Camp Battle" → *"the pencil becomes ink"* (i.e. I won the starting job). Header still
     **"in the rotation."** It did not change to "a week-one starter" until two cards later, for
     unrelated reasons.
   - Season 3 opener, **"Your Team Now"**: *"The young guys watch how you take the field now."*
     Header at that exact moment: **"IN THE LOCKER ROOM / just a guy in the building."**
   - By season 4 I was **"one of the best in the conference"** on the field and still **"just a guy
     in the building"** in the locker room. The two halves of the header told two different stories
     for three straight seasons.
8. **Nothing cut off, overflowing or colliding.** Type is clean and legible throughout at this width.
9. **The empty room — the card floats, badly, at 1456px.** The decision column is about **500px
   wide** and the season table another ~440px, both pushed into the middle; there is roughly 300px
   of dead background on the left and the right, and the entire bottom **two-thirds** of the page is
   empty below the card. On the decision screen the card occupies maybe **a fifth** of the visible
   area. The ending screen is worse — a single ~500px column of content in a 1456px window.
   **This is a wide-width answer**, since the harness did not pin me narrow.

### Other things I noticed, as a player

- **Cards in the same phase contradict each other.** In the season-2 postseason I chose "Enjoy the
  trip" on Bowl Season (*"The game is a blur"*), and the very next card was **"Fifteen Extra
  Practices"** asking me to treat bowl prep as a second spring ball — which I then "won", and was
  told *"You show up to the bowl game feeling better than you have since September."* I had already
  played the bowl game. Same in season 4: **"Senior Day"** (*"Last time you run out of this tunnel"*)
  was followed by **"Saturday Night, Everybody Watching"**, another regular-season game.
- **Bowl Season fired after a 3-9 season.** Three-win teams do not go to bowls, and the 3-9 record
  was only revealed to me *after* the bowl card.
- **Injuries arrive off-screen.** "The MRI Comes Back" opened with a doctor closing the door, but no
  card had told me I was hurt. The MRI was the first I heard of it.
- **The transfer pool does not remember where I came from.** In season 3 it offered me
  *"Transfer to North Texas — the two-deep is thin (bigger role)"* — back to the 3-9 team I had left
  the year before, framed as a step up.
- **The safe/smart choices report nothing at all.** "Skip the podcast, be in the room", "Have someone
  read it first", "Just give them to your actual family" — three well-written cards where making the
  correct decision produced a sentence and **zero** feedback of any kind. Choosing well feels
  weightless.
- **"Take care of business" and "Win the job" are not decisions.** Several cards present a single
  button with the outcome already written. They look exactly like real choices.
- **The redshirt card is offered every single offseason** — seasons 2, 3 and 4, identical text,
  including as a senior. Being offered a "gamble on your future" three years running strips it of
  weight.
- **Two of three Signing Day options had the same descriptor** ("the two-deep is thin"). With no
  other information about any school, decision 1 was pure coin-flip. That is the most arbitrary
  choice in the game and it is the first thing you do.
- **Copy repeats within one screen-pair:** "Bowl Season" says *"a city you have never been to"* and
  the very next card, "Bowl Trip Curfew", opens *"Bowl week in a city you have never been to."*
- **Across 2 seasons, 63 → 63.** The game printed that itself, and it was the most demotivating thing
  I read. Twenty decisions of careful play produced no movement at all, and the game said so out loud.

---

## Career 2 — Boone #7, Offensive line (TX) · **redshirt taken on purpose**

Toledo → Louisville. **5 seasons.** **Round 1, Pick 32 (#32 overall), final OVR 92.**
All-American + All-Conference. ~55 decisions.

### "Do I want to play again right now?"

> **No.** By the middle of this one I was no longer playing, I was auditing. The pull to start
> career 3 is entirely *"I want to see what declaring early does"* — that is a curiosity about the
> system, not a desire to play. What is pushing me away: I had now seen "Rivalry Week" for the
> eighth time and it still opens *"Your ankle has been barking since Tuesday"* whether my ankle is
> fine, in a boot, or attached to the best player in the country.

### Skimming onset (question C)

1. **Decision 1.** Exactly as predicted: "Signing Day" is the identical card with the identical
   options, and I clicked a school without reading. It was confirmed at decision 3 ("The First One",
   verbatim from career 1) and decision 6 ("Rivalry Week").
2. **A repeat, on the opening card of the career.**
3. **A specific moment** — the instant the first screen rendered.
4. **Three things pulled me back and they are worth naming**, because they are the game's best work:
   - **"The Blindside"** (decision 4) — a genuinely offensive-line card, in the first season.
   - **The season-opener ladder.** *The First One → No Longer New → Your Team Now → You Start
     Counting → **The Last One***. Five different cards in the same slot, one per year, each one
     written for exactly where you are in the career. This is the single best-designed thing in the
     game and it is the only mechanism that made me feel the years passing.
   - **"The Captain Vote"** and **"The Exit Interview"** — new, specific, with real dilemmas.

---

## QUESTION A — the redshirt season. Verdict: **thin, and worse, it is a free lunch dressed as a gamble.**

**1. Did it feel thin, repetitive or empty? Yes — and I can count it.**
Every other season I played gave me **two cards per in-season phase**. The redshirt season gave me
**one**. The whole of season 2 was five cards:

| phase | card |
|---|---|
| offseason | Redshirt? |
| offseason | Going Home for the Summer |
| non-conference | The NIL Deal Nobody Read |
| conference play | Speeding Ticket in Georgia |
| postseason | Ghosting the Media |

Eight cards in season 1, **five** in season 2. It is a visibly shorter season and it goes by in a
blink. But **thinness is not the real problem.** The real problem is:

**Not one of those five cards is about being redshirted.** Nothing referenced the scout team.
Nothing referenced watching from the sideline. Nothing referenced the weight room. There is no
redshirt content — there is just *less* content. And two of the five are actively wrong for a player
who is not playing:
- **"Ghosting the Media"**: *"Required press availability, and you are simply not in the mood to
  explain a loss to a room full of reporters."* I had **31 snaps all year**. Redshirts do not do
  mandatory postgame press.
- **"Speeding Ticket in Georgia"** was pure filler I had already seen in season 1.

**2. Same card twice within the one season? No** — not within season 2. But "Speeding Ticket in
Georgia" appeared in season 1 *and* season 2, word for word, in a career that only had eleven
distinct cards by that point; and because the redshirt season only has five slots, one of them being
a repeat means **20% of the redshirt year was a card I had already read.**

**3. Real decision with a real cost, or a dead season?** **Neither — and that is the finding.** It
was not a dead season I clicked through; it was a **free +5 with no season attached.** Look at what
happened the instant I clicked "Take the redshirt":

> You chose: Take the redshirt (play four games at most)
>
> A year in the weight room and the scout-team huddle with nobody watching. You come back bigger,
> and the coaches notice in the first padded practice.
>
> **+5 OVR** — Overall up 5, now 72.

**The entire redshirt year resolves on the card that offers it, before the season is played.** The
prose has already fast-forwarded through the year ("you come back bigger", "the coaches notice in
the first padded practice") while the season it describes has not started. So the five cards that
follow are not the redshirt season — they are dead time after the payout has already landed. There
is no suspense, no cost, and nothing to pay attention to.

**And it moved my status to "a week-one starter"** — for the season I had just chosen to sit out.

**4. Was it worth it? Enormously, and I learned it in two places at two different times.**
- **Immediately**: +5 on the card itself.
- **Season 2 ended at +11 overall — the best season of the five-year career, off 31 snaps.**
  Sitting out was worth more than any season I played. The season summary said so in as many words:
  `75 overall · +11, up 11 on the season before`.
- **The eligibility payoff arrived much later**, at the season-3 "Declare for the Draft?" card,
  which read *"Three seasons of eligibility remain"* where an un-redshirted junior sees two. That is
  the only place the extra year is ever stated, and it is a subordinate clause on an unrelated card.
  The fifth year itself arrived at decision ~44 as **`SEASON 5 · 5TH-YR SR`** in the header.

So: yes, worth it, twice over. But **the reward is so front-loaded and so large that the card's own
framing is false.**

**5. Does the card say what then happens? No. It is wrong on two of its four claims.**

> "Four games at most, and the season doesn't count against your eligibility. A year of scout team
> and the weight room, and **a gamble on coming back stronger — it might backfire.**"

- *"the season doesn't count against your eligibility"* — **true**, and honoured (I got a 5th year).
- *"Four games at most"* — **consistent**: 31 snaps, `3 Pancakes`, versus 603 snaps the year before.
  The stat line is the one place the redshirt is legible, and it works.
- *"A year of scout team and the weight room"* — **never happens.** No card in the season mentions
  either. The scout team exists only in the outcome sentence on the offer card.
- *"a gamble … it might backfire"* — **false as I experienced it.** There was no gamble: the +5
  landed instantly, and the season went on to be the best of my career. Nothing about it felt like
  a risk, because the result was printed before the risk was taken.

**The other contradiction the card creates.** I took the redshirt **after a 603-snap freshman season
in which I started.** The game offers "a year of scout team" to an established starter, and then
labels him "a week-one starter" for the year he sits. Career 1 offered the same redshirt card in
season 2, season 3 *and* season 4 — as a **senior**. Being offered a career-defining gamble three
years running, with identical text, is what strips it of weight.

**Finally: the redshirt year is invisible in the record.** The season table row for year 2 reads
`Toledo · SO · 5-7 · 31 snaps · 75 overall · +11`. **Nothing says it was a redshirt.** Nor on the
ending screen. And the class label never accounts for it either — I was `SR` in season 4 while the
draft card said "**two** seasons of eligibility remain", which is contradictory on its face.

**The redshirt season's highlight reel, in full, from the ending screen:**
> SEASON 2 · SO
> 💰 Cashed an NIL check he probably should not have
> 🚗 Talked his way out of a speeding ticket

That is what a year of my career is remembered for. That is the thinness, made permanent.

---

### Question B additions from career 2

**B1 — the two best contradictions of the whole session are both here.**

- **"The Ticket Hookup" → "Sell the comp tickets" (season 5):**
  > Compliance flags the resale listing with your name still in the metadata.
  >
  > Cost you in the locker room.
  >
  > **+1 OVR** — Overall up 1, now 90.

  **I was caught in an NCAA violation and my rating went up.** This is precisely the failure mode the
  brief describes as fixed — a clear loss reported as a plus — and it is still there, in the
  single-number format the split reporting does not cover.
- **"Fall Camp Battle" (season 5).** The card offers exactly one button, labelled **"Win the job"**.
  The outcome:
  > You press, and pressing looks exactly like panicking on film. — **−1 OVR**

  **The only action available is called "Win the job" and the result is that I lost it.** The button
  label states an outcome the game then refuses. (Same card, same button, gave +2 and *"the pencil
  becomes ink"* four other times across the two careers — so this is the dice, but the *button text*
  makes it read as a lie rather than as variance.)
- **"The Exit Interview" → "Ask exactly what it takes and commit to it in writing":**
  > They hand you a list. It is a real list, with a real winter of extra work attached to it.
  > Earned you credit in the locker room.
  > THIS CARD **−3 OVR**

  The most constructive option on the card, with two positive sentences attached, produced the
  largest single-card penalty of the career.
- **"Bowl Season" → "Treat it like a playoff game" → *"You are the only one who practiced like
  that"*** — arrived **two cards after** *"you do not put weight on it again until January."*

**B2 — the split, seen more.** The split's one real virtue showed up at **"The Captain Vote"**:
`THIS CARD: No change` / `EVERYTHING ELSE: +8 OVR, now 84`. The "this card did nothing" half is
**honest and correct** — being voted captain did not change my ability. That is a genuine
improvement over career 1's unattributed `+5`.

But **"EVERYTHING ELSE" is never once explained.** That +8 was my season-3 leg injury healing, which
the game had promised eight decisions earlier ("The OVR comes back when the injury heals") and then
never announced. **The single most useful thing you could add is a sentence under EVERYTHING ELSE
saying what it was.** Right now the biggest numbers in the game arrive under a label that means
"something you cannot see."

And the split still routinely nets to zero — "The Carousel Comes for Your Staff": `−1` / `+1`, four
lines of reporting to say nothing moved.

**B3 — the locker room ladder, resolved.** It *does* work, but only when there is headroom. It moved
exactly twice in ~55 decisions ("the staff trusts you" → "just a guy in the building", both times
downward). It then sat frozen at **"just a guy in the building" for the last three and a half
seasons** while the game told me *"Earned you credit in the locker room"* (×3) and *"Cost you in the
locker room"* (×4). By the end those sentences carried no information at all.

**B4 — "The Watch List" was a fake choice.** "Never mention it" → **+1**. "Put the graphic up" →
**+1**. Two opposite choices on the same card, one season apart, identical result. That one did read
as *"the game is not telling me the truth"*, and it is the opposite failure from the good "Rivalry
Week" variance, which named its mechanism.

### Claim updates from career 2

- **Claim 1 (season table).** The header and the table **disagree on the same screen, repeatedly**:
  season 1 end, header `67` / table `64`; season 4 end, header snaps `599` / table snaps `624`.
  Also, the table's per-season delta counts a *temporary* injury penalty as a real decline —
  season 3 reads `−2, down 2 on the season before` purely because I was carrying an −8 that healed
  in the offseason.
- **Claim 4 (ending readable at a glance).** **CONFIRMED for ranking.** `Round 1, Pick 32` in huge
  gold against career 1's `Round 4, Pick 29` is instantly comparable — I did not need the #32 /
  #125 line. The new **HONORS / ALSO EARNED** block (All-American, All-Conference) is a good
  addition and is the clearest "this career went well" signal on the page.
- **Claim 5 (Moments repeats).** **CONFIRMED again, worse than career 1.**
  > 🏆 **Won the rivalry game** — **three times** (Seasons 1, 3, 4)
  > 🏆 **Carried the team through bowl season** — **three times** (Seasons 1, 3, 5)
  > 🚗 **Talked his way out of a speeding ticket** — **twice** (Seasons 1, 2)
  Seven of my twelve career moments were duplicates. "Talked his way out of a speeding ticket"
  appearing twice is the worst of them, because it was filler both times.
- **Claim 6 (position).** **Offensive line is a much better costume than quarterback was.**
  Three genuinely OL cards — **"The Blindside"** (decision 4, season 1), **"New Line Coach"**
  (*"tears your stance down to the studs — hand placement, first step"*), plus the
  `Pancakes / Sacks Allowed` stat line. QB got **one** position card in 48 decisions and it arrived
  in season 4. So the difference is real but **wildly uneven between positions**. And the offseason
  was **100% position-neutral in both careers** — Redshirt?, Declare?, Transfer Portal, Fall Camp
  Battle, Going Home for the Summer are identical at every position.
- **Claim 7 (status vs. screen).** **Refuted emphatically.** The definitive quote, from the season-5
  postseason screen:
  > **ON THE FIELD** — the best player in the country
  > **IN THE LOCKER ROOM** — just a guy in the building

  And one screen earlier: the room **voted me captain** (*"the room votes for you anyway"*) while the
  header read "just a guy in the building". Also "Scouts on the Sideline" says *"they are not here to
  watch the starters"* while the same screen calls me All-America caliber.

---

## Career 3 — Vance #7, Kicker (TX) · **declared early at the first offer**

San Diego State. **2 seasons.** **Round 6, Pick 15 (#175 overall), final OVR 72.**
All-Conference, Bowl Win ×2. ~24 decisions.

### "Do I want to play again right now?"

> **No.** And unlike after career 2, there is nothing pulling the other way. I got the answer I
> came for in one click. What is pushing me away is that I had already read nine of this career's
> twenty-four cards, word for word, in the two careers before it — and the six-card offseason
> (Redshirt? → Declare? → Transfer Portal → Fall Camp Battle → Going Home for the Summer) is now
> something I execute rather than something I play.

### "Do I want a fourth?"

> **No.** Not from curiosity either. I know what the next one looks like: Signing Day with three
> schools that all say "the two-deep is thin", New Workout Regimen, The First One, Rivalry Week
> with the barking ankle, Bowl Season, and a gold draft number at the end.

### Skimming onset (question C)

1. **Decision 1**, again, and harder than career 2 — I did not read a single word of "Signing Day".
2. **A repeat**, the opening card of the career.
3. **Instant.** By career 3 the skimming is the default state and reading is the exception.
4. **Three things pulled me back, all of them Kicker cards**: **"Kickoff Duties Too"** (decision 4),
   **"Onside Kick"** (decision 7) and **"Bowl Game Winner"** (decision 9). I read all three
   completely. That is the whole answer to the position question: **new, position-specific content
   is the only thing that reliably beat the skim.**

**Onset across the three careers: 15 → 1 → 1.** Unchanged from what the last playtester reported.

---

## CLAIM 3 — declaring early. Verdict: **a trap, unambiguously.**

**The card, in full, exactly as it appears:**

> ### Declare for the Draft?
> You're draft-eligible. **Cash in now**, or return for another season?
>
> *Two seasons of eligibility remain.*
>
> `Declare for the NFL Draft` · `Return to school`

**There is not one word of risk anywhere on it.** I read it twice looking, because that is what the
brief asked. "Cash in" is *upside* framing — it means collecting something you have already earned.
The only fact offered is the eligibility count, which tells me what I am giving up in *years* and
nothing about what I am giving up in *outcome*. There is no draft-stock projection, no scout
opinion, no "where you are currently graded", nothing that would let me price the decision.

**The contrast with the redshirt card, which sits three cards earlier in the same offseason, is
damning.** The redshirt card — a reversible, low-stakes choice — spells its risk out:
*"a gamble on coming back stronger — **it might backfire**."* The declare card — irreversible, and
the thing that ends the game — says nothing of the kind. **The game warns you about the safe
decision and not about the dangerous one.**

**What happened when I clicked it.** The career ended **instantly**. One click from an offseason
decision screen to the final ending screen. **No transition, no draft-night beat, no combine, no
acknowledgement that I had left two years on the table.** Nothing anywhere on the ending screen
says "declared early" or "2 of 4 seasons used". It just says `2 SEASONS`.

**The cost was real and large.** Round 6, Pick 15 (#175) against Round 4 (#125) and Round 1 (#32)
in my other two careers. Declaring cost me several rounds. **But I only know that because I had
already played two careers.** A first-time player has no baseline at all, gets no warning before,
and gets no explanation after — which is the exact definition of a trap rather than a gamble.

**Sequencing makes it worse.** The offseason asked me, in this order:
`Redshirt? → Declare for the Draft? → Transfer Portal`. I answered **"Play this season"** on the
first card and was then allowed to leave on the second — the game let me break the promise it had
just extracted from me, on the very next screen. And all three of these career-defining forks are
rendered with **identical visual weight** to "Going Home for the Summer."

---

### Claim 4 — the ending screen. Verdict: **PARTIAL, and it fails the second half.**

**Ranking at a glance: yes.** `Round 6, Pick 15` / `Round 4, Pick 29` / `Round 1, Pick 32` in huge
gold — I never needed to read #175 / #125 / #32.

**Congratulatory about a career that went badly: yes, and here are the exact elements.**
- **The draft line's treatment is identical regardless of outcome.** Side by side, my Round 6 screen
  and my Round 1 screen are visually indistinguishable — same ~40px gold display type, same
  position, same layout. **Only the digits change.** A sixth-round kicker who quit two years early
  gets the same trophy presentation as a first-round All-American.
- **The `ALSO EARNED` honors block.** My truncated career's ending proudly displays
  `All-Conference` and `Bowl Win ×2`. It is the most celebratory element on a page about a career
  I just cut in half.
- **`Bowl Win ×2` is factually false.** In season 1 I took the "Bowl Game Winner" card and the
  outcome was: *"It has the distance and misses left by a foot."* **I lost that bowl game on my own
  missed kick**, and the ending screen awards me a bowl win for it. That was the most memorable
  thing that happened in the entire career and the ending contradicts it outright.

### Claim 5 — Moments reel. **CONFIRMED a third time.**
> 🏆 **Carried the team through bowl season** — printed **twice** in a **two-season** career
> (Season 1 and Season 2). Half of my four career moments were the same sentence.

And the reel **omits the one unforgettable beat** — the missed bowl-winner — while printing the
generic duplicate twice. The reel keeps the filler and drops the drama.

### Claim 6 — position. **Kicker is the best-realised of the three, by a distance.**
Three genuine kicker cards inside nine decisions — **"Kickoff Duties Too"** (*"Same leg, twice the
workload, same paycheck"*), **"Onside Kick"**, **"Bowl Game Winner"** — plus a stat line
(`FG / Points / Game-Winner`) that **responded to a card**: `1 Game-Winner` appeared in the header
immediately after the onside-kick card resolved. That is the single best moment of
card-meets-record in the whole session and it is the thing the rest of the game should copy.

**So the ranking is Kicker > Offensive line >> Quarterback**, which means the answer to "costume or
character" is **"depends entirely on which position you pick"** — and the marquee position is the
emptiest one.

**But the position-blind copy still shows through constantly**, and at Kicker it is absurd:
- **All three Signing Day options read "the two-deep is thin"** — for a **kicker**, where there is
  no two-deep. This was also the most information-free choice I made all session: three schools,
  three identical descriptors, nothing else to go on, as the very first thing the game asks.
- *"The ankle goes on the second series"* — kickers do not take series.
- *"Fall Camp Battle: the depth chart goes up Monday"*, *"Rivalry Week: your ankle has been barking"*,
  *"Ghosting the Media"*, *"The Ticket Hookup"* — all identical at all three positions.
- The **entire offseason** was word-for-word identical at all three positions, all three careers.

### Question B from career 3

- **B5 / the reproducible one.** *"You chose: Stay at San Diego State"* → **+5 OVR, now 66**, with
  **no sentence at all** — the third time in three careers that the Transfer Portal "stay" option
  has silently absorbed an injury refund and reported it as if staying caused it. Fully
  reproducible: it happens whenever an injury heals on the same tick.
- **B1.** *"Bowl Game Winner" → "Take the win"* → *"It has the distance and misses left by a foot"*
  → `THIS CARD −3` / `EVERYTHING ELSE +2`. The card half is right; the +2 is unexplained.
- **B1, again.** *"Ghosting the Media" → "Don't show up"* → I skipped a **mandatory** press
  availability and got `THIS CARD **+1 OVR**`. Second time this session that breaking a rule
  produced a positive number.
- **Incoherent option text.** "Bowl Game Winner" sets up *"your team down two"* and then offers
  **"Take the tie and send it to overtime"** — from two points down, a field goal wins and there is
  no tie available. The two options do not describe a real situation.

---

# Summary

## The three headline answers

| after career | do I want to play again? |
|---|---|
| **1 (QB)** | **Yes** — I wanted to see whether a different position played differently. |
| **2 (OL, redshirt)** | **No.** I kept going to check something, which is not the same as wanting to play. |
| **3 (K, declared early)** | **No** — and **no** to a fourth, with nothing pulling the other way. |

**Curve: yes → no → no.** That is the same shape the previous three playtesters produced, and it
broke one career earlier than the best of them. **The curve has not moved.**

**Skimming onset: decision 15 → decision 1 → decision 1.** Identical to the last report. In every
case the trigger was a **repeat**, and in career 1 it was specifically **"Rivalry Week"**, which by
the end of the session I had read **twelve times across three careers** with the identical
"your ankle has been barking since Tuesday" opener.

**Redshirt season, one line:** *thin — five cards where a played season gets eight, none of them
about being redshirted, two of them wrong for a player who is not playing — but the bigger problem
is that it pays out +5 on the card that offers it, so the "gamble" it advertises never happens.*

## Where I got bored, confused or lost

- **Bored:** decision 15 of career 1 (first repeat), and then permanently from the start of career 2.
- **Lost:** only at the very end of career 1, where I chose "Return to school" and the career ended
  anyway with the YEAR 5 row still blank. The eligibility wording ("one season of eligibility
  remains" meaning *this* one, not one more) is ambiguous and the empty YEAR 5 row reinforces the
  wrong reading.
- **Arbitrary choices with no basis to pick on:** Signing Day, every time, worst in career 3 where
  all three schools carried the same tag. Also every Transfer Portal card — "(bigger role)" versus
  "(tougher competition)" is the only information given, and in career 1 it offered me a move
  *back* to the 3-9 team I had already left, framed as an upgrade.

## Invisible when it should be visible

1. **Injury healing.** The game promises "the OVR comes back when the injury heals" and then never
   says when. The refund lands, unlabelled, on an unrelated card. This single omission is the cause
   of the three worst number-vs-words failures I found.
2. **"EVERYTHING ELSE."** Never once explained, in any of the ~12 splits I saw.
3. **Draft stock.** There is no signal of where you stand until the ending screen, which makes the
   declare decision unpriceable.
4. **The redshirt**, after the fact. Nothing in the table, the ending, or the class label records it.
5. **Chronology.** Cards inside a phase fire in an order that contradicts each other — Bowl Season
   ("the game is a blur") before Fifteen Extra Practices ("you show up to the bowl game feeling
   better"); Senior Day ("last time you run out of this tunnel") before another regular-season
   night game and a home-game ticket card; "Going Home for the Summer" *after* winning the fall camp
   job.

## Prominent and undeserving

- **"Fall Camp Battle."** A one-button non-choice with identical text, appearing in almost every
  offseason of every career, occupying a full decision slot.
- **The blank YEAR 1–5 scaffold** in the season table for the first two seasons — a large, empty,
  prominent panel that contains nothing.
- **The redundant number line.** Every single outcome prints "+3 OVR" and then "Overall up 3, now
  63." one line below it.

## By career 3, what exactly was I skimming?

Everything except the outcome number and the position-specific cards. Concretely, I stopped reading:
every offseason card body; every "Take care of business" / "Win the job" single-button card; the
entire `EVERYTHING ELSE` block; and all four of Rivalry Week, Bowl Season, The NIL Deal Nobody Read
and The Ticket Hookup. I was reading roughly **three words per card** — the title — plus the number.

## One line: the single thing most in the way of a fourth career

**The first ten decisions of every career are the same ten decisions**, so a new career does not
start, it resumes — and the one lever that would fix it, position, only changes about three cards
out of twenty-five.
