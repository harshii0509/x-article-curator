"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { safeGet, safeSet } from "@/lib/storage";
import { suppressGsiFedCMErrorsForMs } from "@/lib/gsi-console";

const TOKEN_KEY = "nightstand-api-token";
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const USERNAME_KEY = `${TOKEN_KEY}:username`;
const SCRIPT_ID = "google-identity-services";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: string;
              theme?: string;
              size?: string;
              shape?: string;
              width?: number;
              text?: string;
            }
          ) => void;
        };
      };
    };
  }
}

function GoogleIcon() {
  return (
    <svg
      aria-hidden
      className="h-5 w-5 shrink-0"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

export interface GoogleSignInButtonProps {
  label?: string;
  className?: string;
  /** Compact/link style for landing; default is full pill button. */
  variant?: "default" | "compact";
  /** Show the Google G logo; set false for text-only (e.g. landing "Sign in"). */
  showIcon?: boolean;
}

export function GoogleSignInButton({
  label = "Continue with Google",
  className = "",
  variant = "default",
  showIcon = true,
}: GoogleSignInButtonProps) {
  const router = useRouter();
  const hiddenRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const initRef = useRef(false);

  const handleCredential = useCallback(
    async (response: { credential?: string }) => {
      if (!response.credential) return;
      setError(null);
      setLoading(true);
      try {
        const res = await fetch("/api/auth/google", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ credential: response.credential }),
        });
        const data = await res.json();
        if (!res.ok || !data.user?.apiToken) {
          setError(data.error ?? "Google sign-in failed");
          setLoading(false);
          return;
        }
        safeSet(TOKEN_KEY, data.user.apiToken);
        safeSet(`${TOKEN_KEY}:email`, data.user.email ?? "");
        safeSet(USERNAME_KEY, data.user.username ?? "");
        router.replace("/dashboard");
      } catch {
        setError("Google sign-in failed");
        setLoading(false);
      }
    },
    [router]
  );

  useEffect(() => {
    if (typeof window === "undefined" || !GOOGLE_CLIENT_ID) return;

    const runInit = () => {
      if (!window.google?.accounts?.id || !hiddenRef.current || initRef.current)
        return;
      initRef.current = true;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredential,
      });
      window.google.accounts.id.renderButton(hiddenRef.current, {
        type: "standard",
        theme: "outline",
        size: "large",
        shape: "pill",
        width: variant === "compact" ? 120 : 320,
        text: "continue_with",
      });
      suppressGsiFedCMErrorsForMs(8000);
      setReady(true);
    };

    if (window.google?.accounts?.id) {
      runInit();
      return;
    }

    let script = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.id = SCRIPT_ID;
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = runInit;
      document.head.appendChild(script);
    } else if (window.google?.accounts?.id) {
      runInit();
    } else {
      script.onload = runInit;
    }
  }, [GOOGLE_CLIENT_ID, handleCredential, router, variant]);

  const buttonClass =
    variant === "compact"
      ? "inline-flex items-center gap-1.5 font-medium text-ns-accent hover:underline focus:outline-none focus:underline disabled:opacity-50 disabled:cursor-not-allowed"
      : `
        flex w-full items-center justify-center gap-3 rounded-full border border-ns-ink/20
        bg-ns-bg px-4 py-3 font-inter font-medium text-[13px] text-ns-ink
        shadow-sm transition-opacity hover:opacity-90 active:opacity-80
        disabled:cursor-not-allowed disabled:opacity-50
      `;

  const wrapperClass =
    variant === "compact" ? "relative inline-block" : "relative block w-full";

  return (
    <div className={wrapperClass}>
      {/* Custom-styled button (visible). When ready, invisible Google overlay sits on top and receives clicks. */}
      <button
        type="button"
        disabled={!ready || loading}
        aria-hidden={ready}
        className={`${buttonClass} ${className}`.trim()}
        style={ready ? { pointerEvents: "none" } : undefined}
      >
        {showIcon && <GoogleIcon />}
        <span>{loading ? "Signing in…" : label}</span>
      </button>
      {/* Google-rendered button container: overlays our button when ready so real clicks open account picker */}
      <div
        ref={hiddenRef}
        aria-hidden
        className={
          ready
            ? "absolute inset-0 flex cursor-pointer items-center justify-center opacity-0"
            : "absolute left-0 top-0 h-0 w-0 overflow-hidden opacity-0"
        }
        style={ready ? { zIndex: 1 } : undefined}
      />
      {error && (
        <p className="mt-1 text-[11px] text-ns-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
