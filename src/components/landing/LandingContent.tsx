"use client";

import Link from "next/link";
import { LandingNav } from "./LandingNav";
import { HeroVisual } from "./HeroVisual";
import { ScrollReveal } from "./ScrollReveal";

export function LandingContent() {
  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      <LandingNav />

      {/* HERO — Full viewport */}
      <section className="relative flex min-h-screen items-center overflow-hidden">
        {/* SVG Globe — background */}
        <HeroVisual />

        {/* Text content — foreground */}
        <div className="relative z-10 mx-auto w-full max-w-6xl px-6 py-32 lg:py-0">
          <div className="max-w-2xl">
            {/* Headline */}
            <h1 className="mb-6 font-[family-name:var(--font-outfit)] text-5xl font-bold tracking-tight text-[#E8ECF1] sm:text-6xl md:text-7xl">
              All your files.
              <br />
              Refined.
            </h1>

            {/* Subtitle */}
            <p className="mb-10 max-w-lg font-[family-name:var(--font-dm-sans)] text-lg leading-relaxed text-[#8B95A5] md:text-xl">
              Upload, edit, compress, and share — all in one place.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/auth/signup"
                className="rounded-full bg-[#3B82F6] px-8 py-3.5 font-[family-name:var(--font-dm-sans)] text-[15px] font-medium text-white shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all hover:bg-[#2563EB] hover:shadow-[0_0_30px_rgba(59,130,246,0.45)] hover:scale-[1.02] active:scale-[0.98]"
              >
                Get started free
              </Link>
              <button
                onClick={() => {
                  document
                    .getElementById("features")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
                className="rounded-full border border-[#2A2F3A] px-6 py-3.5 font-[family-name:var(--font-dm-sans)] text-[15px] text-[#8B95A5] transition-all hover:border-[#3B82F6]/40 hover:text-[#E8ECF1]"
              >
                Learn more ↓
              </button>
            </div>
          </div>
        </div>

        {/* Bottom gradient fade */}
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0D0D14] to-transparent" />
      </section>

      {/* FEATURES */}
      <section id="features" className="bg-[#0D0D14] px-6 py-32">
        <div className="mx-auto max-w-5xl">
          <ScrollReveal>
            <h2 className="mb-20 text-center font-[family-name:var(--font-outfit)] text-3xl font-bold tracking-tight text-[#E8ECF1] sm:text-4xl">
              What you can do.
            </h2>
          </ScrollReveal>

          <div className="space-y-24">
            {/* Feature 1: Transform */}
            <ScrollReveal delay={0}>
              <div className="flex flex-col items-start gap-8 md:flex-row md:items-center">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-[#3B82F6]/10">
                  <svg
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#3B82F6"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                      filter:
                        "drop-shadow(0 0 8px rgba(59, 130, 246, 0.4))",
                    }}
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                </div>
                <div>
                  <h3 className="mb-3 font-[family-name:var(--font-outfit)] text-2xl font-semibold text-[#E8ECF1]">
                    Edit in your browser
                  </h3>
                  <p className="max-w-lg font-[family-name:var(--font-dm-sans)] text-lg leading-relaxed text-[#8B95A5]">
                    Crop, rotate, resize. Remove backgrounds. No other tools needed.
                  </p>
                </div>
              </div>
            </ScrollReveal>

            {/* Separator */}
            <div className="mx-auto h-px w-full max-w-md bg-gradient-to-r from-transparent via-[#2A2F3A] to-transparent" />

            {/* Feature 2: Compress */}
            <ScrollReveal delay={100}>
              <div className="flex flex-col items-start gap-8 md:flex-row-reverse md:items-center">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-[#3B82F6]/10">
                  <svg
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#3B82F6"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                      filter:
                        "drop-shadow(0 0 8px rgba(59, 130, 246, 0.4))",
                    }}
                  >
                    <polyline points="4 14 10 14 10 20" />
                    <polyline points="20 10 14 10 14 4" />
                    <line x1="14" y1="10" x2="21" y2="3" />
                    <line x1="3" y1="21" x2="10" y2="14" />
                  </svg>
                </div>
                <div className="md:text-right">
                  <h3 className="mb-3 font-[family-name:var(--font-outfit)] text-2xl font-semibold text-[#E8ECF1]">
                    Make files lighter
                  </h3>
                  <p className="max-w-lg font-[family-name:var(--font-dm-sans)] text-lg leading-relaxed text-[#8B95A5]">
                    Choose your quality. Shrink images or bundle into a zip.
                  </p>
                </div>
              </div>
            </ScrollReveal>

            {/* Separator */}
            <div className="mx-auto h-px w-full max-w-md bg-gradient-to-r from-transparent via-[#2A2F3A] to-transparent" />

            {/* Feature 3: Share */}
            <ScrollReveal delay={200}>
              <div className="flex flex-col items-start gap-8 md:flex-row md:items-center">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-[#3B82F6]/10">
                  <svg
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#3B82F6"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                      filter:
                        "drop-shadow(0 0 8px rgba(59, 130, 246, 0.4))",
                    }}
                  >
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                  </svg>
                </div>
                <div>
                  <h3 className="mb-3 font-[family-name:var(--font-outfit)] text-2xl font-semibold text-[#E8ECF1]">
                    Share with a link
                  </h3>
                  <p className="max-w-lg font-[family-name:var(--font-dm-sans)] text-lg leading-relaxed text-[#8B95A5]">
                    One click, expiring link. No sign-up needed to download.
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section className="relative overflow-hidden bg-[#0A0A0F] px-6 py-32 text-center">
        {/* Radial blue glow */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(59,130,246,0.08) 0%, transparent 70%)",
          }}
        />

        {/* Dot grid pattern */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "radial-gradient(circle, #3B82F6 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        <div className="relative z-10">
          <ScrollReveal>
            <h2 className="mb-6 font-[family-name:var(--font-outfit)] text-3xl font-bold tracking-tight text-[#E8ECF1] sm:text-4xl">
              Ready when you are.
            </h2>
          </ScrollReveal>
          <ScrollReveal delay={100}>
            <Link
              href="/auth/signup"
              className="inline-block rounded-full bg-[#3B82F6] px-10 py-4 font-[family-name:var(--font-dm-sans)] text-base font-medium text-white shadow-[0_0_30px_rgba(59,130,246,0.3)] transition-all hover:bg-[#2563EB] hover:shadow-[0_0_40px_rgba(59,130,246,0.5)] hover:scale-[1.02] active:scale-[0.98]"
            >
              Start for free
            </Link>
          </ScrollReveal>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#0A0A0F] border-t border-[#1A1F2E] px-6 py-6">
        <div className="flex items-center justify-center gap-4 font-[family-name:var(--font-dm-sans)] text-sm text-[#4A5568]">
          <span>Built by Bitcoineo</span>
          <a
            href="https://github.com/Bitcoineo/vault"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-[#8B95A5]"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
          </a>
          <a
            href="https://x.com/Bitcoineo"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-[#8B95A5]"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>
        </div>
      </footer>
    </div>
  );
}
