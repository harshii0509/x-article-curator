"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type AuthState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "authenticated"; email: string };

const TOKEN_KEY = "nightstand-api-token";
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const USERNAME_KEY = `${TOKEN_KEY}:username`;

export default function LoginPage() {
  const router = useRouter();
  const [auth, setAuth] = useState<AuthState>({ status: "idle" });
  const [error, setError] = useState<string | null>(null);
  const [googleReady, setGoogleReady] = useState(false);
  const googleButtonRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const existing = window.localStorage.getItem(TOKEN_KEY);
    if (existing) {
      const email =
        window.localStorage.getItem(`${TOKEN_KEY}:email`) ?? "";
      setAuth({ status: "authenticated", email });
      router.replace("/dashboard");
    }
  }, [router]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!GOOGLE_CLIENT_ID) return;
    if (window.google && window.google.accounts && window.google.accounts.id) {
      initializeGoogle();
      return;
    }

    const scriptId = "google-identity-services";
    if (document.getElementById(scriptId)) {
      return;
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      initializeGoogle();
    };
    document.head.appendChild(script);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initializeGoogle = () => {
    if (!GOOGLE_CLIENT_ID) return;
    if (!googleButtonRef.current) return;
    if (!window.google || !window.google.accounts || !window.google.accounts.id) {
      return;
    }
    if (googleButtonRef.current.hasChildNodes()) {
      setGoogleReady(true);
      return;
    }

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleCredential,
    });
    window.google.accounts.id.renderButton(googleButtonRef.current, {
      type: "standard",
      theme: "outline",
      size: "large",
      shape: "pill",
      width: 320,
      text: "continue_with",
    });
    setGoogleReady(true);
  };

  const handleGoogleCredential = async (response: { credential?: string }) => {
    if (!response.credential) return;
    setError(null);
    setAuth({ status: "loading" });
    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: response.credential }),
      });
      const data = await res.json();
      if (!res.ok || !data.user?.apiToken) {
        setError(data.error ?? "Google sign-in failed");
        setAuth({ status: "idle" });
        return;
      }
      if (typeof window !== "undefined") {
        window.localStorage.setItem(TOKEN_KEY, data.user.apiToken);
        window.localStorage.setItem(
          `${TOKEN_KEY}:email`,
          data.user.email ?? "",
        );
        window.localStorage.setItem(
          USERNAME_KEY,
          data.user.username ?? "",
        );
      }
      setAuth({
        status: "authenticated",
        email: data.user.email ?? "",
      });
      router.replace("/dashboard");
    } catch {
      setError("Google sign-in failed");
      setAuth({ status: "idle" });
    }
  };

  const isLoading = auth.status === "loading";

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-12">
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="w-full max-w-sm rounded-xl bg-black/70 px-6 py-5 text-xs text-zinc-300 shadow-lg shadow-black/60">
          {error && (
            <p className="mb-3 text-[11px] text-red-400">
              {error}
            </p>
          )}
          <div className="flex justify-center">
            <div
              ref={googleButtonRef}
              className={`flex justify-center ${!googleReady || isLoading ? "opacity-50" : ""}`}
            />
          </div>
        </div>
      </div>
    </main>
  );
}

