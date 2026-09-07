import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const Spinner = ({ className }: { className?: string }) => (
  <Loader2 className={cn("h-5 w-5 animate-spin text-brand-600", className)} aria-label="Loading" />
);

export const FullPageSpinner = () => (
  <div className="flex min-h-[50vh] items-center justify-center">
    <Spinner className="h-8 w-8" />
  </div>
);
