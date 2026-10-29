import type { ReactElement } from "react";
import type { Spot } from "../../engine/index";
import { MID, at, type Mover, type Play } from "./choreo";

// A broadcast skycam behind the offense, drawn as a real perspective
// projection so players stand upright and shrink with distance. Your play is
// inked in telestrator yellow; the defender who made the stop, in red.

interface Props {
  play: Play;
  spot: Spot;
  t: number;
  /** After the snap: ink the play and ring the stop. */
  live: boolean;
  /** Phone framing: a narrower canvas, zoomed toward your player. */
  tight?: boolean;
  /** Pre-snap only: the defense's alignment as a plain-language label. */
  ariaLabel: string;
}

type Proj = (x: number, y: number, z?: number) => [number, number, number];

function camera(G: number, tight: boolean, focusX: number, kick: boolean, deep = false): { W: number; H: number; P: Proj } {
  const W = tight ? 600 : 960;
  const H = tight ? 440 : 430;
  const YC = -20;
  // Just behind the deepest player: the kicker on a field goal, the
  // quarterback's drop otherwise.
  const near = kick ? -11 : -8.5;
  // A kick has to show the uprights, and a shot at the end zone the end zone,
  // however far away they are.
  const far = kick || deep ? G + 12 : Math.min(G + 11, 36);
  // Fit the near edge to the bottom and the far edge near the top.
  const K = (H - 70) / (1 / (near - YC) - 1 / (far - YC));
  const HOR = H - K / (near - YC);
  // Wide enough that a receiver split to the numbers stays in frame.
  const F = tight ? 300 : 361;
  const cx = tight ? MID * 0.45 + focusX * 0.55 : MID;
  return {
    W,
    H,
    P: (x, y, z = 0) => {
      const d = y - YC;
      return [W / 2 + (F * (x - cx)) / d, HOR + (K - F * z) / d, F / d];
    },
  };
}

const f1 = (n: number) => n.toFixed(1);

export function Telestrator({ play, spot, t, live, tight = false, ariaLabel }: Props) {
  const G = spot.yardsToGoal;
  const you = play.movers.find((m) => m.id === play.you)!;
  const { W, H, P } = camera(G, tight, at(you.path, 0)[0], spot.side === "kick", !!play.deep);
  const pts = (list: [number, number, number?][]) =>
    list
      .map(([x, y, z]) => {
        const [a, b] = P(x, y, z ?? 0);
        return `${f1(a)},${f1(b)}`;
      })
      .join(" ");
  const quad = (x0: number, y0: number, x1: number, y1: number) => pts([[x0, y0], [x1, y0], [x1, y1], [x0, y1]]);
  const seg = (key: string, cls: string, x0: number, y0: number, x1: number, y1: number, z0 = 0, z1 = 0) => {
    const [a, b] = P(x0, y0, z0);
    const [c, d] = P(x1, y1, z1);
    return <line key={key} className={cls} x1={f1(a)} y1={f1(b)} x2={f1(c)} y2={f1(d)} />;
  };

  const near = spot.side === "kick" ? -12 : -10;
  const back = G + 10;
  const far = spot.side === "kick" || play.deep ? back + 2 : Math.min(back + 2, 38);
  const field: ReactElement[] = [];
  field.push(<polygon key="apron" className="tf-apron" points={quad(-6, near, 59.3, far)} />);
  for (let y = G; y > near - 5; y -= 5) {
    const y0 = Math.max(near, y - 5);
    field.push(<polygon key={`s${y}`} className={((G - y) / 5) % 2 ? "tf-turf-a" : "tf-turf-b"} points={quad(0, y0, 53.3, y)} />);
  }
  if (G < far) field.push(<polygon key="ez" className={spot.side === "defense" ? "tf-ez tf-ez-ours" : "tf-ez"} points={quad(0, G, 53.3, Math.min(back, far))} />);
  for (let y = G; y >= near; y -= 1) {
    const real = G - y;
    if (real % 5 !== 0 || y > far) continue;
    field.push(seg(`y${y}`, real === 0 ? "tf-goal" : "tf-yard", 0, y, 53.3, y));
    if (real > 0 && real % 10 === 0 && real <= 50) {
      for (const x of [9, 44.3]) {
        const [nx, ny, ns] = P(x, y);
        field.push(
          <text key={`n${y}${x}`} className="tf-num" x={f1(nx)} y={f1(ny)} fontSize={f1(ns * 1.9)} transform={`scale(1 0.5)`} style={{ transformOrigin: `${f1(nx)}px ${f1(ny)}px` }}>
            {real}
          </text>,
        );
      }
    }
  }
  for (let y = Math.ceil(near); y < Math.min(G, far); y++) for (const x of [23.6, 29.7]) field.push(seg(`h${y}${x}`, "tf-hash", x - 0.4, y, x + 0.4, y));
  field.push(seg("sl", "tf-side", 0, near, 0, far), seg("sr", "tf-side", 53.3, near, 53.3, far));
  if (back <= far) {
    for (const x of [MID - 3.08, MID + 3.08]) field.push(seg(`p${x}`, "tf-post", x, back, x, back, 3, 11));
    field.push(seg("bar", "tf-post", MID - 3.08, back, MID + 3.08, back, 3, 3), seg("stem", "tf-post", MID, back, MID, back, 0, 3));
    // Wind flags on top of the uprights: the kicker's read.
    if (play.flags) {
      const dir = t > 0.12 && live ? play.flags.real : play.flags.look;
      for (const x of [MID - 3.08, MID + 3.08]) {
        const tip = dir === 0 ? [x + 0.15, back, 9.6] : [x + dir * 1.8, back, 10.6];
        field.push(<polygon key={`f${x}`} className="tf-flag" points={pts([[x, back, 11], [tip[0]!, tip[1]!, tip[2]!], [x, back, 10.2]])} />);
      }
    }
  }
  // Stadium flags in the top corners: the same wind, readable at any size.
  if (play.flags) {
    const dir = t > 0.12 && live ? play.flags.real : play.flags.look;
    const size = W / (tight ? 13 : 20);
    for (const px of [size * 1.6, W - size * 1.6]) {
      const top = size * 0.6;
      const flag =
        dir === 0
          ? `${px},${top} ${px + size * 0.28},${top + size * 1.1} ${px},${top + size * 1.2}`
          : `${px},${top} ${px + dir * size * 1.6},${top + size * 0.35} ${px},${top + size * 0.75}`;
      field.push(
        <g key={`sf${px}`} className="tf-stadium-flag">
          <line x1={px} y1={top - 2} x2={px} y2={top + size * 2.4} />
          <polygon points={flag} />
        </g>,
      );
    }
  }
  field.push(seg("los", "tf-los", 0, 0, 53.3, 0));
  if (spot.side !== "kick" && spot.toGo < G) {
    const gain = spot.side === "offense" ? spot.toGo : spot.toGo;
    field.push(seg("gain", "tf-gain", 0, gain, 53.3, gain));
  }

  // Ink: the path of the play.
  const ink: ReactElement[] = [];
  if (live) {
    const trail: [number, number, number][] = [];
    for (let s = 0; s <= t + 1e-6; s += 0.015) {
      if (play.kick) {
        const [x, y, z] = play.ball(s);
        if (s > 0.34) trail.push([x, y, z]);
      } else {
        const [x, y] = at(play.movers.find((m) => m.id === play.carrier)!.path, s);
        trail.push([x, y, 0.15]);
      }
    }
    if (trail.length > 1) ink.push(<polyline key="route" className="tf-route" points={pts(trail)} />);
    // Your own path, when the ball is in someone else's hands.
    if (play.you !== play.carrier || play.kick) {
      const mine: [number, number, number][] = [];
      for (let s = 0; s <= t + 1e-6; s += 0.015) {
        const [x, y] = at(you.path, s);
        mine.push([x, y, 0.15]);
      }
      if (mine.length > 1) ink.push(<polyline key="you" className="tf-route-you" points={pts(mine)} />);
    }
    const tk = play.movers.find((m) => m.tackler);
    if (tk && !tk.you && t > 0.2) {
      const dtrail: [number, number, number][] = [];
      for (let s = 0.12; s <= t + 1e-6; s += 0.015) {
        const [x, y] = at(tk.path, s);
        dtrail.push([x, y, 0.15]);
      }
      ink.push(<polyline key="droute" className="tf-route-d" points={pts(dtrail)} />);
    }
  }

  // Players, far to near.
  const bodies = [...play.movers]
    .map((m) => ({ m, p: at(m.path, live ? t : 0) }))
    .sort((a, b) => b.p[1] - a.p[1])
    .map(({ m, p }) => body(m, p, P, live && t >= 1));

  const [bx, by, bz] = play.ball(live ? t : 0);
  const [sx, sy, sc] = P(bx, by);
  const [ax, ay] = P(bx, by, bz);

  return (
    <svg className="telestrator" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={live && t >= 1 ? `${ariaLabel} ${play.label}.` : ariaLabel}>
      <rect className="tf-sky" x={0} y={0} width={W} height={H} />
      {field}
      <g className="tf-ink">{ink}</g>
      {bodies}
      <ellipse className="tf-shadow" cx={f1(sx)} cy={f1(sy)} rx={f1(0.35 * sc)} ry={f1(0.14 * sc)} />
      <ellipse className="tf-ball" cx={f1(ax)} cy={f1(ay)} rx={f1(0.36 * sc)} ry={f1(0.22 * sc)} />
    </svg>
  );
}

function body(m: Mover, [x, y]: [number, number], P: Proj, over: boolean): ReactElement {
  const [gx, gy, s] = P(x, y);
  const [bx, by] = P(x, y, 1);
  const r = 0.66 * s;
  const team = m.ours ? "tf-ours" : "tf-theirs";
  const parts: ReactElement[] = [<ellipse key="sh" className="tf-shadow" cx={f1(gx)} cy={f1(gy)} rx={f1(r * 1.1)} ry={f1(r * 0.38)} />];
  if (m.you) parts.push(<circle key="you" className="tf-you-ring" cx={f1(bx)} cy={f1(by)} r={f1(r * 1.75)} strokeWidth={f1(r * 0.22)} />);
  if (m.side === "O") {
    parts.push(<circle key="o" className={`tf-o ${team}`} cx={f1(bx)} cy={f1(by)} r={f1(r)} strokeWidth={f1(r * 0.3)} />);
  } else {
    const k = r * 0.82;
    parts.push(
      <g key="x" className={`tf-x ${team}`} strokeWidth={f1(r * 0.45)}>
        <line x1={f1(bx - k)} y1={f1(by - k)} x2={f1(bx + k)} y2={f1(by + k)} />
        <line x1={f1(bx + k)} y1={f1(by - k)} x2={f1(bx - k)} y2={f1(by + k)} />
      </g>,
    );
  }
  if (m.you) {
    parts.push(
      <text key="tag" className="tf-you" x={f1(bx)} y={f1(by - r * 2.3)} fontSize={f1(Math.max(11, r * 1.25))}>
        YOU
      </text>,
    );
  }
  if (over && m.tackler) parts.push(<ellipse key="ring" className="tf-stop" cx={f1(bx)} cy={f1(by)} rx={f1(r * 2.2)} ry={f1(r * 1.6)} />);
  return <g key={m.id}>{parts}</g>;
}
