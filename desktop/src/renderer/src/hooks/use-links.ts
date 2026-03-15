import useSWR from "swr";
import { apiFetch } from "../lib/api";
import type { Link } from "../lib/types";

type LinksResponse = { links: Link[]; page: number; limit: number };

export function useLinks(token: string | null) {
  return useSWR(
    token ? ["links", token] : null,
    ([, t]) => apiFetch<LinksResponse>("/api/links", t),
    { refreshInterval: 10_000 }
  );
}
