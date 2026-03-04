import { ArticleList } from "@/components/article-list";
import { ApiTokenSection, AuthHeader } from "@/components/auth-header";
import { DashboardShell } from "@/components/dashboard-shell";

export default function DashboardPage() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Nightstand</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          A quiet weekly reading list for links you save from around the web.
        </p>
        <AuthHeader />
      </header>
      <section className="space-y-4">
        <ApiTokenSection />
        <DashboardShell itemCount={0}>
          <div>
            {/* @ts-expect-error Async Server Component */}
            <ArticleList />
          </div>
        </DashboardShell>
      </section>
    </main>
  );
}

