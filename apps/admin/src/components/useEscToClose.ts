import { useEffect } from "react";

/**
 * Calls `onClose` when the user presses Escape. Use inside any modal, drawer
 * or popover component so they can be dismissed with the keyboard.
 */
export function useEscToClose(onClose: () => void, enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, enabled]);
}
