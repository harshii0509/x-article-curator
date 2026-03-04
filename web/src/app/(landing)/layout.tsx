import type { ReactNode } from "react";

export default function LandingLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-black text-zinc-50">{children}</div>;
}

