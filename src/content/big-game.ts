import type { BigGameStakes, Position, Tier } from "../engine/types";

// The play that decides the season. The player picks one of three calls, the
// other side has picked one of three of their own, and the matchup sets the
// odds. The film room tips which call the other side favours -- usually right.
export interface Playbook {
  // Late-game spots. A career never sees the same one twice.
  situations: string[];
  calls: { id: string; label: string; detail: string }[];
  // What the other side can run, and the tip the film room gives for each.
  counters: { label: string; scout: string }[];
  // odds[myCall][theirCall], before overall is applied.
  odds: number[][];
  success: string[];
  failure: string[];
  // What a win adds to the season line.
  statBump: Record<string, number>;
}

const W = 0.8; // the call beats theirs
const N = 0.55; // a fair fight
const L = 0.3; // they had it covered

export const PLAYBOOKS: Record<Position, Playbook> = {
  QB: {
    situations: [
      "Down 4. 0:31 left. Third and goal from the 9. The whole stadium is on its feet.",
      "Down 3. 0:08 left. Ball on their 24, no timeouts. Everyone in the building knows you are throwing.",
      "Tied. Overtime. Third and 6 from their 18. A touchdown wins it.",
      "Down 6. 0:47 left. Fourth and 3 at their 12. Miss and the season is over.",
    ],
    calls: [
      { id: "slant", label: "Quick slant", detail: "Ball out in a second. Kills a blitz." },
      { id: "draw", label: "QB draw", detail: "Take it yourself. Burns man coverage." },
      { id: "fade", label: "Back-corner fade", detail: "Throw it where only he can get it. Beats a two-high shell." },
    ],
    counters: [
      { label: "Zone blitz", scout: "Film says they send pressure on every red-zone third down." },
      { label: "Cover 2", scout: "Film says they sit two deep and dare you to fit it in." },
      { label: "Man press", scout: "Film says they go press-man and turn their backs to the QB." },
    ],
    odds: [
      [W, L, N],
      [L, N, W],
      [N, W, L],
    ],
    success: [
      "The ball is out before anyone gets home. Your guy walks into the end zone.",
      "You tuck it, find a crease, and dive across the line. Touchdown.",
      "Perfect ball, back pylon, toes down. The official's arms go up.",
    ],
    failure: [
      "A linebacker sits right in the window. The pass dies at the goal line.",
      "Free rusher, unblocked. You never get a step.",
      "The corner is all over it. Ball falls incomplete, and so does the season.",
    ],
    statBump: { passYards: 55, passTds: 1 },
  },
  OSKILL: {
    situations: [
      "Down 3. 0:44 left. Ball on their 22. The play is coming to you.",
      "Down 5. 0:19 left. Second and goal from the 7. The coordinator looks at you and nods.",
      "Tied. Overtime. Ball on their 25. Score and you win.",
      "Down 4. 1:02 left. Third and 8 at midfield. Nobody else is getting this ball.",
    ],
    calls: [
      { id: "bounce", label: "Bounce it outside", detail: "Win the edge. Beats a stacked box." },
      { id: "dive", label: "Hit it downhill", detail: "Straight up the gut. Beats edge contain." },
      { id: "wheel", label: "Wheel route", detail: "Leak out of the backfield. Beats the blitz." },
    ],
    counters: [
      { label: "Stacked box", scout: "Film says they load eight in the box when it matters." },
      { label: "Edge contain", scout: "Film says their ends set the edge and never crash." },
      { label: "All-out blitz", scout: "Film says they bring everybody when the clock is short." },
    ],
    odds: [
      [W, L, N],
      [N, W, L],
      [L, N, W],
    ],
    success: [
      "You beat the first man to the edge and outrun everyone to the pylon.",
      "The middle opens like a door. Twenty-two yards, untouched.",
      "Nobody picks you up out of the backfield. You catch it in stride and walk in.",
    ],
    failure: [
      "Their end sets the edge and you run out of field.",
      "Somebody meets you in the hole. You go nowhere.",
      "A linebacker reads it the whole way and blows it up.",
    ],
    statBump: { scrimmageYards: 40, totalTds: 1 },
  },
  OL: {
    situations: [
      "Fourth and one at their 3. 0:52 left, down 5. They are daring you to run it.",
      "Fourth and goal from the 1. 0:12 left, down 4. The coach keeps the offense on the field.",
      "Third and 2, 1:40 left, up 3. Get the first down and you kneel it out.",
      "Overtime. Fourth and 1 at their 4. Pick up the yard or go home.",
    ],
    calls: [
      { id: "double", label: "Double the nose", detail: "Move the big man. Beats a stunt inside." },
      { id: "pull", label: "Pull and lead", detail: "Get out in front. Beats an inside slant." },
      { id: "reach", label: "Reach the edge", detail: "Seal the outside. Beats a loaded middle." },
    ],
    counters: [
      { label: "Interior stunt", scout: "Film says their tackles twist on every short yardage snap." },
      { label: "Slant inside", scout: "Film says the whole front slants to the strength." },
      { label: "Load the middle", scout: "Film says they pack the A-gaps and dare you to go wide." },
    ],
    odds: [
      [W, N, L],
      [L, W, N],
      [N, L, W],
    ],
    success: [
      "You and the guard drive the nose tackle into the end zone, and the back follows you in.",
      "You pull, find the linebacker, and bury him. Touchdown behind your block.",
      "You seal the edge and the back walks in untouched. Your name is the first one in the post-game.",
    ],
    failure: [
      "The double goes nowhere. Stopped short.",
      "The twist comes right through the gap you left. Stopped short.",
      "Your man beats the reach and the back is dropped for a loss.",
    ],
    statBump: { pancakes: 3 },
  },
  DL: {
    situations: [
      "Up 3. 0:40 left. They have the ball at your 30 and need a field goal or better.",
      "Up 4. 0:22 left. They are on your 11. One stop wins it.",
      "Overtime, up 7. Fourth and 4 from your 9. Get home and it is over.",
      "Up 2. 1:05 left. They are at midfield and driving.",
    ],
    calls: [
      { id: "bull", label: "Bull rush", detail: "Through the man's chest. Beats a deep drop." },
      { id: "speed", label: "Speed rush", detail: "Bend the edge. Beats a quick run." },
      { id: "drop", label: "Drop into the flat", detail: "Sit and wait. Beats the screen." },
    ],
    counters: [
      { label: "Deep drop", scout: "Film says their QB takes seven steps and looks for the shot." },
      { label: "Quick draw", scout: "Film says they run the draw when the rush gets wide." },
      { label: "Screen", scout: "Film says they love the screen against an aggressive front." },
    ],
    odds: [
      [W, N, L],
      [L, W, N],
      [N, L, W],
    ],
    success: [
      "You walk the tackle straight into his own quarterback. Sack, fumble, ballgame.",
      "The back takes the handoff and you are already there. Loss of four, clock runs out.",
      "You sit in the flat, read it all the way, and the ball goes right into your hands. Ballgame.",
    ],
    failure: [
      "You get home a half-second late. The ball is gone, and so is the lead.",
      "You get wide, he steps up into a clean pocket, and finds the shot.",
      "You drop, and they go right through the hole you left.",
    ],
    statBump: { sacks: 1, tfls: 1 },
  },
  DSKILL: {
    situations: [
      "Up 4. 0:19 left. They are on your 35 with one last shot.",
      "Up 6. 0:04 left. They are at your 42. One Hail Mary between you and the trophy.",
      "Overtime, up 7. Fourth and 8 from your 16. Make the stop.",
      "Up 3. 0:51 left. They are on your 28 and out of timeouts.",
    ],
    calls: [
      { id: "jump", label: "Jump the route", detail: "Gamble on the short throw. Beats the quick out." },
      { id: "deep", label: "Stay deep", detail: "Nothing gets over you. Beats the Hail Mary." },
      { id: "blitz", label: "Corner blitz", detail: "Get to the quarterback. Beats max protect." },
    ],
    counters: [
      { label: "Quick out", scout: "Film says they take the sideline route to stop the clock." },
      { label: "Deep shot", scout: "Film says they throw it up and let the receiver go get it." },
      { label: "Max protect", scout: "Film says they keep seven in to block and buy time." },
    ],
    odds: [
      [W, L, N],
      [N, W, L],
      [L, N, W],
    ],
    success: [
      "You jump the throw and take it the other way. Pick, game over.",
      "He throws it up and you are the highest man in the end zone. Ballgame.",
      "Off the edge untouched. Strip-sack as the clock hits zero.",
    ],
    failure: [
      "You jump it and they go over the top. Touchdown, and it is your man.",
      "You bail deep, he has all day, and he finds the hole underneath.",
      "You blitz and the throw goes right where you were. They kick the winner.",
    ],
    statBump: { ints: 1, passBreakups: 1 },
  },
  K: {
    situations: [
      "Tied. 0:02 left. 47 yards. The flags at the top of the stadium are moving.",
      "Down 1. 0:03 left. 52 yards, longer than you have ever hit in a game.",
      "Overtime, down 3. 38 yards to keep the season alive. You have hit it a thousand times.",
      "Down 2. 0:00 on the clock. 44 yards into the open end of the stadium.",
    ],
    calls: [
      { id: "left", label: "Start it left", detail: "Let the wind bring it back. For a gust from the left." },
      { id: "middle", label: "Down the middle", detail: "Trust your leg. For a still night." },
      { id: "right", label: "Start it right", detail: "Ride it back inside. For a gust from the right." },
    ],
    counters: [
      { label: "Gust from the left", scout: "The flags have been snapping left to right all quarter." },
      { label: "Dead calm", scout: "The flags are hanging limp. It is a still night." },
      { label: "Gust from the right", scout: "The flags have been snapping right to left all quarter." },
    ],
    odds: [
      [0.85, 0.45, 0.25],
      [0.5, 0.85, 0.5],
      [0.25, 0.45, 0.85],
    ],
    success: [
      "It starts left, the wind takes it, and it splits the uprights. Your teammates bury you.",
      "Dead centre, nothing on it but leg. It is good from the moment it leaves your foot.",
      "It starts right, bends back, and goes through with room to spare. Ballgame.",
    ],
    failure: [
      "You aim left and the ball stays there. Wide left, all the way.",
      "The wind gets hold of it at the top and pushes it off the upright.",
      "You aim right and nothing brings it back. Wide right.",
    ],
    statBump: { fieldGoals: 1, gameWinners: 1 },
  },
};

const BOWLS: Record<Tier, string[]> = {
  1: ["FCS Playoff Quarterfinal", "FCS Playoff Semifinal"],
  2: ["Cure Bowl", "Frisco Bowl", "Armed Forces Bowl", "New Mexico Bowl", "Boca Raton Bowl"],
  3: ["Gator Bowl", "Citrus Bowl", "Las Vegas Bowl", "Holiday Bowl", "Alamo Bowl"],
  4: ["Rose Bowl", "Sugar Bowl", "Orange Bowl", "Cotton Bowl", "Fiesta Bowl", "Peach Bowl"],
};

// Invented rivalry trophies -- every school gets one, and keeps it.
const RIVALRY_PRIZES = [
  "Brass Lantern", "Cedar Paddle", "Copper Kettle", "Painted Rail", "Old Mailbox", "Iron Horseshoe",
  "Silver Canteen", "Red Lantern", "Pine Gavel", "Tin Badge", "Oak Barrel", "Golden Spike",
];

export function stableIndex(key: string, n: number): number {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return h % n;
}

export function rivalryName(schoolId: string, rivalId: string): string {
  const pair = [schoolId, rivalId].sort().join("|");
  return `Battle for the ${RIVALRY_PRIZES[stableIndex(pair, RIVALRY_PRIZES.length)]}`;
}

export function bigGameName(stakes: BigGameStakes, tier: Tier, conference: string, pick: number): string {
  if (stakes === "cfp") return tier === 1 ? "FCS National Championship" : "National Championship";
  if (stakes === "conf") return conference === "Independent" ? "Playoff Play-In" : `${conference} Championship`;
  if (stakes === "rivalry") return "Rivalry Game";
  const list = BOWLS[tier];
  return list[pick % list.length]!;
}

// The line that sets the stakes before the situation. `{conf}` is the
// school's conference.
export const BIG_GAME_INTRO: Record<BigGameStakes, string[]> = {
  rivalry: [
    "Rivalry week. Lose this one and you hear about it at the gas station until next November.",
    "No bowl this year, but nobody in town cares about that today. This is the one they paint on the barns.",
    "The season is lost and this game is the whole season anyway. Seniors who never beat these guys are playing for it.",
    "A trophy nobody outside the state has heard of, and everybody inside it would trade a bowl for.",
  ],
  bowl: [
    "Bowl game. Neutral site, a sponsor's logo at midfield, and the last tape the scouts see this year.",
    "Bowl game. Half the country is watching on a weekday afternoon, and every one of them will remember the last play.",
    "Bowl week is over and the swag bags are packed. Now it is just sixty minutes and a trophy shaped like a dare.",
    "A bowl in a city you will never come back to. Win it and you take the trophy and the last word into the offseason.",
  ],
  conf: [
    "The {conf} title, on a neutral field with both fan bases split down the fifty. Win it and you hang a banner.",
    "Championship Saturday. The {conf} trophy is on a table by the tunnel, and both teams walked past it on the way out.",
    "Back in the {conf} title game. Last time you were here the whole thing came down to one snap. It will again.",
  ],
  cfp: [
    "The National Championship. Every scout, every network, every kid in a backyard is watching this snap.",
    "National title game. Confetti cannons are loaded in the rafters, and only one sideline gets to see them go off.",
    "Back on the biggest stage there is. The kids who were freshmen the last time you got here are starters now.",
  ],
};

// The trophy a big-game win is worth.
export const BIG_GAME_TROPHY: Record<BigGameStakes, string | null> = {
  rivalry: null,
  bowl: "bowlWin",
  conf: "confTitle",
  cfp: "cfpTitle",
};
