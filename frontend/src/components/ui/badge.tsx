import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Tone = "gray" | "green" | "amber" | "red" | "brand" | "blue";

const tones: Record<Tone, string> = {
  gray: "bg-gray-100 text-gray-700 ring-gray-200",
  green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  amber: "bg-amber-50 text-amber-700 ring-amber-200",
  red: "bg-red-50 text-red-700 ring-red-200",
  brand: "bg-brand-50 text-brand-700 ring-brand-200",
  blue: "bg-sky-50 text-sky-700 ring-sky-200",
};

export const Badge = ({
  className,
  tone = "gray",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) => (
  <span
    className={cn(
      "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
      tones[tone],
      className,
    )}
    {...props}
  />
);
