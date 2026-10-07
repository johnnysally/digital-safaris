import axios, { unwrap } from "../axios";
import type { Room } from "../../types";

const roomApi = {
  async list(params?: {
    property?: string;
    status?: string;
  }): Promise<Room[]> {
    const res = await axios.get("/accommodation/rooms", { params });
    return unwrap<Room[]>(res.data);
  },

  async details(id: string): Promise<Room> {
    const res = await axios.get(`/accommodation/rooms/${id}`);
    return unwrap<Room>(res.data);
  },

  async create(payload: Partial<Room>): Promise<Room> {
    const res = await axios.post("/accommodation/rooms", payload);
    return unwrap<Room>(res.data);
  },

  async update(id: string, payload: Partial<Room>): Promise<Room> {
    const res = await axios.patch(`/accommodation/rooms/${id}`, payload);
    return unwrap<Room>(res.data);
  },

  async remove(id: string): Promise<void> {
    await axios.delete(`/accommodation/rooms/${id}`);
  },
};

export default roomApi;