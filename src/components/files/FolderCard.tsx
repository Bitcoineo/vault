"use client";

import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";

interface FolderCardProps {
  id: string;
  name: string;
  viewMode: "grid" | "list";
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onFileDrop?: (fileId: string, folderId: string) => void;
}

export function FolderCard({
  id,
  name,
  viewMode,
  onRename,
  onDelete,
  onFileDrop,
}: FolderCardProps) {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(name);
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isRenaming]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    }
    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showMenu]);

  const handleRename = () => {
    if (newName.trim() && newName.trim() !== name) {
      onRename(id, newName.trim());
    }
    setIsRenaming(false);
  };

  const handleFolderDragOver = (e: React.DragEvent) => {
    if (e.dataTransfer.types.includes("application/x-vault-file")) {
      e.preventDefault();
      setIsDragOver(true);
    }
  };

  const handleFolderDragLeave = () => {
    setIsDragOver(false);
  };

  const handleFolderDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const fileId = e.dataTransfer.getData("application/x-vault-file");
    if (fileId && onFileDrop) {
      onFileDrop(fileId, id);
    }
  };

  const dragOverRing = isDragOver ? "ring-2 ring-accent" : "";

  const folderIcon = (
    <svg
      width={viewMode === "grid" ? 40 : 20}
      height={viewMode === "grid" ? 40 : 20}
      viewBox="0 0 24 24"
      fill="currentColor"
      className="text-accent"
    >
      <path d="M10 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-8l-2-2z" />
    </svg>
  );

  const contextMenu = (
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
        <div className="absolute right-0 top-full z-10 mt-1 w-40 rounded-xl border border-border bg-bg-primary py-1 shadow-lg">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(false);
              setIsRenaming(true);
            }}
            className="w-full px-3 py-1.5 text-left text-sm text-fg-primary hover:bg-bg-secondary"
          >
            Rename
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(false);
              onDelete(id);
            }}
            className="w-full px-3 py-1.5 text-left text-sm text-danger hover:bg-bg-secondary"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );

  if (viewMode === "list") {
    return (
      <div
        className={`group flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 transition-all hover:bg-bg-primary hover:shadow-sm ${dragOverRing}`}
        onClick={() => router.push(`/files?folderId=${id}`)}
        onDragOver={handleFolderDragOver}
        onDragLeave={handleFolderDragLeave}
        onDrop={handleFolderDrop}
      >
        {folderIcon}
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
            onClick={(e) => e.stopPropagation()}
            className="rounded-lg border border-accent bg-bg-primary px-2 py-0.5 text-sm text-fg-primary outline-none"
          />
        ) : (
          <span className="flex-1 truncate text-[15px] font-medium text-fg-primary">
            {name}
          </span>
        )}
        <span className="text-xs text-fg-tertiary">Folder</span>
        {contextMenu}
      </div>
    );
  }

  return (
    <div
      className={`group relative cursor-pointer rounded-2xl border border-border bg-bg-primary p-5 transition-all hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] ${dragOverRing}`}
      onClick={() => router.push(`/files?folderId=${id}`)}
      onDragOver={handleFolderDragOver}
      onDragLeave={handleFolderDragLeave}
      onDrop={handleFolderDrop}
    >
      <div className="mb-3 flex items-center justify-between">
        {folderIcon}
        {contextMenu}
      </div>
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
          onClick={(e) => e.stopPropagation()}
          className="w-full rounded-lg border border-accent bg-bg-primary px-2 py-0.5 text-sm text-fg-primary outline-none"
        />
      ) : (
        <p className="truncate text-[15px] font-medium text-fg-primary">{name}</p>
      )}
    </div>
  );
}
