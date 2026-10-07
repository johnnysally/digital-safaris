import axios, { unwrap } from "../axios";
import type { Menu } from "../../types";

const menuApi = {
  async list(): Promise<Menu[]> {
    const res = await axios.get("/restaurant/menus");
    return unwrap<Menu[]>(res.data);
  },

  async create(payload: Partial<Menu>): Promise<Menu> {
    const res = await axios.post("/restaurant/menus", payload);
    return unwrap<Menu>(res.data);
  },

  async update(id: string, payload: Partial<Menu>): Promise<Menu> {
    const res = await axios.patch(`/restaurant/menus/${id}`, payload);
    return unwrap<Menu>(res.data);
  },

  async remove(id: string): Promise<void> {
    await axios.delete(`/restaurant/menus/${id}`);
  },
};

export default menuApi;