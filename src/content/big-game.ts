import type { BigGameStakes, Position, Tier } from "../engine/types";

// The play that decides the season. The player picks one of three calls, the
// other side has picked one of three of their own, and the matchup sets the
// odds. The film room tips which call the other side favours -- usually right.
export type Side = "offense" | "defense" | "kick";

export interface Playbook {
  side: Side;
  // A line of colour under the scoreboard. The score, clock, down and
  // distance are generated (engine/big-game.ts), so these carry no numbers.
  situations: string[];
  calls: { id: string; label: string; detail: string }[];
  // What the other side can run, and the look each shows before the snap
  // when it is not disguised.
  counters: { label: string; look: string }[];
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
    side: "offense",
    situations: [
      "The whole stadium is on its feet.",
      "Everyone in the building knows you are throwing.",
      "Your center looks back between his legs and nods once.",
      "The crowd is so loud you have to call the play twice.",
    ],
    calls: [
      { id: "slant", label: "Quick slant", detail: "Ball out in a second. Kills a blitz." },
      { id: "draw", label: "QB draw", detail: "Take it yourself. Burns man coverage." },
      { id: "fade", label: "Back-corner fade", detail: "Throw it where only he can get it. Beats a two-high shell." },
    ],
    counters: [
      { label: "Zone blitz", look: "Linebackers creeping into the A-gaps" },
      { label: "Cover 2", look: "Two safeties splitting the deep halves" },
      { label: "Man press", look: "Corners up in your receivers' faces" },
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
    side: "offense",
    situations: [
      "The play is coming to you.",
      "The coordinator looks down the sideline and nods at you.",
      "Nobody else is getting this ball.",
      "The quarterback says your name in the huddle and nothing else.",
    ],
    calls: [
      { id: "bounce", label: "Bounce it outside", detail: "Win the edge. Beats a stacked box." },
      { id: "dive", label: "Hit it downhill", detail: "Straight up the gut. Beats edge contain." },
      { id: "wheel", label: "Wheel route", detail: "Leak out of the backfield. Beats the blitz." },
    ],
    counters: [
      { label: "Stacked box", look: "Eight defenders inside the tackles" },
      { label: "Edge contain", look: "Ends lined up wide, outside the tackles" },
      { label: "All-out blitz", look: "Everybody walked up to the line" },
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
    side: "offense",
    situations: [
      "They are daring you to run it.",
      "The coach keeps the offense on the field and points at the line.",
      "Everybody in the stadium knows it is a run. Block it anyway.",
      "The running back taps your hip on the way to the huddle.",
    ],
    calls: [
      { id: "double", label: "Double the nose", detail: "Move the big man. Beats a stunt inside." },
      { id: "pull", label: "Pull and lead", detail: "Get out in front. Beats an inside slant." },
      { id: "reach", label: "Reach the edge", detail: "Seal the outside. Beats a loaded middle." },
    ],
    counters: [
      { label: "Interior stunt", look: "Tackles shading the guards' inside shoulders" },
      { label: "Slant inside", look: "The whole front leaning to the strong side" },
      { label: "Load the middle", look: "Two linebackers stacked over the center" },
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
      "Somebody comes right through the gap you left. Stopped short.",
      "Your man beats the reach and the back is dropped for a loss.",
    ],
    statBump: { pancakes: 3 },
  },
  DL: {
    side: "defense",
    situations: [
      "One stop wins it.",
      "Their quarterback has not been touched all night.",
      "The defensive coordinator gives you one word: go.",
      "Your whole sideline is standing on the bench.",
    ],
    calls: [
      { id: "bull", label: "Bull rush", detail: "Through the man's chest. Beats a deep drop." },
      { id: "speed", label: "Speed rush", detail: "Bend the edge. Beats a quick run." },
      { id: "drop", label: "Drop into the flat", detail: "Sit and wait. Beats the screen." },
    ],
    counters: [
      { label: "Deep drop", look: "Quarterback in the gun, five receivers wide" },
      { label: "Quick draw", look: "A back offset tight next to the quarterback" },
      { label: "Screen", look: "Linemen standing up light, the back flared out" },
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
    side: "defense",
    situations: [
      "One last shot, and it is coming your way.",
      "Their best receiver lines up across from you and smiles.",
      "Make the stop and it is over.",
      "Their quarterback looks right at you before the snap.",
    ],
    calls: [
      { id: "jump", label: "Jump the route", detail: "Gamble on the short throw. Beats the quick out." },
      { id: "deep", label: "Stay deep", detail: "Nothing gets over you. Beats the Hail Mary." },
      { id: "blitz", label: "Corner blitz", detail: "Get to the quarterback. Beats max protect." },
    ],
    counters: [
      { label: "Quick out", look: "Receivers in tight splits near the sideline" },
      { label: "Deep shot", look: "Their fastest receiver isolated outside" },
      { label: "Max protect", look: "Tight end and back staying in to block" },
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
    side: "kick",
    situations: [
      "They call timeout to ice you. You get to think about it.",
      "Your holder says something to make you laugh. It almost works.",
      "The open end of the stadium, and the wind is doing something.",
      "You have hit this kick a thousand times. Never like this.",
    ],
    calls: [
      { id: "left", label: "Start it left", detail: "Let the wind bring it back. For a gust from the left." },
      { id: "middle", label: "Down the middle", detail: "Trust your leg. For a still night." },
      { id: "right", label: "Start it right", detail: "Ride it back inside. For a gust from the right." },
    ],
    counters: [
      { label: "Gust from the left", look: "Flags at the top of the stadium snapping left to right" },
      { label: "Dead calm", look: "Flags hanging limp on the poles" },
      { label: "Gust from the right", look: "Flags at the top of the stadium snapping right to left" },
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
