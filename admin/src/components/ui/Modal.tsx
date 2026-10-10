import { useEffect, type ReactNode } from "react";
import { classNames } from "../../utils/helpers";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: "sm" | "md" | "lg";
  footer?: ReactNode;
  children: ReactNode;
}

const SIZES = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-2xl",
};

export default function Modal({
  isOpen,
  onClose,
  title,
  size = "md",
  footer,
  children,
}: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        className={classNames(
          "relative z-10 flex max-h-[90vh] w-full flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-xl",
          SIZES[size]
        )}
      >
        {title && (
          <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-3">
            <h3 className="text-base font-semibold text-text-primary">
              {title}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="rounded p-1 text-text-muted hover:bg-surface-alt"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto p-5 scrollbar-thin">
          {children}
        </div>

        {footer && (
          <div className="flex shrink-0 justify-end gap-2 border-t border-border bg-surface px-5 py-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}