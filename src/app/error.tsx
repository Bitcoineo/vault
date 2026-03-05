"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-primary">
      <div className="text-center">
        <h1 className="mb-2 text-4xl font-bold text-fg-primary">500</h1>
        <p className="mb-6 text-fg-secondary">Something went wrong</p>
        <button
          onClick={reset}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-fg transition-all hover:bg-accent-hover"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
