import type { CareerView } from "./types";

// Copy-as-text rather than a rendered PNG: no rasterizer dependency, and text
// survives being pasted into a chat better than an image does. The seed line is
// the only thing that makes a shared result checkable, so it is never omitted.
export function shareText(view: CareerView): string {
  const s = view.summary;
  if (!s) return "";

  const lines: string[] = [];
  lines.push(`${view.playerName} · ${view.positionLabel}`);

  const seasonCount = s.seasons.length;
  const seasonWord = seasonCount === 1 ? "season" : "seasons";
  lines.push(`${s.schoolPath.join(" → ")} · ${seasonCount} ${seasonWord}`);

  const honors: string[] = [];
  for (const a of s.awards) honors.push(a);
  for (const t of s.trophies) honors.push(t.count > 1 ? `${t.count}× ${t.label}` : t.label);
  if (honors.length > 0) lines.push(honors.join(" · "));

  const tail = s.subhead && s.wasDrafted ? `${s.headline} (${s.subhead})` : s.headline;
  lines.push(`${tail} · OVR ${s.finalOverall}`);
  lines.push(`seed ${s.seed}`);

  return lines.join("\n");
}
