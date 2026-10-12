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
import type { Branding } from "../types";

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
  fontFamily: "Montserrat",
  metaTitle: "Digital Safaris — Admin",
  metaDescription: "Internal control center for the Digital Safaris platform",
};

let faviconRevision = 0;

async function createStyledFavicon(
  src: string,
  appearance: Branding["faviconAppearance"]
): Promise<string> {
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

function applyBranding(branding: Branding) {
  const root = document.documentElement;

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
    const revision = ++faviconRevision;
    void createStyledFavicon(branding.favicon, branding.faviconAppearance)
      .then((styledUrl) => {
        if (revision === faviconRevision) link.href = styledUrl;
      })
      .catch((error: unknown) => {
        console.error("Could not apply favicon appearance settings", error);
        if (revision === faviconRevision) link.href = branding.favicon ?? "";
      });
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