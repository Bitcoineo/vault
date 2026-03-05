export type UploadStatus =
  | "pending"
  | "uploading"
  | "processing"
  | "ready"
  | "error";

export async function uploadFile(
  file: File,
  folderId: string | null,
  onProgress: (progress: number) => void,
  onStatusChange: (status: UploadStatus, fileId?: string) => void
): Promise<{ fileId: string } | { error: string }> {
  try {
    onStatusChange("uploading");

    const formData = new FormData();
    formData.append("file", file);
    if (folderId) formData.append("folderId", folderId);

    // Upload through server using XHR for progress tracking
    const result = await new Promise<{ data?: { id: string; status: string }; error?: string }>(
      (resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/files/upload");

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            onProgress(Math.round((e.loaded / e.total) * 100));
          }
        };

        xhr.onload = () => {
          try {
            const res = JSON.parse(xhr.responseText);
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(res);
            } else {
              console.error(`[upload] Server error ${xhr.status}:`, res);
              resolve({ error: res.error || `Upload failed (${xhr.status})` });
            }
          } catch {
            console.error(`[upload] Failed to parse response (${xhr.status}):`, xhr.responseText?.substring(0, 500));
            resolve({ error: `Upload failed (${xhr.status}): ${xhr.statusText}` });
          }
        };

        xhr.onerror = () => {
          console.error("[upload] Network error — XHR onerror fired");
          reject(new Error("Network error during upload"));
        };
        xhr.send(formData);
      }
    );

    if (result.error) {
      onStatusChange("error");
      return { error: result.error };
    }

    const fileId = result.data!.id;
    const finalStatus = result.data!.status === "ready" ? "ready" : "processing";
    onStatusChange(finalStatus as UploadStatus, fileId);

    return { fileId };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    console.error("Upload error:", err);
    onStatusChange("error");
    return { error: message };
  }
}
