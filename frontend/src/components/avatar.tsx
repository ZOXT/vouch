import { useState } from "react";
import { cn, initialsOf } from "@/lib/utils";

interface AvatarProps {
  src?: string | null;
  name: string;
  className?: string;
}

/**
 * Avatar/logo with an initials fallback. Shows the image when present AND
 * loadable; swaps to the subject's initials on a missing source or a broken
 * image (so an empty circle never renders).
 */
export const Avatar = ({ src, name, className }: AvatarProps) => {
  const [failed, setFailed] = useState(false);
  const hasImage = Boolean(src) && !failed;

  return (
    <span className={cn("flex shrink-0 items-center justify-center overflow-hidden", className)}>
      {hasImage ? (
        <img
          src={src ?? undefined}
          alt=""
          loading="lazy"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        initialsOf(name || "?")
      )}
    </span>
  );
};