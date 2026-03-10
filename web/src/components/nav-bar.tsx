"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const TOKEN_KEY = "nightstand-api-token";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Links" },
  { href: "/collections", label: "Collections" },
  { href: "/shared", label: "Shared" },
] as const;

function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={`text-xs font-medium transition-colors ${
        isActive
          ? "text-zinc-900 dark:text-zinc-50"
          : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
      }`}
    >
      {label}
    </Link>
  );
}

export function NavBar() {
  const router = useRouter();
  const [auth, setAuth] = useState<{
    token: string | null;
    email: string | null;
  }>({ token: null, email: null });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = window.localStorage.getItem(TOKEN_KEY);
    const email = window.localStorage.getItem(`${TOKEN_KEY}:email`);
    setAuth({ token, email });
  }, []);

  if (!auth.token) return null;

  const handleSignOut = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(TOKEN_KEY);
      window.localStorage.removeItem(`${TOKEN_KEY}:email`);
      window.localStorage.removeItem(`${TOKEN_KEY}:username`);
    }
    router.push("/login");
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-6 py-3">
        <Link
          href="/dashboard"
          className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-50"
        >
          Nightstand
        </Link>

        <div className="flex items-center gap-4">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.href} href={item.href} label={item.label} />
          ))}
        </div>

        <div className="flex items-center gap-3">
          {auth.email ? (
            <span className="hidden text-xs text-zinc-500 dark:text-zinc-400 sm:inline">
              {auth.email}
            </span>
          ) : null}
          <button
            type="button"
            onClick={handleSignOut}
            className="rounded-full border border-zinc-300 px-3 py-1 text-[11px] font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
}
