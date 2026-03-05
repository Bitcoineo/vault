"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { VaultLogo } from "@/components/ui/VaultLogo";
import { formatBytes } from "@/lib/format";

export default function SharePage() {
  const params = useParams<{ token: string }>()!;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<{
    name: string;
    size: number;
    mimeType: string;
  } | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/share/${params.token}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.error) {
          setError(res.error);
        } else if (res.data) {
          setFile(res.data.file);
          setDownloadUrl(res.data.downloadUrl);
        }
      })
      .catch(() => setError("Something went wrong"))
      .finally(() => setLoading(false));
  }, [params.token]);

  const handleDownload = () => {
    if (!downloadUrl || !file) return;
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = file.name;
    a.target = "_blank";
    a.click();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-blue-50/50 to-bg-primary p-4 animate-page-fade-in">
      <div className="w-full max-w-md rounded-2xl border border-border bg-bg-primary p-8 text-center shadow-lg">
        {/* Logo */}
        <div className="mb-6 flex items-center justify-center">
          <VaultLogo href="/" size={32} />
        </div>

        {loading ? (
          <div className="py-8">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            <p className="mt-4 text-sm text-fg-tertiary">Loading...</p>
          </div>
        ) : error ? (
          <div className="py-8">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="mx-auto mb-4 text-danger"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            <p className="text-lg font-medium text-fg-primary">{error}</p>
            <p className="mt-2 text-sm text-fg-tertiary">
              {error === "This link has expired"
                ? "Ask the sender for a new one."
                : "This link doesn't exist."}
            </p>
          </div>
        ) : file ? (
          <div className="py-4">
            {/* File icon */}
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-bg-secondary">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-fg-secondary"
              >
                <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                <polyline points="13 2 13 9 20 9" />
              </svg>
            </div>

            <h2 className="mb-1 text-lg font-semibold tracking-tight text-fg-primary">
              {file.name}
            </h2>
            <p className="mb-6 text-sm text-fg-tertiary">
              {file.mimeType} &middot; {formatBytes(file.size)}
            </p>

            <button
              onClick={handleDownload}
              className="w-full rounded-full bg-accent px-6 py-3 text-sm font-medium text-accent-fg shadow-md transition-all hover:bg-accent-hover hover:shadow-lg"
            >
              Download
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
