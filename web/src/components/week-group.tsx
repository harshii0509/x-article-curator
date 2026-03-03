import type { ReactNode } from "react";

interface WeekGroupProps {
  label: string;
  children: ReactNode;
}

export function WeekGroup({ label, children }: WeekGroupProps) {
  return (
    <section className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
        {label}
      </h2>
      <div className="space-y-2.5">{children}</div>
    </section>
  );
}

