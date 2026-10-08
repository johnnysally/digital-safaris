import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import AccommodationApp from "../apps/AccommodationApp";
import RestaurantApp from "../apps/RestaurantApp";
import TransportApp from "../apps/TransportApp";
import PartnerLandingPage from "../pages/landing/PartnerLandingPage";

function LegacyAccommodationRedirect() {
	const location = useLocation();
	const appPath = location.pathname.replace(/^\/partner\/?/, "");
	return <Navigate to={`/partner/accommodation/${appPath}${location.search}${location.hash}`} replace />;
}

function AppRoutesContent() {
	return (
		<Routes>
			<Route path="/" element={<Navigate to="/partner" replace />} />
			<Route path="/partner" element={<PartnerLandingPage />} />
			<Route path="/partner/accommodation/*" element={<AccommodationApp />} />
			<Route path="/partner/restaurant/*" element={<RestaurantApp />} />
			<Route path="/partner/transport/*" element={<TransportApp />} />
			<Route path="/partner/*" element={<LegacyAccommodationRedirect />} />
			<Route path="*" element={<Navigate to="/partner" replace />} />
		</Routes>
	);
}

export default function AppRoutes() {
	return <AppRoutesContent />;
}
