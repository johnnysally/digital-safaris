import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
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
  icon?: ReactNode;
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
  footer?: ReactNode;
}

export default function Sidebar({
  groups,
  collapsed = false,
  onNavigate,
  footer,
}: SidebarProps) {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {}
  );
  const { admin } = useAuth();
  const { branding } = useBranding();
  const name = fullName(admin?.firstName, admin?.lastName) || "Admin";
  const role = roleName(admin) ?? "—";
  const systemName = branding?.metaTitle?.split("—")[0]?.trim() || "Digital Safaris";

  return (
    <aside
      className={classNames(
        "relative flex h-full flex-col overflow-hidden bg-[#211b16] text-[#eee5d8] shadow-[8px_0_30px_rgba(39,29,19,.08)] transition-[width] duration-200",
        collapsed ? "w-[4.5rem]" : "w-[17rem]"
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_0%_0%,rgba(184,126,61,.2),transparent_38%),linear-gradient(180deg,rgba(255,255,255,.025),transparent_38%)]" />
      <div
        className={classNames(
          "relative flex h-[4.5rem] shrink-0 items-center gap-3 border-b border-white/10",
          collapsed ? "justify-center px-2" : "px-5"
        )}
      >
        <span
          className={classNames(
            "flex items-center justify-center rounded-xl bg-white shadow-[0_4px_12px_rgba(0,0,0,.12)]",
            collapsed ? "size-10 p-1" : "size-10 px-2"
          )}
        >
          <Logo size="sm" showText={false} />
        </span>
        {!collapsed && (
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold tracking-wide text-white">{systemName}</span>
            <span className="mt-0.5 block text-[9px] font-semibold uppercase tracking-[.2em] text-[#c49a68]">Admin workspace</span>
          </span>
        )}
      </div>

      <nav
        aria-label="Admin navigation"
        className={classNames("relative flex-1 space-y-5 overflow-y-auto py-5", collapsed ? "px-2" : "px-3")}
      >
        {groups.map((group) => (
          <div className="space-y-1" key={group.title}>
            {collapsed && (
              <div className="mx-auto mb-3 mt-1 h-px w-6 bg-white/15" />
            )}
            {!collapsed && (
              <button
                type="button"
                aria-expanded={expandedGroups[group.title] !== false}
                onClick={() =>
                  setExpandedGroups((previous) => ({
                    ...previous,
                    [group.title]: previous[group.title] === false,
                  }))
                }
                className="mb-2 flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-left text-[10px] font-bold uppercase tracking-[.16em] text-[#a99b88] transition-colors hover:text-[#f0c987] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a25c]"
              >
                {group.title}
                <ChevronDown
                  aria-hidden="true"
                  size={14}
                  className={classNames(
                    "transition-transform duration-200",
                    expandedGroups[group.title] === false && "-rotate-90"
                  )}
                />
              </button>
            )}
            {(collapsed || expandedGroups[group.title] !== false) && (
              <ul className="space-y-1.5">
                {group.items.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.end}
                      onClick={onNavigate}
                      title={collapsed ? item.label : undefined}
                      aria-label={collapsed ? item.label : undefined}
                      className={({ isActive }) =>
                        classNames(
                          "group relative flex min-h-10 items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a25c]",
                          collapsed && "justify-center px-0",
                          isActive
                            ? "bg-[#c58a3b]/15 text-[#f5c477] shadow-[inset_2px_0_0_#e7b865]"
                            : "text-[#d4cabb] hover:bg-white/[.07] hover:text-white"
                        )
                      }
                    >
                      {item.icon && (
                        <span className="flex size-5 shrink-0 items-center justify-center text-[#b7a58e] group-hover:text-[#f2d39b] [&_svg]:size-[17px]">
                          {item.icon}
                        </span>
                      )}
                      {!collapsed && (
                        <>
                          <span className="flex-1 truncate">{item.label}</span>
                          {item.badge !== undefined && (
                            <span className="rounded-full bg-[#d4a25c]/20 px-2 py-0.5 text-[10px] font-semibold text-[#f0c987]">
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </nav>

      {footer}

      <div
        className={classNames(
          "relative shrink-0 border-t border-white/10 bg-black/10",
          collapsed ? "flex justify-center p-3" : "p-4"
        )}
      >
        {collapsed ? (
          <Avatar
            src={admin?.avatar ?? undefined}
            fallback={name}
            size="sm"
          />
        ) : (
          <div className="flex items-center gap-3 rounded-xl border border-white/[.07] bg-white/[.04] px-2.5 py-2">
            <Avatar
              src={admin?.avatar ?? undefined}
              fallback={name}
              size="sm"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-white">
                {name}
              </p>
              <p className="mt-0.5 truncate text-[10px] text-[#b9a78f]">{role}</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}