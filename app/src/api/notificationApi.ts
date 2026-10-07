import axios, { unwrap, unwrapList } from "./axios";
import type { Notification, Paginated, ListParams } from "../types";

const notificationApi = {
  async list(params?: ListParams): Promise<Paginated<Notification>> {
    const res = await axios.get("/customer/notifications", { params });
    return unwrapList<Notification>(res.data);
  },

  async unreadCount(): Promise<{ count: number }> {
    const res = await axios.get("/customer/notifications/unread-count");
    return unwrap<{ count: number }>(res.data);
  },

  async markRead(id: string): Promise<Notification> {
    const res = await axios.post(`/customer/notifications/${id}/read`);
    return unwrap<Notification>(res.data);
  },

  async markAllRead(): Promise<void> {
    await axios.post("/customer/notifications/read-all");
  },

  async remove(id: string): Promise<void> {
    await axios.delete(`/customer/notifications/${id}`);
  },
};

export default notificationApi;