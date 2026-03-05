"use client";

import { useState } from "react";

interface BulkActionBarProps {
  selectedCount: number;
  folders: { id: string; name: string }[];
  onDelete: () => void;
  onMove: (folderId: string | null) => void;
  onZip?: () => void;
  onClear: () => void;
}

export function BulkActionBar({
  selectedCount,
  folders,
  onDelete,
  onMove,
  onZip,
  onClear,
}: BulkActionBarProps) {
  const [showMoveMenu, setShowMoveMenu] = useState(false);

  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 flex w-full items-center gap-2 border-t border-border bg-bg-primary px-3 py-2.5 shadow-lg sm:bottom-6 sm:left-1/2 sm:right-auto sm:w-auto sm:max-w-md sm:-translate-x-1/2 sm:rounded-2xl sm:border sm:px-5 sm:py-3">
      <span className="text-xs font-medium text-fg-primary sm:text-sm">
        {selectedCount} selected
      </span>

      <div className="h-4 w-px bg-border" />

      {/* Move */}
      {folders.length > 0 && (
        <div className="relative">
          <button
            onClick={() => setShowMoveMenu(!showMoveMenu)}
            className="rounded-full border border-border px-3 py-1.5 text-sm text-fg-primary transition-all hover:bg-bg-secondary hover:shadow-sm"
          >
            Move
          </button>
          {showMoveMenu && (
            <div className="absolute bottom-full left-0 z-10 mb-2 max-h-48 w-48 overflow-y-auto rounded-xl border border-border bg-bg-primary py-1 shadow-lg">
              <button
                onClick={() => {
                  onMove(null);
                  setShowMoveMenu(false);
                }}
                className="w-full px-3 py-1.5 text-left text-sm text-fg-secondary hover:bg-bg-secondary"
              >
                Root (no folder)
              </button>
              {folders.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => {
                    onMove(folder.id);
                    setShowMoveMenu(false);
                  }}
                  className="w-full px-3 py-1.5 text-left text-sm text-fg-primary hover:bg-bg-secondary"
                >
                  {folder.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Zip */}
      {onZip && selectedCount > 1 && (
        <button
          onClick={onZip}
          className="rounded-full border border-border px-3 py-1.5 text-sm text-fg-primary transition-all hover:bg-bg-secondary hover:shadow-sm"
        >
          Zip
        </button>
      )}

      {/* Delete */}
      <button
        onClick={onDelete}
        className="rounded-full border border-danger/30 px-3 py-1.5 text-sm font-medium text-danger transition-all hover:bg-danger/10"
      >
        Delete
      </button>

      {/* Clear */}
      <button
        onClick={onClear}
        className="rounded-full p-1 text-fg-tertiary transition-colors hover:text-fg-primary"
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
  );
}
