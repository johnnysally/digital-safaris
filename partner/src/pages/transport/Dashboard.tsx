import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowRight, BarChart3, Bell, BellRing, BusFront, CalendarDays, CarFront, CheckCircle2, ChevronDown, CircleDollarSign, CircleUserRound, Clock3, CreditCard, Gauge, MapPin, MessageSquareText, Settings, ShieldCheck, Star, Truck, UserRound, Users, Wallet, Wrench, LogOut } from "lucide-react";
import profileApi from "../../api/transport/profileApi";
import vehicleApi from "../../api/transport/vehicleApi";
import tripApi from "../../api/transport/tripApi";
import jobApi from "../../api/transport/jobApi";
import locationApi from "../../api/transport/locationApi";
import ratingApi from "../../api/transport/ratingApi";
import walletApi from "../../api/transport/walletApi";
import { getApiErrorMessage } from "../../api/axios";
import type { DeliveryJob, DriverLocation, Payout, Rating, RatingSummary, TransportPartner, Trip, Vehicle, Wallet as PartnerWallet } from "../../types";
import { partnerImages } from "../../utils/constants";
import authApi from "../../api/transport/authApi";
import storage from "../../utils/storage";
import { ApiFeedback, PageHeader, StatusBadge } from "../../components/layout/Layout";

const transportNav = [
	{ label: "Dashboard", to: "/partner/transport/dashboard", icon: Gauge },
	{ label: "My Vehicles", to: "/partner/transport/vehicles", icon: BusFront },
	{ label: "Bookings", to: "/partner/transport/trips", icon: CalendarDays },
	{ label: "Delivery Jobs", to: "/partner/transport/jobs", icon: Truck },
	{ label: "Availability", to: "/partner/transport/availability", icon: Clock3 },
	{ label: "Messages", to: "/partner/transport/messages", icon: MessageSquareText },
	{ label: "Notifications", to: "/partner/transport/notifications", icon: BellRing },
	{ label: "Reviews", to: "/partner/transport/reviews", icon: Star },
	{ label: "Payments", to: "/partner/transport/payments", icon: CreditCard },
	{ label: "Reports", to: "/partner/transport/reports", icon: BarChart3 },
	{ label: "Profile", to: "/partner/transport/profile", icon: UserRound },
	{ label: "Settings", to: "/partner/transport/settings", icon: Settings },
];

export function TransportLayout({ children }: { children: ReactNode }) {
	const navigate = useNavigate();
	const [partner, setPartner] = useState<TransportPartner | null>(null);

	useEffect(() => {
		let cancelled = false;
		profileApi.get().then(({ partner: profile }) => {
			if (!cancelled) setPartner(profile);
		}).catch(() => undefined);
		return () => { cancelled = true; };
	}, []);

	async function signOut() {
		await authApi.logout();
		storage.clearRole("transport");
		navigate("/partner/transport/login", { replace: true });
	}

	return (
		<div className="transport-shell">
			<aside className="transport-sidebar">
				<div className="transport-sidebar-photo" />
				<div className="transport-sidebar-inner">
					<Link to="/partner" className="transport-brand" aria-label="DigitalSafaris partner workspaces">
						<span className="transport-brand-mark"><BusFront size={26} /></span>
						<strong>DigitalSafaris</strong>
						<small>Travel · Explore · Experience</small>
					</Link>
					<nav className="transport-nav" aria-label="Transport navigation">
						{transportNav.map(({ label, to, icon: Icon }) => <NavLink key={to} to={to} end={label === "Dashboard"} className={({ isActive }) => `transport-nav-link ${isActive ? "active" : ""}`}><Icon size={17} /><span>{label}</span></NavLink>)}
					</nav>
					<button className="transport-signout" type="button" onClick={() => void signOut()}><LogOut size={16} /> Sign out</button>
				</div>
			</aside>
			<div className="transport-workspace">
				<header className="transport-top-header">
					<label className="transport-search"><span className="sr-only">Search transport records</span><input placeholder="Search anything..." /></label>
					<div className="transport-header-profile">
						<Link className="transport-notification" to="/partner/transport/notifications" aria-label="Notifications"><Bell size={17} /></Link>
						{partner?.avatar ? <img src={partner.avatar} alt="" /> : <span className="transport-avatar-fallback"><CircleUserRound size={22} /></span>}
						<div><strong>{partner ? `${partner.firstName} ${partner.lastName}` : "Transport Partner"}</strong><small>Transport Partner</small></div>
						<ChevronDown size={15} />
					</div>
				</header>
				<main className="transport-main">{children}</main>
			</div>
		</div>
	);
}

interface DashboardData {
	partner: TransportPartner;
	vehicles: Vehicle[];
	trips: Trip[];
	jobs: DeliveryJob[];
	location: DriverLocation;
	wallet: PartnerWallet;
	payouts: Payout[];
	averageRating: number;
	reviewCount: number;
}

function money(value: number, currency: string) {
	try { return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 0 }).format(value); }
	catch { return `${currency} ${value.toLocaleString()}`; }
}

function formatDate(value: string) {
	return new Date(value).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function addressLabel(address: { line1?: string; town?: string; county?: string }) {
	return [address.line1, address.town, address.county].filter(Boolean).join(", ") || "Location pending";
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
			try {
				const [profile, vehicles, trips, jobs, location, wallet, payouts, ratings] = await Promise.all([
					profileApi.get(), vehicleApi.list(), tripApi.list({ limit: 100 }), jobApi.mine({ limit: 100 }), locationApi.get(), walletApi.get(), walletApi.transactions({ limit: 10 }), ratingApi.summary(),
				]);
				if (!cancelled) setData({ partner: profile.partner, vehicles, trips: trips.data, jobs: jobs.data, location, wallet, payouts: payouts.data, averageRating: ratings.average, reviewCount: ratings.count });
			} catch (requestError) {
				if (!cancelled) setError(getApiErrorMessage(requestError, "Could not load transport dashboard data."));
			} finally {
				if (!cancelled) setLoading(false);
			}
		}
		void loadDashboard();
		return () => { cancelled = true; };
	}, [reload]);

	const vehicles = data?.vehicles ?? [];
	const trips = data?.trips ?? [];
	const activeVehicles = vehicles.filter((vehicle) => vehicle.status === "active");
	const availableJobs = (data?.jobs ?? []).filter((job) => job.status === "accepted" || job.status === "picked_up");
	const upcomingTrips = trips.filter((trip) => new Date(trip.scheduledAt).getTime() >= Date.now() && ["requested", "accepted", "ongoing"].includes(trip.status)).sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt)).slice(0, 4);
	const recentTrips = [...trips].sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt)).slice(0, 5);
	const activeVehicle = activeVehicles.find((vehicle) => vehicle.isDefault) ?? activeVehicles[0] ?? vehicles[0];
	const online = data?.partner.isOnline ?? data?.location.isOnline ?? false;
	const revenueData = useMemo(() => Array.from({ length: 7 }, (_, index) => {
		const date = new Date();
		date.setDate(date.getDate() - (6 - index));
		const key = date.toISOString().slice(0, 10);
		const value = trips.filter((trip) => trip.createdAt.slice(0, 10) === key).reduce((sum, trip) => sum + trip.partnerEarnings, 0);
		return { day: date.toLocaleDateString(undefined, { month: "short", day: "numeric" }), revenue: value };
	}), [trips]);
	const serviceMix = useMemo(() => {
		const counts = trips.reduce<Record<string, number>>((result, trip) => {
			const label = trip.type || "Other";
			result[label] = (result[label] ?? 0) + 1;
			return result;
		}, {});
		return Object.entries(counts).slice(0, 3).map(([name, value], index) => ({ name: name.replace(/_/g, " "), value, color: ["#c58a2a", "#a85c1d", "#e3c795"][index] }));
	}, [trips]);
	const lastPayout = data?.payouts.find((payout) => payout.status === "completed");
	const currency = data?.wallet.currency ?? "KES";

	return (
		<TransportLayout>
			<div className="transport-dashboard">
				<div className="transport-dashboard-heading">
					<div><h1>Good morning, {data ? `${data.partner.firstName} ${data.partner.lastName}` : "Transport Partner"}.</h1><p>Here’s what’s happening with your transport services today.</p></div>
					<button className="transport-date-filter" type="button" onClick={() => setReload((current) => current + 1)}><CalendarDays size={14} /> Last 7 days <ChevronDown size={13} /></button>
				</div>
				<ApiFeedback loading={loading} error={error} onRetry={() => setReload((current) => current + 1)} />

				<div className="transport-summary-row"><div className="transport-kpi-grid">
					<article className="transport-kpi"><span><BusFront size={18} /></span><div><small>Total Bookings</small><strong>{data?.partner.totalTrips ?? trips.length}</strong><em><ArrowRight size={11} /> {trips.length} loaded trips</em></div></article>
					<article className="transport-kpi"><span><CarFront size={18} /></span><div><small>Active Vehicles</small><strong>{activeVehicles.length}</strong><em><ArrowRight size={11} /> {vehicles.length} in fleet</em></div></article>
					<article className="transport-kpi"><span><Users size={18} /></span><div><small>Driver Status</small><strong>{online ? "Online" : "Offline"}</strong><em><ArrowRight size={11} /> {data?.location.isAvailable ? "Available for work" : "Not available"}</em></div></article>
					<article className="transport-kpi"><span><Wallet size={18} /></span><div><small>Total Revenue</small><strong>{money(data?.wallet.totalEarned ?? 0, currency)}</strong><em><ArrowRight size={11} /> {money(data?.wallet.pendingPayout ?? 0, currency)} pending</em></div></article>
				</div>
				<div className="transport-promo" style={{ backgroundImage: `linear-gradient(90deg,rgba(28,20,13,.76),rgba(28,20,13,.12)),url('${partnerImages.supportBanner}')` }}>
					<div><p>TRANSPORT PARTNER</p><h2>Reliable Transport<br />for Unforgettable Journeys</h2><span>Safe · Comfortable · On Time</span><Link to="/partner/transport/vehicles">Manage Fleet <ArrowRight size={13} /></Link></div>
				</div>
				</div>

				<div className="transport-main-grid">
					<section className="transport-panel transport-recent-panel">
						<div className="transport-panel-heading"><h2>Recent Bookings</h2><Link to="/partner/transport/trips">View all bookings <ArrowRight size={12} /></Link></div>
						<div className="transport-table-scroll"><table className="transport-booking-table"><thead><tr><th>Guest</th><th>Pickup</th><th>Drop-off</th><th>Date &amp; time</th><th>Vehicle</th><th>Status</th><th>Amount</th></tr></thead><tbody>
							{recentTrips.map((trip) => {
								const vehicle = vehicles.find((item) => item._id === trip.vehicle);
								return <tr key={trip._id}><td>{trip.customer ? `${trip.customer.firstName} ${trip.customer.lastName}` : "Guest"}<small>{trip.reference}</small></td><td>{addressLabel(trip.pickup)}</td><td>{addressLabel(trip.dropoff)}</td><td>{formatDate(trip.scheduledAt)}</td><td>{vehicle ? `${vehicle.make} ${vehicle.model}` : trip.type}</td><td><StatusBadge status={trip.status} /></td><td>{money(trip.fare, trip.currency)}</td></tr>;
							})}
						</tbody></table>{!loading && recentTrips.length === 0 ? <div className="transport-empty">Your latest trips will appear here.</div> : null}</div>
					</section>

					<section className="transport-panel transport-fleet-panel">
						<div className="transport-panel-heading"><h2>Fleet Overview</h2><Link to="/partner/transport/vehicles">View vehicles <ArrowRight size={12} /></Link></div>
						<div className="transport-fleet-stats"><div><CarFront size={17} /><strong>{vehicles.length}</strong><small>Total Vehicles</small></div><div><CalendarDays size={17} /><strong>{activeVehicles.length}</strong><small>Available</small></div><div><Wrench size={17} /><strong>{vehicles.filter((vehicle) => vehicle.status === "inactive" || vehicle.status === "pending").length}</strong><small>In Service</small></div></div>
						{activeVehicle ? <div className="transport-featured-vehicle">
							<img src={activeVehicle.photos?.[0] ?? partnerImages.supportBanner} alt={`${activeVehicle.make} ${activeVehicle.model}`} />
							<div><span><strong>{activeVehicle.make} {activeVehicle.model}</strong><StatusBadge status={activeVehicle.status} /></span><small>{activeVehicle.capacity} seats · {vehicles.length} vehicles</small></div>
						</div> : <div className="transport-empty">Add your first vehicle to build your fleet.</div>}
					</section>

					<section className="transport-panel transport-upcoming-panel">
						<div className="transport-panel-heading"><h2>Upcoming Trips</h2><Link to="/partner/transport/trips">View all <ArrowRight size={12} /></Link></div>
						<div className="transport-upcoming-list">{upcomingTrips.map((trip) => <article key={trip._id}>
							<img src={partnerImages.supportBanner} alt="" />
							<div><strong>{addressLabel(trip.pickup)}</strong><small>{formatDate(trip.scheduledAt)}</small><small>{trip.customer ? `${trip.customer.firstName} ${trip.customer.lastName}` : trip.reference}</small></div>
							<StatusBadge status={trip.status} />
						</article>)}{!loading && upcomingTrips.length === 0 ? <div className="transport-empty">No upcoming trips scheduled.</div> : null}</div>
					</section>
				</div>

				<div className="transport-bottom-grid">
					<section className="transport-panel transport-revenue-panel" id="reports"><div className="transport-panel-heading"><h2>Revenue Overview</h2><span>Last 7 days</span></div><div className="transport-chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={revenueData} margin={{ top: 8, right: 10, left: 0, bottom: 0 }}><defs><linearGradient id="transportRevenueFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ce8421" stopOpacity={0.28} /><stop offset="100%" stopColor="#ce8421" stopOpacity={0.02} /></linearGradient></defs><CartesianGrid stroke="#efe7db" vertical={false} /><XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: "#877e73", fontSize: 10 }} /><YAxis tickLine={false} axisLine={false} tick={{ fill: "#877e73", fontSize: 10 }} /><Tooltip formatter={(value) => money(Number(value), currency)} /><Area dataKey="revenue" type="monotone" stroke="#c9821f" strokeWidth={2} fill="url(#transportRevenueFill)" /></AreaChart></ResponsiveContainer></div></section>
					<section className="transport-panel transport-source-panel"><div className="transport-panel-heading"><h2>Service Mix</h2><span>{trips.length} Total Trips</span></div><div className="transport-service-mix">{serviceMix.length ? serviceMix.map(({ name, value, color }) => <div key={name}><i style={{ background: color }} /><span>{name}</span><strong>{trips.length ? Math.round(value / trips.length * 100) : 0}%</strong></div>) : <div className="transport-empty">Trip service types appear when bookings are recorded.</div>}</div></section>
					<section className="transport-panel transport-quick-panel"><div className="transport-panel-heading"><h2>Quick Actions</h2></div><div className="transport-quick-grid"><Link to="/partner/transport/vehicles"><span><PlusIcon /></span><strong>Add Vehicle</strong><small>Register a new vehicle</small></Link><Link to="/partner/transport/availability"><span><Users size={15} /></span><strong>Go {online ? "Offline" : "Online"}</strong><small>Manage availability</small></Link><Link to="/partner/transport/trips"><span><CalendarDays size={15} /></span><strong>View Bookings</strong><small>Check reservations</small></Link><Link to="/partner/transport/reports"><span><BarChart3 size={15} /></span><strong>View Reports</strong><small>Performance insights</small></Link></div></section>
				</div>
				<div className="transport-dashboard-footer"><span><MapPin size={13} /> {data?.partner.town ?? "Service area"}</span><span><Star size={13} /> {(data?.averageRating ?? 0).toFixed(1)} rating · {data?.reviewCount ?? 0} reviews</span><span>{availableJobs.length} active delivery jobs</span><span>{lastPayout ? `Last payout ${money(lastPayout.amount, currency)}` : "No completed payout yet"}</span></div>
			</div>
		</TransportLayout>
	);
}

interface TransportNotification {
	id: string;
	title: string;
	detail: string;
	createdAt: string;
	type: "trip" | "job" | "payout" | "review";
}

const transportNotificationReadKey = "digitalsafaris_transport_notifications_read_at";

export function TransportNotificationsPage() {
	const [notifications, setNotifications] = useState<TransportNotification[]>([]);
	const [readAt, setReadAt] = useState(() => localStorage.getItem(transportNotificationReadKey) ?? "");
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [reload, setReload] = useState(0);

	useEffect(() => {
		let cancelled = false;
		async function loadNotifications() {
			setLoading(true);
			setError("");
			const results = await Promise.allSettled([
				tripApi.list({ limit: 15 }),
				jobApi.mine({ limit: 15 }),
				walletApi.transactions({ limit: 10 }),
				ratingApi.list({ limit: 10 }),
			]);
			if (cancelled) return;
			const next: TransportNotification[] = [];
			const [tripResult, jobResult, payoutResult, reviewResult] = results;
			if (tripResult.status === "fulfilled") tripResult.value.data.forEach((trip) => next.push({ id: `trip-${trip._id}`, title: `Trip ${trip.status.replace(/_/g, " ")}`, detail: `${trip.reference} · ${trip.customer ? `${trip.customer.firstName} ${trip.customer.lastName}` : "Customer"}`, createdAt: trip.updatedAt, type: "trip" }));
			if (jobResult.status === "fulfilled") jobResult.value.data.forEach((job) => next.push({ id: `job-${job._id}`, title: `Delivery ${job.status.replace(/_/g, " ")}`, detail: `${job.reference} · ${job.distanceKm} km`, createdAt: job.updatedAt, type: "job" }));
			if (payoutResult.status === "fulfilled") payoutResult.value.data.forEach((payout) => next.push({ id: `payout-${payout._id}`, title: `Payout ${payout.status}`, detail: `${payout.reference} · ${money(payout.amount, "KES")}`, createdAt: payout.updatedAt, type: "payout" }));
			if (reviewResult.status === "fulfilled") reviewResult.value.data.forEach((review: Rating) => next.push({ id: `review-${review._id}`, title: "New customer rating", detail: `${review.rating} stars${review.comment ? ` · ${review.comment}` : ""}`, createdAt: review.createdAt, type: "review" }));
			if (results.every((result) => result.status === "rejected")) setError("Could not load transport activity notifications.");
			setNotifications(next.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
			setLoading(false);
		}
		void loadNotifications();
		return () => { cancelled = true; };
	}, [reload]);

	function markAllRead() {
		const now = new Date().toISOString();
		localStorage.setItem(transportNotificationReadKey, now);
		setReadAt(now);
	}

	const unreadCount = notifications.filter((item) => item.createdAt > readAt).length;
	const iconByType = { trip: CalendarDays, job: Truck, payout: CircleDollarSign, review: Star };

	return <TransportLayout><div className="transport-page">
		<PageHeader title="Notifications" subtitle="Recent trip, delivery, payout and rating activity." action={<button type="button" className="secondary-button small-button" onClick={markAllRead} disabled={!unreadCount}>Mark all read</button>} />
		<ApiFeedback loading={loading} error={error} onRetry={() => setReload((current) => current + 1)} />
		<div className="transport-notification-list">{notifications.map((notification) => {
			const Icon = iconByType[notification.type];
			const unread = notification.createdAt > readAt;
			return <article key={notification.id} className={`transport-notification-item ${unread ? "unread" : ""}`}><span><Icon size={17} /></span><div><strong>{notification.title}</strong><p>{notification.detail}</p><time>{new Date(notification.createdAt).toLocaleString()}</time></div>{unread ? <i aria-label="Unread" /> : null}</article>;
		})}{!loading && notifications.length === 0 ? <div className="transport-empty-large"><BellRing size={24} /><strong>No activity notifications</strong><span>Trip and payout updates will appear as activity is recorded.</span></div> : null}</div>
		<p className="transport-local-note">Read status is saved in this browser. The transport API does not currently provide a notification preference or read-state endpoint.</p>
	</div></TransportLayout>;
}

export function TransportReportsPage() {
	const [trips, setTrips] = useState<Trip[]>([]);
	const [jobs, setJobs] = useState<DeliveryJob[]>([]);
	const [vehicles, setVehicles] = useState<Vehicle[]>([]);
	const [wallet, setWallet] = useState<PartnerWallet | null>(null);
	const [rating, setRating] = useState<RatingSummary | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [reload, setReload] = useState(0);

	useEffect(() => {
		let cancelled = false;
		async function loadReports() {
			setLoading(true);
			setError("");
			try {
				const [tripResult, jobResult, vehicleResult, walletResult, ratingResult] = await Promise.all([
					tripApi.list({ limit: 100 }), jobApi.mine({ limit: 100 }), vehicleApi.list(), walletApi.get(), ratingApi.summary(),
				]);
				if (!cancelled) { setTrips(tripResult.data); setJobs(jobResult.data); setVehicles(vehicleResult); setWallet(walletResult); setRating(ratingResult); }
			} catch (requestError) {
				if (!cancelled) setError(getApiErrorMessage(requestError, "Could not load transport analytics."));
			} finally { if (!cancelled) setLoading(false); }
		}
		void loadReports();
		return () => { cancelled = true; };
	}, [reload]);

	const revenueByDay = useMemo(() => Array.from({ length: 7 }, (_, index) => {
		const date = new Date();
		date.setDate(date.getDate() - (6 - index));
		const key = date.toISOString().slice(0, 10);
		const tripEarnings = trips.filter((trip) => trip.createdAt.slice(0, 10) === key).reduce((sum, trip) => sum + trip.partnerEarnings, 0);
		const deliveryEarnings = jobs.filter((job) => job.createdAt.slice(0, 10) === key).reduce((sum, job) => sum + job.partnerEarnings, 0);
		return { day: date.toLocaleDateString(undefined, { month: "short", day: "numeric" }), amount: tripEarnings + deliveryEarnings };
	}), [trips, jobs]);
	const serviceTypes = useMemo(() => Object.entries(trips.reduce<Record<string, number>>((result, trip) => { result[trip.type] = (result[trip.type] ?? 0) + 1; return result; }, {})).map(([name, value]) => ({ name: name.replace(/_/g, " "), value })), [trips]);
	const completedTrips = trips.filter((trip) => trip.status === "completed");
	const averageFare = completedTrips.length ? completedTrips.reduce((sum, trip) => sum + trip.partnerEarnings, 0) / completedTrips.length : 0;
	const currency = wallet?.currency ?? "KES";

	return <TransportLayout><div className="transport-page">
		<PageHeader title="Transport Reports" subtitle="Revenue, service mix and fleet performance from your transport records." action={<button type="button" className="secondary-button small-button" onClick={() => setReload((current) => current + 1)} disabled={loading}>Refresh data</button>} />
		<ApiFeedback loading={loading} error={error} onRetry={() => setReload((current) => current + 1)} />
		<div className="transport-report-kpis"><article className="transport-panel"><small>Total Trips</small><strong>{trips.length}</strong></article><article className="transport-panel"><small>Total Earnings</small><strong>{money(wallet?.totalEarned ?? 0, currency)}</strong></article><article className="transport-panel"><small>Average Trip Earnings</small><strong>{money(averageFare, currency)}</strong></article><article className="transport-panel"><small>Fleet Size</small><strong>{vehicles.length}</strong></article><article className="transport-panel"><small>Customer Rating</small><strong>{(rating?.average ?? 0).toFixed(1)} / 5</strong></article></div>
		<div className="transport-report-grid"><section className="transport-panel"><div className="transport-panel-heading"><h2>Revenue Overview</h2><span>Past 7 days</span></div><div className="transport-chart report-chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={revenueByDay} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}><defs><linearGradient id="transportReportFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ce8421" stopOpacity={.25} /><stop offset="100%" stopColor="#ce8421" stopOpacity={.02} /></linearGradient></defs><CartesianGrid stroke="#efe7db" vertical={false} /><XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: "#877e73", fontSize: 10 }} /><YAxis tickLine={false} axisLine={false} tick={{ fill: "#877e73", fontSize: 10 }} /><Tooltip formatter={(value) => money(Number(value), currency)} /><Area dataKey="amount" type="monotone" stroke="#c9821f" strokeWidth={2} fill="url(#transportReportFill)" /></AreaChart></ResponsiveContainer></div></section>
		<section className="transport-panel"><div className="transport-panel-heading"><h2>Trip Service Types</h2><span>{trips.length} trips</span></div><div className="transport-report-list">{serviceTypes.map((item) => <div key={item.name}><span>{item.name}</span><strong>{item.value}</strong></div>)}{!serviceTypes.length ? <div className="transport-empty">Trip categories appear when bookings exist.</div> : null}</div><div className="transport-report-list"><div><span>Delivery jobs</span><strong>{jobs.length}</strong></div><div><span>Active vehicles</span><strong>{vehicles.filter((vehicle) => vehicle.status === "active").length}</strong></div></div></section></div>
		<p className="transport-local-note">Reports reflect records returned by the transport APIs; no separate channel-attribution or export endpoint is currently available.</p>
	</div></TransportLayout>;
}

function PlusIcon() {
	return <span className="transport-plus-symbol">+</span>;
}
