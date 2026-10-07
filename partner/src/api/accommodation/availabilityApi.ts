import axios, { unwrap } from "../axios";
import type { RoomAvailability } from "../../types";

const availabilityApi = {
  async list(params?: {
    room?: string;
    from?: string;
    to?: string;
  }): Promise<RoomAvailability[]> {
    const res = await axios.get("/accommodation/availability", { params });
    return unwrap<RoomAvailability[]>(res.data);
  },

  async setRange(payload: {
    room: string;
    from: string;
    to: string;
    totalUnits?: number;
    price?: number;
    isBlocked?: boolean;
    blockReason?: string;
  }): Promise<RoomAvailability[]> {
    const res = await axios.post(
      "/accommodation/availability/set-range",
      payload
    );
    return unwrap<RoomAvailability[]>(res.data);
  },

  async blockDates(payload: {
    room: string;
    from: string;
    to: string;
    reason?: string;
  }): Promise<{ count: number }> {
    const res = await axios.post(
      "/accommodation/availability/block",
      payload
    );
    return unwrap<{ count: number }>(res.data);
  },

  async unblockDates(payload: {
    room: string;
    from: string;
    to: string;
  }): Promise<{ modified: number }> {
    const res = await axios.post(
      "/accommodation/availability/unblock",
      payload
    );
    return unwrap<{ modified: number }>(res.data);
  },
};

export default availabilityApi;