import axios, { unwrap } from "./axios";
import type { PublicDownload } from "../types";

const downloadApi = {
  async list(params?: { platform?: string }): Promise<PublicDownload[]> {
    const res = await axios.get("/public/downloads", {
      params: { platform: "android", ...params },
    });
    return unwrap<PublicDownload[]>(res.data);
  },

  async details(id: string): Promise<PublicDownload> {
    const res = await axios.get(`/public/downloads/${id}`);
    return unwrap<PublicDownload>(res.data);
  },

  async android(): Promise<PublicDownload[]> {
    return downloadApi.list({ platform: "android" });
  },

  async latestApk(): Promise<PublicDownload | null> {
    const items = await downloadApi.android();
    if (!items.length) return null;
    const apk = items.find((d) => d.url.toLowerCase().endsWith(".apk"));
    return apk ?? items[0];
  },

  async latestZip(): Promise<PublicDownload | null> {
    const items = await downloadApi.android();
    return items.find((d) => d.url.toLowerCase().endsWith(".zip")) ?? null;
  },
};

export default downloadApi;