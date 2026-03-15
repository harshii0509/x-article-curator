import { NavBar } from "@/components/nav-bar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh w-full flex-col bg-ns-bg text-ns-ink font-inter">
      <NavBar />
      <div className="flex-1 px-6 py-8">{children}</div>
    </div>
  );
}
