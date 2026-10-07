import { Link } from "react-router-dom";
import { Menu, Search, Bell, Sun, Moon } from "lucide-react";
import { useAuth } from "../../context/authContext";
import { useTheme } from "../../context/themeContext";
import { useBranding } from "../../context/brandingContext";
import { ROUTES } from "../../utils/constants";
import Avatar from "../ui/Avatar";

interface HeaderProps {
  title?: string;
  onMenuClick?: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { customer } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { branding } = useBranding();

  const appName =
    branding.metaTitle?.split("—")[0]?.trim() || "Digital Safaris";
  const logoUrl = branding.logoUrl || branding.logo || "/logo.svg";

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-md p-2 text-text-muted hover:bg-surface-alt lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <Link to="/" className="lg:hidden">
          <img
            src={logoUrl}
            alt={appName}
            className="h-8 w-8 rounded-md object-contain"
          />
        </Link>

        <div className="hidden flex-1 items-center md:flex">
          <div className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search destinations, experiences, or services..."
              className="w-full rounded-full border border-border bg-surface-alt py-2.5 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus:border-secondary-500 focus:outline-none focus:ring-2 focus:ring-secondary-500/30"
            />
          </div>
        </div>

        <div className="flex-1 md:hidden" />

        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            className="rounded-md p-2 text-text-muted hover:bg-surface-alt"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </button>

          <Link
            to={ROUTES.NOTIFICATIONS}
            className="relative rounded-md p-2 text-text-muted hover:bg-surface-alt"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-secondary-500" />
          </Link>

          {customer ? (
            <Link
              to={ROUTES.PROFILE}
              className="ml-1 flex items-center gap-2 rounded-full pl-1 pr-3 py-1 hover:bg-surface-alt"
            >
              <Avatar
                src={customer.avatar ?? undefined}
                fallback={`${customer.firstName} ${customer.lastName}`}
                size="sm"
              />
              <span className="hidden text-xs sm:block">
                <span className="block text-text-muted">Good morning,</span>
                <span className="block font-medium text-text-primary">
                  {customer.firstName}
                </span>
              </span>
            </Link>
          ) : (
            <Link
              to={ROUTES.LOGIN}
              className="rounded-md bg-secondary-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-secondary-600"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}