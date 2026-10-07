import { useMemo, useState, type ReactNode } from "react";
import { Outlet } from "react-router-dom";
import Sidebar, { type SidebarGroup } from "./Sidebar";
import Header from "./Header";
import MobileNav from "./MobileNav";
import { useAuth } from "../../context/authContext";
import {
  hasPermission,
  PERMISSIONS,
  type Permission,
} from "../../utils/permissions";
import { ROUTES } from "../../utils/constants";
import storage from "../../utils/storage";

interface LayoutProps {
  title?: string;
  breadcrumb?: Array<{ label: string; to?: string }>;
  children?: ReactNode;
  search?: ReactNode;
  notifications?: ReactNode;
}

interface NavDef {
  label: string;
  to: string;
  end?: boolean;
  permission?: Permission;
}

interface GroupDef {
  title: string;
  items: NavDef[];
}

const NAV: GroupDef[] = [
  {
    title: "Main",
    items: [{ label: "Dashboard", to: ROUTES.DASHBOARD, end: true }],
  },
  {
    title: "Users",
    items: [
      { label: "Admins", to: ROUTES.ADMINS, permission: PERMISSIONS.ADMINS_VIEW },
      { label: "Customers", to: ROUTES.CUSTOMERS, permission: PERMISSIONS.CUSTOMERS_VIEW },
    ],
  },
  {
    title: "Partners",
    items: [{ label: "Partners", to: ROUTES.PARTNERS, permission: PERMISSIONS.PARTNERS_VIEW }],
  },
  {
    title: "Operations",
    items: [{ label: "Operations", to: ROUTES.OPERATIONS, permission: PERMISSIONS.OPERATIONS_VIEW }],
  },
  {
    title: "Finance",
    items: [
      { label: "Payments", to: ROUTES.PAYMENTS, permission: PERMISSIONS.PAYMENTS_VIEW },
      { label: "Payment Methods", to: ROUTES.PAYMENT_METHODS, permission: PERMISSIONS.PAYMENTS_VIEW },
      { label: "Wallets", to: ROUTES.WALLETS, permission: PERMISSIONS.WALLETS_VIEW },
      { label: "Disputes", to: ROUTES.DISPUTES, permission: PERMISSIONS.DISPUTES_VIEW },
      { label: "Reports", to: ROUTES.REPORTS, permission: PERMISSIONS.REPORTS_VIEW },
    ],
  },
  {
    title: "Communication",
    items: [{ label: "Contacts", to: ROUTES.CONTACTS, permission: PERMISSIONS.CONTACTS_VIEW }],
  },
  {
    title: "System",
    items: [
      { label: "Settings", to: ROUTES.SETTINGS, permission: PERMISSIONS.SETTINGS_VIEW },
      { label: "Backup", to: ROUTES.BACKUP, permission: PERMISSIONS.BACKUP_VIEW },
      { label: "Branding", to: ROUTES.BRANDING, permission: PERMISSIONS.BRANDING_VIEW },
      { label: "Health", to: ROUTES.HEALTH, permission: PERMISSIONS.SETTINGS_VIEW },
    ],
  },
];

export default function Layout({
  title,
  breadcrumb,
  children,
  search,
  notifications,
}: LayoutProps) {
  const { admin } = useAuth();
  const [collapsed, setCollapsed] = useState(storage.getSidebarCollapsed());
  const [mobileOpen, setMobileOpen] = useState(false);

  const groups: SidebarGroup[] = useMemo(
    () =>
      NAV.map((group) => ({
        title: group.title,
        items: group.items
          .filter(
            (item) => !item.permission || hasPermission(admin, item.permission)
          )
          .map(({ label, to, end }) => ({ label, to, end })),
      })).filter((group) => group.items.length > 0),
    [admin]
  );

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    storage.setSidebarCollapsed(next);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <div className="hidden lg:flex">
        <Sidebar groups={groups} collapsed={collapsed} />
      </div>

      <MobileNav
        isOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        groups={groups}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          title={title}
          breadcrumb={breadcrumb}
          onMenuClick={() => setMobileOpen(true)}
          onToggleSidebar={toggleCollapsed}
          sidebarCollapsed={collapsed}
          search={search}
          notifications={notifications}
        />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="mx-auto w-full max-w-7xl space-y-6">
            {children ?? <Outlet />}
          </div>
        </main>
      </div>
    </div>
  );
}