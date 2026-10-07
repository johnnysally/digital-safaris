import { useEffect, type ReactNode } from "react";
import { classNames } from "../../utils/helpers";

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  side?: "left" | "right";
  title?: string;
  children: ReactNode;
  width?: string;
}

export default function Drawer({
  isOpen,
  onClose,
  side = "right",
  title,
  children,
  width = "w-80",
}: DrawerProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-primary-900/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <aside
        className={classNames(
          "absolute top-0 flex h-full flex-col border-border bg-surface shadow-lg",
          width,
          side === "right" ? "right-0 border-l" : "left-0 border-r"
        )}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="text-sm font-medium text-text-primary">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="text-text-muted hover:text-text-primary"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
      </aside>
    </div>
  );
}