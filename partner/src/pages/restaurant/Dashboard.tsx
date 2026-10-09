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
import { partnerImages } from "../../config/partnerImages";
import { formatCurrency } from "../../utils/formatCurrency";
import { formatDate } from "../../utils/formatDate";
import { formatLabel, formatPersonName } from "../../utils/helpers";

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
	return formatCurrency(value, currency, { maximumFractionDigits: 0 });
}

function customerName(order: Order) {
	return formatPersonName(order.customer);
}

const statusColor = (status: string) => ["accepted", "preparing", "ready", "confirmed"].includes(status) ? "!bg-[#f0f2e8] !text-[#6f7c43]" : ["delivered", "completed"].includes(status) ? "!bg-[#edf5e9] !text-[#4f7b4c]" : status === "out_for_delivery" ? "!bg-[#eaf2f8] !text-[#4a779e]" : ["cancelled", "rejected"].includes(status) ? "!bg-[#f9edeb] !text-[#a3574d]" : "";

function statusLabel(status: string) {
	return formatLabel(status);
}

function dateTime(value: string) {
	return formatDate(value, { hour: "numeric", minute: "2-digit" });
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
		<div className="block">
			{error ? <div className="mb-[10px] flex items-center justify-between gap-[10px] rounded-md border border-[#f0d9d4] bg-[#fff8f7] px-[11px] py-[9px] text-[9px] text-[#994c43] [&_button]:rounded-[5px] [&_button]:border [&_button]:border-[#eed3cf] [&_button]:bg-white [&_button]:px-2 [&_button]:py-[5px] [&_button]:text-[8px] [&_button]:text-[#914940]" role="alert"><span>{error}</span><button type="button" onClick={() => setReload((value) => value + 1)}>Try again</button></div> : null}
			{actionError ? <div className="mb-[10px] flex items-center justify-between gap-[10px] rounded-md border border-[#f0d9d4] bg-[#fff8f7] px-[11px] py-[9px] text-[9px] text-[#994c43] [&_button]:rounded-[5px] [&_button]:border [&_button]:border-[#eed3cf] [&_button]:bg-white [&_button]:px-2 [&_button]:py-[5px] [&_button]:text-[8px] [&_button]:text-[#914940]" role="alert">{actionError}</div> : null}
			<section className="relative flex min-h-[142px] items-center justify-start overflow-hidden rounded-[9px] bg-cover bg-[center_57%] bg-[#56513d] p-5 text-white max-[480px]:min-h-[135px] max-[480px]:p-[14px] [&>div]:relative [&>div]:z-[1] [&>div]:max-w-[min(75%,520px)] max-[480px]:[&>div]:max-w-full [&>div>p:first-child]:mb-[5px] [&>div>p:first-child]:text-[10px] [&>div>p:first-child]:text-[#e8d69e] [&_h1]:flex [&_h1]:items-center [&_h1]:gap-[6px] [&_h1]:text-[clamp(20px,2vw,28px)] [&_h1_svg]:text-[#e5ca75] [&>div>p:nth-of-type(2)]:mt-[6px] [&>div>p:nth-of-type(2)]:max-w-[420px] [&>div>p:nth-of-type(2)]:truncate [&>div>p:nth-of-type(2)]:text-[10px] [&>div>div]:mt-[10px] [&>div>div]:flex [&>div>div]:flex-wrap [&>div>div]:items-center [&>div>div]:gap-3 [&>div>div>span]:inline-flex [&>div>div>span]:items-center [&>div>div>span]:gap-1 [&>div>div>span]:text-[8px] [&>div>div>span]:text-white/80 [&>span]:absolute [&>span]:right-[23px] [&>span]:bottom-[18px] [&>span]:text-right [&>span]:text-[10px] [&>span]:font-semibold [&>span]:leading-[1.5] [&>span]:text-white/80 max-[480px]:[&>span]:hidden" style={{ backgroundImage: `linear-gradient(90deg, rgba(10, 18, 15, .86), rgba(18, 24, 17, .26) 66%, rgba(18, 24, 17, .12)), url("${data?.partner.coverImage || partnerImages.restaurant.dashboardFallback}")` }}>
				<div>
					<p>Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"},</p>
					<h1>{data?.partner.name ?? "Your Restaurant"} <BadgeCheck size={20} /></h1>
					<p className="m-0 mt-[6px] max-w-[420px] truncate text-[10px] text-white/80">{data?.partner.description || "Great food fuels great journeys. Welcome to your DigitalSafaris partner dashboard."}</p>
					<div className="mt-[10px] flex flex-wrap items-center gap-3">
						<span><MapPin size={13} />{data ? `${data.partner.town}${data.partner.address ? `, ${data.partner.address}` : ""}` : "Restaurant partner"}</span>
						<button type="button" data-open={data?.partner.isOpen ?? false} className="inline-flex min-h-6 items-center gap-[5px] rounded-full border border-white/40 bg-black/30 px-2 text-[8px] font-semibold text-white disabled:cursor-wait [&_i]:size-[6px] [&_i]:rounded-full [&_i]:bg-[#c1c2b8] data-[open=true]:[&>i]:bg-[#9ccc7b]" onClick={() => void toggleOpen()} disabled={!data || opening}><i />{opening ? "Updating..." : data?.partner.isOpen ? "Open" : "Closed"}</button>
						<span><Clock3 size={13} />{busyHours}</span>
					</div>
				</div>
				<span className="absolute right-[23px] bottom-[18px] text-right text-[10px] font-semibold leading-[1.5] text-white/80 max-[480px]:hidden">Local Flavours.<br />Global Travellers.</span>
			</section>
			{loading ? <div className="p-3 text-center text-[9px] text-[#7f8178]" role="status">Loading your restaurant dashboard…</div> : null}
			<div className="mt-3 grid grid-cols-[minmax(0,1fr)_215px] items-start gap-[13px] max-[1000px]:grid-cols-1">
				<section className="grid min-w-0 gap-3">
					<div className="grid grid-cols-4 gap-[9px] max-[680px]:grid-cols-2 max-[430px]:grid-cols-1">
						<Metric icon={<ShoppingBag size={19} />} label="Total Orders" value={data ? String(data.partner.totalOrders) : "—"} change={`${weeklyOrders.length} in last 7 days`} positive />
						<Metric icon={<Users size={19} />} label="Active Customers" value={String(activeCustomers)} change="Unique customers, last 7 days" positive />
						<Metric icon={<Wallet size={19} />} label="Today's Revenue" value={money(todayRevenue, currency)} change={`${todayOrders.length} orders today`} positive />
						<Metric icon={<Star size={19} />} label="Average Rating" value={data ? data.rating.average.toFixed(1) : "—"} change={`${data?.rating.count ?? 0} reviews`} positive />
					</div>
					<div className="grid grid-cols-[minmax(0,1.65fr)_minmax(190px,.9fr)] gap-[11px] max-[760px]:grid-cols-1">
						<section className="min-w-0 rounded-lg border border-[#eaeae5] bg-white shadow-[0_1px_3px_rgba(34,37,29,.025)] p-3">
							<SectionHeading title="Recent Orders" to="/partner/restaurant/orders" link="View all orders" />
							<div className="mt-2 w-full overflow-x-auto"><table className="w-full border-collapse text-left whitespace-nowrap [&_th]:border-b [&_th]:border-[#eeefea] [&_th]:px-[6px] [&_th]:py-[7px] [&_th]:text-[8px] [&_th]:font-medium [&_th]:text-[#92948a] [&_td]:border-b [&_td]:border-[#f1f1ed] [&_td]:px-[6px] [&_td]:py-2 [&_td]:text-[8px] [&_td]:text-[#5e6157] [&_tr:last-child_td]:border-0"><thead><tr><th>Order #</th><th>Customer</th><th>Items</th><th>Amount</th><th>Status</th><th>Time</th></tr></thead><tbody>
								{recentOrders.slice(0, 5).map((order) => <tr key={order._id}><td><span className="flex items-center gap-[6px] font-semibold text-[#3f4239] [&_img]:size-[26px] [&_img]:rounded-[5px] [&_img]:object-cover"><img src={order.items[0]?.menuItem ? data?.menuItems.find((item) => item._id === order.items[0].menuItem)?.image || partnerImages.restaurant.menuItemFallback : partnerImages.restaurant.menuItemFallback} alt="" />{order.reference}</span></td><td>{customerName(order)}</td><td>{order.items.reduce((sum, item) => sum + item.quantity, 0)} items</td><td>{money(order.total, order.currency)}</td><td><span className={`inline-flex min-h-[18px] items-center rounded-full bg-[#fbf3e2] px-[6px] py-[2px] text-[7px] font-semibold text-[#9a742a] ${statusColor(order.status)}`}>{statusLabel(order.status)}</span></td><td>{dateTime(order.createdAt)}</td></tr>)}
							</tbody></table>{!loading && !error && recentOrders.length === 0 ? <div className="px-[14px] py-[22px] text-center text-[10px] text-[#898b82]">No orders yet. New customer orders will appear here.</div> : null}</div>
						</section>
						<section className="min-w-0 rounded-lg border border-[#eaeae5] bg-white shadow-[0_1px_3px_rgba(34,37,29,.025)] p-3">
							<SectionHeading title="Today's Overview" to="/partner/restaurant/analytics" link="View details" />
							<div className="flex min-h-[142px] items-center justify-center gap-2 [&>div:first-child]:grid [&>div:first-child]:size-[103px] [&>div:first-child]:shrink-0 [&>div:first-child]:place-items-center [&>div:first-child]:rounded-full [&>div:first-child>div]:grid [&>div:first-child>div]:size-[70px] [&>div:first-child>div]:content-center [&>div:first-child>div]:justify-items-center [&>div:first-child>div]:rounded-full [&>div:first-child>div]:bg-white [&>div:first-child>div>strong]:text-xl [&>div:first-child>div>span]:text-[7px]"><div className="grid size-[103px] shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(#176b49 0 ${pct(completedCount)}%, #f09b26 ${pct(completedCount)}% ${pct(completedCount + preparingCount)}%, #4685c5 ${pct(completedCount + preparingCount)}% ${pct(completedCount + preparingCount + deliveryCount)}%, #ef3e43 ${pct(completedCount + preparingCount + deliveryCount)}% 100%)` }}><div className="grid size-[70px] content-center justify-items-center rounded-full bg-white"><strong className="text-xl">{todayOrders.length}</strong><span className="text-[7px]">Orders today</span></div></div>
								<div className="grid gap-[7px]"><Legend color="#176b49" label="Completed" value={`${pct(completedCount)}%`} /><Legend color="#f09b26" label="Preparing" value={`${pct(preparingCount)}%`} /><Legend color="#4685c5" label="On Delivery" value={`${pct(deliveryCount)}%`} /><Legend color="#ef3e43" label="Cancelled" value={`${pct(cancelledCount)}%`} /></div></div>
							<div className="flex items-start gap-[7px] rounded-[5px] bg-[#f4f6ee] p-2 text-[#6b7942] [&>svg]:shrink-0 [&>span]:grid [&>span]:gap-[3px] [&_strong]:text-[8px] [&_small]:text-[7px] [&_small]:leading-[1.4] [&_small]:text-[#85887c]"><PackageCheck size={17} /><span><strong>{pendingBookings ? `${pendingBookings} booking${pendingBookings === 1 ? "" : "s"} need attention` : "You're doing great!"}</strong><small>{pendingBookings ? "Review booking requests when you have a moment." : "Keep your menu fresh and your guests coming back."}</small></span></div>
						</section>
					</div>
					<div className="grid grid-cols-[minmax(0,1.65fr)_minmax(190px,.9fr)] gap-[11px] max-[760px]:grid-cols-1">
						<section className="min-w-0 rounded-lg border border-[#eaeae5] bg-white shadow-[0_1px_3px_rgba(34,37,29,.025)] p-3">
							<SectionHeading title="Sales Overview" to="/partner/restaurant/analytics" link="Last 7 days" />
							<div className="mt-2 grid grid-cols-[minmax(0,1fr)_115px] items-center gap-2 max-[480px]:grid-cols-1"><div className="min-w-0 [&_.recharts-responsive-container]:m-0"><ResponsiveContainer width="100%" height={190}><AreaChart data={sales} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}><defs><linearGradient id="restaurantSalesFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#e89122" stopOpacity={.28} /><stop offset="100%" stopColor="#e89122" stopOpacity={0} /></linearGradient></defs><CartesianGrid vertical={false} stroke="#eee6db" /><XAxis dataKey="day" tick={{ fontSize: 10, fill: "#887e72" }} axisLine={false} tickLine={false} /><YAxis width={48} tick={{ fontSize: 9, fill: "#887e72" }} axisLine={false} tickLine={false} tickFormatter={(value: number) => `${currency} ${value}`} /><Tooltip formatter={(value) => money(Number(value), currency)} /><Area type="monotone" dataKey="sales" stroke="#e89122" strokeWidth={2.5} fill="url(#restaurantSalesFill)" /></AreaChart></ResponsiveContainer></div>
								<div className="grid gap-[10px] [&>span]:grid [&>span]:gap-[3px] [&>span]:text-[7px] [&>span]:text-[#888a81] [&_strong]:text-[9px] [&_strong]:text-[#44473d]"><span>Total Revenue<strong>{money(sales.reduce((sum, item) => sum + item.sales, 0), currency)}</strong></span><span>Total Orders<strong>{weeklyOrders.length}</strong></span><span>Average Order Value<strong>{weeklyOrders.length ? money(weeklyOrders.reduce((sum, order) => sum + order.total, 0) / weeklyOrders.length, currency) : money(0, currency)}</strong></span></div>
							</div>
						</section>
						<section className="min-w-0 rounded-lg border border-[#eaeae5] bg-white shadow-[0_1px_3px_rgba(34,37,29,.025)] p-3">
							<SectionHeading title="Popular Menu Items" to="/partner/restaurant/menu" link="View all" />
							<div className="mt-[10px] grid gap-[10px]">{popularItems.map(({ item, sold }) => <div className="flex min-w-0 items-center gap-2 [&>img]:size-8 [&>img]:shrink-0 [&>img]:rounded-md [&>img]:object-cover [&>span:nth-child(2)]:grid [&>span:nth-child(2)]:min-w-0 [&>span:nth-child(2)]:flex-1 [&>span:nth-child(2)]:gap-[3px] [&_strong]:truncate [&_strong]:text-[9px] [&_small]:text-[8px] [&_small]:text-[#92948b] [&>b]:text-[9px] [&>b]:text-[#59653c]" key={item._id}><img src={item.image || partnerImages.restaurant.menuItemFallback} alt="" /><span><strong>{item.name}</strong><small>{sold} sold</small></span><b>{money(item.price, item.currency || currency)}</b></div>)}{!loading && popularItems.length === 0 ? <div className="px-[14px] py-[12px] text-center text-[10px] text-[#898b82]">Your menu items will show here.</div> : null}</div>
						</section>
					</div>
				</section>
				<aside className="grid gap-3 max-[1000px]:grid-cols-2 max-[480px]:grid-cols-1">
					<section className="min-w-0 rounded-lg border border-[#eaeae5] bg-white shadow-[0_1px_3px_rgba(34,37,29,.025)] p-3 [&_h2]:mb-[9px] [&_h2]:mt-0 [&_h2]:text-[11px]">
						<h2>Quick Actions</h2>
						<QuickAction icon={<UtensilsCrossed size={17} />} title="Manage Menu" detail="Update your food offerings" to="/partner/restaurant/menu" />
						<QuickAction icon={<ShoppingBag size={17} />} title="View Orders" detail="Track and manage all orders" to="/partner/restaurant/orders" badge={todayOrders.filter((order) => order.status === "pending").length} />
						<QuickAction icon={<CalendarDays size={17} />} title="Update Availability" detail="Set your operating hours" to="/partner/restaurant/profile" />
						<QuickAction icon={<Wallet size={17} />} title="View Wallet" detail="Check earnings and payouts" to="/partner/restaurant/wallet" />
					</section>
					<Link className="flex min-h-[145px] items-center rounded-lg bg-cover bg-center p-[13px] text-white no-underline max-[1000px]:min-h-[160px] [&>span]:grid [&>span]:justify-items-start [&>span]:gap-[5px] [&_small]:text-[8px] [&_small]:font-bold [&_small]:uppercase [&_small]:text-[#e3d097] [&_strong]:text-[15px] [&_strong]:leading-[1.2] [&>span>span]:max-w-[170px] [&>span>span]:text-[8px] [&>span>span]:leading-[1.4] [&>span>span]:text-white/80 [&_b]:inline-flex [&_b]:items-center [&_b]:gap-[3px] [&_b]:text-[8px] [&_b]:text-[#e8d593]" to="/partner/restaurant/menu" style={{ backgroundImage: `linear-gradient(90deg, rgba(18, 16, 12, .82), rgba(18, 16, 12, .16)), url("${partnerImages.restaurant.catering}")` }}>
						<span><small>Featured Service</small><strong>Special Menu<br />for Travellers</strong><span>Showcase your best dishes to DigitalSafaris customers.</span><b>Update Menu <ArrowRight size={12} /></b></span>
					</Link>
					<section className="min-w-0 rounded-lg border border-[#eaeae5] bg-white shadow-[0_1px_3px_rgba(34,37,29,.025)] p-3 ">
						<SectionHeading title="Recent Reviews" to="/partner/restaurant/reviews" link="View all" />
						{(data?.reviews ?? []).slice(0, 3).map((review) => <div className="flex items-start gap-2 [&_img]:size-[25px] [&_img]:shrink-0 [&_img]:rounded-full [&_img]:object-cover [&_span]:grid [&_span]:min-w-0 [&_span]:flex-1 [&_span]:gap-[3px] [&_strong]:truncate [&_strong]:text-[9px] [&_strong]:text-[#42453c] [&_small]:text-[8px] [&_small]:text-[#92948b] [&_p]:mt-[5px] [&_p]:text-[8px] [&_p]:leading-[1.45] [&_p]:text-[#71736b]" key={review._id}><div className="flex items-center gap-[6px] [&>img]:size-[25px] [&>img]:shrink-0 [&>img]:rounded-full [&>img]:object-cover [&>span]:grid [&>span]:size-[25px] [&>span]:shrink-0 [&>span]:place-items-center [&>span]:rounded-full [&>span]:bg-[#eff0e7] [&>span]:text-[8px] [&_div]:grid [&_div]:gap-[2px] [&_strong]:text-[8px] [&_strong]:text-[#55584e] [&>small]:ml-auto [&>small]:text-[7px] [&>small]:text-[#9b9d94]">{review.customer?.avatar ? <img src={review.customer.avatar} alt="" /> : <span>{review.customer?.firstName?.[0] ?? "G"}</span>}<div><strong>{review.customer ? `${review.customer.firstName} ${review.customer.lastName}` : "Guest"}</strong><div className="text-[8px] tracking-[1px] text-[#bf9742] [&_i]:not-italic [&_i]:text-[#d9d9d1]" aria-label={`${review.rating} out of 5 stars`}>{"★".repeat(Math.max(0, Math.min(5, review.rating)))}<i>{"★".repeat(5 - Math.max(0, Math.min(5, review.rating)))}</i></div></div><small>{new Date(review.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</small></div><p>{review.comment}</p></div>)}
						{!loading && (data?.reviews.length ?? 0) === 0 ? <div className="px-[14px] py-[12px] text-center text-[10px] text-[#898b82]">Your guest reviews will appear here.</div> : null}
					</section>
				</aside>
			</div>
		</div>
	);
}

function Metric({ icon, label, value, change, positive }: { icon: ReactNode; label: string; value: string; change: string; positive?: boolean }) {
	return <article className="flex min-h-[78px] min-w-0 items-start gap-[9px] rounded-lg border border-[#ecece7] bg-white p-[11px] [&>div]:grid [&>div]:min-w-0 [&>div]:gap-[2px] [&>div>small]:truncate [&>div>small]:text-[8px] [&>div>small]:text-[#808278] [&>div>strong]:text-[18px] [&>div>span]:truncate [&>div>span]:text-[7px] [&>div>span]:text-[#9a9c94] max-[480px]:gap-[6px] max-[480px]:p-[9px_7px]"><span className="mt-px grid size-[29px] shrink-0 place-items-center rounded-lg bg-[#f0f2e9] text-[#718044] [&_svg]:size-[13px] max-[480px]:size-6">{icon}</span><div><small>{label}</small><strong>{value}</strong><span className={positive ? "positive" : ""}>{positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}{change}</span></div></article>;
}

function SectionHeading({ title, to, link }: { title: string; to: string; link: string }) {
	return <header className="mb-[13px] flex items-end justify-between gap-3 [&_h1]:m-0 [&_h1]:text-[21px] [&_h1]:tracking-[-.55px] [&_h2]:text-[11px] [&_p]:mt-[5px] [&_p]:text-[10px] [&_p]:text-[#85877e] max-[480px]:items-start max-[480px]:flex-col"><h2>{title}</h2><Link to={to}>{link} <ArrowRight size={11} /></Link></header>;
}

function Legend({ color, label, value }: { color: string; label: string; value: string }) {
	return <div className="grid grid-cols-[7px_auto_auto] items-center gap-1 text-[7px] text-[#77796f] [&_i]:size-[6px] [&_i]:rounded-full [&_b]:text-[#45483f]"><i style={{ background: color }} /><span>{label}</span><b>{value}</b></div>;
}

function QuickAction({ icon, title, detail, to, badge }: { icon: ReactNode; title: string; detail: string; to: string; badge?: number }) {
	return <Link className="flex min-h-12 items-center gap-2 border-0 border-b border-[#f0f0ec] bg-white px-px py-[6px] text-left no-underline [&>span:first-child]:grid [&>span:first-child]:size-[27px] [&>span:first-child]:shrink-0 [&>span:first-child]:place-items-center [&>span:first-child]:rounded-[7px] [&>span:first-child]:bg-[#f1f3ea] [&>span:nth-child(2)]:grid [&>span:nth-child(2)]:min-w-0 [&>span:nth-child(2)]:flex-1 [&>span:nth-child(2)]:gap-[3px] [&_strong]:text-[8px] [&_strong]:text-[#4c5043] [&_small]:truncate [&_small]:text-[7px] [&_small]:text-[#96988f] [&>svg]:w-3 [&>svg]:shrink-0 [&>svg]:text-[#a4a69d] [&>b]:grid [&>b]:size-[17px] [&>b]:place-items-center [&>b]:rounded-full [&>b]:bg-[#b77845] [&>b]:text-[8px] [&>b]:text-white last:border-0" to={to}><span>{icon}</span><span><strong>{title}</strong><small>{detail}</small></span>{badge ? <b>{badge}</b> : <ArrowRight size={13} />}</Link>;
}