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

const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

let isRefreshing = false;
let pendingQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function flushQueue(error: unknown, token: string | null): void {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (token) resolve(token);
    else reject(error);
  });
  pendingQueue = [];
}

function detectRole(url: string): PartnerRole {
  if (url.includes("/transport/")) return "transport";
  if (url.includes("/accommodation/")) return "accommodation";
  return "restaurant";
}

function redirectToLogin(role: PartnerRole): void {
  storage.clearRole(role);
  const path = `/${role}/login`;
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

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push({
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
      isRefreshing = true;

      try {
        const persistentSession = storage.hasPersistentSession(role);
        const { data } = await axios.post<RefreshResponse>(
          `${API_URL}/${role}/auth/refresh`,
          { refreshToken },
          { headers: { "Content-Type": "application/json" } }
        );

        storage.setAccessToken(role, data.accessToken, persistentSession);
        if (data.refreshToken) {
          storage.setRefreshToken(role, data.refreshToken, persistentSession);
        }

        flushQueue(null, data.accessToken);

        original.headers = original.headers ?? {};
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return axiosInstance(original);
      } catch (refreshError) {
        flushQueue(refreshError, null);
        redirectToLogin(role);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
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
    return error.response?.data?.message || error.message || fallback;
  }
  return error instanceof Error ? error.message : fallback;
}

export default axiosInstance;