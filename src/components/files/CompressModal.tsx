"use client";

import { useState } from "react";
import { formatBytes } from "@/lib/format";

interface CompressModalProps {
  fileName: string;
  fileSize: number;
  mimeType: string;
  onClose: () => void;
  onCompress: (quality: number, format: "original" | "webp" | "jpeg") => void;
}

export function CompressModal({
  fileName,
  fileSize,
  mimeType,
  onClose,
  onCompress,
}: CompressModalProps) {
  const [quality, setQuality] = useState(80);
  const [format, setFormat] = useState<"original" | "webp" | "jpeg">("webp");

  const estimateSize = () => {
    let ratio = quality / 100;
    if (format === "webp") {
      ratio *= 0.65;
    } else if (format === "jpeg") {
      ratio *= 0.75;
    } else {
      if (mimeType === "image/png") ratio *= 0.7;
      else ratio *= 0.8;
    }
    return Math.round(fileSize * ratio);
  };

  const estimated = estimateSize();
  const savings = Math.max(0, Math.round(((fileSize - estimated) / fileSize) * 100));

  const formatLabel = (f: "original" | "webp" | "jpeg") => {
    if (f === "original") {
      const ext = mimeType.split("/")[1]?.toUpperCase() || "Original";
      return `Keep (${ext})`;
    }
    return f.toUpperCase();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-sm rounded-2xl border border-border bg-bg-primary p-6 shadow-lg">
        <h3 className="mb-1 text-base font-semibold tracking-tight text-fg-primary">
          Compress
        </h3>
        <p className="mb-5 truncate text-sm text-fg-tertiary">{fileName}</p>

        {/* Quality Slider */}
        <div className="mb-5">
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm text-fg-secondary">Quality</label>
            <span className="text-sm font-medium text-fg-primary">
              {quality}%
            </span>
          </div>
          <input
            type="range"
            min={10}
            max={100}
            step={5}
            value={quality}
            onChange={(e) => setQuality(Number(e.target.value))}
            className="w-full accent-accent"
          />
          <div className="mt-1 flex justify-between text-xs text-fg-tertiary">
            <span>Smallest</span>
            <span>Best quality</span>
          </div>
        </div>

        {/* Format Selector */}
        <div className="mb-5">
          <label className="mb-2 block text-sm text-fg-secondary">
            Format
          </label>
          <div className="flex flex-wrap gap-2">
            {(["original", "webp", "jpeg"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFormat(f)}
                className={`flex-1 rounded-full border px-3 py-2 text-sm transition-all ${
                  format === f
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-border text-fg-primary hover:bg-bg-secondary"
                }`}
              >
                {formatLabel(f)}
              </button>
            ))}
          </div>
        </div>

        {/* Size Estimate */}
        <div className="mb-5 rounded-xl bg-bg-secondary p-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-fg-tertiary">Before</span>
            <span className="text-fg-primary">{formatBytes(fileSize)}</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-sm">
            <span className="text-fg-tertiary">After (estimated)</span>
            <span className="font-medium text-accent">
              ~{formatBytes(estimated)}
            </span>
          </div>
          {savings > 0 && (
            <p className="mt-2 text-center text-xs text-fg-tertiary">
              ~{savings}% smaller
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-full border border-border px-4 py-2 text-sm text-fg-primary transition-all hover:bg-bg-secondary"
          >
            Cancel
          </button>
          <button
            onClick={() => onCompress(quality, format)}
            className="flex-1 rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-fg shadow-sm transition-all hover:bg-accent-hover hover:shadow-md"
          >
            Compress
          </button>
        </div>
      </div>
    </div>
  );
}
