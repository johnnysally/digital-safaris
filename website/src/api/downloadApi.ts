import axiosClient from "./axios";
import type { ApiEnvelope } from "../types";

export type DownloadPlatform =
  | "windows"
  | "macos"
  | "linux"
  | "android"
  | "ios"
  | "web"
  | "other";

export interface PublicDownload {
  _id: string;
  name: string;
  platform: DownloadPlatform;
  architecture: string;
  version: string;
  size: string;
  url: string;
  minimumOs?: string | null;
  checksum?: string | null;
  releaseNotes?: string | null;
  createdAt: string;
}

function unwrapList<T>(body: unknown): T[] {
  const envelope = body as ApiEnvelope<T[]> | undefined;
  if (envelope && Array.isArray(envelope.data)) return envelope.data;
  if (Array.isArray(body)) return body as T[];
  return [];
}

const downloadApi = {
  /** All available downloads (both platforms). */
  async list(params?: { platform?: DownloadPlatform }): Promise<PublicDownload[]> {
    const res = await axiosClient.get("/public/downloads", { params });
    return unwrapList<PublicDownload>(res.data);
  },

  async details(id: string): Promise<PublicDownload | null> {
    try {
      const res = await axiosClient.get(`/public/downloads/${id}`);
      const envelope = res.data as ApiEnvelope<PublicDownload> | undefined;
      return envelope?.data ?? null;
    } catch {
      return null;
    }
  },

  /** Convenience helpers */
  async windows(): Promise<PublicDownload[]> {
    return downloadApi.list({ platform: "windows" });
  },

  async android(): Promise<PublicDownload[]> {
    return downloadApi.list({ platform: "android" });
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

  async latestApk(): Promise<PublicDownload | null> {
    const items = await downloadApi.android();
    if (!items.length) return null;
    const apk = items.find((d) => d.url.toLowerCase().endsWith(".apk"));
    return apk ?? items[0];
  },
};

export default downloadApi;