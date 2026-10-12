import React, { createContext, useContext, useEffect, useState } from "react";
import { getSiteConfig } from "../api/publicApi";
import type { SiteConfig } from "../types";

async function styledFaviconUrl(
  src: string,
  appearance: SiteConfig["favicon_appearance"]
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

  context.beginPath();
  context.roundRect(0, 0, 64, 64, Math.max(0, Math.min(32, appearance.borderRadius)));
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

const SiteConfigContext = createContext<SiteConfig | null>(null);

export const SiteConfigProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const [config, setConfig] = useState<SiteConfig | null>(null);

  useEffect(() => {
    getSiteConfig()
      .then((nextConfig) => {
        setConfig(nextConfig);
        const favicon = nextConfig.favicon || "/favicon.svg";
        let link = document.querySelector("link[rel='icon']") as HTMLLinkElement | null;
        if (!link) {
          link = document.createElement("link");
          link.rel = "icon";
          document.head.appendChild(link);
        }
        void styledFaviconUrl(favicon, nextConfig.favicon_appearance)
          .then((styled) => { link.href = styled; })
          .catch((error: unknown) => {
            console.error("Could not apply favicon appearance settings", error);
            link.href = favicon;
          });
      })
      .catch(() => setConfig(null));
  }, []);

  return (
    <SiteConfigContext.Provider value={config}>
      {children}
    </SiteConfigContext.Provider>
  );
};

export const useSiteConfig = () => useContext(SiteConfigContext);