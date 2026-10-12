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
import { axiosInstance, healthApi } from "../api";
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
import type { HealthResponse } from "../api/healthApi";

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
    bg: "bg-[#eee4d5]",
    fg: "text-[#78542b]",
    text: "text-[#30271f]",
  },
  secondary: {
    bg: "bg-[#f4e6ce]",
    fg: "text-[#a46b24]",
    text: "text-[#8b5c20]",
  },
  success: {
    bg: "bg-[#e6efe5]",
    fg: "text-[#557452]",
    text: "text-[#557452]",
  },
  warning: {
    bg: "bg-[#fbeddc]",
    fg: "text-[#ae702b]",
    text: "text-[#9a6427]",
  },
  danger: {
    bg: "bg-[#f8e7e3]",
    fg: "text-[#a4584b]",
    text: "text-[#a4584b]",
  },
  info: {
    bg: "bg-[#e8edf0]",
    fg: "text-[#617781]",
    text: "text-[#526c76]",
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
        "group min-w-0 rounded-2xl border border-[#e9e0d4] bg-white p-4 text-left shadow-[0_4px_16px_rgba(55,39,22,.045)] transition-all duration-200",
        onClick && "cursor-pointer hover:-translate-y-0.5 hover:border-[#d9c29f] hover:shadow-[0_10px_26px_rgba(55,39,22,.09)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b8792b]"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={classNames(
            "flex size-11 items-center justify-center rounded-xl",
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

      <p className="mt-4 text-[10px] font-semibold uppercase tracking-[.13em] text-[#887b6b]">
        {label}
      </p>
      <p className={classNames("mt-1 truncate text-2xl font-semibold tracking-[-.03em] sm:text-[1.8rem]", styles.text)}>
        {value}
      </p>
      {hint && <p className="mt-1 truncate text-[11px] text-[#8d8173]" title={hint}>{hint}</p>}
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

interface HealthSlice {
  label: string;
  value: number;
  color: string;
  shade: string;
  matches: string[];
}

function getHealthSlices(health: HealthResponse): HealthSlice[] {
  const statuses = [
    health.server.status,
    health.database.status,
    health.redis.status,
    health.email.status,
    health.sms.status,
    health.ai.status,
    health.mpesa.status,
    health.stripe.status,
    health.storage.status,
    health.firebase.status,
    health.backups.status,
  ];
  const groups = [
    { label: "Healthy", color: "#54c542", shade: "#238529", matches: ["up", "enabled", "connected", "healthy"] },
    { label: "Degraded", color: "#ff9d18", shade: "#c45d0c", matches: ["degraded", "connecting"] },
    { label: "Needs attention", color: "#e64b3c", shade: "#a62727", matches: ["down", "error", "unhealthy"] },
    { label: "Inactive / unknown", color: "#19b9c2", shade: "#087c91", matches: [] },
  ];
  const counts = new Map(groups.map(({ label }) => [label, 0]));

  statuses.forEach((status) => {
    const normalized = status.toLowerCase();
    const group = groups.find((item) => item.matches.includes(normalized)) ?? groups[3];
    counts.set(group.label, (counts.get(group.label) ?? 0) + 1);
  });

  return groups.map(({ label, color, shade, matches }) => ({
    label,
    color,
    shade,
    matches,
    value: counts.get(label) ?? 0,
  }));
}

function pieSlicePath(start: number, end: number, offsetX: number, offsetY: number) {
  const centerX = 145 + offsetX;
  const centerY = 99 + offsetY;
  const radiusX = 108;
  const radiusY = 69;
  const startX = centerX + radiusX * Math.cos(start);
  const startY = centerY + radiusY * Math.sin(start);
  const endX = centerX + radiusX * Math.cos(end);
  const endY = centerY + radiusY * Math.sin(end);
  const largeArc = end - start > Math.PI ? 1 : 0;
  return `M ${centerX} ${centerY} L ${startX} ${startY} A ${radiusX} ${radiusY} 0 ${largeArc} 1 ${endX} ${endY} Z`;
}

function SystemHealthChart({ health }: { health: HealthResponse }) {
  const slices = getHealthSlices(health);
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  let angle = -Math.PI / 2;
  const arcs = slices.map((slice) => {
    const start = angle;
    angle += total ? (slice.value / total) * Math.PI * 2 : 0;
    const middle = start + (angle - start) / 2;
    return {
      ...slice,
      start: start + 0.012,
      end: angle - 0.012,
      percent: total ? Math.round((slice.value / total) * 100) : 0,
      offsetX: slice.value ? Math.cos(middle) * 5 : 0,
      offsetY: slice.value ? Math.sin(middle) * 4 : 0,
      middle,
    };
  });

  return (
    <div className="grid items-center gap-5 bg-[radial-gradient(ellipse_at_40%_0%,rgba(246,217,171,.28),transparent_55%),linear-gradient(130deg,#fffaf2,#f4ead9)] p-4 sm:p-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(17rem,.8fr)]">
      <div className="mx-auto w-full max-w-[560px]">
        <svg className="h-auto w-full overflow-visible drop-shadow-[0_14px_13px_rgba(74,48,20,.15)]" viewBox="0 0 300 222" role="img" aria-labelledby="system-health-chart-title system-health-chart-description">
          <title id="system-health-chart-title">System health distribution</title>
          <desc id="system-health-chart-description">{arcs.map((slice) => `${slice.value} ${slice.label.toLowerCase()} (${slice.percent} percent)`).join(", ")} across {total} monitored subsystems.</desc>
          <defs>
            <linearGradient id="healthPieShine" x1="0" y1="0" x2="0.9" y2="1">
              <stop offset="0%" stopColor="#fff" stopOpacity=".27" />
              <stop offset="48%" stopColor="#fff" stopOpacity=".02" />
              <stop offset="100%" stopColor="#24170e" stopOpacity=".12" />
            </linearGradient>
          </defs>
          <ellipse cx="145" cy="195" rx="108" ry="14" fill="#382a1d" opacity=".13" />
          {total > 0 ? (
            <>
              {[25, 20, 15, 10, 5].map((depth) => arcs.filter((slice) => slice.value > 0).map((slice) => (
                <path
                  key={`${slice.label}-${depth}`}
                  d={pieSlicePath(slice.start, slice.end, slice.offsetX, slice.offsetY + depth)}
                  fill={slice.shade}
                  stroke={slice.shade}
                  strokeWidth="1"
                />
              )))}
              {arcs.filter((slice) => slice.value > 0).map((slice) => (
                <g key={slice.label}>
                  <path d={pieSlicePath(slice.start, slice.end, slice.offsetX, slice.offsetY)} fill={slice.color} stroke="#fff5e8" strokeWidth="1.5" />
                  <path d={pieSlicePath(slice.start, slice.end, slice.offsetX, slice.offsetY)} fill="url(#healthPieShine)" />
                  {slice.percent >= 7 && (
                    <text
                      x={145 + slice.offsetX + Math.cos(slice.middle) * 62}
                      y={99 + slice.offsetY + Math.sin(slice.middle) * 42 + 4}
                      fill="#fff"
                      fontSize="14"
                      fontWeight="800"
                      textAnchor="middle"
                      paintOrder="stroke"
                      stroke="rgba(35,25,14,.22)"
                      strokeWidth="2"
                    >
                      {slice.percent}%
                    </text>
                  )}
                </g>
              ))}
            </>
          ) : (
            <>
              <path d="M 145 99 L 253 99 A 108 69 0 1 1 37 99 A 108 69 0 1 1 253 99 Z" transform="translate(0 25)" fill="#c9bda9" />
              <ellipse cx="145" cy="99" rx="108" ry="69" fill="#e1d5c3" />
              <text x="145" y="103" fill="#78684f" fontSize="12" fontWeight="600" textAnchor="middle">No subsystem data</text>
            </>
          )}
        </svg>
        <div className="flex items-center justify-center gap-2 text-xs font-medium text-[#806f58]">
          <span className="size-2 rounded-full bg-[#66866a]" />
          {total} monitored subsystems
        </div>
      </div>
      <div className="rounded-2xl border border-white/10 bg-[linear-gradient(145deg,rgba(47,38,29,.97),rgba(34,29,24,.98))] p-4 text-white shadow-[0_12px_30px_rgba(49,35,21,.17)] sm:p-5">
        <div className="mb-4 flex items-end justify-between gap-3 border-b border-white/10 pb-3">
          <div>
            <p className="m-0 text-[9px] font-bold uppercase tracking-[.2em] text-[#e0a94e]">Live overview</p>
            <h3 className="mb-0 mt-1 text-sm font-semibold text-white">Subsystem status</h3>
          </div>
          <span className="text-[10px] text-white/50">{total} checks</span>
        </div>
        <div className="grid gap-1">
        {arcs.map((slice) => (
          <div className="rounded-xl px-2.5 py-2.5 transition-colors hover:bg-white/[.06]" key={slice.label}>
            <div className="flex items-center gap-3">
              <span className="size-3 shrink-0 rounded-full shadow-[0_0_10px_currentColor]" style={{ backgroundColor: slice.color, color: slice.color }} />
              <span className="min-w-0 flex-1 text-xs font-medium text-white/90">{slice.label}</span>
              <strong className="text-xs font-bold tabular-nums text-white">{slice.percent}%</strong>
            </div>
            <div className="ml-6 mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${slice.percent}%`, backgroundColor: slice.color }} />
            </div>
            <p className="mb-0 ml-6 mt-1 text-[9px] text-white/45">{slice.value} of {total} subsystems</p>
          </div>
        ))}
        </div>
        <p className="mb-0 mt-3 border-t border-white/10 pt-3 text-[9px] leading-relaxed text-white/45">Status distribution is calculated from the latest system health check.</p>
      </div>
    </div>
  );
}

function TodayOperationsChart({
  operations,
}: {
  operations: DashboardOverview["today"];
}) {
  const series = [
    { label: "Bookings", value: operations.bookings, color: "#ff991b", side: "#c15a0b", gloss: "#ffd271" },
    { label: "Orders", value: operations.orders, color: "#35c75a", side: "#16823e", gloss: "#8bea70" },
    { label: "Trips", value: operations.trips, color: "#168ff0", side: "#0754b4", gloss: "#78c9ff" },
    { label: "Payouts", value: operations.payouts, color: "#a83ae8", side: "#6c1fa9", gloss: "#da8cff" },
  ];
  const total = series.reduce((sum, item) => sum + item.value, 0);
  const maximum = Math.max(4, ...series.map((item) => item.value));
  const chartTop = 30;
  const chartBottom = 220;
  const chartHeight = chartBottom - chartTop;
  const barWidth = 64;
  const depth = 11;
  const centers = [105, 255, 405, 555];

  return (
    <section className="overflow-hidden rounded-2xl border border-[#e9e0d4] bg-white shadow-[0_12px_30px_rgba(55,39,22,.07)]" aria-label="Today's operations chart">
      <div className="relative isolate overflow-hidden px-4 pb-2 pt-5 text-[#30271f] sm:px-6">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_88%_0%,rgba(226,183,125,.18),transparent_38%),linear-gradient(135deg,#fffdf9,#fbf6ed_58%,#f7f0e5)]" />
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="mb-1 text-[9px] font-bold uppercase tracking-[.2em] text-[#a46b24]">Live operations</p>
            <h2 className="m-0 text-base font-semibold text-[#30271f] sm:text-lg">Today’s activity overview</h2>
            <p className="mb-0 mt-1 text-xs text-[#887b6b]">Bookings, orders, trips, and payouts recorded today.</p>
          </div>
          <div className="rounded-xl border border-[#eadcc8] bg-white/80 px-3 py-2 text-right shadow-sm">
            <span className="block text-[9px] font-semibold uppercase tracking-[.12em] text-[#887b6b]">Total operations</span>
            <strong className="mt-0.5 block text-xl font-semibold tabular-nums text-[#382f26]">{formatNumber(total)}</strong>
          </div>
        </div>
      </div>

      <div className="grid items-center gap-4 px-2 pb-4 sm:px-5 sm:pb-5 xl:grid-cols-[minmax(0,1fr)_14rem]">
        <div className="min-w-0 overflow-x-auto">
          <svg className="mx-auto block min-w-[560px] w-full max-w-[820px]" viewBox="0 0 660 280" role="img" aria-labelledby="operations-chart-title operations-chart-desc">
            <title id="operations-chart-title">Today's operation volumes</title>
            <desc id="operations-chart-desc">{series.map(({ label, value }) => `${label}: ${value}`).join(". ")}.</desc>
            <defs>
              {series.map((item, index) => (
                <linearGradient id={`operations-bar-${index}`} key={item.label} x1="0" y1="0" x2="0.9" y2="1">
                  <stop offset="0%" stopColor={item.gloss} />
                  <stop offset="32%" stopColor={item.color} />
                  <stop offset="100%" stopColor={item.side} />
                </linearGradient>
              ))}
              <linearGradient id="operations-floor" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#e9dece" />
                <stop offset="100%" stopColor="#d9c9b3" />
              </linearGradient>
            </defs>
            {[0, 1, 2, 3, 4].map((step) => {
              const y = chartBottom - (chartHeight * step) / 4;
              const tick = Math.round((maximum * step) / 4);
              return (
                <g key={step}>
                  <line x1="54" y1={y} x2="625" y2={y} stroke="#9b8973" strokeOpacity={step === 0 ? ".38" : ".2"} strokeDasharray={step === 0 ? undefined : "3 5"} />
                  <text x="43" y={y + 3} fill="#887b6b" fontSize="9" textAnchor="end">{formatNumber(tick)}</text>
                </g>
              );
            })}
            <path d={`M 54 ${chartBottom} L 625 ${chartBottom} L 636 ${chartBottom + depth} L 65 ${chartBottom + depth} Z`} fill="url(#operations-floor)" opacity=".9" />
            {series.map((item, index) => {
              const x = centers[index] - barWidth / 2;
              const height = item.value ? Math.max(5, (item.value / maximum) * chartHeight) : 0;
              const y = chartBottom - height;
              return (
                <g key={item.label}>
                  {height > 0 && (
                    <>
                      <path d={`M ${x + barWidth} ${y} L ${x + barWidth + depth} ${y - depth * .55} L ${x + barWidth + depth} ${chartBottom + depth} L ${x + barWidth} ${chartBottom} Z`} fill={item.side} />
                      <path d={`M ${x} ${y} L ${x + depth} ${y - depth * .55} L ${x + barWidth + depth} ${y - depth * .55} L ${x + barWidth} ${y} Z`} fill={item.gloss} />
                      <rect x={x} y={y} width={barWidth} height={height} rx="5" fill={`url(#operations-bar-${index})`} stroke={item.gloss} strokeOpacity=".65" />
                      <line x1={x + 7} y1={Math.min(y + 10, chartBottom - 3)} x2={x + 7} y2={chartBottom - 4} stroke="#fff" strokeOpacity=".24" strokeWidth="2" />
                    </>
                  )}
                  <text x={centers[index] + depth / 2} y={Math.max(chartTop - 2, y - depth * .55 - 9)} fill="#382f26" fontSize="11" fontWeight="700" textAnchor="middle">{formatNumber(item.value)}</text>
                  <text x={centers[index]} y="254" fill="#6e6254" fontSize="10" fontWeight="600" textAnchor="middle">{item.label}</text>
                </g>
              );
            })}
          </svg>
        </div>

        <div className="grid grid-cols-2 gap-2 xl:grid-cols-1">
          {series.map((item) => (
            <div className="flex items-center gap-2.5 rounded-xl border border-[#eee5d9] bg-[#fffdf9] px-3 py-2.5" key={item.label}>
              <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="min-w-0 flex-1 text-xs font-medium text-[#6e6254]">{item.label}</span>
              <strong className="text-sm font-semibold tabular-nums text-[#382f26]">{formatNumber(item.value)}</strong>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-[#eee5d9] bg-[#fffdf9] px-4 py-2.5 text-[10px] text-[#887b6b] sm:px-6">
        Live totals from the admin dashboard overview · Updated as activity arrives
      </div>
    </section>
  );
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
  const [systemHealth, setSystemHealth] = useState<HealthResponse | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);

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
    let active = true;
    const fetchHealth = async () => {
      try {
        const health = await healthApi.get();
        if (active) {
          setSystemHealth(health);
          setHealthError(null);
        }
      } catch {
        if (active) setHealthError("System health data is unavailable right now.");
      } finally {
        if (active) setHealthLoading(false);
      }
    };
    void fetchHealth();
    const interval = window.setInterval(() => void fetchHealth(), 30000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
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
      <header className="relative isolate overflow-hidden rounded-2xl border border-[#e4d1b6] bg-[#3b2a1c] px-5 py-6 shadow-[0_12px_30px_rgba(55,39,22,.11)] sm:px-7 sm:py-7">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_88%_8%,rgba(221,166,91,.32),transparent_34%),linear-gradient(110deg,#34271d_0%,#594127_62%,#805c34_100%)]" />
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[.2em] text-[#e5bd83]">Platform overview</p>
            <h1 className="m-0 text-2xl font-semibold tracking-[-.03em] text-white sm:text-3xl">Good day, Admin</h1>
            <p className="mb-0 mt-2 text-sm text-white/75">A live snapshot of operations and activity across Digital Safaris.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {live && <Badge variant="success" dot>Live</Badge>}
            <span className={`inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1.5 text-xs font-medium ${connected ? "bg-white/10 text-[#f5e8cf]" : "bg-black/10 text-white/70"}`}>
              <span className={`size-2 rounded-full ${connected ? "bg-[#8dc08a]" : "bg-[#c8b8a4]"}`} />
              {connected ? "Live connection" : "Offline"}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="border-white/25 bg-white/10 text-white hover:bg-white/20"
              loading={refreshing}
              leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
              onClick={() => fetchOverview(true)}
            >
              Refresh
            </Button>
          </div>
        </div>
      </header>

      {error && <Alert variant="danger" title="Failed to load">{error}</Alert>}

      {loading && !overview ? (
        <div className="flex justify-center rounded-2xl border border-[#e9e0d4] bg-white/75 py-16">
          <Spinner size="lg" />
        </div>
      ) : (
        <>
          <section aria-label="Platform metrics">
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <h2 className="m-0 text-base font-semibold text-[#30271f]">At a glance</h2>
                <p className="mb-0 mt-1 text-xs text-[#887b6b]">Key platform totals and today’s activity.</p>
              </div>
              <span className="hidden text-[11px] text-[#938777] sm:block">{new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {statCards.map((card) => <StatCard key={card.label} {...card} />)}
            </div>
          </section>

          {today ? <TodayOperationsChart operations={today} /> : null}

          <Card
            title="System health"
            actions={
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    systemHealth?.status === "healthy"
                      ? "success"
                      : systemHealth?.status === "degraded"
                        ? "warning"
                        : systemHealth?.status === "unhealthy"
                          ? "danger"
                          : "neutral"
                  }
                  dot
                >
                  {healthLoading && !systemHealth ? "Checking" : systemHealth?.status ?? "Unavailable"}
                </Badge>
                <Button variant="ghost" size="sm" onClick={() => navigate(ROUTES.HEALTH)}>
                  View details
                </Button>
              </div>
            }
            padded={false}
          >
            {systemHealth ? (
              <SystemHealthChart health={systemHealth} />
            ) : (
              <div className="p-5">
                {healthError ? (
                  <Alert variant="warning" title="Health chart unavailable">
                    {healthError}
                  </Alert>
                ) : (
                  <div className="flex items-center gap-3 py-4 text-sm text-text-muted">
                    <Spinner size="sm" /> Checking subsystem status…
                  </div>
                )}
              </div>
            )}
          </Card>

          <div className="grid min-w-0 items-start gap-5 2xl:grid-cols-[minmax(0,1.7fr)_minmax(18rem,.8fr)]">
            <Card
              title="Recent activity"
              actions={<Badge variant="secondary" dot={false}>{activity.length} events</Badge>}
              padded={false}
            >
              {activity.length === 0 ? (
                <EmptyState
                  icon={<Activity className="h-6 w-6" />}
                  title="No recent activity"
                  description="New events will appear here in real time."
                />
              ) : (
                <ul className="divide-y divide-[#eee7dd]">
                  {activity.map((item) => (
                    <li key={item.id} className="flex items-center justify-between gap-4 px-4 py-3.5 transition-colors hover:bg-[#fcfaf6] sm:px-5">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#f5ecdf] text-[#8c642e]"><Activity className="size-4" /></span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-[#382f26]">{item.message}</p>
                          <div className="mt-1 flex items-center gap-2">
                            <Badge variant={activityVariant(item.type)}>{item.type}</Badge>
                            <span className="text-[10px] text-[#958979]">{formatRelative(item.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="size-4 shrink-0 text-[#b5a58f]" />
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <section aria-label="Admin shortcuts" className="space-y-3">
              <div>
                <h2 className="m-0 text-base font-semibold text-[#30271f]">Quick access</h2>
                <p className="mb-0 mt-1 text-xs text-[#887b6b]">Frequently used admin areas.</p>
              </div>
              {[
                { title: "Operations", detail: "Live bookings, orders, trips, and broadcasts.", icon: Activity, to: ROUTES.OPERATIONS, tone: "bg-[#e8edf0] text-[#617781]" },
                { title: "Payments & payouts", detail: "Approve payouts and review commissions.", icon: Wallet, to: ROUTES.PAYMENTS, tone: "bg-[#e6efe5] text-[#557452]" },
                { title: "System health", detail: "Database, Redis, email, SMS, AI status.", icon: TrendingUp, to: ROUTES.HEALTH, tone: "bg-[#f4e6ce] text-[#a46b24]" },
              ].map(({ title, detail, icon: Icon, to, tone }) => (
                <button key={title} type="button" onClick={() => navigate(to)} className="group flex w-full items-center gap-3 rounded-2xl border border-[#e9e0d4] bg-white p-4 text-left shadow-[0_3px_12px_rgba(55,39,22,.035)] transition-all hover:-translate-y-0.5 hover:border-[#d9c29f] hover:shadow-[0_8px_22px_rgba(55,39,22,.08)]">
                  <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${tone}`}><Icon className="size-[18px]" /></span>
                  <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-[#382f26]">{title}</span><span className="mt-1 block text-xs leading-relaxed text-[#887b6b]">{detail}</span></span>
                  <ArrowRight className="size-4 shrink-0 text-[#a99983] transition-transform group-hover:translate-x-1 group-hover:text-[#8b5c20]" />
                </button>
              ))}
            </section>
          </div>
        </>
      )}
    </div>
  );
}