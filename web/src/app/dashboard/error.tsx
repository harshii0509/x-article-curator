"use client";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col gap-4 rounded-2xl border border-zinc-800 bg-zinc-950 px-6 py-6 text-zinc-50 shadow-lg shadow-black/40">
      <h1 className="text-lg font-semibold tracking-tight">
        Something went wrong
      </h1>
      <p className="text-sm text-zinc-400">
        The dashboard hit an unexpected error while rendering your reading
        list. You can try again; if it keeps happening, please refresh the page
        or come back later.
      </p>
      <button
        type="button"
        onClick={reset}
        className="inline-flex items-center justify-center rounded-full bg-zinc-50 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-200"
      >
        Try again
      </button>
      <p className="truncate text-[11px] text-zinc-600">
        <span className="font-mono">Error:</span> <span>{error.message}</span>
      </p>
    </div>
  );
}

