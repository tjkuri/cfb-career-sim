import { validateContent, type ContentBundle } from "./schema";
import { POSITIONS } from "./positions";
import { INJURIES } from "./injuries";
import { SCHOOLS } from "./schools";
import { EVENTS } from "./events/index";
import { POSTSEASON, PROGRESSION } from "./postseason";
import { REGIONS, SCHOOL_SAMPLER } from "./regions";
import { REDSHIRT } from "./redshirt";
import { SCHOOL_TRAITS, TRAIT_HINTS } from "./school-traits";

export const CONTENT: ContentBundle = {
  positions: POSITIONS,
  injuries: INJURIES,
  schools: SCHOOLS,
  trophyIds: ["confTitle", "cfpTitle", "bowlWin"],
  awardIds: ["heisman", "allAmerican", "allConference"],
  events: EVENTS,
  postseason: POSTSEASON,
  progression: PROGRESSION,
  regions: REGIONS,
  schoolSampler: SCHOOL_SAMPLER,
  schoolTraits: SCHOOL_TRAITS,
  traitHints: TRAIT_HINTS,
  redshirt: REDSHIRT,
};

// Fail fast at module load if content is malformed.
const _errors = validateContent(CONTENT);
if (_errors.length > 0) {
  throw new Error("Invalid CONTENT bundle:\n" + _errors.join("\n"));
}
