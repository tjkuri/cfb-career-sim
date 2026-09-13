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

export function standingPhrase(overall: number): string {
  return bandFor(STANDING_BANDS, overall);
}

export function trustPhrase(character: number): string {
  return bandFor(TRUST_BANDS, character);
}
