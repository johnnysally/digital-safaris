import { useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "./context/themeContext";
import { ToastProvider, useToast } from "./context/toastContext";
import { AuthProvider } from "./context/authContext";
import { BrandingProvider } from "./context/brandingContext";
import { SocketProvider } from "./context/socketContext";
import { bindToast } from "./api/axios";
import AppRoutes from "./routes/AppRoutes";

function AxiosToastBridge() {
  const { error, warning, info } = useToast();
  useEffect(() => {
    bindToast({ error, warning, info });
  }, [error, warning, info]);
  return null;
}

export default function App() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <ThemeProvider>
        <ToastProvider>
          <AxiosToastBridge />
          <AuthProvider>
            <BrandingProvider>
              <SocketProvider>
                <AppRoutes />
              </SocketProvider>
            </BrandingProvider>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}