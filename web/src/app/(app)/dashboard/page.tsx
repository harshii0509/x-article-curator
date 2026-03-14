"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { LinkList } from "@/components/link-list";

const TOKEN_KEY = "nightstand-api-token";

type AuthState = "pending" | "unauthenticated" | "authenticated";

export default function DashboardPage() {
  const router = useRouter();
  const [authState, setAuthState] = useState<AuthState>("pending");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = window.localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setAuthState("unauthenticated");
      router.replace("/login");
    } else {
      setAuthState("authenticated");
    }
  }, [router]);

  if (authState === "pending") {
    return (
      <main className="mx-auto flex max-w-3xl flex-col gap-6">
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-8 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-400">
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

