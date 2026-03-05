import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-primary">
      <div className="text-center">
        <h1 className="mb-2 text-4xl font-bold text-fg-primary">404</h1>
        <p className="mb-6 text-fg-secondary">Page not found</p>
        <Link
          href="/"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-fg transition-all hover:bg-accent-hover"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
