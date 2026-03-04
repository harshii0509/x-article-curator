export default function DashboardLoading() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 animate-pulse px-4 py-8">
      <header className="space-y-2">
        <div className="h-6 w-48 rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-4 w-64 rounded bg-zinc-200 dark:bg-zinc-800" />
      </header>
      <section className="space-y-3">
        <div className="h-20 rounded-xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900/40" />
        <div className="h-20 rounded-xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900/40" />
      </section>
    </div>
  );
}

