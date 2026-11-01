import { lazy, Suspense } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";

const AccommodationApp = lazy(() => import("../apps/AccommodationApp"));
const RestaurantApp = lazy(() => import("../apps/RestaurantApp"));
const TransportApp = lazy(() => import("../apps/TransportApp"));
const PartnerLandingPage = lazy(() => import("../pages/landing/PartnerLandingPage"));
const NotFound = lazy(() => import("../pages/NotFound"));

function LegacyAccommodationRedirect() {
	const location = useLocation();
	const appPath = location.pathname.replace(/^\/partner\/?/, "");
	return <Navigate to={`/partner/accommodation/${appPath}${location.search}${location.hash}`} replace />;
}

function AppRoutesContent() {
	return (
		<Suspense fallback={<div className="p-6 text-center" role="status">Loading partner portal…</div>}>
			<Routes>
				<Route path="/" element={<Navigate to="/partner" replace />} />
				<Route path="/partner" element={<PartnerLandingPage />} />
				<Route path="/partner/accommodation/*" element={<AccommodationApp />} />
				<Route path="/partner/restaurant/*" element={<RestaurantApp />} />
				<Route path="/partner/transport/*" element={<TransportApp />} />
				<Route path="/partner/*" element={<LegacyAccommodationRedirect />} />
				<Route path="*" element={<NotFound />} />
			</Routes>
		</Suspense>
	);
}

export default function AppRoutes() {
	return <AppRoutesContent />;
}
