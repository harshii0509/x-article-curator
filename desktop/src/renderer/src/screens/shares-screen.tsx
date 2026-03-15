import { useShares } from "../hooks/use-shares";
import { LinkCard } from "../components/link-card";
import { CollectionCard } from "../components/collection-card";

interface SharesScreenProps {
  token: string;
}

export function SharesScreen({ token }: SharesScreenProps) {
  const { data, error, isLoading } = useShares(token);

  if (isLoading && !data) {
    return (
      <div className="space-y-4">
        <h1 className="text-xs font-semibold uppercase tracking-[0.14em] text-ns-ink/50">
          Shared with you
        </h1>
        <div className="rounded-xl border border-ns-ink/10 bg-ns-surface px-4 py-8 text-center text-sm text-ns-ink/60">
          Loading items shared with you…
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-4">
        <h1 className="text-xs font-semibold uppercase tracking-[0.14em] text-ns-ink/50">
          Shared with you
        </h1>
        <div className="rounded-xl border border-ns-error/40 bg-ns-error-tint px-4 py-8 text-center text-sm text-ns-error-deep">
          {error?.message ?? "Failed to load shared items"}
        </div>
      </div>
    );
  }

  const items = data.items;

  return (
    <div className="space-y-4">
      <h1 className="text-xs font-semibold uppercase tracking-[0.14em] text-ns-ink/50">
        Shared with you
      </h1>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-ns-ink/20 bg-ns-surface px-4 py-8 text-center text-sm text-ns-ink/60">
          Nothing has been shared with you yet.
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.share.id}
              className="space-y-2 rounded-xl border border-ns-ink/10 bg-ns-surface p-4"
            >
              <div className="space-y-0.5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ns-ink/50">
                  Shared by{" "}
                  {item.fromUser?.name ?? item.fromUser?.email ?? "Someone"}
                </p>
                {item.share.message ? (
                  <p className="text-xs text-ns-ink/60">{item.share.message}</p>
                ) : null}
              </div>
              {item.link ? (
                <LinkCard link={item.link} readonly />
              ) : item.collection ? (
                <CollectionCard collection={item.collection} />
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
