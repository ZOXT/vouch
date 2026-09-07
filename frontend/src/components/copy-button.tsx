import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { toast } from "sonner";

interface CopyButtonProps extends Omit<ButtonProps, "onClick" | "children"> {
  value: string;
  label?: string;
  copiedLabel?: string;
}

export const CopyButton = ({ value, label = "Copy", copiedLabel = "Copied", ...props }: CopyButtonProps) => {
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
    <Button variant="outline" size="sm" onClick={copy} {...props}>
      {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
      {copied ? copiedLabel : label}
    </Button>
  );
};
