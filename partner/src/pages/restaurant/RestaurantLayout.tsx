import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Link, NavLink, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { BarChart3, Bell, CalendarDays, ChevronDown, CircleUserRound, ClipboardList, CreditCard, LayoutDashboard, LogOut, MessageCircle, Radio, Search, Settings, Star, Utensils, UtensilsCrossed } from "lucide-react";
import authApi from "../../api/restaurant/authApi";
import profileApi from "../../api/restaurant/profileApi";
import orderApi from "../../api/restaurant/orderApi";
import { getApiErrorMessage } from "../../api/axios";
import storage from "../../utils/storage";
import type { RestaurantPartner } from "../../types";
import sidebarPhoto from "../../../../website/public/experience.jpg";

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
	{ label: "Messages", path: "messages", icon: MessageCircle },
	{ label: "Settings", path: "settings", icon: Settings },
];

export function RestaurantLayout({ children }: { children: ReactNode }) {
	const [partner, setPartner] = useState<RestaurantPartner | null>(null);
	const [pendingOrders, setPendingOrders] = useState(0);
	const [shellError, setShellError] = useState("");
	const [search, setSearch] = useState("");
	const [searchError, setSearchError] = useState("");
	const navigate = useNavigate();
	const location = useLocation();
	const [searchParams] = useSearchParams();

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
		} finally {
			storage.clearRole("restaurant");
			navigate("/partner/restaurant/login", { replace: true });
		}
	}

	return (
		<div className="restaurant-shell">
			<aside className="restaurant-sidebar">
				<div className="restaurant-sidebar-backdrop" style={{ backgroundImage: `linear-gradient(180deg, rgba(18, 17, 14, .96), rgba(18, 17, 14, .86) 62%, rgba(18, 17, 14, .38)), url("${sidebarPhoto}")` }} />
				<div className="restaurant-sidebar-inner">
					<Link to="/partner/restaurant/dashboard" className="restaurant-brand">
						<span className="restaurant-brand-mark"><Utensils size={22} /></span>
						<strong>Digital<span>Safaris</span></strong>
						<small>Restaurant Partner Portal</small>
					</Link>
					<nav className="restaurant-nav" aria-label="Restaurant partner navigation">
						{restaurantNav.map(({ label, path, icon: Icon }) => (
							<NavLink key={path} to={`/partner/restaurant/${path}`} end={path === "dashboard"} className={({ isActive }) => `restaurant-nav-link${isActive ? " active" : ""}`}>
								<Icon size={16} /><span>{label}</span>
								{path === "orders" && pendingOrders > 0 ? <b>{pendingOrders}</b> : null}
							</NavLink>
						))}
					</nav>
					<button className="restaurant-signout" type="button" onClick={() => void signOut()}><LogOut size={16} /> Sign out</button>
				</div>
			</aside>
			<div className="restaurant-workspace">
				<header className="restaurant-header">
					<form className="restaurant-search" onSubmit={submitSearch}>
						<Search size={16} />
						<input aria-label="Search orders" placeholder="Search orders, customers, or menu items..." value={search} onChange={(event) => { setSearch(event.target.value); setSearchError(""); }} />
						{searchError ? <span role="alert">{searchError}</span> : null}
					</form>
					<div className="restaurant-header-actions">
						<NavLink className="restaurant-header-notifications" to="/partner/restaurant/orders" aria-label={`${pendingOrders} pending orders`}><Bell size={17} />{pendingOrders > 0 ? <i>{pendingOrders}</i> : null}</NavLink>
						<div className="restaurant-user-chip">
							{partner?.logo ? <img src={partner.logo} alt="" /> : partner?.avatar ? <img src={partner.avatar} alt="" /> : <span className="restaurant-user-placeholder"><CircleUserRound size={21} /></span>}
							<div><strong>{partner?.name ?? "Restaurant Partner"}</strong><small>Restaurant Partner</small></div>
							<ChevronDown size={14} />
						</div>
					</div>
				</header>
				<main className="restaurant-content">
					{shellError ? <div className="restaurant-feedback" role="alert">{shellError}</div> : null}
					{children}
				</main>
			</div>
		</div>
	);
}
