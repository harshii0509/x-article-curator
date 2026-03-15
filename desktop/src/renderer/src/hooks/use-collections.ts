import useSWR from "swr";
import { apiFetch } from "../lib/api";
import type { Collection } from "../lib/types";

type CollectionsResponse = { collections: Collection[] };

export function useCollections(token: string | null) {
  return useSWR(
    token ? ["collections", token] : null,
    ([, t]) => apiFetch<CollectionsResponse>("/api/collections", t),
    { refreshInterval: 15_000 }
  );
}
