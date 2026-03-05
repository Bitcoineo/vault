"use client";

import { useState, useEffect } from "react";

interface ShareLink {
  token: string;
  expiresAt: string;
  createdAt?: Date;
}

interface ShareModalProps {
  fileId: string;
  fileName: string;
  onClose: () => void;
}

export function ShareModal({ fileId, fileName, onClose }: ShareModalProps) {
  const [expiresIn, setExpiresIn] = useState<"1h" | "24h" | "7d">("24h");
  const [creating, setCreating] = useState(false);
  const [links, setLinks] = useState<ShareLink[]>([]);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/files/${fileId}/share`)
      .then((r) => r.json())
      .then((res) => {
        if (res.data) setLinks(res.data);
      })
      .catch(() => {});
  }, [fileId]);

  const createLink = async () => {
    setCreating(true);
    try {
      const res = await fetch(`/api/files/${fileId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expiresIn }),
      });
      const result = await res.json();
      if (result.data) {
        setLinks((prev) => [result.data, ...prev]);
      }
    } catch {
      // ignore
    }
    setCreating(false);
  };

  const copyLink = (token: string) => {
    const url = `${window.location.origin}/share/${token}`;
    navigator.clipboard.writeText(url);
    setCopied(token);
    setTimeout(() => setCopied(null), 2000);
  };

  const formatExpiry = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = d.getTime() - now.getTime();
    if (diff <= 0) return "Expired";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return `${Math.floor(diff / (1000 * 60))}m left`;
    if (hours < 24) return `${hours}h left`;
    return `${Math.floor(hours / 24)}d left`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-border bg-bg-primary shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h3 className="text-[15px] font-medium text-fg-primary">Share file</h3>
            <p className="mt-0.5 truncate text-xs text-fg-tertiary">
              {fileName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-fg-tertiary hover:bg-bg-secondary hover:text-fg-primary"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="p-5">
          {/* Create new link */}
          <div className="flex items-center gap-2">
            <select
              value={expiresIn}
              onChange={(e) =>
                setExpiresIn(e.target.value as "1h" | "24h" | "7d")
              }
              className="rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm text-fg-primary outline-none"
            >
              <option value="1h">1 hour</option>
              <option value="24h">24 hours</option>
              <option value="7d">7 days</option>
            </select>
            <button
              onClick={createLink}
              disabled={creating}
              className="flex-1 rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-fg shadow-sm transition-all hover:bg-accent-hover hover:shadow-md disabled:opacity-50"
            >
              {creating ? "Creating..." : "Create link"}
            </button>
          </div>

          {/* Existing links */}
          {links.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-medium text-fg-tertiary">
                Active links
              </p>
              {links.map((link) => (
                <div
                  key={link.token}
                  className="flex items-center gap-2 rounded-xl border border-border bg-bg-secondary px-3 py-2"
                >
                  <span className="flex-1 truncate font-mono text-xs text-fg-secondary">
                    /share/{link.token.substring(0, 12)}...
                  </span>
                  <span className="shrink-0 text-xs text-fg-tertiary">
                    {formatExpiry(link.expiresAt)}
                  </span>
                  <button
                    onClick={() => copyLink(link.token)}
                    className="shrink-0 rounded-full px-2.5 py-1 text-xs font-medium text-accent transition-colors hover:bg-accent/10"
                  >
                    {copied === link.token ? "Copied!" : "Copy"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
