import { NavLink } from "react-router-dom";
import { classNames, fullName } from "../../utils/helpers";
import { useAuth } from "../../context/authContext";
import { roleName } from "../../utils/permissions";
import { useBranding } from "../../context/brandingContext";
import Logo from "../ui/Logo";
import Avatar from "../ui/Avatar";

export interface SidebarItem {
  label: string;
  to: string;
  icon?: React.ReactNode;
  badge?: number | string;
  end?: boolean;
}

export interface SidebarGroup {
  title: string;
  items: SidebarItem[];
}

interface SidebarProps {
  groups: SidebarGroup[];
  collapsed?: boolean;
  onNavigate?: () => void;
}

export default function Sidebar({
  groups,
  collapsed = false,
  onNavigate,
}: SidebarProps) {
  const { admin } = useAuth();
  const { branding } = useBranding();
  const name = fullName(admin?.firstName, admin?.lastName) || "Admin";
  const role = roleName(admin) ?? "—";
  const systemName = branding?.metaTitle?.split("—")[0]?.trim() || "Digital Safaris";

  return (
    <aside
      className={classNames(
        "flex h-full flex-col bg-primary-800 text-primary-200 transition-all duration-200",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div
        className={classNames(
          "flex h-16 shrink-0 items-center gap-2 border-b border-primary-600",
          collapsed ? "justify-center px-2" : "px-3"
        )}
      >
        <span
          className={classNames(
            "flex items-center justify-center rounded-md bg-white",
            collapsed ? "h-9 w-9 p-1" : "h-9 px-2"
          )}
        >
          <Logo size="sm" showText={false} />
        </span>
        {!collapsed && (
          <span className="truncate text-sm font-semibold text-white">
            {systemName}
          </span>
        )}
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
        {groups.map((group) => (
          <div key={group.title}>
            {!collapsed && (
              <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-primary-400">
                {group.title}
              </p>
            )}
            {collapsed && (
              <div className="mx-auto mb-2 h-px w-6 bg-primary-600" />
            )}
            <ul className="space-y-1">
              {group.items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    onClick={onNavigate}
                    title={collapsed ? item.label : undefined}
                    className={({ isActive }) =>
                      classNames(
                        "group flex items-center gap-3 rounded-md px-2.5 py-2 text-sm transition-colors",
                        collapsed && "justify-center px-0",
                        isActive
                          ? "bg-secondary-500/10 text-secondary-500"
                          : "text-primary-200 hover:bg-primary-700/60 hover:text-white"
                      )
                    }
                  >
                    {item.icon && (
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center">
                        {item.icon}
                      </span>
                    )}
                    {!collapsed && (
                      <>
                        <span className="flex-1 truncate">{item.label}</span>
                        {item.badge !== undefined && (
                          <span className="rounded-full bg-secondary-500/20 px-1.5 py-0.5 text-xs text-secondary-500">
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div
        className={classNames(
          "shrink-0 border-t border-primary-600",
          collapsed ? "flex justify-center p-3" : "p-3"
        )}
      >
        {collapsed ? (
          <Avatar
            src={admin?.avatar ?? undefined}
            fallback={name}
            size="sm"
          />
        ) : (
          <div className="flex items-center gap-3 rounded-md px-1 py-1">
            <Avatar
              src={admin?.avatar ?? undefined}
              fallback={name}
              size="sm"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">
                {name}
              </p>
              <p className="truncate text-xs text-primary-300">{role}</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}