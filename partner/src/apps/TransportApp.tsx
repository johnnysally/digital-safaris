import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import type { JSX } from "react";
import { DashboardPage, TransportNotificationsPage, TransportReportsPage } from "../pages/transport/Dashboard";
import { TransportLoginPage } from "../pages/transport/Login";
import { TransportRegisterPage } from "../pages/transport/Register";
import { VehiclesPage } from "../pages/transport/Vehicle";
import { TripsPage } from "../pages/transport/Trips";
import { JobsPage } from "../pages/transport/Jobs";
import { AvailabilityPage } from "../pages/transport/Location";
import { TransportReviewsPage } from "../pages/transport/Ratings";
import { TransportPaymentsPage } from "../pages/transport/Wallet";
import { TransportProfilePage } from "../pages/transport/Profile";
import { TransportSettingsPage } from "../pages/transport/Profile";
import { useAuth } from "../context/authContext";
import NotFound from "../pages/NotFound";

function TransportProtectedRoute({ children }: { children: JSX.Element }) {
	const location = useLocation();
	const { isAuthenticated } = useAuth();
	if (!isAuthenticated("transport")) {
		return <Navigate to="/partner/transport/login" replace state={{ from: location.pathname }} />;
	}
	return children;
}

export default function TransportApp() {
	return (
		<Routes>
			<Route index element={<Navigate to="dashboard" replace />} />
			<Route path="login" element={<TransportLoginPage />} />
			<Route path="register" element={<TransportRegisterPage />} />
			<Route path="dashboard" element={<TransportProtectedRoute><DashboardPage /></TransportProtectedRoute>} />
			<Route path="vehicles" element={<TransportProtectedRoute><VehiclesPage /></TransportProtectedRoute>} />
			<Route path="trips" element={<TransportProtectedRoute><TripsPage /></TransportProtectedRoute>} />
			<Route path="jobs" element={<TransportProtectedRoute><JobsPage /></TransportProtectedRoute>} />
			<Route path="availability" element={<TransportProtectedRoute><AvailabilityPage /></TransportProtectedRoute>} />
			<Route path="notifications" element={<TransportProtectedRoute><TransportNotificationsPage /></TransportProtectedRoute>} />
			<Route path="reviews" element={<TransportProtectedRoute><TransportReviewsPage /></TransportProtectedRoute>} />
			<Route path="payments" element={<TransportProtectedRoute><TransportPaymentsPage /></TransportProtectedRoute>} />
			<Route path="reports" element={<TransportProtectedRoute><TransportReportsPage /></TransportProtectedRoute>} />
			<Route path="profile" element={<TransportProtectedRoute><TransportProfilePage /></TransportProtectedRoute>} />
			<Route path="settings" element={<TransportProtectedRoute><TransportSettingsPage /></TransportProtectedRoute>} />
			<Route path="*" element={<NotFound />} />
		</Routes>
	);
}
