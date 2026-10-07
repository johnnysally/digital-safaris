import { useEffect, type ReactNode } from "react";

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  side?: "left" | "right";
  width?: string;
  children: ReactNode;
}

export default function Drawer({
  isOpen,
  onClose,
  title,
  side = "right",
  width = "w-full max-w-md",
  children,
}: DrawerProps) {
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
    <div className="fixed inset-0 z-[1000]">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={`absolute top-0 ${side}-0 h-full ${width} bg-surface shadow-xl`}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
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
        <div className="h-[calc(100%-56px)] overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}