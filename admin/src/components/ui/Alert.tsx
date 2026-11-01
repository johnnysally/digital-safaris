import type { ReactNode } from "react";
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from "lucide-react";
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

const ICONS = {
  success: CheckCircle2,
  warning: TriangleAlert,
  danger: AlertCircle,
  info: Info,
};

export default function Alert({
  variant = "info",
  title,
  children,
  className,
}: AlertProps) {
  const Icon = ICONS[variant];

  return (
    <div
      role={variant === "danger" ? "alert" : "status"}
      aria-live={variant === "danger" ? "assertive" : "polite"}
      className={classNames(
        "flex items-start gap-3 rounded-lg border px-4 py-3.5 text-sm shadow-sm",
        VARIANTS[variant],
        className
      )}
    >
      <Icon aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
      <div className="min-w-0">
        {title && <p className="m-0 font-semibold leading-5">{title}</p>}
        {children && (
          <div className={classNames("text-sm leading-relaxed opacity-90", title && "mt-1")}>
            {children}
          </div>
        )}
      </div>
    </div>
  );
}