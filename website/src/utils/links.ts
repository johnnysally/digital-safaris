import type { SiteConfig } from "../types";

export const LINKS = {
  getCustomerUrl: (config?: Pick<SiteConfig, "app_links"> | null) => {
    const baseUrl = config?.app_links?.customer;
    return baseUrl || "/get-started";
  },

  getPartnerUrl: (config?: Pick<SiteConfig, "app_links"> | null) => {
    const baseUrl = config?.app_links?.partner_landing;
    if (!baseUrl) return "/partner-registration";
    if (baseUrl.includes("localhost") || baseUrl.includes("127.0.0.1")) {
      return baseUrl;
    }
    return baseUrl.replace(/\/register$/, "");
  },

  getPartnerPortalUrl: (config?: Pick<SiteConfig, "app_links"> | null) =>
    LINKS.getPartnerUrl(config),

  getPartnerRegistrationUrl: () => "/partner-registration",

  getServiceUrl: (
    config: Pick<SiteConfig, "app_links"> | null | undefined,
    serviceId?: string
  ) => {
    const baseUrl = LINKS.getCustomerUrl(config)?.replace(/\/$/, "");
    if (!serviceId) return baseUrl || "/get-started";
    return baseUrl ? `${baseUrl}/${serviceId}` : "/get-started";
  },

  getWhatsAppUrl: (config?: Pick<SiteConfig, "whatsapp_number"> | null) => {
    const number = config?.whatsapp_number?.replace(/\D/g, "");
    return number ? `https://wa.me/${number}` : undefined;
  },
};