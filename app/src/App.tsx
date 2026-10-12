import { BrowserRouter } from "react-router-dom";
import { ToastProvider } from "./context/toastContext";
import { AuthProvider } from "./context/authContext";
import { BrandingProvider } from "./context/brandingContext";
import { SocketProvider } from "./context/socketContext";
import AppRoutes from "./routes/AppRoutes";

export default function App() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <ToastProvider>
        <AuthProvider>
          <BrandingProvider>
            <SocketProvider>
              <AppRoutes />
            </SocketProvider>
          </BrandingProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}