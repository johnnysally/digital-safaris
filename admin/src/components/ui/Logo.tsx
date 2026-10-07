import { useBranding } from "../../context/brandingContext";
import { classNames } from "../../utils/helpers";

type Size = "sm" | "md" | "lg" | "xl";
type Variant = "default" | "light" | "dark";

interface LogoProps {
  size?: Size;
  variant?: Variant;
  showText?: boolean;
  text?: string;
  fallbackText?: string;
  className?: string;
  onClick?: () => void;
}

const SIZES: Record<Size, { box: string; img: string; text: string }> = {
  sm: { box: "h-8 w-8 text-xs", img: "h-10", text: "text-sm" },
  md: { box: "h-10 w-10 text-sm", img: "h-14", text: "text-base" },
  lg: { box: "h-12 w-12 text-base", img: "h-20", text: "text-lg" },
  xl: { box: "h-16 w-16 text-lg", img: "h-28", text: "text-xl" },
};

function initialsOf(value: string): string {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "DS";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export default function Logo({
  size = "md",
  variant = "default",
  showText = false,
  text,
  fallbackText = "Digital Safaris",
  className,
  onClick,
}: LogoProps) {
  const { branding } = useBranding();
  const s = SIZES[size];

  const logoSrc = branding?.logoUrl || branding?.logo;
  const label = text ?? branding?.metaTitle ?? fallbackText;
  const badge = initialsOf(fallbackText);

  const markBg =
    variant === "light"
      ? "bg-white"
      : variant === "dark"
        ? "bg-primary-800"
        : "bg-transparent";

  const textColor =
    variant === "light" ? "text-white" : "text-text-primary";

  const content = (
    <span
      className={classNames(
        "inline-flex items-center gap-2",
        onClick && "cursor-pointer",
        className
      )}
    >
      {logoSrc ? (
        <span
          className={classNames(
            "inline-flex items-center justify-center rounded-md",
            variant !== "default" && "px-2 py-1",
            markBg
          )}
        >
          <img
            src={logoSrc}
            alt={fallbackText}
            className={classNames("w-auto object-contain", s.img)}
          />
        </span>
      ) : (
        <span
          className={classNames(
            "flex shrink-0 items-center justify-center rounded-md font-bold",
            variant === "light"
              ? "bg-white text-primary-800"
              : "bg-primary-800 text-white",
            s.box
          )}
        >
          {badge}
        </span>
      )}
      {showText && (
        <span
          className={classNames("font-semibold", textColor, s.text)}
        >
          {label}
        </span>
      )}
    </span>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="inline-flex">
        {content}
      </button>
    );
  }
  return content;
}