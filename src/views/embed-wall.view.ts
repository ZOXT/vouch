import { escapeHtml } from "../utils/html";
import type { EmbedWallData } from "../services/embed-page.service";

const formatDuration = (seconds: number): string => {
  const total = Math.round(seconds);
  const minutes = Math.floor(total / 60);
  const secs = total % 60;
  return `${minutes}:${String(secs).padStart(2, "0")}`;
};

const initialsOf = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("") || "?";

const renderCard = (testimonial: EmbedWallData["testimonials"][number]): string => {
  const name = escapeHtml(testimonial.clientName);
  const designation = testimonial.clientDesignation?.trim()
    ? `<span class="card__designation">${escapeHtml(testimonial.clientDesignation)}</span>`
    : "";
  const media = testimonial.thumbnailUrl
    ? `<img class="card__img" src="${escapeHtml(testimonial.thumbnailUrl)}" alt="" loading="lazy" decoding="async">`
    : `<span class="card__initials" aria-hidden="true">${escapeHtml(initialsOf(testimonial.clientName))}</span>`;
  const duration =
    testimonial.durationSeconds != null
      ? `<span class="card__duration">${formatDuration(testimonial.durationSeconds)}</span>`
      : "";

  return `
      <button type="button" class="card" data-id="${escapeHtml(testimonial.id)}" aria-label="Play video testimonial from ${name}">
        <span class="card__media">
          ${media}
          <span class="card__scrim" aria-hidden="true"></span>
          <span class="card__play" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13c0 .9.98 1.45 1.73.98l10-6.5a1.15 1.15 0 0 0 0-1.96l-10-6.5A1.15 1.15 0 0 0 8 5.5z"/></svg>
          </span>
          ${duration}
        </span>
        <span class="card__footer">
          <span class="card__avatar" aria-hidden="true">${escapeHtml(initialsOf(testimonial.clientName))}</span>
          <span class="card__meta">
            <span class="card__name">${name}</span>
            ${designation}
          </span>
        </span>
      </button>`;
};

export const renderEmbedWall = (data: EmbedWallData): string => {
  const layout = ["grid", "carousel", "list"].includes(data.layout)
    ? data.layout
    : "grid";
  const theme = ["minimal", "dark", "gradient", "editorial"].includes(data.theme)
    ? data.theme
    : "minimal";
  const title = data.title?.trim()
    ? `<h2 class="wall__title">${escapeHtml(data.title)}</h2>`
    : "";
  const cards = data.testimonials.map(renderCard).join("");
  const publicIdJson = JSON.stringify(data.publicId);

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(data.title ?? "Testimonials")}</title>
<style>
  :root {
    --vouch-radius: 16px;
    --vouch-font: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: transparent; }
  body {
    font-family: var(--vouch-font);
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
  }
  .wall {
    position: relative;
    overflow: hidden;
    border-radius: 26px;
    padding: clamp(18px, 3.2vw, 36px);
    background: var(--wall-bg, transparent);
    isolation: isolate;
  }
  .wall__title {
    position: relative;
    z-index: 2;
    font-size: 21px;
    font-weight: 700;
    letter-spacing: -0.015em;
    margin: 2px 4px 22px;
    color: var(--tg, #111827);
  }
  .wall__items {
    position: relative;
    z-index: 1;
    display: flex;
    gap: 18px;
  }
  .wall__items--grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(235px, 1fr));
  }
  .wall__items--carousel {
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    padding-bottom: 10px;
    scrollbar-width: thin;
    scrollbar-color: #d1d5db transparent;
  }
  .wall__items--carousel::-webkit-scrollbar { height: 8px; }
  .wall__items--carousel::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 999px; }
  .wall__items--carousel .card { scroll-snap-align: start; flex: 0 0 272px; }
  .wall__items--list { flex-direction: column; }

  /* ---------- Decorative background layer ---------- */
  .wall__deco {
    position: absolute;
    inset: 0;
    z-index: 0;
    overflow: hidden;
    pointer-events: none;
    -webkit-mask-image: linear-gradient(#000, #000);
    mask-image: linear-gradient(#000, #000);
  }
  .wall__deco > span { position: absolute; display: block; }

  .deco__orb { border-radius: 50%; filter: blur(60px); opacity: 0.5; }
  .deco__orb--1 { width: 340px; height: 340px; top: -90px; right: -70px; }
  .deco__orb--2 { width: 300px; height: 300px; bottom: -100px; left: -80px; }
  .deco__orb--3 { width: 190px; height: 190px; top: 38%; left: 46%; opacity: 0.34; }

  .deco__quote {
    font-family: ui-serif, Georgia, Cambria, "Times New Roman", serif;
    font-weight: 700;
    line-height: 0.7;
    opacity: 0.55;
    user-select: none;
  }
  .deco__quote--1 { top: 2px; left: 26px; font-size: clamp(74px, 9vw, 130px); }
  .deco__quote--2 { right: 22px; bottom: -8px; font-size: clamp(60px, 8vw, 118px); }
  .deco__quote--3 { top: 40%; left: 8px; font-size: clamp(34px, 4vw, 54px); opacity: 0.32; }

  .deco__dots {
    right: 14%; top: 12%;
    width: 150px; height: 90px;
    background-image: radial-gradient(currentColor 1.4px, transparent 1.4px);
    background-size: 16px 16px;
    opacity: 0.28;
  }

  .deco__spark { font-size: 15px; line-height: 1; opacity: 0.7; }
  .deco__spark--1 { top: 26%; right: 8%; animation: vouch-spark 4.5s ease-in-out infinite; }
  .deco__spark--2 { bottom: 20%; left: 4%; font-size: 11px; animation: vouch-spark 6s ease-in-out infinite 1s; }
  @keyframes vouch-spark {
    0%, 100% { opacity: 0.25; transform: scale(0.9) rotate(0deg); }
    50% { opacity: 0.9; transform: scale(1.15) rotate(18deg); }
  }

  .deco__line { height: 1px; }
  .deco__line--h { left: 0; right: 0; top: 74%; }
  .deco__line--v { width: 1px; height: 40%; right: 6%; top: 30%; height: 180px; }

  /* ---------- Base card ---------- */
  .card {
    appearance: none;
    border: 0;
    background: transparent;
    cursor: pointer;
    text-align: left;
    font: inherit;
    color: inherit;
    display: flex;
    flex-direction: column;
    position: relative;
    overflow: hidden;
    outline: none;
    animation: vouch-rise 0.55s cubic-bezier(0.22,1,0.36,1) both;
  }
  .wall__items .card:nth-child(2) { animation-delay: 0.05s; }
  .wall__items .card:nth-child(3) { animation-delay: 0.1s; }
  .wall__items .card:nth-child(4) { animation-delay: 0.15s; }
  .wall__items .card:nth-child(5) { animation-delay: 0.2s; }
  .wall__items .card:nth-child(6) { animation-delay: 0.25s; }
  .wall__items .card:nth-child(7) { animation-delay: 0.3s; }
  @keyframes vouch-rise {
    from { opacity: 0; transform: translateY(14px) scale(0.985); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
  .card:focus-visible { box-shadow: 0 0 0 3px var(--vouch-focus, rgba(79,70,229,0.4)); border-radius: var(--vouch-radius); }

  .card__media {
    position: relative;
    display: block;
    aspect-ratio: 16 / 10;
    overflow: hidden;
    background: var(--vouch-media, linear-gradient(135deg,#6366f1,#8b5cf6 55%,#ec4899));
    border-radius: var(--vouch-radius);
  }
  .card__img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.5s cubic-bezier(0.22,1,0.36,1), filter 0.4s ease;
  }
  .card:hover .card__img { transform: scale(1.07); }
  .card__initials {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    letter-spacing: 0.04em;
    color: rgba(255,255,255,0.22);
    font-size: 64px;
  }
  .card__scrim {
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, rgba(8,8,12,0.5), rgba(8,8,12,0) 60%);
    transition: opacity 0.4s ease;
  }
  .card__play {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 54px;
    height: 54px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    background: rgba(255,255,255,0.92);
    box-shadow: 0 8px 30px rgba(8,8,12,0.35);
    transition: transform 0.3s cubic-bezier(0.22,1,0.36,1), background 0.3s ease;
  }
  .card__play svg { width: 24px; height: 24px; margin-left: 2px; }
  .card:hover .card__play, .card:focus-visible .card__play { transform: translate(-50%,-50%) scale(1.12); }
  .card__duration {
    position: absolute;
    right: 12px;
    bottom: 12px;
    padding: 3px 9px;
    border-radius: 999px;
    background: rgba(8,8,12,0.72);
    color: #fff;
    font-size: 11.5px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    backdrop-filter: blur(4px);
  }

  /* Footer */
  .card__footer {
    display: flex;
    align-items: center;
    gap: 11px;
    padding: 12px 4px 2px;
    min-width: 0;
  }
  .card__avatar {
    flex: 0 0 auto;
    width: 34px;
    height: 34px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 700;
    background: var(--vouch-avatar, #eef2ff);
    color: var(--vouch-avatar-text, #4f46e5);
  }
  .card__meta { min-width: 0; display: flex; flex-direction: column; gap: 1px; }
  .card__name {
    display: block;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .card__designation {
    display: block;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* ---------- List overrides ---------- */
  .wall__items--list .card {
    flex-direction: row;
    align-items: center;
    gap: 16px;
    padding: 14px;
    border-radius: var(--vouch-radius);
    border: 1px solid var(--vouch-card-border, #eceef2);
    background: var(--vouch-card-bg, #fff);
    transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease, background 0.25s ease;
  }
  .wall__items--list .card + .card { margin-top: 10px; }
  .wall__items--list .card:hover { transform: translateX(3px); box-shadow: var(--vouch-card-shadow, 0 8px 24px rgba(17,24,39,0.08)); }
  .wall__items--list .card__media { flex: 0 0 200px; aspect-ratio: 16 / 10; }
  .wall__items--list .card__footer { flex: 1; padding: 0; }
  .wall__items--list .card__name { font-size: 15px; }
  @media (max-width: 480px) {
    .wall__items--list .card { flex-direction: column; align-items: stretch; }
    .wall__items--list .card__media { flex: none; }
  }

  /* ---------- THEMES ---------- */

  /* Minimal — crisp, airy, editorial whitespace */
  .wall[data-theme="minimal"] {
    --vouch-media: linear-gradient(145deg,#eef2ff,#e0e7ff 60%,#f5eefe);
    --vouch-card-border: #eceef2;
    --vouch-card-bg: #fff;
    --vouch-card-shadow: 0 12px 32px -12px rgba(17,24,39,0.12);
    --vouch-focus: rgba(79,70,229,0.4);
    --tg: #111827; --tc: #111827; --tm: #6b7280;
    --wall-bg: radial-gradient(120% 90% at 12% 0%, #ffffff 0%, #f7f7ff 55%, #eef1fb 100%);
  }
  .wall[data-theme="minimal"] .wall__deco { color: #6366f1; }
  .wall[data-theme="minimal"] .deco__orb { display: none; }
  .wall[data-theme="minimal"] .deco__quote { color: #c7d2fe; opacity: 0.9; }
  .wall[data-theme="minimal"] .deco__quote--3 { color: #c4b5fd; }
  .wall[data-theme="minimal"] .deco__dots { color: #818cf8; }
  .wall[data-theme="minimal"] .deco__spark { color: #6366f1; }
  .wall[data-theme="minimal"] .deco__line { background: linear-gradient(90deg, transparent, #c7d2fe 30%, #c7d2fe 70%, transparent); }
  .wall[data-theme="minimal"] .deco__line--v { background: linear-gradient(180deg, transparent, #c7d2fe 30%, #c7d2fe 70%, transparent); }
  .wall[data-theme="minimal"] .card__media {
    box-shadow: inset 0 0 0 1px rgba(17,24,39,0.06), 0 10px 30px -14px rgba(17,24,39,0.16);
  }
  .wall[data-theme="minimal"] .card__play {
    color: #fff; background: rgba(17,24,39,0.85);
  }
  .wall[data-theme="minimal"] .card__play svg { color: #fff; }
  .wall[data-theme="minimal"] .card__scrim { background: linear-gradient(to top, rgba(8,8,12,0.42), rgba(8,8,12,0) 58%); }
  .wall[data-theme="minimal"] .card__name { color: #111827; }
  .wall[data-theme="minimal"] .card__designation { color: #6b7280; font-size: 12px; }
  .wall[data-theme="minimal"] .card__avatar { background: #eef2ff; color: #4f46e5; }

  /* Dark — deep slate, glassy media, subtle glow */
  .wall[data-theme="dark"] {
    --wall-bg: radial-gradient(140% 120% at 20% -10%, #1c2440 0%, #0b0e18 55%, #12101f 100%);
  }
  .wall[data-theme="dark"] .wall__deco { color: #7c8cf8; }
  .wall[data-theme="dark"] .deco__orb--1 { background: radial-gradient(circle at 30% 30%, #6366f1, #312e81 70%); filter: blur(70px); opacity: 0.55; }
  .wall[data-theme="dark"] .deco__orb--2 { background: radial-gradient(circle at 60% 40%, #8b5cf6, #4c1d95 70%); filter: blur(80px); opacity: 0.4; }
  .wall[data-theme="dark"] .deco__orb--3 { display: none; }
  .wall[data-theme="dark"] .deco__quote { color: rgba(255,255,255,0.09); opacity: 1; }
  .wall[data-theme="dark"] .deco__dots { color: #6e7bd8; opacity: 0.18; }
  .wall[data-theme="dark"] .deco__spark { color: #a5b4fc; }
  .wall[data-theme="dark"] .deco__line { background: linear-gradient(90deg, transparent, rgba(165,180,252,0.25) 30%, rgba(165,180,252,0.25) 70%, transparent); }
  .wall[data-theme="dark"] .card__media {
    --vouch-media: linear-gradient(145deg,#1f2937,#111827 55%,#1e1b4b);
    border-radius: 14px;
  }
  .wall[data-theme="dark"] .card__media::after {
    content: ""; position: absolute; inset: 0; border-radius: inherit;
    box-shadow: 0 0 0 1px rgba(255,255,255,0.06), 0 24px 60px -24px rgba(0,0,0,0.7);
  }
  .wall[data-theme="dark"] .card__footer { background: #0f1115; border-radius: 14px; padding: 11px 13px; margin-top: 10px; }
  .wall[data-theme="dark"] .card__scrim { background: linear-gradient(to top, rgba(0,0,0,0.6), rgba(0,0,0,0) 60%); }
  .wall[data-theme="dark"] .card__play { background: rgba(255,255,255,0.14); backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.28); box-shadow: 0 8px 30px rgba(0,0,0,0.4); }
  .wall[data-theme="dark"] .card__play svg { color: #fff; }
  .wall[data-theme="dark"] .card:hover .card__media { transform: none; }
  .wall[data-theme="dark"] .card__name { color: #f9fafb; }
  .wall[data-theme="dark"] .card__designation { color: #9ca3af; font-size: 12px; }
  .wall[data-theme="dark"] .card__avatar { background: #1f2937; color: #e0e7ff; }
  .wall[data-theme="dark"] .wall__title { color: #f9fafb; }

  /* Gradient — bold vibrant tiles, glowing accents */
  .wall[data-theme="gradient"] {
    --wall-bg: linear-gradient(135deg, #4f46e5 0%, #7c3aed 42%, #db2777 100%);
  }
  .wall[data-theme="gradient"] .wall__deco { color: #fff; }
  .wall[data-theme="gradient"] .deco__orb--1 { background: radial-gradient(circle at 30% 30%, #f0abfc, #ec4899 70%); filter: blur(70px); opacity: 0.5; }
  .wall[data-theme="gradient"] .deco__orb--2 { background: radial-gradient(circle at 60% 40%, #a5b4fc, #6366f1 70%); filter: blur(80px); opacity: 0.5; }
  .wall[data-theme="gradient"] .deco__orb--3 { background: radial-gradient(circle at 50% 50%, #fda4af, #f43f5e 70%); opacity: 0.45; }
  .wall[data-theme="gradient"] .deco__quote { color: rgba(255,255,255,0.28); opacity: 0.9; }
  .wall[data-theme="gradient"] .deco__quote--3 { color: rgba(255,255,255,0.4); }
  .wall[data-theme="gradient"] .deco__dots { color: rgba(255,255,255,0.5); opacity: 0.2; }
  .wall[data-theme="gradient"] .deco__spark { color: #fde68a; }
  .wall[data-theme="gradient"] .deco__line { background: linear-gradient(90deg, transparent, rgba(255,255,255,0.35) 30%, rgba(255,255,255,0.35) 70%, transparent); }
  .wall[data-theme="gradient"] .wall__title { color: #fff; }
  .wall[data-theme="gradient"] .card__media {
    --vouch-media: linear-gradient(135deg,#6366f1 0%,#8b5cf6 50%,#ec4899 100%);
    border-radius: var(--vouch-radius);
  }
  .wall[data-theme="gradient"] .card__img { opacity: 0.9; mix-blend-mode: normal; }
  .wall[data-theme="gradient"] .card__scrim { background: linear-gradient(to top, rgba(67,0,110,0.55), rgba(67,0,110,0) 62%); }
  .wall[data-theme="gradient"] .card__play {
    background: #fff; color: #7c3aed;
  }
  .wall[data-theme="gradient"] .card__play svg { color: #7c3aed; }
  .wall[data-theme="gradient"] .card__footer { background: #fff; border-radius: 14px; padding: 12px 14px; margin-top: 10px; box-shadow: 0 18px 40px -20px rgba(124,58,237,0.35); border: 1px solid #f1eafe; }
  .wall[data-theme="gradient"] .card__name { color: #111827; }
  .wall[data-theme="gradient"] .card__designation { color: #7c6a9e; font-size: 12px; }
  .wall[data-theme="gradient"] .card__avatar { background: linear-gradient(135deg,#6366f1,#ec4899); color: #fff; }
  .wall[data-theme="gradient"] .card:hover .card__media { transform: translateY(-2px); box-shadow: 0 20px 50px -16px rgba(124,58,237,0.5); }

  /* Editorial — sophisticated, quiet luxury, serif name */
  .wall[data-theme="editorial"] {
    --vouch-media: linear-gradient(150deg,#fafafa,#f3f4f6);
    --vouch-focus: rgba(17,24,39,0.4);
    --wall-bg: linear-gradient(180deg, #fbfaf8 0%, #f5f3ef 100%);
    border: 1px solid rgba(17,24,39,0.06);
  }
  .wall[data-theme="editorial"] .wall__deco { color: #1f2937; }
  .wall[data-theme="editorial"] .deco__orb { display: none; }
  .wall[data-theme="editorial"] .deco__quote { color: #1f2937; opacity: 0.1; }
  .wall[data-theme="editorial"] .deco__quote--1 { font-size: clamp(110px, 13vw, 190px); top: -22px; left: 18px; }
  .wall[data-theme="editorial"] .deco__quote--2 { font-size: clamp(90px, 11vw, 160px); }
  .wall[data-theme="editorial"] .deco__quote--3 { display: none; }
  .wall[data-theme="editorial"] .deco__dots { color: #9ca3af; opacity: 0.3; }
  .wall[data-theme="editorial"] .deco__spark { display: none; }
  .wall[data-theme="editorial"] .deco__line { background: rgba(17,24,39,0.08); }
  .wall[data-theme="editorial"] .deco__line--h { top: 74%; }
  .wall[data-theme="editorial"] .deco__line--v { background: rgba(17,24,39,0.06); }
  .wall[data-theme="editorial"] .card__media { border-radius: 8px; }
  .wall[data-theme="editorial"] .card__scrim { background: linear-gradient(to top, rgba(8,8,12,0.28), rgba(8,8,12,0) 55%); }
  .wall[data-theme="editorial"] .card__play {
    width: 46px; height: 46px; background: rgba(255,255,255,0.9); color: #111827; box-shadow: none; border-radius: 50%;
  }
  .wall[data-theme="editorial"] .card__play svg { color: #111827; }
  .wall[data-theme="editorial"] .card__footer { display: flex; align-items: flex-start; flex-direction: column; padding: 14px 2px 2px; }
  .wall[data-theme="editorial"] .card__meta { margin-top: 2px; }
  .wall[data-theme="editorial"] .card__name {
    font-family: ui-serif, Georgia, Cambria, "Times New Roman", serif;
    font-size: 16.5px; font-weight: 600; letter-spacing: -0.01em; color: #111827;
  }
  .wall[data-theme="editorial"] .card__designation { color: #6b7280; font-size: 12px; letter-spacing: 0.02em; text-transform: uppercase; font-weight: 500; }
  .wall[data-theme="editorial"] .card__avatar { display: none; }
  .wall[data-theme="editorial"] .card__duration { right: auto; left: 12px; background: rgba(255,255,255,0.9); color: #111827; font-weight: 600; }

  @media (prefers-reduced-motion: reduce) {
    .card, .card__img, .card__play, .card__footer { transition: none !important; animation: none !important; }
    .deco__spark { animation: none !important; }
  }
</style>
</head>
<body>
  <main class="wall" data-theme="${theme}">
    <span class="wall__deco" aria-hidden="true">
      <span class="deco__orb deco__orb--1"></span>
      <span class="deco__orb deco__orb--2"></span>
      <span class="deco__orb deco__orb--3"></span>
      <span class="deco__quote deco__quote--1">&ldquo;</span>
      <span class="deco__quote deco__quote--2">&rdquo;</span>
      <span class="deco__quote deco__quote--3">&ldquo;</span>
      <span class="deco__dots"></span>
      <span class="deco__spark deco__spark--1">&#10022;</span>
      <span class="deco__spark deco__spark--2">&#10022;</span>
      <span class="deco__line deco__line--h"></span>
      <span class="deco__line deco__line--v"></span>
    </span>
    ${title}
    <div class="wall__items wall__items--${layout}">
      ${cards}
    </div>
  </main>
<script>
(function () {
  var PUBLIC_ID = ${publicIdJson};

  function postHeight() {
    window.parent.postMessage(
      { type: "vouch:resize", publicId: PUBLIC_ID, height: document.documentElement.scrollHeight },
      "*"
    );
  }

  if (typeof ResizeObserver !== "undefined") {
    new ResizeObserver(postHeight).observe(document.body);
  }
  window.addEventListener("load", postHeight);
  postHeight();

  document.querySelectorAll(".card").forEach(function (card) {
    card.addEventListener("click", function () {
      window.parent.postMessage(
        { type: "vouch:play", publicId: PUBLIC_ID, testimonialId: card.getAttribute("data-id") },
        "*"
      );
    });
  });
})();
</script>
</body>
</html>`;
};
