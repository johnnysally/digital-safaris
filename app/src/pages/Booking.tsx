import { useEffect, useMemo, useState } from "react";
import { Calendar, MapPin, Users, Hotel } from "lucide-react";
import Card from "../components/ui/Card";
import Table, { type Column } from "../components/ui/Table";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import Drawer from "../components/ui/Drawer";
import Select from "../components/ui/Select";
import Input from "../components/ui/Input";
import Pagination from "../components/ui/Pagination";
import Alert from "../components/ui/Alert";
import Spinner from "../components/ui/Spinner";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import { bookingApi } from "../api";
import { useToast } from "../context/toastContext";
import { DEFAULT_PAGE_SIZE } from "../utils/constants";
import { formatCurrency } from "../utils/formatCurrency";
import { formatDate, formatDateTime } from "../utils/formatDate";
import { capitalize } from "../utils/helpers";
import type { Booking as BookingType, PaginationMeta } from "../types";

type Variant = "success" | "warning" | "danger" | "info" | "neutral";

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

export default function Booking() {
  const { error: toastError, success: toastSuccess } = useToast();
  const [rows, setRows] = useState<BookingType[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [details, setDetails] = useState<BookingType | null>(null);
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
      setRows(res.data ?? []);
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
      setDetails(data);
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
      const updated = await bookingApi.cancel(details._id, cancelReason || undefined);
      setDetails(updated);
      setRows((prev) =>
        prev.map((r) => (r._id === updated._id ? updated : r))
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
        prev.map((r) => (r._id === updated._id ? updated : r))
      );
      toastSuccess("Checked in");
    } catch {
      toastError("Could not check in");
    } finally {
      setCheckInLoading(false);
    }
  };

  const columns = useMemo<Column<BookingType>[]>(
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
        key: "propertyName",
        header: "Stay",
        render: (row) => (
          <div>
            <p className="text-sm text-text-primary">
              {row.propertyName || row.roomName || "—"}
            </p>
            <p className="text-xs text-text-muted">
              {formatDate(row.checkIn)} → {formatDate(row.checkOut)}
            </p>
          </div>
        ),
      },
      {
        key: "guests",
        header: "Guests",
        render: (row) => (
          <span className="text-sm text-text-secondary">
            {row.guests?.adults ?? 0} adults
            {row.guests?.children ? `, ${row.guests.children} children` : ""}
          </span>
        ),
      },
      {
        key: "total",
        header: "Total",
        render: (row) => (
          <span className="text-sm font-medium text-text-primary">
            {formatCurrency(row.total, row.currency)}
          </span>
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
          <div className="flex justify-end">
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
    []
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Bookings</h1>
        <p className="mt-1 text-sm text-text-muted">
          Manage your accommodation bookings.
        </p>
      </div>

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
                {formatCurrency(details.total, details.currency)}
              </p>
            </div>

            <dl className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <Hotel className="mt-0.5 h-4 w-4 text-text-muted" />
                <div>
                  <dt className="text-xs text-text-muted">Property</dt>
                  <dd className="text-text-primary">
                    {details.propertyName || "—"}
                  </dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="mt-0.5 h-4 w-4 text-text-muted" />
                <div>
                  <dt className="text-xs text-text-muted">Stay</dt>
                  <dd className="text-text-primary">
                    {formatDateTime(details.checkIn)} →{" "}
                    {formatDateTime(details.checkOut)}
                  </dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Users className="mt-0.5 h-4 w-4 text-text-muted" />
                <div>
                  <dt className="text-xs text-text-muted">Guests</dt>
                  <dd className="text-text-primary">
                    {details.guests?.adults ?? 0} adults
                    {details.guests?.children
                      ? `, ${details.guests.children} children`
                      : ""}
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