import type { ReactNode } from "react";
import { classNames } from "../../utils/helpers";

interface CardProps {
  title?: string;
  actions?: ReactNode;
  padded?: boolean;
  className?: string;
  children: ReactNode;
}

export default function Card({
  title,
  actions,
  padded = true,
  className,
  children,
}: CardProps) {
  return (
    <div
      className={classNames(
        "rounded-lg border border-border bg-surface shadow-sm",
        className
      )}
    >
      {(title || actions) && (
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          {title && (
            <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
          )}
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={padded ? "p-4" : ""}>{children}</div>
    </div>
  );
}