import { useEffect, useRef, useState } from "react";

interface Cue {
  start: number;
  end: number;
  text: string;
}

const WORDS_PER_CHUNK = 5;
const CHAR_MS = 45;

function decodeEntities(text: string): string {
  const el = document.createElement("textarea");
  el.innerHTML = text;
  return el.value;
}

function toSeconds(ts: string): number {
  const parts = ts.trim().split(":");
  let value = 0;
  for (const part of parts) value = value * 60 + parseFloat(part);
  return value || 0;
}

function parseVtt(vtt: string): Cue[] {
  const cues: Cue[] = [];
  const blocks = vtt.replace(/\r/g, "").split("\n\n");
  for (const block of blocks) {
    const lines = block.split("\n");
    while (lines.length && !lines[0].trim()) lines.shift();
    if (!lines.length || lines[0].indexOf("WEBVTT") === 0) continue;
    const ti =
      lines[0].indexOf("-->") >= 0
        ? 0
        : lines.length > 1 && lines[1].indexOf("-->") >= 0
          ? 1
          : -1;
    if (ti < 0) continue;
    const parts = lines[ti].split("-->");
    cues.push({
      start: toSeconds(parts[0]),
      end: toSeconds(parts[1].trim().split(" ")[0]),
      text: decodeEntities(lines.slice(ti + 1).join("\n")),
    });
  }
  return cues;
}

function chunkWords(text: string): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const chunks: string[] = [];
  for (let i = 0; i < words.length; i += WORDS_PER_CHUNK) {
    chunks.push(words.slice(i, i + WORDS_PER_CHUNK).join(" "));
  }
  return chunks;
}

export const CaptionOverlay = ({
  src,
  videoRef,
}: {
  src: string;
  videoRef: React.RefObject<HTMLVideoElement | null>;
}) => {
  const [cues, setCues] = useState<Cue[]>([]);
  const [display, setDisplay] = useState("");
  const activeRef = useRef(-1);
  const typingRef = useRef<{ chunks: string[]; visible: string[] } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(src)
      .then((res) => (res.ok ? res.text() : ""))
      .then((vtt) => {
        if (!cancelled && vtt) setCues(parseVtt(vtt));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [src]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let raf = 0;

    const render = () => {
      raf = requestAnimationFrame(render);
      const t = video.currentTime;

      let idx = -1;
      for (let i = 0; i < cues.length; i++) {
        if (t >= cues[i].start && t < cues[i].end) {
          idx = i;
          break;
        }
      }

      if (idx !== activeRef.current) {
        activeRef.current = idx;
        typingRef.current =
          idx >= 0 ? { chunks: chunkWords(cues[idx].text), visible: [] } : null;
      }

      const typing = typingRef.current;
      if (!typing || idx < 0) {
        setDisplay("");
        return;
      }

      const cue = cues[idx];
      const dur = Math.max(cue.end - cue.start, 0.001);
      const chunkDur = dur / typing.chunks.length;

      // Which chunk we should be showing, based on actual playback time.
      const tInCue = Math.min(Math.max(t - cue.start, 0), dur);
      const chunkIdx = Math.min(
        typing.chunks.length - 1,
        Math.floor(tInCue / chunkDur),
      );

      // Progressive reveal within the current chunk, synced to elapsed time.
      const charCount = typing.chunks[chunkIdx].length;
      const revealMs = Math.max(charCount * CHAR_MS, chunkDur * 1000 * 0.5);
      const elapsedMs = (tInCue - chunkIdx * chunkDur) * 1000;
      const chars = Math.min(charCount, Math.floor((elapsedMs / revealMs) * charCount));

      const current = typing.visible[chunkIdx] ?? "";
      if (chars > current.length) {
        typing.visible[chunkIdx] = typing.chunks[chunkIdx].slice(0, chars);
      }

      setDisplay(typing.visible.filter(Boolean).join(" "));
    };

    render();
    return () => cancelAnimationFrame(raf);
  }, [cues, videoRef]);

  return display ? (
    <div
      className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-16 z-10 max-w-[70%] px-3 py-1.5 rounded-lg bg-black/70 text-center text-white caption-text"
      aria-live="polite"
    >
      {display}
    </div>
  ) : null;
};
