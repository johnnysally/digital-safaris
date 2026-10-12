import { useMemo, useState, type ReactNode } from "react";
import { Outlet } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  Calendar,
  CreditCard,
  Database,
  LayoutGrid,
  Paintbrush,
  Settings,
  Store,
  TrendingUp,
  Users,
  UserRound,
  Wallet,
} from "lucide-react";
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
  icon: ReactNode;
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
    items: [
      {
        label: "Dashboard",
        to: ROUTES.DASHBOARD,
        icon: <LayoutGrid size={18} />,
        end: true,
      },
    ],
  },
  {
    title: "Users",
    items: [
      {
        label: "Admins",
        to: ROUTES.ADMINS,
        icon: <Users size={18} />,
        permission: PERMISSIONS.ADMINS_VIEW,
      },
      {
        label: "Customers",
        to: ROUTES.CUSTOMERS,
        icon: <Users size={18} />,
        permission: PERMISSIONS.CUSTOMERS_VIEW,
      },
    ],
  },
  {
    title: "Partners",
    items: [
      {
        label: "Partners",
        to: ROUTES.PARTNERS,
        icon: <Store size={18} />,
        permission: PERMISSIONS.PARTNERS_VIEW,
      },
    ],
  },
  {
    title: "Operations",
    items: [
      {
        label: "Operations",
        to: ROUTES.OPERATIONS,
        icon: <Calendar size={18} />,
        permission: PERMISSIONS.OPERATIONS_VIEW,
      },
    ],
  },
  {
    title: "Finance",
    items: [
      {
        label: "Payments",
        to: ROUTES.PAYMENTS,
        icon: <CreditCard size={18} />,
        permission: PERMISSIONS.PAYMENTS_VIEW,
      },
      {
        label: "Payment Methods",
        to: ROUTES.PAYMENT_METHODS,
        icon: <CreditCard size={18} />,
        permission: PERMISSIONS.PAYMENTS_VIEW,
      },
      {
        label: "Wallets",
        to: ROUTES.WALLETS,
        icon: <Wallet size={18} />,
        permission: PERMISSIONS.WALLETS_VIEW,
      },
      {
        label: "Disputes",
        to: ROUTES.DISPUTES,
        icon: <AlertTriangle size={18} />,
        permission: PERMISSIONS.DISPUTES_VIEW,
      },
      {
        label: "Reports",
        to: ROUTES.REPORTS,
        icon: <TrendingUp size={18} />,
        permission: PERMISSIONS.REPORTS_VIEW,
      },
    ],
  },
  {
    title: "Communication",
    items: [
      {
        label: "Contacts",
        to: ROUTES.CONTACTS,
        icon: <Users size={18} />,
        permission: PERMISSIONS.CONTACTS_VIEW,
      },
    ],
  },
  {
    title: "System",
    items: [
      {
        label: "My profile",
        to: ROUTES.PROFILE,
        icon: <UserRound size={18} />,
      },
      {
        label: "Settings",
        to: ROUTES.SETTINGS,
        icon: <Settings size={18} />,
        permission: PERMISSIONS.SETTINGS_VIEW,
      },
      {
        label: "Backup",
        to: ROUTES.BACKUP,
        icon: <Database size={18} />,
        permission: PERMISSIONS.BACKUP_VIEW,
      },
      {
        label: "Branding",
        to: ROUTES.BRANDING,
        icon: <Paintbrush size={18} />,
        permission: PERMISSIONS.BRANDING_VIEW,
      },
      {
        label: "Health",
        to: ROUTES.HEALTH,
        icon: <Activity size={18} />,
        permission: PERMISSIONS.SETTINGS_VIEW,
      },
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
          .map(({ label, to, icon, end }) => ({ label, to, icon, end })),
      })).filter((group) => group.items.length > 0),
    [admin]
  );

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    storage.setSidebarCollapsed(next);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#f5f2ed]">
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
        <main className="flex-1 overflow-y-auto bg-[radial-gradient(ellipse_at_100%_0%,rgba(197,138,59,.07),transparent_34rem)] p-4 sm:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-[1600px] space-y-6">
            {children ?? <Outlet />}
          </div>
        </main>
      </div>
    </div>
  );
}