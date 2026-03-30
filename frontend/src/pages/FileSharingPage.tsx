import { ChangeEvent, useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { apiRequest, getApiBaseUrl } from "../api/client";
import type { AppLayoutContext } from "../App";
import { LoadingState } from "../components/LoadingState";
import { SharedFile } from "../types";
import { formatDateTime } from "../utils/format";

const acceptedFileTypes = ".pdf,.doc,.docx,.ppt,.pptx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation";
const maxFileSizeBytes = 3 * 1024 * 1024;

const formatFileSize = (sizeBytes: number) => {
  if (sizeBytes < 1024) {
    return `${sizeBytes} B`;
  }

  if (sizeBytes < 1024 * 1024) {
    return `${(sizeBytes / 1024).toFixed(1)} KB`;
  }

  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
};

const fileToBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Unable to read the selected file."));
        return;
      }

      const [, base64] = result.split(",");
      resolve(base64 ?? "");
    };
    reader.onerror = () => reject(new Error("Unable to read the selected file."));
    reader.readAsDataURL(file);
  });

export const FileSharingPage = () => {
  const { selectedProjectId } = useOutletContext<AppLayoutContext>();
  const [files, setFiles] = useState<SharedFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [downloadingFileId, setDownloadingFileId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadFiles = async () => {
    if (!selectedProjectId) {
      setFiles([]);
      return;
    }

    setLoading(true);
    try {
      const data = await apiRequest<{ files: SharedFile[] }>(`/projects/${selectedProjectId}/files`);
      setFiles(data.files);
      setError(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load shared files.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadFiles();
  }, [selectedProjectId]);

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!selectedProjectId || !file) {
      return;
    }

    if (file.size > maxFileSizeBytes) {
      setError("Files must be 3 MB or smaller.");
      return;
    }

    setUploading(true);
    setError(null);
    try {
      const contentBase64 = await fileToBase64(file);
      await apiRequest(`/projects/${selectedProjectId}/files`, {
        method: "POST",
        body: JSON.stringify({
          originalName: file.name,
          mimeType: file.type || "application/octet-stream",
          contentBase64
        })
      });
      await loadFiles();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to upload file.");
    } finally {
      setUploading(false);
    }
  };

  const downloadFile = async (file: SharedFile) => {
    if (!selectedProjectId) {
      return;
    }

    setDownloadingFileId(file.id);
    try {
      const token = localStorage.getItem("syncup-token") ?? localStorage.getItem("syncu-token");
      const response = await fetch(`${getApiBaseUrl()}/projects/${selectedProjectId}/files/${file.id}/download`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      });

      if (!response.ok) {
        throw new Error("Unable to download file.");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = file.originalName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setError(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to download file.");
    } finally {
      setDownloadingFileId(null);
    }
  };

  if (!selectedProjectId) {
    return <div className="glass-panel page-enter p-6 text-sm text-muted">Select a project to share files.</div>;
  }

  if (loading && files.length === 0) {
    return <LoadingState label="Loading shared files..." />;
  }

  return (
    <div className="page-enter space-y-6">
      <section className="glass-panel p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="panel-title font-display text-3xl font-semibold text-frost">File Sharing</h1>
            <p className="mt-2 text-sm text-muted">
              Upload PDFs, Word documents, and PowerPoint files up to 3 MB each for your team to access in one place.
            </p>
          </div>

          <label className="glow-button inline-flex cursor-pointer items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold text-white">
            {uploading ? "Uploading..." : "Upload file"}
            <input
              type="file"
              accept={acceptedFileTypes}
              disabled={uploading}
              onChange={handleUpload}
              className="hidden"
            />
          </label>
        </div>

        {error ? <p className="mt-4 rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p> : null}
      </section>

      <section className="glass-panel p-6">
        <div className="flex items-center justify-between">
          <h2 className="panel-title font-display text-2xl font-semibold text-frost">Shared files</h2>
          <span className="text-sm text-muted">{files.length} items</span>
        </div>

        <div className="mt-5 space-y-3">
          {files.map((file) => (
            <article key={file.id} className="glass-subpanel flex flex-col gap-4 rounded-[24px] p-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-base font-semibold text-frost">{file.originalName}</p>
                <p className="mt-1 text-sm text-muted">
                  Uploaded by {file.user.name} on {formatDateTime(file.createdAt)}
                </p>
                <p className="mt-2 text-xs uppercase tracking-[0.18em] text-electric">
                  {file.mimeType} • {formatFileSize(file.sizeBytes)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void downloadFile(file)}
                disabled={downloadingFileId === file.id}
                className="ghost-button rounded-2xl px-4 py-3 text-sm font-semibold text-frost disabled:opacity-60"
              >
                {downloadingFileId === file.id ? "Downloading..." : "Download"}
              </button>
            </article>
          ))}
          {files.length === 0 ? <p className="text-sm text-muted">No shared files yet. Upload the first document for this project.</p> : null}
        </div>
      </section>
    </div>
  );
};
