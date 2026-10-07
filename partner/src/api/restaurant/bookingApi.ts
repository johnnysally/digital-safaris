import axios, { unwrap, unwrapList } from "../axios";
import type {
  DineInBooking,
  Paginated,
  ListParams,
} from "../../types";

const bookingApi = {
  async list(params?: ListParams): Promise<Paginated<DineInBooking>> {
    const res = await axios.get("/restaurant/bookings", { params });
    return unwrapList<DineInBooking>(res.data);
  },

  async details(id: string): Promise<DineInBooking> {
    const res = await axios.get(`/restaurant/bookings/${id}`);
    return unwrap<DineInBooking>(res.data);
  },

  async accept(id: string): Promise<DineInBooking> {
    const res = await axios.post(`/restaurant/bookings/${id}/accept`);
    return unwrap<DineInBooking>(res.data);
  },

  async reject(id: string, reason: string): Promise<DineInBooking> {
    const res = await axios.post(`/restaurant/bookings/${id}/reject`, {
      reason,
    });
    return unwrap<DineInBooking>(res.data);
  },

  async complete(id: string): Promise<DineInBooking> {
    const res = await axios.post(`/restaurant/bookings/${id}/complete`);
    return unwrap<DineInBooking>(res.data);
  },

  async markNoShow(id: string): Promise<DineInBooking> {
    const res = await axios.post(`/restaurant/bookings/${id}/no-show`);
    return unwrap<DineInBooking>(res.data);
  },
};

export default bookingApi;