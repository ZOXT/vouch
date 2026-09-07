/**
 * API origin used ONLY for absolute links to backend-served assets (embed
 * iframe URLs and the embed snippet). Empty string means same-origin, which
 * is also how production works behind a reverse proxy.
 */
export const API_ORIGIN: string = import.meta.env.VITE_API_ORIGIN ?? "";

/**
 * API calls always go to the relative /api/v1 path: the Vite dev server
 * proxies it to the backend (keeping cookies same-origin), and production
 * serves the API on the same domain via reverse proxy. This is what keeps
 * us free of CORS issues.
 */
export const API_BASE: string = import.meta.env.VITE_API_BASE ?? "/api/v1";

/**
 * Paddle client configuration. VITE_PADDLE_ENV defaults to sandbox; the client
 * token is validated (and fails loudly with a descriptive message) when the
 * pricing page actually needs it.
 */
export const PADDLE_ENV: "sandbox" | "production" =
  (import.meta.env.VITE_PADDLE_ENV as "sandbox" | "production" | undefined) ?? "sandbox";

export const PADDLE_CLIENT_TOKEN: string = import.meta.env.VITE_PADDLE_CLIENT_TOKEN ?? "";
