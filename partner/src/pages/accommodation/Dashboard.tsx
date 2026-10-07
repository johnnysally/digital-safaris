import { useEffect, useState } from "react";
import {
  ArrowRight,
  BedDouble,
  CalendarDays,
  CalendarPlus,
  ChartNoAxesColumnIncreasing,
  CheckCircle2,
  Coins,
  Gauge,
  MessageSquareText,
  Star,
  UserRound,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Area, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import profileApi from "../../api/accommodation/profileApi";
import propertyApi from "../../api/accommodation/propertyApi";
import roomApi from "../../api/accommodation/roomApi";
import bookingApi from "../../api/accommodation/bookingApi";
import availabilityApi from "../../api/accommodation/availabilityApi";
import ratingApi from "../../api/accommodation/ratingApi";
import walletApi from "../../api/accommodation/walletApi";
import { getApiErrorMessage } from "../../api/axios";
import type { AccommodationPartner, Booking, Property, Rating, Room, RoomAvailability, Wallet, Payout } from "../../types";
import { AccommodationPartnerLayout, ApiFeedback, PageHeader, StatusBadge } from "../../components/layout/Layout";

type BookingWithProperty = Omit<Booking, "property"> & { property: string | { name: string }; room: string | { name: string } };

interface DashboardData {
  partner: AccommodationPartner;
  properties: Property[];
  rooms: Room[];
  bookings: BookingWithProperty[];
  availability: RoomAvailability[];
  reviews: Rating[];
  wallet: Wallet;
  payouts: Payout[];
}

function currency(value: number, code: string) {
  try { return new Intl.NumberFormat(undefined, { style: "currency", currency: code }).format(value); }
  catch { return `${code} ${value.toLocaleString()}`; }
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function relativeDate(value: string) {
  const elapsedDays = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 86400000));
  return elapsedDays === 0 ? "Today" : elapsedDays === 1 ? "1d ago" : `${elapsedDays}d ago`;
}

export function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function loadDashboard() {
      setLoading(true);
      setError("");
      try {
        const today = new Date().toISOString().slice(0, 10);
        const [profile, properties, rooms, bookings, availability, ratingList, wallet, payouts] = await Promise.all([
          profileApi.get(),
          propertyApi.list(),
          roomApi.list(),
          bookingApi.list({ limit: 100 }),
          availabilityApi.list({ from: today, to: today }),
          ratingApi.list({ limit: 5 }),
          walletApi.get(),
          walletApi.transactions({ limit: 5 }),
        ]);
        if (!cancelled) setData({ partner: profile.partner, properties, rooms, bookings: bookings.data as BookingWithProperty[], availability, reviews: ratingList.data, wallet, payouts: payouts.data });
      } catch (requestError) {
        if (!cancelled) setError(getApiErrorMessage(requestError, "Could not load dashboard data."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadDashboard();
    return () => { cancelled = true; };
  }, [reload]);

  const recentBookings = (data?.bookings ?? []).slice(0, 4);
  const property = data?.properties[0];
  const activeRooms = (data?.rooms ?? []).filter((room) => room.status === "active");
  const activeRoomCount = activeRooms.reduce((count, room) => count + room.totalUnits, 0);
  const occupiedRoomCount = (data?.availability ?? []).reduce((count, item) => count + item.bookedUnits, 0);
  const occupancy = activeRoomCount ? Math.round((occupiedRoomCount / activeRoomCount) * 100) : 0;
  const today = new Date().toISOString().slice(0, 10);
  const checkInsToday = (data?.bookings ?? []).filter((booking) => booking.checkIn.slice(0, 10) === today && booking.status === "confirmed").length;
  const bookingTrend = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    const key = date.toISOString().slice(0, 10);
    return { day: date.toLocaleDateString(undefined, { month: "short", day: "numeric" }), bookings: (data?.bookings ?? []).filter((booking) => booking.createdAt.slice(0, 10) === key).length };
  });
  const activities = [
    ...recentBookings.slice(0, 2).map((booking) => ({ title: `Booking ${booking.status.replace(/_/g, " ")}`, detail: `${booking.customer ? `${booking.customer.firstName} ${booking.customer.lastName}` : "Guest"} · ${formatDate(booking.createdAt)}`, time: relativeDate(booking.createdAt), icon: CheckCircle2 })),
    ...(data?.reviews.slice(0, 1).map((review) => ({ title: "New guest review", detail: `${review.customer?.firstName ?? "Guest"} · ${formatDate(review.createdAt)}`, time: relativeDate(review.createdAt), icon: Star })) ?? []),
    ...(data?.payouts.slice(0, 1).map((payout) => ({ title: "Payout update", detail: `${currency(payout.amount, data.wallet.currency)} · ${payout.status}`, time: relativeDate(payout.createdAt), icon: Coins })) ?? []),
  ].slice(0, 4);
  return (
    <AccommodationPartnerLayout className="dashboard-app-shell">
      <div className="page-shell dashboard-page">
        <PageHeader title={`Good morning, ${data?.partner.name ?? "partner"}`} subtitle="Here’s what’s happening with your property today." />
        <ApiFeedback loading={loading} error={error} onRetry={() => setReload((current) => current + 1)} />

        <div className="dashboard-stats-grid">
          <div className="card dashboard-metric">
            <span className="dashboard-metric-icon"><CalendarDays size={21} /></span>
            <div><span className="dashboard-metric-label">Total Bookings</span><strong>{data?.partner.totalBookings ?? 0}</strong><span className="dashboard-metric-change">{data?.bookings.length ?? 0} loaded <small>recent records</small></span></div>
          </div>
          <div className="card dashboard-metric">
            <span className="dashboard-metric-icon"><UserRound size={21} /></span>
            <div><span className="dashboard-metric-label">Check-ins Today</span><strong>{checkInsToday}</strong><span className="dashboard-metric-change">{formatDate(today)} <small>local date</small></span></div>
          </div>
          <div className="card dashboard-metric">
            <span className="dashboard-metric-icon"><Gauge size={21} /></span>
            <div><span className="dashboard-metric-label">Occupancy Rate</span><strong>{occupancy}%</strong><span className="dashboard-metric-change">{occupiedRoomCount} occupied <small>of {activeRoomCount} active</small></span></div>
          </div>
          <div className="card dashboard-metric">
            <span className="dashboard-metric-icon"><Coins size={21} /></span>
            <div><span className="dashboard-metric-label">Total Earnings</span><strong>{currency(data?.wallet.totalEarned ?? 0, data?.wallet.currency ?? "KES")}</strong><span className="dashboard-metric-change">{currency(data?.wallet.pendingPayout ?? 0, data?.wallet.currency ?? "KES")} <small>pending payout</small></span></div>
          </div>
        </div>

        <div className="dashboard-primary-grid">
          <section className="card dashboard-bookings">
            <div className="dashboard-section-heading">
              <h2>Recent Bookings</h2>
              <Link to="/partner/accommodation/bookings">View all bookings <ArrowRight size={13} /></Link>
            </div>
            <div className="table-wrap">
              <table className="dashboard-bookings-table">
                <thead>
                  <tr>
                    <th>Guest</th>
                    <th>Check-in</th>
                    <th>Nights</th>
                    <th>Status</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {recentBookings.map((booking) => (
                    <tr key={booking._id}>
                      <td><span className="dashboard-guest">{booking.customer?.avatar ? <img src={booking.customer.avatar} alt="" /> : null}{booking.customer ? `${booking.customer.firstName} ${booking.customer.lastName}` : "Guest"}</span></td>
                      <td>{formatDate(booking.checkIn)}</td>
                      <td>{booking.nights}</td>
                      <td><StatusBadge status={booking.status.replace(/_/g, " ")} /></td>
                      <td>{currency(booking.total, booking.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!loading && recentBookings.length === 0 ? <div className="rooms-empty-state"><strong>No bookings yet</strong><span>New reservations will appear here.</span></div> : null}
            </div>
          </section>

          <aside className="card dashboard-property">
            <div className="dashboard-property-image">
                <span>{property?.status ?? "No property"}</span>
            </div>
            <div className="dashboard-property-body">
              <h2>{property?.name ?? "No property listing"}</h2>
              <p>{property?.type ?? "Add a property to manage your listing."}</p>
              <div className="dashboard-rating"><Star size={14} fill="currentColor" /> <strong>{(property?.rating ?? data?.partner.rating ?? 0).toFixed(1)}</strong> ({property?.totalRatings ?? data?.partner.totalRatings ?? 0} reviews)</div>
              <div className="dashboard-property-stats">
                <div><BedDouble size={16} /><strong>{property?.totalRooms ?? 0}</strong><span>Rooms</span></div>
                <div><CalendarDays size={16} /><strong>{property?.totalBookings ?? 0}</strong><span>Bookings</span></div>
                <div><Coins size={16} /><strong>{property?.totalRatings ?? 0}</strong><span>Reviews</span></div>
              </div>
            </div>
          </aside>
        </div>

        <div className="dashboard-lower-grid">
          <section className="card dashboard-quick-actions">
            <h2>Quick Actions</h2>
            <div className="dashboard-action-grid">
              <Link to="/partner/accommodation/properties/new"><span><CalendarPlus size={17} /></span><strong>Add Property</strong><small>Create a new listing</small></Link>
              <Link to="/partner/accommodation/bookings"><span><CalendarDays size={17} /></span><strong>Manage Bookings</strong><small>View all reservations</small></Link>
              <Link to="/partner/accommodation/messages"><span><MessageSquareText size={17} /></span><strong>Messages</strong><small>Chat with guests</small></Link>
              <Link to="/partner/accommodation/reports"><span><ChartNoAxesColumnIncreasing size={17} /></span><strong>View Reports</strong><small>Check your performance</small></Link>
            </div>
          </section>

          <section className="card dashboard-trends">
            <div className="dashboard-lower-heading">
              <h2>Booking Trends</h2>
              <button type="button">Last 7 days <span>⌄</span></button>
            </div>
            <div className="dashboard-chart">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={bookingTrend} margin={{ top: 12, right: 8, left: -18, bottom: 0 }}>
                  <defs>
                    <linearGradient id="dashboardTrendFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#d8801d" stopOpacity={0.22} />
                      <stop offset="100%" stopColor="#d8801d" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#efe7db" vertical />
                  <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: "#8d847a", fontSize: 9 }} />
                  <YAxis domain={[0, 40]} ticks={[0, 10, 20, 30, 40]} tickLine={false} axisLine={false} tick={{ fill: "#8d847a", fontSize: 9 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="bookings" stroke="none" fill="url(#dashboardTrendFill)" />
                  <Line type="monotone" dataKey="bookings" stroke="#cf7914" strokeWidth={2} dot={{ r: 2.5, fill: "#cf7914", strokeWidth: 0 }} activeDot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="card dashboard-activity">
            <h2>Recent Activity</h2>
            <div className="dashboard-activity-list">
                {activities.map(({ title, detail, time, icon: Icon }) => (
                <div className="dashboard-activity-item" key={title}>
                  <span className="dashboard-activity-icon"><Icon size={15} /></span>
                  <div><strong>{title}</strong><small>{detail}</small></div>
                  <time>{time}</time>
                </div>
              ))}
                {!loading && activities.length === 0 ? <div className="dashboard-activity-item"><span className="dashboard-activity-icon"><CheckCircle2 size={15} /></span><div><strong>No recent activity</strong><small>Activity appears as guests interact with your listing.</small></div></div> : null}
            </div>
          </section>
        </div>
      </div>
    </AccommodationPartnerLayout>
  );
}
