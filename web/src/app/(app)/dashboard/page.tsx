"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { LinkList } from "@/components/link-list";
import { safeGet } from "@/lib/storage";

const TOKEN_KEY = "nightstand-api-token";

type AuthState = "pending" | "unauthenticated" | "authenticated";

export default function DashboardPage() {
  const router = useRouter();
  const [authState, setAuthState] = useState<AuthState>("pending");

  useEffect(() => {
    const token = safeGet(TOKEN_KEY);
    if (!token) {
      setAuthState("unauthenticated");
      router.replace("/");
    } else {
      setAuthState("authenticated");
    }
  }, [router]);

  if (authState === "pending") {
    return (
      <main className="mx-auto flex max-w-3xl flex-col gap-6">
        <div className="rounded-xl border border-ns-ink/10 bg-ns-surface px-4 py-8 text-center text-sm text-ns-ink/60">
          Loading…
        </div>
      </main>
    );
  }

  if (authState === "unauthenticated") {
    return null;
  }

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6">
      <LinkList />
    </main>
  );
}

