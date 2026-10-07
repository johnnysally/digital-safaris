import React, { createContext, useContext, useEffect, useState } from "react";
import { getSiteConfig } from "../api/publicApi";
import type { SiteConfig } from "../types";

const SiteConfigContext = createContext<SiteConfig | null>(null);

export const SiteConfigProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const [config, setConfig] = useState<SiteConfig | null>(null);

  useEffect(() => {
    getSiteConfig()
      .then(setConfig)
      .catch(() => setConfig(null));
  }, []);

  return (
    <SiteConfigContext.Provider value={config}>
      {children}
    </SiteConfigContext.Provider>
  );
};

export const useSiteConfig = () => useContext(SiteConfigContext);