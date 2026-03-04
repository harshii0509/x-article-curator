import { ArticleList } from "@/components/article-list";
import { ApiTokenSection, AuthHeader } from "@/components/auth-header";

export default function DashboardPage() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6">
      <AuthHeader />
      <section className="space-y-4">
        <ApiTokenSection />
        <div>
          <ArticleList />
        </div>
      </section>
    </main>
  );
}

