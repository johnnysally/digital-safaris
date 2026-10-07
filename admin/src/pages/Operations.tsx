import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Card from "../components/ui/Card";
import Table, { type Column } from "../components/ui/Table";
import Tabs from "../components/ui/Tabs";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Badge from "../components/ui/Badge";
import Pagination from "../components/ui/Pagination";
import Alert from "../components/ui/Alert";
import Spinner from "../components/ui/Spinner";
import EmptyState from "../components/ui/EmptyState";
import { operationApi } from "../api";
import { useToast } from "../context/toastContext";
import { DEFAULT_PAGE_SIZE, SOCKET_EVENTS } from "../utils/constants";
import { useSocket } from "../context/socketContext";
import { formatCurrency } from "../utils/formatCurrency";
import { formatDate, formatDateTime } from "../utils/formatDate";
import { capitalize } from "../utils/helpers";
import type {
  Booking,
  Order,
  Trip,
  Broadcast,
  PaginationMeta,
  OrderNewPayload,
  TripNewPayload,
  DineInNewPayload,
  BroadcastNewPayload,
} from "../types";

const TABS = [
  { key: "bookings", label: "Bookings" },
  { key: "orders", label: "Food Orders" },
  { key: "trips", label: "Trips" },
  { key: "broadcasts", label: "Broadcasts" },
];

type StatusVariant = "success" | "warning" | "danger" | "info" | "neutral";

function statusVariant(status: string): StatusVariant {
  switch (status) {
    case "completed":
    case "delivered":
    case "checked_out":
    case "confirmed":
      return "success";
    case "pending":
    case "requested":
    case "preparing":
    case "accepted":
    case "processing":
    case "open":
      return "warning";
    case "in_progress":
    case "out_for_delivery":
    case "ready":
    case "checked_in":
    case "seated":
    case "locked":
      return "info";
    case "cancelled":
    case "failed":
    case "expired":
    case "rejected":
      return "danger";
    default:
      return "neutral";
  }
}

export default function Operations() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const [tab, setTab] = useState("bookings");

  useEffect(() => {
    if (!id) return;
    const path = window.location.pathname;
    if (path.includes("/bookings/")) setTab("bookings");
    else if (path.includes("/orders/")) setTab("orders");
    else if (path.includes("/trips/")) setTab("trips");
    else if (path.includes("/broadcasts/")) setTab("broadcasts");
  }, [id]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">
          Operations
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          Bookings, food orders, trips, and broadcast requests
        </p>
      </div>

      {!id && (
        <Tabs
          tabs={TABS}
          activeKey={tab}
          onChange={(k) => {
            setTab(k);
            navigate("/operations");
          }}
        />
      )}

      {tab === "bookings" && (
        <BookingsTab
          detailId={id}
          onOpen={(bId) => navigate(`/operations/bookings/${bId}`)}
          onBack={() => navigate("/operations")}
        />
      )}
      {tab === "orders" && (
        <OrdersTab
          detailId={id}
          onOpen={(oId) => navigate(`/operations/orders/${oId}`)}
          onBack={() => navigate("/operations")}
        />
      )}
      {tab === "trips" && (
        <TripsTab
          detailId={id}
          onOpen={(tId) => navigate(`/operations/trips/${tId}`)}
          onBack={() => navigate("/operations")}
        />
      )}
      {tab === "broadcasts" && (
        <BroadcastsTab
          detailId={id}
          onOpen={(bId) => navigate(`/operations/broadcasts/${bId}`)}
          onBack={() => navigate("/operations")}
        />
      )}
    </div>
  );
}

function BookingsTab({
  detailId,
  onOpen,
  onBack,
}: {
  detailId?: string;
  onOpen: (id: string) => void;
  onBack: () => void;
}) {
  const { error: toastError } = useToast();
  const { on, off } = useSocket();

  const [rows, setRows] = useState<Booking[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [live, setLive] = useState(false);

  const [detail, setDetail] = useState<Booking | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await operationApi.bookings({
        page,
        limit: DEFAULT_PAGE_SIZE,
        search: search || undefined,
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
    if (detailId) return;
    fetchData();
  }, [page, status, detailId]);

  useEffect(() => {
    if (!detailId) return;
    setDetailLoading(true);
    operationApi
      .bookingDetails(detailId)
      .then(setDetail)
      .catch(() => toastError("Could not load booking"))
      .finally(() => setDetailLoading(false));
  }, [detailId, toastError]);

  useEffect(() => {
    const handler = () => {
      setLive(true);
      setTimeout(() => setLive(false), 1500);
      if (!detailId) fetchData();
    };
    on(SOCKET_EVENTS.ORDER_NEW, handler);
    return () => off(SOCKET_EVENTS.ORDER_NEW, handler);
  }, [on, off, detailId]);

  const columns = useMemo<Column<Booking>[]>(
    () => [
      {
        key: "reference",
        header: "Reference",
        render: (row) => (
          <button
            type="button"
            onClick={() => onOpen(row._id)}
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
        key: "customerName",
        header: "Customer",
        render: (row) => (
          <span className="text-sm text-text-primary">{row.customerName}</span>
        ),
      },
      {
        key: "partnerName",
        header: "Partner",
        render: (row) => (
          <div>
            <p className="text-sm text-text-secondary">{row.partnerName}</p>
            <p className="text-xs text-text-muted capitalize">
              {row.partnerType}
            </p>
          </div>
        ),
      },
      {
        key: "stay",
        header: "Stay",
        render: (row) => (
          <span className="text-xs text-text-secondary">
            {formatDate(row.checkIn)} → {formatDate(row.checkOut)}
          </span>
        ),
      },
      {
        key: "guests",
        header: "Guests",
        render: (row) => (
          <span className="text-sm text-text-secondary">{row.guests}</span>
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
              onClick={() => onOpen(row._id)}
            >
              View
            </Button>
          </div>
        ),
      },
    ],
    [onOpen]
  );

  if (detailId) {
    return (
      <DetailShell
        title="Booking"
        loading={detailLoading}
        onBack={onBack}
        body={
          detail && (
            <div className="space-y-4">
              <Row label="Reference" value={detail.reference} mono />
              <Row label="Customer" value={detail.customerName} />
              <Row label="Partner" value={detail.partnerName} />
              <Row label="Partner type" value={capitalize(detail.partnerType)} />
              <Row label="Check-in" value={formatDateTime(detail.checkIn)} />
              <Row label="Check-out" value={formatDateTime(detail.checkOut)} />
              <Row label="Guests" value={String(detail.guests)} />
              <Row
                label="Total"
                value={formatCurrency(detail.total, detail.currency)}
              />
              <Row
                label="Status"
                value={
                  <Badge variant={statusVariant(detail.status)}>
                    {capitalize(detail.status.replace(/_/g, " "))}
                  </Badge>
                }
              />
              <Row label="Created" value={formatDateTime(detail.createdAt)} />
            </div>
          )
        }
      />
    );
  }

  return (
    <>
      {live && (
        <Alert variant="info" title="Live update">
          A new booking just came in.
        </Alert>
      )}

      <Card padded={false}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            fetchData();
          }}
          className="grid grid-cols-1 gap-3 border-b border-border p-4 md:grid-cols-4"
        >
          <Input
            placeholder="Search reference, customer…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
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
              { label: "Completed", value: "completed" },
              { label: "Cancelled", value: "cancelled" },
              { label: "Refunded", value: "refunded" },
            ]}
          />
          <div className="flex gap-2 md:col-span-2">
            <Button type="submit" variant="secondary" fullWidth>
              Search
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setSearch("");
                setStatus("");
                setPage(1);
                setTimeout(fetchData, 0);
              }}
            >
              Reset
            </Button>
          </div>
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
    </>
  );
}

function OrdersTab({
  detailId,
  onOpen,
  onBack,
}: {
  detailId?: string;
  onOpen: (id: string) => void;
  onBack: () => void;
}) {
  const { error: toastError } = useToast();
  const { on, off } = useSocket();

  const [rows, setRows] = useState<Order[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [detail, setDetail] = useState<Order | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await operationApi.orders({
        page,
        limit: DEFAULT_PAGE_SIZE,
        search: search || undefined,
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
    if (detailId) return;
    fetchData();
  }, [page, status, detailId]);

  useEffect(() => {
    if (!detailId) return;
    setDetailLoading(true);
    operationApi
      .orderDetails(detailId)
      .then(setDetail)
      .catch(() => toastError("Could not load order"))
      .finally(() => setDetailLoading(false));
  }, [detailId, toastError]);

  useEffect(() => {
    const handler = (_: OrderNewPayload) => {
      if (!detailId) fetchData();
    };
    const dineHandler = (_: DineInNewPayload) => {
      if (!detailId) fetchData();
    };
    on(SOCKET_EVENTS.ORDER_NEW, handler);
    on(SOCKET_EVENTS.DINEIN_NEW, dineHandler);
    return () => {
      off(SOCKET_EVENTS.ORDER_NEW, handler);
      off(SOCKET_EVENTS.DINEIN_NEW, dineHandler);
    };
  }, [on, off, detailId]);

  const columns = useMemo<Column<Order>[]>(
    () => [
      {
        key: "reference",
        header: "Reference",
        render: (row) => (
          <button
            type="button"
            onClick={() => onOpen(row._id)}
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
        key: "customerName",
        header: "Customer",
        render: (row) => (
          <span className="text-sm text-text-primary">{row.customerName}</span>
        ),
      },
      {
        key: "partnerName",
        header: "Restaurant",
        render: (row) => (
          <span className="text-sm text-text-secondary">{row.partnerName}</span>
        ),
      },
      {
        key: "items",
        header: "Items",
        render: (row) => (
          <span className="text-sm text-text-secondary">
            {row.items.length} item{row.items.length === 1 ? "" : "s"}
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
            <Button size="sm" variant="ghost" onClick={() => onOpen(row._id)}>
              View
            </Button>
          </div>
        ),
      },
    ],
    [onOpen]
  );

  if (detailId) {
    return (
      <DetailShell
        title="Order"
        loading={detailLoading}
        onBack={onBack}
        body={
          detail && (
            <div className="space-y-4">
              <Row label="Reference" value={detail.reference} mono />
              <Row label="Customer" value={detail.customerName} />
              <Row label="Restaurant" value={detail.partnerName} />
              <Row
                label="Status"
                value={
                  <Badge variant={statusVariant(detail.status)}>
                    {capitalize(detail.status.replace(/_/g, " "))}
                  </Badge>
                }
              />

              <div className="rounded-md border border-border bg-surface-alt p-3">
                <p className="mb-2 text-xs uppercase tracking-wide text-text-muted">
                  Items
                </p>
                <ul className="divide-y divide-border">
                  {detail.items.map((item, i) => (
                    <li
                      key={i}
                      className="flex items-center justify-between py-1.5 text-sm"
                    >
                      <span className="text-text-primary">
                        {item.quantity}× {item.name}
                      </span>
                      <span className="font-medium text-text-primary">
                        {formatCurrency(item.total, detail.currency)}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 space-y-1 border-t border-border pt-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-muted">Subtotal</span>
                    <span className="text-text-primary">
                      {formatCurrency(detail.subtotal, detail.currency)}
                    </span>
                  </div>
                  {detail.deliveryFee !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-text-muted">Delivery fee</span>
                      <span className="text-text-primary">
                        {formatCurrency(detail.deliveryFee, detail.currency)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold">
                    <span className="text-text-primary">Total</span>
                    <span className="text-secondary-600">
                      {formatCurrency(detail.total, detail.currency)}
                    </span>
                  </div>
                </div>
              </div>

              <Row label="Created" value={formatDateTime(detail.createdAt)} />
            </div>
          )
        }
      />
    );
  }

  return (
    <Card padded={false}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          fetchData();
        }}
        className="grid grid-cols-1 gap-3 border-b border-border p-4 md:grid-cols-4"
      >
        <Input
          placeholder="Search reference, customer…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
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
        <div className="flex gap-2 md:col-span-2">
          <Button type="submit" variant="secondary" fullWidth>
            Search
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setSearch("");
              setStatus("");
              setPage(1);
              setTimeout(fetchData, 0);
            }}
          >
            Reset
          </Button>
        </div>
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
  );
}

function TripsTab({
  detailId,
  onOpen,
  onBack,
}: {
  detailId?: string;
  onOpen: (id: string) => void;
  onBack: () => void;
}) {
  const { error: toastError } = useToast();
  const { on, off } = useSocket();

  const [rows, setRows] = useState<Trip[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [detail, setDetail] = useState<Trip | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await operationApi.trips({
        page,
        limit: DEFAULT_PAGE_SIZE,
        search: search || undefined,
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
    if (detailId) return;
    fetchData();
  }, [page, status, detailId]);

  useEffect(() => {
    if (!detailId) return;
    setDetailLoading(true);
    operationApi
      .tripDetails(detailId)
      .then(setDetail)
      .catch(() => toastError("Could not load trip"))
      .finally(() => setDetailLoading(false));
  }, [detailId, toastError]);

  useEffect(() => {
    const handler = (_: TripNewPayload) => {
      if (!detailId) fetchData();
    };
    on(SOCKET_EVENTS.TRIP_NEW, handler);
    return () => off(SOCKET_EVENTS.TRIP_NEW, handler);
  }, [on, off, detailId]);

  const columns = useMemo<Column<Trip>[]>(
    () => [
      {
        key: "reference",
        header: "Reference",
        render: (row) => (
          <button
            type="button"
            onClick={() => onOpen(row._id)}
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
        key: "customerName",
        header: "Customer",
        render: (row) => (
          <span className="text-sm text-text-primary">{row.customerName}</span>
        ),
      },
      {
        key: "partnerName",
        header: "Driver",
        render: (row) => (
          <span className="text-sm text-text-secondary">{row.partnerName}</span>
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
            <Button size="sm" variant="ghost" onClick={() => onOpen(row._id)}>
              View
            </Button>
          </div>
        ),
      },
    ],
    [onOpen]
  );

  if (detailId) {
    return (
      <DetailShell
        title="Trip"
        loading={detailLoading}
        onBack={onBack}
        body={
          detail && (
            <div className="space-y-4">
              <Row label="Reference" value={detail.reference} mono />
              <Row label="Customer" value={detail.customerName} />
              <Row label="Driver" value={detail.partnerName} />
              <Row
                label="Status"
                value={
                  <Badge variant={statusVariant(detail.status)}>
                    {capitalize(detail.status.replace(/_/g, " "))}
                  </Badge>
                }
              />
              <Row
                label="Distance"
                value={
                  detail.distanceKm ? `${detail.distanceKm.toFixed(1)} km` : "—"
                }
              />
              <Row
                label="Fare"
                value={formatCurrency(detail.fare, detail.currency)}
              />
              <AddressRow label="Pickup" address={detail.pickup} />
              <AddressRow label="Dropoff" address={detail.dropoff} />
              <Row label="Created" value={formatDateTime(detail.createdAt)} />
            </div>
          )
        }
      />
    );
  }

  return (
    <Card padded={false}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          fetchData();
        }}
        className="grid grid-cols-1 gap-3 border-b border-border p-4 md:grid-cols-4"
      >
        <Input
          placeholder="Search reference, customer…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
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
            { label: "In progress", value: "in_progress" },
            { label: "Completed", value: "completed" },
            { label: "Cancelled", value: "cancelled" },
          ]}
        />
        <div className="flex gap-2 md:col-span-2">
          <Button type="submit" variant="secondary" fullWidth>
            Search
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setSearch("");
              setStatus("");
              setPage(1);
              setTimeout(fetchData, 0);
            }}
          >
            Reset
          </Button>
        </div>
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
  );
}

function BroadcastsTab({
  detailId,
  onOpen,
  onBack,
}: {
  detailId?: string;
  onOpen: (id: string) => void;
  onBack: () => void;
}) {
  const { error: toastError } = useToast();
  const { on, off } = useSocket();

  const [rows, setRows] = useState<Broadcast[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [detail, setDetail] = useState<Broadcast | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await operationApi.broadcasts({
        page,
        limit: DEFAULT_PAGE_SIZE,
        search: search || undefined,
        status: status || undefined,
      });
      setRows(res.data ?? []);
      setMeta(res.meta ?? null);
    } catch {
      setError("Could not load broadcasts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (detailId) return;
    fetchData();
  }, [page, status, detailId]);

  useEffect(() => {
    if (!detailId) return;
    setDetailLoading(true);
    operationApi
      .broadcastDetails(detailId)
      .then(setDetail)
      .catch(() => toastError("Could not load broadcast"))
      .finally(() => setDetailLoading(false));
  }, [detailId, toastError]);

  useEffect(() => {
    const newHandler = (_: BroadcastNewPayload) => {
      if (!detailId) fetchData();
    };
    on(SOCKET_EVENTS.BROADCAST_NEW, newHandler);
    return () => off(SOCKET_EVENTS.BROADCAST_NEW, newHandler);
  }, [on, off, detailId]);

  const columns = useMemo<Column<Broadcast>[]>(
    () => [
      {
        key: "reference",
        header: "Reference",
        render: (row) => (
          <button
            type="button"
            onClick={() => onOpen(row._id)}
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
        key: "customerName",
        header: "Customer",
        render: (row) => (
          <span className="text-sm text-text-primary">{row.customerName}</span>
        ),
      },
      {
        key: "foodType",
        header: "Food",
        render: (row) => (
          <span className="text-sm text-text-secondary">{row.foodType}</span>
        ),
      },
      {
        key: "budget",
        header: "Budget",
        render: (row) => (
          <span className="text-sm font-medium text-text-primary">
            {formatCurrency(row.budget, row.currency)}
          </span>
        ),
      },
      {
        key: "radiusKm",
        header: "Radius",
        render: (row) => (
          <span className="text-sm text-text-secondary">{row.radiusKm} km</span>
        ),
      },
      {
        key: "status",
        header: "Status",
        render: (row) => (
          <Badge variant={statusVariant(row.status)}>
            {capitalize(row.status)}
          </Badge>
        ),
      },
      {
        key: "actions",
        header: "",
        className: "w-12 text-right",
        render: (row) => (
          <div className="flex justify-end">
            <Button size="sm" variant="ghost" onClick={() => onOpen(row._id)}>
              View
            </Button>
          </div>
        ),
      },
    ],
    [onOpen]
  );

  if (detailId) {
    return (
      <DetailShell
        title="Broadcast"
        loading={detailLoading}
        onBack={onBack}
        body={
          detail && (
            <div className="space-y-4">
              <Row label="Reference" value={detail.reference} mono />
              <Row label="Customer" value={detail.customerName} />
              <Row label="Food type" value={detail.foodType} />
              <Row
                label="Budget"
                value={formatCurrency(detail.budget, detail.currency)}
              />
              <Row label="Radius" value={`${detail.radiusKm} km`} />
              <Row
                label="Status"
                value={
                  <Badge variant={statusVariant(detail.status)}>
                    {capitalize(detail.status)}
                  </Badge>
                }
              />
              <Row
                label="Accepted by"
                value={detail.acceptedByName ?? "Not yet accepted"}
              />
              <Row label="Expires" value={formatDateTime(detail.expiresAt)} />
              <Row label="Created" value={formatDateTime(detail.createdAt)} />
            </div>
          )
        }
      />
    );
  }

  return (
    <Card padded={false}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          fetchData();
        }}
        className="grid grid-cols-1 gap-3 border-b border-border p-4 md:grid-cols-4"
      >
        <Input
          placeholder="Search reference, customer…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select
          placeholder="All statuses"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          options={[
            { label: "Open", value: "open" },
            { label: "Locked", value: "locked" },
            { label: "Cancelled", value: "cancelled" },
            { label: "Expired", value: "expired" },
          ]}
        />
        <div className="flex gap-2 md:col-span-2">
          <Button type="submit" variant="secondary" fullWidth>
            Search
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setSearch("");
              setStatus("");
              setPage(1);
              setTimeout(fetchData, 0);
            }}
          >
            Reset
          </Button>
        </div>
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
  );
}

function DetailShell({
  title,
  loading,
  onBack,
  body,
}: {
  title: string;
  loading: boolean;
  onBack: () => void;
  body: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          ← Back
        </Button>
        <h2 className="text-xl font-semibold text-text-primary">{title}</h2>
      </div>
      <Card>
        {loading ? (
          <div className="flex justify-center py-10">
            <Spinner size="lg" />
          </div>
        ) : body ? (
          body
        ) : (
          <EmptyState title="Not found" />
        )}
      </Card>
    </div>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="grid grid-cols-3 gap-2 border-b border-border py-2 last:border-0">
      <dt className="text-xs uppercase tracking-wide text-text-muted">
        {label}
      </dt>
      <dd
        className={
          "col-span-2 text-sm text-text-primary " +
          (mono ? "font-mono text-xs" : "")
        }
      >
        {value}
      </dd>
    </div>
  );
}

function AddressRow({
  label,
  address,
}: {
  label: string;
  address?: {
    line1?: string;
    line2?: string;
    town?: string;
    county?: string;
    country?: string;
  };
}) {
  const text = address
    ? [address.line1, address.line2, address.town, address.county, address.country]
        .filter(Boolean)
        .join(", ")
    : "—";
  return <Row label={label} value={text || "—"} />;
}