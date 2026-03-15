import type { ReactNode } from "react";
import { ShareWeekButton } from "@/components/share-week-button";

interface WeekGroupProps {
  label: string;
  children: ReactNode;
  weekStart?: number;
  isPublic?: boolean;
  username?: string | null;
  onToggle?: (next: boolean) => void;
  onUsernameRequired?: () => void;
}

export function WeekGroup({
  label,
  children,
  weekStart,
  isPublic,
  username,
  onToggle,
  onUsernameRequired,
}: WeekGroupProps) {
  const shareEnabled =
    typeof weekStart === "number" &&
    typeof isPublic === "boolean" &&
    !!onToggle &&
    !!onUsernameRequired;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-ns-ink/50">
          {label}
        </h2>
        {shareEnabled ? (
          <ShareWeekButton
            weekStart={weekStart!}
            isPublic={isPublic!}
            username={username ?? null}
            onToggled={onToggle!}
            onUsernameRequired={onUsernameRequired!}
          />
        ) : null}
      </div>
      <div className="space-y-2.5">{children}</div>
    </section>
  );
}


