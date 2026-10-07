import { BrowserRouter, Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import AccommodationApp from "../apps/AccommodationApp";
import RestaurantApp from "../apps/RestaurantApp";
import TransportApp from "../apps/TransportApp";

function PartnerAppsHome() {
	return (
		<main className="partner-apps-home">
			<div className="partner-apps-home-inner">
				<p className="eyebrow">DigitalSafaris Partners</p>
				<h1>Choose your workspace</h1>
				<p className="partner-apps-intro">Open the portal for the services you manage.</p>
				<div className="partner-apps-grid">
					<Link to="/partner/accommodation" className="partner-app-card">
						<span className="partner-app-mark">A</span>
						<span><strong>Accommodation</strong><small>Properties, rooms and reservations</small></span>
						<span className="partner-app-arrow">→</span>
					</Link>
					<Link to="/partner/restaurant" className="partner-app-card">
						<span className="partner-app-mark">R</span>
						<span><strong>Restaurant</strong><small>Menus, orders and bookings</small></span>
						<span className="partner-app-arrow">→</span>
					</Link>
					<Link to="/partner/transport" className="partner-app-card">
						<span className="partner-app-mark">T</span>
						<span><strong>Transport</strong><small>Vehicles, trips and delivery jobs</small></span>
						<span className="partner-app-arrow">→</span>
					</Link>
				</div>
			</div>
		</main>
	);
}

function LegacyAccommodationRedirect() {
	const location = useLocation();
	const appPath = location.pathname.replace(/^\/partner\/?/, "");
	return <Navigate to={`/partner/accommodation/${appPath}${location.search}${location.hash}`} replace />;
}

function AppRoutesContent() {
	return (
		<Routes>
			<Route path="/" element={<Navigate to="/partner" replace />} />
			<Route path="/partner" element={<PartnerAppsHome />} />
			<Route path="/partner/accommodation/*" element={<AccommodationApp />} />
			<Route path="/partner/restaurant/*" element={<RestaurantApp />} />
			<Route path="/partner/transport/*" element={<TransportApp />} />
			<Route path="/partner/*" element={<LegacyAccommodationRedirect />} />
			<Route path="*" element={<Navigate to="/partner" replace />} />
		</Routes>
	);
}

export default function AppRoutes() {
	return <BrowserRouter><AppRoutesContent /></BrowserRouter>;
}
