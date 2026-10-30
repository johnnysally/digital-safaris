import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowUpRight, Compass, Menu, X } from "lucide-react";
import { NAV_ITEMS } from "../../utils/constants";
import { useSiteConfig } from "../../context/SiteConfigContext";
import { LINKS } from "../../utils/links";

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const config = useSiteConfig();
  const customerUrl = LINKS.getCustomerUrl(config);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileMenuOpen(false);
    };

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [mobileMenuOpen]);

  const isActive = (path: string) => (
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path)
  );

  const logoStyle = config.site_logo_appearance
    ? {
        height: `${Math.min(64, config.site_logo_appearance.maxHeight)}px`,
        maxWidth: `${config.site_logo_appearance.maxWidth}px`,
        objectFit: config.site_logo_appearance.fit,
        padding: `${config.site_logo_appearance.padding}px`,
        borderRadius: `${config.site_logo_appearance.borderRadius}px`,
      }
    : undefined;

  const renderLogo = () => (
    <img
      src={config.site_logo || "/logo.png"}
      alt="DigitalSafaris"
      onError={(event) => {
        if (event.currentTarget.getAttribute("src") !== "/logo.png") {
          event.currentTarget.src = "/logo.png";
        }
      }}
      className="h-11 w-auto max-w-[160px] object-contain transition-transform duration-300 group-hover:scale-[1.03] sm:h-12"
      style={logoStyle}
    />
  );

  return (
    <header className="sticky top-0 z-50 border-b border-[#e6dfd5] bg-[#f9f7f4]/95 shadow-sm backdrop-blur-xl">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid min-h-[4.25rem] grid-cols-[1fr_auto] items-center gap-x-3 px-0 sm:min-h-[4.75rem] sm:gap-x-4 lg:h-[4.75rem] lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:gap-x-3 lg:py-0 xl:gap-x-5">
          <Link
            to="/"
            className="group col-start-1 row-start-1 flex min-w-0 shrink-0 items-center rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c47c2b] focus-visible:ring-offset-2"
            aria-label="DigitalSafaris home"
          >
            {renderLogo()}
          </Link>

          <nav aria-label="Main navigation" className="col-span-2 row-start-2 hidden items-center justify-center gap-1 border-t border-[#e6dfd5] pt-2 lg:col-span-1 lg:col-start-2 lg:row-start-1 lg:flex lg:gap-0 lg:border-0 lg:pt-0 xl:gap-0.5">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`relative whitespace-nowrap rounded-full px-1.5 py-2 text-[10px] font-bold uppercase tracking-[0.04em] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c47c2b] xl:px-2 xl:text-[11px] xl:tracking-[0.06em] 2xl:px-3 ${
                    active
                      ? "bg-[#191816] text-white shadow-sm"
                      : "text-[#5e5950] hover:bg-[#eae3d9] hover:text-[#191816]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="col-start-2 row-start-1 hidden shrink-0 items-center justify-self-end gap-2 lg:col-start-3 lg:flex">
            <Link
              to="/partner-registration"
              className="hidden items-center justify-center rounded-full border border-[#dcd3c7] px-3 py-2.5 text-[9px] font-bold uppercase tracking-[0.08em] text-[#191816] transition-colors hover:border-[#c47c2b] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c47c2b] 2xl:inline-flex 2xl:px-4 2xl:text-[10px]"
            >
              Become a Partner
            </Link>
            <a
              href={customerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 rounded-full bg-[#c47c2b] px-3 py-2.5 text-[9px] font-bold uppercase tracking-[0.06em] text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-[#b06d20] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c47c2b] focus-visible:ring-offset-2 2xl:gap-2 2xl:px-4 2xl:text-[10px]"
            >
              Start Your Journey
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="col-start-2 row-start-1 inline-flex h-11 w-11 shrink-0 items-center justify-center justify-self-end rounded-xl border border-[#e6dfd5] bg-white/70 text-[#191816] shadow-sm transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c47c2b] lg:hidden"
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation"
          >
            {mobileMenuOpen
              ? <X className="h-5 w-5" aria-hidden="true" />
              : <Menu className="h-5 w-5" aria-hidden="true" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div
            id="mobile-navigation"
            className="mx-auto max-w-7xl border-t border-[#e6dfd5] bg-[#f9f7f4] px-4 py-4 lg:hidden sm:px-6 md:absolute md:right-6 md:top-[calc(100%+0.5rem)] md:z-50 md:w-[min(36rem,calc(100vw-3rem))] md:rounded-2xl md:border md:shadow-xl md:ring-1 md:ring-black/[0.04] lg:static lg:w-auto lg:rounded-none lg:border-0 lg:shadow-none lg:ring-0"
          >
            <div className="mb-3 flex items-center gap-2 px-1 pb-3 md:mb-2 md:pb-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#eae3d9] text-[#c47c2b]">
                <Compass className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#c47c2b]">Explore Kenya</p>
                <p className="text-xs text-[#5e5950]">Your journey, all in one place</p>
              </div>
            </div>

            <nav aria-label="Mobile navigation" className="grid gap-1 md:grid-cols-2">
              {NAV_ITEMS.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={`flex min-h-11 items-center justify-between rounded-xl px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c47c2b] md:min-h-10 ${
                      active
                        ? "bg-[#191816] text-white"
                        : "text-[#403c36] hover:bg-[#eae3d9]"
                    }`}
                  >
                    {item.label}
                    {active && <span className="h-1.5 w-1.5 rounded-full bg-[#f0aa56]" />}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-3 grid gap-2 border-t border-[#e6dfd5] pt-3 sm:grid-cols-2">
              <Link
                to="/partner-registration"
                onClick={() => setMobileMenuOpen(false)}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#dcd3c7] bg-white/60 px-4 text-[10px] font-bold uppercase tracking-[0.1em] text-[#191816] transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c47c2b]"
              >
                Become a Partner
              </Link>
              <a
                href={customerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#c47c2b] px-4 text-[10px] font-bold uppercase tracking-[0.1em] text-white shadow-sm transition-colors hover:bg-[#b06d20] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c47c2b] focus-visible:ring-offset-2"
              >
                Start Your Journey
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
