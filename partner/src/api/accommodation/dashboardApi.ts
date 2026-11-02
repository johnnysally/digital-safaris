import axios, { unwrap } from "../axios";
import type { Booking } from "../../types";

export interface DashboardOverview {
  partner: {
    _id: string;
    name: string;
    type: string;
    town: string;
    address: string;
    coverImage?: string | null;
    logo?: string | null;
    rating: number;
    totalRatings: number;
  };
  metrics: {
    totalBookings: number;
    bookingsToday: number;
    checkInsToday: number;
    occupancyRate: number;
    activeRoomUnits: number;
    occupiedRoomUnits: number;
    monthRevenue: number;
    currency: string;
  };
  bookingTrend: Array<{ day: string; date: string; count: number }>;
  recentBookings: Booking[];
  wallet: {
    balance: number;
    totalEarned: number;
    pendingPayout: number;
    currency: string;
  } | null;
  today: string;
}

const dashboardApi = {
  async overview(): Promise<DashboardOverview> {
    const res = await axios.get("/accommodation/dashboard/overview");
    return unwrap<DashboardOverview>(res.data);
  },
};

export default dashboardApi;