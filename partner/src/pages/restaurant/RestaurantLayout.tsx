import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Link, NavLink, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { BarChart3, Bell, CalendarDays, ChevronDown, CircleUserRound, ClipboardList, CreditCard, LayoutDashboard, LogOut, MessageCircle, Radio, Search, Settings, Star, Utensils, UtensilsCrossed } from "lucide-react";
import authApi from "../../api/restaurant/authApi";
import profileApi from "../../api/restaurant/profileApi";
import orderApi from "../../api/restaurant/orderApi";
import { getApiErrorMessage } from "../../api/axios";
import { useAuth } from "../../context/authContext";
import { usePartnerSocket } from "../../context/socketContext";
import { useToast } from "../../context/toastContext";
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
		<div className="min-h-screen flex text-[#282b25] bg-[#f6f6f2] [font-family:Inter,Segoe_UI,sans-serif]">
			<aside className="sticky top-0 z-20 flex h-screen w-[190px] shrink-0 flex-col overflow-y-auto bg-[#272a24] p-0 text-[#f8f4ec] max-[760px]:w-[58px] max-[480px]:w-[48px]">
				<div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `linear-gradient(180deg, rgba(18, 17, 14, .96), rgba(18, 17, 14, .86) 62%, rgba(18, 17, 14, .38)), url("${sidebarPhoto}")` }} />
				<div className="relative z-10 flex min-h-full flex-1 flex-col p-[20px_12px_13px] max-[760px]:items-center max-[760px]:px-[5px] max-[760px]:py-[14px]">
					<Link to="/partner/restaurant/dashboard" className="relative grid grid-cols-[30px_1fr] gap-x-2 gap-y-0 px-1 pb-[22px] text-white no-underline max-[760px]:flex max-[760px]:px-0 max-[760px]:pb-4 max-[760px]:[&>strong]:hidden max-[760px]:[&>small]:hidden">
						<span className="grid size-[30px] place-items-center rounded-[10px] bg-[#d8c48d] text-[#30342a] [&_svg]:w-[17px] max-[480px]:size-[27px]"><Utensils size={22} /></span>
						<strong>Digital<span>Safaris</span></strong>
						<small>Restaurant Partner Portal</small>
					</Link>
					<nav className="grid w-full gap-[5px]" aria-label="Restaurant partner navigation">
						{restaurantNav.map(({ label, path, icon: Icon }) => (
							<NavLink key={path} to={`/partner/restaurant/${path}`} end={path === "dashboard"} className={({ isActive }) => `flex min-h-[36px] items-center gap-[11px] rounded-[7px] px-[10px] text-[10px] font-medium text-white/70 no-underline transition-colors hover:bg-white/15 hover:text-white [&_svg]:size-[15px] [&_svg]:shrink-0 max-[760px]:justify-center max-[760px]:px-0 max-[760px]:[&_span]:hidden max-[760px]:[&>b]:hidden ${isActive ? "bg-white/15 text-white shadow-[inset_2px_0_#d6bd7c]" : ""}`}>
								<Icon size={16} /><span>{label}</span>
								{path === "orders" && pendingOrders > 0 ? <b>{pendingOrders}</b> : null}
							</NavLink>
						))}
					</nav>
					<button className="mt-auto flex items-center gap-[10px] border-t border-white/15 px-[10px] py-[9px] text-left text-[10px] text-white/70 [&_svg]:w-[14px] max-[760px]:hidden" type="button" onClick={() => void signOut()}><LogOut size={16} /> Sign out</button>
				</div>
			</aside>
			<div className="min-w-0 flex-1">
				<header className="sticky top-0 z-10 flex min-h-[58px] items-center justify-between gap-[15px] border-b border-[#ebebe6] bg-white px-[22px] max-[760px]:min-h-[52px] max-[760px]:px-[10px]">
					<form className="relative flex h-[31px] w-[min(350px,45%)] items-center gap-2 rounded-md border border-[#ededeb] bg-[#fafaf8] px-[10px] text-[#a1a39b] [&_svg]:size-[14px] [&_input]:w-full [&_input]:min-w-0 [&_input]:border-0 [&_input]:bg-transparent [&_input]:text-[10px] [&_input]:text-[#36382f] [&_input]:outline-none [&_input::placeholder]:text-[#a1a39b] [&_span[role=alert]]:absolute [&_span[role=alert]]:top-[calc(100%+3px)] [&_span[role=alert]]:left-0 [&_span[role=alert]]:text-[9px] [&_span[role=alert]]:text-[#a44b42]" onSubmit={submitSearch}>
						<Search size={16} />
						<input aria-label="Search orders" placeholder="Search orders, customers, or menu items..." value={search} onChange={(event) => { setSearch(event.target.value); setSearchError(""); }} />
						{searchError ? <span role="alert">{searchError}</span> : null}
					</form>
					<div className="flex items-center gap-[15px] max-[760px]:gap-2">
						<NavLink className="relative grid size-[30px] place-items-center rounded-full border border-[#eee] text-[#72756c] no-underline [&_svg]:size-[15px] [&_i]:absolute [&_i]:-right-1 [&_i]:-top-1 [&_i]:grid [&_i]:min-w-[15px] [&_i]:h-[15px] [&_i]:place-items-center [&_i]:rounded-full [&_i]:bg-[#bd7047] [&_i]:px-[3px] [&_i]:text-[8px] [&_i]:not-italic [&_i]:text-white" to="/partner/restaurant/orders" aria-label={`${pendingOrders} pending orders`}><Bell size={17} />{pendingOrders > 0 ? <i>{pendingOrders}</i> : null}</NavLink>
						<div className="flex items-center gap-2 [&_img]:size-[30px] [&_img]:shrink-0 [&_img]:rounded-full [&_img]:bg-[#edf0e6] [&_img]:object-cover [&_div]:grid [&_div]:gap-[2px] [&_div]:max-[760px]:hidden [&_strong]:max-w-[130px] [&_strong]:truncate [&_strong]:text-[9px] [&_strong]:text-[#3c3f36] [&_small]:text-[8px] [&_small]:text-[#91938a] [&_svg]:w-3 [&_svg]:text-[#898b82] max-[760px]:[&_svg]:hidden">
							{partner?.logo ? <img src={partner.logo} alt="" /> : partner?.avatar ? <img src={partner.avatar} alt="" /> : <span className="grid size-[30px] shrink-0 place-items-center rounded-full bg-[#edf0e6] text-[#687348]"><CircleUserRound size={21} /></span>}
							<div><strong>{partner?.name ?? "Restaurant Partner"}</strong><small>Restaurant Partner</small></div>
							<ChevronDown size={14} />
						</div>
					</div>
				</header>
				<main className="mx-auto w-full max-w-[1550px] px-5 py-[17px] pb-[25px] max-[760px]:px-[10px] max-[760px]:py-[11px] max-[760px]:pb-[18px]">
					{shellError ? <div className="mb-[10px] flex items-center justify-between gap-[10px] rounded-md border border-[#f0d9d4] bg-[#fff8f7] px-[11px] py-[9px] text-[9px] text-[#994c43] [&_button]:rounded-[5px] [&_button]:border [&_button]:border-[#eed3cf] [&_button]:bg-white [&_button]:px-2 [&_button]:py-[5px] [&_button]:text-[8px] [&_button]:text-[#914940]" role="alert">{shellError}</div> : null}
					{children}
				</main>
			</div>
		</div>
	);
}
