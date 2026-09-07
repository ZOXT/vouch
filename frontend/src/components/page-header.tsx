import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export const PageHeader = ({ title, description, actions, className }: PageHeaderProps) => (
  <div className={cn("mb-8 flex flex-wrap items-start justify-between gap-4", className)}>
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-gray-900">{title}</h1>
      {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
    </div>
    {actions && <div className="flex items-center gap-3">{actions}</div>}
  </div>
);
