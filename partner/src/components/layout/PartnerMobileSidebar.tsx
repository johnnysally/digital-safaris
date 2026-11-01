import { useEffect, useRef, type RefObject } from "react";
import { NavLink } from "react-router-dom";
import { LogOut, X, type LucideIcon } from "lucide-react";
import { PartnerLogo } from "../brand/PartnerLogo";
import { partnerImages } from "../../config/partnerImages";

export interface PartnerMobileNavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  badge?: number;
}

interface PartnerMobileSidebarProps {
  open: boolean;
  onClose: () => void;
  onSignOut: () => void;
  menuButtonRef: RefObject<HTMLButtonElement>;
  sidebarId: string;
  workspace: string;
  items: PartnerMobileNavItem[];
}

export function PartnerMobileSidebar({
  open,
  onClose,
  onSignOut,
  menuButtonRef,
  sidebarId,
  workspace,
  items,
}: PartnerMobileSidebarProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") return;
      const sidebar = closeButtonRef.current?.closest("aside");
      const focusable = sidebar?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable?.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      menuButtonRef.current?.focus();
    };
  }, [menuButtonRef, onClose, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] max-[760px]:block min-[761px]:hidden">
      <button
        type="button"
        aria-label="Close navigation menu"
        onClick={onClose}
        className="absolute inset-0 h-full w-full border-0 bg-black/55 p-0"
      />
      <aside
        id={sidebarId}
        role="dialog"
        aria-modal="true"
        aria-label={`${workspace} partner navigation`}
        className="absolute inset-y-0 left-0 flex h-[100dvh] w-[min(300px,85vw)] flex-col overflow-hidden border-r border-white/10 bg-[#21170f] text-white shadow-[8px_0_28px_rgba(21,13,8,.18)]"
        style={{
          backgroundImage: `linear-gradient(180deg,rgba(33,23,15,.99) 0%,rgba(37,24,14,.97) 34%,rgba(37,24,14,.83) 62%,rgba(27,18,11,.62) 100%),url('${partnerImages.shared.sidebarBackground}')`,
          backgroundSize: "cover",
          backgroundPosition: "center bottom",
        }}
      >
        <div className="relative flex h-[120px] shrink-0 items-center justify-center border-b border-white/10 px-5">
          <PartnerLogo variant="accommodation-sidebar" />
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close navigation menu"
            className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-lg border border-white/10 bg-white/[.07] text-white hover:bg-white/[.13] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e8aa4c]"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <nav
          aria-label={`${workspace} navigation`}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-[18px] py-5 [scrollbar-color:rgba(255,255,255,.25)_transparent] [scrollbar-width:thin]"
        >
          <p className="mb-3 mt-0 px-3 text-[9px] font-bold uppercase tracking-[.18em] text-[#d5b98e]/65">
            Workspace
          </p>
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {items.map(({ label, to, icon: Icon, badge }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={label === "Dashboard"}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `group flex min-h-12 items-center gap-3 rounded-[10px] px-3.5 text-[14px] font-medium no-underline transition-colors ${
                      isActive
                        ? "bg-[#9b5b17] text-white"
                        : "text-white/90 hover:bg-white/[.09] hover:text-white"
                    }`
                  }
                >
                  <Icon size={19} strokeWidth={1.9} aria-hidden="true" />
                  <span className="min-w-0 flex-1">{label}</span>
                  {badge ? (
                    <span className="rounded-full bg-[#d44b35] px-2 py-0.5 text-[10px] font-bold text-white">
                      {badge}
                    </span>
                  ) : null}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="shrink-0 border-t border-white/10 px-[18px] py-4">
          <button
            type="button"
            onClick={onSignOut}
            className="flex min-h-11 w-full items-center gap-3 rounded-[10px] border-0 bg-white/[.07] px-3.5 text-left text-[13px] font-medium text-white/85 transition-colors hover:bg-white/[.12] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f2bf70]"
          >
            <LogOut size={18} strokeWidth={1.9} aria-hidden="true" />
            Sign out
          </button>
        </div>
      </aside>
    </div>
  );
}