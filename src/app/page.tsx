import { auth } from "../../auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function Home() {
  const session = await auth();
  if (session?.user) redirect("/files");

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            className="text-accent"
          >
            <path
              d="M12 2L3 7v10l9 5 9-5V7l-9-5z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <path
              d="M12 22V12"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M3 7l9 5 9-5"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
          <span className="text-xl font-bold text-fg-primary">Vault</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/auth/signin"
            className="text-sm text-fg-secondary hover:text-fg-primary"
          >
            Sign in
          </Link>
          <Link
            href="/auth/signup"
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-fg transition-all hover:bg-accent-hover"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 py-24 text-center">
        <h1 className="mb-6 text-5xl font-bold tracking-tight text-fg-primary">
          Your files,{" "}
          <span className="text-accent">processed and organized</span>
        </h1>
        <p className="mx-auto mb-10 max-w-2xl text-lg text-fg-secondary">
          Upload files to the cloud, automatically generate thumbnails, extract
          text from PDFs, and organize everything in folders. 1 GB free.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/auth/signup"
            className="rounded-lg bg-accent px-6 py-3 text-sm font-medium text-accent-fg transition-all hover:bg-accent-hover hover:scale-[1.02] active:scale-[0.98]"
          >
            Start for Free
          </Link>
          <Link
            href="/auth/signin"
            className="rounded-lg border border-border px-6 py-3 text-sm font-medium text-fg-primary transition-all hover:bg-bg-secondary"
          >
            Sign In
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-5xl px-6 pb-24">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Direct Upload",
              desc: "Drag and drop files directly to cloud storage. No server bottleneck — uploads go straight to Cloudflare R2.",
              icon: (
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
              ),
            },
            {
              title: "Auto Processing",
              desc: "Images get thumbnails automatically. PDFs have their text extracted. Everything is indexed and searchable.",
              icon: (
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
              ),
            },
            {
              title: "Secure Access",
              desc: "Files are private by default. Signed URLs expire after 1 hour. Your data stays under your control.",
              icon: (
                <>
                  <rect
                    x="3"
                    y="11"
                    width="18"
                    height="11"
                    rx="2"
                    ry="2"
                  />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </>
              ),
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border border-border bg-bg-primary p-6 transition-all hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-accent-light">
                <svg
                  width="20"
                  height="20"
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
              <h3 className="mb-2 text-lg font-semibold text-fg-primary">
                {feature.title}
              </h3>
              <p className="text-sm leading-relaxed text-fg-secondary">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-6">
        <div className="flex items-center justify-center gap-3 text-sm text-fg-tertiary">
          <span>Built by Bitcoineo</span>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-fg-tertiary transition-colors hover:text-fg-primary"
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
            className="text-fg-tertiary transition-colors hover:text-fg-primary"
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
