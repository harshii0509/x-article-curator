import { useCollections } from "../hooks/use-collections";
import { CollectionCard } from "../components/collection-card";

interface CollectionsScreenProps {
  token: string;
}

export function CollectionsScreen({ token }: CollectionsScreenProps) {
  const { data, error, isLoading } = useCollections(token);

  if (isLoading && !data) {
    return (
      <div className="space-y-4">
        <h1 className="text-xs font-semibold uppercase tracking-[0.14em] text-ns-ink/50">
          Collections
        </h1>
        <div className="rounded-xl border border-ns-ink/10 bg-ns-surface px-4 py-8 text-center text-sm text-ns-ink/60">
          Loading your collections…
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-4">
        <h1 className="text-xs font-semibold uppercase tracking-[0.14em] text-ns-ink/50">
          Collections
        </h1>
        <div className="rounded-xl border border-ns-error/40 bg-ns-error-tint px-4 py-8 text-center text-sm text-ns-error-deep">
          {error?.message ?? "Failed to load collections"}
        </div>
      </div>
    );
  }

  const collections = data.collections;

  return (
    <div className="space-y-4">
      <h1 className="text-xs font-semibold uppercase tracking-[0.14em] text-ns-ink/50">
        Collections
      </h1>

      {collections.length === 0 ? (
        <div className="rounded-xl border border-dashed border-ns-ink/20 bg-ns-surface px-4 py-8 text-center text-sm text-ns-ink/60">
          No collections yet. You'll be able to group links into themed collections here.
        </div>
      ) : (
        <div className="grid gap-3">
          {collections.map((collection) => (
            <CollectionCard key={collection.id} collection={collection} />
          ))}
        </div>
      )}
    </div>
  );
}
