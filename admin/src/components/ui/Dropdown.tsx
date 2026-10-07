import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { classNames } from "../../utils/helpers";

export interface DropdownItem {
  key: string;
  label: string;
  onClick: () => void;
  danger?: boolean;
  icon?: ReactNode;
  disabled?: boolean;
}

interface DropdownProps {
  trigger: ReactNode;
  items: DropdownItem[];
  align?: "left" | "right";
}

interface Coords {
  top: number;
  left: number;
}

const MENU_WIDTH = 200;

export default function Dropdown({
  trigger,
  items,
  align = "right",
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<Coords | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const computeCoords = () => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const estimatedHeight = items.length * 40 + 8;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openAbove = spaceBelow < estimatedHeight + 8;

    const left =
      align === "right"
        ? rect.right - MENU_WIDTH
        : rect.left;

    const top = openAbove
      ? rect.top - estimatedHeight - 4
      : rect.bottom + 4;

    setCoords({
      top: Math.max(8, top),
      left: Math.min(
        Math.max(8, left),
        window.innerWidth - MENU_WIDTH - 8
      ),
    });
  };

  useLayoutEffect(() => {
    if (open) computeCoords();
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onScrollOrResize = () => computeCoords();
    const onMouseDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t)) return;
      if (menuRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <div ref={triggerRef} className="inline-block">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex"
        >
          {trigger}
        </button>
      </div>

      {open &&
        coords &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={{
              position: "fixed",
              top: coords.top,
              left: coords.left,
              width: MENU_WIDTH,
              zIndex: 9999,
            }}
            className="rounded-md border border-border bg-surface py-1 shadow-lg"
          >
            {items.map((item) => (
              <button
                key={item.key}
                type="button"
                role="menuitem"
                disabled={item.disabled}
                onClick={() => {
                  if (item.disabled) return;
                  item.onClick();
                  setOpen(false);
                }}
                className={classNames(
                  "flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-surface-alt",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                  item.danger ? "text-danger" : "text-text-primary"
                )}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>,
          document.body
        )}
    </>
  );
}