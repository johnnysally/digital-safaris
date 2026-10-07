import axios from "./axios";
import type {
  Admin,
  ChangePasswordPayload,
  ForgotPasswordPayload,
  LoginResponse,
  RefreshResponse,
  ResetPasswordPayload,
} from "../types";

interface LoginPayload {
  email: string;
  password: string;
}

type AnyRecord = Record<string, unknown>;

function pick<T = unknown>(
  obj: AnyRecord | undefined,
  keys: string[]
): T | undefined {
  if (!obj) return undefined;
  for (const key of keys) {
    const v = obj[key];
    if (v !== undefined && v !== null) return v as T;
  }
  return undefined;
}

function normalizeLogin(raw: unknown): LoginResponse {
  if (!raw || typeof raw !== "object") {
    throw new Error("Login response is not an object");
  }

  const root = raw as AnyRecord;
  const data =
    (root.data as AnyRecord | undefined) ??
    (root.payload as AnyRecord | undefined) ??
    (root.result as AnyRecord | undefined) ??
    root;

  const admin =
    pick<Admin>(data, ["admin", "user", "me", "account"]) ??
    pick<Admin>(root, ["admin", "user", "me", "account"]);

  const tokens =
    (data.tokens as AnyRecord | undefined) ??
    (root.tokens as AnyRecord | undefined) ??
    {};

  const accessToken =
    pick<string>(data, ["accessToken", "access_token", "token", "jwt"]) ??
    pick<string>(tokens, ["accessToken", "access_token", "token", "jwt"]) ??
    pick<string>(root, ["accessToken", "access_token", "token", "jwt"]);

  const refreshToken =
    pick<string>(data, ["refreshToken", "refresh_token"]) ??
    pick<string>(tokens, ["refreshToken", "refresh_token"]) ??
    pick<string>(root, ["refreshToken", "refresh_token"]) ??
    null;

  if (!admin || !accessToken) {
    throw new Error(
      !accessToken
        ? "Login response is missing an access token"
        : "Login response is missing the admin object"
    );
  }

  return { admin, accessToken, refreshToken: refreshToken ?? "" };
}

function normalizeRefresh(raw: unknown): RefreshResponse {
  if (!raw || typeof raw !== "object") {
    throw new Error("Refresh response is not an object");
  }
  const root = raw as AnyRecord;
  const data = (root.data as AnyRecord | undefined) ?? root;
  const tokens = (data.tokens as AnyRecord | undefined) ?? {};

  const accessToken =
    pick<string>(data, ["accessToken", "access_token", "token", "jwt"]) ??
    pick<string>(tokens, ["accessToken", "access_token", "token", "jwt"]);

  const refreshToken =
    pick<string>(data, ["refreshToken", "refresh_token"]) ??
    pick<string>(tokens, ["refreshToken", "refresh_token"]);

  if (!accessToken) {
    throw new Error("Refresh response is missing an access token");
  }

  return { accessToken, refreshToken };
}

function normalizeMe(raw: unknown): { admin: Admin } {
  if (!raw || typeof raw !== "object") {
    throw new Error("Me response is not an object");
  }
  const root = raw as AnyRecord;
  const data = (root.data as AnyRecord | undefined) ?? root;

  const admin =
    pick<Admin>(data, ["admin", "user", "me", "account"]) ??
    (data._id ? (data as unknown as Admin) : undefined);

  if (!admin) {
    throw new Error("Me response is missing the admin object");
  }
  return { admin };
}

const authApi = {
  async login(payload: LoginPayload): Promise<LoginResponse> {
    const res = await axios.post("/admin/auth/login", payload);
    return normalizeLogin(res.data);
  },

  async refresh(payload: { refreshToken: string }): Promise<RefreshResponse> {
    const res = await axios.post("/admin/auth/refresh", payload);
    return normalizeRefresh(res.data);
  },

  async logout(): Promise<void> {
    await axios.post("/admin/auth/logout");
  },

  async me(): Promise<{ admin: Admin }> {
    const res = await axios.get("/admin/auth/me");
    return normalizeMe(res.data);
  },

  async changePassword(payload: ChangePasswordPayload): Promise<void> {
    await axios.post("/admin/auth/change-password", payload);
  },

  async forgotPassword(payload: ForgotPasswordPayload): Promise<void> {
    await axios.post("/admin/auth/forgot-password", payload);
  },

  async resetPassword(payload: ResetPasswordPayload): Promise<void> {
    await axios.post("/admin/auth/reset-password", payload);
  },
};

export default authApi;