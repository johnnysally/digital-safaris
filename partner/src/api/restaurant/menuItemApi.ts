import axios, { unwrap } from "../axios";
import type { MenuItem } from "../../types";

interface ListParams {
  menu?: string;
  status?: string;
}

const menuItemApi = {
  async list(params?: ListParams): Promise<MenuItem[]> {
    const res = await axios.get("/restaurant/menu-items", { params });
    return unwrap<MenuItem[]>(res.data);
  },

  async create(payload: Partial<MenuItem>): Promise<MenuItem> {
    const res = await axios.post("/restaurant/menu-items", payload);
    return unwrap<MenuItem>(res.data);
  },

  async update(
    id: string,
    payload: Partial<MenuItem>
  ): Promise<MenuItem> {
    const res = await axios.patch(`/restaurant/menu-items/${id}`, payload);
    return unwrap<MenuItem>(res.data);
  },

  async remove(id: string): Promise<void> {
    await axios.delete(`/restaurant/menu-items/${id}`);
  },

  async toggleAvailability(
    id: string
  ): Promise<{ isAvailable: boolean }> {
    const res = await axios.post(
      `/restaurant/menu-items/${id}/toggle-availability`
    );
    return unwrap<{ isAvailable: boolean }>(res.data);
  },
};

export default menuItemApi;