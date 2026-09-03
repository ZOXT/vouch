import { escapeHtml } from "../utils/html";
import type { EmbedPlayerData } from "../services/embed-page.service";

export const renderEmbedPlayer = (data: EmbedPlayerData): string => {
  const name = escapeHtml(data.clientName);
  const heading = data.clientDesignation?.trim()
    ? `${name} · ${escapeHtml(data.clientDesignation)}`
    : name;
  const videoUrl = escapeHtml(data.videoUrl);
  const captionsUrl = `/embed/${encodeURIComponent(data.publicId)}/captions/${encodeURIComponent(data.testimonialId)}`;
  const captionsAvailable = data.captionsEnabled && data.hasCaptions;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${name} — Video testimonial</title>
<style>
  :root {
    --vouch-accent: #4f46e5;
    --vouch-font: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { height: 100%; background: #08080a; overflow: hidden; }
  body { font-family: var(--vouch-font); -webkit-font-smoothing: antialiased; }

  .player {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #08080a;
  }
  .player video {
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
  }

  .player__name {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    padding: 16px 18px;
    color: #fff;
    font-size: 14px;
    font-weight: 600;
    text-shadow: 0 1px 4px rgba(0, 0, 0, 0.6);
    background: linear-gradient(to bottom, rgba(8, 8, 10, 0.55), transparent);
    pointer-events: none;
    transition: opacity 0.3s ease;
  }

  .caption {
    position: absolute;
    left: 50%;
    bottom: 76px;
    transform: translateX(-50%);
    max-width: 82%;
    padding: 6px 12px;
    border-radius: 8px;
    background: rgba(8, 8, 10, 0.68);
    color: #fff;
    font-size: clamp(12px, 1.9vw, 16px);
    line-height: 1.45;
    text-align: center;
    white-space: pre-line;
    text-wrap: balance;
    opacity: 0;
    transition: opacity 0.18s ease, bottom 0.3s ease;
    pointer-events: none;
  }
  .caption.is-visible { opacity: 1; }
  .player.is-idle .caption { bottom: 28px; }
  .player.is-idle .player__name,
  .player.is-idle .controls { opacity: 0; pointer-events: none; }

  .controls {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    background: linear-gradient(to top, rgba(8, 8, 10, 0.72), transparent);
    transition: opacity 0.3s ease;
  }
  .controls button {
    appearance: none;
    border: 0;
    background: transparent;
    color: #fff;
    width: 34px;
    height: 34px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background 0.15s ease, color 0.15s ease;
    flex: 0 0 auto;
  }
  .controls button:hover { background: rgba(255, 255, 255, 0.14); }
  .controls button:focus-visible { outline: 2px solid var(--vouch-accent); outline-offset: 1px; }
  .controls button svg { width: 20px; height: 20px; }
  .controls button[aria-pressed="true"] { color: #a5b4fc; background: rgba(99, 102, 241, 0.25); }

  .seek {
    position: relative;
    flex: 1 1 auto;
    height: 20px;
    display: flex;
    align-items: center;
    cursor: pointer;
    touch-action: none;
  }
  .seek::before {
    content: "";
    position: absolute;
    left: 0;
    right: 0;
    height: 4px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.28);
    transition: height 0.12s ease;
  }
  .seek:hover::before { height: 6px; }
  .seek__fill {
    position: absolute;
    left: 0;
    height: 4px;
    border-radius: 999px;
    background: var(--vouch-accent);
    width: 0%;
    pointer-events: none;
  }
  .seek:hover .seek__fill { height: 6px; }

  .time {
    color: rgba(255, 255, 255, 0.85);
    font-size: 12px;
    font-weight: 500;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }

  .overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(8, 8, 10, 0.35);
    border: 0;
    cursor: pointer;
  }
  .overlay__circle {
    width: 72px;
    height: 72px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.94);
    color: var(--vouch-accent);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 10px 36px rgba(0, 0, 0, 0.4);
    transition: transform 0.2s ease;
  }
  .overlay:hover .overlay__circle { transform: scale(1.08); }
  .overlay__circle svg { width: 30px; height: 30px; margin-left: 3px; }
  .overlay[hidden] { display: none; }

  .spinner {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 44px;
    height: 44px;
    margin: -22px 0 0 -22px;
    border-radius: 50%;
    border: 3px solid rgba(255, 255, 255, 0.2);
    border-top-color: #fff;
    animation: vouch-spin 0.8s linear infinite;
    pointer-events: none;
  }
  .spinner[hidden] { display: none; }
  @keyframes vouch-spin { to { transform: rotate(360deg); } }

  .error {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #08080a;
    color: #e5e7eb;
    font-size: 14px;
    padding: 24px;
    text-align: center;
    z-index: 1;
  }
  @media (prefers-reduced-motion: reduce) {
    .caption, .controls, .player__name, .overlay__circle { transition: none; }
  }
</style>
</head>
<body>
  <div class="player" id="player">
    <video id="video" src="${videoUrl}" playsinline preload="auto"></video>
    <div class="player__name">${heading}</div>
    <div class="caption" id="caption" aria-live="polite"></div>
    <div class="spinner" id="spinner"></div>
    <button type="button" class="overlay" id="bigPlay" aria-label="Play video" hidden>
      <span class="overlay__circle">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13c0 .9.98 1.45 1.73.98l10-6.5a1.15 1.15 0 0 0 0-1.96l-10-6.5A1.15 1.15 0 0 0 8 5.5z"/></svg>
      </span>
    </button>
    <div class="controls" id="controls">
      <button type="button" id="play" aria-label="Play">
        <svg id="iconPlay" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13c0 .9.98 1.45 1.73.98l10-6.5a1.15 1.15 0 0 0 0-1.96l-10-6.5A1.15 1.15 0 0 0 8 5.5z"/></svg>
        <svg id="iconPause" viewBox="0 0 24 24" fill="currentColor" style="display:none"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z"/></svg>
      </button>
      <div class="seek" id="seek" role="slider" aria-label="Seek" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" tabindex="0">
        <div class="seek__fill" id="seekFill"></div>
      </div>
      <span class="time" id="time">0:00 / 0:00</span>
      <button type="button" id="cc" aria-label="Toggle captions" aria-pressed="false" hidden>
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm6.2 6.05c-.2-.75-.86-1.3-2.07-1.3-1.5 0-2.5 1.06-2.5 2.62 0 1.57 1 2.63 2.5 2.63 1.21 0 1.87-.56 2.07-1.32l1.44.53c-.42 1.24-1.5 2.15-3.5 2.15-2.32 0-3.98-1.72-3.98-4 0-2.27 1.66-3.99 3.98-3.99 2 0 3.08.9 3.5 2.15l-1.44.53zm8.3 0c-.2-.75-.86-1.3-2.07-1.3-1.5 0-2.5 1.06-2.5 2.62 0 1.57 1 2.63 2.5 2.63 1.21 0 1.87-.56 2.07-1.32l1.44.53c-.42 1.24-1.5 2.15-3.5 2.15-2.32 0-3.99-1.72-3.99-4 0-2.27 1.67-3.99 3.99-3.99 2 0 3.08.9 3.5 2.15l-1.45.53z"/></svg>
      </button>
      <button type="button" id="mute" aria-label="Mute">
        <svg id="iconVolume" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 4.5v-15L7 9H3zm13.5 3a4.5 4.5 0 0 0-2.5-4v8a4.47 4.47 0 0 0 2.5-4zM14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6z"/></svg>
        <svg id="iconMuted" viewBox="0 0 24 24" fill="currentColor" style="display:none"><path d="M3 9v6h4l5 4.5v-15L7 9H3zm18.6 10.2L4.8 2.4 3.4 3.8l16.8 16.8 1.4-1.4z"/></svg>
      </button>
      <button type="button" id="fullscreen" aria-label="Fullscreen">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 4h6v2H6v4H4V4zm10 0h6v6h-2V6h-4V4zM4 14h2v4h4v2H4v-6zm14 0h2v6h-6v-2h4v-4z"/></svg>
      </button>
    </div>
  </div>
<script>
(function () {
  var CAPTIONS_AVAILABLE = ${captionsAvailable ? "true" : "false"};
  var CAPTIONS_URL = ${JSON.stringify(captionsUrl)};

  var player = document.getElementById("player");
  var video = document.getElementById("video");
  var captionEl = document.getElementById("caption");
  var spinner = document.getElementById("spinner");
  var bigPlay = document.getElementById("bigPlay");
  var controls = document.getElementById("controls");
  var playBtn = document.getElementById("play");
  var iconPlay = document.getElementById("iconPlay");
  var iconPause = document.getElementById("iconPause");
  var seek = document.getElementById("seek");
  var seekFill = document.getElementById("seekFill");
  var timeEl = document.getElementById("time");
  var ccBtn = document.getElementById("cc");
  var muteBtn = document.getElementById("mute");
  var iconVolume = document.getElementById("iconVolume");
  var iconMuted = document.getElementById("iconMuted");
  var fsBtn = document.getElementById("fullscreen");

  function fmt(seconds) {
    if (!isFinite(seconds) || seconds < 0) seconds = 0;
    var total = Math.floor(seconds);
    var h = Math.floor(total / 3600);
    var m = Math.floor((total % 3600) / 60);
    var s = total % 60;
    var mm = h > 0 ? String(m).padStart(2, "0") : String(m);
    return (h > 0 ? h + ":" : "") + mm + ":" + String(s).padStart(2, "0");
  }

  function decodeEntities(text) {
    var el = document.createElement("textarea");
    el.innerHTML = text;
    return el.value;
  }

  function toSeconds(ts) {
    var parts = ts.trim().split(":");
    var value = 0;
    for (var i = 0; i < parts.length; i++) value = value * 60 + parseFloat(parts[i]);
    return value || 0;
  }

  function parseVtt(vtt) {
    var cues = [];
    var blocks = vtt.replace(/\\r/g, "").split("\\n\\n");
    for (var i = 0; i < blocks.length; i++) {
      var lines = blocks[i].split("\\n");
      while (lines.length && !lines[0].trim()) lines.shift();
      if (!lines.length || lines[0].indexOf("WEBVTT") === 0) continue;
      var ti = lines[0].indexOf("-->") >= 0 ? 0 : (lines.length > 1 && lines[1].indexOf("-->") >= 0 ? 1 : -1);
      if (ti < 0) continue;
      var parts = lines[ti].split("-->");
      cues.push({
        start: toSeconds(parts[0]),
        end: toSeconds(parts[1].trim().split(" ")[0]),
        text: decodeEntities(lines.slice(ti + 1).join("\\n"))
      });
    }
    return cues;
  }

  var cues = [];
  var ccOn = false;
  var activeCue = -1;

  function syncCaptions() {
    if (!cues.length) return;
    var t = video.currentTime;
    var idx = -1;
    for (var i = 0; i < cues.length; i++) {
      if (t >= cues[i].start && t < cues[i].end) { idx = i; break; }
    }
    if (idx === activeCue) return;
    activeCue = idx;
    if (ccOn && idx >= 0) {
      captionEl.textContent = cues[idx].text;
      captionEl.classList.add("is-visible");
    } else {
      captionEl.classList.remove("is-visible");
    }
  }

  function setCc(on) {
    ccOn = on;
    ccBtn.setAttribute("aria-pressed", String(on));
    try { localStorage.setItem("vouch-cc", on ? "on" : "off"); } catch (e) {}
    activeCue = -1;
    if (!on) captionEl.classList.remove("is-visible");
    syncCaptions();
  }

  if (CAPTIONS_AVAILABLE) {
    fetch(CAPTIONS_URL)
      .then(function (res) { return res.ok ? res.text() : ""; })
      .then(function (text) {
        if (!text) return;
        cues = parseVtt(text);
        if (!cues.length) return;
        ccBtn.hidden = false;
        var saved = null;
        try { saved = localStorage.getItem("vouch-cc"); } catch (e) {}
        if (saved === "on") setCc(true);
      })
      .catch(function () {});
  }

  ccBtn.addEventListener("click", function () { setCc(!ccOn); });

  function updatePlayIcon() {
    var paused = video.paused;
    iconPlay.style.display = paused ? "" : "none";
    iconPause.style.display = paused ? "none" : "";
    playBtn.setAttribute("aria-label", paused ? "Play" : "Pause");
  }

  function togglePlay() {
    if (video.paused) video.play().catch(function () {});
    else video.pause();
  }

  playBtn.addEventListener("click", togglePlay);
  bigPlay.addEventListener("click", function () {
    video.play().catch(function () {});
  });
  video.addEventListener("click", togglePlay);

  video.addEventListener("play", function () {
    bigPlay.hidden = true;
    updatePlayIcon();
    pokeControls();
  });
  video.addEventListener("pause", function () {
    updatePlayIcon();
    showControls();
  });
  video.addEventListener("waiting", function () { spinner.hidden = false; });
  video.addEventListener("canplay", function () { spinner.hidden = true; });
  video.addEventListener("error", function () {
    spinner.hidden = true;
    bigPlay.hidden = true;
    showControls();
    var err = document.createElement("div");
    err.className = "error";
    err.textContent = "Sorry, this video could not be loaded.";
    player.appendChild(err);
  });

  video.addEventListener("timeupdate", function () {
    var duration = video.duration || 0;
    if (duration > 0) {
      var pct = (video.currentTime / duration) * 100;
      seekFill.style.width = pct + "%";
      seek.setAttribute("aria-valuenow", String(Math.round(pct)));
    }
    timeEl.textContent = fmt(video.currentTime) + " / " + fmt(duration);
    syncCaptions();
  });
  video.addEventListener("loadedmetadata", function () {
    timeEl.textContent = "0:00 / " + fmt(video.duration);
  });

  var seeking = false;
  function seekTo(clientX) {
    var rect = seek.getBoundingClientRect();
    var ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    if (video.duration) video.currentTime = ratio * video.duration;
  }
  seek.addEventListener("pointerdown", function (e) {
    seeking = true;
    seek.setPointerCapture(e.pointerId);
    seekTo(e.clientX);
  });
  seek.addEventListener("pointermove", function (e) { if (seeking) seekTo(e.clientX); });
  seek.addEventListener("pointerup", function () { seeking = false; });
  seek.addEventListener("keydown", function (e) {
    if (e.key === "ArrowRight") video.currentTime = Math.min((video.duration || 0), video.currentTime + 5);
    if (e.key === "ArrowLeft") video.currentTime = Math.max(0, video.currentTime - 5);
  });

  function updateMuteIcon() {
    iconVolume.style.display = video.muted ? "none" : "";
    iconMuted.style.display = video.muted ? "" : "none";
    muteBtn.setAttribute("aria-label", video.muted ? "Unmute" : "Mute");
  }
  muteBtn.addEventListener("click", function () {
    video.muted = !video.muted;
    updateMuteIcon();
  });

  fsBtn.addEventListener("click", function () {
    if (document.fullscreenElement) document.exitFullscreen();
    else if (player.requestFullscreen) player.requestFullscreen();
  });

  var hideTimer = null;
  function showControls() {
    player.classList.remove("is-idle");
  }
  function pokeControls() {
    showControls();
    if (hideTimer) clearTimeout(hideTimer);
    if (!video.paused) {
      hideTimer = setTimeout(function () {
        if (!video.paused && !seeking) player.classList.add("is-idle");
      }, 2500);
    }
  }
  ["mousemove", "touchstart", "pointerdown"].forEach(function (evt) {
    player.addEventListener(evt, pokeControls, { passive: true });
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === " " || e.key === "k") { e.preventDefault(); togglePlay(); }
    else if (e.key === "m") { video.muted = !video.muted; updateMuteIcon(); }
    else if (e.key === "f") { fsBtn.click(); }
    else if (e.key === "c" && !ccBtn.hidden) { setCc(!ccOn); }
    else if (e.key === "ArrowRight") { video.currentTime = Math.min((video.duration || 0), video.currentTime + 5); }
    else if (e.key === "ArrowLeft") { video.currentTime = Math.max(0, video.currentTime - 5); }
  });

  var playAttempt = video.play();
  if (playAttempt && playAttempt.catch) {
    playAttempt.catch(function () { bigPlay.hidden = false; });
  }
  updatePlayIcon();
  updateMuteIcon();
  pokeControls();
})();
</script>
</body>
</html>`;
};
