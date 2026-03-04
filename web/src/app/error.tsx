"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-black px-4 py-8 font-sans text-zinc-50">
        <main className="mx-auto flex max-w-md flex-col items-center gap-4 text-center">
          <h1 className="text-lg font-semibold">Something went wrong</h1>
          <p className="text-sm text-zinc-400">
            The app hit an unexpected error. You can try again, or refresh the
            page.
          </p>
          <button
            type="button"
            onClick={reset}
            className="rounded-full bg-zinc-50 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-200"
          >
            Try again
          </button>
          <p className="truncate text-[11px] text-zinc-600">
            <span className="font-mono">Error:</span> <span>{error.message}</span>
          </p>
        </main>
      </body>
    </html>
  );
}
