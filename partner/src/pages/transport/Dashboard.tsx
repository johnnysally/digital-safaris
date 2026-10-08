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
import { useAuth } from "../../context/authContext";
import { usePartnerSocket } from "../../context/socketContext";
import { useToast } from "../../context/toastContext";
import { ApiFeedback, PageHeader, StatusBadge } from "../../components/layout/Layout";
import { PartnerLogo } from "../../components/brand/PartnerLogo";
import { formatCurrency } from "../../utils/formatCurrency";
import { formatDateTime } from "../../utils/formatDate";
import { formatAddress, formatLabel } from "../../utils/helpers";

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

function money(value: number, currency: string) {
	return formatCurrency(value, currency, { maximumFractionDigits: 0 });
}

export function TransportLayout({ children }: { children: ReactNode }) {
	const navigate = useNavigate();
	const { signOut: clearSession } = useAuth();
	const { showToast } = useToast();
	const [partner, setPartner] = useState<TransportPartner | null>(null);
	usePartnerSocket("transport");

	useEffect(() => {
		let cancelled = false;
		profileApi.get().then(({ partner: profile }) => {
			if (!cancelled) setPartner(profile);
		}).catch(() => undefined);
		return () => { cancelled = true; };
	}, []);

	async function signOut() {
		try {
			await authApi.logout();
		} catch (requestError) {
			showToast(getApiErrorMessage(requestError, "Unable to complete sign out with the server."), "error");
			return;
		}
		clearSession("transport");
		navigate("/partner/transport/login", { replace: true });
	}

	return (
		<div className="flex min-h-screen bg-[#f4eee4] text-[#29221b] font-[DM_Sans,Segoe_UI,sans-serif] max-[760px]:block">
			<aside className="sticky top-0 h-screen w-[180px] flex-[0_0_180px] overflow-hidden bg-[#24160d] text-white max-[760px]:relative max-[760px]:h-auto max-[760px]:w-full max-[760px]:min-w-0 max-[760px]:flex-none">
				<div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(29,18,10,.94)_0%,rgba(29,18,10,.88)_35%,rgba(29,18,10,.28)_100%),url(https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=900&q=85)] bg-cover bg-center" />
				<div className="relative z-[1] flex h-full flex-col px-[11px] pt-[17px] pb-[15px] max-[760px]:h-auto max-[760px]:px-3 max-[760px]:py-2.5">
					<Link to="/partner" className="block text-white no-underline" aria-label="DigitalSafaris partner workspaces">
						<PartnerLogo variant="transport-sidebar" />
					</Link>
					<nav className="flex flex-col gap-[3px] py-[13px] max-[760px]:flex-row max-[760px]:gap-1 max-[760px]:overflow-x-auto max-[760px]:py-[5px]" aria-label="Transport navigation">
						{transportNav.map(({ label, to, icon: Icon }) => <NavLink key={to} to={to} end={label === "Dashboard"} className={({ isActive }) => `flex min-h-[33px] items-center gap-2.5 rounded-md px-[9px] py-[7px] text-[.68rem] text-white/80 no-underline hover:bg-white/10 hover:text-white max-[760px]:min-h-[31px] max-[760px]:flex-none ${isActive ? "bg-[#a85f19] text-white" : ""}`}><Icon size={17} /><span>{label}</span></NavLink>)}
					</nav>
					<button className="mt-auto flex items-center gap-[9px] rounded-md border-0 bg-white/[.08] p-[9px] text-[.7rem] text-white cursor-pointer max-[760px]:hidden" type="button" onClick={() => void signOut()}><LogOut size={16} /> Sign out</button>
				</div>
			</aside>
			<div className="flex min-w-0 flex-1 flex-col">
				<header className="flex min-h-[58px] items-center justify-between gap-[18px] border-b border-[rgba(123,109,95,.13)] bg-[rgba(255,252,247,.95)] px-[18px] py-2 max-[760px]:min-h-[52px] max-[760px]:px-3 max-[760px]:py-[7px]">
					<label className="flex h-[34px] w-[min(470px,56%)] items-center rounded-[20px] border border-[#eee7dc] bg-[#faf7f1] px-[11px] max-[760px]:w-[46%] [&_input]:h-full [&_input]:w-full [&_input]:border-0 [&_input]:bg-transparent [&_input]:p-0 [&_input]:pl-[9px] [&_input]:text-[.67rem] [&_input]:shadow-none"><span className="sr-only">Search transport records</span><input placeholder="Search anything..." /></label>
					<div className="flex items-center gap-[9px] text-[#332b24] [&>img]:h-[34px] [&>img]:w-[34px] [&>img]:rounded-full [&>img]:bg-[#eee0c9] [&>img]:object-cover [&>span]:grid [&>span]:h-[34px] [&>span]:w-[34px] [&>span]:place-items-center [&>span]:rounded-full [&>span]:bg-[#eee0c9] [&>span]:text-[#83521e] [&>div]:flex [&>div]:flex-col [&>div]:gap-0.5 [&_strong]:max-w-[150px] [&_strong]:overflow-hidden [&_strong]:text-ellipsis [&_strong]:whitespace-nowrap [&_strong]:text-[.66rem] [&_small]:text-[.55rem] [&_small]:text-[#898078] max-[760px]:[&>div]:hidden max-[760px]:[&>svg]:hidden">
						<Link className="relative grid h-[30px] w-[30px] place-items-center rounded-full border-0 bg-[#f7f0e6] text-[#332b24]" to="/partner/transport/notifications" aria-label="Notifications"><Bell size={17} /></Link>
						{partner?.avatar ? <img src={partner.avatar} alt="" /> : <span className="grid h-[34px] w-[34px] place-items-center rounded-full bg-[#eee0c9] text-[#83521e]"><CircleUserRound size={22} /></span>}
						<div><strong>{partner ? `${partner.firstName} ${partner.lastName}` : "Transport Partner"}</strong><small>Transport Partner</small></div>
						<ChevronDown size={15} />
					</div>
				</header>
				<main className="mx-auto w-full max-w-[1750px] px-[18px] pt-[15px] pb-5 max-[760px]:px-[11px] max-[760px]:pt-[13px] max-[760px]:pb-[18px]">{children}</main>
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

function formatDate(value: string) {
	return formatDateTime(value);
}

function addressLabel(address: { line1?: string; town?: string; county?: string }) {
	return formatAddress(address);
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
		return Object.entries(counts).slice(0, 3).map(([name, value], index) => ({ name: formatLabel(name), value, color: ["#c58a2a", "#a85c1d", "#e3c795"][index] }));
	}, [trips]);
	const lastPayout = data?.payouts.find((payout) => payout.status === "completed");
	const currency = data?.wallet.currency ?? "KES";

	return (
		<TransportLayout>
			<div className="w-full">
				<div className="mb-3 flex items-end justify-between gap-4 [&_h1]:m-0 [&_h1]:font-[Cormorant_Garamond,Georgia,serif] [&_h1]:text-[1.6rem] [&_h1]:font-bold [&_h1]:leading-[1.08] [&_h1]:text-[#29231e] [&_p]:mt-1 [&_p]:text-[.74rem] [&_p]:text-[#756d64] max-[760px]:items-start max-[760px]:[&_h1]:text-[1.35rem]">
					<div><h1>Good morning, {data ? `${data.partner.firstName} ${data.partner.lastName}` : "Transport Partner"}.</h1><p>Here’s what’s happening with your transport services today.</p></div>
					<button className="flex items-center gap-[7px] rounded-[7px] border border-[#e8dfd2] bg-[#fffdf8] px-2.5 py-2 !text-[.62rem] text-[#5a5046]" type="button" onClick={() => setReload((current) => current + 1)}><CalendarDays size={14} /> Last 7 days <ChevronDown size={13} /></button>
				</div>
				<ApiFeedback loading={loading} error={error} onRetry={() => setReload((current) => current + 1)} />

				<div className="mb-[13px] grid grid-cols-[minmax(0,1.85fr)_minmax(250px,1fr)] gap-3 max-[1180px]:grid-cols-[minmax(0,1.55fr)_minmax(220px,.9fr)] max-[760px]:grid-cols-1"><div className="grid grid-cols-4 gap-2 max-[1180px]:grid-cols-2">
					<article className="flex min-h-[102px] min-w-0 items-center gap-[9px] rounded-md border border-[rgba(130,110,92,.13)] bg-[rgba(255,252,247,.9)] p-2.5 shadow-[0_2px_7px_rgba(36,22,13,.025)] [&>span]:grid [&>span]:h-[34px] [&>span]:w-[34px] [&>span]:shrink-0 [&>span]:place-items-center [&>span]:rounded-full [&>span]:bg-[#faecd5] [&>span]:text-[#925719] [&>div]:flex [&>div]:min-w-0 [&>div]:flex-col [&_small]:overflow-hidden [&_small]:text-ellipsis [&_small]:whitespace-nowrap [&_small]:text-[.59rem] [&_small]:font-semibold [&_small]:text-[#332d26] [&_strong]:mt-[3px] [&_strong]:font-[Cormorant_Garamond,Georgia,serif] [&_strong]:text-[1.32rem] [&_strong]:leading-none [&_strong]:text-[#231e19] [&_em]:mt-1.5 [&_em]:flex [&_em]:items-center [&_em]:gap-[3px] [&_em]:overflow-hidden [&_em]:text-ellipsis [&_em]:whitespace-nowrap [&_em]:text-[.52rem] [&_em]:not-italic [&_em]:text-[#508047]"><span><BusFront size={18} /></span><div><small>Total Bookings</small><strong>{data?.partner.totalTrips ?? trips.length}</strong><em><ArrowRight size={11} /> {trips.length} loaded trips</em></div></article>
					<article className="flex min-h-[102px] min-w-0 items-center gap-[9px] rounded-md border border-[rgba(130,110,92,.13)] bg-[rgba(255,252,247,.9)] p-2.5 shadow-[0_2px_7px_rgba(36,22,13,.025)] [&>span]:grid [&>span]:h-[34px] [&>span]:w-[34px] [&>span]:shrink-0 [&>span]:place-items-center [&>span]:rounded-full [&>span]:bg-[#faecd5] [&>span]:text-[#925719] [&>div]:flex [&>div]:min-w-0 [&>div]:flex-col [&_small]:overflow-hidden [&_small]:text-ellipsis [&_small]:whitespace-nowrap [&_small]:text-[.59rem] [&_small]:font-semibold [&_small]:text-[#332d26] [&_strong]:mt-[3px] [&_strong]:font-[Cormorant_Garamond,Georgia,serif] [&_strong]:text-[1.32rem] [&_strong]:leading-none [&_strong]:text-[#231e19] [&_em]:mt-1.5 [&_em]:flex [&_em]:items-center [&_em]:gap-[3px] [&_em]:overflow-hidden [&_em]:text-ellipsis [&_em]:whitespace-nowrap [&_em]:text-[.52rem] [&_em]:not-italic [&_em]:text-[#508047]"><span><CarFront size={18} /></span><div><small>Active Vehicles</small><strong>{activeVehicles.length}</strong><em><ArrowRight size={11} /> {vehicles.length} in fleet</em></div></article>
					<article className="flex min-h-[102px] min-w-0 items-center gap-[9px] rounded-md border border-[rgba(130,110,92,.13)] bg-[rgba(255,252,247,.9)] p-2.5 shadow-[0_2px_7px_rgba(36,22,13,.025)] [&>span]:grid [&>span]:h-[34px] [&>span]:w-[34px] [&>span]:shrink-0 [&>span]:place-items-center [&>span]:rounded-full [&>span]:bg-[#faecd5] [&>span]:text-[#925719] [&>div]:flex [&>div]:min-w-0 [&>div]:flex-col [&_small]:overflow-hidden [&_small]:text-ellipsis [&_small]:whitespace-nowrap [&_small]:text-[.59rem] [&_small]:font-semibold [&_small]:text-[#332d26] [&_strong]:mt-[3px] [&_strong]:font-[Cormorant_Garamond,Georgia,serif] [&_strong]:text-[1.32rem] [&_strong]:leading-none [&_strong]:text-[#231e19] [&_em]:mt-1.5 [&_em]:flex [&_em]:items-center [&_em]:gap-[3px] [&_em]:overflow-hidden [&_em]:text-ellipsis [&_em]:whitespace-nowrap [&_em]:text-[.52rem] [&_em]:not-italic [&_em]:text-[#508047]"><span><Users size={18} /></span><div><small>Driver Status</small><strong>{online ? "Online" : "Offline"}</strong><em><ArrowRight size={11} /> {data?.location.isAvailable ? "Available for work" : "Not available"}</em></div></article>
					<article className="flex min-h-[102px] min-w-0 items-center gap-[9px] rounded-md border border-[rgba(130,110,92,.13)] bg-[rgba(255,252,247,.9)] p-2.5 shadow-[0_2px_7px_rgba(36,22,13,.025)] [&>span]:grid [&>span]:h-[34px] [&>span]:w-[34px] [&>span]:shrink-0 [&>span]:place-items-center [&>span]:rounded-full [&>span]:bg-[#faecd5] [&>span]:text-[#925719] [&>div]:flex [&>div]:min-w-0 [&>div]:flex-col [&_small]:overflow-hidden [&_small]:text-ellipsis [&_small]:whitespace-nowrap [&_small]:text-[.59rem] [&_small]:font-semibold [&_small]:text-[#332d26] [&_strong]:mt-[3px] [&_strong]:font-[Cormorant_Garamond,Georgia,serif] [&_strong]:text-[1.32rem] [&_strong]:leading-none [&_strong]:text-[#231e19] [&_em]:mt-1.5 [&_em]:flex [&_em]:items-center [&_em]:gap-[3px] [&_em]:overflow-hidden [&_em]:text-ellipsis [&_em]:whitespace-nowrap [&_em]:text-[.52rem] [&_em]:not-italic [&_em]:text-[#508047]"><span><Wallet size={18} /></span><div><small>Total Revenue</small><strong>{money(data?.wallet.totalEarned ?? 0, currency)}</strong><em><ArrowRight size={11} /> {money(data?.wallet.pendingPayout ?? 0, currency)} pending</em></div></article>
				</div>
				<div className="flex min-h-[102px] items-center overflow-hidden rounded-md bg-cover bg-[center_58%] px-[15px] py-3 text-white [&_p]:mb-1 [&_p]:text-[.49rem] [&_p]:font-bold [&_p]:text-[#f3bd61] [&_h2]:m-0 [&_h2]:font-[Cormorant_Garamond,Georgia,serif] [&_h2]:text-[1.12rem] [&_h2]:leading-[.98] [&_span]:mt-[5px] [&_span]:block [&_span]:text-[.52rem] [&_a]:mt-[7px] [&_a]:inline-flex [&_a]:items-center [&_a]:gap-[5px] [&_a]:rounded [&_a]:bg-[#c9821f] [&_a]:px-2 [&_a]:py-[5px] [&_a]:text-[.52rem] [&_a]:text-white [&_a]:no-underline" style={{ backgroundImage: `linear-gradient(90deg,rgba(28,20,13,.76),rgba(28,20,13,.12)),url('${partnerImages.supportBanner}')` }}>
					<div><p>TRANSPORT PARTNER</p><h2>Reliable Transport<br />for Unforgettable Journeys</h2><span>Safe · Comfortable · On Time</span><Link to="/partner/transport/vehicles">Manage Fleet <ArrowRight size={13} /></Link></div>
				</div>
				</div>

				<div className="mb-3 grid grid-cols-[minmax(0,1.65fr)_minmax(210px,.8fr)_minmax(190px,.72fr)] items-stretch gap-2.5 max-[1180px]:grid-cols-[minmax(0,1.35fr)_minmax(220px,.85fr)] max-[760px]:grid-cols-1">
					<section className="min-w-0 rounded-md border border-[rgba(130,110,92,.14)] bg-[rgba(255,252,247,.92)] shadow-[0_2px_8px_rgba(36,22,13,.025)] min-h-[265px] overflow-hidden">
						<div className="flex min-h-9 items-center justify-between gap-2 border-b border-[rgba(130,110,92,.1)] px-2.5 [&_h2]:m-0 [&_h2]:text-[.9rem] [&_h2]:font-bold [&_a]:inline-flex [&_a]:items-center [&_a]:gap-1 [&_a]:whitespace-nowrap [&_a]:text-[.52rem] [&_a]:text-[#925719] [&_a]:no-underline [&>span]:text-[.52rem] [&>span]:text-[#925719]"><h2>Recent Bookings</h2><Link to="/partner/transport/trips">View all bookings <ArrowRight size={12} /></Link></div>
						<div className="w-full overflow-x-auto"><table className="w-full min-w-[590px] border-collapse [&_th]:bg-[rgba(247,241,232,.65)] [&_th]:text-[.51rem] [&_th]:font-semibold [&_th]:text-[#302a24] [&_td]:text-[#514940] [&_th]:text-left [&_td]:text-left [&_th]:whitespace-nowrap [&_td]:whitespace-nowrap [&_th]:border-b [&_td]:border-b [&_th]:border-[rgba(130,110,92,.09)] [&_td]:border-[rgba(130,110,92,.09)] [&_th]:px-[7px] [&_td]:px-[7px] [&_th]:py-2 [&_td]:py-2 [&_td:first-child]:font-semibold [&_td:first-child]:text-[#29231e] [&_td_small]:mt-[3px] [&_td_small]:block [&_td_small]:text-[.48rem] [&_td_small]:text-[#91887e]"><thead><tr><th>Guest</th><th>Pickup</th><th>Drop-off</th><th>Date &amp; time</th><th>Vehicle</th><th>Status</th><th>Amount</th></tr></thead><tbody>
							{recentTrips.map((trip) => {
								const vehicle = vehicles.find((item) => item._id === trip.vehicle);
								return <tr key={trip._id}><td>{trip.customer ? `${trip.customer.firstName} ${trip.customer.lastName}` : "Guest"}<small>{trip.reference}</small></td><td>{addressLabel(trip.pickup)}</td><td>{addressLabel(trip.dropoff)}</td><td>{formatDate(trip.scheduledAt)}</td><td>{vehicle ? `${vehicle.make} ${vehicle.model}` : trip.type}</td><td><StatusBadge status={trip.status} /></td><td>{money(trip.fare, trip.currency)}</td></tr>;
							})}
						</tbody></table>{!loading && recentTrips.length === 0 ? <div className="p-[18px] text-center text-[.78rem] text-[var(--text-muted)]">Your latest trips will appear here.</div> : null}</div>
					</section>

					<section className="min-w-0 rounded-md border border-[rgba(130,110,92,.14)] bg-[rgba(255,252,247,.92)] shadow-[0_2px_8px_rgba(36,22,13,.025)] min-h-[265px] overflow-hidden">
						<div className="flex min-h-9 items-center justify-between gap-2 border-b border-[rgba(130,110,92,.1)] px-2.5 [&_h2]:m-0 [&_h2]:text-[.9rem] [&_h2]:font-bold [&_a]:inline-flex [&_a]:items-center [&_a]:gap-1 [&_a]:whitespace-nowrap [&_a]:text-[.52rem] [&_a]:text-[#925719] [&_a]:no-underline [&>span]:text-[.52rem] [&>span]:text-[#925719]"><h2>Fleet Overview</h2><Link to="/partner/transport/vehicles">View vehicles <ArrowRight size={12} /></Link></div>
						<div className="grid grid-cols-3 !px-[7px] pt-2.5 pb-2 [&>div]:grid [&>div]:min-w-0 [&>div]:grid-cols-[26px_1fr] [&>div]:items-center [&>div]:gap-x-[5px] [&>div]:border-r [&>div]:border-[rgba(130,110,92,.12)] [&>div]:px-[5px] [&>div:last-child]:border-0 [&_svg]:row-span-2 [&_svg]:h-[25px] [&_svg]:w-[25px] [&_svg]:rounded-full [&_svg]:bg-[#faecd5] [&_svg]:p-[5px] [&_svg]:text-[#925719] [&_strong]:font-[Cormorant_Garamond,Georgia,serif] [&_strong]:text-base [&_strong]:leading-none [&_small]:overflow-hidden [&_small]:text-ellipsis [&_small]:whitespace-nowrap [&_small]:text-[.47rem] [&_small]:text-[#8a8178]"><div><CarFront size={17} /><strong>{vehicles.length}</strong><small>Total Vehicles</small></div><div><CalendarDays size={17} /><strong>{activeVehicles.length}</strong><small>Available</small></div><div><Wrench size={17} /><strong>{vehicles.filter((vehicle) => vehicle.status === "inactive" || vehicle.status === "pending").length}</strong><small>In Service</small></div></div>
						{activeVehicle ? <div className="m-[0_9px_9px] overflow-hidden rounded-[5px] border border-[rgba(130,110,92,.12)] [&>img]:h-[105px] [&>img]:w-full [&>img]:object-cover [&>div]:p-[7px_8px] [&>div>span]:flex [&>div>span]:items-center [&>div>span]:justify-between [&>div>span]:gap-2 [&_strong]:text-[.6rem] [&_strong]:text-[#302a24] [&_small]:mt-1 [&_small]:block [&_small]:text-[.5rem] [&_small]:text-[#837a70]">
							<img src={activeVehicle.photos?.[0] ?? partnerImages.supportBanner} alt={`${activeVehicle.make} ${activeVehicle.model}`} />
							<div><span><strong>{activeVehicle.make} {activeVehicle.model}</strong><StatusBadge status={activeVehicle.status} /></span><small>{activeVehicle.capacity} seats · {vehicles.length} vehicles</small></div>
						</div> : <div className="p-[18px] text-center text-[.78rem] text-[var(--text-muted)]">Add your first vehicle to build your fleet.</div>}
					</section>

					<section className="min-w-0 rounded-md border border-[rgba(130,110,92,.14)] bg-[rgba(255,252,247,.92)] shadow-[0_2px_8px_rgba(36,22,13,.025)] min-h-[265px] overflow-hidden max-[1180px]:col-span-full max-[760px]:col-auto">
						<div className="flex min-h-9 items-center justify-between gap-2 border-b border-[rgba(130,110,92,.1)] px-2.5 [&_h2]:m-0 [&_h2]:text-[.9rem] [&_h2]:font-bold [&_a]:inline-flex [&_a]:items-center [&_a]:gap-1 [&_a]:whitespace-nowrap [&_a]:text-[.52rem] [&_a]:text-[#925719] [&_a]:no-underline [&>span]:text-[.52rem] [&>span]:text-[#925719]"><h2>Upcoming Trips</h2><Link to="/partner/transport/trips">View all <ArrowRight size={12} /></Link></div>
						<div className="flex flex-col [&>article]:grid [&>article]:min-h-[54px] [&>article]:grid-cols-[52px_minmax(0,1fr)_auto] [&>article]:items-center [&>article]:gap-[7px] [&>article]:border-b [&>article]:border-[rgba(130,110,92,.1)] [&>article]:p-[6px] [&_img]:h-[42px] [&_img]:w-[52px] [&_img]:rounded [&_img]:object-cover [&>article>div]:flex [&>article>div]:min-w-0 [&>article>div]:flex-col [&>article>div]:gap-0.5 [&_strong]:overflow-hidden [&_strong]:text-ellipsis [&_strong]:whitespace-nowrap [&_strong]:text-[.54rem] [&_strong]:text-[#332c26] [&_small]:overflow-hidden [&_small]:text-ellipsis [&_small]:whitespace-nowrap [&_small]:text-[.47rem] [&_small]:text-[#8c837a] max-[1180px]:grid max-[1180px]:grid-cols-2 max-[760px]:flex">{upcomingTrips.map((trip) => <article key={trip._id}>
							<img src={partnerImages.supportBanner} alt="" />
							<div><strong>{addressLabel(trip.pickup)}</strong><small>{formatDate(trip.scheduledAt)}</small><small>{trip.customer ? `${trip.customer.firstName} ${trip.customer.lastName}` : trip.reference}</small></div>
							<StatusBadge status={trip.status} />
						</article>)}{!loading && upcomingTrips.length === 0 ? <div className="p-[18px] text-center text-[.78rem] text-[var(--text-muted)]">No upcoming trips scheduled.</div> : null}</div>
					</section>
				</div>

				<div className="grid grid-cols-[minmax(0,1.25fr)_minmax(210px,.85fr)_minmax(230px,.95fr)] items-stretch gap-2.5 max-[1180px]:grid-cols-2 max-[760px]:grid-cols-1 [&>section]:min-h-40">
					<section className="min-w-0 rounded-md border border-[rgba(130,110,92,.14)] bg-[rgba(255,252,247,.92)] shadow-[0_2px_8px_rgba(36,22,13,.025)] " id="reports"><div className="flex min-h-9 items-center justify-between gap-2 border-b border-[rgba(130,110,92,.1)] px-2.5 [&_h2]:m-0 [&_h2]:text-[.9rem] [&_h2]:font-bold [&_a]:inline-flex [&_a]:items-center [&_a]:gap-1 [&_a]:whitespace-nowrap [&_a]:text-[.52rem] [&_a]:text-[#925719] [&_a]:no-underline [&>span]:text-[.52rem] [&>span]:text-[#925719]"><h2>Revenue Overview</h2><span>Last 7 days</span></div><div className="h-[127px] px-1.5 pt-1 pb-1.5"><ResponsiveContainer width="100%" height="100%"><AreaChart data={revenueData} margin={{ top: 8, right: 10, left: 0, bottom: 0 }}><defs><linearGradient id="transportRevenueFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ce8421" stopOpacity={0.28} /><stop offset="100%" stopColor="#ce8421" stopOpacity={0.02} /></linearGradient></defs><CartesianGrid stroke="#efe7db" vertical={false} /><XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: "#877e73", fontSize: 10 }} /><YAxis tickLine={false} axisLine={false} tick={{ fill: "#877e73", fontSize: 10 }} /><Tooltip formatter={(value) => money(Number(value), currency)} /><Area dataKey="revenue" type="monotone" stroke="#c9821f" strokeWidth={2} fill="url(#transportRevenueFill)" /></AreaChart></ResponsiveContainer></div></section>
					<section className="min-w-0 rounded-md border border-[rgba(130,110,92,.14)] bg-[rgba(255,252,247,.92)] shadow-[0_2px_8px_rgba(36,22,13,.025)] "><div className="flex min-h-9 items-center justify-between gap-2 border-b border-[rgba(130,110,92,.1)] px-2.5 [&_h2]:m-0 [&_h2]:text-[.9rem] [&_h2]:font-bold [&_a]:inline-flex [&_a]:items-center [&_a]:gap-1 [&_a]:whitespace-nowrap [&_a]:text-[.52rem] [&_a]:text-[#925719] [&_a]:no-underline [&>span]:text-[.52rem] [&>span]:text-[#925719]"><h2>Service Mix</h2><span>{trips.length} Total Trips</span></div><div className="flex flex-col gap-[11px] px-3 py-[13px] [&>div:not(.p-[18px] text-center text-[.78rem] text-[var(--text-muted)])]:grid [&>div:not(.p-[18px] text-center text-[.78rem] text-[var(--text-muted)])]:grid-cols-[9px_minmax(0,1fr)_auto] [&>div:not(.p-[18px] text-center text-[.78rem] text-[var(--text-muted)])]:items-center [&>div:not(.p-[18px] text-center text-[.78rem] text-[var(--text-muted)])]:gap-[7px] [&>div:not(.p-[18px] text-center text-[.78rem] text-[var(--text-muted)])]:text-[.62rem] [&>div:not(.p-[18px] text-center text-[.78rem] text-[var(--text-muted)])]:text-[#655c52] [&_i]:h-2 [&_i]:w-2 [&_i]:rounded-full [&_strong]:font-semibold [&_strong]:text-[#302a24]">{serviceMix.length ? serviceMix.map(({ name, value, color }) => <div key={name}><i style={{ background: color }} /><span>{name}</span><strong>{trips.length ? Math.round(value / trips.length * 100) : 0}%</strong></div>) : <div className="p-[18px] text-center text-[.78rem] text-[var(--text-muted)]">Trip service types appear when bookings are recorded.</div>}</div></section>
					<section className="min-w-0 rounded-md border border-[rgba(130,110,92,.14)] bg-[rgba(255,252,247,.92)] shadow-[0_2px_8px_rgba(36,22,13,.025)] max-[1180px]:col-span-full"><div className="flex min-h-9 items-center justify-between gap-2 border-b border-[rgba(130,110,92,.1)] px-2.5 [&_h2]:m-0 [&_h2]:text-[.9rem] [&_h2]:font-bold [&_a]:inline-flex [&_a]:items-center [&_a]:gap-1 [&_a]:whitespace-nowrap [&_a]:text-[.52rem] [&_a]:text-[#925719] [&_a]:no-underline [&>span]:text-[.52rem] [&>span]:text-[#925719]"><h2>Quick Actions</h2></div><div className="grid grid-cols-2 gap-[7px] p-2 [&_a]:grid [&_a]:min-h-[47px] [&_a]:grid-cols-[27px_minmax(0,1fr)] [&_a]:items-center [&_a]:gap-x-[7px] [&_a]:rounded-[5px] [&_a]:border [&_a]:border-[rgba(130,110,92,.12)] [&_a]:px-[6px] [&_a]:py-[5px] [&_a]:text-[#332c26] [&_a]:no-underline [&_a:hover]:border-[rgba(197,138,42,.4)] [&_a:hover]:bg-[#fffaf1] [&_a>span:first-child]:row-span-2 [&_a>span:first-child]:grid [&_a>span:first-child]:h-[25px] [&_a>span:first-child]:w-[25px] [&_a>span:first-child]:place-items-center [&_a>span:first-child]:rounded-full [&_a>span:first-child]:bg-[#faecd5] [&_a>span:first-child]:text-[#925719] [&_strong]:overflow-hidden [&_strong]:text-ellipsis [&_strong]:whitespace-nowrap [&_strong]:text-[.54rem] [&_small]:overflow-hidden [&_small]:text-ellipsis [&_small]:whitespace-nowrap [&_small]:text-[.46rem] [&_small]:text-[#8c837a] max-[1180px]:col-span-full"><Link to="/partner/transport/vehicles"><span><PlusIcon /></span><strong>Add Vehicle</strong><small>Register a new vehicle</small></Link><Link to="/partner/transport/availability"><span><Users size={15} /></span><strong>Go {online ? "Offline" : "Online"}</strong><small>Manage availability</small></Link><Link to="/partner/transport/trips"><span><CalendarDays size={15} /></span><strong>View Bookings</strong><small>Check reservations</small></Link><Link to="/partner/transport/reports"><span><BarChart3 size={15} /></span><strong>View Reports</strong><small>Performance insights</small></Link></div></section>
				</div>
				<div className="flex flex-wrap justify-end gap-[14px] pt-2 text-[.56rem] text-[#81786e] [&_span]:inline-flex [&_span]:items-center [&_span]:gap-1 [&_svg]:text-[#9b671f]"><span><MapPin size={13} /> {data?.partner.town ?? "Service area"}</span><span><Star size={13} /> {(data?.averageRating ?? 0).toFixed(1)} rating · {data?.reviewCount ?? 0} reviews</span><span>{availableJobs.length} active delivery jobs</span><span>{lastPayout ? `Last payout ${money(lastPayout.amount, currency)}` : "No completed payout yet"}</span></div>
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
			if (tripResult.status === "fulfilled") tripResult.value.data.forEach((trip) => next.push({ id: `trip-${trip._id}`, title: `Trip ${formatLabel(trip.status)}`, detail: `${trip.reference} · ${trip.customer ? `${trip.customer.firstName} ${trip.customer.lastName}` : "Customer"}`, createdAt: trip.updatedAt, type: "trip" }));
			if (jobResult.status === "fulfilled") jobResult.value.data.forEach((job) => next.push({ id: `job-${job._id}`, title: `Delivery ${formatLabel(job.status)}`, detail: `${job.reference} · ${job.distanceKm} km`, createdAt: job.updatedAt, type: "job" }));
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

	return <TransportLayout><div className="w-full [&_.page-header]:mb-4 [&_.page-header_h1]:text-[2rem] [&_.page-header_p]:text-[.84rem] max-[760px]:[&_.page-header_h1]:text-[1.65rem]">
		<PageHeader title="Notifications" subtitle="Recent trip, delivery, payout and rating activity." action={<button type="button" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-[.8rem] font-semibold text-[var(--text)] hover:bg-[#fffaf1] disabled:cursor-not-allowed disabled:opacity-60 !min-h-7 !px-[7px] !py-[5px] text-[.62rem]" onClick={markAllRead} disabled={!unreadCount}>Mark all read</button>} />
		<ApiFeedback loading={loading} error={error} onRetry={() => setReload((current) => current + 1)} />
		<div className="flex flex-col overflow-hidden rounded-md border border-[var(--border)] bg-[var(--surface)]">{notifications.map((notification) => {
			const Icon = iconByType[notification.type];
			const unread = notification.createdAt > readAt;
			return <article key={notification.id} className={`grid grid-cols-[38px_minmax(0,1fr)_9px] items-center gap-3 border-b border-[var(--border)] p-[14px_16px] [&:last-child]:border-0 [&>span]:grid [&>span]:h-9 [&>span]:w-9 [&>span]:place-items-center [&>span]:rounded-full [&>span]:bg-[#faecd5] [&>span]:text-[#925719] [&>div]:min-w-0 [&_strong]:text-[.8rem] [&_p]:my-[3px] [&_p]:overflow-hidden [&_p]:text-ellipsis [&_p]:text-[.74rem] [&_time]:text-[.66rem] [&>i]:h-2 [&>i]:w-2 [&>i]:rounded-full [&>i]:bg-[#c9821f] ${unread ? "bg-[#fffaf1]" : ""}`}><span><Icon size={17} /></span><div><strong>{notification.title}</strong><p>{notification.detail}</p><time>{new Date(notification.createdAt).toLocaleString()}</time></div>{unread ? <i aria-label="Unread" /> : null}</article>;
		})}{!loading && notifications.length === 0 ? <div className="flex min-h-[150px] flex-col items-center justify-center gap-2 text-center text-[var(--text-muted)] [&_svg]:text-[var(--gold)] [&_strong]:text-[var(--text)] [&_span]:text-[.76rem]"><BellRing size={24} /><strong>No activity notifications</strong><span>Trip and payout updates will appear as activity is recorded.</span></div> : null}</div>
		<p className="mx-[2px] my-2.5 text-[.7rem] text-[var(--text-muted)]">Read status is saved in this browser. The transport API does not currently provide a notification preference or read-state endpoint.</p>
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
	const serviceTypes = useMemo(() => Object.entries(trips.reduce<Record<string, number>>((result, trip) => { result[trip.type] = (result[trip.type] ?? 0) + 1; return result; }, {})).map(([name, value]) => ({ name: formatLabel(name), value })), [trips]);
	const completedTrips = trips.filter((trip) => trip.status === "completed");
	const averageFare = completedTrips.length ? completedTrips.reduce((sum, trip) => sum + trip.partnerEarnings, 0) / completedTrips.length : 0;
	const currency = wallet?.currency ?? "KES";

	return <TransportLayout><div className="w-full [&_.page-header]:mb-4 [&_.page-header_h1]:text-[2rem] [&_.page-header_p]:text-[.84rem] max-[760px]:[&_.page-header_h1]:text-[1.65rem]">
		<PageHeader title="Transport Reports" subtitle="Revenue, service mix and fleet performance from your transport records." action={<button type="button" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-[.8rem] font-semibold text-[var(--text)] hover:bg-[#fffaf1] disabled:cursor-not-allowed disabled:opacity-60 !min-h-7 !px-[7px] !py-[5px] text-[.62rem]" onClick={() => setReload((current) => current + 1)} disabled={loading}>Refresh data</button>} />
		<ApiFeedback loading={loading} error={error} onRetry={() => setReload((current) => current + 1)} />
		<div className="mb-3 grid grid-cols-5 gap-2.5 max-[1000px]:grid-cols-3 max-[760px]:grid-cols-1 [&>article]:flex [&>article]:min-w-0 [&>article]:flex-col [&>article]:gap-[6px] [&>article]:p-3 [&_small]:text-[.7rem] [&_strong]:overflow-hidden [&_strong]:text-ellipsis [&_strong]:whitespace-nowrap [&_strong]:font-[Cormorant_Garamond,Georgia,serif] [&_strong]:text-[1.35rem]"><article className="min-w-0 rounded-md border border-[rgba(130,110,92,.14)] bg-[rgba(255,252,247,.92)] shadow-[0_2px_8px_rgba(36,22,13,.025)]"><small>Total Trips</small><strong>{trips.length}</strong></article><article className="min-w-0 rounded-md border border-[rgba(130,110,92,.14)] bg-[rgba(255,252,247,.92)] shadow-[0_2px_8px_rgba(36,22,13,.025)]"><small>Total Earnings</small><strong>{money(wallet?.totalEarned ?? 0, currency)}</strong></article><article className="min-w-0 rounded-md border border-[rgba(130,110,92,.14)] bg-[rgba(255,252,247,.92)] shadow-[0_2px_8px_rgba(36,22,13,.025)]"><small>Average Trip Earnings</small><strong>{money(averageFare, currency)}</strong></article><article className="min-w-0 rounded-md border border-[rgba(130,110,92,.14)] bg-[rgba(255,252,247,.92)] shadow-[0_2px_8px_rgba(36,22,13,.025)]"><small>Fleet Size</small><strong>{vehicles.length}</strong></article><article className="min-w-0 rounded-md border border-[rgba(130,110,92,.14)] bg-[rgba(255,252,247,.92)] shadow-[0_2px_8px_rgba(36,22,13,.025)]"><small>Customer Rating</small><strong>{(rating?.average ?? 0).toFixed(1)} / 5</strong></article></div>
		<div className="grid grid-cols-[minmax(0,1.25fr)_minmax(250px,.75fr)] gap-3 max-[760px]:grid-cols-1 [&>section]:min-w-0 [&>section]:overflow-hidden"><section className="min-w-0 rounded-md border border-[rgba(130,110,92,.14)] bg-[rgba(255,252,247,.92)] shadow-[0_2px_8px_rgba(36,22,13,.025)]"><div className="flex min-h-9 items-center justify-between gap-2 border-b border-[rgba(130,110,92,.1)] px-2.5 [&_h2]:m-0 [&_h2]:text-[.9rem] [&_h2]:font-bold [&_a]:inline-flex [&_a]:items-center [&_a]:gap-1 [&_a]:whitespace-nowrap [&_a]:text-[.52rem] [&_a]:text-[#925719] [&_a]:no-underline [&>span]:text-[.52rem] [&>span]:text-[#925719]"><h2>Revenue Overview</h2><span>Past 7 days</span></div><div className="h-[127px] px-1.5 pt-1 pb-1.5 report-chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={revenueByDay} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}><defs><linearGradient id="transportReportFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ce8421" stopOpacity={.25} /><stop offset="100%" stopColor="#ce8421" stopOpacity={.02} /></linearGradient></defs><CartesianGrid stroke="#efe7db" vertical={false} /><XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: "#877e73", fontSize: 10 }} /><YAxis tickLine={false} axisLine={false} tick={{ fill: "#877e73", fontSize: 10 }} /><Tooltip formatter={(value) => money(Number(value), currency)} /><Area dataKey="amount" type="monotone" stroke="#c9821f" strokeWidth={2} fill="url(#transportReportFill)" /></AreaChart></ResponsiveContainer></div></section>
		<section className="min-w-0 rounded-md border border-[rgba(130,110,92,.14)] bg-[rgba(255,252,247,.92)] shadow-[0_2px_8px_rgba(36,22,13,.025)]"><div className="flex min-h-9 items-center justify-between gap-2 border-b border-[rgba(130,110,92,.1)] px-2.5 [&_h2]:m-0 [&_h2]:text-[.9rem] [&_h2]:font-bold [&_a]:inline-flex [&_a]:items-center [&_a]:gap-1 [&_a]:whitespace-nowrap [&_a]:text-[.52rem] [&_a]:text-[#925719] [&_a]:no-underline [&>span]:text-[.52rem] [&>span]:text-[#925719]"><h2>Trip Service Types</h2><span>{trips.length} trips</span></div><div className="flex flex-col gap-[9px] p-[14px] [&+&]:mt-1.5 [&+&]:border-t [&+&]:border-[var(--border)] [&>div]:flex [&>div]:items-center [&>div]:justify-between [&>div]:gap-3 [&>div]:text-[.76rem] [&_strong]:text-[var(--text)]">{serviceTypes.map((item) => <div key={item.name}><span>{item.name}</span><strong>{item.value}</strong></div>)}{!serviceTypes.length ? <div className="p-[18px] text-center text-[.78rem] text-[var(--text-muted)]">Trip categories appear when bookings exist.</div> : null}</div><div className="flex flex-col gap-[9px] p-[14px] [&+&]:mt-1.5 [&+&]:border-t [&+&]:border-[var(--border)] [&>div]:flex [&>div]:items-center [&>div]:justify-between [&>div]:gap-3 [&>div]:text-[.76rem] [&_strong]:text-[var(--text)]"><div><span>Delivery jobs</span><strong>{jobs.length}</strong></div><div><span>Active vehicles</span><strong>{vehicles.filter((vehicle) => vehicle.status === "active").length}</strong></div></div></section></div>
		<p className="mx-[2px] my-2.5 text-[.7rem] text-[var(--text-muted)]">Reports reflect records returned by the transport APIs; no separate channel-attribution or export endpoint is currently available.</p>
	</div></TransportLayout>;
}

function PlusIcon() {
	return <span className="text-[1.2rem] leading-none">+</span>;
}
