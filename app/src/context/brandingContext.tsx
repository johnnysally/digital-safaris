import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { publicApi } from "../api";

interface Branding {
  logo?: string | null;
  logoUrl?: string | null;
  favicon?: string | null;
  emailHeaderLogo?: string | null;
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;
  metaTitle?: string;
  metaDescription?: string;
}

interface BrandingContextValue {
  branding: Branding;
  loading: boolean;
  refresh: () => Promise<void>;
  setBranding: (branding: Branding) => void;
}

const DEFAULT_BRANDING: Branding = {
  logo: null,
  logoUrl: null,
  favicon: "/logo.svg",
  emailHeaderLogo: null,
  primaryColor: "#1A1F2E",
  secondaryColor: "#C9A063",
  fontFamily: "Montserrat",
  metaTitle: "Digital Safaris",
  metaDescription: "Your concierge, reimagined.",
};

const BrandingContext = createContext<BrandingContextValue | undefined>(
  undefined
);

const hexToRgbTriplet = (hex: string): string | null => {
  const cleaned = String(hex).replace("#", "").trim();
  const expanded =
    cleaned.length === 3
      ? cleaned.split("").map((c) => c + c).join("")
      : cleaned;
  if (!/^[0-9a-fA-F]{6}$/.test(expanded)) return null;
  const r = parseInt(expanded.slice(0, 2), 16);
  const g = parseInt(expanded.slice(2, 4), 16);
  const b = parseInt(expanded.slice(4, 6), 16);
  return `${r} ${g} ${b}`;
};

const applyBranding = (branding: Branding) => {
  const root = document.documentElement;

  const primary = branding.primaryColor
    ? hexToRgbTriplet(branding.primaryColor)
    : null;
  const secondary = branding.secondaryColor
    ? hexToRgbTriplet(branding.secondaryColor)
    : null;

  if (primary) root.style.setProperty("--ds-primary", primary);
  if (secondary) root.style.setProperty("--ds-secondary", secondary);
  if (branding.fontFamily)
    root.style.setProperty("--ds-font", branding.fontFamily);

  const logo = branding.logoUrl || branding.logo;
  if (logo) root.style.setProperty("--ds-logo", `url("${logo}")`);

  const favicon = branding.favicon || "/logo.svg";
  root.style.setProperty("--ds-favicon", `url("${favicon}")`);

  let link = document.querySelector(
    "link[rel='icon']"
  ) as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }
  link.href = favicon;

  if (branding.metaTitle) document.title = branding.metaTitle;

  const metaDesc = document.querySelector(
    "meta[name='description']"
  ) as HTMLMetaElement | null;
  if (metaDesc && branding.metaDescription) {
    metaDesc.content = branding.metaDescription;
  }
};

export function BrandingProvider({ children }: { children: ReactNode }) {
  const [branding, setBrandingState] = useState<Branding>(DEFAULT_BRANDING);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await publicApi.site();
      const fromSite = (data as { branding?: Branding } | undefined)?.branding;
      const merged: Branding = { ...DEFAULT_BRANDING, ...(fromSite || {}) };
      setBrandingState(merged);
      applyBranding(merged);
    } catch {
      setBrandingState(DEFAULT_BRANDING);
      applyBranding(DEFAULT_BRANDING);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const setBranding = useCallback((next: Branding) => {
    const merged: Branding = { ...DEFAULT_BRANDING, ...next };
    setBrandingState(merged);
    applyBranding(merged);
  }, []);

  const value = useMemo<BrandingContextValue>(
    () => ({ branding, loading, refresh, setBranding }),
    [branding, loading, refresh, setBranding]
  );

  return (
    <BrandingContext.Provider value={value}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding(): BrandingContextValue {
  const ctx = useContext(BrandingContext);
  if (!ctx) throw new Error("useBranding must be used within <BrandingProvider>");
  return ctx;
}

export default BrandingContext;