"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { LinkList } from "@/components/link-list";

const TOKEN_KEY = "nightstand-api-token";

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = window.localStorage.getItem(TOKEN_KEY);
    if (!token) {
      router.replace("/login");
    }
  }, [router]);

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6">
      <LinkList />
    </main>
  );
}

