"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";

type ToastProps = {
  message: string;
  onDone: () => void;
  variant?: "default" | "success";
};

const TOAST_DURATION_MS = 2000;
const TOAST_EXIT_MS = 300;

export function Toast({ message, onDone, variant = "default" }: ToastProps) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const showTimer = window.setTimeout(() => {
      setExiting(true);
    }, TOAST_DURATION_MS);
    return () => window.clearTimeout(showTimer);
  }, []);

  useEffect(() => {
    if (!exiting) return;
    const doneTimer = window.setTimeout(onDone, TOAST_EXIT_MS);
    return () => window.clearTimeout(doneTimer);
  }, [exiting, onDone]);

  if (!message) return null;

  const isSuccess = variant === "success" || message === "Saved" || message === "Already saved";

  return (
    <div className="fixed z-50" style={{ top: "24px", right: "32px" }}>
      <div
        className={`flex items-center rounded-full bg-ns-ink text-ns-accent-fg shadow-lg shadow-black/40 ${
          exiting ? "toast-exit" : "toast-enter"
        }`}
        style={{
          padding: "6px",
          gap: "4px",
        }}
      >
        {isSuccess && (
          <Check
            size={16}
            strokeWidth={1.5}
            className="shrink-0 text-ns-success"
            aria-hidden
          />
        )}
        <span
          className="font-semibold"
          style={{
            fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
            fontSize: "13px",
            lineHeight: "120%",
            letterSpacing: "-0.1px",
          }}
        >
          {message}
        </span>
      </div>
    </div>
  );
}

