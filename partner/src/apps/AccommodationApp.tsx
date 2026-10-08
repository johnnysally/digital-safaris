import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import type { JSX } from "react";
import { LoginPage, SignupPage } from "../pages/accommodation/Login";
import { DashboardPage } from "../pages/accommodation/Dashboard";
import { PropertyPage } from "../pages/accommodation/Property";
import { BookingsPage } from "../pages/accommodation/Bookings";
import { AvailabilityPage } from "../pages/accommodation/Availability";
import { MessagesPage } from "../pages/accommodation/Guests";
import { ReviewsPage } from "../pages/accommodation/Ratings";
import { PaymentsPage } from "../pages/accommodation/Wallet";
import { ProfilePage } from "../pages/accommodation/Profile";
import { ReportsPage } from "../pages/accommodation/Reports";
import { SupportPage } from "../pages/accommodation/Support";
import { RoomsPage } from "../pages/accommodation/Rooms";
import { useAuth } from "../context/authContext";

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated("accommodation")) {
    return <Navigate to="/partner/accommodation/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}

export default function AccommodationApp() {
  return (
    <Routes>
      <Route index element={<Navigate to="dashboard" replace />} />
      <Route path="login" element={<LoginPage />} />
      <Route path="signup" element={<SignupPage />} />
      <Route path="dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="properties" element={<ProtectedRoute><PropertyPage /></ProtectedRoute>} />
      <Route path="properties/new" element={<ProtectedRoute><PropertyPage mode="new" /></ProtectedRoute>} />
      <Route path="properties/:propertyId/edit" element={<ProtectedRoute><PropertyPage mode="edit" /></ProtectedRoute>} />
      <Route path="rooms" element={<ProtectedRoute><RoomsPage /></ProtectedRoute>} />
      <Route path="bookings" element={<ProtectedRoute><BookingsPage /></ProtectedRoute>} />
      <Route path="availability" element={<ProtectedRoute><AvailabilityPage /></ProtectedRoute>} />
      <Route path="messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
      <Route path="reviews" element={<ProtectedRoute><ReviewsPage /></ProtectedRoute>} />
      <Route path="payments" element={<ProtectedRoute><PaymentsPage /></ProtectedRoute>} />
      <Route path="reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
      <Route path="profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="support" element={<ProtectedRoute><SupportPage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/partner/accommodation/dashboard" replace />} />
    </Routes>
  );
}
