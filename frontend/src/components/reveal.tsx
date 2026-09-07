import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface RevealProps {
  children: ReactNode;
  /** Delay in ms before the element animates in once visible. */
  delay?: number;
  /** Direction the element rises from. */
  from?: "up" | "left" | "right";
  className?: string;
}

/** Wraps content and fades/slides it in when scrolled into view. */
export const Reveal = ({ children, delay = 0, from = "up", className }: RevealProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const hiddenByDirection: Record<NonNullable<RevealProps["from"]>, string> = {
    up: "translate-y-6",
    left: "-translate-x-6",
    right: "translate-x-6",
  };

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={cn(
        "transition-all duration-700 ease-out will-change-transform",
        visible ? "opacity-100 translate-x-0 translate-y-0" : cn("opacity-0", hiddenByDirection[from]),
        className,
      )}
    >
      {children}
    </div>
  );
};