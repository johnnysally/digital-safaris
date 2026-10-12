import { useEffect, useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowDownRight, ArrowUpRight, BarChart3, CalendarDays, ClipboardList, Download, RefreshCw, ShoppingBag, Star, UtensilsCrossed, type LucideIcon } from "lucide-react";
import bookingApi from "../../api/restaurant/bookingApi";
import orderApi from "../../api/restaurant/orderApi";
import ratingApi from "../../api/restaurant/ratingApi";
import { getApiErrorMessage } from "../../api/axios";
import type { DineInBooking, Order, RatingSummary } from "../../types";
import { formatCurrency } from "../../utils/formatCurrency";

type ReportPeriod = 7 | 30 | 90;

const periods: Array<{ value: ReportPeriod; label: string }> = [
	{ value: 7, label: "7 days" },
	{ value: 30, label: "30 days" },
	{ value: 90, label: "90 days" },
];

function dayKey(date: Date) {
	const keyDate = new Date(date);
	keyDate.setHours(0, 0, 0, 0);
	return keyDate.toISOString().slice(0, 10);
}

function getCustomerCount(orders: Order[]) {
	return new Set(orders.map((order) => order.customer?._id).filter(Boolean)).size;
}

function formatPercent(value: number) {
	return `${value.toFixed(1)}%`;
}

export function RestaurantReportsPage() {
	const [orders, setOrders] = useState<Order[]>([]);
	const [bookings, setBookings] = useState<DineInBooking[]>([]);
	const [rating, setRating] = useState<RatingSummary | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [period, setPeriod] = useState<ReportPeriod>(30);
	const [reload, setReload] = useState(0);

	useEffect(() => {
		let cancelled = false;
		async function loadReportData() {
			setLoading(true);
			setError("");
			const results = await Promise.allSettled([
				orderApi.list({ limit: 100 }),
				bookingApi.list({ limit: 100 }),
				ratingApi.summary(),
			]);
			if (cancelled) return;
			const [orderResult, bookingResult, ratingResult] = results;
			if (orderResult.status === "fulfilled") setOrders(orderResult.value.data);
			else setOrders([]);
			if (bookingResult.status === "fulfilled") setBookings(bookingResult.value.data);
			else setBookings([]);
			if (ratingResult.status === "fulfilled") setRating(ratingResult.value);
			else setRating(null);

			const failures = results.flatMap((result, index) => result.status === "rejected"
				? [`${["orders", "bookings", "guest ratings"][index]}: ${getApiErrorMessage(result.reason, "Request failed.")}`]
				: []);
			setError(failures.length ? `Some report data could not be loaded (${failures.join("; ")}).` : "");
			setLoading(false);
		}
		void loadReportData();
		return () => { cancelled = true; };
	}, [reload]);

	const startDate = useMemo(() => {
		const start = new Date();
		start.setHours(0, 0, 0, 0);
		start.setDate(start.getDate() - (period - 1));
		return start;
	}, [period]);
	const periodOrders = useMemo(() => orders.filter((order) => new Date(order.createdAt) >= startDate), [orders, startDate]);
	const periodBookings = useMemo(() => bookings.filter((booking) => new Date(booking.createdAt) >= startDate), [bookings, startDate]);
	const completedOrders = periodOrders.filter((order) => ["completed", "delivered"].includes(order.status));
	const revenue = completedOrders.reduce((sum, order) => sum + order.total, 0);
	const currency = periodOrders[0]?.currency ?? orders[0]?.currency ?? "KES";
	const cancelledOrders = periodOrders.filter((order) => ["cancelled", "rejected"].includes(order.status)).length;
	const cancellationRate = periodOrders.length ? cancelledOrders / periodOrders.length * 100 : 0;
	const customerCount = getCustomerCount(periodOrders);
	const completionRate = periodOrders.length ? completedOrders.length / periodOrders.length * 100 : 0;
	const averageOrderValue = completedOrders.length ? revenue / completedOrders.length : 0;
	const periodLabel = `${startDate.toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${new Date().toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`;

	const trendData = useMemo(() => Array.from({ length: period }, (_, index) => {
		const date = new Date(startDate);
		date.setDate(date.getDate() + index);
		const key = dayKey(date);
		const dailyOrders = periodOrders.filter((order) => dayKey(new Date(order.createdAt)) === key);
		const dailyCompleted = dailyOrders.filter((order) => ["completed", "delivered"].includes(order.status));
		return {
			date: date.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
			revenue: dailyCompleted.reduce((sum, order) => sum + order.total, 0),
			orders: dailyOrders.length,
		};
	}), [period, periodOrders, startDate]);
	const popularItems = useMemo(() => {
		const itemCounts = new Map<string, number>();
		periodOrders.forEach((order) => order.items.forEach((item) => itemCounts.set(item.name, (itemCounts.get(item.name) ?? 0) + item.quantity)));
		return [...itemCounts.entries()].sort((first, second) => second[1] - first[1]).slice(0, 5);
	}, [periodOrders]);
	const maxItemQuantity = Math.max(1, ...popularItems.map(([, quantity]) => quantity));

	function downloadReport() {
		const rows = [
			["Restaurant performance report", `Last ${period} days`],
			["Generated", new Date().toLocaleString()],
			[],
			["Metric", "Value"],
			["Orders", String(periodOrders.length)],
			["Completed revenue", `${currency} ${revenue.toFixed(2)}`],
			["Bookings", String(periodBookings.length)],
			["Guest rating", `${(rating?.average ?? 0).toFixed(1)} / 5`],
			[],
			["Date", "Orders", `Completed revenue (${currency})`],
			...trendData.map((day) => [day.date, String(day.orders), day.revenue.toFixed(2)]),
		];
		const csv = rows.map((row) => row.map((value) => {
			const text = String(value ?? "");
			const safeText = /^[=+\-@]/.test(text) ? `'${text}` : text;
			return `"${safeText.replace(/"/g, '""')}"`;
		}).join(",")).join("\r\n");
		const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
		const link = document.createElement("a");
		link.href = url;
		link.download = `restaurant-report-${period}-days.csv`;
		link.click();
		URL.revokeObjectURL(url);
	}

	return (
		<div className="grid gap-6">
			<header className="overflow-hidden rounded-2xl border border-[#ead8c7] bg-[linear-gradient(115deg,#fffaf4_0%,#fff5e9_58%,#f5dfca_100%)] p-5 shadow-[0_8px_24px_rgba(68,43,29,.045)] sm:p-7">
				<div className="flex flex-wrap items-end justify-between gap-5">
					<div className="max-w-xl">
						<p className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#f8e5d6] px-3 py-1 text-xs font-semibold uppercase tracking-[.1em] text-[#985039]"><BarChart3 size={14} aria-hidden="true" /> Restaurant performance</p>
						<h1 className="m-0 text-3xl font-semibold tracking-[-.04em] text-[#33251f] sm:text-4xl">Reports &amp; insights</h1>
						<p className="mb-0 mt-2 text-sm leading-relaxed text-[#786a60]">Understand sales, service activity, popular dishes, and guest sentiment in one place.</p>
						<p className="mb-0 mt-4 inline-flex items-center gap-2 text-xs font-medium text-[#8f7060]"><CalendarDays size={14} aria-hidden="true" /> {periodLabel} <span className="text-[#c6a994]">·</span> Updated from your latest available records</p>
					</div>
					<div className="flex flex-wrap items-center gap-2">
						<label className="sr-only" htmlFor="report-period">Report period</label>
						<select className="min-h-11 rounded-lg border border-[#ead8c7] bg-white/85 px-3 text-sm font-semibold text-[#704631] outline-none focus:border-[#b85e3f] focus:ring-2 focus:ring-[#f3d7c8]" id="report-period" value={period} onChange={(event) => setPeriod(Number(event.target.value) as ReportPeriod)}>
							{periods.map(({ value, label }) => <option key={value} value={value}>Last {label}</option>)}
						</select>
						<button className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[#ead8c7] bg-white/85 px-4 text-sm font-semibold text-[#704631] transition-colors hover:bg-[#f8eee1] disabled:opacity-50" type="button" onClick={() => setReload((value) => value + 1)} disabled={loading}>
							<RefreshCw className={loading ? "animate-spin" : ""} size={16} aria-hidden="true" /> Refresh
						</button>
						<button className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#b85e3f] px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#98472f] disabled:opacity-50" type="button" onClick={downloadReport} disabled={loading}>
							<Download size={16} aria-hidden="true" /> Export CSV
						</button>
					</div>
				</div>
			</header>

			{error && (
				<div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#efd4c8] bg-[#fff6f1] px-4 py-3 text-sm text-[#914c37]" role="alert">
					<span>{error}</span>
					<button className="inline-flex items-center gap-2 rounded-md px-2 py-1 font-semibold text-[#914c37] hover:bg-[#f8e5d6]" type="button" onClick={() => setReload((value) => value + 1)}><RefreshCw size={14} /> Retry</button>
				</div>
			)}

			<section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6" aria-label={`Restaurant summary for the last ${period} days`}>
				<MetricCard label="Completed revenue" value={formatCurrency(revenue, currency, { maximumFractionDigits: 0 })} helper="From completed orders" icon={ArrowUpRight} loading={loading} />
				<MetricCard label="Orders received" value={String(periodOrders.length)} helper={`${formatPercent(completionRate)} completed`} icon={ClipboardList} loading={loading} />
				<MetricCard label="Average order" value={formatCurrency(averageOrderValue, currency, { maximumFractionDigits: 0 })} helper="Per completed order" icon={ShoppingBag} loading={loading} />
				<MetricCard label="Dining bookings" value={String(periodBookings.length)} helper="Created in this period" icon={CalendarDays} loading={loading} />
				<MetricCard label="Cancellation rate" value={formatPercent(cancellationRate)} helper={`${cancelledOrders} cancelled or rejected`} icon={ArrowDownRight} loading={loading} />
				<MetricCard label="Guest rating" value={`${(rating?.average ?? 0).toFixed(1)} / 5`} helper={`${rating?.count ?? 0} all-time reviews`} icon={Star} loading={loading} />
			</section>

			<section className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(260px,.8fr)]">
				<article className="min-w-0 rounded-2xl border border-[#eadfd3] bg-[#fffaf4] p-5 shadow-[0_5px_18px_rgba(68,43,29,.035)] sm:p-6">
					<div className="mb-5 flex flex-wrap items-start justify-between gap-3">
						<div>
							<h2 className="m-0 text-lg font-semibold text-[#33251f]">Completed sales</h2>
							<p className="mb-0 mt-1 text-sm text-[#786a60]">Daily revenue and incoming orders across the selected period.</p>
						</div>
						<div className="flex flex-wrap items-center gap-3">
							<span className="inline-flex items-center gap-1.5 text-xs text-[#786a60]"><i className="inline-block size-2.5 rounded-full bg-[#b85e3f]" />Revenue</span>
							<span className="inline-flex items-center gap-1.5 text-xs text-[#786a60]"><i className="inline-block size-2.5 rounded-full bg-[#6b3930]" />Orders</span>
							<span className="rounded-full bg-[#f8e5d6] px-3 py-1.5 text-xs font-semibold text-[#985039]">Last {period} days</span>
						</div>
					</div>
					<div className="h-[290px] w-full" role="img" aria-label={`Chart of daily completed revenue for the last ${period} days`}>
						<ResponsiveContainer width="100%" height="100%">
							<AreaChart data={trendData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
								<defs><linearGradient id="restaurantRevenueFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#c96c46" stopOpacity={0.24} /><stop offset="95%" stopColor="#c96c46" stopOpacity={0.02} /></linearGradient></defs>
								<CartesianGrid stroke="#efe4d9" strokeDasharray="4 4" vertical={false} />
								<XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "#8f8074", fontSize: 11 }} interval={Math.max(0, Math.ceil(period / 8) - 1)} />
								<YAxis yAxisId="revenue" axisLine={false} tickLine={false} tick={{ fill: "#8f8074", fontSize: 11 }} width={58} tickFormatter={(value: number) => value >= 1000 ? `${(value / 1000).toFixed(0)}k` : String(value)} />
								<YAxis yAxisId="orders" orientation="right" axisLine={false} tickLine={false} tick={{ fill: "#8f8074", fontSize: 11 }} width={32} allowDecimals={false} />
								<Tooltip formatter={(value, name) => name === "revenue" ? [formatCurrency(Number(value), currency, { maximumFractionDigits: 0 }), "Revenue"] : [value, "Orders"]} contentStyle={{ border: "1px solid #eadfd3", borderRadius: 12, backgroundColor: "#fffaf4" }} />
								<Area yAxisId="revenue" type="monotone" dataKey="revenue" stroke="#b85e3f" strokeWidth={3} fill="url(#restaurantRevenueFill)" activeDot={{ r: 5, fill: "#b85e3f", stroke: "#fffaf4", strokeWidth: 2 }} />
								<Line yAxisId="orders" type="monotone" dataKey="orders" stroke="#6b3930" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
							</AreaChart>
						</ResponsiveContainer>
					</div>
					<p className="mb-0 mt-2 text-xs leading-relaxed text-[#8f8074]">Revenue includes completed and delivered orders in the latest 100 orders returned by the restaurant service.</p>
				</article>

				<article className="rounded-2xl border border-[#eadfd3] bg-[#fffaf4] p-5 shadow-[0_5px_18px_rgba(68,43,29,.035)] sm:p-6">
					<div className="mb-5">
						<h2 className="m-0 text-lg font-semibold text-[#33251f]">Order outcomes</h2>
						<p className="mb-0 mt-1 text-sm text-[#786a60]">How orders in this period were resolved.</p>
					</div>
					<div className="grid gap-4">
						<OutcomeRow label="Completed" value={completedOrders.length} total={periodOrders.length} color="bg-[#b85e3f]" />
						<OutcomeRow label="In progress" value={periodOrders.filter((order) => ["accepted", "preparing", "ready", "out_for_delivery"].includes(order.status)).length} total={periodOrders.length} color="bg-[#d68a4d]" />
						<OutcomeRow label="Awaiting action" value={periodOrders.filter((order) => order.status === "pending").length} total={periodOrders.length} color="bg-[#d49a56]" />
						<OutcomeRow label="Cancelled or rejected" value={cancelledOrders} total={periodOrders.length} color="bg-[#9b5147]" />
					</div>
					<div className="mt-6 grid grid-cols-2 gap-3 border-t border-[#efe4d9] pt-5">
						<div className="rounded-xl bg-[#fcf4eb] p-4"><div className="flex items-center gap-2 text-[#985039]"><ArrowDownRight size={16} /><span className="text-xs font-semibold">Cancellation rate</span></div><strong className="mt-2 block text-2xl text-[#33251f]">{formatPercent(cancellationRate)}</strong></div>
						<div className="rounded-xl bg-[#fcf4eb] p-4"><div className="flex items-center gap-2 text-[#985039]"><UtensilsCrossed size={16} /><span className="text-xs font-semibold">Unique guests</span></div><strong className="mt-2 block text-2xl text-[#33251f]">{customerCount}</strong></div>
					</div>
				</article>
			</section>

			<section className="grid gap-4 lg:grid-cols-2">
				<article className="rounded-2xl border border-[#eadfd3] bg-[#fffaf4] p-5 shadow-[0_5px_18px_rgba(68,43,29,.035)] sm:p-6">
					<div className="mb-5 flex items-start gap-3">
						<span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#f8e5d6] text-[#985039]"><UtensilsCrossed size={19} /></span>
						<div><h2 className="m-0 text-lg font-semibold text-[#33251f]">Popular menu items</h2><p className="mb-0 mt-1 text-sm text-[#786a60]">Quantity ordered during this period.</p></div>
					</div>
					{popularItems.length ? <div className="grid gap-4">{popularItems.map(([name, quantity]) => (
						<div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3" key={name}>
							<div className="min-w-0"><div className="mb-2 flex items-center justify-between gap-3"><span className="truncate text-sm font-medium text-[#49382e]">{name}</span><span className="text-xs font-semibold text-[#985039]">{quantity} sold</span></div><div className="h-2 overflow-hidden rounded-full bg-[#f1e5d8]"><div className="h-full rounded-full bg-[#c96c46]" style={{ width: `${Math.max(8, quantity / maxItemQuantity * 100)}%` }} /></div></div>
						</div>
					))}</div> : <EmptyReport message="Menu item activity will appear when orders have been placed." />}
				</article>
				<article className="rounded-2xl border border-[#eadfd3] bg-[#fffaf4] p-5 shadow-[0_5px_18px_rgba(68,43,29,.035)] sm:p-6">
					<div className="mb-5 flex items-start gap-3">
						<span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#f8e5d6] text-[#985039]"><Star size={19} /></span>
						<div><h2 className="m-0 text-lg font-semibold text-[#33251f]">Guest experience</h2><p className="mb-0 mt-1 text-sm text-[#786a60]">Ratings snapshot and service health.</p></div>
					</div>
					<div className="flex flex-wrap items-end justify-between gap-4 rounded-xl bg-[#fcf4eb] p-5">
						<div><p className="m-0 text-sm text-[#786a60]">Average restaurant rating</p><strong className="mt-1 block text-4xl font-semibold tracking-[-.04em] text-[#33251f]">{(rating?.average ?? 0).toFixed(1)}<span className="ml-1 text-lg font-medium text-[#8f8074]">/ 5</span></strong></div>
						<div className="text-right"><p className="m-0 text-sm text-[#786a60]">Reviews</p><strong className="mt-1 block text-2xl text-[#33251f]">{rating?.count ?? 0}</strong></div>
					</div>
					<div className="mt-4 flex items-start gap-3 rounded-xl border border-[#f0e5da] p-4 text-sm leading-relaxed text-[#786a60]">
						<CalendarDays className="mt-0.5 shrink-0 text-[#985039]" size={17} aria-hidden="true" />
						<p className="m-0">{periodBookings.length} dine-in and pickup bookings were created during the selected period. {periodOrders.length ? `${formatPercent(cancellationRate)} of tracked orders were cancelled or rejected.` : "Order trends will appear as orders come in."}</p>
					</div>
				</article>
			</section>

			<p className="m-0 text-xs leading-relaxed text-[#8f8074]">Figures are calculated from existing restaurant order, booking, and rating records. Order and booking history is limited to the latest 100 records available from the restaurant service.</p>
		</div>
	);
}

function MetricCard({ label, value, helper, icon: Icon, loading }: { label: string; value: string; helper: string; icon: LucideIcon; loading: boolean }) {
	return (
		<article className="group min-w-0 rounded-2xl border border-[#eadfd3] bg-[#fffaf4] p-4 shadow-[0_5px_18px_rgba(68,43,29,.035)] transition duration-150 hover:-translate-y-0.5 hover:border-[#dfc3aa] hover:shadow-[0_10px_24px_rgba(68,43,29,.07)] sm:p-5">
			<div className="mb-4 flex items-center justify-between gap-3"><p className="m-0 text-sm font-medium text-[#786a60]">{label}</p><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#f8e5d6] text-[#985039] transition-colors group-hover:bg-[#f2d8c4]"><Icon size={19} aria-hidden="true" /></span></div>
			<strong className="block truncate text-2xl font-semibold tracking-[-.03em] text-[#33251f]">{loading ? "—" : value}</strong>
			<p className="mb-0 mt-2 truncate text-xs text-[#8f8074]" title={helper}>{helper}</p>
		</article>
	);
}

function OutcomeRow({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
	const percent = total ? Math.round(value / total * 100) : 0;
	return (
		<div>
			<div className="mb-2 flex items-center justify-between gap-3 text-sm"><span className="text-[#786a60]">{label}</span><span className="font-semibold text-[#49382e]">{value} <span className="font-normal text-[#8f8074]">· {percent}%</span></span></div>
			<div className="h-2 overflow-hidden rounded-full bg-[#f1e5d8]"><div className={`h-full rounded-full ${color}`} style={{ width: `${percent}%` }} /></div>
		</div>
	);
}

function EmptyReport({ message }: { message: string }) {
	return <div className="flex min-h-32 flex-col items-center justify-center gap-2 rounded-xl bg-[#fcf4eb] px-5 text-center"><ClipboardList className="text-[#985039]" size={22} aria-hidden="true" /><p className="m-0 max-w-sm text-sm leading-relaxed text-[#786a60]">{message}</p></div>;
}
