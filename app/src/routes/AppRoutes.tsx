import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../context/authContext";
import Layout from "../components/layout/Layout";
import Spinner from "../components/ui/Spinner";

import Home from "../pages/Home";
import Login from "../pages/Login";
import Register from "../pages/Register";
import VerifyEmail from "../pages/VerifyEmail";
import ForgotPassword from "../pages/ForgotPassword";
import ResetPassword from "../pages/ResetPassword";
import Search from "../pages/Search";
import AccommodationPage from "../pages/Accommodation";
import RestaurantPage from "../pages/Restaurant";
import TransportPage from "../pages/Transport";
import AiConcierge from "../pages/AiConcierge";
import Wallet from "../pages/Wallet";
import Payment from "../pages/Payment";
import Reviews from "../pages/Reviews";
import Notifications from "../pages/Notifications";
import Profile from "../pages/Profile";
import Booking from "../pages/Booking";
import Order from "../pages/Order";
import Trip from "../pages/Trip";
import Broadcast from "../pages/Broadcast";
import Tracking from "../pages/Tracking";
import NotFound from "../pages/NotFound";

function FullPageLoader() {
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <Spinner size="lg" />
    </div>
  );
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <FullPageLoader />;
  if (!isAuthenticated)
    return <Navigate to="/login" replace state={{ from: location }} />;
  return <>{children}</>;
}

function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <FullPageLoader />;

  if (isAuthenticated) {
    const from = (location.state as { from?: Location } | null)?.from;
    const target = from?.pathname
      ? `${from.pathname}${from.search ?? ""}`
      : "/";
    return <Navigate to={target} replace />;
  }
  return <>{children}</>;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <Login />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicOnlyRoute>
            <Register />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <PublicOnlyRoute>
            <ForgotPassword />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/reset-password"
        element={
          <PublicOnlyRoute>
            <ResetPassword />
          </PublicOnlyRoute>
        }
      />
      <Route path="/verify-email" element={<VerifyEmail />} />

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<Search />} />
        <Route path="/accommodation" element={<AccommodationPage />} />
        <Route path="/restaurant" element={<RestaurantPage />} />
        <Route path="/transport" element={<TransportPage />} />
        <Route path="/ai-concierge" element={<AiConcierge />} />

        <Route path="/booking" element={<Booking />} />
        <Route path="/order" element={<Order />} />
        <Route path="/trip" element={<Trip />} />
        <Route path="/broadcast" element={<Broadcast />} />
        <Route path="/tracking" element={<Tracking />} />

        <Route path="/wallet" element={<Wallet />} />
        <Route path="/payment" element={<Payment />} />
        <Route path="/reviews" element={<Reviews />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/profile" element={<Profile />} />

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}