import axios, { unwrap } from "./axios";
import type { PublicDownload } from "../types";

const downloadApi = {
  async list(params?: { platform?: string }): Promise<PublicDownload[]> {
    const res = await axios.get("/public/downloads", {
      params: { platform: "windows", ...params },
    });
    return unwrap<PublicDownload[]>(res.data);
  },

  async details(id: string): Promise<PublicDownload> {
    const res = await axios.get(`/public/downloads/${id}`);
    return unwrap<PublicDownload>(res.data);
  },

  /** Convenience helpers */
  async windows(): Promise<PublicDownload[]> {
    return downloadApi.list({ platform: "windows" });
  },

  async latestWindows(): Promise<PublicDownload | null> {
    const items = await downloadApi.windows();
    if (!items.length) return null;
    return items
      .slice()
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0];
  },
};

export default downloadApi;