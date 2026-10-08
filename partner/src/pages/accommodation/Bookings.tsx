import { useEffect, useState } from "react";
import { Check, Search, UserRoundCheck, UserRoundX } from "lucide-react";
import bookingApi from "../../api/accommodation/bookingApi";
import { getApiErrorMessage } from "../../api/axios";
import type { Booking } from "../../types";
import { AccommodationPartnerLayout, ApiFeedback, PageHeader, StatusBadge } from "../../components/layout/Layout";
import { formatCurrency } from "../../utils/formatCurrency";
import { formatDate } from "../../utils/formatDate";
import { formatLabel } from "../../utils/helpers";

type BookingRow = Omit<Booking, "property"> & { property: string | { name: string } };

function displayStatus(status: string) {
  return formatLabel(status);
}

function displayDate(value: string) {
  return formatDate(value);
}

export function BookingsPage() {
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function loadBookings() {
      setLoading(true);
      setError("");
      try {
        const status = statusFilter === "All statuses" ? undefined : statusFilter.toLowerCase().replace(/ /g, "_");
        const result = await bookingApi.list({ status, limit: 100 });
        if (!cancelled) setBookings(result.data as BookingRow[]);
      } catch (requestError) {
        if (!cancelled) setError(getApiErrorMessage(requestError, "Could not load bookings."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadBookings();
    return () => { cancelled = true; };
  }, [statusFilter, reload]);

  const filteredBookings = bookings.filter((booking) => {
    const guest = booking.customer ? `${booking.customer.firstName} ${booking.customer.lastName}` : "Guest";
    const property = typeof booking.property === "string" ? booking.property : booking.property?.name ?? "Property";
    return `${guest} ${property} ${booking.reference}`.toLowerCase().includes(search.toLowerCase());
  });

  async function updateBooking(booking: BookingRow) {
    setBusyId(booking._id);
    setError("");
    try {
      if (booking.status === "pending") await bookingApi.confirm(booking._id);
      else if (booking.status === "confirmed") await bookingApi.checkIn(booking._id);
      else if (booking.status === "checked_in") await bookingApi.checkOut(booking._id);
      setReload((current) => current + 1);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Could not update this booking."));
    } finally {
      setBusyId("");
    }
  }

  return (
    <AccommodationPartnerLayout>
      <div className="mx-auto w-full max-w-[1440px]">
        <PageHeader title="Bookings" subtitle="Manage your guest reservations and status." />

        <div className="rounded-[18px] border border-[rgba(130,110,92,0.18)] bg-[rgba(255,252,247,0.94)] shadow-[0_8px_18px_rgba(36,22,13,0.03)] p-[18px_20px_10px]">
          <div className="mb-[18px] flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 [&_select]:min-w-40">
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter bookings by status">
                <option>All statuses</option>
                <option>Confirmed</option>
                <option>Pending</option>
                <option>Checked in</option>
                <option>Checked out</option>
                <option>Cancelled</option>
                <option>No show</option>
              </select>
            </div>

            <label className="flex min-w-[220px] items-center gap-2 rounded-[10px] border border-[var(--border)] bg-[var(--surface-soft)] px-3 [&_input]:border-0 [&_input]:bg-transparent [&_input]:pl-0 [&_input]:shadow-none [&_input]:focus:ring-0">
              <Search size={15} />
              <input aria-label="Search bookings" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search guest, property, or reference" />
            </label>
          </div>

          <ApiFeedback loading={loading} error={error} onRetry={() => setReload((current) => current + 1)} />

          <div className="w-full overflow-x-auto [&_table]:w-full [&_table]:border-collapse [&_th]:border-b [&_th]:border-[var(--border)] [&_th]:px-[0.8rem] [&_th]:py-[0.9rem] [&_th]:text-left [&_th]:text-[0.76rem] [&_th]:font-extrabold [&_th]:uppercase [&_th]:tracking-[0.08em] [&_th]:text-[var(--text-soft)] [&_td]:border-b [&_td]:border-[var(--border)] [&_td]:px-[0.8rem] [&_td]:py-[0.9rem] [&_td]:text-left [&_td]:text-[var(--text)]">
            <table>
              <thead>
                <tr>
                  <th>Guest</th>
                  <th>Property</th>
                  <th>Check-in</th>
                  <th>Check-out</th>
                  <th>Status</th>
                  <th>Amount</th>
                  <th><span className="sr-only">Action</span></th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((booking) => {
                  const guest = booking.customer ? `${booking.customer.firstName} ${booking.customer.lastName}` : "Guest";
                  const property = typeof booking.property === "string" ? booking.property : booking.property?.name ?? "Property";
                  const actionLabel = booking.status === "pending" ? "Confirm" : booking.status === "confirmed" ? "Check in" : booking.status === "checked_in" ? "Check out" : "";
                  const ActionIcon = booking.status === "pending" ? Check : booking.status === "confirmed" ? UserRoundCheck : UserRoundX;
                  return (
                  <tr key={booking._id}>
                    <td>{guest}<small className="ml-2 block text-xs text-[var(--text-muted)]">{booking.reference}</small></td>
                    <td>{property}</td>
                    <td>{displayDate(booking.checkIn)}</td>
                    <td>{displayDate(booking.checkOut)}</td>
                    <td><StatusBadge status={displayStatus(booking.status)} /></td>
                    <td>{formatCurrency(booking.total, booking.currency || "USD")}</td>
                    <td>{actionLabel ? <button type="button" className="inline-flex h-9 w-9 items-center justify-center gap-2 rounded-[10px] border-0 bg-[rgba(197,138,42,0.08)] text-[var(--gold)]" aria-label={`${actionLabel} ${booking.reference}`} title={actionLabel} disabled={busyId === booking._id} onClick={() => void updateBooking(booking)}><ActionIcon size={15} /></button> : null}</td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
            {!loading && filteredBookings.length === 0 ? <div className="flex min-h-[150px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-soft)] p-6 text-center text-[var(--text-soft)] [&_strong]:text-[var(--text)]"><strong>No bookings found</strong><span>Try changing your search or status filter.</span></div> : null}
          </div>
        </div>
      </div>
    </AccommodationPartnerLayout>
  );
}
