import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowDownRight, ArrowRight, ArrowUpRight, BadgeCheck, CalendarDays, Clock3, MapPin, PackageCheck, ShoppingBag, Star, Users, Wallet, UtensilsCrossed } from "lucide-react";
import profileApi from "../../api/restaurant/profileApi";
import orderApi from "../../api/restaurant/orderApi";
import bookingApi from "../../api/restaurant/bookingApi";
import menuItemApi from "../../api/restaurant/menuItemApi";
import ratingApi from "../../api/restaurant/ratingApi";
import walletApi from "../../api/restaurant/walletApi";
import type { DineInBooking, MenuItem, Order, Rating, RatingSummary, RestaurantPartner, Wallet as RestaurantWallet } from "../../types";
import { getApiErrorMessage } from "../../api/axios";
import experienceImage from "../../../../website/public/experience.jpg";
import cateringImage from "../../../../website/public/Catering.jpg";
import foodImage from "../../../../website/public/food and dinning.jpg";

interface RestaurantDashboardData {
	partner: RestaurantPartner;
	orders: Order[];
	bookings: DineInBooking[];
	menuItems: MenuItem[];
	reviews: Rating[];
	rating: RatingSummary;
	wallet: RestaurantWallet;
}

function money(value: number, currency: string) {
	try {
		return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
	} catch {
		return `${currency} ${value.toLocaleString()}`;
	}
}

function customerName(order: Order) {
	return order.customer ? `${order.customer.firstName} ${order.customer.lastName}` : "Guest";
}

function statusLabel(status: string) {
	return status.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function dateTime(value: string) {
	return new Date(value).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export function RestaurantDashboardPage() {
	const [data, setData] = useState<RestaurantDashboardData | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [reload, setReload] = useState(0);
	const [opening, setOpening] = useState(false);
	const [actionError, setActionError] = useState("");

	useEffect(() => {
		let cancelled = false;
		async function load() {
			setLoading(true);
			setError("");
			try {
				const [profile, orders, bookings, menuItems, ratingList, rating, wallet] = await Promise.all([
					profileApi.get(),
					orderApi.list({ limit: 100 }),
					bookingApi.list({ limit: 100 }),
					menuItemApi.list(),
					ratingApi.list({ limit: 5 }),
					ratingApi.summary(),
					walletApi.get(),
				]);
				if (!cancelled) {
					setData({ partner: profile.partner, orders: orders.data, bookings: bookings.data, menuItems, reviews: ratingList.data, rating, wallet });
				}
			} catch (requestError) {
				if (!cancelled) setError(getApiErrorMessage(requestError, "Could not load restaurant dashboard data."));
			} finally {
				if (!cancelled) setLoading(false);
			}
		}
		void load();
		return () => { cancelled = true; };
	}, [reload]);

	const today = new Date().toISOString().slice(0, 10);
	const recentOrders = useMemo(() => [...(data?.orders ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [data?.orders]);
	const todayOrders = recentOrders.filter((order) => order.createdAt.slice(0, 10) === today);
	const sevenDaysAgo = new Date();
	sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
	sevenDaysAgo.setHours(0, 0, 0, 0);
	const weeklyOrders = recentOrders.filter((order) => new Date(order.createdAt) >= sevenDaysAgo);
	const activeCustomers = new Set(weeklyOrders.map((order) => order.customer?._id).filter(Boolean)).size;
	const todayRevenue = todayOrders.filter((order) => !["cancelled", "rejected"].includes(order.status)).reduce((sum, order) => sum + order.total, 0);
	const completedCount = recentOrders.filter((order) => ["delivered", "completed"].includes(order.status)).length;
	const preparingCount = recentOrders.filter((order) => ["accepted", "preparing", "ready"].includes(order.status)).length;
	const deliveryCount = recentOrders.filter((order) => order.status === "out_for_delivery").length;
	const cancelledCount = recentOrders.filter((order) => ["cancelled", "rejected"].includes(order.status)).length;
	const totalStatusOrders = completedCount + preparingCount + deliveryCount + cancelledCount;
	const pct = (value: number) => totalStatusOrders ? Math.round(value / totalStatusOrders * 100) : 0;
	const currency = data?.wallet.currency ?? recentOrders[0]?.currency ?? "KES";
	const sales = Array.from({ length: 7 }, (_, index) => {
		const date = new Date();
		date.setDate(date.getDate() - (6 - index));
		const key = date.toISOString().slice(0, 10);
		const amount = recentOrders.filter((order) => order.createdAt.slice(0, 10) === key && !["cancelled", "rejected"].includes(order.status)).reduce((sum, order) => sum + order.total, 0);
		return { day: date.toLocaleDateString(undefined, { month: "short", day: "numeric" }), sales: amount };
	});
	const popularItems = useMemo(() => {
		const itemTotals = new Map<string, number>();
		(data?.orders ?? []).forEach((order) => order.items.forEach((item) => itemTotals.set(item.name, (itemTotals.get(item.name) ?? 0) + item.quantity)));
		return [...(data?.menuItems ?? [])]
			.map((item) => ({ item, sold: itemTotals.get(item.name) ?? 0 }))
			.sort((a, b) => b.sold - a.sold || Number(b.item.isFeatured) - Number(a.item.isFeatured))
			.slice(0, 4);
	}, [data?.menuItems, data?.orders]);
	const pendingBookings = (data?.bookings ?? []).filter((booking) => booking.status === "pending").length;
	const busyHours = `${todayOrders.length ? dateTime(todayOrders[todayOrders.length - 1].createdAt) : "—"} – ${todayOrders.length ? dateTime(todayOrders[0].createdAt) : "—"}`;

	async function toggleOpen() {
		if (!data) return;
		setOpening(true);
		setActionError("");
		try {
			const result = await profileApi.toggleOpen(!data.partner.isOpen);
			setData((current) => current ? { ...current, partner: { ...current.partner, isOpen: result.isOpen, isAcceptingOrders: result.isAcceptingOrders } } : current);
		} catch (requestError) {
			setActionError(getApiErrorMessage(requestError, "Could not update restaurant availability."));
		} finally {
			setOpening(false);
		}
	}

	return (
		<div className="restaurant-dashboard">
			{error ? <div className="restaurant-feedback" role="alert"><span>{error}</span><button type="button" onClick={() => setReload((value) => value + 1)}>Try again</button></div> : null}
			{actionError ? <div className="restaurant-feedback" role="alert">{actionError}</div> : null}
			<section className="restaurant-welcome" style={{ backgroundImage: `linear-gradient(90deg, rgba(10, 18, 15, .86), rgba(18, 24, 17, .26) 66%, rgba(18, 24, 17, .12)), url("${data?.partner.coverImage || experienceImage}")` }}>
				<div>
					<p>Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"},</p>
					<h1>{data?.partner.name ?? "Your Restaurant"} <BadgeCheck size={20} /></h1>
					<p className="restaurant-welcome-copy">{data?.partner.description || "Great food fuels great journeys. Welcome to your DigitalSafaris partner dashboard."}</p>
					<div className="restaurant-welcome-meta">
						<span><MapPin size={13} />{data ? `${data.partner.town}${data.partner.address ? `, ${data.partner.address}` : ""}` : "Restaurant partner"}</span>
						<button type="button" className={`restaurant-open-pill ${data?.partner.isOpen ? "open" : ""}`} onClick={() => void toggleOpen()} disabled={!data || opening}><i />{opening ? "Updating..." : data?.partner.isOpen ? "Open" : "Closed"}</button>
						<span><Clock3 size={13} />{busyHours}</span>
					</div>
				</div>
				<span className="restaurant-welcome-tagline">Local Flavours.<br />Global Travellers.</span>
			</section>
			{loading ? <div className="restaurant-loading" role="status">Loading your restaurant dashboard…</div> : null}
			<div className="restaurant-dashboard-grid">
				<section className="restaurant-dashboard-main">
					<div className="restaurant-metrics">
						<Metric icon={<ShoppingBag size={19} />} label="Total Orders" value={data ? String(data.partner.totalOrders) : "—"} change={`${weeklyOrders.length} in last 7 days`} positive />
						<Metric icon={<Users size={19} />} label="Active Customers" value={String(activeCustomers)} change="Unique customers, last 7 days" positive />
						<Metric icon={<Wallet size={19} />} label="Today's Revenue" value={money(todayRevenue, currency)} change={`${todayOrders.length} orders today`} positive />
						<Metric icon={<Star size={19} />} label="Average Rating" value={data ? data.rating.average.toFixed(1) : "—"} change={`${data?.rating.count ?? 0} reviews`} positive />
					</div>
					<div className="restaurant-dashboard-middle">
						<section className="restaurant-card restaurant-orders-card">
							<SectionHeading title="Recent Orders" to="/partner/restaurant/orders" link="View all orders" />
							<div className="restaurant-order-table-wrap"><table className="restaurant-order-table"><thead><tr><th>Order #</th><th>Customer</th><th>Items</th><th>Amount</th><th>Status</th><th>Time</th></tr></thead><tbody>
								{recentOrders.slice(0, 5).map((order) => <tr key={order._id}><td><span className="restaurant-order-food"><img src={order.items[0]?.menuItem ? data?.menuItems.find((item) => item._id === order.items[0].menuItem)?.image || foodImage : foodImage} alt="" />{order.reference}</span></td><td>{customerName(order)}</td><td>{order.items.reduce((sum, item) => sum + item.quantity, 0)} items</td><td>{money(order.total, order.currency)}</td><td><span className={`restaurant-status ${order.status}`}>{statusLabel(order.status)}</span></td><td>{dateTime(order.createdAt)}</td></tr>)}
							</tbody></table>{!loading && !error && recentOrders.length === 0 ? <div className="restaurant-empty">No orders yet. New customer orders will appear here.</div> : null}</div>
						</section>
						<section className="restaurant-card restaurant-overview-card">
							<SectionHeading title="Today's Overview" to="/partner/restaurant/analytics" link="View details" />
							<div className="restaurant-donut-wrap"><div className="restaurant-donut" style={{ background: `conic-gradient(#176b49 0 ${pct(completedCount)}%, #f09b26 ${pct(completedCount)}% ${pct(completedCount + preparingCount)}%, #4685c5 ${pct(completedCount + preparingCount)}% ${pct(completedCount + preparingCount + deliveryCount)}%, #ef3e43 ${pct(completedCount + preparingCount + deliveryCount)}% 100%)` }}><div><strong>{todayOrders.length}</strong><span>Orders today</span></div></div>
								<div className="restaurant-donut-legend"><Legend color="#176b49" label="Completed" value={`${pct(completedCount)}%`} /><Legend color="#f09b26" label="Preparing" value={`${pct(preparingCount)}%`} /><Legend color="#4685c5" label="On Delivery" value={`${pct(deliveryCount)}%`} /><Legend color="#ef3e43" label="Cancelled" value={`${pct(cancelledCount)}%`} /></div></div>
							<div className="restaurant-good-news"><PackageCheck size={17} /><span><strong>{pendingBookings ? `${pendingBookings} booking${pendingBookings === 1 ? "" : "s"} need attention` : "You're doing great!"}</strong><small>{pendingBookings ? "Review booking requests when you have a moment." : "Keep your menu fresh and your guests coming back."}</small></span></div>
						</section>
					</div>
					<div className="restaurant-dashboard-bottom">
						<section className="restaurant-card restaurant-sales-card">
							<SectionHeading title="Sales Overview" to="/partner/restaurant/analytics" link="Last 7 days" />
							<div className="restaurant-sales-content"><div className="restaurant-sales-chart"><ResponsiveContainer width="100%" height={190}><AreaChart data={sales} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}><defs><linearGradient id="restaurantSalesFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#e89122" stopOpacity={.28} /><stop offset="100%" stopColor="#e89122" stopOpacity={0} /></linearGradient></defs><CartesianGrid vertical={false} stroke="#eee6db" /><XAxis dataKey="day" tick={{ fontSize: 10, fill: "#887e72" }} axisLine={false} tickLine={false} /><YAxis width={48} tick={{ fontSize: 9, fill: "#887e72" }} axisLine={false} tickLine={false} tickFormatter={(value: number) => `${currency} ${value}`} /><Tooltip formatter={(value) => money(Number(value), currency)} /><Area type="monotone" dataKey="sales" stroke="#e89122" strokeWidth={2.5} fill="url(#restaurantSalesFill)" /></AreaChart></ResponsiveContainer></div>
								<div className="restaurant-sales-summary"><span>Total Revenue<strong>{money(sales.reduce((sum, item) => sum + item.sales, 0), currency)}</strong></span><span>Total Orders<strong>{weeklyOrders.length}</strong></span><span>Average Order Value<strong>{weeklyOrders.length ? money(weeklyOrders.reduce((sum, order) => sum + order.total, 0) / weeklyOrders.length, currency) : money(0, currency)}</strong></span></div>
							</div>
						</section>
						<section className="restaurant-card restaurant-popular-card">
							<SectionHeading title="Popular Menu Items" to="/partner/restaurant/menu" link="View all" />
							<div className="restaurant-popular-list">{popularItems.map(({ item, sold }) => <div className="restaurant-popular-item" key={item._id}><img src={item.image || foodImage} alt="" /><span><strong>{item.name}</strong><small>{sold} sold</small></span><b>{money(item.price, item.currency || currency)}</b></div>)}{!loading && popularItems.length === 0 ? <div className="restaurant-empty compact">Your menu items will show here.</div> : null}</div>
						</section>
					</div>
				</section>
				<aside className="restaurant-dashboard-aside">
					<section className="restaurant-card restaurant-quick-card">
						<h2>Quick Actions</h2>
						<QuickAction icon={<UtensilsCrossed size={17} />} title="Manage Menu" detail="Update your food offerings" to="/partner/restaurant/menu" />
						<QuickAction icon={<ShoppingBag size={17} />} title="View Orders" detail="Track and manage all orders" to="/partner/restaurant/orders" badge={todayOrders.filter((order) => order.status === "pending").length} />
						<QuickAction icon={<CalendarDays size={17} />} title="Update Availability" detail="Set your operating hours" to="/partner/restaurant/profile" />
						<QuickAction icon={<Wallet size={17} />} title="View Wallet" detail="Check earnings and payouts" to="/partner/restaurant/wallet" />
					</section>
					<Link className="restaurant-feature-card" to="/partner/restaurant/menu" style={{ backgroundImage: `linear-gradient(90deg, rgba(18, 16, 12, .82), rgba(18, 16, 12, .16)), url("${cateringImage}")` }}>
						<span><small>Featured Service</small><strong>Special Menu<br />for Travellers</strong><span>Showcase your best dishes to DigitalSafaris customers.</span><b>Update Menu <ArrowRight size={12} /></b></span>
					</Link>
					<section className="restaurant-card restaurant-reviews-card">
						<SectionHeading title="Recent Reviews" to="/partner/restaurant/reviews" link="View all" />
						{(data?.reviews ?? []).slice(0, 3).map((review) => <div className="restaurant-review-item" key={review._id}><div className="restaurant-review-top">{review.customer?.avatar ? <img src={review.customer.avatar} alt="" /> : <span>{review.customer?.firstName?.[0] ?? "G"}</span>}<div><strong>{review.customer ? `${review.customer.firstName} ${review.customer.lastName}` : "Guest"}</strong><div className="restaurant-stars" aria-label={`${review.rating} out of 5 stars`}>{"★".repeat(Math.max(0, Math.min(5, review.rating)))}<i>{"★".repeat(5 - Math.max(0, Math.min(5, review.rating)))}</i></div></div><small>{new Date(review.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</small></div><p>{review.comment}</p></div>)}
						{!loading && (data?.reviews.length ?? 0) === 0 ? <div className="restaurant-empty compact">Your guest reviews will appear here.</div> : null}
					</section>
				</aside>
			</div>
		</div>
	);
}

function Metric({ icon, label, value, change, positive }: { icon: ReactNode; label: string; value: string; change: string; positive?: boolean }) {
	return <article className="restaurant-metric"><span className="restaurant-metric-icon">{icon}</span><div><small>{label}</small><strong>{value}</strong><span className={positive ? "positive" : ""}>{positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}{change}</span></div></article>;
}

function SectionHeading({ title, to, link }: { title: string; to: string; link: string }) {
	return <header className="restaurant-section-heading"><h2>{title}</h2><Link to={to}>{link} <ArrowRight size={11} /></Link></header>;
}

function Legend({ color, label, value }: { color: string; label: string; value: string }) {
	return <div className="restaurant-legend-row"><i style={{ background: color }} /><span>{label}</span><b>{value}</b></div>;
}

function QuickAction({ icon, title, detail, to, badge }: { icon: ReactNode; title: string; detail: string; to: string; badge?: number }) {
	return <Link className="restaurant-quick-action" to={to}><span>{icon}</span><span><strong>{title}</strong><small>{detail}</small></span>{badge ? <b>{badge}</b> : <ArrowRight size={13} />}</Link>;
}