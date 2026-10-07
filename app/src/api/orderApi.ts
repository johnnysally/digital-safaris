import axios, { unwrap, unwrapList } from "./axios";
import type { Order, Paginated, ListParams } from "../types";

const orderApi = {
  async create(payload: Record<string, unknown>): Promise<Order> {
    const res = await axios.post("/customer/orders", payload);
    return unwrap<Order>(res.data);
  },

  async list(params?: ListParams): Promise<Paginated<Order>> {
    const res = await axios.get("/customer/orders", { params });
    return unwrapList<Order>(res.data);
  },

  async details(id: string): Promise<Order> {
    const res = await axios.get(`/customer/orders/${id}`);
    return unwrap<Order>(res.data);
  },

  async cancel(id: string, reason?: string): Promise<Order> {
    const res = await axios.post(`/customer/orders/${id}/cancel`, { reason });
    return unwrap<Order>(res.data);
  },

  async reorder(id: string): Promise<Order> {
    const res = await axios.post(`/customer/orders/${id}/reorder`);
    return unwrap<Order>(res.data);
  },
};

export default orderApi;