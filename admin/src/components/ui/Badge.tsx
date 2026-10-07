import type { ReactNode } from "react";
import { classNames } from "../../utils/helpers";

type Variant =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral"
  | "secondary";

interface BadgeProps {
  variant?: Variant;
  children: ReactNode;
  className?: string;
  dot?: boolean;
}

const VARIANTS: Record<Variant, string> = {
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  danger: "bg-danger/10 text-danger",
  info: "bg-info/10 text-info",
  neutral: "bg-neutral/10 text-neutral",
  secondary: "bg-secondary-500/10 text-secondary-600",
};

const DOTS: Record<Variant, string> = {
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  info: "bg-info",
  neutral: "bg-neutral",
  secondary: "bg-secondary-500",
};

export default function Badge({
  variant = "neutral",
  children,
  className,
  dot = true,
}: BadgeProps) {
  return (
    <span
      className={classNames(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
        VARIANTS[variant],
        className
      )}
    >
      {dot && (
        <span
          className={classNames("h-1.5 w-1.5 rounded-full", DOTS[variant])}
        />
      )}
      {children}
    </span>
  );
}