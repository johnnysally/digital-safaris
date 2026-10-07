import { useEffect, useMemo, useState } from "react";
import { MapPin, Utensils } from "lucide-react";
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
import { orderApi } from "../api";
import { useToast } from "../context/toastContext";
import { DEFAULT_PAGE_SIZE } from "../utils/constants";
import { formatCurrency } from "../utils/formatCurrency";
import { formatDateTime } from "../utils/formatDate";
import { capitalize } from "../utils/helpers";
import type { Order as OrderType, PaginationMeta } from "../types";

type Variant = "success" | "warning" | "danger" | "info" | "neutral";

function statusVariant(status: string): Variant {
  switch (status) {
    case "delivered":
    case "completed":
    case "accepted":
      return "success";
    case "pending":
    case "preparing":
      return "warning";
    case "ready":
    case "out_for_delivery":
      return "info";
    case "cancelled":
    case "rejected":
      return "danger";
    default:
      return "neutral";
  }
}

export default function Order() {
  const { error: toastError, success: toastSuccess } = useToast();
  const [rows, setRows] = useState<OrderType[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [details, setDetails] = useState<OrderType | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [reorderLoading, setReorderLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await orderApi.list({
        page,
        limit: DEFAULT_PAGE_SIZE,
        status: status || undefined,
      });
      setRows(res.data ?? []);
      setMeta(res.meta ?? null);
    } catch {
      setError("Could not load orders.");
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
      const data = await orderApi.details(id);
      setDetails(data);
    } catch {
      toastError("Could not load order");
      setDetailsId(null);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!details) return;
    setCancelLoading(true);
    try {
      const updated = await orderApi.cancel(details._id);
      setDetails(updated);
      setRows((prev) =>
        prev.map((r) => (r._id === updated._id ? updated : r))
      );
      toastSuccess("Order cancelled");
      setCancelOpen(false);
    } catch {
      toastError("Could not cancel order");
    } finally {
      setCancelLoading(false);
    }
  };

  const handleReorder = async () => {
    if (!details) return;
    setReorderLoading(true);
    try {
      await orderApi.reorder(details._id);
      toastSuccess("Order placed", "A new order has been created.");
      setDetailsId(null);
      fetchData();
    } catch {
      toastError("Could not reorder");
    } finally {
      setReorderLoading(false);
    }
  };

  const columns = useMemo<Column<OrderType>[]>(
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
        key: "restaurantName",
        header: "Restaurant",
        render: (row) => (
          <span className="text-sm text-text-primary">
            {row.restaurantName || "—"}
          </span>
        ),
      },
      {
        key: "items",
        header: "Items",
        render: (row) => (
          <span className="text-sm text-text-secondary">
            {row.items?.length ?? 0} item
            {(row.items?.length ?? 0) === 1 ? "" : "s"}
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
        <h1 className="text-2xl font-semibold text-text-primary">Orders</h1>
        <p className="mt-1 text-sm text-text-muted">
          Track and manage your food orders.
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
                { label: "Accepted", value: "accepted" },
                { label: "Preparing", value: "preparing" },
                { label: "Ready", value: "ready" },
                { label: "Out for delivery", value: "out_for_delivery" },
                { label: "Delivered", value: "delivered" },
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
        title="Order details"
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

            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <Utensils className="h-4 w-4 text-text-muted" />
              {details.restaurantName || "—"}
            </div>

            <div className="rounded-md border border-border bg-surface-alt p-4">
              <p className="mb-2 text-xs uppercase tracking-wide text-text-muted">
                Items
              </p>
              <ul className="divide-y divide-border">
                {details.items.map((item, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between py-2 text-sm"
                  >
                    <span className="text-text-primary">
                      {item.quantity}× {item.name}
                    </span>
                    <span className="font-medium text-text-primary">
                      {formatCurrency(item.subtotal, details.currency)}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 space-y-1 border-t border-border pt-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-muted">Subtotal</span>
                  <span className="text-text-primary">
                    {formatCurrency(details.subtotal, details.currency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Delivery</span>
                  <span className="text-text-primary">
                    {formatCurrency(details.deliveryFee, details.currency)}
                  </span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span className="text-text-primary">Total</span>
                  <span className="text-secondary-600">
                    {formatCurrency(details.total, details.currency)}
                  </span>
                </div>
              </div>
            </div>

            {details.deliveryAddress && (
              <div className="flex items-start gap-3 text-sm">
                <MapPin className="mt-0.5 h-4 w-4 text-text-muted" />
                <div>
                  <p className="text-xs text-text-muted">Delivery address</p>
                  <p className="text-text-primary">
                    {[
                      details.deliveryAddress.address,
                      details.deliveryAddress.town,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-2">
              {["pending", "accepted"].includes(details.status) && (
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => setCancelOpen(true)}
                >
                  Cancel order
                </Button>
              )}
              {["delivered", "completed", "cancelled"].includes(
                details.status
              ) && (
                <Button
                  size="sm"
                  variant="ghost"
                  loading={reorderLoading}
                  onClick={handleReorder}
                >
                  Reorder
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
        title="Cancel order?"
        description="The restaurant may already be preparing your food. Refund depends on their policy."
        confirmText="Cancel order"
        variant="danger"
        loading={cancelLoading}
      />
    </div>
  );
}