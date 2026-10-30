import React, { lazy, Suspense, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { Navbar } from "./components/layout/Navbar";
import { Footer } from "./components/layout/Footer";
import { ChatWidget } from "./components/chat/ChatWidget";

import { SiteConfigProvider } from "./context/SiteConfigContext";
import { SEO } from "./components/seo/SEO";

const HomePage = lazy(() => import("./pages/HomePage").then(({ HomePage }) => ({ default: HomePage })));
const ServicesPage = lazy(() => import("./pages/ServicesPage").then(({ ServicesPage }) => ({ default: ServicesPage })));
const BusinessesPage = lazy(() => import("./pages/BusinessesPage").then(({ BusinessesPage }) => ({ default: BusinessesPage })));
const AboutPage = lazy(() => import("./pages/AboutPage").then(({ AboutPage }) => ({ default: AboutPage })));
const HowItWorksPage = lazy(() => import("./pages/HowItWorksPage").then(({ HowItWorksPage }) => ({ default: HowItWorksPage })));
const FAQPage = lazy(() => import("./pages/FAQPage").then(({ FAQPage }) => ({ default: FAQPage })));
const ContactPage = lazy(() => import("./pages/ContactPage").then(({ ContactPage }) => ({ default: ContactPage })));
const GetStartedPage = lazy(() => import("./pages/GetStartedPage").then(({ GetStartedPage }) => ({ default: GetStartedPage })));
const PartnerRegistrationPage = lazy(() => import("./pages/PartnerRegistrationPage").then(({ PartnerRegistrationPage }) => ({ default: PartnerRegistrationPage })));
const ServiceDetailPage = lazy(() => import("./pages/ServiceDetailPage").then(({ ServiceDetailPage }) => ({ default: ServiceDetailPage })));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage").then(({ NotFoundPage }) => ({ default: NotFoundPage })));
const LegalPage = lazy(() => import("./pages/LegalPage").then(({ LegalPage }) => ({ default: LegalPage })));

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

export const App: React.FC = () => {
  useEffect(() => {
    if (!import.meta.env.PROD) {
      return;
    }

    const blockKeyboardShortcuts = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const isDevToolsShortcut =
        event.key === "F12" ||
        (event.ctrlKey && event.shiftKey && key === "i") ||
        (event.ctrlKey && event.shiftKey && key === "c") ||
        (event.ctrlKey && key === "u") ||
        (event.ctrlKey && key === "s") ||
        (event.metaKey && key === "s") ||
        (event.metaKey && event.shiftKey && key === "c");

      if (isDevToolsShortcut) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    const blockContextMenu = (event: MouseEvent) => {
      event.preventDefault();
    };

    document.addEventListener("keydown", blockKeyboardShortcuts, { passive: false });
    document.addEventListener("contextmenu", blockContextMenu, { passive: false });

    return () => {
      document.removeEventListener("keydown", blockKeyboardShortcuts);
      document.removeEventListener("contextmenu", blockContextMenu);
    };
  }, []);

  return (
    <Router>
      <SiteConfigProvider>
        <ScrollToTop />
        <SEO />
        <div className="flex flex-col min-h-screen overflow-x-hidden">
          <Navbar />
          <main className="flex-grow overflow-x-hidden">
            <Suspense
              fallback={
                <div className="flex min-h-[50vh] items-center justify-center" role="status">
                  <span className="h-8 w-8 animate-spin rounded-full border-4 border-[#e6dfd5] border-t-[#c47c2b]" />
                  <span className="sr-only">Loading page</span>
                </div>
              }
            >
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/how-it-works" element={<HowItWorksPage />} />
                <Route path="/services" element={<ServicesPage />} />
                <Route path="/services/:type" element={<ServiceDetailPage />} />
                <Route path="/businesses" element={<BusinessesPage />} />
                <Route path="/faq" element={<FAQPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/get-started" element={<GetStartedPage />} />
                <Route path="/partner-registration" element={<PartnerRegistrationPage />} />
                <Route path="/privacy-policy" element={<LegalPage documentType="privacy-policy" />} />
                <Route path="/terms-of-service" element={<LegalPage documentType="terms-of-service" />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Suspense>
          </main>
          <Footer />
          <ChatWidget />
        </div>
      </SiteConfigProvider>
    </Router>
  );
};

export default App;
