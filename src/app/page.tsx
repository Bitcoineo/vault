import { auth } from "../../auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { VaultLogo } from "@/components/ui/VaultLogo";

export default async function Home() {
  const session = await auth();
  if (session?.user) redirect("/files");

  return (
    <div className="min-h-screen bg-bg-primary animate-page-fade-in">
      {/* Floating Glassmorphic Nav */}
      <nav className="fixed left-0 right-0 top-0 z-50 flex items-center justify-between px-6 py-3">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between rounded-full border border-border/60 bg-bg-primary/70 px-6 py-2.5 shadow-sm backdrop-blur-xl">
          <VaultLogo href="/" size={24} textClass="text-base font-semibold tracking-tight text-fg-primary" />
          <div className="flex items-center gap-3">
            <Link
              href="/auth/signin"
              className="text-[15px] text-fg-secondary transition-colors hover:text-fg-primary"
            >
              Sign in
            </Link>
            <Link
              href="/auth/signup"
              className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-accent-fg shadow-sm transition-all hover:bg-accent-hover hover:shadow-md"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto flex max-w-6xl flex-col items-center gap-16 px-6 pb-24 pt-32 lg:flex-row lg:pt-40">
        {/* Left — Copy */}
        <div className="flex-1 text-center lg:text-left">
          <h1 className="mb-6 text-5xl font-semibold tracking-tight text-fg-primary lg:text-6xl">
            Your files.
            <br />
            <span className="text-accent">Sharper, lighter, smarter.</span>
          </h1>
          <p className="mx-auto mb-10 max-w-lg text-lg leading-relaxed text-fg-secondary lg:mx-0">
            Upload anything. Edit images. Extract text. Share with a link.
          </p>
          <Link
            href="/auth/signup"
            className="inline-block rounded-full bg-accent px-8 py-3.5 text-[15px] font-medium text-accent-fg shadow-md transition-all hover:bg-accent-hover hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
          >
            Get started — it&apos;s free
          </Link>
        </div>

        {/* Right — CSS File Card Illustration */}
        <div className="relative flex h-80 w-80 flex-shrink-0 items-center justify-center lg:h-96 lg:w-96">
          {/* Card 1: Image file */}
          <div className="animate-float-slow absolute left-4 top-8 h-48 w-36 rounded-2xl border border-border bg-bg-primary p-3 shadow-lg lg:left-0">
            <div className="mb-2 flex h-28 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-blue-100 to-blue-200">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </div>
            <div className="h-2 w-20 rounded-full bg-bg-tertiary" />
            <div className="mt-1.5 h-1.5 w-12 rounded-full bg-bg-tertiary" />
          </div>

          {/* Card 2: PDF file */}
          <div className="animate-float-medium absolute right-4 top-4 h-48 w-36 rounded-2xl border border-border bg-bg-primary p-3 shadow-lg lg:right-0">
            <div className="mb-2 flex h-28 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-red-50 to-red-100">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>
            <div className="h-2 w-16 rounded-full bg-bg-tertiary" />
            <div className="mt-1.5 h-1.5 w-10 rounded-full bg-bg-tertiary" />
          </div>

          {/* Card 3: Compressed file */}
          <div className="animate-float-fast absolute bottom-2 left-1/2 h-44 w-36 -translate-x-1/2 rounded-2xl border border-border bg-bg-primary p-3 shadow-lg">
            <div className="mb-2 flex h-24 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-amber-50 to-amber-100">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 8v13H3V8" />
                <path d="M1 3h22v5H1z" />
                <path d="M10 12h4" />
              </svg>
            </div>
            <div className="h-2 w-14 rounded-full bg-bg-tertiary" />
            <div className="mt-1.5 h-1.5 w-10 rounded-full bg-bg-tertiary" />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-5xl px-6 pb-28">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Edit",
              desc: "Transform images in your browser",
              icon: (
                <>
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </>
              ),
            },
            {
              title: "Compress",
              desc: "Shrink files without losing quality",
              icon: (
                <>
                  <polyline points="4 14 10 14 10 20" />
                  <polyline points="20 10 14 10 14 4" />
                  <line x1="14" y1="10" x2="21" y2="3" />
                  <line x1="3" y1="21" x2="10" y2="14" />
                </>
              ),
            },
            {
              title: "Share",
              desc: "Generate expiring links in one click",
              icon: (
                <>
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </>
              ),
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-border bg-bg-primary p-8 transition-all hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-accent-light">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-accent"
                >
                  {feature.icon}
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-semibold tracking-tight text-fg-primary">
                {feature.title}
              </h3>
              <p className="text-[15px] leading-relaxed text-fg-secondary">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-gradient-to-br from-[#1e3a5f] to-[#0f172a] px-6 py-24 text-center">
        <h2 className="mb-4 text-3xl font-semibold tracking-tight text-white lg:text-4xl">
          Every file deserves a better home.
        </h2>
        <p className="mx-auto mb-8 max-w-md text-lg text-blue-200/80">
          Fast uploads, smart processing, secure sharing.
        </p>
        <Link
          href="/auth/signup"
          className="inline-block rounded-full bg-white px-8 py-3.5 text-[15px] font-medium text-[#1e3a5f] shadow-lg transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
        >
          Start uploading
        </Link>
      </section>

      {/* Footer */}
      <footer className="bg-[#0f172a] px-6 py-6">
        <div className="flex items-center justify-center gap-4 text-sm text-blue-200/50">
          <span>Built by Bitcoineo</span>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-blue-200/80"
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
            href="https://x.com"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-blue-200/80"
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
