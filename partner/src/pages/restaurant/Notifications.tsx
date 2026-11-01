import { useEffect, useMemo, useState } from "react";
import { Bell, CalendarDays, CheckCheck, CircleDollarSign, ClipboardList, RefreshCw, Star } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import bookingApi from "../../api/restaurant/bookingApi";
import orderApi from "../../api/restaurant/orderApi";
import ratingApi from "../../api/restaurant/ratingApi";
import walletApi from "../../api/restaurant/walletApi";
import { getApiErrorMessage } from "../../api/axios";
import type { DineInBooking, Order, Payout, Rating } from "../../types";
import { formatCurrency } from "../../utils/formatCurrency";
import { formatLabel, formatPersonName } from "../../utils/helpers";

type NotificationCategory = "Order" | "Booking" | "Review" | "Payout";

interface RestaurantNotification {
	id: string;
	title: string;
	detail: string;
	createdAt: string;
	category: NotificationCategory;
	icon: LucideIcon;
}

const readStateKey = "digitalsafaris_restaurant_notifications_read_at";
const filters = ["All activity", "Orders", "Bookings", "Reviews", "Payouts"] as const;
type NotificationFilter = typeof filters[number];

function displayDate(value: string) {
	return new Date(value).toLocaleString(undefined, {
		month: "short",
		day: "numeric",
		hour: "numeric",
		minute: "2-digit",
	});
}

export function RestaurantNotificationsPage() {
	const [notifications, setNotifications] = useState<RestaurantNotification[]>([]);
	const [readAt, setReadAt] = useState("");
	const [activeFilter, setActiveFilter] = useState<NotificationFilter>("All activity");
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [reload, setReload] = useState(0);

	useEffect(() => {
		try {
			setReadAt(window.localStorage.getItem(readStateKey) ?? "");
		} catch {
			setError("Read status is unavailable in this browser.");
		}
	}, []);

	useEffect(() => {
		let cancelled = false;
		async function loadNotifications() {
			setLoading(true);
			setError("");
			const results = await Promise.allSettled([
				orderApi.list({ limit: 25 }),
				bookingApi.list({ limit: 25 }),
				ratingApi.list({ limit: 15 }),
				walletApi.transactions({ limit: 15 }),
				walletApi.get(),
			]);
			if (cancelled) return;

			const [orders, bookings, reviews, payouts, wallet] = results;
			const failures = results.flatMap((result, index) => result.status === "rejected"
				? [`${["orders", "bookings", "reviews", "payouts", "wallet"][index]}: ${getApiErrorMessage(result.reason, "Request failed.")}`]
				: []);
			const next: RestaurantNotification[] = [];
			const currency = wallet.status === "fulfilled" ? wallet.value.currency : "KES";

			if (orders.status === "fulfilled") {
				orders.value.data.forEach((order: Order) => next.push({
					id: `order-${order._id}`,
					title: `Order ${formatLabel(order.status)}`,
					detail: `${order.reference} · ${formatPersonName(order.customer)} · ${formatCurrency(order.total, order.currency, { maximumFractionDigits: 0 })}`,
					createdAt: order.updatedAt,
					category: "Order",
					icon: ClipboardList,
				}));
			}
			if (bookings.status === "fulfilled") {
				bookings.value.data.forEach((booking: DineInBooking) => next.push({
					id: `booking-${booking._id}`,
					title: `Booking ${formatLabel(booking.status)}`,
					detail: `${booking.reference} · ${formatPersonName(booking.customer)} · ${booking.partySize} guests`,
					createdAt: booking.updatedAt,
					category: "Booking",
					icon: CalendarDays,
				}));
			}
			if (reviews.status === "fulfilled") {
				reviews.value.data.forEach((review: Rating) => next.push({
					id: `review-${review._id}`,
					title: `New customer review · ${review.rating}/5`,
					detail: `${formatPersonName(review.customer)}${review.comment ? ` · ${review.comment}` : ""}`,
					createdAt: review.createdAt,
					category: "Review",
					icon: Star,
				}));
			}
			if (payouts.status === "fulfilled") {
				payouts.value.data.forEach((payout: Payout) => next.push({
					id: `payout-${payout._id}`,
					title: payout.status === "completed" ? "Payout completed" : `Payout ${formatLabel(payout.status)}`,
					detail: `${payout.reference} · ${formatCurrency(payout.amount, currency, { maximumFractionDigits: 0 })} · ${formatLabel(payout.method)}`,
					createdAt: payout.updatedAt,
					category: "Payout",
					icon: CircleDollarSign,
				}));
			}

			setNotifications(next.sort((first, second) => second.createdAt.localeCompare(first.createdAt)));
			setError(failures.length ? `Some activity could not be loaded (${failures.join("; ")}).` : "");
			setLoading(false);
		}

		void loadNotifications();
		return () => { cancelled = true; };
	}, [reload]);

	const counts = useMemo(() => ({
		"All activity": notifications.length,
		Orders: notifications.filter((item) => item.category === "Order").length,
		Bookings: notifications.filter((item) => item.category === "Booking").length,
		Reviews: notifications.filter((item) => item.category === "Review").length,
		Payouts: notifications.filter((item) => item.category === "Payout").length,
	}), [notifications]);
	const filteredNotifications = useMemo(() => activeFilter === "All activity"
		? notifications
		: notifications.filter((item) => item.category === activeFilter.slice(0, -1)), [activeFilter, notifications]);
	const unreadCount = notifications.filter((item) => item.createdAt > readAt).length;

	function markAllRead() {
		const now = new Date().toISOString();
		try {
			window.localStorage.setItem(readStateKey, now);
			setReadAt(now);
			setError("");
		} catch {
			setError("Could not save read status in this browser. Your notifications remain available.");
		}
	}

	return (
		<div className="grid gap-6">
			<header className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<p className="mb-2 text-xs font-semibold uppercase tracking-[.12em] text-[#9a573c]">Your restaurant workspace</p>
					<h1 className="m-0 text-3xl font-semibold tracking-[-.04em] text-[#33251f]">Notifications</h1>
					<p className="mb-0 mt-2 text-sm text-[#786a60]">A clear timeline of order, booking, review, and payout activity.</p>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					<button className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#ead8c7] bg-[#fffaf4] px-4 text-sm font-semibold text-[#704631] transition-colors hover:bg-[#f8eee1] disabled:cursor-not-allowed disabled:opacity-50" type="button" onClick={markAllRead} disabled={!unreadCount || loading}>
						<CheckCheck size={16} aria-hidden="true" /> Mark all read{unreadCount ? ` · ${unreadCount}` : ""}
					</button>
					<button className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#b85e3f] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#98472f] disabled:cursor-not-allowed disabled:opacity-50" type="button" onClick={() => setReload((value) => value + 1)} disabled={loading}>
						<RefreshCw className={loading ? "animate-spin" : ""} size={16} aria-hidden="true" /> Refresh
					</button>
				</div>
			</header>

			<section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Activity summary">
				{filters.slice(1).map((filter, index) => {
					const icons = [ClipboardList, CalendarDays, Star, CircleDollarSign];
					const Icon = icons[index];
					return (
						<article className="flex items-center gap-4 rounded-2xl border border-[#eadfd3] bg-[#fffaf4] p-5 shadow-[0_5px_18px_rgba(68,43,29,.035)]" key={filter}>
							<span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#f8e5d6] text-[#985039]"><Icon size={20} aria-hidden="true" /></span>
							<div><p className="m-0 text-sm text-[#786a60]">{filter}</p><strong className="mt-1 block text-2xl leading-none text-[#33251f]">{loading ? "—" : counts[filter]}</strong></div>
						</article>
					);
				})}
			</section>

			{error && (
				<div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#efd4c8] bg-[#fff6f1] px-4 py-3 text-sm text-[#914c37]" role="alert">
					<span>{error}</span>
					<button className="inline-flex items-center gap-2 rounded-md px-2 py-1 font-semibold text-[#914c37] hover:bg-[#f8e5d6]" type="button" onClick={() => setReload((value) => value + 1)}><RefreshCw size={14} /> Retry</button>
				</div>
			)}

			<section className="overflow-hidden rounded-2xl border border-[#eadfd3] bg-[#fffaf4] shadow-[0_8px_24px_rgba(68,43,29,.045)]" aria-label="Notification activity">
				<div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#efe4d9] px-5 py-5 sm:px-7">
					<div>
						<h2 className="m-0 text-lg font-semibold text-[#33251f]">Recent activity</h2>
						<p className="mb-0 mt-1 text-sm text-[#786a60]">Your latest updates, newest first.</p>
					</div>
					<span className="rounded-full bg-[#f8e5d6] px-3 py-1.5 text-xs font-semibold text-[#985039]">{filteredNotifications.length} updates</span>
				</div>
				<div className="flex flex-wrap gap-2 border-b border-[#efe4d9] bg-[#fcf6ef] px-5 py-3 sm:px-7" aria-label="Filter notifications">
					{filters.map((filter) => (
						<button
							className={`min-h-9 rounded-full px-3.5 text-sm font-semibold transition-colors ${activeFilter === filter ? "bg-[#6b3930] text-white" : "bg-transparent text-[#786a60] hover:bg-[#f4e8dc]"}`}
							key={filter}
							type="button"
							aria-pressed={activeFilter === filter}
							onClick={() => setActiveFilter(filter)}
						>
							{filter}<span className="ml-2 opacity-75">{loading ? "—" : counts[filter]}</span>
						</button>
					))}
				</div>
				{loading ? (
					<div className="px-5 py-14 text-center text-sm text-[#786a60]" role="status">Gathering recent restaurant activity…</div>
				) : filteredNotifications.length ? (
					<div className="divide-y divide-[#efe7de]">
						{filteredNotifications.map((notification) => {
							const Icon = notification.icon;
							const unread = notification.createdAt > readAt;
							return (
								<article className={`grid grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-4 px-5 py-4 sm:px-7 ${unread ? "bg-[#fff7ef]" : ""}`} key={notification.id}>
									<span className="grid size-11 place-items-center rounded-xl bg-[#f8e5d6] text-[#985039]"><Icon size={19} aria-hidden="true" /></span>
									<div className="min-w-0">
										<div className="flex flex-wrap items-center gap-2">
											<strong className="text-sm font-semibold text-[#33251f]">{notification.title}</strong>
											{unread && <span className="rounded-full bg-[#f7e4d3] px-2 py-0.5 text-[11px] font-semibold text-[#965038]">New</span>}
										</div>
										<p className="mb-0 mt-1 break-words text-sm leading-relaxed text-[#786a60]">{notification.detail}</p>
									</div>
									<time className="text-right text-xs text-[#8f8074]" dateTime={notification.createdAt}>{displayDate(notification.createdAt)}</time>
								</article>
							);
						})}
					</div>
				) : (
					<div className="flex min-h-56 flex-col items-center justify-center gap-3 px-5 text-center">
						<span className="grid size-14 place-items-center rounded-2xl bg-[#f8e5d6] text-[#985039]"><Bell size={25} aria-hidden="true" /></span>
						<h3 className="m-0 text-base font-semibold text-[#33251f]">{notifications.length ? "Nothing in this filter" : "No activity yet"}</h3>
						<p className="m-0 max-w-md text-sm leading-relaxed text-[#786a60]">{notifications.length ? "Choose another activity type to see more updates." : "New orders, bookings, reviews, and payout updates will appear here."}</p>
					</div>
				)}
			</section>
		</div>
	);
}
