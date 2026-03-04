import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-zinc-950 to-black text-zinc-50">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-8">
        {/* Top nav */}
        <header className="flex items-center justify-between pb-10">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 text-[10px] font-bold text-zinc-900">
              N
            </span>
            <span>Nightstand</span>
          </div>
          <Link
            href="/dashboard"
            className="rounded-full border border-zinc-700 px-3 py-1.5 text-[11px] font-medium text-zinc-200 hover:bg-zinc-900"
          >
            Open dashboard
          </Link>
        </header>

        {/* Hero */}
        <main className="flex flex-1 flex-col items-start gap-10 pb-8 md:flex-row md:items-center">
          <section className="max-w-xl space-y-6">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">
              Weekend reading, without the guilt
            </p>
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Your reading pile, but it actually works.
            </h1>
            <p className="text-sm leading-relaxed text-zinc-400">
              Save articles from X, Substack, and the rest of the web into a
              single quiet list. We pull the title, image, and description for
              you and group everything by the week you saved it.
            </p>
            <p className="text-sm leading-relaxed text-zinc-400">
              On the weekend, open Nightstand and your reading stack is waiting
              — no feeds, no algorithm, just the things you decided were worth
              your time.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-full bg-zinc-50 px-5 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-200"
              >
                Get started
              </Link>
              <span className="text-[11px] text-zinc-500">
                60-second setup. No passwords.
              </span>
            </div>
          </section>

          {/* Preview card */}
          <section className="mt-4 w-full max-w-sm flex-1 md:mt-0">
            <div className="relative rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4 shadow-[0_30px_80px_rgba(0,0,0,0.8)]">
              <div className="mb-4 flex items-center justify-between text-[11px] text-zinc-500">
                <span className="uppercase tracking-[0.16em]">
                  This weekend
                </span>
                <span>2–8 Mar</span>
              </div>
              <div className="space-y-2">
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                    Saved link
                  </p>
                  <p className="mt-1 line-clamp-2 text-sm font-medium text-zinc-50">
                    HOW TO 1000x YOUR LIFE
                  </p>
                  <p className="mt-1 line-clamp-2 text-[11px] text-zinc-400">
                    A short thread on having more fun, letting people be, and
                    being delusionally optimistic.
                  </p>
                </div>
                <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900/40 p-3 text-[11px] text-zinc-500">
                  New saves from the extension appear here instantly. No inbox,
                  no bookmarks to dig through.
                </div>
              </div>
            </div>
          </section>
        </main>

        <footer className="mt-6 text-[11px] text-zinc-500">
          Built with Next.js, SQLite, and a tiny Chrome extension. Your data
          stays on your own Nightstand.
        </footer>
      </div>
    </div>
  );
}

