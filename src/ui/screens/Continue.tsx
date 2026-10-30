import { useCallback } from "react";

// Focus a button as it appears, so Enter and Space work straight away, without
// scrolling it into view. `autoFocus` scrolls, which yanked the page to the
// bottom of every tall card.
export function useQuietFocus() {
  return useCallback((el: HTMLElement | null) => el?.focus({ preventScroll: true }), []);
}

export function ContinueButton({ onContinue, label = "Continue" }: { onContinue: () => void; label?: string }) {
  const focus = useQuietFocus();
  return (
    <button type="button" className="go" onClick={onContinue} ref={focus}>
      {label}
    </button>
  );
}
