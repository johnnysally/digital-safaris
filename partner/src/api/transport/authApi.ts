import axios from "../axios";
import type { LoginResponse, TransportPartner } from "../../types";

interface LoginPayload {
  email: string;
  password: string;
}

const authApi = {
  async login(payload: LoginPayload): Promise<LoginResponse<TransportPartner>> {
    const res = await axios.post("/transport/auth/login", payload);
    const body = res.data?.data ?? res.data;
    return body as LoginResponse<TransportPartner>;
  },

  async refresh(payload: {
    refreshToken: string;
  }): Promise<{ accessToken: string; refreshToken?: string }> {
    const res = await axios.post("/transport/auth/refresh", payload);
    return res.data?.data ?? res.data;
  },

  async logout(): Promise<void> {
    try {
      await axios.post("/transport/auth/logout");
    } catch {
      /* ignore */
    }
  },

  async me(): Promise<TransportPartner> {
    const res = await axios.get("/transport/auth/me");
    return (res.data?.data ?? res.data) as TransportPartner;
  },
};

export default authApi;