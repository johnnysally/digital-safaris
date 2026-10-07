import axios from "./axios";
import type { SitePayload, LegalDocument } from "../types";

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
};

export default publicApi;