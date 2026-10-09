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
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import availabilityApi from "../../api/accommodation/availabilityApi";
import bookingApi from "../../api/accommodation/bookingApi";
import profileApi from "../../api/accommodation/profileApi";
import propertyApi from "../../api/accommodation/propertyApi";
import ratingApi from "../../api/accommodation/ratingApi";
import roomApi from "../../api/accommodation/roomApi";
import walletApi from "../../api/accommodation/walletApi";
import { getApiErrorMessage } from "../../api/axios";
import { AccommodationPartnerLayout, StatusBadge } from "../../components/layout/Layout";
import type { AccommodationPartner, Booking, Payout, Property, Rating, Room, RoomAvailability, Wallet } from "../../types";
import { formatCurrency } from "../../utils/formatCurrency";
import { formatDate, formatRelativeDate } from "../../utils/formatDate";
import { partnerImages } from "../../config/partnerImages";
import { formatLabel, formatPersonName } from "../../utils/helpers";

type BookingWithProperty = Omit<Booking, "property" | "room"> & {
	property: string | { name: string };
	room: string | { name: string };
};

interface DashboardData {
	partner?: AccommodationPartner;
	properties: Property[];
	rooms: Room[];
	bookings: BookingWithProperty[];
	bookingTotal: number;
	availability: RoomAvailability[];
	reviews: Rating[];
	wallet?: Wallet;
	payouts: Payout[];
}

const panelClass = "min-w-0 overflow-hidden rounded-[9px] border border-[#e9dfd1] bg-[rgba(255,252,247,.82)] shadow-[0_3px_12px_rgba(54,37,20,.035)]";
const panelTitleClass = "font-serif text-[15px] font-semibold text-[#29231e]";

function dayKey(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

function initials(name: string): string {
	return name
		.split(/\s+/)
		.map((part) => part[0])
		.join("")
		.slice(0, 2)
		.toUpperCase();
}

export function DashboardPage() {
	const [data, setData] = useState<DashboardData | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [reload, setReload] = useState(0);

	useEffect(() => {
		let cancelled = false;

		async function loadDashboard() {
			setLoading(true);
			setError("");
			const today = dayKey(new Date());
			const results = await Promise.allSettled([
				profileApi.get(),
				propertyApi.list(),
				roomApi.list(),
				bookingApi.list({ limit: 100 }),
				availabilityApi.list({ from: today, to: today }),
				ratingApi.list({ limit: 5 }),
				walletApi.get(),
				walletApi.transactions({ limit: 5 }),
			]);

			if (cancelled) return;

			const [profile, properties, rooms, bookings, availability, reviews, wallet, payouts] = results;
			const errors = results.flatMap((result, index) => {
				if (result.status === "fulfilled") return [];
				const labels = ["profile", "properties", "rooms", "bookings", "availability", "reviews", "wallet", "payouts"];
				return [`${labels[index]}: ${getApiErrorMessage(result.reason, "Request failed.")}`];
			});

			setData({
				partner: profile.status === "fulfilled" ? profile.value.partner : undefined,
				properties: properties.status === "fulfilled" ? properties.value : [],
				rooms: rooms.status === "fulfilled" ? rooms.value : [],
				bookings: bookings.status === "fulfilled" ? bookings.value.data as BookingWithProperty[] : [],
				bookingTotal: bookings.status === "fulfilled" ? bookings.value.meta.total : 0,
				availability: availability.status === "fulfilled" ? availability.value : [],
				reviews: reviews.status === "fulfilled" ? reviews.value.data : [],
				wallet: wallet.status === "fulfilled" ? wallet.value : undefined,
				payouts: payouts.status === "fulfilled" ? payouts.value.data : [],
			});
			setError(errors.length ? `Some dashboard data could not be loaded (${errors.join("; ")}).` : "");
			setLoading(false);
		}

		void loadDashboard();
		return () => {
			cancelled = true;
		};
	}, [reload]);

	const today = dayKey(new Date());
	const currentMonth = today.slice(0, 7);
	const previousMonthDate = new Date();
	previousMonthDate.setMonth(previousMonthDate.getMonth() - 1);
	const previousMonth = dayKey(previousMonthDate).slice(0, 7);
	const bookings = useMemo(
		() => [...(data?.bookings ?? [])].sort((first, second) => second.createdAt.localeCompare(first.createdAt)),
		[data?.bookings],
	);
	const recentBookings = bookings.slice(0, 4);
	const property = data?.properties[0];
	const partner = data?.partner;
	const currency = data?.wallet?.currency ?? bookings[0]?.currency ?? "KES";
	const activeRooms = (data?.rooms ?? []).filter((room) => room.status === "active");
	const activeRoomCount = activeRooms.reduce((total, room) => total + room.totalUnits, 0);
	const occupiedRoomCount = (data?.availability ?? []).reduce((total, item) => total + item.bookedUnits, 0);
	const occupancy = activeRoomCount
		? Math.min(100, Math.round((occupiedRoomCount / activeRoomCount) * 100))
		: 0;
	const checkInsToday = bookings.filter(
		(booking) => dayKey(new Date(booking.checkIn)) === today && booking.status === "confirmed",
	).length;
	const eligibleBookings = bookings.filter((booking) => !["cancelled", "rejected"].includes(booking.status));
	const monthRevenue = eligibleBookings
		.filter((booking) => booking.createdAt.slice(0, 7) === currentMonth)
		.reduce((sum, booking) => sum + booking.total, 0);
	const previousMonthRevenue = eligibleBookings
		.filter((booking) => booking.createdAt.slice(0, 7) === previousMonth)
		.reduce((sum, booking) => sum + booking.total, 0);
	const revenueChange = previousMonthRevenue > 0
		? Math.round(((monthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100)
		: undefined;
	const bookingTrend = Array.from({ length: 7 }, (_, index) => {
		const date = new Date();
		date.setDate(date.getDate() - (6 - index));
		const key = dayKey(date);
		return {
			day: date.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
			bookings: bookings.filter((booking) => dayKey(new Date(booking.createdAt)) === key).length,
		};
	});
	const activities = [
		...recentBookings.slice(0, 2).map((booking) => ({
			key: `booking-${booking._id}`,
			title: `Booking ${formatLabel(booking.status)}`,
			detail: `${formatPersonName(booking.customer)} · ${formatDate(booking.createdAt)}`,
			time: formatRelativeDate(booking.createdAt),
			icon: CheckCircle2,
		})),
		...(data?.reviews.slice(0, 1).map((review) => ({
			key: `review-${review._id}`,
			title: "New guest review",
			detail: `${formatPersonName(review.customer)} · ${formatDate(review.createdAt)}`,
			time: formatRelativeDate(review.createdAt),
			icon: Star,
		})) ?? []),
		...(data?.payouts.slice(0, 1).map((payout: Payout) => ({
			key: `payout-${payout._id}`,
			title: "Payment received",
			detail: `${formatCurrency(payout.amount, currency)} · ${formatDate(payout.createdAt)}`,
			time: formatRelativeDate(payout.createdAt),
			icon: Coins,
		})) ?? []),
	].slice(0, 4);

	return (
		<AccommodationPartnerLayout partner={partner}>
			<div className="w-full">
				<div className="mb-4">
					<h1 className="m-0 font-serif text-[clamp(22px,1.7vw,30px)] font-semibold leading-tight tracking-[-0.02em] text-[#29231e]">
						Good morning, {partner?.name ?? "Partner"}
					</h1>
					<p className="mt-1.5 text-[clamp(12px,.9vw,15px)] text-[#4f4943]">Here's what's happening with your property today.</p>
				</div>

				{error ? (
					<div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-md border border-[#eed3cf] bg-[#fff8f7] px-3 py-2 text-[11px] text-[#914940]" role="alert">
						<span>{error}</span>
						<button className="border-0 bg-transparent font-semibold text-[#914940] underline" type="button" onClick={() => setReload((current) => current + 1)}>Retry</button>
					</div>
				) : null}

				<section className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Property overview">
					<MetricCard icon={CalendarDays} label="Total Bookings" value={String(partner?.totalBookings ?? data?.bookingTotal ?? 0)} note="All reservations" />
					<MetricCard icon={UserRound} label="Check-ins Today" value={String(checkInsToday)} note={formatDate(new Date(), { month: "short", day: "numeric" })} />
					<MetricCard icon={Gauge} label="Occupancy Rate" value={`${occupancy}%`} note={`${occupiedRoomCount} of ${activeRoomCount} rooms occupied`} />
					<MetricCard
						icon={Coins}
						label="Revenue (This Month)"
						value={formatCurrency(monthRevenue, currency, { maximumFractionDigits: 0 })}
						note={revenueChange === undefined ? "From confirmed bookings" : `${revenueChange >= 0 ? "+" : ""}${revenueChange}% vs. last month`}
						noteTone={revenueChange !== undefined && revenueChange >= 0 ? "positive" : "neutral"}
					/>
				</section>

				<div className="mb-5 grid grid-cols-1 items-stretch gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(350px,.9fr)]">
					<section className={panelClass}>
						<div className="flex min-h-[40px] items-center justify-between gap-3 border-b border-[#eee5d9] px-3 py-2">
							<h2 className={panelTitleClass}>Recent Bookings</h2>
							<Link className="inline-flex items-center gap-1 text-[9px] font-medium text-[#895017] no-underline hover:underline" to="/partner/accommodation/bookings">
								View all bookings <ArrowRight size={12} />
							</Link>
						</div>
						<div className="overflow-x-auto">
							<table className="w-full border-collapse text-left text-[10px]">
								<thead className="bg-[#f8f2e8] text-[#49433d]">
									<tr>
										{["Guest", "Check-in", "Nights", "Status", "Amount"].map((heading) => (
											<th className="whitespace-nowrap px-3 py-2 font-medium" key={heading}>{heading}</th>
										))}
									</tr>
								</thead>
								<tbody>
									{recentBookings.map((booking) => (
										<tr className="border-b border-[#eee7dd] last:border-0" key={booking._id}>
											<td className="whitespace-nowrap px-3 py-2">
												<span className="flex items-center gap-2">
													{booking.customer?.avatar ? (
														<img className="h-7 w-7 rounded-full object-cover" src={booking.customer.avatar} alt="" />
													) : (
														<span className="grid h-7 w-7 place-items-center rounded-full bg-[#ead9bd] text-[9px] font-semibold text-[#704718]" aria-hidden="true">
															{initials(formatPersonName(booking.customer))}
														</span>
													)}
													{formatPersonName(booking.customer)}
												</span>
											</td>
											<td className="whitespace-nowrap px-3 py-2">{formatDate(booking.checkIn, { month: "short", day: "numeric", year: "numeric" })}</td>
											<td className="px-3 py-2">{booking.nights}</td>
											<td className="px-3 py-2"><StatusBadge status={formatLabel(booking.status)} /></td>
											<td className="whitespace-nowrap px-3 py-2 font-medium">{formatCurrency(booking.total, booking.currency, { maximumFractionDigits: 0 })}</td>
										</tr>
									))}
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
								src={property?.images?.[0] ?? partner?.coverImage ?? partnerImages.accommodation.dashboardFallback}
								alt={property?.name ?? partner?.name ?? "Safari accommodation"}
							/>
							<span className="absolute right-2 top-2 rounded-md bg-[#f1f8eb] px-2 py-1 text-[9px] font-semibold text-[#317445]">
								{property?.status ?? (property ? "Active" : "Listing")}
							</span>
						</div>
						<div className="flex flex-1 flex-col justify-between p-3">
							<div>
								<h2 className={`${panelTitleClass} text-[14px]`}>{property?.name ?? partner?.name ?? "Your property"}</h2>
								<p className="mt-0.5 text-[10px] text-[#70675e]">{property?.type ?? partner?.type ?? "Accommodation"}</p>
								<div className="mt-2 flex items-center gap-1 text-[10px] text-[#423a32]">
									<Star className="text-[#e49a22]" size={13} fill="currentColor" />
									<strong>{(property?.rating ?? partner?.rating ?? 0).toFixed(1)}</strong>
									<span>({property?.totalRatings ?? partner?.totalRatings ?? 0} reviews)</span>
								</div>
							</div>
							<div className="mt-3 grid grid-cols-3 divide-x divide-[#eee5d9] border-t border-[#eee5d9] pt-2.5">
								<SummaryMetric icon={BedDouble} value={String(property?.totalRooms ?? activeRoomCount)} label="Rooms" />
								<SummaryMetric icon={CalendarDays} value={String(property?.totalBookings ?? partner?.totalBookings ?? 0)} label="Bookings" />
								<SummaryMetric icon={Coins} value={formatCurrency(monthRevenue, currency, { maximumFractionDigits: 0 })} label="Revenue (This Month)" />
							</div>
						</div>
					</aside>
				</div>

				<div className="grid grid-cols-1 gap-4 xl:grid-cols-2 2xl:grid-cols-[minmax(0,.95fr)_minmax(0,1.05fr)_minmax(0,1fr)]">
					<section className={`${panelClass} p-4 2xl:p-3`}>
						<h2 className={`${panelTitleClass} mb-2 text-[12px]`}>Quick Actions</h2>
						<div className="grid grid-cols-2 gap-2">
							<QuickAction to="/partner/accommodation/properties/new" icon={CalendarPlus} title="Add Property" description="Create a new listing" />
							<QuickAction to="/partner/accommodation/bookings" icon={CalendarDays} title="Manage Bookings" description="View reservations" />
							<QuickAction to="/partner/accommodation/notifications" icon={MessageSquareText} title="Notifications" description="Recent account activity" />
							<QuickAction to="/partner/accommodation/reports" icon={ChartNoAxesColumnIncreasing} title="View Reports" description="Check performance" />
						</div>
					</section>

					<section className={`${panelClass} p-4 2xl:p-3`}>
						<div className="mb-2 flex items-center justify-between gap-2">
							<h2 className={`${panelTitleClass} text-[12px]`}>Booking Trends</h2>
							<span className="rounded border border-[#e8dfd3] px-2 py-1 text-[8px] text-[#5e554c]">Last 7 days</span>
						</div>
						<div className="h-[210px] min-w-0 2xl:h-[190px]">
							<ResponsiveContainer width="100%" height="100%">
								<AreaChart data={bookingTrend} margin={{ top: 8, right: 5, left: -20, bottom: 0 }}>
									<defs>
										<linearGradient id="accommodationBookingFill" x1="0" y1="0" x2="0" y2="1">
											<stop offset="0%" stopColor="#d8801d" stopOpacity={0.2} />
											<stop offset="100%" stopColor="#d8801d" stopOpacity={0.02} />
										</linearGradient>
									</defs>
									<CartesianGrid stroke="#eee6db" vertical />
									<XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: "#8d847a", fontSize: 8 }} />
									<YAxis allowDecimals={false} width={28} tickLine={false} axisLine={false} tick={{ fill: "#8d847a", fontSize: 8 }} />
									<Tooltip />
									<Area type="monotone" dataKey="bookings" stroke="#cf7914" strokeWidth={2} fill="url(#accommodationBookingFill)" dot={{ r: 2.5, fill: "#cf7914", strokeWidth: 0 }} />
								</AreaChart>
							</ResponsiveContainer>
						</div>
					</section>

					<section className={`${panelClass} p-4 2xl:p-3 xl:col-span-2 2xl:col-span-1`}>
						<h2 className={`${panelTitleClass} mb-1 text-[12px]`}>Recent Activity</h2>
						<div>
							{activities.map(({ key, title, detail, time, icon: Icon }) => (
								<div className="flex items-center gap-2.5 border-b border-[#eee7dd] py-2 last:border-0" key={key}>
									<span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#f5ecdc] text-[#8e5116]">
										<Icon size={14} />
									</span>
									<div className="min-w-0 flex-1">
										<strong className="block truncate text-[9px] font-medium text-[#332b24]">{title}</strong>
										<span className="block truncate text-[8px] text-[#82786f]">{detail}</span>
									</div>
									<time className="shrink-0 text-[8px] text-[#82786f]">{time}</time>
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
				<p className="truncate text-[11px] font-medium text-[#39332d] 2xl:text-[13px]">{label}</p>
				<strong className="mt-1 block truncate text-[25px] font-semibold leading-tight tracking-[-0.04em] text-[#24201c] 2xl:text-[30px]">{value}</strong>
				<span className={`mt-1.5 block truncate text-[9px] 2xl:text-[10px] ${noteTone === "positive" ? "text-[#25803e]" : "text-[#82786f]"}`}>{note}</span>
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
				<strong className="block truncate text-[10px] font-semibold text-[#332b24]">{value}</strong>
				<span className="block truncate text-[8px] text-[#82786f]">{label}</span>
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
		<Link className="flex min-h-[64px] flex-col justify-center rounded-[7px] border border-[#eee5d9] bg-[#fffcf7] px-2 py-1.5 text-[#332b24] no-underline transition-colors hover:border-[#dfc9a8] hover:bg-[#fbf3e7]" to={to}>
			<span className="mb-1 grid h-7 w-7 place-items-center rounded-full bg-[#f5ead8] text-[#8b4e16]">
				<Icon size={14} />
			</span>
			<strong className="text-[9px] font-medium leading-tight">{title}</strong>
			<small className="mt-0.5 truncate text-[8px] text-[#82786f]">{description}</small>
		</Link>
	);
}
