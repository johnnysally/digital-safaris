import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useAuth } from "../../context/authContext";
import Avatar from "../ui/Avatar";
import Dropdown from "../ui/Dropdown";
import { classNames, fullName } from "../../utils/helpers";
import { ROUTES } from "../../utils/constants";

interface HeaderProps {
  title?: string;
  breadcrumb?: Array<{ label: string; to?: string }>;
  onMenuClick?: () => void;
  onToggleSidebar?: () => void;
  sidebarCollapsed?: boolean;
  search?: ReactNode;
  notifications?: ReactNode;
}

export default function Header({
  title,
  breadcrumb,
  onMenuClick,
  onToggleSidebar,
  sidebarCollapsed,
  search,
  notifications,
}: HeaderProps) {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      navigate(ROUTES.LOGIN, { replace: true });
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-20 flex h-[4.5rem] shrink-0 items-center gap-3 border-b border-[#e9e2d8] bg-white/90 px-4 shadow-[0_3px_14px_rgba(45,35,24,.035)] backdrop-blur-xl sm:px-6">
      {onMenuClick && (
        <button
          type="button"
          onClick={onMenuClick}
          className="grid size-9 place-items-center rounded-xl border border-[#eee7dd] bg-[#fcfaf7] text-[#665744] transition hover:bg-[#f4ead9] lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="size-[18px]" />
        </button>
      )}

      {onToggleSidebar && (
        <button
          type="button"
          onClick={onToggleSidebar}
          className="hidden size-9 items-center justify-center rounded-xl border border-[#eee7dd] bg-[#fcfaf7] text-[#665744] transition hover:bg-[#f4ead9] lg:inline-flex"
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {sidebarCollapsed ? <PanelLeftOpen className="size-[17px]" /> : <PanelLeftClose className="size-[17px]" />}
        </button>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {breadcrumb && breadcrumb.length > 0 && (
          <nav className="mb-0.5 flex items-center gap-1 text-[10px] font-medium text-[#938777]">
            {breadcrumb.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <span>/</span>}
                <span
                  className={classNames(
                    crumb.to ? "cursor-pointer transition-colors hover:text-[#8f632d]" : "text-[#5b4b38]"
                  )}
                  onClick={() => crumb.to && navigate(crumb.to)}
                >
                  {crumb.label}
                </span>
              </span>
            ))}
          </nav>
        )}
        {title && (
          <h1 className="truncate text-[15px] font-semibold tracking-[-.01em] text-[#30281f]">
            {title}
          </h1>
        )}
      </div>

      {search && <div className="hidden md:block">{search}</div>}

      {notifications}

      <Dropdown
        align="right"
        trigger={
          <span className="flex items-center gap-2 rounded-xl border border-transparent p-1.5 transition hover:border-[#eee7dd] hover:bg-[#fcfaf7]">
            <Avatar
              src={admin?.avatar ?? undefined}
              fallback={fullName(admin?.firstName, admin?.lastName)}
              size="sm"
            />
          </span>
        }
        items={[
          {
            key: "profile",
            label: "Profile",
            onClick: () => navigate(ROUTES.PROFILE),
          },
          {
            key: "settings",
            label: "Settings",
            onClick: () => navigate(ROUTES.SETTINGS),
          },
          {
            key: "logout",
            label: loggingOut ? "Signing out…" : "Sign out",
            danger: true,
            disabled: loggingOut,
            onClick: handleLogout,
          },
        ]}
      />
    </header>
  );
}