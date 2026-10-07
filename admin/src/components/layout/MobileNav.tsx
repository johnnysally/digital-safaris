import { useEffect } from "react";
import Sidebar, { type SidebarGroup } from "./Sidebar";

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  groups: SidebarGroup[];
  footer?: React.ReactNode;
}

export default function MobileNav({
  isOpen,
  onClose,
  groups,
  footer,
}: MobileNavProps) {
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
    <div className="fixed inset-0 z-50 lg:hidden">
      <div
        className="absolute inset-0 bg-primary-900/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div className="absolute left-0 top-0 h-full">
        <Sidebar groups={groups} onNavigate={onClose} footer={footer} />
      </div>
    </div>
  );
}