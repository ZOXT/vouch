import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface CopyButtonProps extends Omit<ButtonProps, "onClick" | "children"> {
  value: string;
  label?: string;
  copiedLabel?: string;
  /** Icon-only square button with an accessible label (no text). */
  iconOnly?: boolean;
}

export const CopyButton = ({
  value,
  label = "Copy",
  copiedLabel = "Copied",
  iconOnly = false,
  className,
  ...props
}: CopyButtonProps) => {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // Clipboard API unavailable (insecure context), fallback
      const textarea = document.createElement("textarea");
      textarea.value = value;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }
    setCopied(true);
    toast.success(`${copiedLabel} to clipboard`);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={copy}
      aria-label={copied ? copiedLabel : label}
      title={label}
      className={cn(iconOnly && "h-8 w-8 shrink-0 rounded-full px-0", className)}
      {...props}
    >
      {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
      {!iconOnly && (copied ? copiedLabel : label)}
    </Button>
  );
};
