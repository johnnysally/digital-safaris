import { NavLink, Link } from "react-router-dom";
import {
  Home,
  Compass,
  Bed,
  Utensils,
  Car,
  Sparkles,
  Calendar,
  ShoppingBag,
  Route,
  Radio,
  MapPin,
  Wallet,
  CreditCard,
  Star,
  Bell,
  User,
} from "lucide-react";
import { classNames } from "../../utils/helpers";
import { useBranding } from "../../context/brandingContext";

interface SidebarItem {
  label: string;
  to: string;
  end?: boolean;
  icon?: string;
}

export interface SidebarGroup {
  title: string;
  items: SidebarItem[];
}

interface SidebarProps {
  groups: SidebarGroup[];
}

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  home: Home,
  compass: Compass,
  bed: Bed,
  utensils: Utensils,
  car: Car,
  sparkles: Sparkles,
  calendar: Calendar,
  shoppingBag: ShoppingBag,
  route: Route,
  radio: Radio,
  mapPin: MapPin,
  wallet: Wallet,
  creditCard: CreditCard,
  star: Star,
  bell: Bell,
  user: User,
};

export default function Sidebar({ groups }: SidebarProps) {
  const { branding } = useBranding();
  const appName =
    branding.metaTitle?.split("—")[0]?.trim() || "Digital Safaris";
  const logoUrl = branding.logoUrl || branding.logo || "/logo.svg";

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-surface lg:flex">
      <div className="flex h-20 shrink-0 items-center border-b border-border px-5">
        <Link to="/" className="flex items-center gap-2.5">
          <img
            src={logoUrl}
            alt={appName}
            className="h-9 w-9 rounded-md object-contain"
          />
          <span className="text-base font-semibold text-text-primary">
            {appName}
          </span>
        </Link>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4 scrollbar-thin">
        {groups.map((group) => (
          <div key={group.title}>
            {group.title && (
              <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                {group.title}
              </p>
            )}
            <ul className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon ? ICONS[item.icon] : null;
                return (
                  <li key={`${item.to}-${item.label}`}>
                    <NavLink
                      to={item.to}
                      end={item.end}
                      className={({ isActive }) =>
                        classNames(
                          "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-secondary-500 text-white shadow-sm"
                            : "text-text-secondary hover:bg-surface-alt hover:text-text-primary"
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {Icon && (
                            <Icon
                              className={classNames(
                                "h-[18px] w-[18px] shrink-0",
                                isActive
                                  ? "text-white"
                                  : "text-text-muted group-hover:text-text-primary"
                              )}
                            />
                          )}
                          <span className="flex-1 truncate">{item.label}</span>
                        </>
                      )}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-border px-5 py-4">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-secondary-600">
          Kenya Awaits
        </p>
        <p className="mt-1 text-xs text-text-muted">
          Your journey, one platform.
        </p>
      </div>
    </aside>
  );
}