import type { UserMeta } from "../lib/types";

export type Screen = "dashboard" | "collections" | "shared";

interface SidebarProps {
  active: Screen;
  onNavigate: (screen: Screen) => void;
  user: UserMeta | null;
  onSignOut: () => void;
}

const NAV_ITEMS: { screen: Screen; label: string }[] = [
  { screen: "dashboard", label: "Links" },
  { screen: "collections", label: "Collections" },
  { screen: "shared", label: "Shared" },
];

export function Sidebar({ active, onNavigate, user, onSignOut }: SidebarProps) {
  return (
    <aside className="flex h-full w-48 flex-shrink-0 flex-col border-r border-ns-ink/10 bg-ns-surface">
      {/* Title bar drag region (macOS traffic lights) */}
      <div className="h-10 w-full" style={{ WebkitAppRegion: "drag" } as React.CSSProperties} />

      <div className="flex flex-1 flex-col gap-1 px-3 py-2">
        <p className="mb-3 px-2 font-serif text-base font-medium tracking-tight text-ns-ink">
          Nightstand
        </p>

        {NAV_ITEMS.map((item) => (
          <button
            key={item.screen}
            type="button"
            onClick={() => onNavigate(item.screen)}
            className={`w-full rounded-lg px-3 py-1.5 text-left text-sm transition-colors ${
              active === item.screen
                ? "bg-ns-accent/15 font-medium text-ns-accent"
                : "text-ns-ink/60 hover:bg-ns-ink/5 hover:text-ns-ink"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* User / sign out */}
      <div className="border-t border-ns-ink/10 p-3">
        {user?.email ? (
          <p className="mb-2 truncate text-[11px] text-ns-ink/50">{user.email}</p>
        ) : null}
        <button
          type="button"
          onClick={onSignOut}
          className="w-full rounded-lg border border-ns-ink/15 px-3 py-1.5 text-left text-xs font-medium text-ns-ink/60 transition-colors hover:bg-ns-ink/5 hover:text-ns-ink"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
