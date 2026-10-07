import { classNames } from "../../utils/helpers";

type Size = "sm" | "md" | "lg";

interface AvatarProps {
  src?: string;
  fallback?: string;
  size?: Size;
}

const SIZES: Record<Size, string> = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-base",
};

const initials = (name?: string) => {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || "")
    .join("");
};

export default function Avatar({ src, fallback, size = "md" }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={fallback || "Avatar"}
        className={classNames("rounded-full object-cover", SIZES[size])}
      />
    );
  }
  return (
    <span
      className={classNames(
        "inline-flex items-center justify-center rounded-full bg-primary-100 font-semibold text-primary-800",
        SIZES[size]
      )}
    >
      {initials(fallback)}
    </span>
  );
}