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

interface CropRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

type DragMode = "draw" | "move" | "resize";
type CornerHandle = "tl" | "tr" | "bl" | "br";

export function ImageEditor({
  fileId,
  fileName,
  previewUrl,
  originalWidth,
  originalHeight,
  onClose,
  onSaved,
}: ImageEditorProps) {
  const imgW = originalWidth || 800;
  const imgH = originalHeight || 600;

  // Core edit state
  const [rotation, setRotation] = useState(0);
  const [cropRect, setCropRect] = useState<CropRect | null>(null);
  const [resizeW, setResizeW] = useState(imgW);
  const [resizeH, setResizeH] = useState(imgH);
  const [activeTool, setActiveTool] = useState<
    "rotate" | "crop" | "resize" | null
  >(null);
  const [cropRatio, setCropRatio] = useState<CropRatio>("free");
  const [lockAspect, setLockAspect] = useState(true);

  // UI state
  const [saving, setSaving] = useState(false);
  const [saveMode, setSaveMode] = useState<"copy" | "overwrite" | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Refs
  const sourceImgRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const resizeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Crop interaction state (refs to avoid re-render during drag)
  const dragModeRef = useRef<DragMode | null>(null);
  const dragCornerRef = useRef<CornerHandle | null>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const cropAtDragStartRef = useRef<CropRect | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Load source image on mount
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      sourceImgRef.current = img;
      setImageLoaded(true);
    };
    img.src = previewUrl;
  }, [previewUrl]);

  // Compute rotated dimensions
  const getRotatedDims = useCallback(() => {
    const img = sourceImgRef.current;
    if (!img) return { rw: imgW, rh: imgH };
    const isSwapped = rotation === 90 || rotation === 270;
    return {
      rw: isSwapped ? img.naturalHeight : img.naturalWidth,
      rh: isSwapped ? img.naturalWidth : img.naturalHeight,
    };
  }, [rotation, imgW, imgH]);

  // Get base dimensions for resize (post-crop if crop exists, else rotated)
  const getBaseDims = useCallback(() => {
    const { rw, rh } = getRotatedDims();
    if (cropRect && cropRect.w > 0 && cropRect.h > 0) {
      return { bw: Math.round(cropRect.w), bh: Math.round(cropRect.h) };
    }
    return { bw: rw, bh: rh };
  }, [getRotatedDims, cropRect]);

  // Draw rotated source onto an offscreen canvas and return it
  const drawRotatedSource = useCallback(() => {
    const img = sourceImgRef.current;
    if (!img) return null;

    const { rw, rh } = getRotatedDims();
    const offscreen = document.createElement("canvas");
    offscreen.width = rw;
    offscreen.height = rh;
    const ctx = offscreen.getContext("2d");
    if (!ctx) return null;

    ctx.save();
    ctx.translate(rw / 2, rh / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.drawImage(
      img,
      -img.naturalWidth / 2,
      -img.naturalHeight / 2,
      img.naturalWidth,
      img.naturalHeight
    );
    ctx.restore();

    return offscreen;
  }, [getRotatedDims, rotation]);

  // Main render function
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageLoaded) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rotated = drawRotatedSource();
    if (!rotated) return;

    if (activeTool === "crop") {
      // Show full rotated image for crop overlay interaction
      canvas.width = rotated.width;
      canvas.height = rotated.height;
      ctx.drawImage(rotated, 0, 0);
    } else {
      // Apply crop + resize
      const sx = cropRect ? cropRect.x : 0;
      const sy = cropRect ? cropRect.y : 0;
      const sw =
        cropRect && cropRect.w > 0 ? cropRect.w : rotated.width;
      const sh =
        cropRect && cropRect.h > 0 ? cropRect.h : rotated.height;

      // Determine output dimensions
      const { bw, bh } = getBaseDims();
      const outW = resizeW !== bw || resizeH !== bh ? resizeW : Math.round(sw);
      const outH = resizeW !== bw || resizeH !== bh ? resizeH : Math.round(sh);

      canvas.width = outW;
      canvas.height = outH;
      ctx.drawImage(rotated, sx, sy, sw, sh, 0, 0, outW, outH);
    }
  }, [
    imageLoaded,
    drawRotatedSource,
    activeTool,
    cropRect,
    resizeW,
    resizeH,
    getBaseDims,
  ]);

  // Re-render canvas on state changes
  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // Reset crop when rotation changes
  useEffect(() => {
    setCropRect(null);
  }, [rotation]);

  // Update resize dims when base changes (rotation/crop change)
  useEffect(() => {
    const { bw, bh } = getBaseDims();
    setResizeW(bw);
    setResizeH(bh);
  }, [getBaseDims]);

  // Escape key handler
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  // --- Rotation ---
  const rotateLeft = () => setRotation((r) => (r - 90 + 360) % 360);
  const rotateRight = () => setRotation((r) => (r + 90) % 360);
  const rotate180 = () => setRotation((r) => (r + 180) % 360);

  // --- Resize ---
  const handleResizeW = (w: number) => {
    if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current);
    setResizeW(w);
    const { bw, bh } = getBaseDims();
    if (lockAspect && bh > 0) {
      setResizeH(Math.round(w * (bh / bw)));
    }
    // Debounce canvas re-render is handled by useEffect
  };

  const handleResizeH = (h: number) => {
    if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current);
    setResizeH(h);
    const { bw, bh } = getBaseDims();
    if (lockAspect && bw > 0) {
      setResizeW(Math.round(h * (bw / bh)));
    }
  };

  // --- Crop interactions ---
  const getScaleFactor = (): number => {
    const canvas = canvasRef.current;
    if (!canvas) return 1;
    return canvas.clientWidth / canvas.width;
  };

  const screenToImage = (
    clientX: number,
    clientY: number
  ): { ix: number; iy: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { ix: 0, iy: 0 };
    const rect = canvas.getBoundingClientRect();
    const scale = getScaleFactor();
    return {
      ix: (clientX - rect.left) / scale,
      iy: (clientY - rect.top) / scale,
    };
  };

  const hitTestCorner = (
    ix: number,
    iy: number,
    crop: CropRect
  ): CornerHandle | null => {
    const threshold = 12 / getScaleFactor(); // 12 screen px
    const corners: { handle: CornerHandle; cx: number; cy: number }[] = [
      { handle: "tl", cx: crop.x, cy: crop.y },
      { handle: "tr", cx: crop.x + crop.w, cy: crop.y },
      { handle: "bl", cx: crop.x, cy: crop.y + crop.h },
      { handle: "br", cx: crop.x + crop.w, cy: crop.y + crop.h },
    ];
    for (const c of corners) {
      if (Math.abs(ix - c.cx) < threshold && Math.abs(iy - c.cy) < threshold) {
        return c.handle;
      }
    }
    return null;
  };

  const hitTestInside = (ix: number, iy: number, crop: CropRect): boolean => {
    return (
      ix >= crop.x &&
      ix <= crop.x + crop.w &&
      iy >= crop.y &&
      iy <= crop.y + crop.h
    );
  };

  const clampCrop = (crop: CropRect): CropRect => {
    const canvas = canvasRef.current;
    if (!canvas) return crop;
    const maxW = canvas.width;
    const maxH = canvas.height;
    let { x, y, w, h } = crop;
    if (x < 0) x = 0;
    if (y < 0) y = 0;
    if (x + w > maxW) w = maxW - x;
    if (y + h > maxH) h = maxH - y;
    if (w < 1) w = 1;
    if (h < 1) h = 1;
    return { x, y, w, h };
  };

  const applyRatioConstraint = (
    w: number,
    h: number,
    ratio: CropRatio
  ): { w: number; h: number } => {
    if (ratio === "free") return { w, h };
    const ratioMap = { "1:1": 1, "4:3": 4 / 3, "16:9": 16 / 9 };
    const r = ratioMap[ratio];
    // Constrain height to match width based on ratio
    return { w, h: Math.round(w / r) };
  };

  const handleCropMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (activeTool !== "crop") return;
      e.preventDefault();
      const { ix, iy } = screenToImage(e.clientX, e.clientY);

      if (cropRect && cropRect.w > 1 && cropRect.h > 1) {
        // Check corner handles first
        const corner = hitTestCorner(ix, iy, cropRect);
        if (corner) {
          dragModeRef.current = "resize";
          dragCornerRef.current = corner;
          dragStartRef.current = { x: ix, y: iy };
          cropAtDragStartRef.current = { ...cropRect };
          setIsDragging(true);
          return;
        }
        // Check inside crop for move
        if (hitTestInside(ix, iy, cropRect)) {
          dragModeRef.current = "move";
          dragStartRef.current = { x: ix, y: iy };
          cropAtDragStartRef.current = { ...cropRect };
          setIsDragging(true);
          return;
        }
      }

      // Draw new crop
      dragModeRef.current = "draw";
      dragStartRef.current = { x: ix, y: iy };
      setCropRect({ x: ix, y: iy, w: 0, h: 0 });
      setIsDragging(true);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeTool, cropRect]
  );

  const handleCropMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging || !dragModeRef.current) return;
      e.preventDefault();
      const { ix, iy } = screenToImage(e.clientX, e.clientY);
      const start = dragStartRef.current;
      const startCrop = cropAtDragStartRef.current;

      if (dragModeRef.current === "draw") {
        const w = ix - start.x;
        const h = iy - start.y;
        const constrained = applyRatioConstraint(
          Math.abs(w),
          Math.abs(h),
          cropRatio
        );
        const finalW = w >= 0 ? constrained.w : -constrained.w;
        const finalH = h >= 0 ? constrained.h : -constrained.h;
        setCropRect(
          clampCrop({
            x: finalW >= 0 ? start.x : start.x + finalW,
            y: finalH >= 0 ? start.y : start.y + finalH,
            w: Math.abs(finalW),
            h: Math.abs(finalH),
          })
        );
      } else if (dragModeRef.current === "move" && startCrop) {
        const dx = ix - start.x;
        const dy = iy - start.y;
        setCropRect(
          clampCrop({
            x: startCrop.x + dx,
            y: startCrop.y + dy,
            w: startCrop.w,
            h: startCrop.h,
          })
        );
      } else if (dragModeRef.current === "resize" && startCrop) {
        const corner = dragCornerRef.current;
        let newCrop: CropRect;

        // The opposite corner stays fixed
        if (corner === "br") {
          let w = ix - startCrop.x;
          let h = iy - startCrop.y;
          if (w < 1) w = 1;
          if (h < 1) h = 1;
          const c = applyRatioConstraint(w, h, cropRatio);
          newCrop = { x: startCrop.x, y: startCrop.y, w: c.w, h: c.h };
        } else if (corner === "bl") {
          const right = startCrop.x + startCrop.w;
          let w = right - ix;
          let h = iy - startCrop.y;
          if (w < 1) w = 1;
          if (h < 1) h = 1;
          const c = applyRatioConstraint(w, h, cropRatio);
          newCrop = { x: right - c.w, y: startCrop.y, w: c.w, h: c.h };
        } else if (corner === "tr") {
          const bottom = startCrop.y + startCrop.h;
          let w = ix - startCrop.x;
          let h = bottom - iy;
          if (w < 1) w = 1;
          if (h < 1) h = 1;
          const c = applyRatioConstraint(w, h, cropRatio);
          newCrop = { x: startCrop.x, y: bottom - c.h, w: c.w, h: c.h };
        } else {
          // tl
          const right = startCrop.x + startCrop.w;
          const bottom = startCrop.y + startCrop.h;
          let w = right - ix;
          let h = bottom - iy;
          if (w < 1) w = 1;
          if (h < 1) h = 1;
          const c = applyRatioConstraint(w, h, cropRatio);
          newCrop = { x: right - c.w, y: bottom - c.h, w: c.w, h: c.h };
        }
        setCropRect(clampCrop(newCrop));
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isDragging, cropRatio]
  );

  const handleCropMouseUp = useCallback(() => {
    if (!isDragging) return;
    dragModeRef.current = null;
    dragCornerRef.current = null;
    setIsDragging(false);
  }, [isDragging]);

  // --- Reset ---
  const handleReset = () => {
    setRotation(0);
    setCropRect(null);
    setResizeW(imgW);
    setResizeH(imgH);
    setActiveTool(null);
  };

  // --- Build operations for save ---
  const buildOperations = (): EditOperation[] => {
    const ops: EditOperation[] = [];

    if (rotation > 0) {
      ops.push({ type: "rotate", degrees: rotation });
    }

    if (cropRect && cropRect.w > 1 && cropRect.h > 1) {
      ops.push({
        type: "crop",
        x: Math.round(cropRect.x),
        y: Math.round(cropRect.y),
        width: Math.round(cropRect.w),
        height: Math.round(cropRect.h),
      });
    }

    const { bw, bh } = getBaseDims();
    if (resizeW !== bw || resizeH !== bh) {
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

  // --- Crop overlay rendering ---
  const renderCropOverlay = () => {
    if (activeTool !== "crop" || !canvasRef.current) return null;
    const canvas = canvasRef.current;
    const scale = canvas.clientWidth > 0 ? canvas.clientWidth / canvas.width : 1;

    if (!cropRect || cropRect.w < 1 || cropRect.h < 1) return null;

    const left = cropRect.x * scale;
    const top = cropRect.y * scale;
    const width = cropRect.w * scale;
    const height = cropRect.h * scale;
    const canvasDisplayW = canvas.clientWidth;
    const canvasDisplayH = canvas.clientHeight;

    const handleSize = 10;
    const halfHandle = handleSize / 2;

    return (
      <>
        {/* Dark mask with cutout */}
        <div
          className="pointer-events-none absolute left-0 top-0"
          style={{
            width: canvasDisplayW,
            height: canvasDisplayH,
            backgroundColor: "rgba(0,0,0,0.5)",
            clipPath: `polygon(
              0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%,
              ${left}px ${top}px,
              ${left}px ${top + height}px,
              ${left + width}px ${top + height}px,
              ${left + width}px ${top}px,
              ${left}px ${top}px
            )`,
          }}
        />
        {/* Crop border */}
        <div
          className="pointer-events-none absolute border-2 border-white"
          style={{ left, top, width, height }}
        />
        {/* Corner handles */}
        {(
          [
            { x: left - halfHandle, y: top - halfHandle },
            { x: left + width - halfHandle, y: top - halfHandle },
            { x: left - halfHandle, y: top + height - halfHandle },
            { x: left + width - halfHandle, y: top + height - halfHandle },
          ] as const
        ).map((pos, i) => (
          <div
            key={i}
            className="pointer-events-none absolute bg-white"
            style={{
              left: pos.x,
              top: pos.y,
              width: handleSize,
              height: handleSize,
            }}
          />
        ))}
        {/* Dimensions label */}
        <div
          className="pointer-events-none absolute text-xs text-white"
          style={{
            left: left,
            top: top + height + 4,
          }}
        >
          {Math.round(cropRect.w)} × {Math.round(cropRect.h)}
        </div>
      </>
    );
  };

  // --- File size estimate ---
  const getFileSizeEstimate = (): string => {
    const bytes = resizeW * resizeH * 0.15;
    if (bytes < 1024) return `~${Math.round(bytes)} B`;
    if (bytes < 1024 * 1024)
      return `~${Math.round(bytes / 1024)} KB`;
    return `~${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // --- Tool button ---
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
            onClick={handleReset}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-fg-tertiary transition-all hover:bg-bg-secondary hover:text-fg-primary"
          >
            Reset
          </button>
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
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
            </svg>
          )}
          {toolBtn(
            "crop",
            "Crop",
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M6.13 1L6 16a2 2 0 0 0 2 2h15" />
              <path d="M1 6.13L16 6a2 2 0 0 1 2 2v15" />
            </svg>
          )}
          {toolBtn(
            "resize",
            "Resize",
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
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
              <p className="text-xs text-fg-tertiary">
                Est. file size: {getFileSizeEstimate()}
              </p>
            </div>
          )}
        </div>

        {/* Canvas preview */}
        <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-bg-secondary p-8">
          {!imageLoaded && (
            <div className="text-sm text-fg-tertiary">Loading image...</div>
          )}
          {imageLoaded && (
            <div
              ref={overlayRef}
              className="relative inline-block"
              onMouseDown={handleCropMouseDown}
              onMouseMove={handleCropMouseMove}
              onMouseUp={handleCropMouseUp}
              onMouseLeave={handleCropMouseUp}
              style={{ cursor: activeTool === "crop" ? "crosshair" : "default" }}
            >
              <canvas
                ref={canvasRef}
                style={{
                  maxWidth: "100%",
                  maxHeight: "70vh",
                }}
              />
              {renderCropOverlay()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
