import type { GameEvent } from "../../engine/types";
import { RECRUITING_EVENTS } from "./recruiting";
import { UNIVERSAL_EVENTS } from "./universal";
import { SEASON_LIFE_EVENTS } from "./season-life";
import { OFFFIELD_EVENTS } from "./offfield";
import { QB_EVENTS } from "./qb";
import { OSKILL_EVENTS } from "./oskill";
import { OL_EVENTS } from "./ol";
import { DL_EVENTS } from "./dl";
import { DSKILL_EVENTS } from "./dskill";
import { K_EVENTS } from "./k";
import { BUST_EVENTS } from "./bust";
import { MILESTONE_EVENTS } from "./milestones";

// Every slice must appear here. events/index.test.ts fails if one is missing.
// Note: not every decision the player sees lives here. The engine injects
// synthetic decisions at the offseason hub (declare, transfer, redshirt) and
// overrides the recruiting event's options at runtime; none of those are
// content-authored events.
export const EVENTS: GameEvent[] = [
  ...RECRUITING_EVENTS,
  ...UNIVERSAL_EVENTS,
  ...SEASON_LIFE_EVENTS,
  ...OFFFIELD_EVENTS,
  ...QB_EVENTS,
  ...OSKILL_EVENTS,
  ...OL_EVENTS,
  ...DL_EVENTS,
  ...DSKILL_EVENTS,
  ...K_EVENTS,
  ...BUST_EVENTS,
  ...MILESTONE_EVENTS,
];
