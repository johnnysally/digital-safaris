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
  logoAppearance?: {
    maxWidth: number;
    maxHeight: number;
    fit: "contain" | "cover";
    padding: number;
    borderRadius: number;
  };
  faviconAppearance?: {
    fit: "contain" | "cover";
    padding: number;
    borderRadius: number;
  };
  emailHeaderLogo?: string | null;
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
  favicon: "/favicon.png",
  emailHeaderLogo: null,
  fontFamily: "Montserrat",
  metaTitle: "Digital Safaris",
  metaDescription: "Your concierge, reimagined.",
};

let faviconRevision = 0;

async function styledFaviconUrl(src: string, appearance?: Branding["faviconAppearance"]) {
  if (!appearance) return src;
  const image = new Image();
  if (/^https?:\/\//i.test(src)) image.crossOrigin = "anonymous";
  image.src = src;
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("Favicon image could not be loaded"));
  });

  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is unavailable for favicon styling");

  const radius = Math.max(0, Math.min(32, appearance.borderRadius));
  context.beginPath();
  context.roundRect(0, 0, 64, 64, radius);
  context.clip();
  const padding = Math.max(0, Math.min(24, appearance.padding));
  const available = 64 - padding * 2;
  const scale = appearance.fit === "cover"
    ? Math.max(available / image.naturalWidth, available / image.naturalHeight)
    : Math.min(available / image.naturalWidth, available / image.naturalHeight);
  const width = image.naturalWidth * scale;
  const height = image.naturalHeight * scale;
  context.drawImage(image, (64 - width) / 2, (64 - height) / 2, width, height);
  return canvas.toDataURL("image/png");
}

const BrandingContext = createContext<BrandingContextValue | undefined>(
  undefined
);

const applyBranding = (branding: Branding) => {
  const root = document.documentElement;

  if (branding.fontFamily)
    root.style.setProperty("--ds-font", branding.fontFamily);

  const logo = branding.logoUrl || branding.logo;
  if (logo) root.style.setProperty("--ds-logo", `url("${logo}")`);

  const favicon = branding.favicon || "/favicon.png";
  root.style.setProperty("--ds-favicon", `url("${favicon}")`);

  let link = document.querySelector(
    "link[rel='icon']"
  ) as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }
  const revision = ++faviconRevision;
  void styledFaviconUrl(favicon, branding.faviconAppearance)
    .then((styledUrl) => {
      if (revision === faviconRevision) link.href = styledUrl;
    })
    .catch((error: unknown) => {
      console.error("Could not apply favicon appearance settings", error);
      if (revision === faviconRevision) link.href = favicon;
    });

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