import type { Position, Spot } from "../../engine/index";

// Field coordinates for the telestrator. x runs sideline to sideline (0 to
// 53.3 yards); y is yards past the line of scrimmage toward the end zone the
// offense is attacking. The goal line sits at y = spot.yardsToGoal.
//
// The engine decides whether the snap worked. This module only stages it:
// where everyone lines up, the look the other side shows, and how the play
// unfolds so the picture agrees with the result.

export const MID = 26.65;
export type Pt = [number, number];
type Key = [number, number, number]; // t, x, y

export interface Mover {
  id: string;
  side: "O" | "D";
  ours: boolean;
  you?: boolean;
  path: Key[];
  tackler?: boolean;
}

export interface Snap {
  position: Position;
  /** Which situation package: 0 is the first, 1 the second. */
  pkg: number;
  spot: Spot;
  mine: number; // our call
  theirs: number; // their real call
  look: number; // the call their pre-snap look shows
  won: boolean;
  strong: boolean; // our call beat theirs
}

export interface Play {
  movers: Mover[];
  ball: (t: number) => [number, number, number];
  carrier: string; // whose path the telestrator inks
  you: string;
  label: string; // what happened, for screen readers when the snap is over
  flags?: { look: number; real: number }; // the kicker's wind: -1 left gust, 0 calm, 1 right gust
  kick?: boolean; // ink the ball's flight rather than a runner's path
  deep?: boolean; // a shot at the end zone from far out: frame all of it
}

function smooth(a: number): number {
  return a * a * (3 - 2 * a);
}

export function at(path: Key[], t: number): Pt {
  const first = path[0]!;
  if (t <= first[0]) return [first[1], first[2]];
  for (let i = 1; i < path.length; i++) {
    const k = path[i]!;
    if (t <= k[0]) {
      const p = path[i - 1]!;
      const a = smooth((t - p[0]) / Math.max(1e-6, k[0] - p[0]));
      return [p[1] + (k[1] - p[1]) * a, p[2] + (k[2] - p[2]) * a];
    }
  }
  const last = path[path.length - 1]!;
  return [last[1], last[2]];
}

// --- building blocks ---------------------------------------------------------

type Formation = Record<string, Pt>;

class Stage {
  movers: Mover[] = [];
  constructor(readonly snap: Snap) {}

  add(id: string, side: "O" | "D", ours: boolean, look: Pt, real: Pt, ...keys: Key[]) {
    const path: Key[] = [[0, ...look]];
    if (look[0] !== real[0] || look[1] !== real[1]) path.push([0.12, ...real]);
    for (const k of keys) if (k[0] > path[path.length - 1]![0]) path.push(k);
    const m: Mover = { id, side, ours, path };
    this.movers.push(m);
    return m;
  }

  get(id: string): Mover {
    return this.movers.find((m) => m.id === id)!;
  }

  /** The nearest of `pool` gets to `pt` at time `t`. */
  converge(pool: Mover[], t: number, pt: Pt, preferred?: Mover): Mover {
    let best = preferred;
    if (!best) {
      let d = Infinity;
      for (const m of pool) {
        const [x, y] = at(m.path, t - 0.1);
        const dd = Math.hypot(x - pt[0], y - pt[1]);
        if (dd < d) {
          d = dd;
          best = m;
        }
      }
    }
    const m = best!;
    m.path = m.path.filter((k) => k[0] < t - 0.12);
    m.path.push([t, pt[0] + 0.9, pt[1] + 0.5], [1, pt[0] + 1.1, pt[1] + 0.6]);
    m.tackler = true;
    return m;
  }
}

/** A path offset from another mover's, a little behind it: man coverage. */
function shadow(target: Mover, dx: number, dy: number, lag = 0.05): Key[] {
  return target.path.filter((k) => k[0] > 0.12).map(([t, x, y]) => [Math.min(1, t + lag), x + dx, y + dy] as Key);
}

/** Carried the whole way by one mover. */
function carried(m: Mover, z = 1.1) {
  return (t: number): [number, number, number] => {
    const [x, y] = at(m.path, t);
    return [x, y, z];
  };
}

/** Held, thrown on an arc, then carried by the receiver, or knocked loose. */
function thrown(o: {
  passer: Mover;
  throwT: number;
  catchT: number;
  to: Pt;
  peak: number;
  then?: Mover; // who has it after the catch
  loose?: { t: number; at: Pt }; // incomplete: it ends on the ground here
}) {
  return (t: number): [number, number, number] => {
    if (t < o.throwT) {
      const [x, y] = at(o.passer.path, t);
      return [x, y, 1.6];
    }
    if (t < o.catchT) {
      const [sx, sy] = at(o.passer.path, o.throwT);
      const k = (t - o.throwT) / (o.catchT - o.throwT);
      return [sx + (o.to[0] - sx) * k, sy + (o.to[1] - sy) * k, 1.6 + o.peak * 4 * k * (1 - k)];
    }
    if (o.loose) {
      const k = Math.min(1, (t - o.catchT) / Math.max(0.01, o.loose.t - o.catchT));
      return [o.to[0] + (o.loose.at[0] - o.to[0]) * k, o.to[1] + (o.loose.at[1] - o.to[1]) * k, 1.6 * (1 - k) + 0.15];
    }
    const [x, y] = at((o.then ?? o.passer).path, t);
    return [x, y, 1.1];
  };
}

const end = (G: number, extra = 2.5) => G + Math.min(extra, 8);

// --- offense ----------------------------------------------------------------

const SHOTGUN: Formation = {
  LT: [22.4, -1], LG: [24.5, -1], C: [MID, -1], RG: [28.8, -1], RT: [30.9, -1], TE: [33.2, -1.2],
  QB: [MID, -5], RB: [29.2, -5], X: [6, -1], SL: [40, -1.5], Z: [47.5, -1],
};
const LINE: Formation = { DE1: [21.5, 1], DT1: [25, 1], DT2: [28.3, 1], DE2: [32, 1] };
const PASS_D: Formation[] = [
  { ...LINE, LB1: [25.6, 2.2], LB2: [28, 2.2], CB1: [6, 3], CB2: [47.5, 3], NB: [40, 3], S1: [20, 4.5], S2: [33, 4.5] },
  { ...LINE, LB1: [22, 5], LB2: [31, 5], CB1: [7, 2.5], CB2: [46.5, 2.5], NB: [39, 5], S1: [13, 12], S2: [41, 12] },
  { ...LINE, LB1: [24.5, 4], LB2: [29, 4], CB1: [6, 0.9], CB2: [47.5, 0.9], NB: [40, 0.9], S1: [MID, 13], S2: [33, 7] },
];

function blockers(st: Stage, f: Formation, ours: boolean, dy: number) {
  for (const id of ["LT", "LG", "C", "RG", "RT"]) {
    const p = f[id]!;
    st.add(id, "O", ours, p, p, [0.3, p[0], p[1] + dy]);
  }
}

function qb(snap: Snap): Play {
  const st = new Stage(snap);
  const G = snap.spot.yardsToGoal;
  const f = SHOTGUN;
  blockers(st, f, true, -0.4);
  st.add("TE", "O", true, f.TE!, f.TE!, [0.3, 33.5, -0.6]);
  const short = Math.min(8, G - 0.5);

  let ball: Play["ball"];
  let carrier = "QB";
  let stop: { t: number; at: Pt } | null = null;
  let label: string;
  if (snap.mine === 0) {
    const Q = st.add("QB", "O", true, f.QB!, f.QB!, [0.2, MID, -6]);
    st.add("RB", "O", true, f.RB!, f.RB!, [0.3, 28, -3]);
    const X = st.add("X", "O", true, f.X!, f.X!, [0.28, 8, Math.min(3, short)], [0.5, 15, short], ...(snap.won ? [[0.88, 20, end(G)] as Key] : [[0.6, 15.4, short + 0.3] as Key]));
    st.add("SL", "O", true, f.SL!, f.SL!, [0.4, 40, 6], [0.8, 37, G + 2]);
    st.add("Z", "O", true, f.Z!, f.Z!, [0.4, 47.5, 8], [0.8, 47, G + 3]);
    carrier = "X";
    ball = thrown({ passer: Q, throwT: 0.3, catchT: 0.5, to: [15, short], peak: 2, then: X, loose: snap.won ? undefined : { t: 0.64, at: [13, short - 2] } });
    if (!snap.won) stop = { t: 0.52, at: [15, short] };
    label = snap.won ? "TOUCHDOWN" : "BROKEN UP";
  } else if (snap.mine === 1) {
    const short = Math.min(2.4, snap.spot.toGo - 1);
    const Q = st.add("QB", "O", true, f.QB!, f.QB!, [0.18, MID, -6.5], [0.42, 27, Math.min(0, short - 0.5)], ...(snap.won ? [[0.88, 25.5, end(G)] as Key] : [[0.56, 27.2, short] as Key]));
    st.add("RB", "O", true, f.RB!, f.RB!, [0.3, 30, -2]);
    for (const id of ["X", "SL", "Z"]) st.add(id, "O", true, f[id]!, f[id]!, [0.6, f[id]![0], 11]);
    ball = carried(Q);
    if (!snap.won) stop = { t: 0.56, at: [27.2, Math.min(2.4, snap.spot.toGo - 1)] };
    label = snap.won ? "TOUCHDOWN" : "STUFFED";
  } else {
    // Smash: Z sits down on a hitch, the slot breaks for the back pylon.
    const Q = st.add("QB", "O", true, f.QB!, f.QB!, [0.3, MID, -7]);
    st.add("RB", "O", true, f.RB!, f.RB!, [0.3, 28, -3]);
    const deep = G + 4;
    st.add("Z", "O", true, f.Z!, f.Z!, [0.35, 47.5, Math.min(5, G - 0.5)]);
    const S = st.add("SL", "O", true, f.SL!, f.SL!, [0.35, 41, Math.min(6, G)], [0.78, 49.5, deep], [0.88, snap.won ? 50.3 : 49, deep + (snap.won ? 0.6 : -0.6)]);
    st.add("X", "O", true, f.X!, f.X!, [0.4, 7, 8], [0.75, 12, G + 1]);
    carrier = "SL";
    ball = thrown({ passer: Q, throwT: 0.4, catchT: 0.78, to: [49.5, deep], peak: 7, then: S, loose: snap.won ? undefined : { t: 0.92, at: [47.5, deep - 3] } });
    if (!snap.won) stop = { t: 0.8, at: [49.2, deep - 0.4] };
    label = snap.won ? "TOUCHDOWN" : "INCOMPLETE";
  }

  passDefense(st, snap, G);
  if (stop) st.converge(st.movers.filter((m) => m.side === "D"), stop.t, stop.at);
  st.get("QB").you = true;
  return { movers: st.movers, ball, carrier, you: "QB", label };
}

/** The defense's three pass calls, starting from the look they showed: Cover 0
 * blitz, Cover 2, Cover 1 press. Whoever has no move here plays man. */
function passDefense(st: Stage, snap: Snap, G: number) {
  const look = PASS_D[snap.look]!;
  const real = PASS_D[snap.theirs]!;
  const deep = Math.min(G + 6, G + 9);
  const moves: Record<string, Key[]>[] = [
    {
      DE1: [[0.5, 23, -3]], DT1: [[0.5, 25.5, -2]], DT2: [[0.5, 28, -2]], DE2: [[0.5, 30.5, -3]],
      LB1: [[0.42, 26, -4.5]], LB2: [[0.42, 27.5, -4.5]],
      S1: [[0.5, 24, -3]], S2: [[0.6, 31, 2]],
    },
    {
      DE1: [[0.6, 23.5, -1.5]], DT1: [[0.6, 25.5, -1]], DT2: [[0.6, 28, -1]], DE2: [[0.6, 30, -1.5]],
      LB1: [[0.7, 21, 8]], LB2: [[0.7, 32, 8]],
      CB1: [[0.6, 9, 4]], CB2: [[0.6, 45, 4]], NB: [[0.7, 38, 8]], S1: [[0.85, 13, deep]], S2: [[0.85, 47, deep]],
    },
    {
      DE1: [[0.55, 23.5, -2]], DT1: [[0.55, 25.5, -1.5]], DT2: [[0.55, 28, -1.5]], DE2: [[0.55, 30, -2]],
      LB1: [[0.5, 26, 1]], LB2: [[0.5, 29, 2]],
      S1: [[0.8, MID, deep]], S2: [[0.6, 31, 9]],
    },
  ];
  const m = moves[snap.theirs]!;
  for (const id of ["DE1", "DT1", "DT2", "DE2", "LB1", "LB2", "CB1", "CB2", "NB", "S1", "S2"]) {
    let keys = m[id];
    if (!keys) {
      const target = id === "CB1" ? "X" : id === "CB2" ? "Z" : "SL";
      keys = shadow(st.get(target), id === "CB1" ? 0.9 : -0.9, 0.8);
    }
    st.add(id, "D", false, look[id]!, real[id]!, ...keys);
  }
}

// RB/WR: the play comes to you out of the backfield.
const RUN_D: Formation[] = [
  { ...LINE, LB1: [24, 3.5], LB2: [29, 3.5], S2: [30.5, 5.5], NB: [33.5, 3], CB1: [7, 5], CB2: [46.5, 5], S1: [MID, 11] },
  { DE1: [19, 1], DT1: [25, 1], DT2: [28.3, 1], DE2: [34.5, 1], LB1: [23, 4.5], LB2: [30, 4.5], CB1: [7, 5], CB2: [46.5, 5], NB: [40, 5], S1: [17, 11], S2: [36, 11] },
  { ...LINE, LB1: [24.5, 1.5], LB2: [29, 1.5], NB: [38, 1.5], S1: [20, 2.5], S2: [33, 2.5], CB1: [6, 1], CB2: [47.5, 1] },
];

function skill(snap: Snap): Play {
  const st = new Stage(snap);
  const G = snap.spot.yardsToGoal;
  const f = SHOTGUN;
  blockers(st, f, true, 0.4);
  st.add("TE", "O", true, f.TE!, f.TE!, [0.3, 34, 0.5]);
  for (const id of ["X", "SL", "Z"]) st.add(id, "O", true, f[id]!, f[id]!, [0.6, f[id]![0], 8]);
  const Q = st.add("QB", "O", true, f.QB!, f.QB!, [0.25, MID, -5.5]);

  let R: Mover;
  let ball: Play["ball"];
  let stop: { t: number; at: Pt } | null = null;
  if (snap.mine === 0) {
    // Bounce it outside
    const sticks = Math.min(1.2, snap.spot.toGo - 1);
    R = st.add("RB", "O", true, f.RB!, f.RB!, [0.25, 31, -3], [0.45, 38, Math.min(0, sticks)], ...(snap.won ? [[0.9, 44, end(G)] as Key] : [[0.56, 39.5, sticks] as Key]));
    ball = (t) => (t < 0.2 ? [...at(Q.path, t), 1.4] : carried(R)(t)) as [number, number, number];
    if (!snap.won) stop = { t: 0.56, at: [39.5, sticks] };
  } else if (snap.mine === 1) {
    // Hit it downhill
    const sticks = Math.min(1.2, snap.spot.toGo - 1);
    R = st.add("RB", "O", true, f.RB!, f.RB!, [0.25, 28, -2], [0.4, 27.5, Math.min(0.8, sticks)], ...(snap.won ? [[0.85, 27, end(G)] as Key] : [[0.48, 27.5, sticks] as Key]));
    ball = (t) => (t < 0.2 ? [...at(Q.path, t), 1.4] : carried(R)(t)) as [number, number, number];
    if (!snap.won) stop = { t: 0.48, at: [27.5, sticks] };
  } else {
    // Wheel route out of the backfield
    const catchY = Math.min(6, G - 1);
    R = st.add("RB", "O", true, f.RB!, f.RB!, [0.25, 34, -3], [0.45, 39, 1], [0.66, 40, catchY], ...(snap.won ? [[0.9, 41, end(G)] as Key] : [[0.74, 40.4, catchY + 0.3] as Key]));
    ball = thrown({ passer: Q, throwT: 0.42, catchT: 0.66, to: [40, catchY], peak: 4, then: R, loose: snap.won ? undefined : { t: 0.8, at: [42, catchY - 2] } });
    if (!snap.won) stop = { t: 0.68, at: [40, catchY] };
  }

  const look = RUN_D[snap.look]!;
  const real = RUN_D[snap.theirs]!;
  const rbStart = f.RB!;
  for (const id of ["DE1", "DT1", "DT2", "DE2", "LB1", "LB2", "CB1", "CB2", "NB", "S1", "S2"]) {
    const r = real[id]!;
    let keys: Key[];
    if (snap.theirs === 2) keys = [[0.5, (r[0] + rbStart[0]) / 2, -2.5]]; // everybody comes
    else if (snap.theirs === 1 && (id === "DE1" || id === "DE2")) keys = [[0.5, id === "DE1" ? 20 : 34, -1]]; // set the edge
    else if (id.startsWith("D")) keys = [[0.5, r[0], -0.8]];
    else if (id.startsWith("LB") || id === "S2") keys = [[0.55, (r[0] + 28) / 2, 1.5]];
    else keys = [[0.8, r[0], r[1] + 3]];
    st.add(id, "D", false, look[id]!, r, ...keys);
  }
  if (stop) st.converge(st.movers.filter((m) => m.side === "D"), stop.t, stop.at);
  R.you = true;
  return { movers: st.movers, ball, carrier: "RB", you: "RB", label: snap.won ? "TOUCHDOWN" : "STOPPED" };
}

// OL: fourth and short at the goal line, out of the I.
const GOAL_LINE: Formation = {
  LT: [22.4, -1], LG: [24.5, -1], C: [MID, -1], RG: [28.8, -1], RT: [30.9, -1], TE: [33.2, -1], TE2: [20.1, -1],
  QB: [MID, -1.7], FB: [MID, -4], RB: [MID, -6.5], X: [8, -1],
};
const GL_D: Formation[] = [
  { DE1: [19, 0.8], DT1: [25.2, 0.8], DT2: [28.1, 0.8], DE2: [34.5, 0.8], DL5: [22.5, 0.8], DL6: [31.2, 0.8], LB1: [24, 3], LB2: [29.3, 3], CB1: [8, 1], CB2: [45, 1], S1: [MID, 6] },
  { DE1: [20.5, 0.8], DT1: [26, 0.8], DT2: [29.6, 0.8], DE2: [36, 0.8], DL5: [24, 0.8], DL6: [32.7, 0.8], LB1: [25.5, 3], LB2: [30.8, 3], CB1: [8, 1], CB2: [45, 1], S1: [MID, 6] },
  { DE1: [19, 0.8], DT1: [24.4, 0.8], DT2: [28.9, 0.8], DE2: [34.5, 0.8], DL5: [22, 0.8], DL6: [31.6, 0.8], LB1: [MID, 2.4], LB2: [MID, 4.2], CB1: [8, 1], CB2: [45, 1], S1: [MID, 6] },
];

function line(snap: Snap): Play {
  const st = new Stage(snap);
  const G = snap.spot.yardsToGoal;
  const f = GOAL_LINE;
  const lanes = [27.2, 20, 33.5];
  const lane = lanes[snap.mine]!;
  for (const id of ["LT", "LG", "C", "RT", "TE", "TE2"]) {
    const p = f[id]!;
    st.add(id, "O", true, p, p, [0.35, p[0] + (lane - MID) * 0.06, p[1] + 1.2]);
  }
  // You: double the nose, pull and lead, or reach the edge.
  const you = snap.mine === 0
    ? st.add("RG", "O", true, f.RG!, f.RG!, [0.3, 27.6, 0.6], [0.6, 27.4, 1.6])
    : snap.mine === 1
      ? st.add("RG", "O", true, f.RG!, f.RG!, [0.22, 26, -2.6], [0.42, 20.8, -0.8], [0.62, 20.3, Math.min(G, 2.2)])
      : st.add("RG", "O", true, f.RG!, f.RG!, [0.35, 32, 0.4], [0.6, 32.8, 1.4]);
  you.you = true;
  st.add("QB", "O", true, f.QB!, f.QB!, [0.2, MID - 0.6, -3]);
  st.add("FB", "O", true, f.FB!, f.FB!, [0.35, lane, 0.4]);
  st.add("X", "O", true, f.X!, f.X!, [0.6, 9, 4]);
  const finish = snap.won ? end(G, 1.5) : -0.3;
  const R = st.add("RB", "O", true, f.RB!, f.RB!, [0.3, lane - 0.2, -1.6], [snap.won ? 0.72 : 0.45, lane, finish]);
  const Q = st.get("QB");
  const ball = (t: number): [number, number, number] => (t < 0.22 ? [...at(Q.path, t), 1.2] : carried(R)(t)) as [number, number, number];

  const look = GL_D[snap.look]!;
  const real = GL_D[snap.theirs]!;
  for (const id of Object.keys(real)) {
    const r = real[id]!;
    let keys: Key[] = [[0.45, r[0], -0.6]];
    if (snap.theirs === 0 && id === "DT1") keys = [[0.4, 28.4, -0.4]]; // the twist
    if (snap.theirs === 0 && id === "DT2") keys = [[0.4, 24.8, -0.4]];
    if (snap.theirs === 1) keys = [[0.45, r[0] + 2, -0.6]]; // slant to the strength
    if (id.startsWith("LB") || id === "S1") keys = [[0.5, (r[0] + lane) / 2, 1]];
    if (id.startsWith("CB")) keys = [[0.6, r[0], 3]];
    st.add(id, "D", false, look[id]!, r, ...keys);
  }
  if (!snap.won) st.converge(st.movers.filter((m) => m.side === "D"), 0.45, [lane, -0.3]);
  return { movers: st.movers, ball, carrier: "RB", you: "RG", label: snap.won ? "TOUCHDOWN" : "STUFFED" };
}

// --- defense ----------------------------------------------------------------

// What the offense shows you, by the call it represents.
const PASS_LOOKS: Formation[] = [
  // Deep drop: shotgun, five wide
  { ...pick(SHOTGUN, ["LT", "LG", "C", "RG", "RT", "QB", "X", "SL", "Z"]), TE: [35.5, -1], RB: [17, -1.2] },
  // Draw: a back offset tight to the quarterback
  { ...pick(SHOTGUN, ["LT", "LG", "C", "RG", "RT", "QB", "X", "SL", "Z", "TE"]), RB: [28.3, -4.6] },
  // Screen: linemen light, the back flared
  {
    LT: [22.4, -1.6], LG: [24.5, -1.6], C: [MID, -1.4], RG: [28.8, -1.6], RT: [30.9, -1.6],
    TE: [33.2, -1.2], QB: [MID, -5], RB: [33.8, -5.5], X: [6, -1], SL: [40, -1.5], Z: [47.5, -1],
  },
];

function pick(f: Formation, ids: string[]): Formation {
  return Object.fromEntries(ids.map((id) => [id, f[id]!]));
}

const OUR_D: Formation = {
  DE1: [21.5, 1], DT1: [25, 1], DT2: [28.3, 1], DE2: [32, 1], LB1: [24, 4.5], LB2: [29.5, 4.5],
  CB1: [6, 3.5], CB2: [47.5, 3.5], NB: [40, 4], S1: [17, 11], S2: [36, 11],
};

function edge(snap: Snap): Play {
  const st = new Stage(snap);
  const G = snap.spot.yardsToGoal;
  const look = PASS_LOOKS[snap.look]!;
  const real = PASS_LOOKS[snap.theirs]!;
  const ids = Object.keys(real);
  const offense: Record<string, Mover> = {};

  // Their play
  const qbDrop: Key[] = snap.theirs === 0 ? [[0.35, MID, -8]] : [[0.2, MID, -6]];
  for (const id of ids) {
    const r = real[id]!;
    let keys: Key[] = [[0.3, r[0], r[1] - 0.6]];
    if (id === "QB") keys = qbDrop;
    if (["X", "SL", "Z", "TE"].includes(id) || (snap.theirs === 0 && id === "RB")) keys = [[0.55, r[0], Math.min(r[1] + 10, G + 4)]];
    offense[id] = st.add(id, "O", false, look[id]!, r, ...keys);
  }

  let carrier: string;
  let ball: Play["ball"];
  let stopAt: Pt;
  let stopT: number;
  let label: string;
  const Q = offense.QB!;
  if (snap.theirs === 0) {
    // Seven-step drop and a shot to Z
    carrier = "Z";
    const Z = offense.Z!;
    const deep = Math.min(G + 4, G + 8);
    Z.path = [Z.path[0]!, ...(Z.path.length > 1 && Z.path[1]![0] === 0.12 ? [Z.path[1]!] : []), [0.4, 49, Math.min(10, G)], [0.8, 49.5, deep]];
    stopAt = [MID, -8];
    stopT = 0.45;
    if (snap.won && snap.strong) {
      ball = (t) => [...at(Q.path, t), 1.5] as [number, number, number];
      label = "SACK";
    } else {
      ball = thrown({ passer: Q, throwT: 0.48, catchT: 0.8, to: [49.5, deep], peak: 8, then: Z, loose: snap.won ? { t: 0.92, at: [47, deep - 3] } : undefined });
      label = snap.won ? "INCOMPLETE" : "TOUCHDOWN";
      stopAt = [49.5, deep];
      stopT = 0.8;
    }
  } else if (snap.theirs === 1) {
    // Draw: the handoff, then straight up the middle
    carrier = "RB";
    const R = offense.RB!;
    R.path = snap.won
      ? [R.path[0]!, [0.28, MID + 0.6, -5], [0.45, 27, -2.6]]
      : [R.path[0]!, [0.28, MID + 0.6, -5], [0.45, 27, 0], [0.88, 27, end(G)]];
    ball = (t) => (t < 0.28 ? [...at(Q.path, t), 1.4] : carried(R)(t)) as [number, number, number];
    stopAt = [27, -2.6];
    stopT = 0.45;
    label = snap.won ? "STUFFED" : "TOUCHDOWN";
  } else {
    // Screen: the back leaks out and the line releases in front of him
    carrier = "RB";
    const R = offense.RB!;
    R.path = [R.path[0]!, [0.3, 36, -4], [0.5, 37, -3.2], [snap.won ? 0.62 : 0.9, snap.won ? 37.5 : 40, snap.won ? -1.5 : end(G)]];
    ball = thrown({ passer: Q, throwT: 0.38, catchT: 0.5, to: [37, -3.2], peak: 1.5, then: R });
    stopAt = [37.5, -1.5];
    stopT = 0.62;
    label = snap.won ? "STOPPED" : "TOUCHDOWN";
  }

  // Our defense; you are the right end.
  const rush: Record<number, Key[]> = {
    0: [[0.25, 31.6, -1.6], [0.45, MID + 0.8, snap.theirs === 0 ? -8 : -6]], // bull rush, through the tackle
    1: [[0.25, 35, -2], [0.5, 29, -6.5]], // speed rush, around the edge
    2: [[0.4, 36.5, -2.5]], // drop into the flat
  };
  const youMover = st.add("DE2", "D", true, OUR_D.DE2!, OUR_D.DE2!, ...rush[snap.mine]!);
  youMover.you = true;
  for (const id of Object.keys(OUR_D).filter((i) => i !== "DE2")) {
    const p = OUR_D[id]!;
    let keys: Key[] = [[0.5, p[0], -1.5]];
    if (id.startsWith("LB")) keys = [[0.6, (p[0] + 28) / 2, 2]];
    if (id === "CB1") keys = shadow(offense.X!, 0.9, 0.8);
    if (id === "CB2") keys = shadow(offense.Z!, -0.9, 0.8);
    if (id === "NB") keys = shadow(offense.SL!, 0.8, 0.8);
    if (id.startsWith("S")) keys = [[0.8, p[0], G + 3]];
    st.add(id, "D", true, p, p, ...keys);
  }
  if (snap.won && label !== "INCOMPLETE") {
    // The stop is yours when your call beat theirs; otherwise a teammate's.
    st.converge(st.movers.filter((m) => m.side === "D"), stopT, stopAt, snap.strong ? youMover : undefined);
  }
  return { movers: st.movers, ball, carrier, you: "DE2", label };
}

// LB/DB: you are the corner over their best receiver, Z. His split tells you
// the route: tight to the formation leaves room to break out, wide by the
// sideline leaves room only inside.
const COVER_LOOKS: Formation[] = [
  // Quick out: a reduced split, room to break outside
  { ...pick(SHOTGUN, ["LT", "LG", "C", "RG", "RT", "QB", "RB", "TE"]), X: [12, -1], SL: [37, -1.5], Z: [42, -1] },
  // Deep shot: their fastest receiver alone outside, trips to the other side
  { ...pick(SHOTGUN, ["LT", "LG", "C", "RG", "RT", "QB", "RB"]), X: [6, -1], SL: [11, -1.5], TE: [16, -1.5], Z: [48, -1] },
  // Slant: split out wide by the sideline, all that room inside
  { ...pick(SHOTGUN, ["LT", "LG", "C", "RG", "RT", "QB", "RB", "TE"]), X: [5, -1], SL: [39, -1.5], Z: [51, -1] },
];

function corner(snap: Snap): Play {
  const st = new Stage(snap);
  const G = snap.spot.yardsToGoal;
  const look = COVER_LOOKS[snap.look]!;
  const real = COVER_LOOKS[snap.theirs]!;
  const off: Record<string, Mover> = {};
  for (const id of Object.keys(real)) {
    const r = real[id]!;
    let keys: Key[] = [[0.3, r[0], r[1] - 0.6]];
    if (id === "QB") keys = [[0.3, MID, snap.theirs === 1 ? -7.5 : -6]];
    if (["X", "SL"].includes(id) || (id === "TE" && snap.theirs === 1)) keys = [[0.6, r[0] + 2, Math.min(r[1] + 12, G + 3)]];
    off[id] = st.add(id, "O", false, look[id]!, r, ...keys);
  }
  const Q = off.QB!;
  const Z = off.Z!;
  const zx = real.Z![0];
  const stem = Z.path[1]?.[0] === 0.12 ? [Z.path[1]!] : [];
  let to: Pt;
  let throwT: number;
  let catchT: number;
  let peak: number;
  if (snap.theirs === 0) {
    to = [Math.min(52.3, zx + 7), Math.min(5, G - 0.5)];
    Z.path = [Z.path[0]!, ...stem, [0.3, zx + 0.5, to[1]], [0.45, to[0], to[1]]];
    throwT = 0.32;
    catchT = 0.45;
    peak = 1.5;
  } else if (snap.theirs === 1) {
    const deep = Math.min(G + 4, G + 8);
    to = [48.5, deep];
    Z.path = [Z.path[0]!, ...stem, [0.5, 48.5, Math.min(12, G)], [0.85, 48.5, deep]];
    throwT = 0.45;
    catchT = 0.85;
    peak = 9;
  } else {
    to = [zx - 7, Math.min(5.5, G - 0.5)];
    Z.path = [Z.path[0]!, ...stem, [0.26, zx - 0.6, Math.min(2.5, G - 0.5)], [0.42, to[0], to[1]]];
    throwT = 0.28;
    catchT = 0.42;
    peak = 1.2;
  }

  // You: jump the out, bail deep, or press with inside leverage. You line up
  // over Z wherever his split puts him.
  const lookZ = look.Z![0];
  const yours: Key[][] = [
    [[0.25, zx + 2, 3.5], [0.45, zx + 6, Math.min(4.5, G - 0.5)]],
    [[0.6, zx, Math.min(G, 14)], [0.85, zx + 0.5, Math.min(G + 3, G + 6)]],
    [[0.15, zx - 1, 1.2], [0.42, zx - 5.5, Math.min(5, G - 0.5)]],
  ];
  const you = st.add("CB2", "D", true, [lookZ, 4], [zx, 4], ...yours[snap.mine]!);
  you.you = true;
  const ourD: Formation = { ...OUR_D };
  delete ourD.CB2;
  for (const id of Object.keys(ourD)) {
    const p = ourD[id]!;
    let keys: Key[] = [[0.5, p[0], -1.5]];
    if (id.startsWith("LB")) keys = [[0.6, (p[0] + 30) / 2, 6]];
    if (id === "CB1") keys = shadow(off.X!, 0.9, 0.8);
    if (id === "NB") keys = shadow(off.SL!, 0.8, 0.8);
    if (id.startsWith("S")) keys = [[0.8, p[0] + (id === "S2" ? 6 : 0), G + 2]];
    st.add(id, "D", true, p, p, ...keys);
  }

  let ball: Play["ball"];
  let label: string;
  let carrier = "Z";
  if (snap.won && snap.strong) {
    // Picked off: you catch it and go the other way.
    you.path = you.path.filter((k) => k[0] < catchT);
    you.path.push([catchT, to[0], to[1]], [1, Math.max(4, to[0] - 10), to[1] - 22]);
    ball = thrown({ passer: Q, throwT, catchT, to, peak, then: you });
    carrier = "CB2";
    label = "PICKED OFF";
  } else if (snap.won) {
    ball = thrown({ passer: Q, throwT, catchT, to, peak, loose: { t: catchT + 0.12, at: [to[0] - 2, to[1] - 2] } });
    st.converge(st.movers.filter((m) => m.side === "D" && m.ours), catchT, to);
    label = "BROKEN UP";
  } else {
    Z.path = Z.path.filter((k) => k[0] <= catchT);
    Z.path.push([0.95, Math.min(52, Math.max(2, to[0] + 1)), end(G)]);
    ball = thrown({ passer: Q, throwT, catchT, to, peak, then: Z });
    label = "TOUCHDOWN";
  }
  return { movers: st.movers, ball, carrier, you: "CB2", label };
}

// --- kicker -----------------------------------------------------------------

function kicker(snap: Snap): Play {
  const st = new Stage(snap);
  const G = snap.spot.yardsToGoal;
  const hold: Pt = [MID, -7];
  st.add("LS", "O", true, [MID, -1], [MID, -1], [0.3, MID, -0.4]);
  [-1.3, 1.3, -2.6, 2.6, -3.9, 3.9].forEach((dx, i) => st.add(`L${i}`, "O", true, [MID + dx, -1], [MID + dx, -1], [0.3, MID + dx, -1.4]));
  st.add("W1", "O", true, [MID - 5, -1.8], [MID - 5, -1.8], [0.3, MID - 5.4, -2.2]);
  st.add("W2", "O", true, [MID + 5, -1.8], [MID + 5, -1.8], [0.3, MID + 5.4, -2.2]);
  const H = st.add("H", "O", true, hold, hold);
  const K = st.add("K", "O", true, [MID - 1.6, -9.6], [MID - 1.6, -9.6], [0.24, MID - 1.6, -9.6], [0.32, MID - 0.4, -7.4], [0.5, MID - 0.1, -6.2]);
  K.you = true;
  for (let i = 0; i < 10; i++) {
    const x = MID - 6.75 + i * 1.5;
    st.add(`B${i}`, "D", false, [x, 0.9], [x, 0.9], [0.4, x + (MID - x) * 0.15, -1.2]);
  }
  st.add("R", "D", false, [MID, G + 8], [MID, G + 8]);

  // Wind: 0 gust from the left (pushes right), 1 calm, 2 gust from the right.
  const drift = [1, 0, -1][snap.theirs]!;
  const aim = [-1, 0, 1][snap.mine]!;
  const postY = G + 10;
  // Where it crosses the goal line plane: through the middle on a make, wide on a miss.
  let finalX: number;
  if (snap.won) finalX = MID + (aim + drift) * 0.6;
  else {
    const side = aim + drift !== 0 ? Math.sign(aim + drift) : snap.spot.clock % 2 ? 1 : -1;
    finalX = MID + side * 4.4;
  }
  const kickT = 0.34;
  const arriveT = 0.9;
  const ball = (t: number): [number, number, number] => {
    if (t < 0.18) {
      const k = t / 0.18;
      return [MID, -1 + (hold[1] + 1) * k, 0.8];
    }
    if (t < kickT) return [hold[0], hold[1], 0.3];
    const k = Math.min(1, (t - kickT) / (arriveT - kickT));
    // Starts on the aim line; the wind bends it late.
    const startX = MID + aim * 3;
    const x = startX + (finalX - startX) * k * k;
    const y = hold[1] + (postY + 1 - hold[1]) * k;
    return [x, y, 0.3 + 14 * 4 * k * (1 - k) + 4 * k];
  };
  void H;
  return {
    movers: st.movers,
    ball,
    carrier: "K",
    you: "K",
    label: snap.won ? "IT'S GOOD" : "NO GOOD",
    flags: { look: [1, 0, -1][snap.look]!, real: drift },
    kick: true,
  };
}

// --- second packages ---------------------------------------------------------

// Four wide for a last shot from midfield: the tight end splits out as a slot.
const SPREAD: Formation = {
  LT: [22.4, -1], LG: [24.5, -1], C: [MID, -1], RG: [28.8, -1], RT: [30.9, -1],
  QB: [MID, -5], RB: [29.2, -5], X: [6, -1], SL: [14, -1.5], TE: [40, -1.5], Z: [47.5, -1],
};
// The same eleven in every look, so a disguise can shift into any of them.
const DEEP_D: Formation[] = [
  // Prevent: three rush, a tackle drops, everyone else deep
  { DE1: [23, 1], DT1: [MID, 1], DE2: [30.5, 1], DT2: [MID + 3, 6], LB1: [22, 8], LB2: [31, 8], CB1: [6, 10], CB2: [47.5, 10], NB: [40, 12], S1: [17, 20], S3: [36, 20] },
  // Cover 3: one safety in the middle, the corners off and bailing to deep thirds
  { ...LINE, LB1: [25, 4], LB2: [28.5, 4.5], CB1: [6, 8], CB2: [47.5, 8], NB: [40, 5], S3: [14, 5], S1: [MID, 16] },
  // All-out blitz: seven crowd the line
  { ...LINE, LB1: [24.5, 1.3], LB2: [29, 1.3], NB: [40, 1.5], S3: [14, 1.5], CB1: [6, 1], CB2: [47.5, 1], S1: [MID, 9] },
];

/** Their defense against a last shot, starting from the look it showed. */
function deepDefense(st: Stage, snap: Snap, rush: Pt) {
  const look = DEEP_D[snap.look]!;
  const real = DEEP_D[snap.theirs]!;
  const G = snap.spot.yardsToGoal;
  for (const id of Object.keys(real)) {
    const r = real[id]!;
    let keys: Key[];
    const front = id.startsWith("D");
    if (snap.theirs === 0) keys = front ? [[0.55, r[0], -2]] : [[0.85, r[0], Math.min(G + 4, r[1] + 14)]];
    else if (snap.theirs === 2) keys = front || id.startsWith("LB") || id === "NB" ? [[0.45, (r[0] + rush[0]) / 2, rush[1] + 1]] : [[0.85, r[0], r[1] + 8]];
    else if (id === "CB1" || id === "CB2") keys = [[0.85, r[0] + (id === "CB1" ? 4 : -4), Math.min(G + 3, r[1] + 16)]];
    else if (front) keys = [[0.55, r[0], -2.5]];
    else keys = [[0.85, r[0], id === "S1" ? G + 2 : r[1] + 4]];
    st.add(id, "D", false, look[id]!, r, ...keys);
  }
}

function qbLastGasp(snap: Snap): Play {
  const st = new Stage(snap);
  const G = snap.spot.yardsToGoal;
  const f = SPREAD;
  blockers(st, f, true, -0.8);
  const deep = G + 4;
  let ball: Play["ball"];
  let carrier = "QB";
  let stop: { t: number; at: Pt } | null = null;
  let label: string;
  const Q = st.add("QB", "O", true, f.QB!, f.QB!, ...(snap.mine === 2 ? [[0.3, 33, -7], [0.55, 40, -4]] as Key[] : [[0.3, MID, -7.5]] as Key[]));
  if (snap.mine === 0) {
    // Four verticals: everybody deep, the ball to whoever the safety leaves.
    st.add("RB", "O", true, f.RB!, f.RB!, [0.3, 28, -3.5]);
    st.add("X", "O", true, f.X!, f.X!, [0.85, 7, deep]);
    const S = st.add("SL", "O", true, f.SL!, f.SL!, [0.85, 18, deep]);
    st.add("TE", "O", true, f.TE!, f.TE!, [0.85, 37, deep]);
    st.add("Z", "O", true, f.Z!, f.Z!, [0.85, 47, deep]);
    carrier = "SL";
    ball = thrown({ passer: Q, throwT: 0.4, catchT: 0.85, to: [18, deep], peak: 12, then: S, loose: snap.won ? undefined : { t: 0.95, at: [16, deep - 3] } });
    if (!snap.won) stop = { t: 0.86, at: [18, deep] };
    label = snap.won ? "TOUCHDOWN" : "KNOCKED DOWN";
  } else if (snap.mine === 1) {
    // Hook and lateral: the curl, then the pitch to the back trailing it.
    const Z = st.add("Z", "O", true, f.Z!, f.Z!, [0.35, 46, 10]);
    const R = st.add("RB", "O", true, f.RB!, f.RB!, [0.4, 40, 3], [0.52, 44.5, 8.6], ...(snap.won ? [[0.92, 45, end(G)] as Key] : [[0.6, 45, 9.4] as Key]));
    for (const id of ["X", "SL", "TE"]) st.add(id, "O", true, f[id]!, f[id]!, [0.8, f[id]![0], deep - 4]);
    carrier = "RB";
    ball = (t) => {
      if (t < 0.52) return thrown({ passer: Q, throwT: 0.32, catchT: 0.45, to: [46, 10], peak: 2, then: Z })(t);
      if (!snap.won && t > 0.56) return [46, 8.5, 0.15] as [number, number, number];
      return carried(R)(t);
    };
    if (!snap.won) stop = { t: 0.6, at: [45, 9.4] };
    label = snap.won ? "TOUCHDOWN" : "LOOSE BALL";
  } else {
    // Scramble drill: buy time to the right, find the man waving in the end zone.
    st.add("RB", "O", true, f.RB!, f.RB!, [0.3, 31, -3]);
    st.add("X", "O", true, f.X!, f.X!, [0.8, 10, deep - 2]);
    st.add("SL", "O", true, f.SL!, f.SL!, [0.8, 22, deep - 1]);
    st.add("TE", "O", true, f.TE!, f.TE!, [0.8, 36, deep - 2]);
    const Z = st.add("Z", "O", true, f.Z!, f.Z!, [0.9, 45, deep]);
    if (snap.won) {
      carrier = "Z";
      ball = thrown({ passer: Q, throwT: 0.58, catchT: 0.9, to: [45, deep], peak: 9, then: Z });
    } else {
      Q.path = Q.path.filter((k) => k[0] < 0.4);
      Q.path.push([0.5, 39, -4.5]);
      ball = carried(Q, 1.5);
      stop = { t: 0.5, at: [39, -4.5] };
    }
    label = snap.won ? "TOUCHDOWN" : "SACKED";
  }
  deepDefense(st, snap, [MID, -7]);
  if (stop) st.converge(st.movers.filter((m) => m.side === "D"), stop.t, stop.at);
  Q.you = true;
  return { movers: st.movers, ball, carrier, you: "QB", label, deep: true };
}

function skillLastGasp(snap: Snap): Play {
  const st = new Stage(snap);
  const G = snap.spot.yardsToGoal;
  const f = SPREAD;
  blockers(st, f, true, snap.mine === 2 ? 2 : -0.6);
  const Q = st.add("QB", "O", true, f.QB!, f.QB!, [0.25, MID, -6.5]);
  st.add("RB", "O", true, f.RB!, f.RB!, [0.3, 28, -3]);
  for (const id of ["X", "SL", "TE"]) st.add(id, "O", true, f[id]!, f[id]!, [0.8, f[id]![0] + 2, G - 2]);
  // You are the receiver split wide right.
  let Z: Mover;
  let ball: Play["ball"];
  let stop: { t: number; at: Pt } | null = null;
  if (snap.mine === 0) {
    Z = st.add("Z", "O", true, f.Z!, f.Z!, [0.85, 48.5, G + 3]);
    ball = thrown({ passer: Q, throwT: 0.42, catchT: 0.85, to: [48.5, G + 3], peak: 11, then: Z, loose: snap.won ? undefined : { t: 0.95, at: [46, G] } });
    if (!snap.won) stop = { t: 0.86, at: [48.5, G + 2] };
  } else if (snap.mine === 1) {
    Z = st.add("Z", "O", true, f.Z!, f.Z!, [0.36, 47, 9], ...(snap.won ? [[0.9, 42, end(G)] as Key] : [[0.46, 46.8, 9.4] as Key]));
    ball = thrown({ passer: Q, throwT: 0.3, catchT: 0.4, to: [47, 9], peak: 2, then: Z, loose: snap.won ? undefined : { t: 0.52, at: [45.5, 7.5] } });
    if (!snap.won) stop = { t: 0.42, at: [47, 9] };
  } else {
    Z = st.add("Z", "O", true, f.Z!, f.Z!, [0.25, 49, -2.5], ...(snap.won ? [[0.92, 45, end(G)] as Key] : [[0.42, 48, -1.2] as Key]));
    ball = thrown({ passer: Q, throwT: 0.27, catchT: 0.34, to: [49, -2.5], peak: 1.2, then: Z });
    if (!snap.won) stop = { t: 0.42, at: [48, -1.2] };
  }
  Z.you = true;
  // Press man, soft zone or blitz, all built around the corner over you.
  const looks: Formation[] = [
    { ...PASS_D[2]!, CB2: [47.5, 0.8] },
    { ...PASS_D[1]!, CB2: [46, 12], NB: [40, 10], S2: [41, 20] },
    { ...PASS_D[0]!, LB1: [25.2, 1.4], LB2: [28.2, 1.4], CB2: [47.5, 5] },
  ];
  const look = looks[snap.look]!;
  const real = looks[snap.theirs]!;
  for (const id of Object.keys(real)) {
    const r = real[id]!;
    let keys: Key[] = [[0.55, r[0], r[1] + 3]];
    if (id.startsWith("D")) keys = [[0.5, (r[0] + MID) / 2, -3]];
    if (snap.theirs === 2 && id.startsWith("LB")) keys = [[0.42, MID, -5]];
    if (id === "CB2") keys = snap.theirs === 0 ? shadow(Z, -0.7, 0.6) : [[0.6, 46, r[1] + 2]];
    if (id === "CB1") keys = shadow(st.get("X"), 0.9, 0.8);
    st.add(id, "D", false, look[id]!, r, ...keys);
  }
  if (stop) st.converge(st.movers.filter((m) => m.side === "D"), stop.t, stop.at);
  return { movers: st.movers, ball, carrier: "Z", you: "Z", label: snap.won ? "TOUCHDOWN" : "STOPPED", deep: true };
}

function lineProtect(snap: Snap): Play {
  const st = new Stage(snap);
  const G = snap.spot.yardsToGoal;
  const f = SPREAD;
  // You are the left guard. The whole line slides with the call.
  const slide = [-1.8, 1.8, 0][snap.mine]!;
  for (const id of ["LT", "LG", "C", "RG", "RT"]) {
    const p = f[id]!;
    const m = st.add(id, "O", true, p, p, [0.35, p[0] + slide, -2.6]);
    if (id === "LG") m.you = true;
  }
  const Q = st.add("QB", "O", true, f.QB!, f.QB!, [0.3, MID, -8]);
  st.add("RB", "O", true, f.RB!, f.RB!, snap.mine === 2 ? [0.3, 27.5, -6] : [0.6, 33, 6]);
  for (const id of ["X", "SL", "TE"]) st.add(id, "O", true, f[id]!, f[id]!, [0.85, (f[id]![0] + 30) / 2, G + 3]);
  const Z = st.add("Z", "O", true, f.Z!, f.Z!, [0.85, 40, G + 4]);
  const looks: Formation[] = [
    { ...LINE, LB1: [18, 1.5], LB2: [19.5, 2.8], NB: [40, 4], CB1: [6, 6], CB2: [47.5, 6], S1: [17, 14], S2: [36, 14] },
    { ...LINE, LB1: [35.3, 1.5], LB2: [33.8, 2.8], NB: [40, 4], CB1: [6, 6], CB2: [47.5, 6], S1: [17, 14], S2: [36, 14] },
    { ...LINE, LB1: [MID - 1, 1.6], LB2: [MID + 1, 1.6], NB: [40, 6], CB1: [6, 6], CB2: [47.5, 6], S1: [17, 14], S2: [36, 14] },
  ];
  const look = looks[snap.look]!;
  const real = looks[snap.theirs]!;
  for (const id of Object.keys(real)) {
    const r = real[id]!;
    const rusher = id.startsWith("D") || id.startsWith("LB");
    const keys: Key[] = rusher ? [[0.45, (r[0] + MID) / 2, -4.5]] : [[0.85, r[0], Math.min(G + 2, r[1] + 10)]];
    st.add(id, "D", false, look[id]!, r, ...keys);
  }
  let ball: Play["ball"];
  if (snap.won) {
    ball = thrown({ passer: Q, throwT: 0.55, catchT: 0.9, to: [40, G + 4], peak: 13, then: Z });
  } else {
    ball = (t) => [...at(Q.path, t), 1.5] as [number, number, number];
    st.converge(st.movers.filter((m) => m.side === "D" && m.id.startsWith("LB")), 0.5, [MID, -7.6]);
  }
  return { movers: st.movers, ball, carrier: snap.won ? "Z" : "QB", you: "LG", label: snap.won ? "TOUCHDOWN" : "SACKED", deep: true };
}

function goalStand(snap: Snap): Play {
  const st = new Stage(snap);
  const G = snap.spot.yardsToGoal;
  // Their goal-line offense, by the look it shows.
  const looks: Formation[] = [
    { ...pick(GOAL_LINE, ["LT", "LG", "C", "RG", "RT", "TE", "TE2", "X"]), QB: [MID, -1.5], FB: [MID, -3.6], RB: [MID, -5.8] },
    { ...pick(GOAL_LINE, ["LT", "LG", "C", "RG", "RT", "TE", "TE2", "X"]), QB: [MID, -1.6], FB: [MID + 1.6, -3.8], RB: [MID, -6.3] },
    { ...pick(GOAL_LINE, ["LT", "LG", "C", "RG", "RT", "TE2", "X"]), TE: [37, -1], QB: [MID, -2.6], FB: [MID, -4.5], RB: [MID, -6.5] },
  ];
  const look = looks[snap.look]!;
  const real = looks[snap.theirs]!;
  const off: Record<string, Mover> = {};
  for (const id of Object.keys(real)) {
    const r = real[id]!;
    off[id] = st.add(id, "O", false, look[id]!, r, [0.35, r[0], r[1] + 0.6]);
  }
  let carrier: Mover;
  let stopAt: Pt;
  const done = snap.won ? 0.5 : 0.85;
  if (snap.theirs === 0) {
    carrier = off.QB!;
    carrier.path.push([done, MID, snap.won ? -0.3 : end(G, 1)]);
    stopAt = [MID, -0.3];
  } else if (snap.theirs === 1) {
    off.RG!.path.push([0.35, 31, -1.5]);
    carrier = off.RB!;
    carrier.path.push([0.35, MID + 2, -3], [done, 31.5, snap.won ? -1.8 : end(G, 1)]);
    stopAt = [31.5, -1.8];
  } else {
    carrier = off.QB!;
    carrier.path.push([0.3, MID - 1, -3.5], [0.5, 35, -3], [done, snap.won ? 36 : 39, snap.won ? -2.2 : end(G, 1)]);
    stopAt = [36, -2.2];
  }
  const Q = off.QB!;
  const ball = (t: number): [number, number, number] =>
    carrier === Q ? carried(Q, 1.4)(t) : t < 0.32 ? ([...at(Q.path, t), 1.2] as [number, number, number]) : carried(carrier)(t);

  // Our goal-line defense; you are the end on the right.
  const ours: Formation = GL_D[0]!;
  const yours: Key[][] = [[[0.35, 32, -2.5]], [[0.35, 34, 0.1]], [[0.4, 37.5, -0.6]]];
  for (const id of Object.keys(ours)) {
    const p = ours[id]!;
    const keys = id === "DE2" ? yours[snap.mine]! : [[0.4, p[0], -0.4] as Key];
    const m = st.add(id, "D", true, p, p, ...keys);
    if (id === "DE2") m.you = true;
  }
  if (snap.won) st.converge(st.movers.filter((m) => m.side === "D"), done, stopAt, snap.strong ? st.get("DE2") : undefined);
  return { movers: st.movers, ball, carrier: carrier.id, you: "DE2", label: snap.won ? "STUFFED" : "TOUCHDOWN" };
}

function hailMary(snap: Snap): Play {
  const st = new Stage(snap);
  const G = snap.spot.yardsToGoal;
  const looks: Formation[] = [
    { ...pick(SHOTGUN, ["LT", "LG", "C", "RG", "RT", "QB", "RB"]), X: [38, -1], SL: [41.5, -1.5], TE: [44.5, -1.5], Z: [48, -1] },
    { ...pick(SHOTGUN, ["LT", "LG", "C", "RG", "RT", "QB", "RB", "X", "TE"]), Z: [45, -1], SL: [45.8, -2.8] },
    {
      LT: [22.4, -1.6], LG: [24.5, -1.4], C: [MID, -1.2], RG: [28.8, -1.4], RT: [30.9, -1.7],
      QB: [31, -5.5], RB: [28, -5], X: [6, -1], SL: [40, -1.5], TE: [33.2, -1.2], Z: [47.5, -1],
    },
  ];
  const look = looks[snap.look]!;
  const real = looks[snap.theirs]!;
  const off: Record<string, Mover> = {};
  for (const id of Object.keys(real)) {
    const r = real[id]!;
    let keys: Key[] = [[0.3, r[0], r[1] - 0.8]];
    if (["X", "SL", "TE", "Z"].includes(id)) keys = [[0.85, Math.min(52, r[0] + (snap.theirs === 0 ? 2 : 0)), G + 3]];
    if (id === "QB") keys = snap.theirs === 2 ? [[0.45, 40, -4]] : [[0.3, MID, -7.5]];
    off[id] = st.add(id, "O", false, look[id]!, r, ...keys);
  }
  // Our prevent; you are the deep corner on the right.
  const ours: Formation = { DE1: [23, 1], DT1: [MID, 1], DE2: [30.5, 1], LB1: [22, 8], LB2: [31, 8], CB1: [6, 10], NB: [40, 12], S1: [17, 20], S2: [36, 20], S3: [MID, 16] };
  for (const id of Object.keys(ours)) {
    const p = ours[id]!;
    st.add(id, "D", true, p, p, id.startsWith("D") ? [0.5, (p[0] + MID) / 2, -4] : [0.85, (p[0] + 44) / 2, G + 2]);
  }
  const yours: Key[][] = [[[0.85, 46, G + 3]], [[0.55, 45, 12]], [[0.45, 39, -1.5]]];
  const you = st.add("CB2", "D", true, [44, 13], [44, 13], ...yours[snap.mine]!);
  you.you = true;

  const Q = off.QB!;
  let ball: Play["ball"];
  let carrier: string;
  let label: string;
  if (snap.theirs === 1) {
    // Hook and lateral
    const Z = off.Z!;
    const S = off.SL!;
    Z.path = [Z.path[0]!, ...(Z.path[1]?.[0] === 0.12 ? [Z.path[1]!] : []), [0.35, 45, 10]];
    S.path = [S.path[0]!, ...(S.path[1]?.[0] === 0.12 ? [S.path[1]!] : []), [0.4, 44, 6], [0.5, 44.5, 9], snap.won ? [0.6, 44.6, 11] : [0.92, 44, end(G)]];
    ball = (t) => (t < 0.5 ? thrown({ passer: Q, throwT: 0.3, catchT: 0.42, to: [45, 10], peak: 2, then: Z })(t) : carried(S)(t));
    carrier = "SL";
    if (snap.won) st.converge(st.movers.filter((m) => m.ours), 0.6, [44.6, 11], snap.strong ? you : undefined);
    label = snap.won ? "STOPPED" : "TOUCHDOWN";
  } else {
    const target = snap.theirs === 0 ? off.SL! : off.TE!;
    const to: Pt = snap.theirs === 0 ? [45, G + 3] : [44, G + 3];
    const throwT = snap.theirs === 0 ? 0.42 : 0.6;
    ball = thrown({ passer: Q, throwT, catchT: 0.9, to, peak: 14, then: target, loose: snap.won ? { t: 0.97, at: [to[0] - 2, to[1] - 2] } : undefined });
    carrier = target.id;
    if (snap.won) st.converge(st.movers.filter((m) => m.ours), 0.9, to, snap.strong ? you : undefined);
    label = snap.won ? "KNOCKED DOWN" : "TOUCHDOWN";
  }
  return { movers: st.movers, ball, carrier, you: "CB2", label, deep: true };
}

function chipShot(snap: Snap): Play {
  const st = new Stage(snap);
  const G = snap.spot.yardsToGoal;
  const hold: Pt = [MID, -7];
  st.add("LS", "O", true, [MID, -1], [MID, -1], [0.3, MID, -0.4]);
  [-1.3, 1.3, -2.6, 2.6, -3.9, 3.9].forEach((dx, i) => st.add(`L${i}`, "O", true, [MID + dx, -1], [MID + dx, -1], [0.3, MID + dx, -1.6]));
  st.add("W1", "O", true, [MID - 5, -1.8], [MID - 5, -1.8], [0.3, MID - 5.4, -2.4]);
  st.add("W2", "O", true, [MID + 5, -1.8], [MID + 5, -1.8], [0.3, MID + 5.4, -2.4]);
  st.add("H", "O", true, hold, hold);
  const K = st.add("K", "O", true, [MID - 1.6, -9.6], [MID - 1.6, -9.6], [0.24, MID - 1.6, -9.6], [0.32, MID - 0.4, -7.4], [0.5, MID - 0.1, -6.2]);
  K.you = true;
  // The block team, by the look it shows: off both edges, stacked over the
  // center, or backed off the line.
  const lines: Pt[][] = [
    [[MID - 7.5, 0.9], [MID - 6.3, 0.9], [MID + 6.3, 0.9], [MID + 7.5, 0.9], [MID - 3, 0.9], [MID - 1.5, 0.9], [MID, 0.9], [MID + 1.5, 0.9], [MID + 3, 0.9], [MID, 3]],
    [[MID - 5, 0.9], [MID - 3, 0.9], [MID - 1.2, 0.9], [MID, 0.9], [MID + 1.2, 0.9], [MID + 3, 0.9], [MID + 5, 0.9], [MID - 0.6, 2], [MID + 0.6, 2], [MID, 3.2]],
    [[MID - 6, 3], [MID - 4, 3.2], [MID - 2, 3], [MID, 3.4], [MID + 2, 3], [MID + 4, 3.2], [MID + 6, 3], [MID - 3, 5], [MID + 3, 5], [MID, 6]],
  ];
  const look = lines[snap.look]!;
  const real = lines[snap.theirs]!;
  real.forEach((r, i) => {
    const target: Pt = snap.theirs === 2 ? [r[0], r[1]] : [r[0] + (MID - r[0]) * (snap.theirs === 0 ? 0.55 : 0.25), -2.6];
    st.add(`B${i}`, "D", false, look[i]!, r, [0.4, target[0], target[1]]);
  });
  st.add("R", "D", false, [MID, G + 8], [MID, G + 8]);

  const peak = [6, 18, 12][snap.mine]!; // quick and low, steep, your normal kick
  const postY = G + 10;
  const kickT = 0.34;
  const arriveT = 0.85;
  const blocked = !snap.won && snap.theirs !== 2; // nobody blocks a kick when they back off
  const wideX = MID + (snap.spot.clock % 2 ? 4.2 : -4.2);
  const ball = (t: number): [number, number, number] => {
    if (t < 0.18) return [MID, -1 + (hold[1] + 1) * (t / 0.18), 0.8];
    if (t < kickT) return [hold[0], hold[1], 0.3];
    if (blocked) {
      // Gets a fingertip at the line and dies.
      const k = Math.min(1, (t - kickT) / 0.3);
      return [MID + k * 2, hold[1] + 6 * k, 0.3 + 3 * Math.sin(k * Math.PI)];
    }
    const k = Math.min(1, (t - kickT) / (arriveT - kickT));
    const x = snap.won ? MID : MID + (wideX - MID) * k * k;
    return [x, hold[1] + (postY + 1 - hold[1]) * k, 0.3 + peak * 4 * k * (1 - k) + 4 * k];
  };
  return { movers: st.movers, ball, carrier: "K", you: "K", label: snap.won ? "IT'S GOOD" : blocked ? "BLOCKED" : "NO GOOD", kick: true };
}

export function stagePlay(snap: Snap): Play {
  const second = snap.pkg === 1;
  switch (snap.position) {
    case "QB":
      return second ? qbLastGasp(snap) : qb(snap);
    case "OSKILL":
      return second ? skillLastGasp(snap) : skill(snap);
    case "OL":
      return second ? lineProtect(snap) : line(snap);
    case "DL":
      return second ? goalStand(snap) : edge(snap);
    case "DSKILL":
      return second ? hailMary(snap) : corner(snap);
    case "K":
      return second ? chipShot(snap) : kicker(snap);
  }
}

/** What the field shows before the snap: only the look, not the result. */
export function preSnap(position: Position, spot: Spot, look: number, pkg = 0): Play {
  return stagePlay({ position, pkg, spot, mine: 0, theirs: look, look, won: true, strong: true });
}
