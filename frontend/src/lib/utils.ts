import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export const formatDate = (value: string | Date | null | undefined): string => {
  if (!value) return "–";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const formatDuration = (seconds: number | null | undefined): string => {
  if (seconds == null || !Number.isFinite(seconds)) return "–";
  const total = Math.round(seconds);
  const minutes = Math.floor(total / 60);
  const secs = total % 60;
  return `${minutes}:${String(secs).padStart(2, "0")}`;
};

export const initialsOf = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("") || "?";

export const truncate = (value: string, length: number): string =>
  value.length > length ? `${value.slice(0, length - 1)}…` : value;
