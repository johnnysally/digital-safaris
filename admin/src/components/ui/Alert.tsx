import type { ReactNode } from "react";
import { classNames } from "../../utils/helpers";

type Variant = "success" | "warning" | "danger" | "info";

interface AlertProps {
  variant?: Variant;
  title?: string;
  children?: ReactNode;
  className?: string;
}

const VARIANTS: Record<Variant, string> = {
  success: "border-success/30 bg-success/10 text-success",
  warning: "border-warning/30 bg-warning/10 text-warning",
  danger: "border-danger/30 bg-danger/10 text-danger",
  info: "border-info/30 bg-info/10 text-info",
};

export default function Alert({
  variant = "info",
  title,
  children,
  className,
}: AlertProps) {
  return (
    <div
      role="alert"
      className={classNames(
        "rounded-md border p-3 text-sm",
        VARIANTS[variant],
        className
      )}
    >
      {title && <p className="font-medium">{title}</p>}
      {children && (
        <div className={classNames(title && "mt-0.5 text-xs opacity-90")}>
          {children}
        </div>
      )}
    </div>
  );
}