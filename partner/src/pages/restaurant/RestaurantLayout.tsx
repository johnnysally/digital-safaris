import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Link, NavLink, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { BarChart3, Bell, CalendarDays, ChevronDown, CircleUserRound, ClipboardList, CreditCard, LayoutDashboard, LogOut, Menu, Radio, Search, Settings, Star, Utensils, UtensilsCrossed } from "lucide-react";
import authApi from "../../api/restaurant/authApi";
import profileApi from "../../api/restaurant/profileApi";
import orderApi from "../../api/restaurant/orderApi";
import { getApiErrorMessage } from "../../api/axios";
import { useAuth } from "../../context/authContext";
import { usePartnerSocket } from "../../context/socketContext";
import { useToast } from "../../context/toastContext";
import type { RestaurantPartner } from "../../types";
import { PartnerLogo } from "../../components/brand/PartnerLogo";
import { PartnerMobileSidebar } from "../../components/layout/PartnerMobileSidebar";
import { partnerImages } from "../../config/partnerImages";

const restaurantNav = [
	{ label: "Dashboard", path: "dashboard", icon: LayoutDashboard },
	{ label: "Orders", path: "orders", icon: ClipboardList },
	{ label: "Menu Management", path: "menu", icon: UtensilsCrossed },
	{ label: "Food Requests", path: "broadcasts", icon: Radio },
	{ label: "Bookings", path: "bookings", icon: CalendarDays },
	{ label: "Restaurant Profile", path: "profile", icon: Utensils },
	{ label: "Wallet & Payments", path: "wallet", icon: CreditCard },
	{ label: "Reviews", path: "reviews", icon: Star },
	{ label: "Analytics", path: "analytics", icon: BarChart3 },
	{ label: "Reports", path: "reports", icon: BarChart3 },
	{ label: "Notifications", path: "notifications", icon: Bell },
	{ label: "Settings", path: "settings", icon: Settings },
];

export function RestaurantLayout({ children }: { children: ReactNode }) {
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const menuButtonRef = useRef<HTMLButtonElement>(null);
	const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);
	const [partner, setPartner] = useState<RestaurantPartner | null>(null);
	const [pendingOrders, setPendingOrders] = useState(0);
	const [shellError, setShellError] = useState("");
	const [search, setSearch] = useState("");
	const [searchError, setSearchError] = useState("");
	const navigate = useNavigate();
	const { signOut: clearSession } = useAuth();
	const { showToast } = useToast();
	const location = useLocation();
	const [searchParams] = useSearchParams();
	usePartnerSocket("restaurant");

	useEffect(() => {
		let cancelled = false;
		setShellError("");
		profileApi.get().then(({ partner: restaurant }) => {
			if (!cancelled) setPartner(restaurant);
		}).catch((requestError) => {
			if (!cancelled) {
				setPartner(null);
				setShellError(getApiErrorMessage(requestError, "Could not load your restaurant profile."));
			}
		});
		orderApi.list({ limit: 100, status: "pending" }).then((orders) => {
			if (!cancelled) setPendingOrders(orders.meta.total);
		}).catch((requestError) => {
			if (!cancelled) setShellError(getApiErrorMessage(requestError, "Could not load pending restaurant orders."));
		});
		return () => { cancelled = true; };
	}, [location.pathname]);

	useEffect(() => setSearch(searchParams.get("search") ?? ""), [searchParams]);

	function submitSearch(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setSearchError("");
		if (!search.trim()) {
			setSearchError("Enter a term to search orders.");
			return;
		}
		navigate(`/partner/restaurant/orders?search=${encodeURIComponent(search.trim())}`);
	}

	async function signOut() {
		try {
			await authApi.logout();
		} catch (requestError) {
			showToast(`${getApiErrorMessage(requestError, "Unable to complete sign out with the server.")} Your local session has been cleared.`, "error");
		} finally {
			clearSession("restaurant");
			navigate("/partner/restaurant/login", { replace: true });
		}
	}

	return (
		<div className="restaurant-portal restaurant-font-scale flex min-h-screen bg-[#f7f0e7] text-[#33251f] [font-family:Inter,Segoe_UI,sans-serif]">
			<PartnerMobileSidebar
				open={mobileMenuOpen}
				onClose={closeMobileMenu}
				onSignOut={() => void signOut()}
				menuButtonRef={menuButtonRef}
				sidebarId="restaurant-mobile-sidebar"
				workspace="Restaurant"
				items={restaurantNav.map(({ label, path, icon: Icon }) => ({
					label,
					to: `/partner/restaurant/${path}`,
					icon: Icon,
					badge: path === "orders" ? pendingOrders : undefined,
				}))}
			/>
			<aside className="sticky top-0 z-20 flex h-screen w-[220px] shrink-0 flex-col overflow-y-auto bg-[#38231f] p-0 text-[#fff7ef] max-[760px]:hidden">
				<div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `linear-gradient(180deg, rgba(43, 25, 23, .97), rgba(58, 31, 25, .91) 62%, rgba(103, 55, 34, .58)), url("${partnerImages.shared.sidebarBackground}")` }} />
				<div className="relative z-10 flex min-h-full flex-1 flex-col p-[24px_14px_16px] max-[760px]:items-center max-[760px]:px-[5px] max-[760px]:py-[16px]">
					<Link to="/partner/restaurant/dashboard" className="grid px-1 pb-[28px] text-white no-underline max-[760px]:px-0 max-[760px]:pb-5 [&_svg]:w-[18px]">
						<PartnerLogo variant="restaurant-sidebar" />
					</Link>
					<nav className="grid w-full gap-[8px]" aria-label="Restaurant partner navigation">
						{restaurantNav.map(({ label, path, icon: Icon }) => (
							<NavLink key={path} to={`/partner/restaurant/${path}`} end={path === "dashboard"} className={({ isActive }) => `flex min-h-[44px] items-center gap-[12px] rounded-[8px] px-[12px] text-[12px] font-medium text-white/75 no-underline transition-colors hover:bg-white/15 hover:text-white [&_svg]:size-[17px] [&_svg]:shrink-0 max-[760px]:justify-center max-[760px]:px-0 max-[760px]:[&_span]:hidden max-[760px]:[&>b]:hidden ${isActive ? "bg-white/15 text-white shadow-[inset_2px_0_#ee9b62]" : ""}`}>
								<Icon size={16} /><span>{label}</span>
								{path === "orders" && pendingOrders > 0 ? <b>{pendingOrders}</b> : null}
							</NavLink>
						))}
					</nav>
					<button className="mt-auto flex items-center gap-[10px] border-t border-white/15 px-[12px] py-[12px] text-left text-[12px] text-white/75 [&_svg]:w-[16px] max-[760px]:hidden" type="button" onClick={() => void signOut()}><LogOut size={16} /> Sign out</button>
				</div>
			</aside>
			<div className="min-w-0 flex-1">
				<header className="sticky top-0 z-10 flex min-h-[68px] items-center justify-between gap-[18px] border-b border-[#eadfd4] bg-[#fffaf4] px-[26px] max-[760px]:min-h-[58px] max-[760px]:px-[12px]">
					<button ref={menuButtonRef} type="button" onClick={() => setMobileMenuOpen(true)} aria-label="Open navigation menu" aria-controls="restaurant-mobile-sidebar" aria-expanded={mobileMenuOpen} className="hidden size-10 shrink-0 items-center justify-center rounded-lg border border-[#e7d9c4] bg-white/70 text-[#593a20] hover:bg-[#f7eee0] max-[760px]:inline-flex"><Menu size={20} aria-hidden="true" /></button>
					<form className="relative flex h-[38px] w-[min(390px,48%)] items-center gap-2 rounded-lg border border-[#e9ddd1] bg-[#fffdf9] px-[12px] text-[#a1a39b] [&_svg]:size-[16px] [&_input]:w-full [&_input]:min-w-0 [&_input]:border-0 [&_input]:bg-transparent [&_input]:text-[12px] [&_input]:text-[#36382f] [&_input]:outline-none [&_input::placeholder]:text-[#a1a39b] [&_span[role=alert]]:absolute [&_span[role=alert]]:top-[calc(100%+3px)] [&_span[role=alert]]:left-0 [&_span[role=alert]]:text-[10px] [&_span[role=alert]]:text-[#a44b42]" onSubmit={submitSearch}>
						<Search size={16} />
						<input aria-label="Search orders" placeholder="Search orders, customers, or menu items..." value={search} onChange={(event) => { setSearch(event.target.value); setSearchError(""); }} />
						{searchError ? <span role="alert">{searchError}</span> : null}
					</form>
					<div className="flex items-center gap-[18px] max-[760px]:gap-2">
						<NavLink className="relative grid size-[36px] place-items-center rounded-full border border-[#eadfd4] text-[#795344] no-underline [&_svg]:size-[17px] [&_i]:absolute [&_i]:-right-1 [&_i]:-top-1 [&_i]:grid [&_i]:min-w-[17px] [&_i]:h-[17px] [&_i]:place-items-center [&_i]:rounded-full [&_i]:bg-[#bd7047] [&_i]:px-[3px] [&_i]:text-[9px] [&_i]:not-italic [&_i]:text-white" to="/partner/restaurant/notifications" aria-label={`${pendingOrders} pending orders; view notifications`}><Bell size={17} />{pendingOrders > 0 ? <i>{pendingOrders}</i> : null}</NavLink>
						<Link to="/partner/restaurant/profile" aria-label="View restaurant profile" className="flex min-h-11 min-w-11 touch-manipulation items-center gap-2 rounded-full px-1 text-[#3c3f36] no-underline hover:bg-[#f5ece2] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a85f19]">
							{partner?.logo ? <img className="h-[34px] w-[34px] shrink-0 rounded-full bg-[#edf0e6] object-cover" src={partner.logo} alt="" /> : partner?.avatar ? <img className="h-[34px] w-[34px] shrink-0 rounded-full bg-[#edf0e6] object-cover" src={partner.avatar} alt="" /> : <span className="grid size-[34px] shrink-0 place-items-center rounded-full bg-[#edf0e6] text-[#687348]"><CircleUserRound size={21} /></span>}
							<div className="grid gap-[3px] max-[760px]:hidden"><strong className="max-w-[150px] truncate text-[11px] text-[#3c3f36]">{partner?.name ?? "Restaurant Partner"}</strong><small className="text-[10px] text-[#91938a]">Restaurant Partner</small></div>
							<ChevronDown className="w-3 text-[#898b82] max-[760px]:hidden" size={14} />
						</Link>
					</div>
				</header>
				<main className="mx-auto w-full max-w-[1550px] px-6 py-6 pb-9 max-[760px]:px-3 max-[760px]:py-4 max-[760px]:pb-6">
					{shellError ? <div className="mb-[10px] flex items-center justify-between gap-[10px] rounded-md border border-[#f0d9d4] bg-[#fff8f7] px-[11px] py-[9px] text-[9px] text-[#994c43] [&_button]:rounded-[5px] [&_button]:border [&_button]:border-[#eed3cf] [&_button]:bg-white [&_button]:px-2 [&_button]:py-[5px] [&_button]:text-[8px] [&_button]:text-[#914940]" role="alert">{shellError}</div> : null}
					{children}
				</main>
			</div>
		</div>
	);
}
