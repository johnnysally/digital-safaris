import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import type { JSX } from "react";
import { RestaurantDashboardPage } from "../pages/restaurant/Dashboard";
import { RestaurantLoginPage } from "../pages/restaurant/Login";
import { RestaurantLayout } from "../pages/restaurant/RestaurantLayout";
import { RestaurantAnalyticsPage } from "../pages/restaurant/Analytics";
import { RestaurantBookingsPage } from "../pages/restaurant/Bookings";
import { RestaurantBroadcastsPage } from "../pages/restaurant/Broadcasts";
import { RestaurantMenuItemsPage } from "../pages/restaurant/MenuItems";
import { RestaurantMenuPage } from "../pages/restaurant/Menu";
import { RestaurantMessagesPage } from "../pages/restaurant/Messages";
import { RestaurantOrdersPage } from "../pages/restaurant/Orders";
import { RestaurantProfilePage } from "../pages/restaurant/Profile";
import { RestaurantRatingsPage } from "../pages/restaurant/Ratings";
import { RestaurantSettingsPage } from "../pages/restaurant/Settings";
import { RestaurantWalletPage } from "../pages/restaurant/Wallet";
import storage from "../utils/storage";

function RestaurantProtectedRoute({ children }: { children: JSX.Element }) {
	const location = useLocation();
	if (!storage.getAccessToken("restaurant")) {
		return <Navigate to="/partner/restaurant/login" replace state={{ from: location.pathname }} />;
	}
	return children;
}

export default function RestaurantApp() {
	return (
		<Routes>
			<Route index element={<Navigate to="dashboard" replace />} />
			<Route path="login" element={<RestaurantLoginPage />} />
			<Route path="dashboard" element={<RestaurantProtectedRoute><RestaurantLayout><RestaurantDashboardPage /></RestaurantLayout></RestaurantProtectedRoute>} />
			<Route path="orders" element={<RestaurantProtectedRoute><RestaurantLayout><RestaurantOrdersPage /></RestaurantLayout></RestaurantProtectedRoute>} />
			<Route path="menu" element={<RestaurantProtectedRoute><RestaurantLayout><RestaurantMenuPage /></RestaurantLayout></RestaurantProtectedRoute>} />
			<Route path="menu-items" element={<RestaurantProtectedRoute><RestaurantLayout><RestaurantMenuItemsPage /></RestaurantLayout></RestaurantProtectedRoute>} />
			<Route path="bookings" element={<RestaurantProtectedRoute><RestaurantLayout><RestaurantBookingsPage /></RestaurantLayout></RestaurantProtectedRoute>} />
			<Route path="broadcasts" element={<RestaurantProtectedRoute><RestaurantLayout><RestaurantBroadcastsPage /></RestaurantLayout></RestaurantProtectedRoute>} />
			<Route path="profile" element={<RestaurantProtectedRoute><RestaurantLayout><RestaurantProfilePage /></RestaurantLayout></RestaurantProtectedRoute>} />
			<Route path="wallet" element={<RestaurantProtectedRoute><RestaurantLayout><RestaurantWalletPage /></RestaurantLayout></RestaurantProtectedRoute>} />
			<Route path="reviews" element={<RestaurantProtectedRoute><RestaurantLayout><RestaurantRatingsPage /></RestaurantLayout></RestaurantProtectedRoute>} />
			<Route path="ratings" element={<RestaurantProtectedRoute><RestaurantLayout><RestaurantRatingsPage /></RestaurantLayout></RestaurantProtectedRoute>} />
			<Route path="analytics" element={<RestaurantProtectedRoute><RestaurantLayout><RestaurantAnalyticsPage /></RestaurantLayout></RestaurantProtectedRoute>} />
			<Route path="messages" element={<RestaurantProtectedRoute><RestaurantLayout><RestaurantMessagesPage /></RestaurantLayout></RestaurantProtectedRoute>} />
			<Route path="settings" element={<RestaurantProtectedRoute><RestaurantLayout><RestaurantSettingsPage /></RestaurantLayout></RestaurantProtectedRoute>} />
			<Route path="*" element={<Navigate to="/partner/restaurant/dashboard" replace />} />
		</Routes>
	);
}
