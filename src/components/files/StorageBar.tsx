"use client";

import { formatBytes } from "@/lib/format";

const MAX_STORAGE = 1024 * 1024 * 1024; // 1 GB

export function StorageBar({ storageUsed }: { storageUsed: number }) {
  const percentage = Math.min((storageUsed / MAX_STORAGE) * 100, 100);

  return (
    <div className="hidden items-center gap-2 sm:flex">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-bg-tertiary">
        <div
          className="h-full rounded-full bg-accent transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="whitespace-nowrap text-xs text-fg-tertiary">
        {formatBytes(storageUsed)} / 1 GB
      </span>
    </div>
  );
}
