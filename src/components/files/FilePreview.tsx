"use client";

import { useState, useEffect, useRef } from "react";
import { FileIcon } from "./FileIcon";

interface FileData {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  status: string;
  width: number | null;
  height: number | null;
  extractedText: string | null;
  createdAt: Date | number;
}

interface FilePreviewProps {
  file: FileData;
  onClose: () => void;
  onDelete: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onEdit?: (id: string) => void;
  onRemoveBg?: (id: string) => void;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 1 ? 1 : 0)} ${units[i]}`;
}

export function FilePreview({ file, onClose, onDelete, onRename, onEdit, onRemoveBg }: FilePreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(file.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (file.status === "ready") {
      fetch(`/api/files/${file.id}/download`)
        .then((r) => r.json())
        .then((res) => {
          if (res.data?.url) setPreviewUrl(res.data.url);
        })
        .catch(() => {});
    }
  }, [file.id, file.status]);

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isRenaming]);

  const handleRename = () => {
    const trimmed = newName.trim();
    if (trimmed && trimmed !== file.name) {
      onRename(file.id, trimmed);
    }
    setIsRenaming(false);
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await fetch(`/api/files/${file.id}/download`);
      const { data } = await res.json();
      if (data?.url) {
        const a = document.createElement("a");
        a.href = data.url;
        a.download = file.name;
        a.target = "_blank";
        a.click();
      }
    } catch {
      // ignore
    }
    setDownloading(false);
  };

  const isImage = file.mimeType.startsWith("image/");
  const isPdf = file.mimeType === "application/pdf";

  return (
    <div className="animate-slide-in-right fixed inset-0 z-50 flex flex-col bg-bg-primary md:relative md:inset-auto md:z-auto md:w-96 md:rounded-l-2xl md:border-l md:border-border md:shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        {isRenaming ? (
          <input
            ref={inputRef}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRename();
              if (e.key === "Escape") setIsRenaming(false);
            }}
            className="mr-2 flex-1 rounded-lg border border-accent bg-bg-primary px-2 py-0.5 text-sm text-fg-primary outline-none"
          />
        ) : (
          <h3
            className="cursor-pointer truncate text-[15px] font-medium text-fg-primary hover:text-accent"
            onClick={() => {
              setNewName(file.name);
              setIsRenaming(true);
            }}
            title="Click to rename"
          >
            {file.name}
          </h3>
        )}
        <button
          onClick={onClose}
          className="rounded-full p-1 text-fg-tertiary transition-colors hover:bg-bg-secondary hover:text-fg-primary"
        >
          <svg
            width="18"
            height="18"
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

      {/* Preview */}
      <div className="flex-1 overflow-y-auto p-4">
        {isImage && previewUrl ? (
          <div className="mb-4 overflow-hidden rounded-xl bg-bg-secondary">
            <img
              src={previewUrl}
              alt={file.name}
              className="w-full object-contain"
            />
          </div>
        ) : (
          <div className="mb-4 flex h-40 items-center justify-center rounded-xl bg-bg-secondary">
            <FileIcon mimeType={file.mimeType} size={64} />
          </div>
        )}

        {/* File Info */}
        <div className="space-y-3">
          <div>
            <span className="text-xs text-fg-tertiary">Type</span>
            <p className="text-[15px] text-fg-primary">{file.mimeType}</p>
          </div>
          <div>
            <span className="text-xs text-fg-tertiary">Size</span>
            <p className="text-[15px] text-fg-primary">{formatBytes(file.size)}</p>
          </div>
          {isImage && file.width && file.height && (
            <div>
              <span className="text-xs text-fg-tertiary">Dimensions</span>
              <p className="text-[15px] text-fg-primary">
                {file.width} x {file.height}
              </p>
            </div>
          )}
          <div>
            <span className="text-xs text-fg-tertiary">Uploaded</span>
            <p className="text-[15px] text-fg-primary">
              {new Date(file.createdAt).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        {/* Extracted Text */}
        {isPdf && file.extractedText && (
          <div className="mt-4">
            <span className="text-xs text-fg-tertiary">Text content</span>
            <div className="mt-1 max-h-40 overflow-y-auto rounded-xl bg-bg-secondary p-3 text-xs leading-relaxed text-fg-secondary">
              {file.extractedText.substring(0, 500)}
              {file.extractedText.length > 500 && "..."}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 border-t border-border p-4">
        <button
          onClick={handleDownload}
          disabled={downloading || file.status !== "ready"}
          className="flex-1 rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-fg shadow-sm transition-all hover:bg-accent-hover hover:shadow-md disabled:opacity-50"
        >
          {downloading ? "..." : "Download"}
        </button>
        {isImage && onEdit && (
          <button
            onClick={() => onEdit(file.id)}
            className="rounded-full border border-border px-4 py-2 text-sm font-medium text-fg-primary transition-all hover:bg-bg-secondary hover:shadow-sm"
          >
            Edit
          </button>
        )}
        {onRemoveBg && /^image\/(jpeg|png|webp)$/.test(file.mimeType) && (
          <button
            onClick={() => onRemoveBg(file.id)}
            className="rounded-full border border-border px-4 py-2 text-sm font-medium text-fg-primary transition-all hover:bg-bg-secondary hover:shadow-sm"
            title="Remove background"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M9 3v18M3 9h18M3 15h6" />
            </svg>
          </button>
        )}
        <button
          onClick={() => onDelete(file.id)}
          className="rounded-full border border-danger/30 px-4 py-2 text-sm font-medium text-danger transition-all hover:bg-danger/10"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
