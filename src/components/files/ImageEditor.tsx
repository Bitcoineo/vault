"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface EditOperation {
  type: "rotate" | "crop" | "resize";
  degrees?: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

interface ImageEditorProps {
  fileId: string;
  fileName: string;
  previewUrl: string;
  originalWidth: number | null;
  originalHeight: number | null;
  onClose: () => void;
  onSaved: () => void;
}

type CropRatio = "free" | "1:1" | "4:3" | "16:9";

export function ImageEditor({
  fileId,
  fileName,
  previewUrl,
  originalWidth,
  originalHeight,
  onClose,
  onSaved,
}: ImageEditorProps) {
  const [rotation, setRotation] = useState(0);
  const [activeTool, setActiveTool] = useState<"rotate" | "crop" | "resize" | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMode, setSaveMode] = useState<"copy" | "overwrite" | null>(null);

  // Crop state
  const [cropRatio, setCropRatio] = useState<CropRatio>("free");
  const [cropRect, setCropRect] = useState<{
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imgContainerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Resize state
  const imgW = originalWidth || 800;
  const imgH = originalHeight || 600;
  const [resizeW, setResizeW] = useState(imgW);
  const [resizeH, setResizeH] = useState(imgH);
  const [lockAspect, setLockAspect] = useState(true);
  const aspect = imgW / imgH;

  const rotateLeft = () => setRotation((r) => (r - 90 + 360) % 360);
  const rotateRight = () => setRotation((r) => (r + 90) % 360);
  const rotate180 = () => setRotation((r) => (r + 180) % 360);

  const handleResizeW = (w: number) => {
    setResizeW(w);
    if (lockAspect) setResizeH(Math.round(w / aspect));
  };

  const handleResizeH = (h: number) => {
    setResizeH(h);
    if (lockAspect) setResizeW(Math.round(h * aspect));
  };

  // Crop mouse handlers
  const handleCropMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (activeTool !== "crop" || !imgRef.current) return;
      const rect = imgRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setDragStart({ x, y });
      setCropRect({ x, y, w: 0, h: 0 });
      setIsDragging(true);
    },
    [activeTool]
  );

  const handleCropMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging || !imgRef.current) return;
      const rect = imgRef.current.getBoundingClientRect();
      let curX = ((e.clientX - rect.left) / rect.width) * 100;
      let curY = ((e.clientY - rect.top) / rect.height) * 100;
      curX = Math.max(0, Math.min(100, curX));
      curY = Math.max(0, Math.min(100, curY));

      const w = curX - dragStart.x;
      let h = curY - dragStart.y;

      if (cropRatio !== "free") {
        const ratioMap = { "1:1": 1, "4:3": 4 / 3, "16:9": 16 / 9 };
        const ratio = ratioMap[cropRatio];
        const imgAspect = (imgRef.current.naturalWidth / imgRef.current.naturalHeight);
        h = (w / ratio) * imgAspect;
      }

      setCropRect({
        x: w >= 0 ? dragStart.x : dragStart.x + w,
        y: h >= 0 ? dragStart.y : dragStart.y + h,
        w: Math.abs(w),
        h: Math.abs(h),
      });
    },
    [isDragging, dragStart, cropRatio]
  );

  const handleCropMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const buildOperations = (): EditOperation[] => {
    const ops: EditOperation[] = [];

    if (rotation > 0) {
      ops.push({ type: "rotate", degrees: rotation });
    }

    if (cropRect && cropRect.w > 1 && cropRect.h > 1) {
      // Convert percentage to pixels
      const w = originalWidth || 800;
      const h = originalHeight || 600;
      // After rotation, dimensions may swap
      const isRotated90 = rotation === 90 || rotation === 270;
      const srcW = isRotated90 ? h : w;
      const srcH = isRotated90 ? w : h;
      ops.push({
        type: "crop",
        x: (cropRect.x / 100) * srcW,
        y: (cropRect.y / 100) * srcH,
        width: (cropRect.w / 100) * srcW,
        height: (cropRect.h / 100) * srcH,
      });
    }

    if (activeTool === "resize" && (resizeW !== imgW || resizeH !== imgH)) {
      ops.push({ type: "resize", width: resizeW, height: resizeH });
    }

    return ops;
  };

  const handleSave = async (mode: "copy" | "overwrite") => {
    const operations = buildOperations();
    if (operations.length === 0) {
      onClose();
      return;
    }

    setSaving(true);
    setSaveMode(mode);
    try {
      const res = await fetch(`/api/files/${fileId}/edit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operations, mode }),
      });
      const result = await res.json();
      if (!result.error) {
        onSaved();
        onClose();
      }
    } catch {
      // ignore
    }
    setSaving(false);
    setSaveMode(null);
  };

  const toolBtn = (
    tool: "rotate" | "crop" | "resize",
    label: string,
    icon: React.ReactNode
  ) => (
    <button
      onClick={() => setActiveTool(activeTool === tool ? null : tool)}
      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
        activeTool === tool
          ? "bg-accent text-accent-fg"
          : "text-fg-primary hover:bg-bg-secondary"
      }`}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-bg-primary">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-6 py-3">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-medium text-fg-primary">
            Edit: {fileName}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSave("copy")}
            disabled={saving}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-fg-primary transition-all hover:bg-bg-secondary disabled:opacity-50"
          >
            {saving && saveMode === "copy" ? "Saving..." : "Save as copy"}
          </button>
          <button
            onClick={() => handleSave("overwrite")}
            disabled={saving}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-fg transition-all hover:bg-accent-hover disabled:opacity-50"
          >
            {saving && saveMode === "overwrite" ? "Saving..." : "Overwrite"}
          </button>
          <button
            onClick={onClose}
            className="ml-2 rounded p-1 text-fg-tertiary hover:bg-bg-secondary hover:text-fg-primary"
          >
            <svg
              width="20"
              height="20"
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
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Tool sidebar */}
        <div className="flex w-56 flex-col gap-1 border-r border-border p-4">
          {toolBtn(
            "rotate",
            "Rotate",
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
            </svg>
          )}
          {toolBtn(
            "crop",
            "Crop",
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6.13 1L6 16a2 2 0 0 0 2 2h15" />
              <path d="M1 6.13L16 6a2 2 0 0 1 2 2v15" />
            </svg>
          )}
          {toolBtn(
            "resize",
            "Resize",
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 3 21 3 21 9" />
              <polyline points="9 21 3 21 3 15" />
              <line x1="21" y1="3" x2="14" y2="10" />
              <line x1="3" y1="21" x2="10" y2="14" />
            </svg>
          )}

          <div className="my-2 border-t border-border" />

          {/* Tool-specific controls */}
          {activeTool === "rotate" && (
            <div className="space-y-2">
              <button
                onClick={rotateLeft}
                className="w-full rounded-lg border border-border px-3 py-2 text-left text-sm text-fg-primary hover:bg-bg-secondary"
              >
                90° Left
              </button>
              <button
                onClick={rotateRight}
                className="w-full rounded-lg border border-border px-3 py-2 text-left text-sm text-fg-primary hover:bg-bg-secondary"
              >
                90° Right
              </button>
              <button
                onClick={rotate180}
                className="w-full rounded-lg border border-border px-3 py-2 text-left text-sm text-fg-primary hover:bg-bg-secondary"
              >
                180°
              </button>
              {rotation > 0 && (
                <p className="text-xs text-fg-tertiary">
                  Current: {rotation}°
                </p>
              )}
            </div>
          )}

          {activeTool === "crop" && (
            <div className="space-y-2">
              <p className="text-xs text-fg-tertiary">
                Drag on the image to select crop area
              </p>
              {(["free", "1:1", "4:3", "16:9"] as CropRatio[]).map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    setCropRatio(r);
                    setCropRect(null);
                  }}
                  className={`w-full rounded-lg border px-3 py-1.5 text-left text-sm ${
                    cropRatio === r
                      ? "border-accent text-accent"
                      : "border-border text-fg-primary hover:bg-bg-secondary"
                  }`}
                >
                  {r === "free" ? "Free" : r}
                </button>
              ))}
              {cropRect && cropRect.w > 1 && (
                <button
                  onClick={() => setCropRect(null)}
                  className="text-xs text-accent hover:underline"
                >
                  Clear crop
                </button>
              )}
            </div>
          )}

          {activeTool === "resize" && (
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs text-fg-tertiary">
                  Width
                </label>
                <input
                  type="number"
                  value={resizeW}
                  onChange={(e) => handleResizeW(Number(e.target.value))}
                  className="w-full rounded-lg border border-border bg-bg-primary px-3 py-1.5 text-sm text-fg-primary outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-fg-tertiary">
                  Height
                </label>
                <input
                  type="number"
                  value={resizeH}
                  onChange={(e) => handleResizeH(Number(e.target.value))}
                  className="w-full rounded-lg border border-border bg-bg-primary px-3 py-1.5 text-sm text-fg-primary outline-none focus:border-accent"
                />
              </div>
              <label className="flex items-center gap-2 text-xs text-fg-secondary">
                <input
                  type="checkbox"
                  checked={lockAspect}
                  onChange={(e) => setLockAspect(e.target.checked)}
                  className="accent-accent"
                />
                Lock aspect ratio
              </label>
            </div>
          )}
        </div>

        {/* Image preview */}
        <div
          ref={imgContainerRef}
          className="relative flex flex-1 items-center justify-center overflow-hidden bg-bg-secondary p-8"
          onMouseDown={handleCropMouseDown}
          onMouseMove={handleCropMouseMove}
          onMouseUp={handleCropMouseUp}
          onMouseLeave={handleCropMouseUp}
        >
          <div className="relative inline-block max-h-full max-w-full">
            <img
              ref={imgRef}
              src={previewUrl}
              alt={fileName}
              className="max-h-[70vh] max-w-full object-contain transition-transform duration-200"
              style={{ transform: `rotate(${rotation}deg)` }}
              draggable={false}
            />
            {/* Crop overlay */}
            {cropRect && cropRect.w > 1 && cropRect.h > 1 && (
              <>
                {/* Dimmed areas */}
                <div
                  className="pointer-events-none absolute inset-0 bg-black/40"
                  style={{
                    clipPath: `polygon(
                      0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%,
                      ${cropRect.x}% ${cropRect.y}%,
                      ${cropRect.x}% ${cropRect.y + cropRect.h}%,
                      ${cropRect.x + cropRect.w}% ${cropRect.y + cropRect.h}%,
                      ${cropRect.x + cropRect.w}% ${cropRect.y}%,
                      ${cropRect.x}% ${cropRect.y}%
                    )`,
                  }}
                />
                {/* Crop border */}
                <div
                  className="pointer-events-none absolute border-2 border-white"
                  style={{
                    left: `${cropRect.x}%`,
                    top: `${cropRect.y}%`,
                    width: `${cropRect.w}%`,
                    height: `${cropRect.h}%`,
                  }}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
