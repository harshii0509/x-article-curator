# Performance guidelines

Notes from [Vercel React Best Practices](https://skills.sh/vercel-labs/agent-skills/vercel-react-best-practices). Use these when adding new features.

## Heavy components (Rule 2.4)

For large or heavy UI (e.g. code editor, chart library, rich text editor), load them with `next/dynamic` so they are not in the initial bundle:

```tsx
import dynamic from "next/dynamic";

const HeavyEditor = dynamic(
  () => import("@/components/heavy-editor").then((m) => m.HeavyEditor),
  { ssr: false }
);

export function Panel() {
  return <HeavyEditor />;
}
```

- Use `ssr: false` when the component depends on `window` or browser APIs.
- Optionally use `loading` for a fallback UI while the chunk loads.
- For components triggered by user intent (e.g. "Open editor"), consider preloading on hover/focus (Rule 2.5).

## Client data (Rule 4.3)

- Use **SWR** (or similar) for API data that needs caching and revalidation instead of manual `fetch` + `useEffect` + `setInterval`.
- See `src/components/link-list.tsx` for the pattern with `refreshInterval` and token-based keys.

## Auth and redirects

- Token is in `localStorage`, so auth checks run on the client.
- Dashboard guards content until the token is checked to avoid flashing the UI before redirecting to `/login`. See `src/app/(app)/dashboard/page.tsx`.
