import { API_BASE } from "../config";
import type { ApiEnvelope, User } from "./types";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** Broadcast when the session can no longer be refreshed. */
export const AUTH_EXPIRED_EVENT = "vouch:auth-expired";

let refreshPromise: Promise<User | null> | null = null;

/**
 * Rotates the access token from the httpOnly refresh cookie, returning the
 * refreshed user. Single-flight: concurrent callers (StrictMode bootstrap,
 * parallel 401 retries) share one POST so the backend's rotating cookie is
 * never hit twice with the same token.
 */
export const refreshSession = (): Promise<User | null> => {
  refreshPromise ??= (async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) return null;
      const text = await res.text();
      if (!text) return null;
      const envelope = JSON.parse(text) as ApiEnvelope<{ user: User }>;
      return envelope.data?.user ?? null;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

const parseErrorMessage = async (res: Response): Promise<string> => {
  try {
    const body = (await res.json()) as { message?: string; error?: string };
    if (body?.message) return body.message;
    if (body?.error) return body.error;
  } catch {
    // non-JSON error body
  }
  return `Request failed (${res.status})`;
};

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  /** Skip the 401→refresh→retry cycle (used by auth endpoints themselves). */
  skipAuthRetry?: boolean;
}

/**
 * Central API client: JSON handling, credentials, error normalization, and
 * single-flight token refresh with one retry of the original request.
 */
export async function apiFetch<T>(
  path: string,
  { body, headers, skipAuthRetry, ...init }: RequestOptions = {},
  allowRetry = true,
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: {
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    ...init,
  });

  if (res.status === 401 && !skipAuthRetry && allowRetry) {
    const refreshedUser = await refreshSession();
    if (refreshedUser) {
      return apiFetch<T>(path, { body, headers, skipAuthRetry, ...init }, false);
    }
    window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
    throw new ApiError(401, "Your session has expired. Please sign in again.");
  }

  if (!res.ok) {
    throw new ApiError(res.status, await parseErrorMessage(res));
  }

  // Some endpoints (e.g. logout) return no envelope; treat empty as null.
  const text = await res.text();
  if (!text) return null as T;

  const envelope = JSON.parse(text) as ApiEnvelope<T> | T;
  if (
    envelope !== null &&
    typeof envelope === "object" &&
    "data" in envelope &&
    "statusCode" in envelope
  ) {
    return (envelope as ApiEnvelope<T>).data;
  }
  return envelope as T;
}
