import axios, { unwrap, unwrapList } from "../axios";
import type { Booking, Guest, Paginated, ListParams } from "../../types";

const bookingApi = {
  async list(params?: ListParams): Promise<Paginated<Booking>> {
    const res = await axios.get("/accommodation/bookings", { params });
    return unwrapList<Booking>(res.data);
  },

  async details(
    id: string
  ): Promise<{ booking: Booking; guests: Guest[] }> {
    const res = await axios.get(`/accommodation/bookings/${id}`);
    return unwrap<{ booking: Booking; guests: Guest[] }>(res.data);
  },

  async confirm(id: string): Promise<Booking> {
    const res = await axios.post(
      `/accommodation/bookings/${id}/confirm`
    );
    return unwrap<Booking>(res.data);
  },

  async reject(id: string, reason: string): Promise<Booking> {
    const res = await axios.post(
      `/accommodation/bookings/${id}/reject`,
      { reason }
    );
    return unwrap<Booking>(res.data);
  },

  async checkIn(id: string): Promise<Booking> {
    const res = await axios.post(
      `/accommodation/bookings/${id}/check-in`
    );
    return unwrap<Booking>(res.data);
  },

  async checkOut(id: string): Promise<Booking> {
    const res = await axios.post(
      `/accommodation/bookings/${id}/check-out`
    );
    return unwrap<Booking>(res.data);
  },

  async markNoShow(id: string): Promise<Booking> {
    const res = await axios.post(
      `/accommodation/bookings/${id}/no-show`
    );
    return unwrap<Booking>(res.data);
  },
};

export default bookingApi;