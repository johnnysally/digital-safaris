import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import { API_URL } from "../utils/constants";
import storage from "../utils/storage";

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

function redirectToLogin(): void {
  storage.clearSession();
  if (window.location.pathname !== "/login") {
    window.location.assign("/login");
  }
}

axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = storage.getAccessToken();
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

    const isAuthEndpoint =
      url.includes("/public/register/login") ||
      url.includes("/public/register/refresh") ||
      url.includes("/public/register/forgot-password") ||
      url.includes("/public/register/reset-password") ||
      url.includes("/public/register/verify-email");

    const isPublicEndpoint =
      url.includes("/public/site") ||
      url.includes("/public/legals") ||
      url.includes("/public/ai-concierge") ||
      url.includes("/public/search");

    if (
      status === 401 &&
      !original._retry &&
      !isAuthEndpoint &&
      !isPublicEndpoint
    ) {
      const refreshToken = storage.getRefreshToken();

      if (!refreshToken) {
        redirectToLogin();
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
        const { data } = await axios.post<RefreshResponse>(
          `${API_URL}/public/register/refresh`,
          { refreshToken },
          { headers: { "Content-Type": "application/json" } }
        );

        storage.setAccessToken(data.accessToken);
        if (data.refreshToken) storage.setRefreshToken(data.refreshToken);

        flushQueue(null, data.accessToken);

        original.headers = original.headers ?? {};
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return axiosInstance(original);
      } catch (refreshError) {
        flushQueue(refreshError, null);
        redirectToLogin();
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

export default axiosInstance;