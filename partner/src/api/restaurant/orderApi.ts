import axios, { unwrap, unwrapList } from "../axios";
import type {
  Order,
  DeliveryJob,
  Paginated,
  ListParams,
} from "../../types";

const orderApi = {
  async list(params?: ListParams): Promise<Paginated<Order>> {
    const res = await axios.get("/restaurant/orders", { params });
    return unwrapList<Order>(res.data);
  },

  async details(id: string): Promise<Order> {
    const res = await axios.get(`/restaurant/orders/${id}`);
    return unwrap<Order>(res.data);
  },

  async accept(id: string): Promise<Order> {
    const res = await axios.post(`/restaurant/orders/${id}/accept`);
    return unwrap<Order>(res.data);
  },

  async reject(id: string, reason: string): Promise<Order> {
    const res = await axios.post(`/restaurant/orders/${id}/reject`, {
      reason,
    });
    return unwrap<Order>(res.data);
  },

  async markPreparing(id: string): Promise<Order> {
    const res = await axios.post(`/restaurant/orders/${id}/preparing`);
    return unwrap<Order>(res.data);
  },

  async markReady(id: string): Promise<Order> {
    const res = await axios.post(`/restaurant/orders/${id}/ready`);
    return unwrap<Order>(res.data);
  },

  async requestTransport(id: string): Promise<DeliveryJob> {
    const res = await axios.post(
      `/restaurant/orders/${id}/request-transport`
    );
    return unwrap<DeliveryJob>(res.data);
  },

  async markManualDelivery(id: string): Promise<Order> {
    const res = await axios.post(
      `/restaurant/orders/${id}/manual-delivery`
    );
    return unwrap<Order>(res.data);
  },

  async markDelivered(id: string): Promise<Order> {
    const res = await axios.post(`/restaurant/orders/${id}/delivered`);
    return unwrap<Order>(res.data);
  },
};

export default orderApi;