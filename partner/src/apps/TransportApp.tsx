import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import type { JSX } from "react";
import { MessageSquareText } from "lucide-react";
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
import { TransportLayout } from "../pages/transport/Dashboard";
import { PageHeader } from "../components/layout/Layout";
import { useAuth } from "../context/authContext";

function TransportMessagesPage() {
	return <TransportLayout><div className="w-full [&_.page-header]:mb-4 [&_.page-header_h1]:text-[2rem] [&_.page-header_p]:text-[.84rem] max-[760px]:[&_.page-header_h1]:text-[1.65rem]"><PageHeader title="Messages" subtitle="Keep up with customer communications for your transport services." /><section className="min-w-0 rounded-md border border-[rgba(130,110,92,.14)] bg-[rgba(255,252,247,.92)] shadow-[0_2px_8px_rgba(36,22,13,.025)] flex min-h-[260px] flex-col items-center justify-center gap-2.5 p-6 text-center [&>span]:grid [&>span]:h-[46px] [&>span]:w-[46px] [&>span]:place-items-center [&>span]:rounded-full [&>span]:bg-[#faecd5] [&>span]:text-[#925719] [&_h2]:m-0 [&_h2]:font-[Cormorant_Garamond,Georgia,serif] [&_h2]:text-[1.3rem] [&_p]:m-0 [&_p]:max-w-[460px] [&_p]:text-[.8rem] [&_p]:leading-[1.55]"><span><MessageSquareText size={21} /></span><h2>Messaging is not connected</h2><p>The current transport API does not expose conversation history or message sending yet. Trip and delivery updates remain available from Bookings and Delivery Jobs.</p></section></div></TransportLayout>;
}

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
			<Route path="messages" element={<TransportProtectedRoute><TransportMessagesPage /></TransportProtectedRoute>} />
			<Route path="notifications" element={<TransportProtectedRoute><TransportNotificationsPage /></TransportProtectedRoute>} />
			<Route path="reviews" element={<TransportProtectedRoute><TransportReviewsPage /></TransportProtectedRoute>} />
			<Route path="payments" element={<TransportProtectedRoute><TransportPaymentsPage /></TransportProtectedRoute>} />
			<Route path="reports" element={<TransportProtectedRoute><TransportReportsPage /></TransportProtectedRoute>} />
			<Route path="profile" element={<TransportProtectedRoute><TransportProfilePage /></TransportProtectedRoute>} />
			<Route path="settings" element={<TransportProtectedRoute><TransportSettingsPage /></TransportProtectedRoute>} />
			<Route path="*" element={<Navigate to="/partner/transport/dashboard" replace />} />
		</Routes>
	);
}
