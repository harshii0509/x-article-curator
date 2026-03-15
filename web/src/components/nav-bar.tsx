"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { safeGet, safeRemove } from "@/lib/storage";

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
        isActive ? "text-ns-ink" : "text-ns-ink/50 hover:text-ns-ink"
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
    const token = safeGet(TOKEN_KEY);
    const email = safeGet(`${TOKEN_KEY}:email`);
    setAuth({ token, email });
  }, []);

  if (!auth.token) return null;

  const handleSignOut = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    safeRemove(TOKEN_KEY);
    safeRemove(`${TOKEN_KEY}:email`);
    safeRemove(`${TOKEN_KEY}:username`);
    router.push("/");
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-ns-ink/10 bg-ns-bg/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-6 py-3">
        <Link
          href="/dashboard"
          className="font-newsreader text-sm font-medium tracking-tight text-ns-ink"
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
            <span className="hidden text-xs text-ns-ink/50 sm:inline">
              {auth.email}
            </span>
          ) : null}
          <button
            type="button"
            onClick={handleSignOut}
            className="rounded-full border border-ns-ink/20 px-3 py-1 text-[11px] font-medium text-ns-ink hover:bg-ns-surface"
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
}
