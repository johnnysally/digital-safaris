import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import storage from "../utils/storage";
import type { PartnerRole } from "../utils/constants";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

interface RetryConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

interface RefreshResponse {
  accessToken: string;
  refreshToken?: string;
}

interface PendingRefreshRequest {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}

interface RoleRefreshState {
  isRefreshing: boolean;
  pendingQueue: PendingRefreshRequest[];
}

const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

const refreshStates: Record<PartnerRole, RoleRefreshState> = {
  accommodation: { isRefreshing: false, pendingQueue: [] },
  restaurant: { isRefreshing: false, pendingQueue: [] },
  transport: { isRefreshing: false, pendingQueue: [] },
};

function flushQueue(role: PartnerRole, error: unknown, token: string | null): void {
  const state = refreshStates[role];
  state.pendingQueue.forEach(({ resolve, reject }) => {
    if (token) resolve(token);
    else reject(error);
  });
  state.pendingQueue = [];
}

function detectRole(url: string): PartnerRole {
  if (url.includes("/transport/")) return "transport";
  if (url.includes("/accommodation/")) return "accommodation";
  return "restaurant";
}

function redirectToLogin(role: PartnerRole): void {
  storage.clearRole(role);
  const path = `/partner/${role}/login`;
  if (window.location.pathname !== path) {
    window.location.assign(path);
  }
}

axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const role = detectRole(config.url ?? "");
    const token = storage.getAccessToken(role);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const original = error.config as RetryConfig | undefined;
    if (!original) return Promise.reject(error);

    const status = error.response?.status;
    const url = original.url ?? "";
    const role = detectRole(url);

    const isAuthEndpoint =
      url.includes("/auth/login") ||
      url.includes("/auth/refresh") ||
      url.includes("/auth/register");

    if (status === 401 && !original._retry && !isAuthEndpoint) {
      const refreshToken = storage.getRefreshToken(role);

      if (!refreshToken) {
        redirectToLogin(role);
        return Promise.reject(error);
      }

      const refreshState = refreshStates[role];
      if (refreshState.isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshState.pendingQueue.push({
            resolve: (token: string) => {
              original.headers = original.headers ?? {};
              original.headers.Authorization = `Bearer ${token}`;
              original._retry = true;
              resolve(axiosInstance(original));
            },
            reject,
          });
        });
      }

      original._retry = true;
      refreshState.isRefreshing = true;

      try {
        const persistentSession = storage.hasPersistentSession(role);
        const { data } = await axios.post<unknown>(
          `${API_URL}/${role}/auth/refresh`,
          { refreshToken },
          { headers: { "Content-Type": "application/json" } }
        );
        const refreshed = parseRefreshResponse(data);

        storage.setAccessToken(role, refreshed.accessToken, persistentSession);
        if (refreshed.refreshToken) {
          storage.setRefreshToken(role, refreshed.refreshToken, persistentSession);
        }

        flushQueue(role, null, refreshed.accessToken);

        original.headers = original.headers ?? {};
        original.headers.Authorization = `Bearer ${refreshed.accessToken}`;
        return axiosInstance(original);
      } catch (refreshError) {
        flushQueue(role, refreshError, null);
        redirectToLogin(role);
        return Promise.reject(refreshError);
      } finally {
        refreshState.isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export interface BackendList<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
}

export interface BackendEnvelope<T> {
  statusCode: number;
  data: T;
  message: string;
  success: boolean;
}

export function unwrap<T>(body: unknown): T {
  const b = body as BackendEnvelope<T>;
  return (b?.data ?? body) as T;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseRefreshResponse(body: unknown): RefreshResponse {
  const payload = isRecord(body) && "data" in body ? body.data : body;
  if (!isRecord(payload) || typeof payload.accessToken !== "string" || !payload.accessToken) {
    throw new Error("The token refresh response did not contain an access token.");
  }
  if (payload.refreshToken !== undefined && typeof payload.refreshToken !== "string") {
    throw new Error("The token refresh response contained an invalid refresh token.");
  }
  return {
    accessToken: payload.accessToken,
    ...(typeof payload.refreshToken === "string"
      ? { refreshToken: payload.refreshToken }
      : {}),
  };
}

export function unwrapList<T>(
  body: unknown
): {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
} {
  const b = body as BackendEnvelope<BackendList<T>>;
  const inner = (b?.data ?? body) as BackendList<T>;

  const items = Array.isArray(inner?.items)
    ? inner.items
    : Array.isArray(inner)
      ? (inner as unknown as T[])
      : [];

  const total = typeof inner?.total === "number" ? inner.total : items.length;
  const page = typeof inner?.page === "number" ? inner.page : 1;
  const limit =
    typeof inner?.limit === "number" ? inner.limit : items.length || 20;
  const totalPages =
    typeof inner?.totalPages === "number"
      ? inner.totalPages
      : limit > 0
        ? Math.max(1, Math.ceil(total / limit))
        : 1;

  return { data: items, meta: { page, limit, total, totalPages } };
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message || (error.response ? error.message : fallback);
  }
  return error instanceof Error ? error.message : fallback;
}

export default axiosInstance;