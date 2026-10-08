import AppRoutes from "./routes/AppRoutes";
import { AuthProvider } from "./context/authContext";
import { SocketProvider } from "./context/socketContext";
import { ThemeProvider, useTheme } from "./context/themeContext";
import { ToastProvider } from "./context/toastContext";

function AppContent() {
	const theme = useTheme();
	return (
		<div data-theme={theme.name} className={theme.pageClassName}>
			<AppRoutes />
		</div>
	);
}

export default function App() {
	return (
		<ThemeProvider>
			<AuthProvider>
				<ToastProvider>
					<SocketProvider>
						<AppContent />
					</SocketProvider>
				</ToastProvider>
			</AuthProvider>
		</ThemeProvider>
	);
};
