import * as DropdownPrimitive from "@radix-ui/react-dropdown-menu";
import { cn } from "@/lib/utils";

export const DropdownMenu = DropdownPrimitive.Root;
export const DropdownMenuTrigger = DropdownPrimitive.Trigger;

export const DropdownMenuContent = ({
  className,
  sideOffset = 6,
  ...props
}: DropdownPrimitive.DropdownMenuContentProps) => (
  <DropdownPrimitive.Portal>
    <DropdownPrimitive.Content
      sideOffset={sideOffset}
      className={cn(
        "z-50 min-w-[10rem] rounded-xl border border-gray-200 bg-white p-1.5 shadow-lifted",
        "data-[state=open]:animate-fade-in",
        className,
      )}
      {...props}
    />
  </DropdownPrimitive.Portal>
);

export const DropdownMenuItem = ({
  className,
  ...props
}: DropdownPrimitive.DropdownMenuItemProps) => (
  <DropdownPrimitive.Item
    className={cn(
      "flex cursor-pointer select-none items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none transition-colors",
      "data-[highlighted]:bg-gray-100 data-[highlighted]:text-gray-900",
      className,
    )}
    {...props}
  />
);

export const DropdownMenuSeparator = ({ className, ...props }: DropdownPrimitive.DropdownMenuSeparatorProps) => (
  <DropdownPrimitive.Separator className={cn("my-1 h-px bg-gray-100", className)} {...props} />
);

export const DropdownMenuLabel = ({ className, ...props }: DropdownPrimitive.DropdownMenuLabelProps) => (
  <DropdownPrimitive.Label className={cn("px-3 py-1.5 text-xs font-medium text-gray-500", className)} {...props} />
);
