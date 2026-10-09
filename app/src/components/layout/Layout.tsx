import { useMemo, useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar, { type SidebarGroup } from "./Sidebar";
import Header from "./Header";
import MobileNav from "./MobileNav";
import { ROUTES } from "../../utils/constants";

interface LayoutProps {
  title?: string;
  children?: React.ReactNode;
}

export default function Layout({ title, children }: LayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const groups: SidebarGroup[] = useMemo(
    () => [
      {
        title: "Explore",
        items: [
          { label: "Home", to: ROUTES.HOME, end: true, icon: "home" },
          { label: "Search", to: ROUTES.SEARCH, icon: "compass" },
          { label: "Accommodation", to: ROUTES.ACCOMMODATION, icon: "bed" },
          { label: "Restaurant", to: ROUTES.RESTAURANT, icon: "utensils" },
          { label: "Transport", to: ROUTES.TRANSPORT, icon: "car" },
          { label: "Concierge", to: ROUTES.AI_CONCIERGE, icon: "sparkles" },
        ],
      },
      {
        title: "Activity",
        items: [
          { label: "Bookings", to: ROUTES.BOOKING, icon: "calendar" },
          { label: "Orders", to: ROUTES.ORDER, icon: "shoppingBag" },
          { label: "Trips", to: ROUTES.TRIP, icon: "route" },
          { label: "Broadcasts", to: ROUTES.BROADCAST, icon: "radio" },
          { label: "Tracking", to: ROUTES.TRACKING, icon: "mapPin" },
        ],
      },
      {
        title: "Account",
        items: [
          { label: "Wallet", to: ROUTES.WALLET, icon: "wallet" },
          { label: "Payments", to: ROUTES.PAYMENT, icon: "creditCard" },
          { label: "Reviews", to: ROUTES.REVIEWS, icon: "star" },
          { label: "Notifications", to: ROUTES.NOTIFICATIONS, icon: "bell" },
          { label: "Profile", to: ROUTES.PROFILE, icon: "user" },
        ],
      },
    ],
    []
  );

  return (
    <div className="app-shell flex h-screen overflow-hidden bg-background">
      <Sidebar groups={groups} />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header title={title} onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="mx-auto w-full max-w-5xl space-y-6">
            {children ?? <Outlet />}
          </div>
        </main>
      </div>

      <MobileNav
        isOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        groups={groups}
      />
    </div>
  );
}