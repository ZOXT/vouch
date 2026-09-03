import { Request, Response } from "express";
import { env } from "../config/env";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import { getFrameAncestors } from "../utils/embed-domain";
import {
  getEmbedCaptionsText,
  getEmbedPlayerData,
  getEmbedWallData,
} from "../services/embed-page.service";
import { renderEmbedWall } from "../views/embed-wall.view";
import { renderEmbedPlayer } from "../views/embed-player.view";

const getRouteParam = (value: string | string[] | undefined, name: string) => {
  if (!value || Array.isArray(value)) {
    throw new ApiError(400, `Valid embed ${name} is required`);
  }
  return value;
};

/**
 * Helmet sets X-Frame-Options: SAMEORIGIN globally, which would block the
 * iframe embed. Embed pages replace it with a CSP frame-ancestors policy
 * built from the embed's allowed domains (empty list = any site may frame).
 */
const setFrameHeaders = (res: Response, allowedDomains: string[]) => {
  res.removeHeader("X-Frame-Options");
  res.setHeader(
    "Content-Security-Policy",
    `frame-ancestors ${getFrameAncestors(allowedDomains)}`,
  );
};

export const serveEmbedWall = asyncHandler(async (req: Request, res: Response) => {
  const publicId = getRouteParam(req.params.publicId, "ID");
  const data = await getEmbedWallData(publicId);

  setFrameHeaders(res, data.allowedDomains);
  res.setHeader("Cache-Control", "public, max-age=60");
  res.status(200).type("html").send(renderEmbedWall(data));
});

export const serveEmbedPlayer = asyncHandler(async (req: Request, res: Response) => {
  const publicId = getRouteParam(req.params.publicId, "ID");
  const testimonialId = getRouteParam(req.params.testimonialId, "testimonial ID");
  const data = await getEmbedPlayerData(publicId, testimonialId);

  setFrameHeaders(res, data.allowedDomains);
  res.setHeader("Cache-Control", "public, max-age=60");
  res.status(200).type("html").send(renderEmbedPlayer(data));
});

export const serveEmbedCaptions = asyncHandler(async (req: Request, res: Response) => {
  const publicId = getRouteParam(req.params.publicId, "ID");
  const testimonialId = getRouteParam(req.params.testimonialId, "testimonial ID");
  const vtt = await getEmbedCaptionsText(publicId, testimonialId);

  res.setHeader("Cache-Control", "public, max-age=3600");
  res.status(200).type("text/vtt").send(vtt);
});

const LOADER_SCRIPT = `(function () {
  var API_BASE = ${JSON.stringify(env.APP_URL || "http://localhost:3000")};
  var ORIGIN = new URL(API_BASE).origin;

  var frames = [];
  var lightbox = null;
  var previousOverflow = "";
  var previousFocus = null;

  function injectFrame(container) {
    if (container.getAttribute("data-vouch-loaded") === "true") return;

    var publicId = container.getAttribute("data-vouch-id");
    if (!publicId) return;

    container.setAttribute("data-vouch-loaded", "true");

    var iframe = document.createElement("iframe");
    iframe.src = API_BASE + "/embed/" + encodeURIComponent(publicId);
    iframe.title = "Testimonials";
    iframe.setAttribute("allow", "autoplay; fullscreen");
    iframe.setAttribute("loading", "lazy");
    iframe.setAttribute("scrolling", "no");
    iframe.setAttribute("allowtransparency", "true");
    iframe.style.cssText =
      "width:100%;border:0;display:block;overflow:hidden;background:transparent;";

    container.appendChild(iframe);
    frames.push(iframe);
  }

  function scan() {
    document.querySelectorAll("[data-vouch-id]").forEach(injectFrame);
  }

  function closeLightbox() {
    if (!lightbox) return;
    document.removeEventListener("keydown", lightbox.onKeydown, true);
    lightbox.overlay.remove();
    document.body.style.overflow = previousOverflow;
    if (previousFocus && previousFocus.focus) previousFocus.focus();
    lightbox = null;
  }

  function openLightbox(publicId, testimonialId) {
    if (lightbox) closeLightbox();
    previousFocus = document.activeElement;

    var overlay = document.createElement("div");
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "Video testimonial");
    overlay.style.cssText =
      "position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;" +
      "background:rgba(8,8,12,0.72);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);" +
      "opacity:0;transition:opacity 0.22s ease;";

    var box = document.createElement("div");
    box.style.cssText =
      "position:relative;width:min(92vw,960px,calc(86vh * 16 / 9));aspect-ratio:16/9;" +
      "border-radius:14px;overflow:hidden;background:#000;" +
      "box-shadow:0 24px 80px rgba(0,0,0,0.55);transform:translateY(10px) scale(0.98);" +
      "transition:transform 0.25s ease;";

    var frame = document.createElement("iframe");
    frame.src =
      API_BASE +
      "/embed/" +
      encodeURIComponent(publicId) +
      "/player/" +
      encodeURIComponent(testimonialId);
    frame.title = "Video testimonial player";
    frame.setAttribute("allow", "autoplay; fullscreen");
    frame.allowFullscreen = true;
    frame.style.cssText = "width:100%;height:100%;border:0;display:block;";

    var close = document.createElement("button");
    close.type = "button";
    close.setAttribute("aria-label", "Close video");
    close.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" width="18" height="18"><path d="M5 5l14 14M19 5L5 19"/></svg>';
    close.style.cssText =
      "position:absolute;top:12px;right:12px;width:36px;height:36px;border-radius:50%;border:0;cursor:pointer;" +
      "display:flex;align-items:center;justify-content:center;color:#fff;" +
      "background:rgba(20,20,24,0.55);transition:background 0.15s ease;z-index:2;";
    close.onmouseenter = function () { close.style.background = "rgba(20,20,24,0.85)"; };
    close.onmouseleave = function () { close.style.background = "rgba(20,20,24,0.55)"; };

    box.appendChild(frame);
    box.appendChild(close);
    overlay.appendChild(box);
    document.body.appendChild(overlay);

    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    var onKeydown = function (event) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeLightbox();
      }
    };

    close.addEventListener("click", closeLightbox);
    overlay.addEventListener("click", function (event) {
      if (event.target === overlay) closeLightbox();
    });
    document.addEventListener("keydown", onKeydown, true);

    lightbox = { overlay: overlay, onKeydown: onKeydown };

    requestAnimationFrame(function () {
      overlay.style.opacity = "1";
      box.style.transform = "none";
    });
    close.focus();
  }

  window.addEventListener("message", function (event) {
    if (event.origin !== ORIGIN) return;

    var data = event.data;
    if (!data || typeof data !== "object") return;

    if (data.type === "vouch:resize") {
      var height = Number(data.height);
      if (!isFinite(height) || height < 0) return;
      frames.forEach(function (iframe) {
        if (iframe.contentWindow === event.source) {
          iframe.style.height = Math.min(height, 10000) + "px";
        }
      });
    } else if (data.type === "vouch:play") {
      if (typeof data.publicId === "string" && typeof data.testimonialId === "string") {
        openLightbox(data.publicId, data.testimonialId);
      }
    } else if (data.type === "vouch:close") {
      closeLightbox();
    }
  });

  scan();

  if (typeof MutationObserver !== "undefined") {
    new MutationObserver(scan).observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  }
})();`;

export const serveEmbedLoader = asyncHandler(async (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "application/javascript");
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  res.send(LOADER_SCRIPT);
});
