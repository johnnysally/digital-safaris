import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import brandingApi from "../api/brandingApi";
import type { Branding, Hex } from "../types";

interface BrandingContextValue {
  branding: Branding | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  setBranding: (branding: Branding | null) => void;
}

const BrandingContext = createContext<BrandingContextValue | undefined>(
  undefined
);

const DEFAULT_BRANDING: Branding = {
  logo: "/logo.svg",
  logoUrl: "/logo.svg",
  favicon: "/favicon.svg",
  emailHeaderLogo: "/logo.svg",
  primaryColor: "#1A1F2E" as Hex,
  secondaryColor: "#C9A063" as Hex,
  fontFamily: "Montserrat",
  metaTitle: "Digital Safaris — Admin",
  metaDescription: "Internal control center for the Digital Safaris platform",
};

function hexToRgbTriplet(hex: string): string | null {
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
}

function applyBranding(branding: Branding) {
  const root = document.documentElement;

  const primary = hexToRgbTriplet(branding.primaryColor);
  const secondary = hexToRgbTriplet(branding.secondaryColor);

  if (primary) root.style.setProperty("--ds-primary", primary);
  if (secondary) root.style.setProperty("--ds-secondary", secondary);
  if (branding.fontFamily)
    root.style.setProperty("--ds-font", branding.fontFamily);

  const logo = branding.logoUrl || branding.logo;
  if (logo) root.style.setProperty("--ds-logo", `url("${logo}")`);

  if (branding.favicon) {
    root.style.setProperty("--ds-favicon", `url("${branding.favicon}")`);

    let link = document.querySelector(
      "link[rel='icon']"
    ) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = branding.favicon;
  }

  if (branding.metaTitle) document.title = branding.metaTitle;

  const metaDesc = document.querySelector(
    "meta[name='description']"
  ) as HTMLMetaElement | null;
  if (metaDesc && branding.metaDescription) {
    metaDesc.content = branding.metaDescription;
  }
}

export function BrandingProvider({ children }: { children: ReactNode }) {
  const [branding, setBranding] = useState<Branding | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await brandingApi.getPublic();
      const merged: Branding = { ...DEFAULT_BRANDING, ...data };
      setBranding(merged);
      applyBranding(merged);
    } catch {
      setBranding(DEFAULT_BRANDING);
      applyBranding(DEFAULT_BRANDING);
      setError("Using default branding");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const setBrandingPublic = useCallback((next: Branding | null) => {
    const merged = next ? { ...DEFAULT_BRANDING, ...next } : DEFAULT_BRANDING;
    setBranding(merged);
    applyBranding(merged);
  }, []);

  const value = useMemo<BrandingContextValue>(
    () => ({
      branding,
      loading,
      error,
      refresh,
      setBranding: setBrandingPublic,
    }),
    [branding, loading, error, refresh, setBrandingPublic]
  );

  return (
    <BrandingContext.Provider value={value}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding(): BrandingContextValue {
  const ctx = useContext(BrandingContext);
  if (!ctx)
    throw new Error("useBranding must be used within <BrandingProvider>");
  return ctx;
}

export default BrandingContext;