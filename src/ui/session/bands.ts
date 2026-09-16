// The player never sees `overall` or `character` as integers during a career --
// a visible number turns every gamble into a reload-and-compare. They read a
// phrase instead, and the raw OVR is revealed once, on the summary.
//
// Thresholds are anchored on values that already exist in the content rather
// than invented: 45 is progression.washoutOverallFloor, 60 is STARTING_OVERALL,
// 85 is the allAmerican band floor, 92 is the heisman band floor.

interface Band {
  min: number;
  phrase: string;
}

const STANDING_BANDS: Band[] = [
  { min: 92, phrase: "the best player in the country" },
  { min: 85, phrase: "All-America caliber" },
  { min: 77, phrase: "one of the best in the conference" },
  { min: 69, phrase: "a week-one starter" },
  { min: 60, phrase: "in the rotation" },
  { min: 50, phrase: "on the scout team" },
  { min: 0, phrase: "hanging on to a roster spot" },
];

// ---------------------------------------------------------------------------
// The two phrases that are not claims about ability (report 027, defect 2)
//
// Every phrase above is derived from `overall` alone, but the vocabulary is
// DEPTH-CHART language, and the bottom two rungs do not describe how good the
// player is -- they assert that he is NOT PLAYING. `overall` cannot support
// that claim: playing time is `snapModifier` (recruiting offer, transfer,
// school trait, redshirt), which is a different number entirely. So the header
// printed `ON THE FIELD: on the scout team` beside `339 snaps · 31 tackles` in
// the same strip, 40px apart. Measured over 1,200 random-policy careers across
// all six positions: 5.9% of all decisions (1,807 of 30,739) and **45.7% of
// careers** show one of these two phrases while the visible snap count is 100
// or more.
//
// The rule is a REFUSAL, not an inference: a phrase that denies playing time is
// not printed when the number printed beside it refutes it. It does not guess
// at snap counts, and it never moves a phrase down -- only the two denials can
// be lifted, and only to the weakest phrase compatible with playing.
//
// This is NOT the redshirt inference DECISION 020 withdrew, and does not
// re-derive it. That inference asked "WHICH stored season was sat out", which
// report 010 measured as underivable. This asks nothing about any other season,
// labels no ledger row, and reads one number that is already on screen.
//
// The floor is `progression.washoutSnapFloor` (60), the engine's own definition
// of "did not play enough for this season to count" -- the same anchoring rule
// the bands themselves use. It is not imported, because this module has no
// content dependency and the labels layer deliberately keeps it that way;
// `bands.test.ts` asserts the constant still equals the content value, so a
// balance change to the floor fails a test instead of drifting.
//
// The redshirt season falls out correctly rather than being special-cased:
// `sitSnapModifier: 0.05` gives a sat-out season a median of 26 snaps and a
// measured max of 54 over 2,315 redshirt rows, all below 60 -- so a redshirt
// still reads `on the scout team`, which is exactly what it is.
export const PLAYING_SNAP_FLOOR = 60;

/** The phrases that assert the player is not on the field. Only these can be
    lifted by a snap count, because only these can be contradicted by one. */
const OFF_FIELD_PHRASES = new Set<string>(["on the scout team", "hanging on to a roster spot"]);

/** The weakest phrase that is compatible with taking real snaps. Deliberately
    the next rung up and no further: the snap count says he plays, it does not
    say he starts, and the OVR number is printed beside the phrase anyway. */
const PLAYING_FALLBACK = "in the rotation";

// Coarser on purpose. Character moves draft stock by about ±7.5 against
// overall's ~82 points of range; a dial of equal resolution would misrepresent
// its influence by roughly an order of magnitude.
const TRUST_BANDS: Band[] = [
  { min: 85, phrase: "they would run through a wall for you" },
  { min: 70, phrase: "the staff trusts you" },
  { min: 50, phrase: "just a guy in the building" },
  { min: 30, phrase: "a problem they are managing" },
  { min: 0, phrase: "the staff has stopped defending you" },
];

function bandFor(bands: Band[], value: number): string {
  for (const b of bands) if (value >= b.min) return b.phrase;
  return bands[bands.length - 1]!.phrase;
}

/**
 * The "ON THE FIELD" phrase.
 *
 * `snapsThisSeason` is the snap count the header is printing beside the phrase
 * -- `CareerView.season?.snaps`, i.e. the season IN PROGRESS. Optional, and
 * omitting it returns the pure `overall` band unchanged: a caller with no
 * season line (recruiting, a pre-field phase, a save that predates the field)
 * has nothing to contradict, and null is the absence of a number, never a zero.
 */
export function standingPhrase(overall: number, snapsThisSeason?: number | null): string {
  const phrase = bandFor(STANDING_BANDS, overall);
  if (!OFF_FIELD_PHRASES.has(phrase)) return phrase;
  if (typeof snapsThisSeason !== "number" || !Number.isFinite(snapsThisSeason)) return phrase;
  if (snapsThisSeason < PLAYING_SNAP_FLOOR) return phrase;
  return PLAYING_FALLBACK;
}

export function trustPhrase(character: number): string {
  return bandFor(TRUST_BANDS, character);
}

// ---------------------------------------------------------------------------
// The ladder, as a ladder (DECISION 002 held; task 043)
//
// Two playtests named the locker room as the only mechanism that made anyone
// want to change how they were playing, and the same two found it the least
// visible thing on the screen: one player was told "Cost you in the locker
// room." six times while the phrase itself moved once, unmarked, on the final
// click of the career.
//
// The fix is not a number and cannot become one. What a rung HAS, that a
// phrase on its own does not, is a position: four other things the building
// could have thought instead. That is what the summary draws and what the
// change marker names -- the ORDER of the bands, never the distance between
// them. `TRUST_BANDS` is already ordered best-first and the array index is
// therefore the rung; it is exported as phrases only, so nothing downstream
// can reach a threshold, a count or a `character` value through it.
// ---------------------------------------------------------------------------

/** The five rungs, best regard first. Order is the whole payload. */
export const TRUST_LADDER: readonly string[] = TRUST_BANDS.map((b) => b.phrase);

/** Which rung a phrase sits on -- 0 at the top -- or -1 for a phrase that is
    not on the ladder, which is what a save written against different words
    restores as. Callers treat -1 as "cannot place it" and render nothing. */
export function trustRungOf(phrase: string): number {
  return TRUST_LADDER.indexOf(phrase);
}

/**
 * Whether the standing changed rung between two phrases, and which way.
 *
 * Direction ONLY, and that is the constraint rather than a simplification: a
 * fall of two rungs and a fall of one return the same answer, so nothing
 * downstream can render a distance. DECISION 002 says character does not have
 * that resolution and DECISION 046 already refused to smuggle it in as
 * typography. Both directions are reported -- a playtester watched theirs "go
 * down three and back up one", and climbing back is the better beat of the two.
 *
 * Null when there is nothing to report: no baseline (a save written before the
 * card carried one), the same rung, or a phrase this ladder does not contain.
 */
export function trustMove(before: string | null | undefined, now: string): "up" | "down" | null {
  if (typeof before !== "string" || before === now) return null;
  const from = trustRungOf(before);
  const to = trustRungOf(now);
  if (from < 0 || to < 0) return null;
  // Best-first, so a SMALLER index is a higher rung.
  return to < from ? "up" : "down";
}
