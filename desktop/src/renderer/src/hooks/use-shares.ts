import useSWR from "swr";
import { apiFetch } from "../lib/api";
import type { ShareItem } from "../lib/types";

type SharesResponse = { items: ShareItem[] };

export function useShares(token: string | null) {
  return useSWR(
    token ? ["shares", token] : null,
    ([, t]) => apiFetch<SharesResponse>("/api/shares", t),
    { refreshInterval: 15_000 }
  );
}
