"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { VaultLogo } from "@/components/ui/VaultLogo";
import { Breadcrumbs } from "./Breadcrumbs";
import { FolderCard } from "./FolderCard";
import { FileCard } from "./FileCard";
import { NewFolderModal } from "./NewFolderModal";
import { FilePreview } from "./FilePreview";
import { UploadProgress, type UploadItem } from "./UploadProgress";
import { StorageBar } from "./StorageBar";
import { BulkActionBar } from "./BulkActionBar";
import { ShareModal } from "./ShareModal";
import { ImageEditor } from "./ImageEditor";
import { CompressModal } from "./CompressModal";
import { uploadFile } from "@/lib/upload";
import { signOut } from "next-auth/react";

interface FileData {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  status: string;
  thumbnailKey: string | null;
  width: number | null;
  height: number | null;
  extractedText: string | null;
  createdAt: Date | number;
}

interface FolderData {
  id: string;
  name: string;
}

interface FileBrowserProps {
  initialFiles: FileData[];
  initialFolders: FolderData[];
  folderPath: { id: string; name: string }[];
  currentFolderId: string | null;
  storageUsed: number;
  userName: string | null;
  avatarColor: string | null;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 1 ? 1 : 0)} ${units[i]}`;
}

export function FileBrowser({
  initialFiles,
  initialFolders,
  folderPath,
  currentFolderId,
  storageUsed: initialStorageUsed,
  userName,
  avatarColor,
}: FileBrowserProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<FileData[]>(initialFiles);
  const [folders, setFolders] = useState<FolderData[]>(initialFolders);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedFile, setSelectedFile] = useState<FileData | null>(null);
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [storageUsed, setStorageUsed] = useState(initialStorageUsed);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [shareFileId, setShareFileId] = useState<string | null>(null);
  const [editingImage, setEditingImage] = useState<{
    id: string;
    name: string;
    previewUrl: string;
    width: number | null;
    height: number | null;
  } | null>(null);
  const [compressFileId, setCompressFileId] = useState<string | null>(null);
  const [removingBg, setRemovingBg] = useState<string | null>(null);

  // Navigation history
  const navHistory = useRef<(string | null)[]>([currentFolderId]);
  const navIndex = useRef(0);
  const isNavAction = useRef(false);
  const [, setNavTick] = useState(0);

  useEffect(() => {
    if (isNavAction.current) {
      isNavAction.current = false;
      return;
    }
    const hist = navHistory.current;
    const idx = navIndex.current;
    if (hist[idx] !== currentFolderId) {
      navHistory.current = hist.slice(0, idx + 1);
      navHistory.current.push(currentFolderId);
      navIndex.current = navHistory.current.length - 1;
      setNavTick((t) => t + 1);
    }
  }, [currentFolderId]);

  const canGoBack = navIndex.current > 0;
  const canGoForward = navIndex.current < navHistory.current.length - 1;
  const parentFolderId =
    folderPath.length > 1 ? folderPath[folderPath.length - 2].id : null;
  const canGoUp = currentFolderId !== null;

  const navigateTo = useCallback(
    (folderId: string | null) => {
      isNavAction.current = true;
      router.push(folderId ? `/files?folderId=${folderId}` : "/files");
    },
    [router]
  );

  const goBack = useCallback(() => {
    if (navIndex.current <= 0) return;
    navIndex.current -= 1;
    setNavTick((t) => t + 1);
    navigateTo(navHistory.current[navIndex.current]);
  }, [navigateTo]);

  const goForward = useCallback(() => {
    if (navIndex.current >= navHistory.current.length - 1) return;
    navIndex.current += 1;
    setNavTick((t) => t + 1);
    navigateTo(navHistory.current[navIndex.current]);
  }, [navigateTo]);

  const goUp = useCallback(() => {
    if (currentFolderId === null) return;
    navigateTo(parentFolderId);
  }, [currentFolderId, parentFolderId, navigateTo]);

  useEffect(() => {
    setFiles(initialFiles);
    setFolders(initialFolders);
    setSelectedFile(null);
    setSelectedFileIds(new Set());
    setSearchQuery("");
    setSearchResults(null);
  }, [initialFiles, initialFolders]);

  useEffect(() => {
    setStorageUsed(initialStorageUsed);
  }, [initialStorageUsed]);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FileData[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Multi-select state
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(
    new Set()
  );
  const [lastClickedIndex, setLastClickedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/files/search?q=${encodeURIComponent(searchQuery.trim())}`
        );
        const data = await res.json();
        if (data.data) setSearchResults(data.data);
      } catch {
        // ignore
      }
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const isInput =
        e.target instanceof HTMLElement &&
        (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA");

      if (e.altKey && !isInput) {
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          goBack();
          return;
        }
        if (e.key === "ArrowRight") {
          e.preventDefault();
          goForward();
          return;
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          goUp();
          return;
        }
      }

      if (
        (e.key === "Delete" || e.key === "Backspace") &&
        selectedFileIds.size > 0 &&
        !isInput
      ) {
        handleBulkDelete();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFileIds, goBack, goForward, goUp]);

  const refreshData = useCallback(async () => {
    const params = currentFolderId ? `?folderId=${currentFolderId}` : "";
    const [filesRes, foldersRes] = await Promise.all([
      fetch(`/api/files${params}`),
      fetch(`/api/folders?parentId=${currentFolderId || ""}`),
    ]);
    const filesData = await filesRes.json();
    const foldersData = await foldersRes.json();
    if (filesData.data) setFiles(filesData.data);
    if (foldersData.data) setFolders(foldersData.data);
  }, [currentFolderId]);

  const handleUploadFiles = useCallback(
    async (fileList: FileList) => {
      const filesToUpload = Array.from(fileList);

      for (const file of filesToUpload) {
        const uploadId = crypto.randomUUID();

        setUploads((prev) => [
          ...prev,
          {
            id: uploadId,
            fileName: file.name,
            status: "pending",
            progress: 0,
          },
        ]);

        uploadFile(
          file,
          currentFolderId,
          (progress) => {
            setUploads((prev) =>
              prev.map((u) => (u.id === uploadId ? { ...u, progress } : u))
            );
          },
          (status) => {
            setUploads((prev) =>
              prev.map((u) => (u.id === uploadId ? { ...u, status } : u))
            );
            if (status === "ready" || status === "processing") {
              refreshData();
              setStorageUsed((prev) => prev + file.size);
            }
          }
        ).then((result) => {
          if ("error" in result) {
            setUploads((prev) =>
              prev.map((u) =>
                u.id === uploadId
                  ? { ...u, status: "error", error: result.error }
                  : u
              )
            );
          }
        });
      }
    },
    [currentFolderId, refreshData]
  );

  const handleCreateFolder = async (name: string) => {
    const res = await fetch("/api/folders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, parentId: currentFolderId }),
    });
    const data = await res.json();
    if (data.data) {
      setFolders((prev) => [...prev, data.data]);
    }
    setShowNewFolder(false);
  };

  const handleRenameFolder = async (folderId: string, name: string) => {
    await fetch(`/api/folders/${folderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setFolders((prev) =>
      prev.map((f) => (f.id === folderId ? { ...f, name } : f))
    );
  };

  const handleDeleteFolder = async (folderId: string) => {
    await fetch(`/api/folders/${folderId}`, { method: "DELETE" });
    setFolders((prev) => prev.filter((f) => f.id !== folderId));
    refreshData();
  };

  const handleDeleteFile = async (fileId: string) => {
    const file = files.find((f) => f.id === fileId);
    await fetch(`/api/files/${fileId}`, { method: "DELETE" });
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
    if (selectedFile?.id === fileId) setSelectedFile(null);
    if (file) setStorageUsed((prev) => Math.max(0, prev - file.size));
    setSelectedFileIds((prev) => {
      const next = new Set(prev);
      next.delete(fileId);
      return next;
    });
  };

  const handleRenameFile = async (fileId: string, name: string) => {
    await fetch(`/api/files/${fileId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setFiles((prev) =>
      prev.map((f) => (f.id === fileId ? { ...f, name } : f))
    );
    if (selectedFile?.id === fileId) {
      setSelectedFile((prev) => (prev ? { ...prev, name } : null));
    }
  };

  const handleMoveFile = async (
    fileId: string,
    targetFolderId: string | null
  ) => {
    await fetch(`/api/files/${fileId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folderId: targetFolderId }),
    });
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
    setSelectedFileIds((prev) => {
      const next = new Set(prev);
      next.delete(fileId);
      return next;
    });
  };

  const handleFileDrop = (fileId: string, folderId: string) => {
    handleMoveFile(fileId, folderId);
  };

  const handleShare = (fileId: string) => {
    setShareFileId(fileId);
  };

  const handleEditImage = async (fileId: string) => {
    const file = files.find((f) => f.id === fileId);
    if (!file) return;
    try {
      const res = await fetch(`/api/files/${fileId}/download`);
      const { data } = await res.json();
      if (data?.url) {
        setEditingImage({
          id: file.id,
          name: file.name,
          previewUrl: data.url,
          width: file.width,
          height: file.height,
        });
      }
    } catch {
      // ignore
    }
  };

  const handleCompress = (fileId: string) => {
    const file = files.find((f) => f.id === fileId);
    if (!file) return;
    if (!/^image\/(jpeg|png|webp|gif)$/.test(file.mimeType)) return;
    setCompressFileId(fileId);
  };

  const handleCompressConfirm = async (
    quality: number,
    format: "original" | "webp" | "jpeg"
  ) => {
    if (!compressFileId) return;
    const fileId = compressFileId;
    setCompressFileId(null);
    try {
      const res = await fetch(`/api/files/${fileId}/compress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quality, format }),
      });
      const result = await res.json();
      if (result.data) {
        const savings = Math.round(
          ((result.data.originalSize - result.data.compressedSize) /
            result.data.originalSize) *
            100
        );
        alert(
          `Saved ${savings}% (${formatBytes(result.data.originalSize)} → ${formatBytes(result.data.compressedSize)})`
        );
        refreshData();
      }
    } catch {
      // ignore
    }
  };

  const handleRemoveBg = async (fileId: string) => {
    const file = files.find((f) => f.id === fileId);
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.mimeType)) return;

    setRemovingBg(fileId);
    try {
      const res = await fetch(`/api/files/${fileId}/remove-bg`, {
        method: "POST",
      });
      const result = await res.json();
      if (result.error) {
        alert(result.error);
      } else if (result.data) {
        refreshData();
      }
    } catch {
      alert("Background removal failed. Try again.");
    }
    setRemovingBg(null);
  };

  const handleBulkDelete = async () => {
    if (selectedFileIds.size === 0) return;

    const ids = Array.from(selectedFileIds);
    const totalSize = files
      .filter((f) => ids.includes(f.id))
      .reduce((acc, f) => acc + f.size, 0);

    await fetch("/api/files/bulk", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileIds: ids }),
    });

    setFiles((prev) => prev.filter((f) => !ids.includes(f.id)));
    setSelectedFileIds(new Set());
    setStorageUsed((prev) => Math.max(0, prev - totalSize));
    if (selectedFile && ids.includes(selectedFile.id)) {
      setSelectedFile(null);
    }
  };

  const handleBulkZip = async () => {
    if (selectedFileIds.size < 2) return;
    const ids = Array.from(selectedFileIds);

    try {
      const res = await fetch("/api/files/compress-zip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileIds: ids }),
      });
      const result = await res.json();
      if (result.data) {
        setSelectedFileIds(new Set());
        refreshData();
      }
    } catch {
      // ignore
    }
  };

  const handleBulkMove = async (targetFolderId: string | null) => {
    const ids = Array.from(selectedFileIds);
    await Promise.all(
      ids.map((id) =>
        fetch(`/api/files/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ folderId: targetFolderId }),
        })
      )
    );
    setFiles((prev) => prev.filter((f) => !ids.includes(f.id)));
    setSelectedFileIds(new Set());
  };

  const handleFileClick = (e: React.MouseEvent, file: FileData) => {
    const displayFiles = searchResults ?? files;
    const fileIndex = displayFiles.findIndex((f) => f.id === file.id);

    if (e.metaKey || e.ctrlKey) {
      setSelectedFileIds((prev) => {
        const next = new Set(prev);
        if (next.has(file.id)) {
          next.delete(file.id);
        } else {
          next.add(file.id);
        }
        return next;
      });
      setLastClickedIndex(fileIndex);
    } else if (e.shiftKey && lastClickedIndex !== null) {
      const start = Math.min(lastClickedIndex, fileIndex);
      const end = Math.max(lastClickedIndex, fileIndex);
      const rangeIds = displayFiles.slice(start, end + 1).map((f) => f.id);
      setSelectedFileIds((prev) => {
        const next = new Set(prev);
        rangeIds.forEach((id) => next.add(id));
        return next;
      });
    } else {
      if (selectedFileIds.size > 0) {
        setSelectedFileIds(new Set());
      } else {
        setSelectedFile(file);
      }
      setLastClickedIndex(fileIndex);
    }
  };

  const handleDragStart = (e: React.DragEvent, fileId: string) => {
    e.dataTransfer.setData("application/x-vault-file", fileId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (e.dataTransfer.types.includes("Files") && !e.dataTransfer.types.includes("application/x-vault-file")) {
      e.preventDefault();
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.currentTarget === e.target) setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (
      e.dataTransfer.types.includes("Files") &&
      !e.dataTransfer.types.includes("application/x-vault-file")
    ) {
      if (e.dataTransfer.files.length > 0) {
        handleUploadFiles(e.dataTransfer.files);
      }
    }
  };

  const initials = userName
    ? userName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  const displayFiles = searchResults ?? files;

  return (
    <div className="flex h-screen flex-col bg-bg-secondary animate-page-fade-in">
      {/* Top Bar — white/surface, logo left, breadcrumb center, avatar right */}
      <header className="flex items-center justify-between border-b border-border bg-bg-primary px-4 py-3 sm:px-6">
        <VaultLogo href="/files" size={24} textClass="text-base font-semibold tracking-tight text-fg-primary" />

        <div className="hidden sm:flex">
          <Breadcrumbs path={folderPath} currentFolderId={currentFolderId} />
        </div>

        <div className="flex items-center gap-3">
          <StorageBar storageUsed={storageUsed} />
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium text-white transition-transform hover:scale-105"
              style={{ backgroundColor: avatarColor || "#2563eb" }}
            >
              {initials}
            </button>
            {showUserMenu && (
              <div className="absolute right-0 top-full z-20 mt-2 w-40 rounded-xl border border-border bg-bg-primary py-1 shadow-lg">
                <div className="border-b border-border px-3 py-2">
                  <p className="truncate text-sm font-medium text-fg-primary">
                    {userName}
                  </p>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="w-full px-3 py-2 text-left text-sm text-fg-secondary hover:bg-bg-secondary"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Action Bar — below top bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-bg-primary px-4 py-2.5 sm:px-6">
        <div className="flex items-center gap-2">
          {/* Navigation Arrows */}
          <div className="flex rounded-full border border-border">
            <button
              onClick={goBack}
              disabled={!canGoBack}
              title="Back (Alt+Left)"
              className="rounded-l-full p-1.5 text-fg-secondary transition-colors hover:bg-bg-tertiary disabled:cursor-not-allowed disabled:opacity-30"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <button
              onClick={goForward}
              disabled={!canGoForward}
              title="Forward (Alt+Right)"
              className="border-l border-border p-1.5 text-fg-secondary transition-colors hover:bg-bg-tertiary disabled:cursor-not-allowed disabled:opacity-30"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
            <button
              onClick={goUp}
              disabled={!canGoUp}
              title="Up to parent folder (Alt+Up)"
              className="rounded-r-full border-l border-border p-1.5 text-fg-secondary transition-colors hover:bg-bg-tertiary disabled:cursor-not-allowed disabled:opacity-30"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="18 15 12 9 6 15" />
              </svg>
            </button>
          </div>

          {/* Mobile breadcrumbs */}
          <div className="sm:hidden">
            <Breadcrumbs path={folderPath} currentFolderId={currentFolderId} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-tertiary"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-36 rounded-full border border-border bg-bg-secondary py-1.5 pl-9 pr-3 text-sm text-fg-primary placeholder-fg-tertiary outline-none transition-all focus:w-48 focus:border-accent focus:ring-2 focus:ring-accent/20 sm:w-44 sm:focus:w-60"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-fg-tertiary hover:text-fg-primary"
              >
                <svg
                  width="12"
                  height="12"
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

          {/* View Toggle */}
          <div className="flex rounded-full border border-border">
            <button
              onClick={() => setViewMode("grid")}
              className={`rounded-l-full p-1.5 ${
                viewMode === "grid"
                  ? "bg-bg-tertiary text-fg-primary"
                  : "text-fg-tertiary hover:text-fg-secondary"
              }`}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`rounded-r-full p-1.5 ${
                viewMode === "list"
                  ? "bg-bg-tertiary text-fg-primary"
                  : "text-fg-tertiary hover:text-fg-secondary"
              }`}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
                <line x1="3" y1="6" x2="3.01" y2="6" />
                <line x1="3" y1="12" x2="3.01" y2="12" />
                <line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
            </button>
          </div>

          <button
            onClick={() => setShowNewFolder(true)}
            className="hidden rounded-full border border-border px-4 py-1.5 text-sm text-fg-primary transition-all hover:bg-bg-secondary hover:shadow-sm sm:block"
          >
            New folder
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="rounded-full bg-accent px-5 py-1.5 text-sm font-medium text-accent-fg shadow-sm transition-all hover:bg-accent-hover hover:shadow-md"
          >
            Upload
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) handleUploadFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 overflow-hidden">
        <div
          className={`relative flex-1 overflow-y-auto p-4 sm:p-6 ${
            isDragging ? "ring-2 ring-inset ring-accent" : ""
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {isDragging && (
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-accent/5">
              <div className="rounded-2xl border-2 border-dashed border-accent bg-bg-primary px-8 py-6 text-center shadow-lg">
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="mx-auto mb-2 text-accent"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <p className="text-sm font-medium text-accent">
                  Drop files here to upload
                </p>
              </div>
            </div>
          )}

          {/* Search results header */}
          {searchResults !== null && (
            <div className="mb-4 flex items-center gap-2">
              <p className="text-sm text-fg-secondary">
                {isSearching
                  ? "Searching..."
                  : `${searchResults.length} result${searchResults.length !== 1 ? "s" : ""} for "${searchQuery}"`}
              </p>
              <button
                onClick={() => setSearchQuery("")}
                className="text-xs font-medium text-accent hover:underline"
              >
                Clear
              </button>
            </div>
          )}

          {displayFiles.length === 0 &&
          folders.length === 0 &&
          searchResults === null ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="mb-4 opacity-40">
                <VaultLogo size={64} href={undefined} showText={false} />
              </div>
              <p className="text-lg font-medium text-fg-secondary">
                No files yet
              </p>
              <p className="mt-1 text-[15px] text-fg-tertiary">
                Drop files here or click Upload
              </p>
            </div>
          ) : searchResults !== null && searchResults.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <p className="text-lg font-medium text-fg-secondary">
                Nothing matches
              </p>
              <p className="mt-1 text-sm text-fg-tertiary">
                Try different words
              </p>
              <button
                onClick={() => setSearchQuery("")}
                className="mt-2 text-sm font-medium text-accent hover:underline"
              >
                Clear search
              </button>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {searchResults === null &&
                folders.map((folder) => (
                  <FolderCard
                    key={folder.id}
                    id={folder.id}
                    name={folder.name}
                    viewMode="grid"
                    onRename={handleRenameFolder}
                    onDelete={handleDeleteFolder}
                    onFileDrop={handleFileDrop}
                  />
                ))}
              {displayFiles.map((file) => (
                <FileCard
                  key={file.id}
                  file={file}
                  viewMode="grid"
                  isSelected={selectedFileIds.has(file.id)}
                  onClick={(e) => handleFileClick(e, file)}
                  onDelete={handleDeleteFile}
                  onRename={handleRenameFile}
                  onShare={handleShare}
                  onCompress={handleCompress}
                  onRemoveBg={handleRemoveBg}
                  onDragStart={handleDragStart}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-0.5">
              {searchResults === null &&
                folders.map((folder) => (
                  <FolderCard
                    key={folder.id}
                    id={folder.id}
                    name={folder.name}
                    viewMode="list"
                    onRename={handleRenameFolder}
                    onDelete={handleDeleteFolder}
                    onFileDrop={handleFileDrop}
                  />
                ))}
              {displayFiles.map((file) => (
                <FileCard
                  key={file.id}
                  file={file}
                  viewMode="list"
                  isSelected={selectedFileIds.has(file.id)}
                  onClick={(e) => handleFileClick(e, file)}
                  onDelete={handleDeleteFile}
                  onRename={handleRenameFile}
                  onShare={handleShare}
                  onCompress={handleCompress}
                  onRemoveBg={handleRemoveBg}
                  onDragStart={handleDragStart}
                />
              ))}
            </div>
          )}
        </div>

        {/* Preview Panel */}
        {selectedFile && (
          <FilePreview
            file={selectedFile}
            onClose={() => setSelectedFile(null)}
            onDelete={handleDeleteFile}
            onRename={handleRenameFile}
            onEdit={handleEditImage}
            onRemoveBg={handleRemoveBg}
          />
        )}
      </div>

      {/* Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedFileIds.size}
        folders={folders}
        onDelete={handleBulkDelete}
        onMove={handleBulkMove}
        onZip={handleBulkZip}
        onClear={() => setSelectedFileIds(new Set())}
      />

      {/* Upload Progress */}
      <UploadProgress
        uploads={uploads}
        onDismiss={() => setUploads([])}
      />

      {/* New Folder Modal */}
      {showNewFolder && (
        <NewFolderModal
          onClose={() => setShowNewFolder(false)}
          onCreate={handleCreateFolder}
        />
      )}

      {/* Share Modal */}
      {shareFileId && (
        <ShareModal
          fileId={shareFileId}
          fileName={
            files.find((f) => f.id === shareFileId)?.name || "File"
          }
          onClose={() => setShareFileId(null)}
        />
      )}

      {/* Image Editor */}
      {editingImage && (
        <ImageEditor
          fileId={editingImage.id}
          fileName={editingImage.name}
          previewUrl={editingImage.previewUrl}
          originalWidth={editingImage.width}
          originalHeight={editingImage.height}
          onClose={() => setEditingImage(null)}
          onSaved={() => {
            refreshData();
          }}
        />
      )}

      {/* Compress Modal */}
      {compressFileId && (() => {
        const f = files.find((file) => file.id === compressFileId);
        if (!f) return null;
        return (
          <CompressModal
            fileName={f.name}
            fileSize={f.size}
            mimeType={f.mimeType}
            onClose={() => setCompressFileId(null)}
            onCompress={handleCompressConfirm}
          />
        );
      })()}

      {/* Removing Background Overlay */}
      {removingBg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="rounded-2xl border border-border bg-bg-primary p-8 text-center shadow-lg">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            <p className="mt-4 text-sm font-medium text-fg-primary">
              Removing background
            </p>
            <p className="mt-1 text-xs text-fg-tertiary">
              One moment...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
