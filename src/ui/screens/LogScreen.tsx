import type { LogEntry } from "../session/types";

interface Props {
  log: LogEntry[];
  onBack: () => void;
}

export function LogScreen({ log, onBack }: Props) {
  return (
    <div className="frame">
      <div className="rail">
        <span className="rail-school">Past careers</span>
        <span className="rail-record">{log.length}</span>
      </div>

      {log.length === 0 ? (
        <p className="empty">No finished careers yet. Play one out and it lands here.</p>
      ) : (
        log.map((e) => (
          <div className="log-row" key={e.id}>
            <span className="log-name">
              {e.lastName} #{e.jerseyNumber}
            </span>
            <span style={{ color: "var(--chalk-faint)" }}>{e.positionLabel}</span>
            <span className={e.status === "drafted" ? "log-headline" : "log-headline quiet"}>
              {e.headline}
            </span>
            <span className="log-meta">
              {e.schoolPath.join(" → ")} · {e.finalOverall} overall
              {e.awards.length > 0 && ` · ${e.awards.join(", ")}`}
            </span>
          </div>
        ))
      )}

      <p style={{ marginTop: "2rem" }}>
        <button className="ghost" type="button" onClick={onBack}>
          Back
        </button>
      </p>
    </div>
  );
}
