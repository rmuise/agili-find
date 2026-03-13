import { useEffect, type RefObject } from "react";

/**
 * Calls `onClose` when a click occurs outside the given ref(s).
 */
export function useClickOutside(
  refs: RefObject<HTMLElement | null> | RefObject<HTMLElement | null>[],
  onClose: () => void,
  enabled = true
) {
  useEffect(() => {
    if (!enabled) return;

    const refArray = Array.isArray(refs) ? refs : [refs];

    function handleClick(e: MouseEvent) {
      const isOutside = refArray.every(
        (ref) => ref.current && !ref.current.contains(e.target as Node)
      );
      if (isOutside) onClose();
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [refs, onClose, enabled]);
}
