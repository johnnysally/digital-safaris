import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import authApi from "../api/authApi";
import storage from "../utils/storage";
import type { Admin } from "../types";

interface LoginPayload {
  email: string;
  password: string;
}

interface AuthContextValue {
  admin: Admin | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  setAdmin: (admin: Admin | null) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(
    storage.getAccessToken()
  );
  const [refreshToken, setRefreshToken] = useState<string | null>(
    storage.getRefreshToken()
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const bootstrap = async () => {
      const token = storage.getAccessToken();
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const { admin: me } = await authApi.me();
        setAdmin(me);
        setAccessToken(token);
        setRefreshToken(storage.getRefreshToken());
      } catch {
        storage.clearSession();
        setAdmin(null);
        setAccessToken(null);
        setRefreshToken(null);
      } finally {
        setIsLoading(false);
      }
    };
    bootstrap();
  }, []);

  const login = useCallback(async ({ email, password }: LoginPayload) => {
    const data = await authApi.login({ email, password });

    if (!data.accessToken) throw new Error("Missing accessToken");
    if (!data.admin) throw new Error("Missing admin");

    storage.setAccessToken(data.accessToken);
    if (data.refreshToken) storage.setRefreshToken(data.refreshToken);

    setAdmin(data.admin);
    setAccessToken(data.accessToken);
    setRefreshToken(data.refreshToken ?? null);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      /* swallow */
    } finally {
      storage.clearSession();
      setAdmin(null);
      setAccessToken(null);
      setRefreshToken(null);
    }
  }, []);

  const refresh = useCallback(async () => {
    const rt = storage.getRefreshToken();
    if (!rt) throw new Error("No refresh token");
    const data = await authApi.refresh({ refreshToken: rt });
    storage.setAccessToken(data.accessToken);
    if (data.refreshToken) storage.setRefreshToken(data.refreshToken);
    setAccessToken(data.accessToken);
    if (data.refreshToken) setRefreshToken(data.refreshToken);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      admin,
      accessToken,
      refreshToken,
      isAuthenticated: Boolean(admin && accessToken),
      isLoading,
      login,
      logout,
      refresh,
      setAdmin,
    }),
    [admin, accessToken, refreshToken, isLoading, login, logout, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}

export default AuthContext;