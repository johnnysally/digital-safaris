import { useEffect, useRef, useState, type RefObject } from "react";
import { ChevronLeft, ChevronRight, LifeBuoy, LogOut, X } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { accommodationNavigation } from "../../config/accommodationNavigation";
import { PartnerLogo } from "../brand/PartnerLogo";
import authApi from "../../api/accommodation/authApi";
import { getApiErrorMessage } from "../../api/axios";
import { useAuth } from "../../context/authContext";
import { useToast } from "../../context/toastContext";
import { partnerImages } from "../../config/partnerImages";

interface AccommodationSidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
  closeButtonRef: RefObject<HTMLButtonElement>;
  menuButtonRef: RefObject<HTMLButtonElement>;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

export function AccommodationSidebar({
  mobileOpen,
  onClose,
  closeButtonRef,
  menuButtonRef,
  collapsed,
  onToggleCollapsed,
}: AccommodationSidebarProps) {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { showToast } = useToast();
  const wasMobileOpen = useRef(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 760px)");
    const updateViewport = () => setIsMobileViewport(mediaQuery.matches);
    updateViewport();
    mediaQuery.addEventListener("change", updateViewport);
    return () => mediaQuery.removeEventListener("change", updateViewport);
  }, []);

  useEffect(() => {
    if (!isMobileViewport) return;
    if (mobileOpen) {
      closeButtonRef.current?.focus();
    } else if (wasMobileOpen.current) {
      menuButtonRef.current?.focus();
    }
    wasMobileOpen.current = mobileOpen;

    if (!mobileOpen) return;

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
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeButtonRef, isMobileViewport, menuButtonRef, mobileOpen, onClose]);

  async function handleSignOut() {
    try {
      await authApi.logout();
    } catch (requestError) {
      showToast(getApiErrorMessage(requestError, "Unable to complete sign out with the server."), "error");
      return;
    }
    signOut("accommodation");
    navigate("/partner/accommodation/login", { replace: true });
  }

  return (
    <aside
      id="accommodation-sidebar"
      aria-label="Accommodation partner sidebar"
      aria-hidden={isMobileViewport && !mobileOpen}
      className={`fixed inset-y-0 left-0 z-50 flex h-[100dvh] ${collapsed ? "w-[76px]" : "w-[255px]"} flex-col overflow-hidden border-r border-white/10 bg-[#21170f] text-white shadow-[8px_0_28px_rgba(21,13,8,.18)] transition-[width,transform] duration-200 ease-out motion-reduce:transition-none max-[1024px]:w-[220px] max-[760px]:w-[min(300px,85vw)] ${
        mobileOpen
          ? "max-[760px]:visible max-[760px]:translate-x-0"
          : "max-[760px]:invisible max-[760px]:-translate-x-full"
      }`}
      style={{
        backgroundImage: `linear-gradient(180deg, rgba(33,23,15,.99) 0%, rgba(37,24,14,.97) 34%, rgba(37,24,14,.83) 62%, rgba(27,18,11,.62) 100%), url('${partnerImages.shared.sidebarBackground}')`,
        backgroundSize: "cover",
        backgroundPosition: "center bottom",
      }}
    >
      <div className={`relative flex h-[120px] shrink-0 items-center justify-center border-b border-white/10 ${collapsed ? "px-2" : "px-5"}`}>
        {collapsed ? (
          <span className="grid size-10 place-items-center rounded-xl border border-[#dda344]/35 bg-[#dda344]/10 font-serif text-sm font-bold tracking-tight text-white" aria-label="DigitalSafaris">
            D<span className="text-[#e7a12a]">S</span>
          </span>
        ) : <PartnerLogo variant="accommodation-sidebar" />}
        <button
          type="button"
          onClick={onToggleCollapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-pressed={collapsed}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="absolute -bottom-3 right-3 z-10 hidden size-6 items-center justify-center rounded-full border border-[#60452c] bg-[#342316] text-[#f2d9af] shadow-md transition hover:bg-[#9b5b17] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f2bf70] min-[1025px]:flex"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      <button
        ref={closeButtonRef}
        type="button"
        onClick={onClose}
        aria-label="Close navigation menu"
        className="absolute right-3 top-3 hidden size-9 items-center justify-center rounded-lg border border-white/10 bg-white/[.07] text-white hover:bg-white/[.13] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e8aa4c] max-[760px]:flex"
      >
        <X size={18} aria-hidden="true" />
      </button>

      <nav
        aria-label="Accommodation navigation"
        className={`min-h-0 flex-1 overflow-y-auto overscroll-contain py-5 [scrollbar-color:rgba(255,255,255,.25)_transparent] [scrollbar-width:thin] ${collapsed ? "px-3" : "px-[18px]"}`}
      >
        {!collapsed ? <p className="mb-3 mt-0 px-3 text-[9px] font-bold uppercase tracking-[.18em] text-[#d5b98e]/65">Workspace</p> : null}
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {accommodationNavigation.map(({ label, to, icon: Icon }) => (
            <li key={label}>
              <NavLink
                to={to}
                end={to === "/partner/accommodation/dashboard"}
                onClick={onClose}
                title={collapsed ? label : undefined}
                aria-label={collapsed ? label : undefined}
                className={({ isActive }) =>
                  `group relative flex min-h-12 items-center gap-3 rounded-[10px] ${collapsed ? "justify-center px-0" : "px-3.5"} text-[14px] font-medium tracking-[.005em] no-underline transition-colors duration-200 motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f2bf70] ${
                    isActive
                      ? "bg-[#9b5b17] text-white"
                      : "bg-transparent text-white/90 hover:bg-white/[.09] hover:text-white"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon size={19} strokeWidth={1.9} aria-hidden="true" />
                    {!collapsed ? <span className="min-w-0 flex-1">{label}</span> : null}
                    {isActive ? <span className="sr-only">Current page</span> : null}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className={`shrink-0 border-t border-white/10 py-4 ${collapsed ? "px-3" : "px-[18px]"}`}>
        {!collapsed ? (
          <NavLink
            to="/partner/accommodation/support"
            onClick={onClose}
            className="mb-3 flex items-center gap-3 rounded-[10px] border border-white/10 bg-black/10 px-3 py-2.5 text-[11px] font-medium text-white/80 no-underline transition hover:bg-white/[.08] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f2bf70]"
          >
            <LifeBuoy size={16} />
            <span>Need a hand? <strong className="ml-1 text-[#f2c779]">Get support</strong></span>
          </NavLink>
        ) : null}
        <button
          type="button"
          onClick={handleSignOut}
          title={collapsed ? "Sign out" : undefined}
          aria-label={collapsed ? "Sign out" : undefined}
          className={`flex min-h-11 w-full items-center gap-3 rounded-[10px] border-0 bg-white/[.07] ${collapsed ? "justify-center px-0" : "px-3.5"} text-left text-[13px] font-medium text-white/85 transition-colors duration-200 hover:bg-white/[.12] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f2bf70] motion-reduce:transition-none`}
        >
          <LogOut size={18} strokeWidth={1.9} aria-hidden="true" />
          {!collapsed ? "Sign out" : null}
        </button>
      </div>
    </aside>
  );
}
