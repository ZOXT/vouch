/**
 * Uploads a file directly to S3 using a presigned URL, reporting progress.
 * Uses XHR because fetch has no upload-progress events.
 */
export const uploadToS3 = (
  presignedUrl: string,
  file: File | Blob,
  contentType: string,
  onProgress: (fraction: number) => void,
): Promise<void> =>
  new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable && event.total > 0) {
        onProgress(event.loaded / event.total);
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(1);
        resolve();
      } else {
        reject(new Error(`Upload failed (${xhr.status}). Please try again.`));
      }
    });

    xhr.addEventListener("error", () =>
      reject(new Error("Network error during upload. Please try again.")),
    );
    xhr.addEventListener("abort", () => reject(new Error("Upload was cancelled.")));

    xhr.open("PUT", presignedUrl);
    xhr.setRequestHeader("Content-Type", contentType);
    xhr.send(file);
  });

/** Reads a video file's duration from its metadata. */
export const getVideoDurationSeconds = (file: File | Blob): Promise<number | undefined> =>
  new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(Number.isFinite(video.duration) ? Math.round(video.duration) : undefined);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(undefined);
    };
    video.src = url;
  });

export const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
