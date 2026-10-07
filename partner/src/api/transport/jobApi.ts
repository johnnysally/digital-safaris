import axios, { unwrap, unwrapList } from "../axios";
import type { DeliveryJob, Paginated, ListParams } from "../../types";

const jobApi = {
  async available(): Promise<DeliveryJob[]> {
    const res = await axios.get("/transport/jobs/available");
    return unwrap<DeliveryJob[]>(res.data);
  },

  async mine(params?: ListParams): Promise<Paginated<DeliveryJob>> {
    const res = await axios.get("/transport/jobs/mine", { params });
    return unwrapList<DeliveryJob>(res.data);
  },

  async details(id: string): Promise<DeliveryJob> {
    const res = await axios.get(`/transport/jobs/${id}`);
    return unwrap<DeliveryJob>(res.data);
  },

  async accept(id: string): Promise<DeliveryJob> {
    const res = await axios.post(`/transport/jobs/${id}/accept`);
    return unwrap<DeliveryJob>(res.data);
  },

  async pickedUp(id: string): Promise<DeliveryJob> {
    const res = await axios.post(`/transport/jobs/${id}/picked-up`);
    return unwrap<DeliveryJob>(res.data);
  },

  async delivered(id: string): Promise<DeliveryJob> {
    const res = await axios.post(`/transport/jobs/${id}/delivered`);
    return unwrap<DeliveryJob>(res.data);
  },

  async cancel(id: string, reason: string): Promise<DeliveryJob> {
    const res = await axios.post(`/transport/jobs/${id}/cancel`, {
      reason,
    });
    return unwrap<DeliveryJob>(res.data);
  },
};

export default jobApi;