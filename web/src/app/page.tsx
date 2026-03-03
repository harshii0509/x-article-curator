import { ArticleList } from "@/components/article-list";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-8 font-sans text-zinc-900 dark:bg-black dark:text-zinc-50">
      <main className="mx-auto flex max-w-3xl flex-col gap-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            X Article Curator
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            A quiet weekly reading list for links you save from X / Twitter.
          </p>
        </header>
        <section>
          {/* @ts-expect-error Async Server Component */}
          <ArticleList />
        </section>
      </main>
    </div>
  );
}
