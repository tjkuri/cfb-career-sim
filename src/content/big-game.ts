import type { BigGameStakes, Position, Tier } from "../engine/types";

// The play that decides the season. The player picks one of three calls, the
// other side has picked one of three of their own, and the matchup sets the
// odds. The film room tips which call the other side favours -- usually right.
export type Side = "offense" | "defense" | "kick";

// Where on the field the season's last snap happens. Each position has a
// package per situation, so the menu of plays changes with the spot.
export type Situation =
  | "redzone" | "lastgasp" // QB, RB/WR
  | "goalline" | "protect" // OL
  | "stop" | "goalstand" // DL
  | "cover" | "hailmary" // LB/DB
  | "fieldgoal" | "chipshot"; // K

export interface Playbook {
  side: Side;
  situation: Situation;
  /** A short name for the package, shown on the scoreboard bug. */
  name: string;
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

const FIRST_PACKAGES: Record<Position, Playbook> = {
  QB: {
    situation: "redzone",
    name: "Red zone",
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
    situation: "redzone",
    name: "Red zone",
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
    situation: "goalline",
    name: "Goal line",
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
    situation: "stop",
    name: "Final stand",
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
    situation: "cover",
    name: "Final stand",
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
    situation: "fieldgoal",
    name: "Game-winner",
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

// A second situation per position, so the menu changes from game to game.
const SECOND_PACKAGES: Record<Position, Playbook> = {
  QB: {
    situation: "lastgasp",
    name: "Last gasp",
    side: "offense",
    situations: [
      "One snap left, and it has to go all the way.",
      "The whole sideline has their hands on their helmets.",
      "Your receivers are already looking at you for the call.",
      "The other team is so deep you can barely see their safeties.",
    ],
    calls: [
      { id: "verticals", label: "Four verticals", detail: "Everybody deep. Beats a single high safety." },
      { id: "hook-lateral", label: "Hook and lateral", detail: "Hit the curl, pitch it behind. Beats prevent." },
      { id: "scramble", label: "Scramble drill", detail: "Buy time and find somebody. Beats the blitz." },
    ],
    counters: [
      { label: "Prevent", look: "Safeties twenty-five yards deep, corners way off" },
      { label: "Cover 1 robber", look: "One safety deep, everyone else locked on a man" },
      { label: "All-out blitz", look: "Seven defenders crowding the line" },
    ],
    odds: [
      [L, W, N],
      [W, N, L],
      [N, L, W],
    ],
    success: [
      "Four men go deep and the lone safety can only take one. You find the other.",
      "The curl, the pitch, and the trailer is gone before the prevent can turn around.",
      "You slip the first rusher, roll right, and find your guy waving in the end zone.",
    ],
    failure: [
      "Everybody is covered deep. Your heave dies in a crowd of jerseys.",
      "The pitch is behind him and rolls loose. Ballgame, the wrong way.",
      "The spy never leaves you. You run out of field and out of time.",
    ],
    statBump: { passYards: 45, passTds: 1 },
  },
  OSKILL: {
    situation: "lastgasp",
    name: "Last gasp",
    side: "offense",
    situations: [
      "One snap left, and the ball is coming to you.",
      "The quarterback looks at you in the huddle and says go make a play.",
      "Nobody on the sideline is sitting down.",
      "You have been waiting all game for one clean look.",
    ],
    calls: [
      { id: "go-route", label: "Go route", detail: "Beat the jam and run. Beats press man." },
      { id: "slant-run", label: "Slant and run", detail: "Catch it short, make a man miss. Beats a soft zone." },
      { id: "screen", label: "Screen", detail: "Let them come, then go behind your blockers. Beats the blitz." },
    ],
    counters: [
      { label: "Press man", look: "The corner nose to nose with you at the line" },
      { label: "Soft zone", look: "Corners and safeties backed off fifteen yards" },
      { label: "All-out blitz", look: "Linebackers creeping up into the line" },
    ],
    odds: [
      [W, L, N],
      [N, W, L],
      [L, N, W],
    ],
    success: [
      "You swat his hands off at the line and there is nobody within five yards when it comes down.",
      "You catch the slant in stride, make the first man miss, and the rest is a footrace you win.",
      "They all come, you slip out behind them, and three blockers are waiting in front of you.",
    ],
    failure: [
      "He gets his hands on you at the line and the timing is gone.",
      "You catch it and turn right into a safety who read it all the way.",
      "They sniff out the screen and you are swarmed before you can turn.",
    ],
    statBump: { scrimmageYards: 40, totalTds: 1 },
  },
  OL: {
    situation: "protect",
    name: "Last gasp",
    side: "offense",
    situations: [
      "One shot at the end zone, and the quarterback needs time.",
      "The quarterback says it in the huddle: give me four seconds.",
      "Every rusher they have is coming. Hold them.",
      "The center looks down the line at you and nods.",
    ],
    calls: [
      { id: "slide-left", label: "Slide left", detail: "Shift the whole line left. Beats a left-side overload." },
      { id: "slide-right", label: "Slide right", detail: "Shift the whole line right. Beats a right-side overload." },
      { id: "max-protect", label: "Keep the back in", detail: "Seven to block. Beats a four-man rush with a spy." },
    ],
    counters: [
      { label: "Overload left", look: "Three rushers stacked off your left edge" },
      { label: "Overload right", look: "Three rushers stacked off your right edge" },
      { label: "Four-man rush and a spy", look: "Four down linemen and a linebacker hanging at the line" },
    ],
    odds: [
      [W, L, N],
      [L, W, N],
      [N, N, W],
    ],
    success: [
      "The overload walks right into the slide. The quarterback has all day and throws it to the end zone.",
      "You pick up the extra rusher on the right and the pocket holds. Touchdown.",
      "Seven men to block four. The quarterback could have made a sandwich.",
    ],
    failure: [
      "You slide left and they come from the right. The quarterback never sees him.",
      "You slide right and they come from the left. Sack, game over.",
      "Seven to block and nobody open. The quarterback holds it until the spy gets him.",
    ],
    statBump: { pancakes: 3 },
  },
  DL: {
    situation: "goalstand",
    name: "Goal-line stand",
    side: "defense",
    situations: [
      "They are inches from the end zone. Do not give them the inches.",
      "Fourth down, and they are coming right at you.",
      "The whole defense is down in four-point stances.",
      "Your coordinator just says it: win the line.",
    ],
    calls: [
      { id: "fire-the-gap", label: "Fire the gap", detail: "Get into the backfield first. Beats a pulling guard." },
      { id: "anchor", label: "Anchor down", detail: "Win the low man and hold your ground. Beats the sneak." },
      { id: "contain", label: "Set the edge", detail: "Stay outside and squeeze. Beats the bootleg." },
    ],
    counters: [
      { label: "QB sneak", look: "Quarterback under center, everybody packed tight" },
      { label: "Power", look: "A fullback and a guard leaning like he is about to pull" },
      { label: "Bootleg", look: "Tight end flexed out, the quarterback a step deeper" },
    ],
    odds: [
      [N, W, L],
      [W, L, N],
      [L, N, W],
    ],
    success: [
      "You are in the backfield before the guard finishes pulling. Loss of two.",
      "The quarterback runs into you like a wall. The pile does not move.",
      "He fakes it and rolls out, and you are already there waiting. Down at the two.",
    ],
    failure: [
      "You fire the gap and they run right where you left. Touchdown.",
      "You anchor down and the pull goes around you. They walk in.",
      "You stay outside and the sneak goes right up the middle.",
    ],
    statBump: { tfls: 1, tackles: 2 },
  },
  DSKILL: {
    situation: "hailmary",
    name: "Hail Mary",
    side: "defense",
    situations: [
      "One play left. Everything they have is going deep.",
      "Their quarterback is warming up his arm on the sideline.",
      "Your coach is screaming one word at the secondary: deep.",
      "The whole stadium is on its feet for the last play.",
    ],
    calls: [
      { id: "box-out", label: "Box out at the goal line", detail: "Highest man wins. Beats the jump ball." },
      { id: "rally", label: "Rally underneath", detail: "Come up and make the tackle. Beats the hook and lateral." },
      { id: "spy", label: "Spy the quarterback", detail: "Mirror him the whole way. Beats the scramble." },
    ],
    counters: [
      { label: "Jump ball", look: "Four receivers bunched to one side, all going deep" },
      { label: "Hook and lateral", look: "Two receivers stacked tight, close enough to pitch" },
      { label: "QB scramble", look: "The quarterback already shuffling toward the sideline" },
    ],
    odds: [
      [W, L, N],
      [N, W, L],
      [L, N, W],
    ],
    success: [
      "You box out, go up, and knock it down at the goal line. Ballgame.",
      "You read the pitch and hit the trailer before he takes a step.",
      "He breaks the pocket and you are right there in his face. He throws it away.",
    ],
    failure: [
      "You box out the wrong man and it comes down in somebody else's hands.",
      "You come up and they pitch it right past you.",
      "You sit on him and he finds the man you left. Touchdown.",
    ],
    statBump: { passBreakups: 1, tackles: 2 },
  },
  K: {
    situation: "chipshot",
    name: "Chip shot",
    side: "kick",
    situations: [
      "A chip shot. They are going to throw everything at blocking it.",
      "They called timeout to make you think. You are thinking.",
      "Their best leaper is lining up across from you.",
      "Short enough to make in your sleep, if it gets off.",
    ],
    calls: [
      { id: "high", label: "Get it up fast", detail: "Steep and quick. Beats the edge rush." },
      { id: "line-drive", label: "Line drive", detail: "Low and hard over the middle. Beats the leaper." },
      { id: "normal", label: "Your normal kick", detail: "Full routine. Beats a team that drops back." },
    ],
    counters: [
      { label: "Edge rush", look: "Two rushers lined up wide off each edge" },
      { label: "Middle surge", look: "Their biggest linemen and a leaper stacked over your center" },
      { label: "Drop back", look: "Their rushers backing off the line" },
    ],
    odds: [
      [0.85, 0.35, 0.6],
      [0.6, 0.85, 0.35],
      [0.35, 0.6, 0.85],
    ],
    success: [
      "It is up and over the edge rushers before they leave their feet. Good.",
      "Low and hard, under the leaper's hands and over the bar. Good.",
      "Nobody comes, you take your time, and it splits the uprights.",
    ],
    failure: [
      "Too steep, too short. It barely clears the line and drops like a stone.",
      "The leaper gets a fingertip on it and it wobbles wide.",
      "You rush it for no reason and hook it left.",
    ],
    statBump: { fieldGoals: 1, gameWinners: 1 },
  },
};

export const PLAYBOOKS: Record<Position, Playbook[]> = Object.fromEntries(
  (Object.keys(FIRST_PACKAGES) as Position[]).map((p) => [p, [FIRST_PACKAGES[p], SECOND_PACKAGES[p]]]),
) as Record<Position, Playbook[]>;

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
