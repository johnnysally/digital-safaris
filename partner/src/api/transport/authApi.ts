import axios, { unwrap } from "../axios";
import type { LoginResponse, TransportPartner } from "../../types";

interface LoginPayload {
  email: string;
  password: string;
}

export interface TransportRegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  countryCode: string;
  password: string;
  idNumber?: string;
  licenseNumber?: string;
  licenseExpiry?: string;
  town: string;
  address?: string;
  locationId: string;
  serviceTypes: string[];
}

const authApi = {
  async register(payload: TransportRegisterPayload): Promise<{ partnerId: string }> {
    const res = await axios.post("/transport/auth/register", payload);
    return unwrap<{ partnerId: string }>(res.data);
  },

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