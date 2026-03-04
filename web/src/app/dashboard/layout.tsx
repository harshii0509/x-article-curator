import type { ReactNode } from "react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-8 font-sans text-zinc-900 dark:bg-black dark:text-zinc-50">
      {children}
    </div>
  );
}

