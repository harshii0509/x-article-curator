import { useState } from "react";

interface LoginScreenProps {
  onLogin: () => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignIn() {
    setLoading(true);
    setError(null);
    try {
      await window.electronAPI.startGoogleAuth();
      onLogin();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Sign in failed";
      if (!msg.includes("closed by user")) {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-8 bg-ns-bg p-8">
      {/* macOS traffic lights drag region */}
      <div
        className="absolute left-0 top-0 h-10 w-full"
        style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
      />

      <div className="flex flex-col items-center gap-3 text-center">
        <h1 className="font-serif text-3xl font-medium tracking-tight text-ns-ink">
          Nightstand
        </h1>
        <p className="text-sm text-ns-ink/60">Your personal reading list</p>
      </div>

      <div className="flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={handleSignIn}
          disabled={loading}
          className="flex items-center gap-3 rounded-xl border border-ns-ink/15 bg-ns-surface px-6 py-3 text-sm font-medium text-ns-ink shadow-sm transition-all hover:border-ns-ink/25 hover:bg-ns-bg disabled:opacity-60"
        >
          {loading ? (
            <LoadingSpinner />
          ) : (
            <GoogleIcon />
          )}
          {loading ? "Signing in…" : "Sign in with Google"}
        </button>

        {error ? (
          <p className="max-w-xs text-center text-xs text-ns-error">{error}</p>
        ) : null}
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
        fill="#EA4335"
      />
    </svg>
  );
}

function LoadingSpinner() {
  return (
    <svg
      className="animate-spin text-ns-ink/40"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
