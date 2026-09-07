import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";

export const Switch = ({ className, ...props }: SwitchPrimitive.SwitchProps) => (
  <SwitchPrimitive.Root
    className={cn(
      "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors",
      "bg-gray-200 data-[state=checked]:bg-brand-600",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2",
      "disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    {...props}
  >
    <SwitchPrimitive.Thumb className="pointer-events-none block h-5 w-5 translate-x-0 rounded-full bg-white shadow ring-0 transition-transform data-[state=checked]:translate-x-5" />
  </SwitchPrimitive.Root>
);
