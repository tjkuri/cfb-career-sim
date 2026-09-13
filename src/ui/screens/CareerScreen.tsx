import type { CareerView, Resolved } from "../session/types";

interface Props {
  view: CareerView;
  resolved: Resolved | null;
  onChoose: (optionId: string) => void;
  onContinue: () => void;
}

export function CareerScreen({ view, resolved, onChoose, onContinue }: Props) {
  return (
    <div className="frame">
      <div className="rail">
        <span className="rail-school">{view.schoolName ?? "Uncommitted"}</span>
        <span>{view.classYear}</span>
        <span>{view.playerName}</span>
        {view.seasonRecord && <span className="rail-record">{view.seasonRecord}</span>}
      </div>

      <p className="standing">You are {view.standing}.</p>
      <p className="trust">{view.trust}</p>

      {resolved ? (
        <section className="card fade-in" aria-live="polite">
          <h2 className="card-title">{resolved.title}</h2>
          <p className="resolved-choice">You chose: {resolved.choiceLabel}</p>
          <p className="outcome">{resolved.outcome}</p>
          <button className="continue" type="button" onClick={onContinue} autoFocus>
            Continue
          </button>
        </section>
      ) : view.decision ? (
        <section className="card">
          <h2 className="card-title">{view.decision.title}</h2>
          <p className="card-body">{view.decision.description}</p>
          <div className="options">
            {view.decision.options.map((o) => (
              <button key={o.id} className="option" type="button" onClick={() => onChoose(o.id)}>
                {o.label}
              </button>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
