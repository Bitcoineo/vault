"use client";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 1 ? 1 : 0)} ${units[i]}`;
}

const MAX_STORAGE = 1024 * 1024 * 1024; // 1 GB

export function StorageBar({ storageUsed }: { storageUsed: number }) {
  const percentage = Math.min((storageUsed / MAX_STORAGE) * 100, 100);

  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-bg-tertiary">
        <div
          className="h-full rounded-full bg-accent transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs text-fg-tertiary">
        {formatBytes(storageUsed)} / 1 GB
      </span>
    </div>
  );
}
