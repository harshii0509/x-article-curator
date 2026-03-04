import Link from "next/link";
import { LampLogo } from "@/components/lamp-logo";

export default function LandingPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-4xl flex-col px-6 py-12">
      <main className="mx-auto flex max-w-xl flex-1 flex-col justify-center">
        <div className="mb-5 flex items-center gap-3">
          <LampLogo />
        </div>

        <h1
          className="text-[15px] text-[#EDEDED]"
          style={{ fontFamily: "var(--font-newsreader)", lineHeight: "120%" }}
        >
          (Nightstand) — Your reading pile, but it actually works
        </h1>

        <section
          className="mt-3 space-y-4 text-[13px] text-[#A6A09B]"
          style={{ fontFamily: "var(--font-inter)", lineHeight: "150%" }}
        >
          <p>
            Every week you find articles worth reading. Blog posts linked in
            threads. Essays on Substack. Deep dives someone shared on Twitter.
            You bookmark them. You forget them. By the weekend, they&apos;re
            gone buried in a graveyard of good intentions.
          </p>
          <p>
            Nightstand is where you put things you intend to come back to. One
            click from the browser extension. Title, author, and preview pulled
            automatically. Organized by the week you saved it. When the weekend
            comes round, your reading list is sitting right where you left it.
          </p>
          <p>
            No feeds to scroll. No algorithm deciding what&apos;s worth your
            time. No onboarding. No tracking. No ads. Just the articles you
            picked, grouped by week, on your nightstand.
          </p>
        </section>

        <div className="mt-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center rounded-sm bg-[#2A2A28] px-2 py-2 text-[13px] font-medium text-[#EDEDED] hover:bg-[#343431]"
            style={{ fontFamily: "var(--font-inter)", lineHeight: "120%" }}
          >
            Login to get started
          </Link>
        </div>
      </main>
    </div>
  );
}

