import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Store,
  Calendar,
  ShoppingBag,
  Car,
  Wallet,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Activity,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Spinner from "../components/ui/Spinner";
import EmptyState from "../components/ui/EmptyState";
import Alert from "../components/ui/Alert";
import { useSocket } from "../context/socketContext";
import { axiosInstance } from "../api";
import { ROUTES, SOCKET_EVENTS } from "../utils/constants";
import { formatRelative } from "../utils/formatDate";
import { formatNumber } from "../utils/formatNumber";
import { classNames } from "../utils/helpers";
import type {
  DashboardOverview,
  ActivityItem,
  OrderNewPayload,
  TripNewPayload,
  PaymentReceivedPayload,
  PartnerApplicationPayload,
} from "../types";

type AnyRecord = Record<string, unknown>;

function isObject(v: unknown): v is AnyRecord {
  return typeof v === "object" && v !== null;
}

function pickNumber(obj: AnyRecord | undefined, keys: string[]): number {
  if (!obj) return 0;
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "number") return v;
    if (isObject(v) && typeof (v as AnyRecord).count === "number") {
      return (v as AnyRecord).count as number;
    }
  }
  return 0;
}

function pickArray(obj: AnyRecord | undefined, keys: string[]): unknown[] {
  if (!obj) return [];
  for (const k of keys) {
    const v = obj[k];
    if (Array.isArray(v)) return v;
  }
  return [];
}

function normalizeOverview(raw: unknown): DashboardOverview {
  const root = isObject(raw) ? raw : {};
  const data = isObject(root.data) ? (root.data as AnyRecord) : root;

  const totalsSrc =
    (isObject(data.totals) ? (data.totals as AnyRecord) : undefined) ??
    (isObject(data.stats) ? (data.stats as AnyRecord) : undefined) ??
    data;

  const todaySrc =
    (isObject(data.today) ? (data.today as AnyRecord) : undefined) ??
    (isObject(data.todayStats) ? (data.todayStats as AnyRecord) : undefined) ??
    data;

  const totals = {
    customers: pickNumber(totalsSrc, [
      "customers",
      "totalCustomers",
      "customerCount",
    ]),
    restaurants: pickNumber(totalsSrc, [
      "restaurants",
      "totalRestaurants",
      "restaurantCount",
    ]),
    transport: pickNumber(totalsSrc, [
      "transport",
      "totalTransport",
      "transportCount",
    ]),
    accommodations: pickNumber(totalsSrc, [
      "accommodations",
      "totalAccommodations",
      "accommodationCount",
    ]),
  };

  const today = {
    bookings: pickNumber(todaySrc, [
      "bookings",
      "todayBookings",
      "bookingsToday",
    ]),
    orders: pickNumber(todaySrc, ["orders", "todayOrders", "ordersToday"]),
    trips: pickNumber(todaySrc, ["trips", "todayTrips", "tripsToday"]),
    payouts: pickNumber(todaySrc, ["payouts", "todayPayouts", "payoutsToday"]),
  };

  const openDisputes = pickNumber(data, [
    "openDisputes",
    "disputesOpen",
    "openDisputeCount",
  ]);

  const activityRaw = pickArray(data, [
    "recentActivity",
    "activity",
    "recentActivities",
    "feed",
  ]);

  const recentActivity: ActivityItem[] = activityRaw
    .filter(isObject)
    .map((item, idx) => {
      const a = item as AnyRecord;
      const rawType = (a.type ?? "order") as string;
      const type = (
        [
          "order",
          "booking",
          "trip",
          "payment",
          "payout",
          "partner",
          "dispute",
        ] as const
      ).includes(rawType as never)
        ? (rawType as ActivityItem["type"])
        : "order";

      return {
        id: String(a.id ?? a._id ?? `activity-${idx}`),
        type,
        message: String(a.message ?? a.description ?? a.title ?? ""),
        createdAt: String(
          a.createdAt ?? a.timestamp ?? new Date().toISOString()
        ),
      };
    });

  return { totals, today, openDisputes, recentActivity };
}

interface StatCardProps {
  label: string;
  value: number | string;
  hint?: string;
  delta?: number;
  icon: React.ComponentType<{ className?: string }>;
  accent: "primary" | "secondary" | "success" | "warning" | "danger" | "info";
  onClick?: () => void;
}

const ACCENTS: Record<
  NonNullable<StatCardProps["accent"]>,
  { bg: string; fg: string; text: string }
> = {
  primary: {
    bg: "bg-text-primary/10",
    fg: "text-text-primary",
    text: "text-text-primary",
  },
  secondary: {
    bg: "bg-secondary-500/10",
    fg: "text-secondary-600",
    text: "text-secondary-600",
  },
  success: {
    bg: "bg-success/10",
    fg: "text-success",
    text: "text-success",
  },
  warning: {
    bg: "bg-warning/10",
    fg: "text-warning",
    text: "text-warning",
  },
  danger: {
    bg: "bg-danger/10",
    fg: "text-danger",
    text: "text-danger",
  },
  info: {
    bg: "bg-info/10",
    fg: "text-info",
    text: "text-info",
  },
};

function StatCard({
  label,
  value,
  hint,
  delta,
  icon: Icon,
  accent,
  onClick,
}: StatCardProps) {
  const styles = ACCENTS[accent];
  const positive = typeof delta === "number" && delta >= 0;
  const showDelta = typeof delta === "number";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={classNames(
        "group rounded-xl border border-border bg-surface p-4 text-left shadow-sm transition-all",
        onClick && "hover:-translate-y-0.5 hover:shadow-md"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={classNames(
            "flex h-10 w-10 items-center justify-center rounded-lg",
            styles.bg,
            styles.fg
          )}
        >
          <Icon className="h-5 w-5" />
        </span>
        {showDelta && (
          <span
            className={classNames(
              "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold",
              positive
                ? "bg-success/10 text-success"
                : "bg-danger/10 text-danger"
            )}
          >
            {positive ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {positive ? "+" : ""}
            {delta}%
          </span>
        )}
      </div>

      <p className="mt-3 text-xs font-medium uppercase tracking-wide text-text-muted">
        {label}
      </p>
      <p className={classNames("mt-1 text-2xl font-semibold", styles.text)}>
        {value}
      </p>
      {hint && <p className="mt-0.5 text-xs text-text-muted">{hint}</p>}
    </button>
  );
}

function activityVariant(type: ActivityItem["type"]) {
  switch (type) {
    case "order":
    case "booking":
      return "info" as const;
    case "trip":
      return "warning" as const;
    case "payment":
    case "payout":
      return "success" as const;
    case "partner":
      return "secondary" as const;
    case "dispute":
      return "danger" as const;
    default:
      return "neutral" as const;
  }
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { on, off, connected } = useSocket();

  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [live, setLive] = useState(false);

  const fetchOverview = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const res = await axiosInstance.get("/admin/dashboard/overview");
      const normalized = normalizeOverview(res.data);
      setOverview(normalized);
      setActivity(normalized.recentActivity);
    } catch {
      setError("Could not load dashboard data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOverview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const pushActivity = (item: ActivityItem) => {
      setActivity((prev) => [item, ...prev].slice(0, 20));
      setLive(true);
      window.setTimeout(() => setLive(false), 1500);
    };

    const onOrder = (p: OrderNewPayload) => {
      pushActivity({
        id: `order-${p.reference}`,
        type: "order",
        message: `New order ${p.reference} — KES ${formatNumber(p.total)}`,
        createdAt: new Date().toISOString(),
      });
      setOverview((prev) =>
        prev
          ? {
              ...prev,
              today: { ...prev.today, orders: prev.today.orders + 1 },
            }
          : prev
      );
    };

    const onTrip = (p: TripNewPayload) => {
      pushActivity({
        id: `trip-${p.reference}`,
        type: "trip",
        message: `New trip ${p.reference}`,
        createdAt: new Date().toISOString(),
      });
      setOverview((prev) =>
        prev
          ? { ...prev, today: { ...prev.today, trips: prev.today.trips + 1 } }
          : prev
      );
    };

    const onPayment = (p: PaymentReceivedPayload) => {
      pushActivity({
        id: `pay-${p.reference}`,
        type: "payment",
        message: `Payment received ${p.reference} — KES ${formatNumber(
          p.amount
        )}`,
        createdAt: new Date().toISOString(),
      });
    };

    const onPartner = (p: PartnerApplicationPayload) => {
      pushActivity({
        id: `partner-${p.email}`,
        type: "partner",
        message: `New ${p.type} application — ${p.name}`,
        createdAt: new Date().toISOString(),
      });
    };

    on(SOCKET_EVENTS.ORDER_NEW, onOrder as never);
    on(SOCKET_EVENTS.TRIP_NEW, onTrip as never);
    on(SOCKET_EVENTS.PAYMENT_RECEIVED, onPayment as never);
    on(SOCKET_EVENTS.PARTNER_APPLICATION, onPartner as never);

    return () => {
      off(SOCKET_EVENTS.ORDER_NEW, onOrder as never);
      off(SOCKET_EVENTS.TRIP_NEW, onTrip as never);
      off(SOCKET_EVENTS.PAYMENT_RECEIVED, onPayment as never);
      off(SOCKET_EVENTS.PARTNER_APPLICATION, onPartner as never);
    };
  }, [on, off]);

  const totals = overview?.totals;
  const today = overview?.today;

  const partnerTotal = useMemo(() => {
    if (!totals) return 0;
    return totals.restaurants + totals.transport + totals.accommodations;
  }, [totals]);

  const statCards = useMemo<StatCardProps[]>(
    () => [
      {
        label: "Customers",
        value: totals ? formatNumber(totals.customers) : "—",
        icon: Users,
        accent: "primary",
        onClick: () => navigate(ROUTES.CUSTOMERS),
      },
      {
        label: "Partners",
        value: totals ? formatNumber(partnerTotal) : "—",
        hint: totals
          ? `${formatNumber(totals.restaurants)} rest · ${formatNumber(
              totals.transport
            )} transport · ${formatNumber(totals.accommodations)} stay`
          : undefined,
        icon: Store,
        accent: "secondary",
        onClick: () => navigate(ROUTES.PARTNERS),
      },
      {
        label: "Today · Bookings",
        value: today ? formatNumber(today.bookings) : "—",
        icon: Calendar,
        accent: "info",
        onClick: () => navigate(ROUTES.OPERATIONS),
      },
      {
        label: "Today · Orders",
        value: today ? formatNumber(today.orders) : "—",
        icon: ShoppingBag,
        accent: "info",
        onClick: () => navigate(ROUTES.OPERATIONS),
      },
      {
        label: "Today · Trips",
        value: today ? formatNumber(today.trips) : "—",
        icon: Car,
        accent: "info",
        onClick: () => navigate(ROUTES.OPERATIONS),
      },
      {
        label: "Today · Payouts",
        value: today ? formatNumber(today.payouts) : "—",
        icon: Wallet,
        accent: "success",
        onClick: () => navigate(ROUTES.PAYMENTS),
      },
      {
        label: "Open Disputes",
        value: overview ? formatNumber(overview.openDisputes) : "—",
        icon: AlertTriangle,
        accent:
          overview && overview.openDisputes > 0 ? "danger" : "success",
        onClick: () => navigate(ROUTES.DISPUTES),
      },
    ],
    [totals, today, overview, partnerTotal, navigate]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-secondary-600">
            Admin
          </p>
          <h1 className="text-2xl font-semibold text-text-primary">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            Snapshot of platform activity across Kenya.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {live && (
            <Badge variant="success" dot>
              Live
            </Badge>
          )}
          <Badge variant={connected ? "info" : "neutral"} dot>
            {connected ? "Connected" : "Offline"}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            loading={refreshing}
            leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
            onClick={() => fetchOverview(true)}
          >
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="danger" title="Failed to load">
          {error}
        </Alert>
      )}

      {loading && !overview ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {statCards.map((card) => (
              <StatCard key={card.label} {...card} />
            ))}
          </div>

          <Card
            title="Recent activity"
            actions={
              <Badge variant="info" dot={false}>
                {activity.length}
              </Badge>
            }
            padded={false}
          >
            {activity.length === 0 ? (
              <EmptyState
                icon={<Activity className="h-6 w-6" />}
                title="No recent activity"
                description="New events will appear here in real time."
              />
            ) : (
              <ul className="divide-y divide-border">
                {activity.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between gap-3 px-4 py-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <Badge variant={activityVariant(item.type)}>
                        {item.type}
                      </Badge>
                      <p className="truncate text-sm text-text-primary">
                        {item.message}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-text-muted">
                      {formatRelative(item.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <button
              type="button"
              onClick={() => navigate(ROUTES.OPERATIONS)}
              className="rounded-xl border border-border bg-surface p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10 text-info">
                  <Activity className="h-5 w-5" />
                </span>
                <ArrowRight className="h-4 w-4 text-text-muted" />
              </div>
              <p className="mt-3 text-sm font-semibold text-text-primary">
                Operations
              </p>
              <p className="mt-0.5 text-xs text-text-muted">
                Live bookings, orders, trips, and broadcasts.
              </p>
            </button>

            <button
              type="button"
              onClick={() => navigate(ROUTES.PAYMENTS)}
              className="rounded-xl border border-border bg-surface p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10 text-success">
                  <Wallet className="h-5 w-5" />
                </span>
                <ArrowRight className="h-4 w-4 text-text-muted" />
              </div>
              <p className="mt-3 text-sm font-semibold text-text-primary">
                Payments & payouts
              </p>
              <p className="mt-0.5 text-xs text-text-muted">
                Approve payouts and review commissions.
              </p>
            </button>

            <button
              type="button"
              onClick={() => navigate(ROUTES.HEALTH)}
              className="rounded-xl border border-border bg-surface p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary-500/10 text-secondary-600">
                  <TrendingUp className="h-5 w-5" />
                </span>
                <ArrowRight className="h-4 w-4 text-text-muted" />
              </div>
              <p className="mt-3 text-sm font-semibold text-text-primary">
                System health
              </p>
              <p className="mt-0.5 text-xs text-text-muted">
                Database, Redis, email, SMS, AI status.
              </p>
            </button>
          </div>
        </>
      )}
    </div>
  );
}