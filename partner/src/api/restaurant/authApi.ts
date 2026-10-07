import axios from "../axios";
import type { LoginResponse, RestaurantPartner } from "../../types";

interface LoginPayload {
  email: string;
  password: string;
}

const authApi = {
  async login(payload: LoginPayload): Promise<LoginResponse<RestaurantPartner>> {
    const res = await axios.post("/restaurant/auth/login", payload);
    const body = res.data?.data ?? res.data;
    return body as LoginResponse<RestaurantPartner>;
  },

  async refresh(payload: {
    refreshToken: string;
  }): Promise<{ accessToken: string; refreshToken?: string }> {
    const res = await axios.post("/restaurant/auth/refresh", payload);
    return res.data?.data ?? res.data;
  },

  async logout(): Promise<void> {
    try {
      await axios.post("/restaurant/auth/logout");
    } catch {
      /* ignore */
    }
  },

  async me(): Promise<RestaurantPartner> {
    const res = await axios.get("/restaurant/auth/me");
    return (res.data?.data ?? res.data) as RestaurantPartner;
  },
};

export default authApi;