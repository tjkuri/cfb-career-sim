# Playtest Log

Append one entry per session, newest at the bottom. Keep entries short — the full writeup lives in
`reports/NNN-slug.md`. This file exists so patterns across sessions are visible at a glance.

Format:

```
## NNN — <focus> · <date>
Careers played: <n> (<positions>)
Reference game played: yes/no
Verdict in one line: <...>
Top three problems:
  1.
  2.
  3.
Best moment: <what actually landed>
Would you play again unprompted? yes / no / — why
Report: reports/NNN-slug.md
```

---

## 003 — Baseline playtest · 2026-09-13
Careers played: 3 (Quarterback, Kicker, Offensive line)
Reference game played: no (covered by report 002)
Verdict in one line: The writing is good and the game hides it — plus it hides the season record it already tracks, and renders a torn ligament exactly like a speeding ticket.
Top three problems:
  1. The header says 0-0 all season; real records and stat lines only appear on the draft screen, after the career is over.
  2. No dynamic range — a -8 OVR injury, a role promotion and a joke card all get one grey sentence and the same gold Continue button.
  3. Seasons are near-verbatim reruns (same opener, same barking ankle, same bowl) with no boundary marked; All-Star Invite and Redshirt? fire in nonsense years.
Best moment: Onside Kick as a sophomore kicker — down eight, ninety seconds — failing it, and the very next card being "explain a loss to a room full of reporters."
Would you play again unprompted? yes — the cards are genuinely well written and the draft-screen stat lines made me want to run a lineman who never transfers
Report: reports/003-baseline-playtest.md

## 014 — Playtest after waves 3 and 4 · 2026-09-13
Careers played: 3 (Quarterback 41 decisions, Kicker 32, Offensive line 18)
Reference game played: no
Verdict in one line: Overflow, delta scaling and the leak check are genuinely fixed — but the rail still contradicts itself on every screen, the repeats have trained me to stop reading the prose entirely, and I could not lose a career even when I tried.
Top three problems:
  1. The rail's two lines disagree constantly — "All-America caliber / just a guy in the building" after the sub-line sat unchanged for ~35 decisions across three seasons and two schools. The inverse ("on the scout team / the staff trusts you") appeared at 502 snaps.
  2. Season boundaries are still unmarked, and the record only appears retroactively in the strip — I finished a season believing I'd played well and then read "2-10" in the next offseason, contradicting every card I'd been shown.
  3. The OVR number routinely contradicts the sentence above it (a week of bad press = +2, "sprain, not a tear" = −5), and the game's largest single effect — roughly +5 for transferring — is never printed at all. Together these taught me to read only the gold number and skim all prose, including the good new cards.
Best moment: "The Yips" — missing eleven in a row on an empty practice field with nobody watching but the ball boy. Position-specific cards are the best writing in the game and they are the only reason the three careers felt different.
Would you play again unprompted? no — after career 1 yes (the Moments reel), after career 2 reluctantly, after career 3 no. Career 2's reel printed "Carried the team through bowl season" three times identically, which spent the one thing that was pulling me back; and by career 3 I knew the offseason had one correct answer (always transfer up) and that a deliberately terrible career still prints a gold headline.
Report: reports/014-post-wave4-playtest.md

## 017 — Playtest after wave 6 · 2026-09-13
Careers played: 3 (Quarterback 38 decisions, Kicker 33, Offensive line 18 — tanked on purpose)
Reference game played: no
Verdict in one line: The ledger is the best thing in the build and I used it to make real decisions — but the curve did not move, because what stops me is still repetition, and I stopped reading card bodies in career 1 this time instead of career 3.
Top three problems:
  1. I took a redshirt and the ledger never acknowledged it — the dashed YEAR 5 row stayed identical, the redshirt season logged as a normal season (with `FG -1`), and during season 5's offseason the header said SEASON 5 while the rail still showed YEAR 5 as a dashed "redshirt year" and highlighted nothing. That is the one place I was genuinely lost.
  2. The deliberately-bad career reads as congratulatory: `Round 7, Pick 1` is the biggest, brightest, gold element on the page, and the Moments reel is 🏆🏆☀️☀️ including "Had the time of his life at a bowl game" — a warm memory handed to me for the exact choice I made to sabotage myself. The only honest element, `63 → 59 · −4`, is the smallest and dimmest type on the screen.
  3. Ducking the install meeting for a podcast pays +1 OVR; doing the disciplined thing on the same card pays nothing. Playing badly is rate-limited, not directional — my 2-season, 2-10, FCS, refused-the-trainer lineman went 193rd overall. I worked out failure was impossible at the "Declare?" card, which offers the game's biggest decision with zero information attached.
Best moment: Career 1 season 4, reading `65 / 75 / 74` in the rail — seeing that I had transferred *up* to Baylor and gone *down*, in one glance, and changing how I played the rest of the career because of it. That is the ledger doing exactly what it was built for.
Would you play again unprompted? yes → no → no. Career 1 yes, but only to try a different position. Career 2 no — seven identical barking ankles. Career 3 no, harder, because the tank run answered the last question I had.
Report: reports/017-post-wave6-playtest.md

## 025 — Playtest after waves 9 and 10 · 2026-09-14
Careers played: 4 (Quarterback 41 decisions, Kicker 34, Defensive line 22 — tanked on purpose, Offensive skill 38 — three transfers)
Viewport: 1456 × 824 (not pinned to ~800px this time)
Reference game played: no
Verdict in one line: You can lose now and it lands hard — "Undrafted / No team called" is the best moment in the build — but the opener fix did not move the skimming onset, because the offseason still runs the same five cards in the same order every year and the prose still contradicts the number.
Top three problems:
  1. The offseason is a fixed loop at every position: Redshirt? → Declare? → Transfer Portal → Fall Camp Battle → New Workout Regimen, identical words, identical order, every year, all four careers. Fall Camp Battle ran 8 times with no choice on it. This is the single thing most in the way of a fifth career.
  2. The prose and the OVR number disagree constantly, which is what makes skimming rational and generalises it to brand-new cards: "The fit never quite comes together, and it shows on the depth chart" = +5; "Compliance flags the resale listing with your name still in the metadata" = +1; "off the upright and away in the wrong direction" = +1; "Zero new risk, zero new tape" = +2; "Nobody notices, which is fine" = −3; "Sprain, not a tear… you keep the rest of the season" = −5. Meanwhile the game's biggest single effect — "Stay at Ole Miss", +10 OVR — prints no sentence at all.
  3. "Undrafted" is rendered in the identical large gold display type, size and position as "Round 5, Pick 14". Gold is the celebration colour everywhere else in the UI. Reinforced by "ACROSS 2 SEASONS 55 → 59 +4" and a Moments reel of 📺/☀️ emoji on a career nobody drafted. And the repetition has reached the ending: career 4's reel printed 🏆 "Carried the team through bowl season" four times identically, on a player with no bowl win.
Best moment: "Undrafted. No team called." — the first time the game has had stakes. Runner-up: "1 Game-Winner" appearing in the ledger immediately after the onside-kick recovery caused it, which is the only time the ledger felt alive.
Skimming onset — ONSET, not dose: career 1 decision 15 (Rivalry Week, a verbatim repeat; a snap, not a gradual slide), then generalised to brand-new cards by decision 23. Careers 2, 3 and 4 all started at full skim on decision 1, because the first card of every career is Signing Day again. Dose only governs how long a reversal lasts — a new position-specific card buys back exactly one card of real reading.
Reversals worth naming: every kicker card (New Holder, The Yips, The Wind at Home, Onside Kick, The Chip Shot, The Long Attempt); "Somebody Rolls Up On You"; and the Declare screen in career 3 — fear restored my reading, not the writing.
Would you play again unprompted? yes → yes → "yes, but I want to check something" → no. The curve moved by about one career versus both previous playtesters (yes→check→no and yes→yes→no). What bought it: position-specific in-season cards, and the fact that career 3 could actually fail. Nothing else changed my appetite.
Also: the redshirt card lies — "sit this season" cost −3 OVR and I played the season anyway (5 snaps, 1 FG logged to it); the eligibility year it banked only surfaced six decisions later inside a different card's subordinate clause. The transfer now produces a card but it is quieter than an ordinary resolution — smaller type, no prose, and on one transfer no delta at all. Ledger arithmetic defect: "8 snaps · 3 FG · 6 Points". Status defect: "on the scout team" beside 339 snaps and 31 tackles. At 1456px the app is a ~755px band with ~350px of dead black on each side and ~260px below the card — the decision screen uses about a third of the space it has.
Report: reports/025-post-wave9-playtest.md

## 031 — Playtest after waves 11, 12 and 13 · 2026-09-14
Careers played: 3 (Quarterback 48 decisions; Offensive line 55 decisions — redshirt taken on purpose; Kicker 24 decisions — declared early at the first offer)
Viewport: 1456 × 757 (again NOT pinned to ~800px — read the layout answer as wide-desktop)
Reference game played: no
Verdict in one line: The split reporting fixed the wrong half of the problem — "THIS CARD" is now honest, but "EVERYTHING ELSE" is an unexplained bucket that silently absorbs the injury refund, and the plain single-number cards still print a plus on an NCAA violation.
Top three problems:
  1. Reproducible in all three careers: an injury's promised refund lands on an unrelated card. "You chose: Stay at Memphis" → +5 OVR with NO SENTENCE AT ALL (careers 1 and 3, verbatim); "The Captain Vote" → EVERYTHING ELSE +8. The game says "The OVR comes back when the injury heals" and then never says when, so its largest numbers arrive attached to the wrong cause.
  2. The redshirt is a free lunch dressed as a gamble. It resolves +5 ON THE CARD THAT OFFERS IT, before the season, with prose that has already fast-forwarded a year ("you come back bigger, and the coaches notice in the first padded practice"), and then sets status to "a week-one starter" for the season you sit. The season itself is 5 cards where a played season gets 8, none about being redshirted, and two actively wrong for a non-player (mandatory press availability at 31 snaps). Its ending-screen highlight reel, in full: "Cashed an NIL check he probably should not have" / "Talked his way out of a speeding ticket".
  3. Declaring early is a trap, not a gamble. The card carries zero risk language ("Cash in now, or return for another season?"), while the *redshirt* card three screens earlier explicitly says "it might backfire". One click ended the career with no transition, no draft-night beat, and nothing anywhere saying I left early. Cost several rounds (R6/#175 vs R1/#32 and R4/#125) and I only know that because I had played two other careers.
Best moment: "1 Game-Winner" appearing in the header stat line immediately after the onside-kick card caused it — the one time a card and the record spoke to each other. Runner-up: the season-opener ladder (The First One → No Longer New → Your Team Now → You Start Counting → The Last One), the only mechanism that made the years feel different.
Skimming onset: career 1 decision 15 (Rivalry Week, verbatim repeat, a snap not a slide); careers 2 and 3 decision 1 (Signing Day again). 15 → 1 → 1, unchanged from 025. Reversals: new position-specific cards, every time, and only for one card each — The Blindside, New Line Coach, Kickoff Duties Too, Onside Kick, Bowl Game Winner, Up Forty at Halftime, The Captain Vote. Also "The OVR comes back when the injury heals", the only line that ever explained a mechanic.
Would you play again unprompted? yes → no → no, and no to a fourth. Career 1 yes, to try another position. Career 2 no — I finished it to check the redshirt, not to play it. Career 3 no, with nothing pulling the other way. The curve did NOT move; it broke a career earlier than 025.
Position — costume or character: Kicker > Offensive line >> Quarterback. Kicker got 3 position cards in 9 decisions; OL got 3 in 55; QB got ONE in 48, in season 4. The offseason was 100% position-neutral in all three careers.
Other defects worth a wave: header and season table disagree on the same screen (OVR 67 vs 64; snaps 599 vs 624). "Bowl Win ×2" printed on the ending of a career whose bowl I lost on my own missed kick ("misses left by a foot"). Moments duplicates in all three careers — "Carried the team through bowl season" ×3, ×3, ×2; "Won the rivalry game" ×3; "Talked his way out of a speeding ticket" ×2. Locker-room ladder froze at "just a guy in the building" for 3.5 seasons while the game said "Earned you credit in the locker room" three times, and read "just a guy in the building" on the same screen as "the best player in the country" and one screen after the room voted me captain. "Compliance flags the resale listing with your name still in the metadata" = +1 OVR. Fall Camp Battle's only button is labelled "Win the job" and the outcome was "You press, and pressing looks exactly like panicking on film" (−1). All three Signing Day options in career 3 read "the two-deep is thin" — for a kicker. Chronology inside a phase contradicts itself (Bowl Season "the game is a blur" → Fifteen Extra Practices "you show up to the bowl game feeling better"; Senior Day → another regular-season night game). "Bowl Game Winner" says "down two" and offers "Take the tie and send it to overtime". At 1456px the decision card is ~500px wide with ~300px of dead black on each side and the bottom two-thirds of the page empty.
One line, what is most in the way of a fourth career: the first ten decisions of every career are the same ten decisions, so a new career does not start, it resumes — and position, the one lever that could fix it, only changes about three cards in twenty-five.
Report: reports/031-post-wave13-playtest.md
