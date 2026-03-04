"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";

import { KeyboardHelp } from "./keyboard-help";
import { Toast } from "./toast";
import { useKeyboardNav } from "@/hooks/use-keyboard-nav";

type DashboardShellProps = {
  children: ReactNode;
  itemCount: number;
};

export function DashboardShell({ children, itemCount }: DashboardShellProps) {
  const { focusedIndex, showHelp, setShowHelp } = useKeyboardNav(
    itemCount - 1,
  );
  const [toast, setToast] = useState("");

  const contextValue = useMemo(
    () => ({ focusedIndex, setToast }),
    [focusedIndex],
  );

  return (
    <DashboardContext.Provider value={contextValue}>
      {children}
      <KeyboardHelp open={showHelp} onClose={() => setShowHelp(false)} />
      {toast ? <Toast message={toast} onDone={() => setToast("")} /> : null}
    </DashboardContext.Provider>
  );
}

type DashboardContextValue = {
  focusedIndex: number | null;
  setToast: (msg: string) => void;
};

export const DashboardContext = /*#__PURE__*/ ((): React.Context<DashboardContextValue> => {
  // Lazy import to avoid React import cycles in server components if used there.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const React = require("react") as typeof import("react");
  return React.createContext<DashboardContextValue>({
    focusedIndex: null,
    setToast: () => {},
  });
})();

