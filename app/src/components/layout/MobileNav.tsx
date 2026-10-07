import { NavLink } from "react-router-dom";
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

interface NavItem {
  label: string;
  to: string;
  end?: boolean;
  icon?: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  groups: NavGroup[];
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

export default function MobileNav({
  isOpen,
  onClose,
  groups,
}: MobileNavProps) {
  const { branding } = useBranding();
  const appName =
    branding.metaTitle?.split("—")[0]?.trim() || "Digital Safaris";
  const logoUrl = branding.logoUrl || branding.logo || "/logo.svg";

  return (
    <div
      className={classNames(
        "fixed inset-0 z-[900] lg:hidden",
        isOpen ? "pointer-events-auto" : "pointer-events-none"
      )}
    >
      <div
        className={classNames(
          "absolute inset-0 bg-black/50 transition-opacity",
          isOpen ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
      />

      <aside
        className={classNames(
          "absolute left-0 top-0 h-full w-72 bg-secondary-50 shadow-xl transition-transform",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-20 items-center justify-between border-b border-secondary-500/20 px-5">
          <div className="flex items-center gap-2.5">
            <img
              src={logoUrl}
              alt={appName}
              className="h-9 w-9 rounded-md object-contain"
            />
            <span className="text-base font-semibold text-primary-800">
              {appName}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-primary-800/60 hover:bg-secondary-100"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <nav className="h-[calc(100%-80px)] space-y-6 overflow-y-auto px-3 py-4">
          {groups.map((group) => (
            <div key={group.title}>
              {group.title && (
                <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-primary-800/50">
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
                        onClick={onClose}
                        className={({ isActive }) =>
                          classNames(
                            "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                            isActive
                              ? "bg-secondary-500 text-white"
                              : "text-primary-800/80 hover:bg-secondary-100 hover:text-primary-900"
                          )
                        }
                      >
                        {Icon && <Icon className="h-[18px] w-[18px] shrink-0" />}
                        <span className="flex-1 truncate">{item.label}</span>
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
    </div>
  );
}