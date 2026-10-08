import { useEffect, useMemo, useState } from "react";
import { BarChart3, TrendingUp } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from "recharts";
import bookingApi from "../../api/accommodation/bookingApi";
import walletApi from "../../api/accommodation/walletApi";
import roomApi from "../../api/accommodation/roomApi";
import availabilityApi from "../../api/accommodation/availabilityApi";
import { getApiErrorMessage } from "../../api/axios";
import type { Booking, Room, RoomAvailability, Wallet } from "../../types";
import { AccommodationPartnerLayout, ApiFeedback, KpiCard, PageHeader } from "../../components/layout/Layout";
import { formatCurrency as money } from "../../utils/formatCurrency";

const statusColors = { confirmed: "#68845d", pending: "#c58a2a", cancelled: "#a85c52", other: "#8d847a" };

export function ReportsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [availability, setAvailability] = useState<RoomAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function loadReports() {
      setLoading(true);
      setError("");
      try {
        const today = new Date().toISOString().slice(0, 10);
        const [bookingResult, walletResult, roomResult, availabilityResult] = await Promise.all([
          bookingApi.list({ limit: 100 }), walletApi.get(), roomApi.list(), availabilityApi.list({ from: today, to: today }),
        ]);
        if (!cancelled) {
          setBookings(bookingResult.data);
          setWallet(walletResult);
          setRooms(roomResult);
          setAvailability(availabilityResult);
        }
      } catch (requestError) {
        if (!cancelled) setError(getApiErrorMessage(requestError, "Could not load analytics data."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadReports();
    return () => { cancelled = true; };
  }, [reload]);

  const revenueData = useMemo(() => Array.from({ length: 6 }, (_, index) => {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() - (5 - index));
    const year = date.getFullYear();
    const month = date.getMonth();
    const value = bookings.filter((booking) => {
      const created = new Date(booking.createdAt);
      return created.getFullYear() === year && created.getMonth() === month;
    }).reduce((total, booking) => total + booking.partnerEarnings, 0);
    return { name: date.toLocaleDateString(undefined, { month: "short" }), value };
  }), [bookings]);

  const statusData = useMemo(() => {
    const counts = bookings.reduce<Record<string, number>>((result, booking) => {
      const group = booking.status === "confirmed" || booking.status === "checked_in" || booking.status === "checked_out" ? "Confirmed" : booking.status === "pending" ? "Pending" : booking.status === "cancelled" ? "Cancelled" : "Other";
      result[group] = (result[group] ?? 0) + 1;
      return result;
    }, {});
    return Object.entries(counts).map(([name, value]) => ({ name, value, color: statusColors[name.toLowerCase() as keyof typeof statusColors] ?? statusColors.other }));
  }, [bookings]);

  const activeRooms = rooms.filter((room) => room.status === "active");
  const totalInventory = activeRooms.reduce((total, room) => total + room.totalUnits, 0);
  const occupied = availability.reduce((total, item) => total + item.bookedUnits, 0);
  const occupancy = totalInventory ? Math.round((occupied / totalInventory) * 100) : 0;
  const averageStay = bookings.length ? bookings.reduce((total, booking) => total + booking.nights, 0) / bookings.length : 0;
  const currencyCode = wallet?.currency ?? "KES";
  const rangeStart = new Date();
  rangeStart.setDate(1);
  rangeStart.setMonth(rangeStart.getMonth() - 5);

  return (
    <AccommodationPartnerLayout>
      <div className="mx-auto w-full max-w-[1440px]">
        <PageHeader
          title="Reports & Analytics"
          subtitle="Insights to help you grow your business."
          action={<button type="button" className="inline-flex items-center justify-center gap-2 rounded-[10px] border border-[var(--border)] bg-white px-[1.1rem] py-[0.8rem] font-bold text-[var(--text)]" onClick={() => setReload((current) => current + 1)} disabled={loading}>{rangeStart.toLocaleDateString(undefined, { month: "short", year: "numeric" })} – {new Date().toLocaleDateString(undefined, { month: "short", year: "numeric" })} · Refresh</button>}
        />

        <ApiFeedback loading={loading} error={error} onRetry={() => setReload((current) => current + 1)} />

        <div className="mb-[26px] grid grid-cols-4 gap-[18px]">
          <KpiCard label="Total Bookings" value={String(bookings.length)} change="Loaded reservation records" />
          <KpiCard label="Total Earnings" value={money(wallet?.totalEarned ?? 0, currencyCode)} change="Partner lifetime earnings" />
          <KpiCard label="Avg. Stay Duration" value={`${averageStay.toFixed(1)} nights`} change="Across loaded bookings" />
          <KpiCard label="Occupancy Today" value={`${occupancy}%`} change={`${occupied} occupied · ${totalInventory} active units`} />
        </div>

        <div className="grid grid-cols-2 gap-5">
          <div className="rounded-[18px] border border-[rgba(130,110,92,0.18)] bg-[rgba(255,252,247,0.94)] shadow-[0_8px_18px_rgba(36,22,13,0.03)] rounded-[18px] border border-[rgba(130,110,92,0.18)] bg-[rgba(255,252,247,0.94)] p-5 shadow-[0_8px_18px_rgba(36,22,13,0.03)] min-h-[300px]">
            <div className="mb-[18px] flex items-center justify-between gap-3.5">
              <div>
                <p className="mb-1.5 text-[0.68rem] font-extrabold uppercase tracking-[0.12em] text-[var(--text-soft)]">Revenue overview</p>
                <h3>Monthly Booking Earnings</h3>
              </div>
              <TrendingUp size={18} color="#c58a2a" />
            </div>

            <div style={{ width: "100%", height: 240 }}>
              <ResponsiveContainer>
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eaded1" />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Bar dataKey="value" name="Partner earnings" radius={[8, 8, 0, 0]} fill="#c58a2a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-[18px] border border-[rgba(130,110,92,0.18)] bg-[rgba(255,252,247,0.94)] shadow-[0_8px_18px_rgba(36,22,13,0.03)] rounded-[18px] border border-[rgba(130,110,92,0.18)] bg-[rgba(255,252,247,0.94)] p-5 shadow-[0_8px_18px_rgba(36,22,13,0.03)]">
            <div className="mb-[18px] flex items-center justify-between gap-3.5">
              <div>
                <p className="mb-1.5 text-[0.68rem] font-extrabold uppercase tracking-[0.12em] text-[var(--text-soft)]">Reservation mix</p>
                <h3>Booking Status</h3>
              </div>
              <BarChart3 size={18} color="#c58a2a" />
            </div>

            <div className="relative flex items-center gap-6">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={42} outerRadius={68} paddingAngle={4}>
                    {statusData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <strong>{bookings.length}</strong>
                <span>Bookings</span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {statusData.map((item) => (
                <div key={item.name} className="flex items-center justify-between gap-3">
                  <span className="mr-2 inline-block h-[10px] w-[10px] rounded-full" style={{ background: item.color }} />
                  {item.name}
                  <strong>{item.value}%</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AccommodationPartnerLayout>
  );
}
