export interface CaptionSegment {
  start: number;
  end: number;
  text: string;
}

const pad = (value: number, length: number) =>
  String(value).padStart(length, "0");

/** Formats seconds as a WebVTT timestamp: HH:MM:SS.mmm */
export const formatVttTimestamp = (seconds: number): string => {
  const totalMs = Math.max(0, Math.round(seconds * 1000));
  const hours = Math.floor(totalMs / 3_600_000);
  const minutes = Math.floor((totalMs % 3_600_000) / 60_000);
  const secs = Math.floor((totalMs % 60_000) / 1000);
  const ms = totalMs % 1000;
  return `${pad(hours, 2)}:${pad(minutes, 2)}:${pad(secs, 2)}.${pad(ms, 3)}`;
};

// WebVTT cue payloads treat "&", "<" and "-->" specially.
const escapeCueText = (text: string) =>
  text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

/**
 * Builds a WebVTT document from transcription segments.
 * Empty, malformed, or zero-length segments are skipped.
 */
export const segmentsToVtt = (segments: CaptionSegment[]): string => {
  const cues = segments
    .map((segment) => ({
      start: Number(segment.start),
      end: Number(segment.end),
      text: (segment.text ?? "").trim(),
    }))
    .filter(
      (segment) =>
        segment.text.length > 0 &&
        Number.isFinite(segment.start) &&
        Number.isFinite(segment.end) &&
        segment.end > segment.start,
    )
    .map(
      (segment, index) =>
        `${index + 1}\n${formatVttTimestamp(segment.start)} --> ${formatVttTimestamp(segment.end)}\n${escapeCueText(segment.text)}`,
    );

  return ["WEBVTT", ...cues].join("\n\n") + "\n";
};
