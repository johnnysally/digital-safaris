import axios from "./axios";
import type {
  SitePayload,
  LegalDocument,
  PublicDownload,
  DownloadPlatform,
} from "../types";

const publicApi = {
  async site(): Promise<SitePayload> {
    const res = await axios.get("/public/site");
    return res.data?.data ?? res.data;
  },

  async branding(): Promise<Record<string, unknown>> {
    const res = await axios.get("/public/branding");
    return res.data?.data ?? res.data;
  },

  async legals(): Promise<LegalDocument[]> {
    const res = await axios.get("/public/legals");
    return res.data?.data ?? res.data;
  },

  async legal(type: "terms" | "privacy" | "cookies"): Promise<LegalDocument> {
    const res = await axios.get(`/public/legals/${type}`);
    return res.data?.data ?? res.data;
  },

  async verifyEmail(token: string): Promise<{ customerId?: string }> {
    const res = await axios.post("/public/register/verify-email", { token });
    return res.data?.data ?? res.data;
  },

  async resendVerification(email: string): Promise<void> {
    await axios.post("/public/register/resend-verification", { email });
  },

  async downloads(): Promise<PublicDownload[]> {
    const payload = await publicApi.site();
    const raw = (payload as { downloads?: unknown }).downloads;
    if (!Array.isArray(raw)) return [];
    return raw.map((d) => {
      const item = d as Record<string, unknown>;
      return {
        _id: String(item._id ?? ""),
        name: String(item.name ?? ""),
        platform: (item.platform as DownloadPlatform) ?? "other",
        architecture: String(item.architecture ?? ""),
        version: String(item.version ?? ""),
        size: String(item.size ?? ""),
        url: String(item.url ?? ""),
        minimumOs: (item.minimumOs as string | null) ?? null,
        checksum: (item.checksum as string | null) ?? null,
        releaseNotes: (item.releaseNotes as string | null) ?? null,
        createdAt: String(item.createdAt ?? ""),
      };
    });
  },

  async latestAndroidApk(): Promise<PublicDownload | null> {
    const items = (await publicApi.downloads()).filter(
      (d) => d.platform === "android"
    );
    if (!items.length) return null;
    const apk = items.find((d) => d.url.toLowerCase().endsWith(".apk"));
    if (apk) return apk;
    return items
      .slice()
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0];
  },

  /**
   * Public website/app base URL, sourced from /public/site.
   * Order: general.websiteUrl → general.clientUrl → empty.
   */
  async publicAppUrl(): Promise<string> {
    const payload = await publicApi.site();
    const general =
      (payload as { general?: { websiteUrl?: string; clientUrl?: string } })
        .general ?? {};
    return (general.websiteUrl || general.clientUrl || "").replace(/\/+$/, "");
  },
};

export default publicApi;