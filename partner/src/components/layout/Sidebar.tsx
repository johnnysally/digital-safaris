import { BarChart3, BedDouble, Building2, CalendarDays, CreditCard, HelpCircle, House, LogOut, MessageSquareText, Mountain, Settings, Star, Users } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import authApi from "../../api/accommodation/authApi";
import { getApiErrorMessage } from "../../api/axios";
import { useAuth } from "../../context/authContext";
import { useToast } from "../../context/toastContext";

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
  const { signOut } = useAuth();
  const { showToast } = useToast();

  async function handleSignOut() {
    try {
      await authApi.logout();
    } catch (requestError) {
      showToast(getApiErrorMessage(requestError, "Unable to complete sign out with the server."), "error");
      return;
    }
    signOut("accommodation");
    navigate("/partner/accommodation/login", { replace: true });
  }

  return (
    <aside className="relative w-[248px] min-w-[248px] overflow-hidden border-r border-white/5 bg-[var(--sidebar)] text-white">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(36,22,13,0.95)_0%,rgba(36,22,13,0.94)_18%,rgba(36,22,13,0.88)_30%,rgba(36,22,13,0.7)_58%,rgba(36,22,13,0.3)_100%),url('https://images.unsplash.com/photo-1544237526-3a4f8953e87e?auto=format&fit=crop&w=1200&q=80')] bg-cover bg-bottom" />
      <div className="relative z-[1] flex min-h-screen flex-col px-4 pb-[18px] pt-5">
        <div className="flex items-center gap-3 border-b border-white/[0.08] px-2 pb-5 pt-1.5">
          <div className="grid h-10 w-10 place-items-center rounded-xl border border-[rgba(197,138,42,0.4)] bg-[rgba(197,138,42,0.18)] text-[0.8rem] font-extrabold text-[#fefaf4]"><Mountain size={29} strokeWidth={1.7} /></div>
          <div>
            <div className="text-[1.08rem] font-bold tracking-[-0.02em]">DigitalSafaris</div>
            <div className="mt-0.5 text-[0.65rem] text-white/70">Travel · Explore · Experience</div>
          </div>
        </div>

        <nav className="flex flex-col gap-2 py-5" aria-label="Accommodation navigation">
          {navItems.map(({ label, to, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/partner/accommodation/dashboard"}
              className={({ isActive }) => `flex items-center gap-3 rounded-[10px] px-3 py-[11px] font-semibold tracking-[-0.01em] text-white/80 no-underline hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/80 ${isActive ? "bg-[rgba(197,138,42,0.96)] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08),0_10px_18px_rgba(197,138,42,0.15)] hover:bg-[rgba(197,138,42,0.96)]" : ""}`}
            >
              <Icon size={17} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <button type="button" className="mt-auto flex items-center gap-2.5 rounded-[10px] border-0 bg-white/[0.03] px-3 py-[11px] font-semibold text-white/[0.85]" onClick={handleSignOut}>
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
