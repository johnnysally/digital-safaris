import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import { API_URL } from "../utils/constants";
import storage from "../utils/storage";

declare module "axios" {
  export interface AxiosRequestConfig {
    skipAuth?: boolean;
  }
}

interface RetryConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
  skipAuth?: boolean;
}

interface RefreshResponse {
  accessToken: string;
  refreshToken?: string;
}

type ToastFn = (message: string, description?: string) => void;

let toastError: ToastFn | null = null;
let toastWarning: ToastFn | null = null;
let toastInfo: ToastFn | null = null;

export function bindToast(fns: {
  error?: ToastFn;
  warning?: ToastFn;
  info?: ToastFn;
}): void {
  if (fns.error) toastError = fns.error;
  if (fns.warning) toastWarning = fns.warning;
  if (fns.info) toastInfo = fns.info;
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
    if ((config as RetryConfig).skipAuth) {
      if (config.headers) delete config.headers.Authorization;
      return config;
    }
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
    const status = error.response?.status;

    if (!original) return Promise.reject(error);

    const url = original.url ?? "";
    const isAuthEndpoint =
      url.includes("/admin/auth/login") ||
      url.includes("/admin/auth/refresh") ||
      url.includes("/admin/auth/forgot-password") ||
      url.includes("/admin/auth/reset-password");

    const isPublicEndpoint =
      url.includes("/public/") || original.skipAuth === true;

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
          `${API_URL}/admin/auth/refresh`,
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

    if (isPublicEndpoint) {
      return Promise.reject(error);
    }

    if (status === 403) {
      toastError?.(
        "Access denied",
        extractMessage(error) ?? "You don't have permission for this action."
      );
    } else if (status === 429) {
      toastWarning?.("Too many requests", "Please slow down and try again.");
    } else if (status && status >= 500) {
      toastError?.("Server error", "Something went wrong. Please try again.");
    } else if (!error.response) {
      toastError?.("Network error", "Check your connection and try again.");
    }

    return Promise.reject(error);
  }
);

function extractMessage(error: AxiosError): string | undefined {
  const data = error.response?.data as
    | { message?: string; error?: string }
    | undefined;
  return data?.message ?? data?.error;
}

export interface BackendList<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
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
    typeof inner?.limit === "number" ? inner.limit : items.length || 25;
  const totalPages = limit > 0 ? Math.max(1, Math.ceil(total / limit)) : 1;

  return { data: items, meta: { page, limit, total, totalPages } };
}

export { extractMessage };
export default axiosInstance;