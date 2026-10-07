import { useEffect, useState } from "react";
import { Check, Search, UserRoundCheck, UserRoundX } from "lucide-react";
import bookingApi from "../../api/accommodation/bookingApi";
import { getApiErrorMessage } from "../../api/axios";
import type { Booking } from "../../types";
import { AccommodationPartnerLayout, ApiFeedback, PageHeader, StatusBadge } from "../../components/layout/Layout";

type BookingRow = Omit<Booking, "property"> & { property: string | { name: string } };

function displayStatus(status: string) {
  return status.replace(/_/g, " ").replace(/\b\w/g, (character: string) => character.toUpperCase());
}

function displayDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
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
      <div className="page-shell">
        <PageHeader title="Bookings" subtitle="Manage your guest reservations and status." />

        <div className="card section-card">
          <div className="toolbar-stack">
            <div className="toolbar-row">
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

            <label className="search-input-inline">
              <Search size={15} />
              <input aria-label="Search bookings" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search guest, property, or reference" />
            </label>
          </div>

          <ApiFeedback loading={loading} error={error} onRetry={() => setReload((current) => current + 1)} />

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Guest</th>
                  <th>Property</th>
                  <th>Check-in</th>
                  <th>Check-out</th>
                  <th>Status</th>
                  <th>Amount</th>
                  <th><span className="visually-hidden">Action</span></th>
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
                    <td>{guest}<small className="booking-reference">{booking.reference}</small></td>
                    <td>{property}</td>
                    <td>{displayDate(booking.checkIn)}</td>
                    <td>{displayDate(booking.checkOut)}</td>
                    <td><StatusBadge status={displayStatus(booking.status)} /></td>
                    <td>{new Intl.NumberFormat(undefined, { style: "currency", currency: booking.currency || "USD" }).format(booking.total)}</td>
                    <td>{actionLabel ? <button type="button" className="icon-action" aria-label={`${actionLabel} ${booking.reference}`} title={actionLabel} disabled={busyId === booking._id} onClick={() => void updateBooking(booking)}><ActionIcon size={15} /></button> : null}</td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
            {!loading && filteredBookings.length === 0 ? <div className="rooms-empty-state"><strong>No bookings found</strong><span>Try changing your search or status filter.</span></div> : null}
          </div>
        </div>
      </div>
    </AccommodationPartnerLayout>
  );
}
