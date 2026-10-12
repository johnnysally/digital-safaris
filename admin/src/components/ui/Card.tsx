import type { ReactNode } from "react";
import { classNames } from "../../utils/helpers";

interface CardProps {
  title?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  padded?: boolean;
}

export default function Card({
  title,
  actions,
  children,
  className,
  padded = true,
}: CardProps) {
  return (
    <div
      className={classNames(
        "overflow-hidden rounded-xl border border-border bg-surface shadow-[0_4px_18px_rgba(32,25,17,.045)] transition-shadow duration-200 hover:shadow-[0_8px_26px_rgba(32,25,17,.075)]",
        className
      )}
    >
      {(title || actions) && (
        <div className="flex min-h-14 items-center justify-between gap-3 border-b border-border bg-surface-alt/45 px-4 py-3 sm:px-5">
          {title && (
            <h3 className="text-sm font-semibold tracking-[-.01em] text-text-primary">{title}</h3>
          )}
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={padded ? "p-4 sm:p-5" : undefined}>{children}</div>
    </div>
  );
}