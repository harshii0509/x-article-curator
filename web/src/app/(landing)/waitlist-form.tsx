"use client";

import { useState } from "react";

function validateEmail(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return "Please enter your email address.";
  if (!trimmed.includes("@")) {
    return `Please include an '@' in the email address. '${trimmed}' is missing an '@'.`;
  }
  const local = trimmed.split("@")[0];
  const domain = trimmed.split("@")[1];
  if (!local?.length) return "Please enter a part before the '@'.";
  if (!domain?.length) return "Please enter a part after the '@'.";
  if (domain.includes(" ")) return "A part following '@' should not contain spaces.";
  return null;
}

export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "already" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const message = validateEmail(email);
    if (message) {
      setValidationError(message);
      setState("error");
      return;
    }
    setValidationError(null);
    setState("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as { alreadyRegistered?: boolean; error?: string };
      if (res.ok) {
        setState(data.alreadyRegistered ? "already" : "done");
      } else {
        setErrorMsg(data.error ?? "Something went wrong.");
        setState("error");
      }
    } catch {
      setErrorMsg("Something went wrong. Please try again.");
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <p className="font-inter font-book text-[13px] text-ns-ink/40 tracking-[-0.1px] leading-[1.2]">
        You&apos;re in! I&apos;m shipping this soon. No more bookmarks you&apos;ll never open. Finally :)
      </p>
    );
  }

  if (state === "already") {
    return (
      <p className="font-inter font-book text-[13px] text-ns-ink/40 tracking-[-0.1px] leading-[1.2]">
        You&apos;re already on the list. I&apos;ll let you know the moment it&apos;s ready.
      </p>
    );
  }

  const displayError = validationError ?? errorMsg;

  return (
    <div className="flex flex-col gap-2">
      <form onSubmit={handleSubmit} className="flex flex-col gap-2" noValidate>
        <div className="flex flex-col md:flex-row md:items-start gap-2">
          <div className="flex flex-col gap-0.5 flex-1">
            <input
              type="email"
              placeholder="Enter email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (validationError) setValidationError(null);
              }}
              disabled={state === "loading"}
              aria-invalid={!!displayError}
              aria-describedby={displayError ? "waitlist-error" : undefined}
              className="
                w-full md:w-[254px] bg-ns-surface rounded-lg px-3 py-2
                font-inter font-book text-[13px] text-ns-ink tracking-[-0.1px] leading-[1.2]
                placeholder:text-ns-ink/40
                focus:outline-none focus:ring-1 focus:ring-ns-accent/40
                disabled:opacity-50
                transition-shadow caret-ns-accent
              "
            />
            {displayError ? (
              <p
                id="waitlist-error"
                role="alert"
                className="w-full md:w-[254px] md:max-w-[254px] font-inter font-book text-[13px] text-ns-error-deep tracking-[-0.1px] leading-[1.3]"
              >
                {displayError}
              </p>
            ) : null}
          </div>
          <button
            type="submit"
            disabled={state === "loading"}
            className="
              w-full md:w-auto bg-ns-accent text-ns-accent-fg rounded-lg px-3 py-2
              font-inter font-medium text-[13px] tracking-[-0.1px] leading-[1.2] whitespace-nowrap
              hover:opacity-90 active:opacity-80
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-opacity hover:cursor-pointer
            "
          >
            {state === "loading" ? "Joining…" : "Join waitlist"}
          </button>
        </div>
      </form>
    </div>
  );
}
