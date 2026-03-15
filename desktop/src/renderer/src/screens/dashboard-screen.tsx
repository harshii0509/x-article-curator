import { useLinks } from "../hooks/use-links";
import { LinkCard } from "../components/link-card";
import { groupByWeek } from "../lib/week-utils";

interface DashboardScreenProps {
  token: string;
}

export function DashboardScreen({ token }: DashboardScreenProps) {
  const { data, error, isLoading } = useLinks(token);

  if (isLoading && !data) {
    return <LoadingState message="Loading your saved articles…" />;
  }

  if (error || !data) {
    return (
      <ErrorState message={error?.message ?? "Failed to load links"} />
    );
  }

  const links = data.links;

  if (!links.length) {
    return (
      <EmptyState message="No articles saved yet. Use the browser extension to send links here." />
    );
  }

  const weeks = groupByWeek(links);

  return (
    <div className="space-y-8">
      {weeks.map((week) => (
        <section key={week.key.weekStart} className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-ns-ink/50">
            {week.label}
          </h2>
          <div className="space-y-2.5">
            {week.items.map((link) => (
              <LinkCard key={link.id} link={link} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function LoadingState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-ns-ink/10 bg-ns-surface px-4 py-8 text-center text-sm text-ns-ink/60">
      {message}
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-ns-error/40 bg-ns-error-tint px-4 py-8 text-center text-sm text-ns-error-deep">
      {message}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-ns-ink/20 bg-ns-surface px-4 py-8 text-center text-sm text-ns-ink/60">
      {message}
    </div>
  );
}
