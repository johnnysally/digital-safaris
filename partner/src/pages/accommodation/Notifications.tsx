import { useEffect, useMemo, useState } from "react";
import { Bell, CalendarCheck, CircleDollarSign, ListFilter, MessageSquareText, RefreshCw, Star } from "lucide-react";
import bookingApi from "../../api/accommodation/bookingApi";
import ratingApi from "../../api/accommodation/ratingApi";
import walletApi from "../../api/accommodation/walletApi";
import { getApiErrorMessage } from "../../api/axios";
import type { Booking, Payout, Rating } from "../../types";
import { AccommodationPartnerLayout, PageHeader } from "../../components/layout/Layout";
import { formatCurrency } from "../../utils/formatCurrency";
import { formatDate, formatRelativeDate } from "../../utils/formatDate";
import { formatLabel, formatPersonName } from "../../utils/helpers";

interface PartnerNotification {
	id: string;
	title: string;
	detail: string;
	date: string;
	category: string;
	icon: typeof Bell;
	tone: string;
}

export function NotificationsPage() {
	const [notifications, setNotifications] = useState<PartnerNotification[]>([]);
	const [activeFilter, setActiveFilter] = useState("All activity");
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [reload, setReload] = useState(0);

	useEffect(() => {
		let cancelled = false;

		async function loadNotifications() {
			setLoading(true);
			setError("");
			const results = await Promise.allSettled([
				bookingApi.list({ limit: 20 }),
				ratingApi.list({ limit: 10 }),
				walletApi.transactions({ limit: 10 }),
				walletApi.get(),
			]);
			if (cancelled) return;

			const [bookings, reviews, payouts, wallet] = results;
			const failures = results.flatMap((result, index) => {
				if (result.status === "fulfilled") return [];
				const endpoint = ["bookings", "reviews", "payments", "wallet"][index];
				return [`${endpoint}: ${getApiErrorMessage(result.reason, "Request failed.")}`];
			});
			const currency = wallet.status === "fulfilled" ? wallet.value.currency : "KES";

			const bookingNotifications = bookings.status === "fulfilled"
				? bookings.value.data.map((booking: Booking) => ({
					id: `booking-${booking._id}`,
					title: `Booking ${formatLabel(booking.status)}`,
					detail: `${formatPersonName(booking.customer)} · Check-in ${formatDate(booking.checkIn, { month: "short", day: "numeric" })} · ${formatCurrency(booking.total, booking.currency, { maximumFractionDigits: 0 })}`,
					date: booking.createdAt,
					category: "Booking",
					icon: CalendarCheck,
					tone: "text-[#347447] bg-[#edf5e9]",
				}))
				: [];
			const reviewNotifications = reviews.status === "fulfilled"
				? reviews.value.data.map((review: Rating) => ({
					id: `review-${review._id}`,
					title: "New guest review",
					detail: `${formatPersonName(review.customer)} · ${review.rating} out of 5 stars${review.comment ? ` · ${review.comment}` : ""}`,
					date: review.createdAt,
					category: "Review",
					icon: Star,
					tone: "text-[#925b16] bg-[#f8efd9]",
				}))
				: [];
			const payoutNotifications = payouts.status === "fulfilled"
				? payouts.value.data.map((payout: Payout) => ({
					id: `payout-${payout._id}`,
					title: payout.status === "completed" ? "Payment received" : `Payment ${formatLabel(payout.status)}`,
					detail: `${formatCurrency(payout.amount, currency, { maximumFractionDigits: 0 })} · ${formatLabel(payout.method)} payout`,
					date: payout.createdAt,
					category: "Payment",
					icon: CircleDollarSign,
					tone: "text-[#80511e] bg-[#f5ead8]",
				}))
				: [];

			setNotifications(
				[...bookingNotifications, ...reviewNotifications, ...payoutNotifications]
					.sort((first, second) => second.date.localeCompare(first.date)),
			);
			setError(failures.length ? `Some notifications could not be loaded (${failures.join("; ")}).` : "");
			setLoading(false);
		}

		void loadNotifications();
		return () => {
			cancelled = true;
		};
	}, [reload]);

	const groupedNotifications = useMemo(() => {
		const groups = new Map<string, PartnerNotification[]>();
		const filteredNotifications = activeFilter === "All activity"
			? notifications
			: notifications.filter((notification) => notification.category === activeFilter);
		for (const notification of filteredNotifications) {
			const day = new Date(notification.date).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
			groups.set(day, [...(groups.get(day) ?? []), notification]);
		}
		return [...groups.entries()];
	}, [activeFilter, notifications]);

	const categoryCounts = useMemo(() => ({
		"All activity": notifications.length,
		Booking: notifications.filter(({ category }) => category === "Booking").length,
		Review: notifications.filter(({ category }) => category === "Review").length,
		Payment: notifications.filter(({ category }) => category === "Payment").length,
	}), [notifications]);

	return (
		<AccommodationPartnerLayout>
			<div className="w-full">
				<PageHeader title="Notifications" subtitle="Stay up to date with bookings, guest reviews, and payments." />
				{error ? (
					<div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#eed3cf] bg-[#fff8f7] px-4 py-3 text-sm text-[#914940]" role="alert">
						<span>{error}</span>
						<button className="inline-flex items-center gap-1.5 border-0 bg-transparent font-semibold text-[#914940] underline" type="button" onClick={() => setReload((current) => current + 1)}>
							<RefreshCw size={14} /> Retry
						</button>
					</div>
				) : null}

				<section className="mb-5 grid gap-3 sm:grid-cols-3" aria-label="Notification summary">
					{([
						["Bookings", categoryCounts.Booking, CalendarCheck, "text-[#347447] bg-[#edf5e9]"],
						["Guest reviews", categoryCounts.Review, Star, "text-[#925b16] bg-[#f8efd9]"],
						["Payments", categoryCounts.Payment, CircleDollarSign, "text-[#80511e] bg-[#f5ead8]"],
					] as const).map(([label, count, Icon, tone]) => (
						<div className="flex items-center gap-3 rounded-xl border border-[#e9dfd1] bg-[rgba(255,252,247,.92)] p-4 shadow-[0_3px_12px_rgba(54,37,20,.025)]" key={label}>
							<span className={`grid size-11 shrink-0 place-items-center rounded-xl ${tone}`}><Icon size={19} /></span>
							<div><p className="m-0 text-[11px] text-[#81766a]">{label}</p><strong className="mt-0.5 block text-xl leading-none text-[#332b24]">{loading ? "—" : count}</strong></div>
						</div>
					))}
				</section>

				<section className="overflow-hidden rounded-2xl border border-[#e9dfd1] bg-[rgba(255,252,247,.94)] shadow-[0_8px_24px_rgba(54,37,20,.045)]" aria-label="Notifications list">
					<div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#eee5d9] px-4 py-4 sm:px-6">
						<div>
							<div className="flex items-center gap-2">
								<h2 className="m-0 font-serif text-lg font-semibold text-[#29231e]">Recent activity</h2>
								<span className="rounded-full bg-[#f5ead8] px-2.5 py-1 text-[10px] font-semibold text-[#80511e]">{activeFilter === "All activity" ? notifications.length : categoryCounts[activeFilter as keyof typeof categoryCounts]}</span>
							</div>
							<p className="mt-1 text-xs text-[#70675e]">A timeline of updates from your accommodation account</p>
						</div>
						<button type="button" onClick={() => setReload((current) => current + 1)} disabled={loading} className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-[#e4d9ca] bg-white px-3 text-xs font-semibold text-[#6c5840] transition hover:bg-[#fbf7f0] disabled:opacity-50"><RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh</button>
					</div>

					<div className="flex flex-wrap items-center gap-2 border-b border-[#eee5d9] bg-[#fcfaf6] px-4 py-3 sm:px-6">
						<span className="mr-1 inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[.08em] text-[#887c70]"><ListFilter size={13} /> Filter</span>
						{Object.entries(categoryCounts).map(([category, count]) => (
							<button key={category} type="button" onClick={() => setActiveFilter(category)} aria-pressed={activeFilter === category} className={`inline-flex min-h-8 items-center gap-1.5 rounded-full border px-3 text-[11px] font-semibold transition ${activeFilter === category ? "border-[#9b5b17] bg-[#9b5b17] text-white" : "border-[#e7ddcf] bg-white text-[#695d51] hover:bg-[#f8f1e6]"}`}>
								{category}<span className={activeFilter === category ? "text-white/75" : "text-[#9b8e80]"}>{count}</span>
							</button>
						))}
					</div>

					{loading ? (
						<div className="px-5 py-12 text-center text-sm text-[#70675e]" role="status">Loading notifications…</div>
					) : notifications.length === 0 ? (
						<div className="flex min-h-[260px] flex-col items-center justify-center gap-2 px-5 text-center">
							<span className="grid h-12 w-12 place-items-center rounded-full bg-[#f5ead8] text-[#8b4e16]"><MessageSquareText size={21} /></span>
							<strong className="text-sm text-[#332b24]">You’re all caught up</strong>
							<p className="m-0 max-w-sm text-xs leading-relaxed text-[#81766a]">New bookings, reviews, and payment updates will appear here.</p>
						</div>
					) : groupedNotifications.length === 0 ? (
						<div className="flex min-h-[210px] flex-col items-center justify-center gap-2 px-5 text-center">
							<span className="grid size-11 place-items-center rounded-full bg-[#f5ead8] text-[#8b4e16]"><ListFilter size={19} /></span>
							<strong className="text-sm text-[#332b24]">No {activeFilter.toLowerCase()} activity</strong>
							<p className="m-0 max-w-sm text-xs leading-relaxed text-[#81766a]">Choose another filter to see more account updates.</p>
						</div>
					) : (
						<div>
							{groupedNotifications.map(([day, entries]) => (
								<div key={day}>
									<h3 className="sticky top-0 border-b border-[#f0e9df] bg-[#fbf7f0] px-4 py-2 text-[10px] font-semibold uppercase tracking-[.08em] text-[#81766a] sm:px-6">{day}</h3>
									{entries.map(({ id, title, detail, date, category, icon: Icon, tone }) => (
										<article className="flex items-start gap-3 border-b border-[#f0e9df] px-4 py-4 transition-colors hover:bg-[#fffdf8] last:border-0 sm:gap-4 sm:px-6" key={id}>
											<span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${tone}`}><Icon size={18} /></span>
											<div className="min-w-0 flex-1">
												<div className="flex flex-wrap items-center gap-2">
													<h4 className="m-0 text-sm font-semibold text-[#332b24]">{title}</h4>
													<span className="rounded-full bg-[#f5f1e9] px-2 py-0.5 text-[9px] font-medium text-[#756a5f]">{category}</span>
												</div>
												<p className="mt-1 break-words text-xs leading-relaxed text-[#70675e]">{detail}</p>
											</div>
											<time className="shrink-0 pt-0.5 text-[10px] text-[#81766a]" dateTime={date}>{formatRelativeDate(date)}</time>
										</article>
									))}
								</div>
							))}
						</div>
					)}
				</section>
			</div>
		</AccommodationPartnerLayout>
	);
}
