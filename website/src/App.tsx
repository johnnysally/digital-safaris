import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { Navbar } from "./components/layout/Navbar";
import { Footer } from "./components/layout/Footer";
import { ChatWidget } from "./components/chat/ChatWidget";

import { HomePage } from "./pages/HomePage";
import { ServicesPage } from "./pages/ServicesPage";
import { BusinessesPage } from "./pages/BusinessesPage";
import { AboutPage } from "./pages/AboutPage";
import { HowItWorksPage } from "./pages/HowItWorksPage";
import { FAQPage } from "./pages/FAQPage";
import { ContactPage } from "./pages/ContactPage";
import { GetStartedPage } from "./pages/GetStartedPage";
import { PartnerRegistrationPage } from "./pages/PartnerRegistrationPage";
import { ServiceDetailPage } from "./pages/ServiceDetailPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { LegalPage } from "./pages/LegalPage";
import { SiteConfigProvider } from "./context/SiteConfigContext";
import { SEO } from "./components/seo/SEO";

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
          </main>
          <Footer />
          <ChatWidget />
        </div>
      </SiteConfigProvider>
    </Router>
  );
};

export default App;
