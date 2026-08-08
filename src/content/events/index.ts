import type { GameEvent } from "../../engine/types";
import { RECRUITING_EVENTS } from "./recruiting";
import { UNIVERSAL_EVENTS } from "./universal";
import { QB_EVENTS } from "./qb";
import { OSKILL_EVENTS } from "./oskill";
import { OL_EVENTS } from "./ol";
import { DL_EVENTS } from "./dl";
import { DSKILL_EVENTS } from "./dskill";
import { K_EVENTS } from "./k";
import { BUST_EVENTS } from "./bust";
import { MILESTONE_EVENTS } from "./milestones";

// Every slice must appear here. events/index.test.ts fails if one is missing.
export const EVENTS: GameEvent[] = [
  ...RECRUITING_EVENTS,
  ...UNIVERSAL_EVENTS,
  ...QB_EVENTS,
  ...OSKILL_EVENTS,
  ...OL_EVENTS,
  ...DL_EVENTS,
  ...DSKILL_EVENTS,
  ...K_EVENTS,
  ...BUST_EVENTS,
  ...MILESTONE_EVENTS,
];
