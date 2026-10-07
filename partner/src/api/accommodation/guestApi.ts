import axios, { unwrap, unwrapList } from "../axios";
import type { Guest, Paginated, ListParams } from "../../types";

const guestApi = {
  async list(
    params?: ListParams & { booking?: string }
  ): Promise<Paginated<Guest>> {
    const res = await axios.get("/accommodation/guests", { params });
    return unwrapList<Guest>(res.data);
  },

  async details(id: string): Promise<Guest> {
    const res = await axios.get(`/accommodation/guests/${id}`);
    return unwrap<Guest>(res.data);
  },

  async create(payload: Partial<Guest>): Promise<Guest> {
    const res = await axios.post("/accommodation/guests", payload);
    return unwrap<Guest>(res.data);
  },

  async update(id: string, payload: Partial<Guest>): Promise<Guest> {
    const res = await axios.patch(`/accommodation/guests/${id}`, payload);
    return unwrap<Guest>(res.data);
  },

  async remove(id: string): Promise<void> {
    await axios.delete(`/accommodation/guests/${id}`);
  },
};

export default guestApi;