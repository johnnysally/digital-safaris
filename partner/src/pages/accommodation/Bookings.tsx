import { useEffect, useState } from "react";
import { Check, DoorOpen, Search, UserRoundCheck, UserRoundX, X } from "lucide-react";
import bookingApi, { type AvailableRoomUnit } from "../../api/accommodation/bookingApi";
import { getApiErrorMessage } from "../../api/axios";
import type { Booking } from "../../types";
import {
  AccommodationPartnerLayout,
  ApiFeedback,
  PageHeader,
  StatusBadge,
} from "../../components/layout/Layout";
import { formatCurrency } from "../../utils/formatCurrency";
import { formatDate } from "../../utils/formatDate";
import { formatLabel } from "../../utils/helpers";
import { useSocketInstance } from "../../context/socketContext";

type BookingRow = Omit<Booking, "property"> & {
  property: string | { name: string };
  roomUnit?: { _id: string; number: string; floor?: string | null } | null;
};

function displayStatus(status: string) {
  return formatLabel(status);
}

function displayDate(value: string) {
  return formatDate(value);
}

function guestsLabel(guests?: { adults?: number; children?: number }) {
  const adults = guests?.adults ?? 0;
  const children = guests?.children ?? 0;
  const adultsText = `${adults} adult${adults === 1 ? "" : "s"}`;
  const childrenText =
    children > 0 ? `, ${children} child${children === 1 ? "" : "ren"}` : "";
  return `${adultsText}${childrenText}`;
}

export function BookingsPage() {
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [reload, setReload] = useState(0);

  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [details, setDetails] = useState<BookingRow | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [assignOpen, setAssignOpen] = useState(false);
  const [assignBooking, setAssignBooking] = useState<BookingRow | null>(null);
  const [availableUnits, setAvailableUnits] = useState<AvailableRoomUnit[]>([]);
  const [unitsLoading, setUnitsLoading] = useState(false);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [assignError, setAssignError] = useState("");

  const socket = useSocketInstance("accommodation");

  useEffect(() => {
    if (!socket) return;
    const refresh = () => setReload((current) => current + 1);
    socket.on("booking:new", refresh);
    socket.on("booking:confirmed", refresh);
    socket.on("booking:cancelled", refresh);
    socket.on("booking:checked_in", refresh);
    socket.on("booking:checked_out", refresh);
    return () => {
      socket.off("booking:new", refresh);
      socket.off("booking:confirmed", refresh);
      socket.off("booking:cancelled", refresh);
      socket.off("booking:checked_in", refresh);
      socket.off("booking:checked_out", refresh);
    };
  }, [socket]);

  useEffect(() => {
    let cancelled = false;
    async function loadBookings() {
      setLoading(true);
      setError("");
      try {
        const status =
          statusFilter === "All statuses"
            ? undefined
            : statusFilter.toLowerCase().replace(/ /g, "_");
        const result = await bookingApi.list({ status, limit: 100 });
        if (!cancelled) setBookings(result.data as BookingRow[]);
      } catch (requestError) {
        if (!cancelled)
          setError(
            getApiErrorMessage(requestError, "Could not load bookings."),
          );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadBookings();
    return () => {
      cancelled = true;
    };
  }, [statusFilter, reload]);

  const filteredBookings = bookings.filter((booking) => {
    const guest = booking.customer
      ? `${booking.customer.firstName} ${booking.customer.lastName}`
      : "Guest";
    const property =
      typeof booking.property === "string"
        ? booking.property
        : booking.property?.name ?? "Property";
    return `${guest} ${property} ${booking.reference}`
      .toLowerCase()
      .includes(search.toLowerCase());
  });

  async function openDetails(id: string) {
    setDetailsId(id);
    setDetails(null);
    setDetailsLoading(true);
    try {
      const data = await bookingApi.details(id);
      // Backend returns the booking flattened OR wrapped. Handle both.
      const booking =
        (data as unknown as { booking?: BookingRow })?.booking ??
        (data as unknown as BookingRow);
      setDetails(booking);
    } catch (requestError) {
      setError(
        getApiErrorMessage(requestError, "Could not load booking details."),
      );
      setDetailsId(null);
    } finally {
      setDetailsLoading(false);
    }
  }

  async function updateBooking(booking: BookingRow) {
    setBusyId(booking._id);
    setError("");
    try {
      if (booking.status === "pending") await bookingApi.confirm(booking._id);
      else if (booking.status === "confirmed")
        await bookingApi.checkIn(booking._id);
      else if (booking.status === "checked_in")
        await bookingApi.checkOut(booking._id);
      setReload((current) => current + 1);
    } catch (requestError) {
      setError(
        getApiErrorMessage(requestError, "Could not update this booking."),
      );
    } finally {
      setBusyId("");
    }
  }

  async function handleCancelFromDrawer() {
    if (!details) return;
    const reason = window.prompt("Reason for cancelling?", "Partner rejected");
    if (!reason) return;
    try {
      await bookingApi.reject(details._id, reason);
      setDetailsId(null);
      setDetails(null);
      setReload((current) => current + 1);
    } catch (requestError) {
      setError(
        getApiErrorMessage(requestError, "Could not cancel this booking."),
      );
    }
  }

  async function openAssign(booking: BookingRow) {
    setAssignBooking(booking);
    setAssignOpen(true);
    setUnitsLoading(true);
    setAssignError("");
    setAvailableUnits([]);
    try {
      const units = await bookingApi.availableUnits(booking._id);
      setAvailableUnits(units);
    } catch (requestError) {
      setAssignError(
        getApiErrorMessage(requestError, "Could not load available rooms."),
      );
    } finally {
      setUnitsLoading(false);
    }
  }

  async function handleAssign(roomUnitId: string) {
    if (!assignBooking) return;
    setAssigning(roomUnitId);
    setAssignError("");
    try {
      await bookingApi.assignRoom(assignBooking._id, roomUnitId);
      setAssignOpen(false);
      setAssignBooking(null);
      setReload((current) => current + 1);
    } catch (requestError) {
      setAssignError(getApiErrorMessage(requestError, "Could not assign room."));
    } finally {
      setAssigning(null);
    }
  }

  const propertyLabel = (booking: BookingRow) =>
    typeof booking.property === "string"
      ? "—"
      : booking.property?.name ?? "—";

  return (
    <AccommodationPartnerLayout>
      <div className="mx-auto w-full max-w-[1440px]">
        <PageHeader
          title="Bookings"
          subtitle="Manage your guest reservations and status."
        />

        <div className="rounded-[18px] border border-[rgba(130,110,92,0.18)] bg-[rgba(255,252,247,0.94)] p-[18px_20px_10px] shadow-[0_8px_18px_rgba(36,22,13,0.03)]">
          <div className="mb-[18px] flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 [&_select]:min-w-40">
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                aria-label="Filter bookings by status"
              >
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
              <input
                aria-label="Search bookings"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search guest, property, or reference"
              />
            </label>
          </div>

          <ApiFeedback
            loading={loading}
            error={error}
            onRetry={() => setReload((current) => current + 1)}
          />

          <div className="w-full overflow-x-auto [&_table]:w-full [&_table]:border-collapse [&_th]:border-b [&_th]:border-[var(--border)] [&_th]:px-[0.8rem] [&_th]:py-[0.9rem] [&_th]:text-left [&_th]:text-[0.76rem] [&_th]:font-extrabold [&_th]:uppercase [&_th]:tracking-[0.08em] [&_th]:text-[var(--text-soft)] [&_td]:border-b [&_td]:border-[var(--border)] [&_td]:px-[0.8rem] [&_td]:py-[0.9rem] [&_td]:text-left [&_td]:text-[var(--text)]">
            <table>
              <thead>
                <tr>
                  <th>Guest</th>
                  <th>Property</th>
                  <th>Room</th>
                  <th>Check-in</th>
                  <th>Check-out</th>
                  <th>Status</th>
                  <th>Amount</th>
                  <th>
                    <span className="sr-only">Action</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((booking) => {
                  const guest = booking.customer
                    ? `${booking.customer.firstName} ${booking.customer.lastName}`
                    : "Guest";
                  const actionLabel =
                    booking.status === "pending"
                      ? "Confirm"
                      : booking.status === "confirmed"
                        ? "Check in"
                        : booking.status === "checked_in"
                          ? "Check out"
                          : "";
                  const ActionIcon =
                    booking.status === "pending"
                      ? Check
                      : booking.status === "confirmed"
                        ? UserRoundCheck
                        : UserRoundX;
                  const canAssign = ["pending", "confirmed", "checked_in"].includes(
                    booking.status,
                  );
                  return (
                    <tr key={booking._id}>
                      <td>
                        <button
                          type="button"
                          onClick={() => void openDetails(booking._id)}
                          className="text-left"
                        >
                          {guest}
                          <small className="ml-2 block text-xs text-[var(--text-muted)]">
                            {booking.reference}
                          </small>
                        </button>
                      </td>
                      <td>{propertyLabel(booking)}</td>
                      <td>
                        {booking.roomUnit
                          ? `Room ${booking.roomUnit.number}`
                          : "—"}
                      </td>
                      <td>{displayDate(booking.checkIn)}</td>
                      <td>{displayDate(booking.checkOut)}</td>
                      <td>
                        <StatusBadge status={displayStatus(booking.status)} />
                      </td>
                      <td>
                        {formatCurrency(booking.total, booking.currency || "KES")}
                      </td>
                      <td>
                        <div className="flex items-center justify-end gap-1">
                          {actionLabel ? (
                            <button
                              type="button"
                              className="inline-flex h-9 w-9 items-center justify-center gap-2 rounded-[10px] border-0 bg-[rgba(197,138,42,0.08)] text-[var(--gold)]"
                              aria-label={`${actionLabel} ${booking.reference}`}
                              title={actionLabel}
                              disabled={busyId === booking._id}
                              onClick={() => void updateBooking(booking)}
                            >
                              <ActionIcon size={15} />
                            </button>
                          ) : null}
                          {canAssign ? (
                            <button
                              type="button"
                              className="inline-flex h-9 items-center gap-1 rounded-[10px] border border-[var(--border)] bg-white px-2 text-[11px] font-semibold text-[#6c5840] hover:bg-[#fbf7f0]"
                              onClick={() => void openAssign(booking)}
                              title="Assign room"
                            >
                              <DoorOpen size={13} />
                              {booking.roomUnit ? "Room" : "Assign"}
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!loading && filteredBookings.length === 0 ? (
              <div className="flex min-h-[150px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-soft)] p-6 text-center text-[var(--text-soft)] [&_strong]:text-[var(--text)]">
                <strong>No bookings found</strong>
                <span>Try changing your search or status filter.</span>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {detailsId ? (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/40"
          role="dialog"
          aria-modal="true"
        >
          <div className="flex h-full w-full max-w-md flex-col bg-white shadow-xl">
            <header className="flex items-center justify-between gap-3 border-b border-[var(--border)] p-4">
              <div>
                <h2 className="m-0 text-base font-semibold text-[var(--text)]">
                  Booking details
                </h2>
                {details ? (
                  <p className="mt-1 font-mono text-xs text-[var(--text-soft)]">
                    {details.reference}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                aria-label="Close"
                className="grid h-8 w-8 place-items-center rounded-lg border-0 bg-transparent text-[var(--text-soft)] hover:bg-[#f7f1e8]"
                onClick={() => {
                  setDetailsId(null);
                  setDetails(null);
                }}
              >
                <X size={18} />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-4">
              {detailsLoading || !details ? (
                <div className="flex justify-center py-10 text-sm text-[var(--text-soft)]">
                  Loading…
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-[var(--text-soft)]">
                      Status
                    </span>
                    <StatusBadge status={displayStatus(details.status)} />
                  </div>

                  <div className="rounded-md border border-[var(--border)] bg-[#fbf7f0] p-4">
                    <p className="text-xs uppercase tracking-wide text-[var(--text-soft)]">
                      Total paid
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-[#80501b]">
                      {formatCurrency(details.total, details.currency || "KES")}
                    </p>
                    <p className="mt-1 text-xs text-[var(--text-soft)]">
                      Payment:{" "}
                      {details.paymentStatus
                        ? formatLabel(details.paymentStatus)
                        : "—"}
                    </p>
                  </div>

                  <dl className="space-y-3 text-sm">
                    <div>
                      <dt className="text-xs text-[var(--text-soft)]">
                        Property
                      </dt>
                      <dd className="text-[var(--text)]">
                        {details.propertyName ||
                          (typeof details.property === "object" &&
                          details.property
                            ? details.property.name
                            : "—")}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-xs text-[var(--text-soft)]">
                        Room
                      </dt>
                      <dd className="text-[var(--text)]">
                        {details.roomUnit
                          ? `Room ${details.roomUnit.number}${
                              details.roomUnit.floor
                                ? ` · Floor ${details.roomUnit.floor}`
                                : ""
                            }`
                          : "Not assigned yet"}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-xs text-[var(--text-soft)]">
                        Stay
                      </dt>
                      <dd className="text-[var(--text)]">
                        {formatDate(details.checkIn)} →{" "}
                        {formatDate(details.checkOut)}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-xs text-[var(--text-soft)]">
                        Guests
                      </dt>
                      <dd className="text-[var(--text)]">
                        {guestsLabel(details.guests)}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-xs text-[var(--text-soft)]">
                        Booked
                      </dt>
                      <dd className="text-[var(--text)]">
                        {formatDate(details.createdAt)}
                      </dd>
                    </div>
                  </dl>

                  <div className="flex flex-wrap gap-2 pt-2">
                    {details.status === "confirmed" ? (
                      <button
                        type="button"
                        className="rounded-lg bg-[#80501b] px-4 py-2 text-xs font-semibold text-white hover:bg-[#6a4215]"
                        onClick={() => {
                          void updateBooking(details);
                          setDetailsId(null);
                          setDetails(null);
                        }}
                      >
                        Check in
                      </button>
                    ) : null}
                    {["pending", "confirmed"].includes(details.status) ? (
                      <button
                        type="button"
                        className="rounded-lg border border-[#e8b9ad] bg-[#fff8f5] px-4 py-2 text-xs font-semibold text-[#914940] hover:bg-[#ffece8]"
                        onClick={() => void handleCancelFromDrawer()}
                      >
                        Cancel booking
                      </button>
                    ) : null}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {assignOpen ? (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/40"
          role="dialog"
          aria-modal="true"
        >
          <div className="flex h-full w-full max-w-md flex-col bg-white shadow-xl">
            <header className="flex items-center justify-between gap-3 border-b border-[var(--border)] p-4">
              <div>
                <h2 className="m-0 text-base font-semibold text-[var(--text)]">
                  Assign room
                </h2>
                {assignBooking ? (
                  <p className="mt-1 text-xs text-[var(--text-soft)]">
                    Booking {assignBooking.reference}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                aria-label="Close"
                className="grid h-8 w-8 place-items-center rounded-lg border-0 bg-transparent text-[var(--text-soft)] hover:bg-[#f7f1e8]"
                onClick={() => {
                  setAssignOpen(false);
                  setAssignBooking(null);
                }}
              >
                <X size={18} />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-4">
              {unitsLoading ? (
                <div className="flex justify-center py-10 text-sm text-[var(--text-soft)]">
                  Loading available rooms…
                </div>
              ) : assignError ? (
                <div className="rounded-lg border border-[#eed3cf] bg-[#fff8f7] px-3 py-2 text-xs text-[#914940]">
                  {assignError}
                </div>
              ) : availableUnits.length === 0 ? (
                <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-soft)] p-6 text-center text-xs text-[var(--text-soft)]">
                  <DoorOpen size={22} />
                  <strong className="text-[var(--text)]">
                    No rooms available
                  </strong>
                  <span>
                    All room units for these dates are booked, blocked, or in
                    maintenance.
                  </span>
                </div>
              ) : (
                <ul className="grid gap-2">
                  {availableUnits.map((unit) => (
                    <li key={unit._id}>
                      <button
                        type="button"
                        onClick={() => void handleAssign(unit._id)}
                        disabled={assigning === unit._id}
                        className={`flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-left text-sm transition ${
                          unit.isCurrent
                            ? "border-[var(--gold)] bg-[#fff8ea]"
                            : "border-[var(--border)] bg-white hover:bg-[#fbf7f0]"
                        } disabled:cursor-wait disabled:opacity-60`}
                      >
                        <span className="flex items-center gap-2">
                          <DoorOpen size={15} className="text-[var(--gold)]" />
                          <span className="font-semibold text-[var(--text)]">
                            Room {unit.number}
                          </span>
                          {unit.floor ? (
                            <span className="text-xs text-[var(--text-soft)]">
                              · Floor {unit.floor}
                            </span>
                          ) : null}
                        </span>
                        {assigning === unit._id ? (
                          <span className="text-xs text-[var(--text-soft)]">
                            Assigning…
                          </span>
                        ) : unit.isCurrent ? (
                          <span className="rounded-full bg-[var(--gold)] px-2 py-0.5 text-[10px] font-bold text-white">
                            Current
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-[#80501b]">
                            Assign
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </AccommodationPartnerLayout>
  );
}