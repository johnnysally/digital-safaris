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
import { formatCurrency as currency } from "../../utils/formatCurrency";
import { formatDate, formatRelativeDate } from "../../utils/formatDate";
import { formatLabel } from "../../utils/helpers";

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
    ...recentBookings.slice(0, 2).map((booking) => ({ title: `Booking ${formatLabel(booking.status)}`, detail: `${booking.customer ? `${booking.customer.firstName} ${booking.customer.lastName}` : "Guest"} · ${formatDate(booking.createdAt)}`, time: formatRelativeDate(booking.createdAt), icon: CheckCircle2 })),
    ...(data?.reviews.slice(0, 1).map((review) => ({ title: "New guest review", detail: `${review.customer?.firstName ?? "Guest"} · ${formatDate(review.createdAt)}`, time: formatRelativeDate(review.createdAt), icon: Star })) ?? []),
    ...(data?.payouts.slice(0, 1).map((payout) => ({ title: "Payout update", detail: `${currency(payout.amount, data.wallet.currency)} · ${payout.status}`, time: formatRelativeDate(payout.createdAt), icon: Coins })) ?? []),
  ].slice(0, 4);
  return (
    <AccommodationPartnerLayout>
      <div className="mx-auto w-full max-w-[1440px]">
        <PageHeader title={`Good morning, ${data?.partner.name ?? "partner"}`} subtitle="Here’s what’s happening with your property today." />
        <ApiFeedback loading={loading} error={error} onRetry={() => setReload((current) => current + 1)} />

        <div className="mb-[26px] grid grid-cols-4 gap-[18px]">
          <div className="rounded-[18px] border border-[rgba(130,110,92,0.18)] bg-[rgba(255,252,247,0.94)] shadow-[0_8px_18px_rgba(36,22,13,0.03)] rounded-[16px] border border-[rgba(130,110,92,0.18)] bg-[rgba(255,252,247,0.94)] p-4 shadow-[0_8px_18px_rgba(36,22,13,0.03)]">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[rgba(197,138,42,0.12)] text-[var(--gold)]"><CalendarDays size={21} /></span>
            <div><span className="mb-3 flex items-center justify-between text-[0.72rem] font-semibold text-[#736960]">Total Bookings</span><strong>{data?.partner.totalBookings ?? 0}</strong><span className="mt-2 text-xs font-bold text-[var(--success)]">{data?.bookings.length ?? 0} loaded <small>recent records</small></span></div>
          </div>
          <div className="rounded-[18px] border border-[rgba(130,110,92,0.18)] bg-[rgba(255,252,247,0.94)] shadow-[0_8px_18px_rgba(36,22,13,0.03)] rounded-[16px] border border-[rgba(130,110,92,0.18)] bg-[rgba(255,252,247,0.94)] p-4 shadow-[0_8px_18px_rgba(36,22,13,0.03)]">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[rgba(197,138,42,0.12)] text-[var(--gold)]"><UserRound size={21} /></span>
            <div><span className="mb-3 flex items-center justify-between text-[0.72rem] font-semibold text-[#736960]">Check-ins Today</span><strong>{checkInsToday}</strong><span className="mt-2 text-xs font-bold text-[var(--success)]">{formatDate(today)} <small>local date</small></span></div>
          </div>
          <div className="rounded-[18px] border border-[rgba(130,110,92,0.18)] bg-[rgba(255,252,247,0.94)] shadow-[0_8px_18px_rgba(36,22,13,0.03)] rounded-[16px] border border-[rgba(130,110,92,0.18)] bg-[rgba(255,252,247,0.94)] p-4 shadow-[0_8px_18px_rgba(36,22,13,0.03)]">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[rgba(197,138,42,0.12)] text-[var(--gold)]"><Gauge size={21} /></span>
            <div><span className="mb-3 flex items-center justify-between text-[0.72rem] font-semibold text-[#736960]">Occupancy Rate</span><strong>{occupancy}%</strong><span className="mt-2 text-xs font-bold text-[var(--success)]">{occupiedRoomCount} occupied <small>of {activeRoomCount} active</small></span></div>
          </div>
          <div className="rounded-[18px] border border-[rgba(130,110,92,0.18)] bg-[rgba(255,252,247,0.94)] shadow-[0_8px_18px_rgba(36,22,13,0.03)] rounded-[16px] border border-[rgba(130,110,92,0.18)] bg-[rgba(255,252,247,0.94)] p-4 shadow-[0_8px_18px_rgba(36,22,13,0.03)]">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[rgba(197,138,42,0.12)] text-[var(--gold)]"><Coins size={21} /></span>
            <div><span className="mb-3 flex items-center justify-between text-[0.72rem] font-semibold text-[#736960]">Total Earnings</span><strong>{currency(data?.wallet.totalEarned ?? 0, data?.wallet.currency ?? "KES")}</strong><span className="mt-2 text-xs font-bold text-[var(--success)]">{currency(data?.wallet.pendingPayout ?? 0, data?.wallet.currency ?? "KES")} <small>pending payout</small></span></div>
          </div>
        </div>

        <div className="grid grid-cols-[minmax(0,1.7fr)_minmax(280px,0.95fr)] items-start gap-5">
          <section className="rounded-[18px] border border-[rgba(130,110,92,0.18)] bg-[rgba(255,252,247,0.94)] shadow-[0_8px_18px_rgba(36,22,13,0.03)] rounded-[18px] border border-[rgba(130,110,92,0.18)] bg-[rgba(255,252,247,0.94)] p-5 shadow-[0_8px_18px_rgba(36,22,13,0.03)]">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2>Recent Bookings</h2>
              <Link to="/partner/accommodation/bookings">View all bookings <ArrowRight size={13} /></Link>
            </div>
            <div className="w-full overflow-x-auto [&_table]:w-full [&_table]:border-collapse [&_th]:border-b [&_th]:border-[var(--border)] [&_th]:px-[0.8rem] [&_th]:py-[0.9rem] [&_th]:text-left [&_th]:text-[0.76rem] [&_th]:font-extrabold [&_th]:uppercase [&_th]:tracking-[0.08em] [&_th]:text-[var(--text-soft)] [&_td]:border-b [&_td]:border-[var(--border)] [&_td]:px-[0.8rem] [&_td]:py-[0.9rem] [&_td]:text-left [&_td]:text-[var(--text)]">
              <table className="w-full border-collapse [&_th]:border-b [&_th]:border-[var(--border)] [&_th]:px-3 [&_th]:py-3 [&_th]:text-left [&_th]:text-xs [&_th]:font-bold [&_th]:uppercase [&_th]:text-[var(--text-soft)] [&_td]:border-b [&_td]:border-[var(--border)] [&_td]:px-3 [&_td]:py-3">
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
                      <td><span className="flex items-center gap-2">{booking.customer?.avatar ? <img src={booking.customer.avatar} alt="" /> : null}{booking.customer ? `${booking.customer.firstName} ${booking.customer.lastName}` : "Guest"}</span></td>
                      <td>{formatDate(booking.checkIn)}</td>
                      <td>{booking.nights}</td>
                      <td><StatusBadge status={formatLabel(booking.status)} /></td>
                      <td>{currency(booking.total, booking.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!loading && recentBookings.length === 0 ? <div className="flex min-h-[150px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-soft)] p-6 text-center text-[var(--text-soft)] [&_strong]:text-[var(--text)]"><strong>No bookings yet</strong><span>New reservations will appear here.</span></div> : null}
            </div>
          </section>

          <aside className="rounded-[18px] border border-[rgba(130,110,92,0.18)] bg-[rgba(255,252,247,0.94)] shadow-[0_8px_18px_rgba(36,22,13,0.03)] overflow-hidden rounded-[18px] border border-[rgba(130,110,92,0.18)] bg-[rgba(255,255,255,0.24)] shadow-[0_8px_18px_rgba(36,22,13,0.03)]">
            <div className="min-h-[220px] bg-cover bg-center">
                <span>{property?.status ?? "No property"}</span>
            </div>
            <div className="p-[18px]">
              <h2>{property?.name ?? "No property listing"}</h2>
              <p>{property?.type ?? "Add a property to manage your listing."}</p>
              <div className="text-[var(--gold)]"><Star size={14} fill="currentColor" /> <strong>{(property?.rating ?? data?.partner.rating ?? 0).toFixed(1)}</strong> ({property?.totalRatings ?? data?.partner.totalRatings ?? 0} reviews)</div>
              <div className="mt-4 grid grid-cols-3 gap-2.5 border-t border-[var(--border)] pt-3.5 [&>div]:flex [&>div]:flex-col [&>div]:gap-1 [&_strong]:text-base [&_span]:text-[0.72rem] [&_span]:text-[var(--text-soft)]">
                <div><BedDouble size={16} /><strong>{property?.totalRooms ?? 0}</strong><span>Rooms</span></div>
                <div><CalendarDays size={16} /><strong>{property?.totalBookings ?? 0}</strong><span>Bookings</span></div>
                <div><Coins size={16} /><strong>{property?.totalRatings ?? 0}</strong><span>Reviews</span></div>
              </div>
            </div>
          </aside>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-5">
          <section className="rounded-[18px] border border-[rgba(130,110,92,0.18)] bg-[rgba(255,252,247,0.94)] shadow-[0_8px_18px_rgba(36,22,13,0.03)] grid grid-cols-2 gap-3">
            <h2>Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              <Link to="/partner/accommodation/properties/new"><span><CalendarPlus size={17} /></span><strong>Add Property</strong><small>Create a new listing</small></Link>
              <Link to="/partner/accommodation/bookings"><span><CalendarDays size={17} /></span><strong>Manage Bookings</strong><small>View all reservations</small></Link>
              <Link to="/partner/accommodation/messages"><span><MessageSquareText size={17} /></span><strong>Messages</strong><small>Chat with guests</small></Link>
              <Link to="/partner/accommodation/reports"><span><ChartNoAxesColumnIncreasing size={17} /></span><strong>View Reports</strong><small>Check your performance</small></Link>
            </div>
          </section>

          <section className="rounded-[18px] border border-[rgba(130,110,92,0.18)] bg-[rgba(255,252,247,0.94)] shadow-[0_8px_18px_rgba(36,22,13,0.03)] rounded-[18px] border border-[rgba(130,110,92,0.18)] bg-[rgba(255,252,247,0.94)] p-5 shadow-[0_8px_18px_rgba(36,22,13,0.03)]">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2>Booking Trends</h2>
              <button type="button">Last 7 days <span>⌄</span></button>
            </div>
            <div className="min-h-[220px]">
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

          <section className="rounded-[18px] border border-[rgba(130,110,92,0.18)] bg-[rgba(255,252,247,0.94)] shadow-[0_8px_18px_rgba(36,22,13,0.03)] rounded-[18px] border border-[rgba(130,110,92,0.18)] bg-[rgba(255,252,247,0.94)] p-5 shadow-[0_8px_18px_rgba(36,22,13,0.03)]">
            <h2>Recent Activity</h2>
            <div className="flex flex-col">
                {activities.map(({ title, detail, time, icon: Icon }) => (
                <div className="flex items-start gap-3 border-b border-[var(--border)] py-3 last:border-b-0" key={title}>
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[rgba(197,138,42,0.12)] text-[var(--gold)]"><Icon size={15} /></span>
                  <div><strong>{title}</strong><small>{detail}</small></div>
                  <time>{time}</time>
                </div>
              ))}
                {!loading && activities.length === 0 ? <div className="flex items-start gap-3 border-b border-[var(--border)] py-3 last:border-b-0"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[rgba(197,138,42,0.12)] text-[var(--gold)]"><CheckCircle2 size={15} /></span><div><strong>No recent activity</strong><small>Activity appears as guests interact with your listing.</small></div></div> : null}
            </div>
          </section>
        </div>
      </div>
    </AccommodationPartnerLayout>
  );
}
