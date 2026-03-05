"use client";

import { useState, useEffect, useRef } from "react";

interface NewFolderModalProps {
  onClose: () => void;
  onCreate: (name: string) => void;
}

export function NewFolderModal({ onClose, onCreate }: NewFolderModalProps) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    onCreate(name.trim());
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm animate-fade-in-up rounded-2xl border border-border bg-bg-primary p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-lg font-semibold tracking-tight text-fg-primary">
          New folder
        </h2>
        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Folder name"
            className="mb-4 w-full rounded-lg border border-border bg-bg-primary px-3 py-2.5 text-sm text-fg-primary outline-none transition-all focus:bg-bg-secondary focus:ring-2 focus:ring-accent/30 focus:border-accent"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full px-4 py-2 text-sm text-fg-secondary transition-colors hover:bg-bg-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || loading}
              className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-accent-fg shadow-sm transition-all hover:bg-accent-hover hover:shadow-md disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
