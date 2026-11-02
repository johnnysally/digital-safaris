import {
  BedDouble,
  Bell,
  Calendar,
  CalendarDays,
  ChartNoAxesColumnIncreasing,
  DoorOpen,
  House,
  LayoutDashboard,
  Settings,
  Star,
  Users,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface AccommodationNavigationItem {
  label: string;
  to: string;
  icon: LucideIcon;
}

export const accommodationNavigation: AccommodationNavigationItem[] = [
  { label: "Dashboard", to: "/partner/accommodation/dashboard", icon: LayoutDashboard },
  { label: "My Property", to: "/partner/accommodation/properties", icon: House },
  { label: "Rooms & Inventory", to: "/partner/accommodation/rooms", icon: BedDouble },
  { label: "Room Units", to: "/partner/accommodation/room-units", icon: DoorOpen },
  { label: "Bookings", to: "/partner/accommodation/bookings", icon: CalendarDays },
  { label: "Guests", to: "/partner/accommodation/guests", icon: Users },
  { label: "Availability", to: "/partner/accommodation/availability", icon: Calendar },
  { label: "Notifications", to: "/partner/accommodation/notifications", icon: Bell },
  { label: "Reviews", to: "/partner/accommodation/reviews", icon: Star },
  { label: "Payments", to: "/partner/accommodation/payments", icon: Wallet },
  { label: "Reports", to: "/partner/accommodation/reports", icon: ChartNoAxesColumnIncreasing },
  { label: "Settings", to: "/partner/accommodation/profile", icon: Settings },
];