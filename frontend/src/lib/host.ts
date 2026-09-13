/**
 * The SPA ships as ONE bundle served on both the marketing apex (e.g.
 * tryvouch.me) and the app subdomain (app.tryvouch.me). This keeps each host
 * canonical: public marketing pages live on the apex, everything else
 * (auth, dashboard, submission, welcome) lives on app.*.
 */

export const MARKETING_PATHS = ["/", "/pricing", "/privacy"];

const APP_HOST_PREFIX = "app.";

const isLocalDev = (host: string): boolean =>
  host === "localhost" ||
  host.endsWith(".local") ||
  host.startsWith("127.") ||
  host.startsWith("192.168.") ||
  host.startsWith("10.");

export interface CanonicalLocation {
  pathname: string;
  search?: string;
}

/**
 * Returns the canonical URL to redirect to, or null when the current host and
 * path are already canonical. The current route may be passed explicitly so
 * the caller can enforce the canonical host on client-side navigations (the
 * browser URL does not change during router transitions).
 */
export const canonicalHostRedirect = (current?: CanonicalLocation): string | null => {
  const { hostname, pathname: winPathname, search: winSearch } = window.location;
  const pathname = current?.pathname ?? winPathname;
  const search = current?.search ?? winSearch;
  const host = hostname.toLowerCase();

  if (isLocalDev(host)) return null;

  if (host.startsWith(APP_HOST_PREFIX)) {
    const base = host.slice(APP_HOST_PREFIX.length);
    // Only the bare landing root belongs on the apex.
    if (pathname === "/" || pathname === "/index.html") {
      return `https://${base}/`;
    }
    return null;
  }

  // Marketing apex host: bounce anything that isn't a marketing page to app.*.
  const isMarketingPath = MARKETING_PATHS.some(
    (p) => pathname === p || pathname === `${p}/`,
  );
  if (!isMarketingPath) {
    return `https://${APP_HOST_PREFIX}${host}${pathname}${search}`;
  }
  return null;
};