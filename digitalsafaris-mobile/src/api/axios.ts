import axios, {
  AxiosError,
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import { API_URL } from '../utils/constants';
import storage from '../utils/storage';

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
  headers: { 'Content-Type': 'application/json' },
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

async function redirectToLogin(): Promise<void> {
  await storage.clearSession();
  try {
    const { useAuthStore } = require('../store/authStore');
    useAuthStore.getState().logout().catch(() => {});
  } catch {}
}

axiosInstance.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await storage.getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const original = error.config as RetryConfig | undefined;
    if (!original) return Promise.reject(error);

    const status = error.response?.status;
    const url = original.url ?? '';

    const isAuthEndpoint =
      url.includes('/public/register/customer') ||
      url.includes('/public/register/resend-verification') ||
      url.includes('/public/register/login') ||
      url.includes('/customer/auth/refresh') ||
      url.includes('/customer/auth/logout') ||
      url.includes('/public/register/forgot-password') ||
      url.includes('/public/register/reset-password') ||
      url.includes('/public/register/verify-email');

    const isPublicEndpoint =
      url.includes('/public/site') ||
      url.includes('/public/legals') ||
      url.includes('/public/ai-concierge') ||
      url.includes('/public/search') ||
      url.includes('/public/payment');

    if (
      status === 401 &&
      !original._retry &&
      !isAuthEndpoint &&
      !isPublicEndpoint
    ) {
      const refreshToken = await storage.getRefreshToken();

      if (!refreshToken) {
        await redirectToLogin();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push({
            resolve: (token: string) => {
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
          `${API_URL}/customer/auth/refresh`,
          { refreshToken },
          { headers: { 'Content-Type': 'application/json' } },
        );

        const body = (data as any)?.data ?? data;
        const accessToken: string = body.accessToken;
        const newRefreshToken: string | undefined = body.refreshToken;

        await storage.setAccessToken(accessToken);
        if (newRefreshToken) await storage.setRefreshToken(newRefreshToken);

        flushQueue(null, accessToken);

        original.headers.Authorization = `Bearer ${accessToken}`;
        return axiosInstance(original);
      } catch (refreshError) {
        flushQueue(refreshError, null);
        await redirectToLogin();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
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
  body: unknown,
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

  const total = typeof inner?.total === 'number' ? inner.total : items.length;
  const page = typeof inner?.page === 'number' ? inner.page : 1;
  const limit =
    typeof inner?.limit === 'number' ? inner.limit : items.length || 20;
  const totalPages =
    typeof inner?.totalPages === 'number'
      ? inner.totalPages
      : limit > 0
        ? Math.max(1, Math.ceil(total / limit))
        : 1;

  return { data: items, meta: { page, limit, total, totalPages } };
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    return (
      error.response?.data?.message ||
      (error.response ? error.message : fallback)
    );
  }
  return error instanceof Error ? error.message : fallback;
}

export default axiosInstance;