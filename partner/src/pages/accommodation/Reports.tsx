import { useEffect, useMemo, useState } from "react";
import { BarChart3, CalendarRange, Download, TrendingUp } from "lucide-react";
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
  const [periodMonths, setPeriodMonths] = useState(6);

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

  const periodStart = useMemo(() => {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() - (periodMonths - 1));
    return date;
  }, [periodMonths]);

  const periodBookings = useMemo(() => bookings.filter((booking) => {
    const created = new Date(booking.createdAt);
    return created >= periodStart;
  }), [bookings, periodStart]);

  const revenueData = useMemo(() => Array.from({ length: periodMonths }, (_, index) => {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() - (periodMonths - 1 - index));
    const year = date.getFullYear();
    const month = date.getMonth();
    const value = periodBookings.filter((booking) => {
      const created = new Date(booking.createdAt);
      return created.getFullYear() === year && created.getMonth() === month;
    }).reduce((total, booking) => total + booking.partnerEarnings, 0);
    return { name: date.toLocaleDateString(undefined, { month: "short", year: periodMonths > 6 ? "2-digit" : undefined }), value };
  }), [periodBookings, periodMonths]);

  const statusData = useMemo(() => {
    const counts = periodBookings.reduce<Record<string, number>>((result, booking) => {
      const group = booking.status === "confirmed" || booking.status === "checked_in" || booking.status === "checked_out" ? "Confirmed" : booking.status === "pending" ? "Pending" : booking.status === "cancelled" ? "Cancelled" : "Other";
      result[group] = (result[group] ?? 0) + 1;
      return result;
    }, {});
    return Object.entries(counts).map(([name, value]) => ({
      name,
      value,
      percent: periodBookings.length ? Math.round((value / periodBookings.length) * 100) : 0,
      color: statusColors[name.toLowerCase() as keyof typeof statusColors] ?? statusColors.other,
    }));
  }, [periodBookings]);

  const activeRooms = rooms.filter((room) => room.status === "active");
  const totalInventory = activeRooms.reduce((total, room) => total + room.totalUnits, 0);
  const occupied = availability.reduce((total, item) => total + item.bookedUnits, 0);
  const occupancy = totalInventory ? Math.round((occupied / totalInventory) * 100) : 0;
  const averageStay = periodBookings.length ? periodBookings.reduce((total, booking) => total + booking.nights, 0) / periodBookings.length : 0;
  const periodEarnings = periodBookings.reduce((total, booking) => total + booking.partnerEarnings, 0);
  const currencyCode = wallet?.currency ?? "KES";

  function exportCsv() {
    const quote = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
    const rows = [
      ["Booking reference", "Created at", "Check in", "Check out", "Nights", "Status", "Payment status", "Partner earnings", "Currency"],
      ...periodBookings.map((booking) => [
        booking.reference,
        booking.createdAt,
        booking.checkIn,
        booking.checkOut,
        booking.nights,
        booking.status,
        booking.paymentStatus,
        booking.partnerEarnings,
        booking.currency || currencyCode,
      ]),
    ];
    const csv = rows.map((row) => row.map(quote).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `digitalsafaris-booking-report-${periodMonths}m.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <AccommodationPartnerLayout>
      <div className="w-full">
        <PageHeader
          title="Reports & Analytics"
          subtitle="Explore booking performance, earnings, and room occupancy."
          action={
            <div className="flex flex-wrap items-center justify-end gap-2">
              <label className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[var(--border)] bg-white px-3 text-xs font-semibold text-[#554c43]">
                <CalendarRange size={15} className="text-[#95611e]" />
                <span className="sr-only">Report period</span>
                <select aria-label="Report period" className="border-0 bg-transparent py-2 text-xs font-semibold outline-none" value={periodMonths} onChange={(event) => setPeriodMonths(Number(event.target.value))}>
                  <option value={3}>Last 3 months</option>
                  <option value={6}>Last 6 months</option>
                  <option value={12}>Last 12 months</option>
                </select>
              </label>
              <button type="button" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-white px-3.5 text-xs font-semibold text-[var(--text)] transition hover:bg-[#fbf7f0] disabled:opacity-50" onClick={() => setReload((current) => current + 1)} disabled={loading}>
                <TrendingUp size={15} /> Refresh
              </button>
              <button type="button" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border-0 bg-[#9b5b17] px-3.5 text-xs font-semibold text-white transition hover:bg-[#80490f] disabled:cursor-not-allowed disabled:opacity-50" onClick={exportCsv} disabled={loading || periodBookings.length === 0}>
                <Download size={15} /> Export CSV
              </button>
            </div>
          }
        />

        <ApiFeedback loading={loading} error={error} onRetry={() => setReload((current) => current + 1)} />
        <p className="mb-4 text-[11px] text-[#81766a]">
          Showing {periodStart.toLocaleDateString(undefined, { month: "short", year: "numeric" })} – {new Date().toLocaleDateString(undefined, { month: "short", year: "numeric" })}. Booking metrics use the latest {bookings.length} records returned by the API.
        </p>

        <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
          <KpiCard label="Bookings in Period" value={String(periodBookings.length)} change={`From ${bookings.length} loaded records`} />
          <KpiCard label="Earnings in Period" value={money(periodEarnings, currencyCode)} change="Sum of booking partner earnings" tone="positive" />
          <KpiCard label="Lifetime Earnings" value={money(wallet?.totalEarned ?? 0, currencyCode)} change="All-time wallet total" tone="positive" />
          <KpiCard label="Avg. Stay Duration" value={`${averageStay.toFixed(1)} nights`} change="Across period bookings" />
        </div>
        <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <KpiCard label="Occupancy Today" value={`${occupancy}%`} change={`${occupied} occupied · ${totalInventory} active units`} />
          <KpiCard label="Active Room Types" value={String(activeRooms.length)} change={`${totalInventory} units in inventory`} />
        </div>

        <div className="mb-5 grid grid-cols-1 gap-5 2xl:grid-cols-2">
          <div className="min-h-[320px] rounded-2xl border border-[rgba(130,110,92,0.18)] bg-[rgba(255,252,247,0.94)] p-5 shadow-[0_8px_18px_rgba(36,22,13,0.03)]">
            <div className="mb-[18px] flex items-center justify-between gap-3.5">
              <div>
                <p className="mb-1.5 text-[0.68rem] font-extrabold uppercase tracking-[0.12em] text-[var(--text-soft)]">Revenue overview</p>
                <h3>Monthly Booking Earnings</h3>
              </div>
              <TrendingUp size={18} color="#c58a2a" />
            </div>

            <div style={{ width: "100%", height: 250 }}>
              <ResponsiveContainer>
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eaded1" />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} tickFormatter={(value: number) => money(value, currencyCode, { notation: "compact", maximumFractionDigits: 1 })} />
                  <Tooltip formatter={(value) => money(Number(value), currencyCode)} />
                  <Bar dataKey="value" name="Partner earnings" radius={[8, 8, 0, 0]} fill="#c58a2a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-[rgba(130,110,92,0.18)] bg-[rgba(255,252,247,0.94)] p-5 shadow-[0_8px_18px_rgba(36,22,13,0.03)]">
            <div className="mb-[18px] flex items-center justify-between gap-3.5">
              <div>
                <p className="mb-1.5 text-[0.68rem] font-extrabold uppercase tracking-[0.12em] text-[var(--text-soft)]">Reservation mix</p>
                <h3>Booking Status</h3>
              </div>
              <BarChart3 size={18} color="#c58a2a" />
            </div>

            <div className="relative flex items-center gap-6">
              <ResponsiveContainer width="100%" height={210}>
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={42} outerRadius={68} paddingAngle={4}>
                    {statusData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <strong>{periodBookings.length}</strong>
                <span>Bookings</span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {statusData.map((item) => (
                <div key={item.name} className="flex items-center justify-between gap-3">
                  <span className="mr-2 inline-block h-[10px] w-[10px] rounded-full" style={{ background: item.color }} />
                  {item.name}
                  <strong>{item.percent}% <span className="ml-1 text-[10px] font-normal text-[#81766a]">({item.value})</span></strong>
                </div>
              ))}
            </div>
          </div>
          <section className="overflow-hidden rounded-2xl border border-[rgba(130,110,92,0.18)] bg-[rgba(255,252,247,0.94)] shadow-[0_8px_18px_rgba(36,22,13,0.03)]" aria-labelledby="report-bookings-heading">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eee5d9] px-5 py-4">
              <div>
                <p className="mb-1 text-[10px] font-bold uppercase tracking-[.13em] text-[#81766a]">Performance detail</p>
                <h2 id="report-bookings-heading" className="m-0 font-serif text-lg font-semibold text-[#29231e]">Latest bookings in this period</h2>
              </div>
              <span className="rounded-full bg-[#f5ead8] px-3 py-1 text-[10px] font-semibold text-[#80511e]">{periodBookings.length} records</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] border-collapse text-left text-xs">
                <thead className="bg-[#fbf7f0] text-[10px] uppercase tracking-[.08em] text-[#81766a]">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Reference</th><th className="px-4 py-3 font-semibold">Created</th><th className="px-4 py-3 font-semibold">Stay</th><th className="px-4 py-3 font-semibold">Nights</th><th className="px-4 py-3 font-semibold">Status</th><th className="px-5 py-3 text-right font-semibold">Earnings</th>
                  </tr>
                </thead>
                <tbody>
                  {periodBookings.slice(0, 10).map((booking) => (
                    <tr key={booking._id} className="border-t border-[#f0e9df] text-[#554c43]">
                      <td className="whitespace-nowrap px-5 py-3 font-semibold text-[#332b24]">{booking.reference}</td>
                      <td className="whitespace-nowrap px-4 py-3">{new Date(booking.createdAt).toLocaleDateString()}</td>
                      <td className="whitespace-nowrap px-4 py-3">{new Date(booking.checkIn).toLocaleDateString()} – {new Date(booking.checkOut).toLocaleDateString()}</td>
                      <td className="px-4 py-3">{booking.nights}</td>
                      <td className="px-4 py-3"><span className="rounded-full bg-[#f4efe6] px-2.5 py-1 text-[10px] font-semibold capitalize">{booking.status.replace(/_/g, " ")}</span></td>
                      <td className="whitespace-nowrap px-5 py-3 text-right font-semibold">{money(booking.partnerEarnings, booking.currency || currencyCode)}</td>
                    </tr>
                  ))}
                  {!loading && periodBookings.length === 0 ? <tr><td className="px-5 py-10 text-center text-[#81766a]" colSpan={6}>No bookings found for this report period.</td></tr> : null}
                </tbody>
              </table>
            </div>
            {periodBookings.length > 10 ? <p className="m-0 border-t border-[#eee5d9] px-5 py-3 text-[10px] text-[#81766a]">Showing 10 of {periodBookings.length}. Export CSV to download all loaded records for this period.</p> : null}
          </section>
        </div>
      </div>
    </AccommodationPartnerLayout>
  );
}
