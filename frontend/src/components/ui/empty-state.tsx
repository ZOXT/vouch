import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState = ({ icon: Icon, title, description, action, className }: EmptyStateProps) => (
  <div className={cn("flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center", className)}>
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50">
      <Icon className="h-6 w-6 text-brand-600" aria-hidden />
    </div>
    <h3 className="mt-4 text-base font-semibold text-gray-900">{title}</h3>
    {description && <p className="mt-1.5 max-w-sm text-sm text-gray-500">{description}</p>}
    {action && <div className="mt-6">{action}</div>}
  </div>
);
