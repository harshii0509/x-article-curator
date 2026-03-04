"use client";

import { useEffect } from "react";

type ToastProps = {
  message: string;
  onDone: () => void;
};

export function Toast({ message, onDone }: ToastProps) {
  useEffect(() => {
    const id = window.setTimeout(onDone, 2000);
    return () => window.clearTimeout(id);
  }, [onDone]);

  if (!message) return null;

  return (
    <div className="fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
      <div className="rounded-full bg-zinc-900 px-4 py-1.5 text-xs font-medium text-zinc-50 shadow-lg shadow-black/40">
        {message}
      </div>
    </div>
  );
}

