import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export const DialogContent = ({
  className,
  children,
  ...props
}: DialogPrimitive.DialogContentProps) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-gray-950/50 backdrop-blur-sm data-[state=open]:animate-fade-in" />
    <DialogPrimitive.Content
      className={cn(
        "fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-gray-200 bg-white p-6 shadow-lifted",
        "data-[state=open]:animate-slide-up focus:outline-none",
        className,
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500" aria-label="Close">
        <X className="h-4 w-4" />
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
);

export const DialogTitle = ({ className, ...props }: DialogPrimitive.DialogTitleProps) => (
  <DialogPrimitive.Title className={cn("text-lg font-semibold text-gray-900", className)} {...props} />
);

export const DialogDescription = ({ className, ...props }: DialogPrimitive.DialogDescriptionProps) => (
  <DialogPrimitive.Description className={cn("mt-1 text-sm text-gray-500", className)} {...props} />
);
