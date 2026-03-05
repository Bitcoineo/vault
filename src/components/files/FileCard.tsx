"use client";

import { useState, useEffect, useRef } from "react";
import { FileIcon } from "./FileIcon";

interface FileData {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  status: string;
  thumbnailKey: string | null;
  width: number | null;
  height: number | null;
  createdAt: Date | number;
}

interface FileCardProps {
  file: FileData;
  viewMode: "grid" | "list";
  isSelected?: boolean;
  onClick: (e: React.MouseEvent) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onShare?: (id: string) => void;
  onCompress?: (id: string) => void;
  onRemoveBg?: (id: string) => void;
  onDragStart?: (e: React.DragEvent, fileId: string) => void;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 1 ? 1 : 0)} ${units[i]}`;
}

function formatDate(date: Date | number): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function FileCard({
  file,
  viewMode,
  isSelected,
  onClick,
  onDelete,
  onRename,
  onShare,
  onCompress,
  onRemoveBg,
  onDragStart,
}: FileCardProps) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(file.name);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (file.thumbnailKey && file.status === "ready") {
      fetch(`/api/files/${file.id}/thumbnail`)
        .then((r) => r.json())
        .then((res) => {
          if (res.data?.url) setThumbnailUrl(res.data.url);
        })
        .catch(() => {});
    }
  }, [file.id, file.thumbnailKey, file.status]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    }
    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showMenu]);

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

  const selectedStyle = isSelected
    ? "ring-2 ring-accent bg-accent-light"
    : "";

  const statusBadge =
    file.status === "uploading" ? (
      <span className="animate-pulse-subtle rounded-full bg-accent/20 px-2 py-0.5 text-xs text-accent">
        Uploading
      </span>
    ) : file.status === "processing" ? (
      <span className="animate-pulse-subtle rounded-full bg-accent/20 px-2 py-0.5 text-xs text-accent">
        Processing
      </span>
    ) : file.status === "error" ? (
      <span className="rounded-full bg-danger/20 px-2 py-0.5 text-xs text-danger">
        Error
      </span>
    ) : null;

  const menuButton = (
    <div className="relative" ref={menuRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowMenu(!showMenu);
        }}
        className="rounded-full p-1 opacity-0 transition-opacity hover:bg-bg-tertiary group-hover:opacity-100"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="text-fg-secondary"
        >
          <circle cx="12" cy="5" r="1.5" />
          <circle cx="12" cy="12" r="1.5" />
          <circle cx="12" cy="19" r="1.5" />
        </svg>
      </button>
      {showMenu && (
        <div className="absolute right-0 top-full z-10 mt-1 w-40 max-sm:right-auto max-sm:left-0 rounded-xl border border-border bg-bg-primary py-1 shadow-lg">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(false);
              setNewName(file.name);
              setIsRenaming(true);
            }}
            className="w-full px-3 py-1.5 text-left text-sm text-fg-primary hover:bg-bg-secondary"
          >
            Rename
          </button>
          {onShare && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(false);
                onShare(file.id);
              }}
              className="w-full px-3 py-1.5 text-left text-sm text-fg-primary hover:bg-bg-secondary"
            >
              Share
            </button>
          )}
          {onCompress && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(false);
                onCompress(file.id);
              }}
              className="w-full px-3 py-1.5 text-left text-sm text-fg-primary hover:bg-bg-secondary"
            >
              Compress
            </button>
          )}
          {onRemoveBg && /^image\/(jpeg|png|webp)$/.test(file.mimeType) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(false);
                onRemoveBg(file.id);
              }}
              className="w-full px-3 py-1.5 text-left text-sm text-fg-primary hover:bg-bg-secondary"
            >
              Remove background
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(false);
              onDelete(file.id);
            }}
            className="w-full px-3 py-1.5 text-left text-sm text-danger hover:bg-bg-secondary"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );

  const nameDisplay = isRenaming ? (
    <input
      ref={inputRef}
      value={newName}
      onChange={(e) => setNewName(e.target.value)}
      onBlur={handleRename}
      onKeyDown={(e) => {
        if (e.key === "Enter") handleRename();
        if (e.key === "Escape") setIsRenaming(false);
      }}
      onClick={(e) => e.stopPropagation()}
      className="w-full rounded-lg border border-accent bg-bg-primary px-2 py-0.5 text-sm text-fg-primary outline-none"
    />
  ) : null;

  if (viewMode === "list") {
    return (
      <div
        className={`group flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 transition-all hover:bg-bg-primary hover:shadow-sm ${selectedStyle}`}
        onClick={onClick}
        draggable
        onDragStart={(e) => onDragStart?.(e, file.id)}
      >
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt=""
            className="h-8 w-8 rounded-lg object-cover"
          />
        ) : (
          <FileIcon mimeType={file.mimeType} size={20} />
        )}
        {nameDisplay || (
          <span className="flex-1 truncate text-[15px] text-fg-primary">
            {file.name}
          </span>
        )}
        {statusBadge}
        <span className="text-xs text-fg-tertiary">
          {formatBytes(file.size)}
        </span>
        <span className="text-xs text-fg-tertiary">
          {formatDate(file.createdAt)}
        </span>
        {menuButton}
      </div>
    );
  }

  return (
    <div
      className={`group relative cursor-pointer rounded-xl border border-border bg-bg-primary transition-all hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] sm:rounded-2xl ${selectedStyle}`}
      onClick={onClick}
      draggable
      onDragStart={(e) => onDragStart?.(e, file.id)}
    >
      <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-t-xl bg-bg-secondary sm:rounded-t-2xl">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <FileIcon mimeType={file.mimeType} size={48} />
        )}
      </div>
      <div className="p-2.5 sm:p-3.5">
        <div className="flex items-start justify-between gap-1">
          {nameDisplay || (
            <p className="truncate text-xs font-medium text-fg-primary sm:text-[15px]">
              {file.name}
            </p>
          )}
          {menuButton}
        </div>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-xs text-fg-tertiary">
            {formatBytes(file.size)}
          </span>
          {statusBadge}
        </div>
      </div>
    </div>
  );
}
