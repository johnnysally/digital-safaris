import axios, { unwrap, unwrapList } from "../axios";
import type { Booking, Paginated, ListParams } from "../../types";

export interface AvailableRoomUnit {
  _id: string;
  number: string;
  floor?: string | null;
  status: "active" | "maintenance" | "blocked";
  isCurrent: boolean;
}

const bookingApi = {
  async list(params?: ListParams): Promise<Paginated<Booking>> {
    const res = await axios.get("/accommodation/bookings", { params });
    return unwrapList<Booking>(res.data);
  },

  async details(
    id: string,
  ): Promise<{ booking: Booking; guests: unknown[] }> {
    const res = await axios.get(`/accommodation/bookings/${id}`);
    return unwrap<{ booking: Booking; guests: unknown[] }>(res.data);
  },

  async confirm(id: string): Promise<Booking> {
    const res = await axios.post(`/accommodation/bookings/${id}/confirm`);
    return unwrap<Booking>(res.data);
  },

  async reject(id: string, reason: string): Promise<Booking> {
    const res = await axios.post(`/accommodation/bookings/${id}/reject`, {
      reason,
    });
    return unwrap<Booking>(res.data);
  },

  async checkIn(id: string): Promise<Booking> {
    const res = await axios.post(`/accommodation/bookings/${id}/check-in`);
    return unwrap<Booking>(res.data);
  },

  async checkOut(id: string): Promise<Booking> {
    const res = await axios.post(`/accommodation/bookings/${id}/check-out`);
    return unwrap<Booking>(res.data);
  },

  async markNoShow(id: string): Promise<Booking> {
    const res = await axios.post(`/accommodation/bookings/${id}/no-show`);
    return unwrap<Booking>(res.data);
  },

  async availableUnits(bookingId: string): Promise<AvailableRoomUnit[]> {
    const res = await axios.get(
      `/accommodation/bookings/${bookingId}/available-units`,
    );
    return unwrap<AvailableRoomUnit[]>(res.data);
  },

  async assignRoom(
    bookingId: string,
    roomUnitId: string,
  ): Promise<{
    bookingId: string;
    roomUnitId: string;
    roomNumber: string;
    floor?: string | null;
  }> {
    const res = await axios.post(
      `/accommodation/bookings/${bookingId}/assign-room`,
      { roomUnitId },
    );
    return unwrap(res.data);
  },

  async unassignRoom(bookingId: string): Promise<void> {
    await axios.post(`/accommodation/bookings/${bookingId}/unassign-room`);
  },
};

export default bookingApi;