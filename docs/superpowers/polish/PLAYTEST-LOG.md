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
