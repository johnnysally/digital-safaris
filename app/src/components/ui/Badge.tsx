import type { ReactNode } from "react";
import { classNames } from "../../utils/helpers";

type Variant = "success" | "warning" | "danger" | "info" | "neutral" | "secondary";

interface BadgeProps {
  variant?: Variant;
  dot?: boolean;
  children: ReactNode;
}

const VARIANTS: Record<Variant, string> = {
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  danger: "bg-danger/10 text-danger",
  info: "bg-info/10 text-info",
  neutral: "bg-text-muted/10 text-text-muted",
  secondary: "bg-secondary-500/10 text-secondary-600",
};

export default function Badge({
  variant = "neutral",
  dot = false,
  children,
}: BadgeProps) {
  return (
    <span
      className={classNames(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
        VARIANTS[variant]
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}