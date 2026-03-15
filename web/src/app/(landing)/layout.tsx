import type { ReactNode } from "react";

export default function LandingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh w-full bg-ns-bg text-ns-ink">
      {children}
    </div>
  );
}

