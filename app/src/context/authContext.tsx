import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { authApi } from "../api";
import storage from "../utils/storage";
import type { Customer } from "../types";

interface LoginPayload {
  email: string;
  password: string;
}

interface AuthContextValue {
  customer: Customer | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  setCustomer: (customer: Customer | null) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
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
        const data = await authApi.me();
        setCustomer(data.customer);
        setAccessToken(token);
        setRefreshToken(storage.getRefreshToken());
      } catch {
        storage.clearSession();
        setCustomer(null);
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

    storage.setAccessToken(data.accessToken);
    if (data.refreshToken) storage.setRefreshToken(data.refreshToken);

    setCustomer(data.customer);
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
      setCustomer(null);
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
      customer,
      accessToken,
      refreshToken,
      isAuthenticated: Boolean(customer && accessToken),
      isLoading,
      login,
      logout,
      refresh,
      setCustomer,
    }),
    [customer, accessToken, refreshToken, isLoading, login, logout, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}

export default AuthContext;