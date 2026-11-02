import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BedDouble,
  CalendarDays,
  CalendarPlus,
  ChartNoAxesColumnIncreasing,
  CheckCircle2,
  Coins,
  Gauge,
  MessageSquareText,
  Star,
  UserRound,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import dashboardApi, {
  type DashboardOverview,
} from "../../api/accommodation/dashboardApi";
import { getApiErrorMessage } from "../../api/axios";
import {
  AccommodationPartnerLayout,
  StatusBadge,
} from "../../components/layout/Layout";
import { formatCurrency } from "../../utils/formatCurrency";
import { formatDate, formatRelativeDate } from "../../utils/formatDate";
import { partnerImages } from "../../config/partnerImages";
import { formatLabel, formatPersonName } from "../../utils/helpers";

const panelClass =
  "min-w-0 overflow-hidden rounded-[9px] border border-[#e9dfd1] bg-[rgba(255,252,247,.82)] shadow-[0_3px_12px_rgba(54,37,20,.035)]";
const panelTitleClass =
  "font-serif text-[15px] font-semibold text-[#29231e]";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();
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
  fallback?: string | null,
): string {
  if (value && typeof value === "object" && "name" in value) {
    const name = (value as { name?: string }).name;
    if (name) return name;
  }
  return fallback || "—";
}

export function DashboardPage() {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    dashboardApi
      .overview()
      .then((data) => {
        if (!cancelled) setOverview(data);
      })
      .catch((err) => {
        if (!cancelled)
          setError(
            getApiErrorMessage(err, "Could not load dashboard data."),
          );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reload]);

  const partner = overview?.partner;
  const metrics = overview?.metrics;
  const recentBookings = overview?.recentBookings ?? [];
  const trendData = overview?.bookingTrend ?? [];
  const currency = metrics?.currency || "KES";

  const activities = useMemo(() => {
    const items: Array<{
      key: string;
      title: string;
      detail: string;
      time: string;
      icon: typeof CheckCircle2;
    }> = [];

    for (const booking of recentBookings.slice(0, 3)) {
      items.push({
        key: `booking-${booking._id}`,
        title: `Booking ${formatLabel(booking.status)}`,
        detail: `${formatPersonName(booking.customer)} · ${formatDate(
          booking.createdAt,
        )}`,
        time: formatRelativeDate(booking.createdAt),
        icon: CheckCircle2,
      });
    }

    return items;
  }, [recentBookings]);

  return (
    <AccommodationPartnerLayout partner={partner}>
      <div className="w-full">
        <div className="mb-4">
          <h1 className="m-0 font-serif text-[clamp(22px,1.7vw,30px)] font-semibold leading-tight tracking-[-0.02em] text-[#29231e]">
            Good morning, {partner?.name ?? "Partner"}
          </h1>
          <p className="mt-1.5 text-[clamp(12px,.9vw,15px)] text-[#4f4943]">
            Here's what's happening with your property today.
          </p>
        </div>

        {error ? (
          <div
            className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-md border border-[#eed3cf] bg-[#fff8f7] px-3 py-2 text-[11px] text-[#914940]"
            role="alert"
          >
            <span>{error}</span>
            <button
              className="border-0 bg-transparent font-semibold text-[#914940] underline"
              type="button"
              onClick={() => setReload((current) => current + 1)}
            >
              Retry
            </button>
          </div>
        ) : null}

        <section
          className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
          aria-label="Property overview"
        >
          <MetricCard
            icon={CalendarDays}
            label="Total Bookings"
            value={String(metrics?.totalBookings ?? 0)}
            note={`${metrics?.bookingsToday ?? 0} today`}
          />
          <MetricCard
            icon={UserRound}
            label="Check-ins Today"
            value={String(metrics?.checkInsToday ?? 0)}
            note={new Date().toLocaleDateString("en-KE", {
              month: "short",
              day: "numeric",
            })}
          />
          <MetricCard
            icon={Gauge}
            label="Occupancy Now"
            value={`${metrics?.occupancyRate ?? 0}%`}
            note={`${metrics?.occupiedRoomUnits ?? 0} of ${
              metrics?.activeRoomUnits ?? 0
            } rooms in use`}
          />
          <MetricCard
            icon={Coins}
            label="Revenue (This Month)"
            value={formatCurrency(metrics?.monthRevenue ?? 0, currency, {
              maximumFractionDigits: 0,
            })}
            note="Partner earnings · confirmed"
            noteTone="positive"
          />
        </section>

        <div className="mb-5 grid grid-cols-1 items-stretch gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(350px,.9fr)]">
          <section className={panelClass}>
            <div className="flex min-h-[40px] items-center justify-between gap-3 border-b border-[#eee5d9] px-3 py-2">
              <h2 className={panelTitleClass}>Recent Bookings</h2>
              <Link
                className="inline-flex items-center gap-1 text-[9px] font-medium text-[#895017] no-underline hover:underline"
                to="/partner/accommodation/bookings"
              >
                View all bookings <ArrowRight size={12} />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-[10px]">
                <thead className="bg-[#f8f2e8] text-[#49433d]">
                  <tr>
                    {["Guest", "Property", "Check-in", "Status", "Amount"].map(
                      (heading) => (
                        <th
                          className="whitespace-nowrap px-3 py-2 font-medium"
                          key={heading}
                        >
                          {heading}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {recentBookings.map((booking) => {
                    const guestName = formatPersonName(booking.customer);
                    const propertyName = getPopulatedName(
                      booking.property,
                      booking.propertyName,
                    );
                    return (
                      <tr
                        className="border-b border-[#eee7dd] last:border-0"
                        key={booking._id}
                      >
                        <td className="whitespace-nowrap px-3 py-2">
                          <span className="flex items-center gap-2">
                            {booking.customer?.avatar ? (
                              <img
                                className="h-7 w-7 rounded-full object-cover"
                                src={booking.customer.avatar}
                                alt=""
                              />
                            ) : (
                              <span
                                className="grid h-7 w-7 place-items-center rounded-full bg-[#ead9bd] text-[9px] font-semibold text-[#704718]"
                                aria-hidden="true"
                              >
                                {initials(guestName)}
                              </span>
                            )}
                            {guestName}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-2">
                          {propertyName}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2">
                          {formatDate(booking.checkIn, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-3 py-2">
                          <StatusBadge
                            status={formatLabel(booking.status)}
                          />
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 font-medium">
                          {formatCurrency(
                            booking.total,
                            booking.currency,
                            { maximumFractionDigits: 0 },
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {!loading && recentBookings.length === 0 ? (
                <div className="flex min-h-[130px] flex-col items-center justify-center gap-1 px-4 text-center text-[11px] text-[#81766a]">
                  <strong className="text-[#332b24]">No bookings yet</strong>
                  <span>New reservations will appear here.</span>
                </div>
              ) : null}
            </div>
          </section>

          <aside className={`${panelClass} flex flex-col`}>
            <div className="relative h-[120px] shrink-0 bg-[#d7c09e]">
              <img
                className="h-full w-full object-cover"
                src={
                  partner?.coverImage ||
                  partner?.logo ||
                  partnerImages.accommodation.dashboardFallback
                }
                alt={partner?.name || "Safari accommodation"}
              />
              <span className="absolute right-2 top-2 rounded-md bg-[#f1f8eb] px-2 py-1 text-[9px] font-semibold text-[#317445]">
                Active
              </span>
            </div>
            <div className="flex flex-1 flex-col justify-between p-3">
              <div>
                <h2 className={`${panelTitleClass} text-[14px]`}>
                  {partner?.name || "Your property"}
                </h2>
                <p className="mt-0.5 text-[10px] text-[#70675e]">
                  {partner?.type || "Accommodation"}
                </p>
                <div className="mt-2 flex items-center gap-1 text-[10px] text-[#423a32]">
                  <Star
                    className="text-[#e49a22]"
                    size={13}
                    fill="currentColor"
                  />
                  <strong>{(partner?.rating ?? 0).toFixed(1)}</strong>
                  <span>({partner?.totalRatings ?? 0} reviews)</span>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-3 divide-x divide-[#eee5d9] border-t border-[#eee5d9] pt-2.5">
                <SummaryMetric
                  icon={BedDouble}
                  value={String(metrics?.activeRoomUnits ?? 0)}
                  label="Rooms"
                />
                <SummaryMetric
                  icon={CalendarDays}
                  value={String(metrics?.totalBookings ?? 0)}
                  label="Bookings"
                />
                <SummaryMetric
                  icon={Coins}
                  value={formatCurrency(
                    metrics?.monthRevenue ?? 0,
                    currency,
                    { maximumFractionDigits: 0 },
                  )}
                  label="Revenue (This Month)"
                />
              </div>
            </div>
          </aside>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 2xl:grid-cols-[minmax(0,.95fr)_minmax(0,1.05fr)_minmax(0,1fr)]">
          <section className={`${panelClass} p-4 2xl:p-3`}>
            <h2 className={`${panelTitleClass} mb-2 text-[12px]`}>
              Quick Actions
            </h2>
            <div className="grid grid-cols-2 gap-2">
              <QuickAction
                to="/partner/accommodation/properties/new"
                icon={CalendarPlus}
                title="Add Property"
                description="Create a new listing"
              />
              <QuickAction
                to="/partner/accommodation/bookings"
                icon={CalendarDays}
                title="Manage Bookings"
                description="View reservations"
              />
              <QuickAction
                to="/partner/accommodation/notifications"
                icon={MessageSquareText}
                title="Notifications"
                description="Recent account activity"
              />
              <QuickAction
                to="/partner/accommodation/reports"
                icon={ChartNoAxesColumnIncreasing}
                title="View Reports"
                description="Check performance"
              />
            </div>
          </section>

          <section className={`${panelClass} p-4 2xl:p-3`}>
            <div className="mb-2 flex items-center justify-between gap-2">
              <h2 className={`${panelTitleClass} text-[12px]`}>
                Booking Trends
              </h2>
              <span className="rounded border border-[#e8dfd3] px-2 py-1 text-[8px] text-[#5e554c]">
                Last 7 days
              </span>
            </div>
            <div className="h-[210px] min-w-0 2xl:h-[190px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={trendData}
                  margin={{ top: 8, right: 5, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="accommodationBookingFill"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="#d8801d"
                        stopOpacity={0.2}
                      />
                      <stop
                        offset="100%"
                        stopColor="#d8801d"
                        stopOpacity={0.02}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#eee6db" vertical />
                  <XAxis
                    dataKey="day"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#8d847a", fontSize: 8 }}
                  />
                  <YAxis
                    allowDecimals={false}
                    width={28}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#8d847a", fontSize: 8 }}
                  />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="count"
                    name="Bookings"
                    stroke="#cf7914"
                    strokeWidth={2}
                    fill="url(#accommodationBookingFill)"
                    dot={{ r: 2.5, fill: "#cf7914", strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section
            className={`${panelClass} p-4 2xl:p-3 xl:col-span-2 2xl:col-span-1`}
          >
            <h2 className={`${panelTitleClass} mb-1 text-[12px]`}>
              Recent Activity
            </h2>
            <div>
              {activities.map(({ key, title, detail, time, icon: Icon }) => (
                <div
                  className="flex items-center gap-2.5 border-b border-[#eee7dd] py-2 last:border-0"
                  key={key}
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#f5ecdc] text-[#8e5116]">
                    <Icon size={14} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <strong className="block truncate text-[9px] font-medium text-[#332b24]">
                      {title}
                    </strong>
                    <span className="block truncate text-[8px] text-[#82786f]">
                      {detail}
                    </span>
                  </div>
                  <time className="shrink-0 text-[8px] text-[#82786f]">
                    {time}
                  </time>
                </div>
              ))}
              {!loading && activities.length === 0 ? (
                <div className="flex items-center gap-2.5 py-3 text-[10px] text-[#82786f]">
                  <CheckCircle2 size={16} />
                  <span>No recent activity yet.</span>
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </div>
    </AccommodationPartnerLayout>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  note,
  noteTone = "neutral",
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string;
  note: string;
  noteTone?: "positive" | "neutral";
}) {
  return (
    <div className="flex min-h-[112px] min-w-0 items-center gap-4 rounded-[9px] border border-[#e9dfd1] bg-[rgba(255,252,247,.82)] px-4 py-4 shadow-[0_3px_12px_rgba(54,37,20,.035)] 2xl:min-h-[128px] 2xl:gap-5 2xl:px-5">
      <span className="grid h-[48px] w-[48px] shrink-0 place-items-center rounded-full bg-[#f5ead8] text-[#8b4e16] 2xl:h-[54px] 2xl:w-[54px]">
        <Icon size={23} />
      </span>
      <div className="min-w-0">
        <p className="truncate text-[11px] font-medium text-[#39332d] 2xl:text-[13px]">
          {label}
        </p>
        <strong className="mt-1 block truncate text-[25px] font-semibold leading-tight tracking-[-0.04em] text-[#24201c] 2xl:text-[30px]">
          {value}
        </strong>
        <span
          className={`mt-1.5 block truncate text-[9px] 2xl:text-[10px] ${
            noteTone === "positive"
              ? "text-[#25803e]"
              : "text-[#82786f]"
          }`}
        >
          {note}
        </span>
      </div>
    </div>
  );
}

function SummaryMetric({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof BedDouble;
  value: string;
  label: string;
}) {
  return (
    <div className="flex min-w-0 items-center justify-center gap-1.5 px-1 text-[#764518]">
      <Icon className="shrink-0" size={14} />
      <div className="min-w-0">
        <strong className="block truncate text-[10px] font-semibold text-[#332b24]">
          {value}
        </strong>
        <span className="block truncate text-[8px] text-[#82786f]">
          {label}
        </span>
      </div>
    </div>
  );
}

function QuickAction({
  to,
  icon: Icon,
  title,
  description,
}: {
  to: string;
  icon: typeof CalendarPlus;
  title: string;
  description: string;
}) {
  return (
    <Link
      className="flex min-h-[64px] flex-col justify-center rounded-[7px] border border-[#eee5d9] bg-[#fffcf7] px-2 py-1.5 text-[#332b24] no-underline transition-colors hover:border-[#dfc9a8] hover:bg-[#fbf3e7]"
      to={to}
    >
      <span className="mb-1 grid h-7 w-7 place-items-center rounded-full bg-[#f5ead8] text-[#8b4e16]">
        <Icon size={14} />
      </span>
      <strong className="text-[9px] font-medium leading-tight">
        {title}
      </strong>
      <small className="mt-0.5 truncate text-[8px] text-[#82786f]">
        {description}
      </small>
    </Link>
  );
}