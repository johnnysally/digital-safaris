import { useEffect, useMemo, useState } from "react";
import { MapPin, Navigation, Car } from "lucide-react";
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
import Modal from "../components/ui/Modal";
import Input from "../components/ui/Input";
import { tripApi } from "../api";
import { useToast } from "../context/toastContext";
import { DEFAULT_PAGE_SIZE } from "../utils/constants";
import { formatCurrency } from "../utils/formatCurrency";
import { formatDateTime } from "../utils/formatDate";
import { capitalize } from "../utils/helpers";
import type { Trip as TripType, PaginationMeta } from "../types";

type Variant = "success" | "warning" | "danger" | "info" | "neutral";

function statusVariant(status: string): Variant {
  switch (status) {
    case "completed":
      return "success";
    case "accepted":
    case "ongoing":
      return "info";
    case "requested":
      return "warning";
    case "cancelled":
    case "failed":
      return "danger";
    default:
      return "neutral";
  }
}

export default function Trip() {
  const { error: toastError, success: toastSuccess } = useToast();
  const [rows, setRows] = useState<TripType[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [details, setDetails] = useState<TripType | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  const [rateOpen, setRateOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState("");
  const [rateLoading, setRateLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await tripApi.list({
        page,
        limit: DEFAULT_PAGE_SIZE,
        status: status || undefined,
      });
      setRows(res.data ?? []);
      setMeta(res.meta ?? null);
    } catch {
      setError("Could not load trips.");
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
      const data = await tripApi.details(id);
      setDetails(data);
    } catch {
      toastError("Could not load trip");
      setDetailsId(null);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!details) return;
    setCancelLoading(true);
    try {
      const updated = await tripApi.cancel(details._id);
      setDetails(updated);
      setRows((prev) =>
        prev.map((r) => (r._id === updated._id ? updated : r))
      );
      toastSuccess("Trip cancelled");
      setCancelOpen(false);
    } catch {
      toastError("Could not cancel trip");
    } finally {
      setCancelLoading(false);
    }
  };

  const handleRate = async () => {
    if (!details) return;
    setRateLoading(true);
    try {
      const updated = await tripApi.rate(details._id, { rating, review });
      setDetails(updated);
      setRows((prev) =>
        prev.map((r) => (r._id === updated._id ? updated : r))
      );
      toastSuccess("Rating submitted");
      setRateOpen(false);
      setReview("");
    } catch {
      toastError("Could not submit rating");
    } finally {
      setRateLoading(false);
    }
  };

  const columns = useMemo<Column<TripType>[]>(
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
              {formatDateTime(row.createdAt)}
            </p>
          </button>
        ),
      },
      {
        key: "route",
        header: "Route",
        render: (row) => (
          <div className="max-w-[220px]">
            <p className="truncate text-xs text-text-secondary">
              {row.pickup?.address}
            </p>
            <p className="truncate text-xs text-text-muted">
              → {row.dropoff?.address}
            </p>
          </div>
        ),
      },
      {
        key: "distanceKm",
        header: "Distance",
        render: (row) => (
          <span className="text-sm text-text-secondary">
            {row.distanceKm ? `${row.distanceKm.toFixed(1)} km` : "—"}
          </span>
        ),
      },
      {
        key: "fare",
        header: "Fare",
        render: (row) => (
          <span className="text-sm font-medium text-text-primary">
            {formatCurrency(row.fare, row.currency)}
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
        <h1 className="text-2xl font-semibold text-text-primary">Trips</h1>
        <p className="mt-1 text-sm text-text-muted">
          Your transport trips on Digital Safaris.
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
                { label: "Requested", value: "requested" },
                { label: "Accepted", value: "accepted" },
                { label: "Ongoing", value: "ongoing" },
                { label: "Completed", value: "completed" },
                { label: "Cancelled", value: "cancelled" },
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
        title="Trip details"
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
                Fare
              </p>
              <p className="mt-1 text-2xl font-semibold text-secondary-600">
                {formatCurrency(details.fare, details.currency)}
              </p>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <Navigation className="mt-0.5 h-4 w-4 text-text-muted" />
                <div>
                  <p className="text-xs text-text-muted">Pickup</p>
                  <p className="text-text-primary">
                    {details.pickup?.address}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 text-text-muted" />
                <div>
                  <p className="text-xs text-text-muted">Dropoff</p>
                  <p className="text-text-primary">
                    {details.dropoff?.address}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Car className="mt-0.5 h-4 w-4 text-text-muted" />
                <div>
                  <p className="text-xs text-text-muted">Driver</p>
                  <p className="text-text-primary">
                    {details.driverName || "Not yet assigned"}
                  </p>
                  {details.driverPhone && (
                    <p className="text-xs text-text-secondary">
                      {details.driverPhone}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {["requested", "accepted"].includes(details.status) && (
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => setCancelOpen(true)}
                >
                  Cancel trip
                </Button>
              )}
              {details.status === "completed" && !details.rating && (
                <Button size="sm" onClick={() => setRateOpen(true)}>
                  Rate driver
                </Button>
              )}
              {details.rating && (
                <Badge variant="success">Rated {details.rating}/5</Badge>
              )}
            </div>
          </div>
        )}
      </Drawer>

      <ConfirmDialog
        isOpen={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={handleCancel}
        title="Cancel trip?"
        description="Your driver will be notified."
        confirmText="Cancel trip"
        variant="danger"
        loading={cancelLoading}
      />

      <Modal
        isOpen={rateOpen}
        onClose={() => setRateOpen(false)}
        title="Rate your trip"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setRateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRate} loading={rateLoading}>
              Submit
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setRating(v)}
                className={
                  "h-10 w-10 rounded-full text-sm font-semibold transition-colors " +
                  (rating >= v
                    ? "bg-secondary-500 text-white"
                    : "bg-surface-alt text-text-muted")
                }
              >
                {v}
              </button>
            ))}
          </div>
          <Input
            label="Review (optional)"
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder="How was your trip?"
          />
        </div>
      </Modal>
    </div>
  );
}