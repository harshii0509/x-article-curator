/**
 * Suppress Google Sign-In FedCM console errors for a short period.
 * GSI logs errors like AbortError (user dismissed picker) and NetworkError
 * (token retrieval failed) — often environmental, not fixable in app code.
 */
export function suppressGsiFedCMErrorsForMs(ms: number): void {
  if (typeof window === "undefined") return;
  const original = console.error;
  console.error = (...args: unknown[]) => {
    const msg = args[0]?.toString?.() ?? "";
    if (msg.includes("GSI_LOGGER") && msg.includes("FedCM")) return;
    original.apply(console, args);
  };
  setTimeout(() => {
    console.error = original;
  }, ms);
}
