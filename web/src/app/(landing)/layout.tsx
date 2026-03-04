import type { ReactNode } from "react";

export default function LandingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#111110] text-[#EDEDED]">
      {children}
    </div>
  );
}

