import axios, { unwrap, unwrapList } from "./axios";
import type { Review, Paginated, ListParams } from "../types";

const reviewApi = {
  async create(payload: Record<string, unknown>): Promise<Review> {
    const res = await axios.post("/customer/reviews", payload);
    return unwrap<Review>(res.data);
  },

  async list(params?: ListParams): Promise<Paginated<Review>> {
    const res = await axios.get("/customer/reviews", { params });
    return unwrapList<Review>(res.data);
  },

  async listForTarget(params: {
    targetType: string;
    targetId: string;
    page?: number;
    limit?: number;
  }): Promise<Paginated<Review>> {
    const res = await axios.get("/customer/reviews/target", { params });
    return unwrapList<Review>(res.data);
  },

  async update(id: string, payload: Partial<Review>): Promise<Review> {
    const res = await axios.patch(`/customer/reviews/${id}`, payload);
    return unwrap<Review>(res.data);
  },

  async remove(id: string): Promise<void> {
    await axios.delete(`/customer/reviews/${id}`);
  },
};

export default reviewApi;