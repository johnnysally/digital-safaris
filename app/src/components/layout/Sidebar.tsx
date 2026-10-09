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
    <aside
      className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-white/10 bg-[#21170f] text-white lg:flex"
      style={{
        backgroundImage:
          "linear-gradient(180deg,rgba(30,20,13,.97) 0%,rgba(34,22,13,.91) 42%,rgba(31,19,11,.72) 100%),url('/hero-bg.jpg')",
        backgroundPosition: "center, center bottom",
        backgroundSize: "cover",
      }}
    >
      <div className="flex h-20 shrink-0 items-center border-b border-white/10 px-5">
        <Link to="/" className="flex items-center gap-2.5">
          <img
            src={logoUrl}
            alt={appName}
            className="h-9 w-9 rounded-md object-contain"
          />
          <span className="text-base font-semibold text-white">
            {appName}
          </span>
        </Link>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4 scrollbar-thin">
        {groups.map((group) => (
          <div key={group.title}>
            {group.title && (
              <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-[#e3c9a2]/70">
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
                            ? "bg-[#a75f1b] text-white shadow-sm"
                            : "text-white/80 hover:bg-white/10 hover:text-white"
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
                                  : "text-white/60 group-hover:text-white"
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

      <div className="shrink-0 border-t border-white/10 px-5 py-4">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-[#efb348]">
          Kenya Awaits
        </p>
        <p className="mt-1 text-xs text-white/65">
          Your journey, one platform.
        </p>
      </div>
    </aside>
  );
}