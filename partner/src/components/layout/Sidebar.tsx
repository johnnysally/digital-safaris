import { BarChart3, BedDouble, Building2, CalendarDays, CreditCard, HelpCircle, House, LogOut, MessageSquareText, Mountain, Settings, Star, Users } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import authApi from "../../api/accommodation/authApi";
import storage from "../../utils/storage";

const navItems = [
  { label: "Dashboard", to: "/partner/accommodation/dashboard", icon: House },
  { label: "My Property", to: "/partner/accommodation/properties", icon: Building2 },
  { label: "Rooms", to: "/partner/accommodation/rooms", icon: BedDouble },
  { label: "Bookings", to: "/partner/accommodation/bookings", icon: Users },
  { label: "Availability", to: "/partner/accommodation/availability", icon: CalendarDays },
  { label: "Messages", to: "/partner/accommodation/messages", icon: MessageSquareText },
  { label: "Reviews", to: "/partner/accommodation/reviews", icon: Star },
  { label: "Payments", to: "/partner/accommodation/payments", icon: CreditCard },
  { label: "Reports", to: "/partner/accommodation/reports", icon: BarChart3 },
  { label: "Help & Support", to: "/partner/accommodation/support", icon: HelpCircle },
  { label: "Settings", to: "/partner/accommodation/profile", icon: Settings },
];

export function PartnerSidebar() {
  const navigate = useNavigate();

  async function handleSignOut() {
    await authApi.logout();
    storage.clearRole("accommodation");
    navigate("/partner/accommodation/login", { replace: true });
  }

  return (
    <aside className="partner-sidebar">
      <div className="sidebar-backdrop" />
      <div className="sidebar-inner">
        <div className="brand-block">
          <div className="brand-mark"><Mountain size={29} strokeWidth={1.7} /></div>
          <div>
            <div className="brand-name">DigitalSafaris</div>
            <div className="brand-tag">Travel · Explore · Experience</div>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Accommodation navigation">
          {navItems.map(({ label, to, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/partner/accommodation/dashboard"}
              className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
            >
              <Icon size={17} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <button type="button" className="sidebar-logout" onClick={handleSignOut}>
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
