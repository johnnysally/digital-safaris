import SystemSetting from "../models/admin/SystemSetting.js";

const TTL_MS = 60_000;

let cache = null;
let cacheAt = 0;

const DEFAULTS = {
  appName: "Digital Safaris",
  websiteUrl: "https://digitalsafaris.co.ke",
  clientUrl: "https://app.digitalsafaris.co.ke",
  partnerUrl: "https://partner.digitalsafaris.co.ke",
  adminUrl: "https://admin.digitalsafaris.co.ke",
  apiUrl: "https://api.digitalsafaris.co.ke",
  supportEmail: "support@digitalsafaris.co.ke",
  supportPhone: "",
  currency: "KES",
  logoUrl: null,
  primaryColor: "#1A1F2E",
  secondaryColor: "#C9A063",
};

const build = (general = {}, branding = {}) => ({
  settings: {
    appName: general.appName || DEFAULTS.appName,
    websiteUrl: general.websiteUrl || DEFAULTS.websiteUrl,
    clientUrl: general.clientUrl || general.appUrl || DEFAULTS.clientUrl,
    partnerUrl: general.partnerUrl || DEFAULTS.partnerUrl,
    adminUrl: general.adminUrl || DEFAULTS.adminUrl,
    apiUrl: general.apiUrl || DEFAULTS.apiUrl,
    supportEmail: general.supportEmail || DEFAULTS.supportEmail,
    supportPhone: general.supportPhone || DEFAULTS.supportPhone,
    currency: general.currency || DEFAULTS.currency,
  },
  branding: {
    logoUrl: branding.logoUrl || general.logoUrl || DEFAULTS.logoUrl,
    primaryColor: branding.primaryColor || DEFAULTS.primaryColor,
    secondaryColor: branding.secondaryColor || DEFAULTS.secondaryColor,
  },
});

export const loadEmailContext = async ({ force = false } = {}) => {
  if (!force && cache && Date.now() - cacheAt < TTL_MS) return cache;

  const rows = await SystemSetting.find({
    key: { $in: ["general", "branding"] },
  })
    .select("key value")
    .lean();

  const map = Object.fromEntries(rows.map((r) => [r.key, r.value || {}]));
  cache = build(map.general, map.branding);
  cacheAt = Date.now();
  return cache;
};

export const invalidateEmailContext = () => {
  cache = null;
  cacheAt = 0;
};