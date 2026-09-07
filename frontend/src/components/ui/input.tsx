import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type LabelHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const fieldStyles =
  "w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:cursor-not-allowed disabled:bg-gray-50";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn(fieldStyles, className)} {...props} />
  ),
);
Input.displayName = "Input";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea ref={ref} className={cn(fieldStyles, "min-h-[96px] resize-y", className)} {...props} />
  ),
);
Textarea.displayName = "Textarea";

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, ...props }, ref) => (
    <select ref={ref} className={cn(fieldStyles, "appearance-none pr-9 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%236b7280%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22%3E%3Cpath d=%22m6 9 6 6 6-6%22/%3E%3C/svg%3E')] bg-[position:right_0.7rem_center] bg-no-repeat", className)} {...props} />
  ),
);
Select.displayName = "Select";

export const Label = ({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) => (
  <label className={cn("mb-1.5 block text-sm font-medium text-gray-700", className)} {...props} />
);

export const FieldError = ({ message }: { message?: string }) =>
  message ? <p className="mt-1 text-xs text-red-600">{message}</p> : null;

export const FieldHint = ({ children }: { children: React.ReactNode }) => (
  <p className="mt-1 text-xs text-gray-500">{children}</p>
);
