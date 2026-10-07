import { useEffect, useRef, useState, type ReactNode } from "react";
import { classNames } from "../../utils/helpers";

interface DropdownItem {
  key: string;
  label: string;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}

interface DropdownProps {
  trigger: ReactNode;
  items: DropdownItem[];
  align?: "left" | "right";
}

export default function Dropdown({
  trigger,
  items,
  align = "right",
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex"
      >
        {trigger}
      </button>
      {open && (
        <div
          className={classNames(
            "absolute z-50 mt-1 min-w-[160px] rounded-md border border-border bg-surface py-1 shadow-lg",
            align === "right" ? "right-0" : "left-0"
          )}
        >
          {items.map((item) => (
            <button
              key={item.key}
              type="button"
              disabled={item.disabled}
              onClick={() => {
                if (item.disabled) return;
                setOpen(false);
                item.onClick();
              }}
              className={classNames(
                "block w-full px-3 py-2 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                item.danger
                  ? "text-danger hover:bg-danger/10"
                  : "text-text-primary hover:bg-surface-alt"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}