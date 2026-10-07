import axios, { unwrap, unwrapList } from "./axios";
import type { Booking, Paginated, ListParams } from "../types";

const bookingApi = {
  async create(payload: Record<string, unknown>): Promise<Booking> {
    const res = await axios.post("/customer/bookings", payload);
    return unwrap<Booking>(res.data);
  },

  async list(params?: ListParams): Promise<Paginated<Booking>> {
    const res = await axios.get("/customer/bookings", { params });
    return unwrapList<Booking>(res.data);
  },

  async details(id: string): Promise<Booking> {
    const res = await axios.get(`/customer/bookings/${id}`);
    return unwrap<Booking>(res.data);
  },

  async cancel(id: string, reason?: string): Promise<Booking> {
    const res = await axios.post(`/customer/bookings/${id}/cancel`, { reason });
    return unwrap<Booking>(res.data);
  },

  async checkIn(id: string): Promise<Booking> {
    const res = await axios.post(`/customer/bookings/${id}/check-in`);
    return unwrap<Booking>(res.data);
  },
};

export default bookingApi;