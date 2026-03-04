"use client";

import { useEffect, useState } from "react";

export function useKeyboardNav(maxIndex: number) {
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "?") {
        event.preventDefault();
        setShowHelp((v) => !v);
        return;
      }

      if (event.key === "Escape") {
        setFocusedIndex(null);
        setShowHelp(false);
        return;
      }

      if (maxIndex < 0) return;

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setFocusedIndex((prev) => {
          if (prev == null) return 0;
          return Math.min(prev + 1, maxIndex);
        });
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setFocusedIndex((prev) => {
          if (prev == null) return 0;
          return Math.max(prev - 1, 0);
        });
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [maxIndex]);

  return { focusedIndex, showHelp, setShowHelp };
}

