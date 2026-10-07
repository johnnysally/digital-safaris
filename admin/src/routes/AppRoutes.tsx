import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../context/authContext";
import Layout from "../components/layout/Layout";
import Spinner from "../components/ui/Spinner";

import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import Admins from "../pages/Admins";
import Customers from "../pages/Customers";
import Partners from "../pages/Partners";
import Operations from "../pages/Operations";
import Payments from "../pages/Payments";
import PaymentMethods from "../pages/PaymentMethods";
import Wallets from "../pages/Wallets";
import Disputes from "../pages/Disputes";
import Reports from "../pages/Reports";
import Contacts from "../pages/Contacts";
import Settings from "../pages/Settings";
import Backup from "../pages/Backup";
import Branding from "../pages/Branding";
import Health from "../pages/Health";
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
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />

        <Route path="/admins" element={<Admins />} />
        <Route path="/customers" element={<Customers />} />

        <Route path="/partners" element={<Partners />} />
        <Route path="/partners/:type/:id" element={<Partners />} />

        <Route path="/operations" element={<Operations />} />
        <Route path="/operations/bookings/:id" element={<Operations />} />
        <Route path="/operations/orders/:id" element={<Operations />} />
        <Route path="/operations/trips/:id" element={<Operations />} />
        <Route path="/operations/broadcasts/:id" element={<Operations />} />

        <Route path="/payments" element={<Payments />} />
        <Route path="/payment-methods" element={<PaymentMethods />} />
        <Route path="/wallets" element={<Wallets />} />
        <Route path="/wallets/:type/:id" element={<Wallets />} />
        <Route path="/disputes" element={<Disputes />} />
        <Route path="/disputes/:id" element={<Disputes />} />
        <Route path="/reports" element={<Reports />} />

        <Route path="/contacts" element={<Contacts />} />

        <Route path="/settings" element={<Settings />} />
        <Route path="/backup" element={<Backup />} />
        <Route path="/branding" element={<Branding />} />
        <Route path="/health" element={<Health />} />

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}