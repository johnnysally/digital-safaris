import axios, { unwrap, unwrapList } from "./axios";
import type { BroadcastRequest, Paginated, ListParams } from "../types";

const broadcastApi = {
  async create(payload: Record<string, unknown>): Promise<BroadcastRequest> {
    const res = await axios.post("/customer/broadcasts", payload);
    return unwrap<BroadcastRequest>(res.data);
  },

  async list(params?: ListParams): Promise<Paginated<BroadcastRequest>> {
    const res = await axios.get("/customer/broadcasts", { params });
    return unwrapList<BroadcastRequest>(res.data);
  },

  async details(id: string): Promise<BroadcastRequest> {
    const res = await axios.get(`/customer/broadcasts/${id}`);
    return unwrap<BroadcastRequest>(res.data);
  },

  async cancel(id: string, reason?: string): Promise<BroadcastRequest> {
    const res = await axios.post(`/customer/broadcasts/${id}/cancel`, { reason });
    return unwrap<BroadcastRequest>(res.data);
  },
};

export default broadcastApi;