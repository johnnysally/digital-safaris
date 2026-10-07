import axios from "../axios";
import type {
  LoginResponse,
  AccommodationPartner,
} from "../../types";

interface LoginPayload {
  email: string;
  password: string;
}

const authApi = {
  async login(
    payload: LoginPayload
  ): Promise<LoginResponse<AccommodationPartner>> {
    const res = await axios.post("/accommodation/auth/login", payload);
    const body = res.data?.data ?? res.data;
    return body as LoginResponse<AccommodationPartner>;
  },

  async refresh(payload: {
    refreshToken: string;
  }): Promise<{ accessToken: string; refreshToken?: string }> {
    const res = await axios.post("/accommodation/auth/refresh", payload);
    return res.data?.data ?? res.data;
  },

  async logout(): Promise<void> {
    try {
      await axios.post("/accommodation/auth/logout");
    } catch {
      /* ignore */
    }
  },

  async me(): Promise<AccommodationPartner> {
    const res = await axios.get("/accommodation/auth/me");
    return (res.data?.data ?? res.data) as AccommodationPartner;
  },
};

export default authApi;