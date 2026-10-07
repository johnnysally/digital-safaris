import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/authContext";
import { useTheme } from "../../context/themeContext";
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
  const { theme, toggleTheme } = useTheme();
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
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border bg-surface px-4">
      {onMenuClick && (
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-md p-2 text-text-secondary hover:bg-surface-alt lg:hidden"
          aria-label="Open menu"
        >
          ☰
        </button>
      )}

      {onToggleSidebar && (
        <button
          type="button"
          onClick={onToggleSidebar}
          className="hidden rounded-md p-2 text-text-secondary hover:bg-surface-alt lg:inline-flex"
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {sidebarCollapsed ? "»" : "«"}
        </button>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {breadcrumb && breadcrumb.length > 0 && (
          <nav className="flex items-center gap-1 text-xs text-text-muted">
            {breadcrumb.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <span>/</span>}
                <span
                  className={classNames(
                    crumb.to ? "cursor-pointer hover:text-text-primary" : ""
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
          <h1 className="truncate text-base font-semibold text-text-primary">
            {title}
          </h1>
        )}
      </div>

      {search && <div className="hidden md:block">{search}</div>}

      <button
        type="button"
        onClick={toggleTheme}
        className="rounded-md p-2 text-text-secondary hover:bg-surface-alt"
        aria-label="Toggle theme"
        title={theme === "dark" ? "Switch to light" : "Switch to dark"}
      >
        {theme === "dark" ? "☀" : "☾"}
      </button>

      {notifications}

      <Dropdown
        align="right"
        trigger={
          <span className="flex items-center gap-2 rounded-md p-1 hover:bg-surface-alt">
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
            onClick: () => navigate(ROUTES.SETTINGS),
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