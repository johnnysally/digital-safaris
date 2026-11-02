import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Calendar,
  Check,
  DoorOpen,
  MapPin,
  Star,
  Users,
} from "lucide-react";
import Card from "../components/ui/Card";
import Table, { type Column } from "../components/ui/Table";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import Drawer from "../components/ui/Drawer";
import Select from "../components/ui/Select";
import Pagination from "../components/ui/Pagination";
import Alert from "../components/ui/Alert";
import Spinner from "../components/ui/Spinner";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import { bookingApi } from "../api";
import { useToast } from "../context/toastContext";
import { DEFAULT_PAGE_SIZE } from "../utils/constants";
import { formatDate, formatDateTime } from "../utils/formatDate";
import { capitalize } from "../utils/helpers";
import type { Booking as BookingType, PaginationMeta } from "../types";

type Variant = "success" | "warning" | "danger" | "info" | "neutral";

interface BookingRow extends BookingType {
  hasReview?: boolean;
  review?: { _id: string; rating: number } | null;
}

function statusVariant(status: string): Variant {
  switch (status) {
    case "completed":
    case "checked_out":
    case "confirmed":
      return "success";
    case "pending":
      return "warning";
    case "checked_in":
      return "info";
    case "cancelled":
    case "no_show":
    case "refunded":
      return "danger";
    default:
      return "neutral";
  }
}

function paymentVariant(status: string): Variant {
  switch (status) {
    case "paid":
      return "success";
    case "pending":
      return "warning";
    case "refunded":
      return "info";
    case "failed":
      return "danger";
    default:
      return "neutral";
  }
}

function money(amount: number | undefined, currency = "KES") {
  if (amount == null || !Number.isFinite(Number(amount))) return "—";
  return `${currency} ${Number(amount).toLocaleString("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function guestsLabel(guests?: { adults?: number; children?: number }) {
  const adults = guests?.adults ?? 0;
  const children = guests?.children ?? 0;
  const adultsText = `${adults} adult${adults === 1 ? "" : "s"}`;
  const childrenText =
    children > 0 ? `, ${children} child${children === 1 ? "" : "ren"}` : "";
  return `${adultsText}${childrenText}`;
}

function getPopulatedName(
  value: unknown,
  fallback: string | undefined,
): string {
  if (value && typeof value === "object" && "name" in value) {
    const name = (value as { name?: string }).name;
    if (name) return name;
  }
  return fallback || "—";
}

function getRoomUnitNumber(unit: unknown): string | null {
  if (unit && typeof unit === "object" && "number" in unit) {
    const number = (unit as { number?: string }).number;
    if (number) return number;
  }
  return null;
}

export default function Booking() {
  const { error: toastError, success: toastSuccess } = useToast();
  const [searchParams] = useSearchParams();
  const justCreated = searchParams.get("created");

  const [rows, setRows] = useState<BookingRow[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [details, setDetails] = useState<BookingRow | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);
  const [checkInLoading, setCheckInLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await bookingApi.list({
        page,
        limit: DEFAULT_PAGE_SIZE,
        status: status || undefined,
      });
      setRows((res.data ?? []) as BookingRow[]);
      setMeta(res.meta ?? null);
    } catch {
      setError("Could not load bookings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status]);

  const openDetails = async (id: string) => {
    setDetailsId(id);
    setDetails(null);
    setDetailsLoading(true);
    try {
      const data = await bookingApi.details(id);
      const booking =
        (data as unknown as { booking?: BookingRow })?.booking ??
        (data as unknown as BookingRow);
      setDetails(booking);
    } catch {
      toastError("Could not load booking");
      setDetailsId(null);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!details) return;
    setCancelLoading(true);
    try {
      const updated = await bookingApi.cancel(
        details._id,
        cancelReason || undefined,
      );
      setDetails(updated);
      setRows((prev) =>
        prev.map((r) => (r._id === updated._id ? { ...r, ...updated } : r)),
      );
      toastSuccess("Booking cancelled");
      setCancelOpen(false);
      setCancelReason("");
    } catch {
      toastError("Could not cancel booking");
    } finally {
      setCancelLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!details) return;
    setCheckInLoading(true);
    try {
      const updated = await bookingApi.checkIn(details._id);
      setDetails(updated);
      setRows((prev) =>
        prev.map((r) => (r._id === updated._id ? { ...r, ...updated } : r)),
      );
      toastSuccess("Checked in");
    } catch {
      toastError("Could not check in");
    } finally {
      setCheckInLoading(false);
    }
  };

  const columns = useMemo<Column<BookingRow>[]>(
    () => [
      {
        key: "reference",
        header: "Reference",
        render: (row) => (
          <button
            type="button"
            onClick={() => openDetails(row._id)}
            className="text-left"
          >
            <p className="font-mono text-xs text-text-primary hover:text-secondary-600">
              {row.reference}
            </p>
            <p className="text-xs text-text-muted">
              {formatDate(row.createdAt)}
            </p>
          </button>
        ),
      },
      {
        key: "stay",
        header: "Stay",
        render: (row) => {
          const propertyName = getPopulatedName(
            row.property,
            row.propertyName,
          );
          const roomName =
            typeof row.room === "object" && row.room
              ? row.room.name
              : row.roomName || "";
          return (
            <div>
              <p className="text-sm text-text-primary">
                {propertyName}
                {roomName ? ` · ${roomName}` : ""}
              </p>
              <p className="text-xs text-text-muted">
                {formatDate(row.checkIn)} → {formatDate(row.checkOut)}
              </p>
            </div>
          );
        },
      },
      {
        key: "guests",
        header: "Guests",
        render: (row) => (
          <span className="text-sm text-text-secondary">
            {guestsLabel(row.guests)}
          </span>
        ),
      },
      {
        key: "total",
        header: "Total",
        render: (row) => (
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-text-primary">
              {money(row.total, row.currency)}
            </p>
            {row.paymentStatus ? (
              <Badge variant={paymentVariant(row.paymentStatus)}>
                {capitalize(row.paymentStatus)}
              </Badge>
            ) : null}
          </div>
        ),
      },
      {
        key: "status",
        header: "Status",
        render: (row) => (
          <Badge variant={statusVariant(row.status)}>
            {capitalize(row.status.replace(/_/g, " "))}
          </Badge>
        ),
      },
      {
        key: "actions",
        header: "",
        className: "w-12 text-right",
        render: (row) => (
          <div className="flex items-center justify-end gap-2">
            {row.status === "checked_out" && !row.hasReview ? (
              <Link
                to={`/reviews/new?booking=${row._id}`}
                className="inline-flex items-center gap-1 rounded-lg bg-secondary-500 px-2.5 py-1 text-[10px] font-semibold text-white no-underline hover:bg-secondary-600"
              >
                <Star className="h-3 w-3" />
                Review
              </Link>
            ) : null}
            {row.status === "checked_out" && row.hasReview ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                <Check className="h-2.5 w-2.5" />
                Reviewed
              </span>
            ) : null}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => openDetails(row._id)}
            >
              View
            </Button>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Bookings</h1>
        <p className="mt-1 text-sm text-text-muted">
          Manage your accommodation bookings.
        </p>
      </div>

      {justCreated && (
        <Alert variant="success" title="Booking confirmed">
          Reference <span className="font-mono">{justCreated}</span> — a
          confirmation email is on its way.
        </Alert>
      )}

      <Card padded={false}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            fetchData();
          }}
          className="flex flex-wrap gap-3 border-b border-border p-4"
        >
          <div className="min-w-[200px] flex-1">
            <Select
              placeholder="All statuses"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              options={[
                { label: "Pending", value: "pending" },
                { label: "Confirmed", value: "confirmed" },
                { label: "Checked in", value: "checked_in" },
                { label: "Checked out", value: "checked_out" },
                { label: "Cancelled", value: "cancelled" },
                { label: "No show", value: "no_show" },
              ]}
            />
          </div>
          <Button type="submit" variant="secondary">
            Filter
          </Button>
        </form>

        {error && (
          <div className="p-4">
            <Alert variant="danger" title="Failed to load">
              {error}
            </Alert>
          </div>
        )}

        <Table
          columns={columns}
          data={rows}
          loading={loading}
          rowKey={(r) => r._id}
        />

        {meta && meta.totalPages > 1 && (
          <div className="border-t border-border px-4">
            <Pagination
              page={meta.page}
              totalPages={meta.totalPages}
              onChange={setPage}
            />
          </div>
        )}
      </Card>

      <Drawer
        isOpen={!!detailsId}
        onClose={() => setDetailsId(null)}
        title="Booking details"
        width="w-full max-w-md"
      >
        {detailsLoading || !details ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <p className="font-mono text-sm text-text-primary">
                {details.reference}
              </p>
              <Badge variant={statusVariant(details.status)}>
                {capitalize(details.status.replace(/_/g, " "))}
              </Badge>
            </div>

            <div className="rounded-md border border-border bg-surface-alt p-4">
              <p className="text-xs uppercase tracking-wide text-text-muted">
                Total paid
              </p>
              <p className="mt-1 text-2xl font-semibold text-secondary-600">
                {money(details.total, details.currency)}
              </p>
              {details.paymentStatus ? (
                <p className="mt-1 text-xs text-text-muted">
                  Payment: {capitalize(details.paymentStatus)}
                </p>
              ) : null}
            </div>

            <dl className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 text-text-muted" />
                <div>
                  <dt className="text-xs text-text-muted">Property</dt>
                  <dd className="text-text-primary">
                    {getPopulatedName(
                      details.property,
                      details.propertyName,
                    )}
                  </dd>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <DoorOpen className="mt-0.5 h-4 w-4 text-text-muted" />
                <div>
                  <dt className="text-xs text-text-muted">Room</dt>
                  <dd className="text-text-primary">
                    {(() => {
                      const roomNumber = getRoomUnitNumber(
                        details.roomUnit,
                      );
                      if (roomNumber) return `Room ${roomNumber}`;
                      const roomName =
                        typeof details.room === "object" && details.room
                          ? details.room.name
                          : details.roomName;
                      return roomName || "Assigned at check-in";
                    })()}
                  </dd>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="mt-0.5 h-4 w-4 text-text-muted" />
                <div>
                  <dt className="text-xs text-text-muted">Stay</dt>
                  <dd className="text-text-primary">
                    {formatDate(details.checkIn)} →{" "}
                    {formatDate(details.checkOut)}
                  </dd>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Users className="mt-0.5 h-4 w-4 text-text-muted" />
                <div>
                  <dt className="text-xs text-text-muted">Guests</dt>
                  <dd className="text-text-primary">
                    {guestsLabel(details.guests)}
                  </dd>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 text-text-muted" />
                <div>
                  <dt className="text-xs text-text-muted">Booked</dt>
                  <dd className="text-text-primary">
                    {formatDateTime(details.createdAt)}
                  </dd>
                </div>
              </div>
            </dl>

            <div className="flex flex-wrap gap-2 pt-2">
              {details.status === "confirmed" && (
                <Button
                  size="sm"
                  loading={checkInLoading}
                  onClick={handleCheckIn}
                >
                  Check in
                </Button>
              )}
              {["pending", "confirmed"].includes(details.status) && (
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => setCancelOpen(true)}
                >
                  Cancel booking
                </Button>
              )}
              {details.status === "checked_out" && (
                details.review ? (
                  <div className="w-full rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                    <p className="m-0 inline-flex items-center gap-1 text-xs font-semibold text-emerald-900">
                      <Check className="h-3.5 w-3.5" />
                      You reviewed this stay
                    </p>
                    <p className="m-0 mt-1 text-[11px] text-emerald-800">
                      {details.review.rating} star
                      {details.review.rating === 1 ? "" : "s"}
                    </p>
                    <Link
                      to="/reviews"
                      className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-900 underline"
                    >
                      View your review
                    </Link>
                  </div>
                ) : (
                  <Link
                    to={`/reviews/new?booking=${details._id}`}
                    className="inline-flex items-center gap-2 rounded-lg bg-secondary-500 px-4 py-2 text-xs font-semibold text-white no-underline hover:bg-secondary-600"
                  >
                    <Star className="h-3.5 w-3.5" />
                    Leave a review
                  </Link>
                )
              )}
            </div>
          </div>
        )}
      </Drawer>

      <ConfirmDialog
        isOpen={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={handleCancel}
        title="Cancel booking?"
        description="Any applicable refund will be processed based on the property's cancellation policy."
        confirmText="Cancel booking"
        variant="danger"
        loading={cancelLoading}
      />
    </div>
  );
}