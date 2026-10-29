import { useEffect } from "react";
import type { Role } from "../../engine/index";
import { roundShort } from "../session/game-view";
import type { Chip, DecisionView, GameView, LedgerRow, OptionView, Resolved, SeasonRecap } from "../session/types";

interface Props {
  view: GameView;
  resolved: Resolved | null;
  recap: SeasonRecap | null;
  onChoose: (optionId: string) => void;
  onContinue: () => void;
}

const ROLE_LABEL: Record<Role, string> = { starter: "Starter", rotation: "Rotation", backup: "Backup" };
const MINUS = "−";

export function ovrBand(ovr: number): string {
  if (ovr >= 90) return "elite";
  if (ovr >= 80) return "gold";
  if (ovr >= 70) return "silver";
  return "bronze";
}

function signed(n: number): string {
  return `${n > 0 ? "+" : n < 0 ? MINUS : "±"}${Math.abs(n)}`;
}

export function CareerScreen({ view, resolved, recap, onChoose, onContinue }: Props) {
  const showing = resolved ? "result" : recap ? "recap" : "decision";

  // Number keys pick an option; Enter or Space moves past a card.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "SELECT")) return;
      if (showing === "decision" && view.decision) {
        const i = Number(e.key) - 1;
        const opt = view.decision.options[i];
        if (opt) onChoose(opt.id);
      } else if (showing !== "decision" && (e.key === "Enter" || e.key === " ")) {
        if (target?.tagName === "BUTTON") return; // the focused button handles it
        e.preventDefault();
        onContinue();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showing, view.decision, onChoose, onContinue]);

  // Until the season recap has been read, the header and the ledger show the
  // season as it ended: the offseason's growth is the recap's reveal.
  const shown: GameView = recap
    ? {
        ...view,
        overall: recap.ovrEnd,
        classLabel: recap.classLabel,
        role: recap.role,
        rank: recap.rankBefore,
        round: recap.roundBefore,
        trophyCase: withoutSeason(view, recap.seasonNumber),
      }
    : view;
  const rows = recap
    ? view.ledger.map((r) =>
        r.seasonNumber === recap.seasonNumber
          ? { ...r, state: "current" as const, honors: [] }
          : r.seasonNumber > recap.seasonNumber
            ? { seasonNumber: r.seasonNumber, classLabel: "", state: "future" as const, honors: [] }
            : r,
      )
    : view.ledger;

  return (
    <div className="play">
      <div className="play-main">
        <PlayerCard view={shown} />
        <section className="stage" aria-live="polite">
          {showing === "result" && resolved && <ResultCard r={resolved} view={view} onContinue={onContinue} />}
          {showing === "recap" && recap && <RecapCard r={recap} onContinue={onContinue} />}
          {showing === "decision" && view.decision && <DecisionCard d={view.decision} record={currentRecord(view)} onChoose={onChoose} />}
        </section>
      </div>
      <Ledger rows={rows} />
    </div>
  );
}

// The trophy case minus the awards the recap is about to hand out. A trophy
// won in the big game stays: the big-game card has already shown it.
function withoutSeason(view: GameView, seasonNumber: number): GameView["trophyCase"] {
  const row = view.ledger.find((r) => r.seasonNumber === seasonNumber);
  const pending = (row?.honors ?? []).filter((h) => !["bowlWin", "confTitle", "cfpTitle"].includes(h.id));
  return view.trophyCase
    .map((t) => ({ ...t, count: t.count - pending.filter((h) => h.id === t.id).length }))
    .filter((t) => t.count > 0);
}

function currentRecord(view: GameView): string | null {
  return view.ledger.find((r) => r.state === "current")?.record ?? null;
}

// --- player card -------------------------------------------------------------

function PlayerCard({ view }: { view: GameView }) {
  return (
    <header className="pcard">
      <div className={`ovr ovr-${ovrBand(view.overall)}`}>
        <span className="ovr-num cond">{view.overall}</span>
        <span className="ovr-tag">OVR</span>
      </div>
      <div className="pcard-id">
        <div className="pcard-name cond">
          {view.name} <span className="pcard-num">#{view.number}</span>
        </div>
        <div className="pcard-school">
          {view.schoolName ? (
            <>
              {view.schoolName} <span className="dim">{view.tierName}</span>
            </>
          ) : (
            <span className="dim">Uncommitted</span>
          )}
        </div>
        <div className="pcard-pos dim">
          {view.positionLabel} · {view.classLabel}
        </div>
      </div>
      <dl className="pstats">
        <div>
          <dt>Depth chart</dt>
          {view.classLabel === "RS" ? (
            <dd className="dim">Redshirt</dd>
          ) : (
            <dd className={view.role ? `role role-${view.role}` : "dim"}>{view.role ? ROLE_LABEL[view.role] : "—"}</dd>
          )}
        </div>
        <div title="How coaches, teammates and scouts see you. Let it sink and trouble finds you.">
          <dt>Rep</dt>
          <dd className={view.rep <= 35 ? "bad" : view.rep >= 80 ? "good" : ""}>{view.rep}</dd>
        </div>
        <div title="Your projected pick on NFL big boards, and the round it lands in.">
          <dt>Big board</dt>
          <dd className={view.round === 0 ? "" : view.round <= 2 ? "gold" : ""}>
            #{view.rank} <span className="dd-sub">{roundShort(view.round)}</span>
          </dd>
        </div>
      </dl>
      {view.injury && <div className="injury">🩹 {view.injury}</div>}
      {view.trophyCase.length > 0 && (
        <ul className="case" aria-label="Trophy case">
          {view.trophyCase.map((t) => (
            <li key={t.id} title={t.label}>
              <span aria-hidden="true">{t.icon}</span>
              <span className="case-label">{t.label}</span>
              {t.count > 1 && <span className="case-count">×{t.count}</span>}
            </li>
          ))}
        </ul>
      )}
    </header>
  );
}

// --- decision ----------------------------------------------------------------

function ChipList({ chips }: { chips: Chip[] }) {
  return (
    <span className="chips">
      {chips.map((c, i) => (
        <span key={i} className={`chip chip-${c.tone}`}>
          {c.text}
        </span>
      ))}
    </span>
  );
}

function OptionBody({ o }: { o: OptionView }) {
  if (o.school) {
    const s = o.school;
    return (
      <>
        <span className="opt-label cond">{o.label}</span>
        <span className="school-meta">
          {s.tierName}
          {s.conference && s.conference !== "Independent" ? ` · ${s.conference}` : ""}
        </span>
        <span className={`school-role role-${s.role}`}>You'd be: {ROLE_LABEL[s.role]}</span>
        {s.trait && <span className="school-trait">{s.trait}</span>}
      </>
    );
  }
  if (o.detail !== undefined) {
    return (
      <>
        <span className="opt-label cond">{o.label}</span>
        <span className="opt-detail">{o.detail}</span>
      </>
    );
  }
  return (
    <>
      <span className="opt-label cond">{o.label}</span>
      <span className="branches">
        {o.branches.map((b, i) => (
          <span className="branch" key={i}>
            {o.branches.length > 1 || b.chance < 100 ? (
              <span className="odds">
                <span className="odds-bar" style={{ width: `${b.chance}%` }} />
                <span className="odds-num cond">{b.chance}%</span>
              </span>
            ) : (
              <span className="odds sure cond">Sure thing</span>
            )}
            <ChipList chips={b.chips} />
          </span>
        ))}
      </span>
    </>
  );
}

function DecisionCard({ d, record, onChoose }: { d: DecisionView; record: string | null; onChoose: (id: string) => void }) {
  if (d.kind === "bigGame" && d.bigGame) return <BigGameCard d={d} record={record} onChoose={onChoose} />;
  return (
    <div className="card enter" key={d.title}>
      <h2 className="card-title cond">{d.title}</h2>
      <p className="card-desc">{d.description}</p>
      <div className={`opts opts-${d.options.length}`}>
        {d.options.map((o, i) => (
          <button key={o.id} type="button" className="opt" onClick={() => onChoose(o.id)}>
            <span className="opt-key" aria-hidden="true">
              {i + 1}
            </span>
            <OptionBody o={o} />
          </button>
        ))}
      </div>
    </div>
  );
}

function BigGameCard({ d, record, onChoose }: { d: DecisionView; record: string | null; onChoose: (id: string) => void }) {
  const g = d.bigGame!;
  return (
    <div className="card biggame enter">
      <div className="bug cond">
        <span className="bug-game">{g.name}</span>
        <span className="bug-vs">vs {g.opponent}</span>
      </div>
      {record && <p className="season-so-far">You went {record} in the regular season. It all comes down to this.</p>}
      {g.thrownIn && <p className="thrown">The starter goes down on the drive before. Coach looks down the bench at you.</p>}
      <p className="situation">{g.situation}</p>
      <p className="scout">
        <span aria-hidden="true">📼 </span>
        {g.scout}
      </p>
      <h2 className="card-title cond">Call the play</h2>
      <div className="opts opts-3">
        {d.options.map((o, i) => (
          <button key={o.id} type="button" className="opt" onClick={() => onChoose(o.id)}>
            <span className="opt-key" aria-hidden="true">
              {i + 1}
            </span>
            <OptionBody o={o} />
          </button>
        ))}
      </div>
    </div>
  );
}

// --- result ------------------------------------------------------------------

function ResultCard({ r, view, onContinue }: { r: Resolved; view: GameView; onContinue: () => void }) {
  if (r.bigGame) return <BigGameResultCard r={r} onContinue={onContinue} />;
  const delta = r.ovrAfter - r.ovrBefore;
  const verdict = r.paid === true ? "It pays off" : r.paid === false ? "It backfires" : null;
  return (
    <div className={`card result enter ${r.paid === true ? "is-good" : r.paid === false ? "is-bad" : ""}`}>
      <div className="result-head">
        <span className="result-title">{r.title}</span>
        {verdict && <span className="verdict cond">{verdict}</span>}
      </div>
      <p className="result-choice">{r.choiceLabel}</p>
      <p className="result-text">{r.outcome}</p>
      <ChipList chips={r.chips} />
      {r.roleChange && (
        <p className={`promo ${rank(r.roleChange.to) > rank(r.roleChange.from) ? "good" : "bad"}`}>
          {rank(r.roleChange.to) > rank(r.roleChange.from) ? "Promoted" : "Demoted"}: {ROLE_LABEL[r.roleChange.from]} → {ROLE_LABEL[r.roleChange.to]}
        </p>
      )}
      <div className="result-foot">
        <span className="dim">
          OVR {r.ovrAfter}
          {delta !== 0 && <span className={delta > 0 ? "good" : "bad"}> ({signed(delta)})</span>}
          {view.status !== "active" && view.endingReason && <span className="bad"> · {view.endingReason}</span>}
        </span>
        <ContinueButton onContinue={onContinue} />
      </div>
    </div>
  );
}

function rank(role: Role): number {
  return role === "starter" ? 2 : role === "rotation" ? 1 : 0;
}

function ContinueButton({ onContinue, label = "Continue" }: { onContinue: () => void; label?: string }) {
  return (
    <button type="button" className="go" onClick={onContinue} autoFocus>
      {label}
    </button>
  );
}

function BigGameResultCard({ r, onContinue }: { r: Resolved; onContinue: () => void }) {
  const g = r.bigGame!;
  const [us, them] = g.score;
  return (
    <div className={`card biggame enter ${g.won ? "is-good" : "is-bad"}`}>
      <div className="bug cond">
        <span className="bug-game">{g.name}</span>
        <span className="bug-vs">vs {g.opponent}</span>
      </div>
      <p className="reveal">
        You called <b>{g.call}</b>. They ran <b>{g.counter}</b>.
      </p>
      <div className="final cond">
        <span className="final-word">{g.won ? "Ballgame" : "Stopped"}</span>
        <span className="final-score">
          {g.won ? "W" : "L"} {us}–{them}
        </span>
      </div>
      <p className="result-text">{g.text}</p>
      {g.won && g.stakes !== "rivalry" && (
        <p className="trophy-won">
          {g.stakes === "cfp" ? "💍 National Champions" : g.stakes === "conf" ? "🏆 Conference Champions" : "🥇 Bowl win"}
        </p>
      )}
      <div className="result-foot">
        <span className="dim">{g.won ? "+1 OVR · +3 Rep" : ""}</span>
        <ContinueButton onContinue={onContinue} />
      </div>
    </div>
  );
}

// --- season recap -------------------------------------------------------------

function RecapCard({ r, onContinue }: { r: SeasonRecap; onContinue: () => void }) {
  const growth = r.ovrNext - r.ovrEnd;
  const climbed = r.roundAfter !== 0 && (r.roundBefore === 0 || r.roundAfter < r.roundBefore);
  const fell = r.roundBefore !== 0 && (r.roundAfter === 0 || r.roundAfter > r.roundBefore);
  return (
    <div className="card recap enter">
      <div className="recap-head">
        <span className="dim">
          Season {r.seasonNumber} · {r.classLabel} · {r.schoolName}
        </span>
        <span className="recap-record cond">{r.record}</span>
        <span className="dim">{r.redshirt ? "Redshirted" : r.role ? ROLE_LABEL[r.role] : ""}</span>
      </div>
      {r.bigGame && (
        <p className={`recap-game ${r.bigGame.won ? "good" : "bad"}`}>
          {r.bigGame.won ? "Won" : "Lost"} the {r.bigGame.name} {r.bigGame.score[0]}–{r.bigGame.score[1]}
          {!r.bigGame.played && <span className="dim"> (from the sideline)</span>}
        </p>
      )}
      {!r.redshirt && (
        <dl className="recap-stats">
          {r.stats.map((s) => (
            <div key={s.label}>
              <dt>{s.label}</dt>
              <dd className="cond">{s.value}</dd>
            </div>
          ))}
        </dl>
      )}
      {r.honors.length > 0 && (
        <ul className="honors">
          {r.honors.map((h, i) => (
            <li key={h.id} className={`honor rarity-${h.rarity}`} style={{ animationDelay: `${250 + i * 220}ms` }}>
              <span aria-hidden="true">{h.icon}</span> {h.label}
            </li>
          ))}
        </ul>
      )}
      <div className="recap-moves">
        {!r.final && (
          <div>
            <span className="dim">Offseason growth</span>
            <span className="cond big">
              {r.ovrEnd} → {r.ovrNext} <span className={growth >= 0 ? "good" : "bad"}>{signed(growth)}</span>
            </span>
          </div>
        )}
        <div>
          <span className="dim">{r.final ? "Final big board" : "Big board"}</span>
          <span className={`cond big ${climbed || r.rankAfter < r.rankBefore ? "good" : fell || r.rankAfter > r.rankBefore ? "bad" : ""}`}>
            #{r.rankBefore} → #{r.rankAfter}
            {!r.final && <span className="dd-sub"> {roundShort(r.roundAfter)}</span>}
          </span>
        </div>
      </div>
      <div className="result-foot">
        <span />
        <ContinueButton onContinue={onContinue} label={r.final ? "Go to draft night" : "Next season"} />
      </div>
    </div>
  );
}

// --- ledger ------------------------------------------------------------------

function Ledger({ rows }: { rows: LedgerRow[] }) {
  return (
    <aside className="ledger" aria-label="Career so far">
      <h2 className="ledger-title cond">Career</h2>
      <ol>
        {rows.map((r) => (
          <li key={r.seasonNumber} className={`lrow lrow-${r.state}`}>
            <span className="lrow-class cond">{r.classLabel || `Y${r.seasonNumber}`}</span>
            {r.schoolName ? (
              <span className="lrow-body">
                <span className="lrow-school">
                  {r.schoolName}
                  {r.redshirt ? <span className="dim"> · redshirt</span> : r.role ? <span className={`dim role-${r.role}`}> · {ROLE_LABEL[r.role]}</span> : null}
                </span>
                {r.statLine && r.state === "done" && <span className="lrow-stats dim">{r.statLine}</span>}
                {(r.honors.length > 0 || r.bigGame) && r.state === "done" && (
                  <span className="lrow-honors">
                    {r.bigGame && !r.honors.some((h) => ["bowlWin", "confTitle", "cfpTitle"].includes(h.id)) && (
                      <span className={r.bigGame.won ? "lh-win" : "lh-loss"}>
                        {r.bigGame.won ? "W" : "L"} {r.bigGame.name}
                      </span>
                    )}
                    {r.honors.map((h, i) => (
                      <span key={i} className={`lh rarity-${h.rarity}`} title={h.label}>
                        {h.icon} {h.short}
                      </span>
                    ))}
                  </span>
                )}
              </span>
            ) : (
              <span className="lrow-body dim">{r.state === "current" ? "Offseason" : ""}</span>
            )}
            <span className="lrow-right">
              {r.record && <span className="lrow-record cond">{r.record}</span>}
              {r.overall !== undefined && r.state === "done" && (
                <span className={`lrow-ovr cond ovr-${ovrBand(r.overall)}`}>{r.overall}</span>
              )}
            </span>
          </li>
        ))}
      </ol>
    </aside>
  );
}
