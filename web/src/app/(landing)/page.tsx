import Image from "next/image";
import { WaitlistForm } from "./waitlist-form";
import brandLogo from "@/assets/brandLogo.svg";
import Link from "next/link";
import type { Metadata } from "next";
import { LandingJsonLd } from "@/components/json-ld";

export const metadata: Metadata = {
  title: "Nightstand - Save Articles for Weekend Reading",
  description:
    "Every week you find articles worth reading. By Saturday they're buried and forgotten. Nightstand saves them and groups them by week so when you finally have an hour, your list is already waiting.",
};

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-ns-bg text-ns-ink">
      <LandingJsonLd />
      {/* Same container as Figma: 80px top/left/right, 24px bottom, max 700px, footer at bottom */}
      <div className="flex flex-1 flex-col justify-between pt-20 px-20 pb-6 max-w-[700px]">
        {/* Logo + content block */}
        <div className="flex flex-col gap-8">
          {/* Logo — 80px from top/left via container padding */}
          <div className="h-[71px] w-[72px] shrink-0">
            <Image
              src={brandLogo}
              alt="Nightstand logo"
              width={72}
              height={71}
              priority
              className="h-full w-full object-contain object-top-left"
            />
          </div>

          {/* Text sections + form: 32px between blocks, 40px between Nightstand and About */}
          <div className="flex flex-col gap-8">
            {/* Nightstand */}
            <div className="flex flex-col gap-2">
              <p className="font-newsreader font-medium text-[14px] text-ns-ink tracking-[0.28px] leading-[1.2]">
                Nightstand
              </p>
              <p className="font-inter font-book text-[13px] text-ns-ink tracking-[-0.1px] leading-normal">
                It&apos;s your reading pile, but it actually works. A reading
                list that gives you weekly recap of things to read for that
                week.
              </p>
            </div>

            {/* About */}
            <div className="flex flex-col gap-2">
              <p className="font-newsreader font-medium text-[14px] text-ns-ink tracking-[0.28px] leading-[1.2]">
                About
              </p>
              <p className="font-inter font-book text-[13px] text-ns-ink tracking-[-0.1px] leading-normal">
                Every week you find articles worth reading. By Saturday
                they&apos;re buried and forgotten. Nightstand saves them and
                groups them by week so when you finally have an hour, your list
                is already waiting.
              </p>
            </div>

            {/* Waitlist */}
            <WaitlistForm />
          </div>
        </div>

        {/* Footer — same container, pinned to bottom via justify-between */}
        <footer className="mt-auto flex items-center justify-between pt-6">
          <p className="font-inter font-book text-[13px] text-ns-ink/40 tracking-[-0.1px] leading-[1.2]">
            brought to you by {" "} 
            <Link
              href="https://x.com/harshii04"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              Harshvardhan Agarwal
            </Link>
          </p>
          <p className="font-inter font-book text-[13px] text-ns-ink/40 tracking-[-0.1px] leading-[1.2]">
            ©2026
          </p>
        </footer>
      </div>
    </div>
  );
}
