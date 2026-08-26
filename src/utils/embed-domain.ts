import { ApiError } from "./ApiError";

const hostnameFromValue = (value: string) => {
  try {
    return new URL(value.includes("://") ? value : `https://${value}`)
      .hostname.toLowerCase();
  } catch {
    return null;
  }
};

export const normalizeAllowedDomains = (domains: string[]) => {
  const normalized = domains.map((domain) => domain.trim().toLowerCase());

  for (const domain of normalized) {
    const host = domain.startsWith("*.")
      ? hostnameFromValue(domain.slice(2))
      : hostnameFromValue(domain);
    if (!host) {
      throw new ApiError(400, `Invalid allowed domain: ${domain}`);
    }
  }

  return [...new Set(normalized)];
};

export const isEmbedOriginAllowed = (origin: string, allowedDomains: string[]) => {
  if (allowedDomains.length === 0) return true;

  const hostname = hostnameFromValue(origin);
  if (!hostname) return false;

  return allowedDomains.some((domain) => {
    if (domain.startsWith("*.")) {
      return hostname.endsWith(`.${domain.slice(2)}`);
    }
    return hostname === hostnameFromValue(domain);
  });
};
