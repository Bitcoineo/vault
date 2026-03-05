"use client";

export interface UploadItem {
  id: string;
  fileName: string;
  status: "pending" | "uploading" | "processing" | "ready" | "error";
  progress: number;
  error?: string;
}

interface UploadProgressProps {
  uploads: UploadItem[];
  onDismiss: () => void;
}

export function UploadProgress({ uploads, onDismiss }: UploadProgressProps) {
  if (uploads.length === 0) return null;

  const activeCount = uploads.filter(
    (u) => u.status !== "ready" && u.status !== "error"
  ).length;
  const allDone = activeCount === 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 w-full animate-slide-in-right rounded-t-xl border border-border bg-bg-primary shadow-lg sm:bottom-4 sm:left-auto sm:right-4 sm:w-80 sm:rounded-xl">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <span className="text-sm font-medium text-fg-primary">
          {allDone
            ? `${uploads.length} file${uploads.length > 1 ? "s" : ""} uploaded`
            : `Uploading`}
        </span>
        {allDone && (
          <button
            onClick={onDismiss}
            className="text-fg-tertiary hover:text-fg-primary"
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
        )}
      </div>
      <div className="max-h-60 overflow-y-auto p-2">
        {uploads.map((upload) => (
          <div key={upload.id} className="flex items-center gap-3 px-2 py-1.5">
            {upload.status === "ready" ? (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="shrink-0 text-success"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : upload.status === "error" ? (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="shrink-0 text-danger"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <div className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs text-fg-primary">
                {upload.fileName}
              </p>
              {upload.status === "uploading" && (
                <div className="mt-1 h-1 overflow-hidden rounded-full bg-bg-tertiary">
                  <div
                    className="h-full rounded-full bg-accent transition-all duration-300"
                    style={{ width: `${upload.progress}%` }}
                  />
                </div>
              )}
              {upload.status === "processing" && (
                <p className="mt-0.5 text-xs text-fg-tertiary">
                  Processing...
                </p>
              )}
              {upload.status === "error" && (
                <p className="mt-0.5 truncate text-xs text-danger">
                  Upload failed{upload.error ? `: ${upload.error}` : ""}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
