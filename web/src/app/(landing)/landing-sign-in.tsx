"use client";

import { GoogleSignInButton } from "@/components/google-sign-in-button";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

export function LandingSignIn() {
  return (
    <div className="font-inter font-book text-[13px] text-ns-ink/80 tracking-[-0.1px] leading-[1.2]">
      Already have access?{" "}
      {GOOGLE_CLIENT_ID ? (
        <GoogleSignInButton
          label="Sign in"
          variant="compact"
          showIcon={false}
          className="inline"
        />
      ) : (
        <span className="font-medium text-ns-ink/60">Sign in</span>
      )}
    </div>
  );
}
