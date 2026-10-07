import { api } from "./axios";
import type { SiteConfig } from "../types";

export const getSiteConfig = async (): Promise<SiteConfig> => {
  const res = await api.get("/public/site");
  const data = res.data?.data ?? res.data;

  const branding = data.branding || {};
  const general = data.general || {};
  const paymentMethods = data.paymentMethods || [];
  const locations = data.locations || [];

  const config: SiteConfig = {
    site_name: general.appName || "Digital Safaris",
    site_tagline: "Your journey. One platform.",
    site_description:
      branding.metaDescription ||
      "DigitalSafaris connects accommodation, food, transportation, and experiences through one digital platform across Kenya.",
    support_email: general.supportEmail || null,
    support_phone: general.supportPhone || null,
    whatsapp_number: general.supportPhone || null,
    app_links: {
      customer: general.clientUrl || null,
      partner_landing: general.partnerUrl || null,
      transport_partner: null,
      restaurant_partner: null,
      accommodation_partner: null,
    },
    social_links: {
      instagram: null,
      tiktok: null,
      facebook: null,
      linkedin: null,
      x: null,
      youtube: null,
    },
    ai_chat: {
      enabled: true,
      name: "DigitalSafaris Concierge",
      greeting:
        "Jambo! Welcome to DigitalSafaris. How can I help you plan your journey or partner your business today?",
      color: "#c47c2b",
    },
    site_logo: branding.logoUrl || branding.logo || "/logo.png",
    payment_methods: paymentMethods,
    locations,
  };

  return config;
};

export const sendContact = async (data: {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
}) => {
  const res = await api.post("/public/contact", data);
  return res.data;
};

export const sendAiChat = async (message: string) => {
  const res = await api.post("/public/ai-concierge/chat", { message });
  const body = res.data?.data ?? res.data;
  return { reply: body.reply, provider: body.provider, model: body.model };
};