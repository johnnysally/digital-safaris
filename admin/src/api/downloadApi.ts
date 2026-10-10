import axios, { unwrap } from "./axios";
import type { DownloadItem } from "../types";

interface ListParams {
  platform?: string;
  available?: "true" | "false";
  search?: string;
}

const downloadApi = {
  async list(params?: ListParams): Promise<DownloadItem[]> {
    const res = await axios.get("/admin/downloads", { params });
    const body = unwrap<DownloadItem[] | { items: DownloadItem[] }>(res.data);
    if (Array.isArray(body)) return body;
    return (body as { items: DownloadItem[] }).items ?? [];
  },

  async details(id: string): Promise<DownloadItem> {
    const res = await axios.get(`/admin/downloads/${id}`);
    return unwrap<DownloadItem>(res.data);
  },

  async create(payload: Partial<DownloadItem>): Promise<DownloadItem> {
    const res = await axios.post("/admin/downloads", payload);
    return unwrap<DownloadItem>(res.data);
  },

  async update(
    id: string,
    payload: Partial<DownloadItem>
  ): Promise<DownloadItem> {
    const res = await axios.patch(`/admin/downloads/${id}`, payload);
    return unwrap<DownloadItem>(res.data);
  },

  async remove(id: string): Promise<void> {
    await axios.delete(`/admin/downloads/${id}`);
  },

  async toggleAvailable(
    id: string
  ): Promise<{ available: boolean }> {
    const res = await axios.post(`/admin/downloads/${id}/toggle-available`);
    return unwrap<{ available: boolean }>(res.data);
  },
};

export default downloadApi;