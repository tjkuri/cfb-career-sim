import { validateContent, type ContentBundle } from "./schema";
import { POSITIONS } from "./positions";
import { INJURIES } from "./injuries";
import { SCHOOLS } from "./schools";
import { EVENTS } from "./events";

export const CONTENT: ContentBundle = {
  positions: POSITIONS,
  injuries: INJURIES,
  schools: SCHOOLS,
  trophyIds: ["confTitle", "cfpTitle", "bowlWin"],
  awardIds: ["heisman", "allAmerican", "allConference"],
  events: EVENTS,
};

// Fail fast at module load if content is malformed.
const _errors = validateContent(CONTENT);
if (_errors.length > 0) {
  throw new Error("Invalid CONTENT bundle:\n" + _errors.join("\n"));
}
