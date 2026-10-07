import { classNames, initials } from "../../utils/helpers";

type Size = "sm" | "md" | "lg";

interface AvatarProps {
  src?: string;
  fallback?: string;
  size?: Size;
  className?: string;
}

const SIZES: Record<Size, string> = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-base",
};

export default function Avatar({
  src,
  fallback,
  size = "md",
  className,
}: AvatarProps) {
  const label = fallback ? initials(fallback) : "?";
  return (
    <span
      className={classNames(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-800 font-medium text-white ring-1 ring-border",
        SIZES[size],
        className
      )}
    >
      {src ? (
        <img
          src={src}
          alt={fallback ?? "avatar"}
          className="h-full w-full object-cover"
        />
      ) : (
        label
      )}
    </span>
  );
}