// A one-shot confetti burst for a title won on the last play. Pure CSS:
// each piece gets its own drift, spin and delay from a fixed scatter, so it
// renders the same every time and needs no animation library. Hidden from
// assistive tech and switched off under prefers-reduced-motion (base.css).

const COLORS = ["#ffc940", "#f2f5fa", "#3ddc84", "#6ef0ff", "#ff5d5d", "#c6d0dc"];

// A cheap deterministic scatter: golden-ratio steps through [0, 1).
function scatter(i: number, salt: number): number {
  return ((i + 1) * 0.6180339887 * (salt + 1)) % 1;
}

export function Confetti({ big = false }: { big?: boolean }) {
  const count = big ? 70 : 38;
  return (
    <div className="confetti" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          style={
            {
              "--x": `${scatter(i, 1) * 100}%`,
              "--drift": `${(scatter(i, 2) - 0.5) * 140}px`,
              "--spin": `${(scatter(i, 3) - 0.5) * 1080}deg`,
              "--delay": `${scatter(i, 4) * 450}ms`,
              "--dur": `${1500 + scatter(i, 5) * 1300}ms`,
              background: COLORS[i % COLORS.length],
              width: `${5 + scatter(i, 6) * 6}px`,
              height: `${8 + scatter(i, 7) * 8}px`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
