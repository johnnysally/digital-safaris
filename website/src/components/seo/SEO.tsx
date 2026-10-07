import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { SERVICES_DATA } from "../../utils/constants";
import { useSiteConfig } from "../../context/SiteConfigContext";

const defaultDescription = "DigitalSafaris is Kenya's digital travel platform, bringing accommodation, dining, transport, and local experiences together in one place. Plan and enjoy your journey with DigitalSafaris.";

const pageMetadata: Record<string, { title: string; description: string }> = {
  "/": { title: "DigitalSafaris | Digital Travel Platform in Kenya", description: defaultDescription },
  "/about": { title: "About DigitalSafaris | Connecting African Travel", description: "Learn how DigitalSafaris connects travelers with trusted hospitality and travel businesses across Kenya." },
  "/how-it-works": { title: "How DigitalSafaris Works | Travel and Hospitality in Kenya", description: "See how travelers discover services and how Kenyan businesses join the DigitalSafaris platform." },
  "/services": { title: "Travel Services in Kenya | DigitalSafaris", description: "Explore accommodation, food, transport, and local experiences through DigitalSafaris." },
  "/businesses": { title: "Become a DigitalSafaris Partner", description: "Grow your hotel, restaurant, transport, or experience business by joining DigitalSafaris." },
  "/faq": { title: "DigitalSafaris FAQs", description: "Find answers about DigitalSafaris bookings, services, partner registration, and availability in Kenya." },
  "/contact": { title: "Contact DigitalSafaris", description: "Contact the DigitalSafaris support team about travel services, bookings, or becoming a business partner." },
  "/get-started": { title: "Get Started with DigitalSafaris", description: "Choose your path and start using the DigitalSafaris customer or partner platform." },
  "/partner-registration": { title: "Register as a DigitalSafaris Partner", description: "Apply to join DigitalSafaris and connect your hospitality business with travelers across Kenya." },
  "/privacy-policy": { title: "Privacy Policy | DigitalSafaris", description: "Read the DigitalSafaris privacy policy and learn how personal information is handled." },
  "/terms-of-service": { title: "Terms of Service | DigitalSafaris", description: "Read the DigitalSafaris terms of service." },
};

const pageLabels: Record<string, string> = {
  about: "About",
  "how-it-works": "How It Works",
  services: "Services",
  businesses: "Businesses",
  faq: "FAQ",
  contact: "Contact",
  "get-started": "Get Started",
  "partner-registration": "Partner Registration",
  "privacy-policy": "Privacy Policy",
  "terms-of-service": "Terms of Service",
};

const setMeta = (name: string, content: string, attribute = "name") => {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${name}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, name);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
};

const setLink = (rel: string, href: string) => {
  let element = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!element) {
    element = document.createElement("link");
    element.rel = rel;
    document.head.appendChild(element);
  }
  element.href = href;
};

export const SEO: React.FC = () => {
  const { pathname } = useLocation();
  const config = useSiteConfig();
  const type = pathname.startsWith("/services/") ? pathname.split("/")[2] : undefined;
  const service = type ? SERVICES_DATA.find((item) => item.id === type) : undefined;
  const metadata = service
    ? { title: `${service.badge} in Kenya | DigitalSafaris`, description: service.description }
    : pageMetadata[pathname] || { title: "Page Not Found | DigitalSafaris", description: defaultDescription };
  const siteName = config?.site_name || "DigitalSafaris";
  const canonicalUrl = `${window.location.origin}${pathname}`;

  useEffect(() => {
    document.title = metadata.title;
    setMeta("description", metadata.description);
    setMeta("og:title", metadata.title, "property");
    setMeta("og:description", metadata.description, "property");
    setMeta("og:type", "website", "property");
    setMeta("og:url", canonicalUrl, "property");
    setMeta("og:site_name", siteName, "property");
    setMeta("twitter:card", "summary", "name");
    setMeta("twitter:title", metadata.title);
    setMeta("twitter:description", metadata.description);
    setLink("canonical", canonicalUrl);

    const organization = {
      "@type": "Organization",
      "@id": `${window.location.origin}/#organization`,
      name: siteName,
      alternateName: ["Digital Safaris"],
      description: config?.site_description || defaultDescription,
      url: window.location.origin,
    };
    const mainEntity = service
      ? {
          "@type": "Service",
          name: service.title,
          description: service.description,
          areaServed: { "@type": "Country", name: "Kenya" },
          provider: { "@id": organization["@id"] },
        }
      : organization;
    const pathSegments = pathname.split("/").filter(Boolean);
    const breadcrumbItems = [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: window.location.origin,
      },
      ...pathSegments.map((segment, index) => ({
        "@type": "ListItem",
        position: index + 2,
        name: service && index === pathSegments.length - 1
          ? service.badge
          : pageLabels[segment] || segment,
        item: `${window.location.origin}/${pathSegments.slice(0, index + 1).join("/")}`,
      })),
    ];
    const structuredData = {
      "@context": "https://schema.org",
      "@graph": [
        mainEntity,
        {
          "@type": "WebSite",
          name: siteName,
          alternateName: "Digital Safaris",
          url: window.location.origin,
          description: defaultDescription,
          publisher: { "@id": organization["@id"] },
        },
        ...(pathSegments.length > 0
          ? [{ "@type": "BreadcrumbList", itemListElement: breadcrumbItems }]
          : []),
      ],
    };
    let script = document.head.querySelector<HTMLScriptElement>('script[data-seo="structured-data"]');
    if (!script) {
      script = document.createElement("script");
      script.type = "application/ld+json";
      script.dataset.seo = "structured-data";
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(structuredData);
  }, [canonicalUrl, config, metadata.description, metadata.title, service, siteName]);

  return null;
};