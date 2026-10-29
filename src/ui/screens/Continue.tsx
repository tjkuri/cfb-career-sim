export function ContinueButton({ onContinue, label = "Continue" }: { onContinue: () => void; label?: string }) {
  return (
    <button type="button" className="go" onClick={onContinue} autoFocus>
      {label}
    </button>
  );
}
