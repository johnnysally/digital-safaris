import axios from "./axios";
import type { Branding } from "../types";

type AnyRecord = Record<string, unknown>;

function isObject(v: unknown): v is AnyRecord {
  return typeof v === "object" && v !== null;
}

function pickString(
  obj: AnyRecord | undefined,
  keys: string[]
): string | undefined {
  if (!obj) return undefined;
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && v.trim()) return v;
  }
  return undefined;
}

function normalizeBranding(raw: unknown): Branding {
  const root = isObject(raw) ? raw : {};
  const data = isObject(root.data) ? (root.data as AnyRecord) : root;

  const brandSrc =
    (isObject(data.branding) ? (data.branding as AnyRecord) : undefined) ??
    (isObject(data.brand) ? (data.brand as AnyRecord) : undefined) ??
    data;

  const generalSrc = isObject(data.general) ? (data.general as AnyRecord) : {};

  const logo =
    pickString(brandSrc, ["logoUrl", "logo", "logoSrc"]) ??
    pickString(generalSrc, ["logoUrl", "logo"]) ??
    "/logo.svg";

  const primary =
    pickString(brandSrc, ["primaryColor", "primary_color", "primary"]) ??
    "#1A1F2E";

  const secondary =
    pickString(brandSrc, ["secondaryColor", "secondary_color", "secondary"]) ??
    "#C9A063";

  return {
    logo: pickString(brandSrc, ["logo", "logoUrl"]) ?? logo,
    logoUrl: logo,
    favicon: pickString(brandSrc, ["favicon"]) ?? "/favicon.svg",
    emailHeaderLogo:
      pickString(brandSrc, ["emailHeaderLogo", "emailLogo"]) ?? logo,
    primaryColor: primary as Branding["primaryColor"],
    secondaryColor: secondary as Branding["secondaryColor"],
    fontFamily: pickString(brandSrc, ["fontFamily", "font"]) ?? "Montserrat",
    metaTitle:
      pickString(brandSrc, ["metaTitle", "title"]) ??
      pickString(generalSrc, ["appName"]) ??
      "Digital Safaris",
    metaDescription:
      pickString(brandSrc, ["metaDescription", "description"]) ?? "",
  };
}

const brandingApi = {
  /** Public — used by BrandingProvider (works without auth, e.g. on Login). */
  async getPublic(): Promise<Branding> {
    const res = await axios.get("/public/site", { skipAuth: true } as never);
    return normalizeBranding(res.data);
  },

  /** Protected — used by the Branding settings page. */
  async get(): Promise<Branding> {
    const res = await axios.get("/admin/branding");
    return normalizeBranding(res.data);
  },

  /** Protected — save branding from the Branding settings page. */
  async update(payload: Partial<Branding>): Promise<Branding> {
    const res = await axios.post("/admin/branding", payload);
    return normalizeBranding(res.data);
  },
};

export default brandingApi;