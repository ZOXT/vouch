import { useCallback, useEffect, useRef, useState } from "react";
import { CircleStop, CloudUpload, RefreshCcw, Video } from "lucide-react";
import { cn, formatDuration } from "@/lib/utils";
import { formatBytes } from "@/lib/upload";
import { MAX_TESTIMONIAL_DURATION_SECONDS } from "@/lib/limits";
import { Button } from "@/components/ui/button";

export interface SelectedVideo {
  file: File;
  durationSeconds?: number;
}

const VIDEO_MIME_CANDIDATES = [
  "video/mp4",
  "video/webm;codecs=vp9,opus",
  "video/webm;codecs=vp8,opus",
  "video/webm",
];

const pickRecorderMimeType = (): string => {
  if (typeof MediaRecorder === "undefined") return "video/webm";
  return VIDEO_MIME_CANDIDATES.find((type) => MediaRecorder.isTypeSupported(type)) ?? "video/webm";
};

const formatTimer = (seconds: number) =>
  `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

type Mode = "upload" | "record";

interface VideoInputProps {
  onChange: (video: SelectedVideo | null) => void;
  disabled?: boolean;
}

export const VideoInput = ({ onChange, disabled }: VideoInputProps) => {
  const [mode, setMode] = useState<Mode>("upload");
  const [selected, setSelected] = useState<SelectedVideo | null>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Recorder state
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [recording, setRecording] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const liveVideoRef = useRef<HTMLVideoElement | null>(null);
  // Mirror the live timer value so callbacks created once (e.g. recorder.onstop)
  // always read the current duration instead of a stale closure value.
  const elapsedRef = useRef(0);

  const stopTracks = useCallback(() => {
    setStream((current) => {
      current?.getTracks().forEach((track) => track.stop());
      return null;
    });
  }, []);

  useEffect(() => () => {
    stopTracks();
    if (timerRef.current) window.clearInterval(timerRef.current);
  }, [stopTracks]);

  useEffect(() => {
    if (liveVideoRef.current && stream) {
      liveVideoRef.current.srcObject = stream;
    }
  }, [stream]);

  const emit = (video: SelectedVideo | null) => {
    setSelected(video);
    onChange(video);
  };

  const acceptFile = (file: File | undefined) => {
    setError(null);
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      setError("Please choose a video file (mp4, mov, or webm).");
      return;
    }
    const url = URL.createObjectURL(file);
    const probe = document.createElement("video");
    probe.preload = "metadata";
    probe.onloadedmetadata = () => {
      const duration = Number.isFinite(probe.duration) ? Math.round(probe.duration) : undefined;
      URL.revokeObjectURL(url);
      if (duration != null && duration > MAX_TESTIMONIAL_DURATION_SECONDS) {
        setError("Videos can be up to 2 minutes long. Please pick a shorter clip.");
        return;
      }
      emit({ file, durationSeconds: duration });
    };
    probe.onerror = () => {
      URL.revokeObjectURL(url);
      emit({ file });
    };
    probe.src = url;
  };

  const startCamera = async () => {
    setError(null);
    try {
      const media = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(media);
    } catch {
      setError("Camera/microphone access was denied. Allow access or upload a file instead.");
    }
  };

  const startRecording = () => {
    if (!stream) return;
    const mimeType = pickRecorderMimeType();
    const recorder = new MediaRecorder(stream, { mimeType });
    chunksRef.current = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };
    recorder.onstop = () => {
      const baseType = mimeType.split(";")[0] ?? "video/webm";
      const blob = new Blob(chunksRef.current, { type: baseType });
      const extension = baseType.includes("mp4") ? "mp4" : "webm";
      const file = new File([blob], `recording.${extension}`, { type: baseType });
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(blob);
      });
      emit({ file, durationSeconds: elapsedRef.current });
      setFinalizing(false);
      stopTracks();
    };
    recorder.onerror = () => {
      setFinalizing(false);
      setError("Recording failed. Please try again.");
    };
    recorderRef.current = recorder;
    recorder.start(250);
    elapsedRef.current = 0;
    setElapsed(0);
    setRecording(true);
    setFinalizing(false);
    timerRef.current = window.setInterval(() => {
      elapsedRef.current += 1;
      setElapsed(elapsedRef.current);
      if (elapsedRef.current >= MAX_TESTIMONIAL_DURATION_SECONDS) {
        stopRecording();
      }
    }, 1000);
  };

  const stopRecording = () => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = null;
    setRecording(false);
    setFinalizing(true);
    recorderRef.current?.stop();
  };

  const resetRecording = () => {
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setFinalizing(false);
    emit(null);
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
    if (next === "record" && !stream && !previewUrl) void startCamera();
    if (next === "upload") {
      stopRecording();
      stopTracks();
    }
  };

  return (
    <div>
      <div className="mb-4 grid grid-cols-2 gap-1 rounded-xl bg-gray-100 p-1">
        {(["upload", "record"] as const).map((value) => (
          <button
            key={value}
            type="button"
            disabled={disabled}
            onClick={() => switchMode(value)}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium capitalize transition-colors",
              mode === value ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700",
            )}
          >
            {value === "upload" ? "Upload video" : "Record video"}
          </button>
        ))}
      </div>

      {mode === "upload" && (
        <div>
          {selected ? (
            <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3.5">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50">
                  <Video className="h-5 w-5 text-brand-600" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-900">{selected.file.name}</p>
                  <p className="text-xs text-gray-500">
                    {formatBytes(selected.file.size)}
                    {selected.durationSeconds != null && ` · ${formatDuration(selected.durationSeconds)}`}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => emit(null)} disabled={disabled}>
                Change
              </Button>
            </div>
          ) : (
            <label
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                acceptFile(e.dataTransfer.files?.[0]);
              }}
              className={cn(
                "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors",
                dragging ? "border-brand-400 bg-brand-50" : "border-gray-300 bg-white hover:border-brand-300 hover:bg-gray-50",
                disabled && "pointer-events-none opacity-50",
              )}
            >
              <CloudUpload className="h-8 w-8 text-brand-500" />
              <p className="mt-3 text-sm font-medium text-gray-900">
                Drop your video here, or <span className="text-brand-600 underline">browse</span>
              </p>
              <p className="mt-1 text-xs text-gray-500">MP4, MOV, or WebM · up to 2 minutes</p>
              <input
                type="file"
                accept="video/mp4,video/quicktime,video/webm,video/*"
                className="hidden"
                onChange={(e) => acceptFile(e.target.files?.[0])}
              />
            </label>
          )}
        </div>
      )}

      {mode === "record" && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-950">
          {previewUrl ? (
            <div>
              <video key="preview" src={previewUrl} controls playsInline className="aspect-video w-full" />
              <div className="flex items-center justify-between bg-white px-4 py-3">
                <p className="text-sm text-gray-600">
                  {selected?.durationSeconds != null
                    ? `Recording · ${formatDuration(selected.durationSeconds)}`
                    : "Recording ready"}
                </p>
                <Button variant="outline" size="sm" onClick={resetRecording} disabled={disabled}>
                  <RefreshCcw className="h-4 w-4" /> Re-record
                </Button>
              </div>
            </div>
          ) : stream ? (
            <div>
              <video key="live" ref={liveVideoRef} autoPlay playsInline muted className="aspect-video w-full object-cover" />
              <div className="flex items-center justify-between bg-white px-4 py-3">
                <span className={cn("flex items-center gap-2 text-sm font-medium", recording ? "text-red-600" : "text-gray-500")}>
                  {recording && <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />}
                  {recording ? (
                    formatTimer(elapsed)
                  ) : finalizing ? (
                    "Finalizing recording…"
                  ) : (
                    "Camera ready"
                  )}
                </span>
                {recording ? (
                  <Button variant="danger" size="sm" onClick={stopRecording}>
                    <CircleStop className="h-4 w-4" /> Stop
                  </Button>
                ) : finalizing ? (
                  <span className="h-8 inline-flex items-center text-xs text-gray-400">Saving…</span>
                ) : (
                  <Button size="sm" onClick={startRecording} disabled={disabled}>
                    <span className="h-2.5 w-2.5 rounded-full bg-red-400" /> Start recording
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex aspect-video flex-col items-center justify-center gap-3 text-gray-400">
              <Video className="h-8 w-8" />
              <Button variant="secondary" size="sm" onClick={startCamera}>
                Enable camera & microphone
              </Button>
            </div>
          )}
        </div>
      )}

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  );
};
