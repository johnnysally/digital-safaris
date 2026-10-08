import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { PartnerRole } from "../utils/constants";
import { canAccessPartnerPortal } from "../utils/permissions";
import storage from "../utils/storage";

type AuthContextValue = {
	isAuthenticated: (role: PartnerRole) => boolean;
	signIn: (role: PartnerRole, accessToken: string, refreshToken: string, persistent?: boolean) => void;
	signOut: (role: PartnerRole) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function readSessions(): Record<PartnerRole, boolean> {
	return {
		accommodation: Boolean(storage.getAccessToken("accommodation")),
		restaurant: Boolean(storage.getAccessToken("restaurant")),
		transport: Boolean(storage.getAccessToken("transport")),
	};
}

export function AuthProvider({ children }: { children: ReactNode }) {
	const [sessions, setSessions] = useState(readSessions);

	useEffect(() => {
		function synchronizeSessions(event: StorageEvent) {
			if (event.key && !event.key.startsWith("digitalsafaris_")) return;
			setSessions(readSessions());
		}

		window.addEventListener("storage", synchronizeSessions);
		return () => window.removeEventListener("storage", synchronizeSessions);
	}, []);

	const signIn = useCallback((role: PartnerRole, accessToken: string, refreshToken: string, persistent = true) => {
		storage.setSession(role, accessToken, refreshToken, persistent);
		setSessions((current) => ({ ...current, [role]: true }));
	}, []);

	const signOut = useCallback((role: PartnerRole) => {
		storage.clearRole(role);
		setSessions((current) => ({ ...current, [role]: false }));
	}, []);

	const isAuthenticated = useCallback((role: PartnerRole) => (
		canAccessPartnerPortal(sessions, role) && Boolean(storage.getAccessToken(role))
	), [sessions]);

	const value = useMemo(() => ({ isAuthenticated, signIn, signOut }), [isAuthenticated, signIn, signOut]);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (!context) throw new Error("useAuth must be used within an AuthProvider");
	return context;
}
