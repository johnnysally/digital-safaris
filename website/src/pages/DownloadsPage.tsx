import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  Download,
  Smartphone,
  Monitor,
  HardDrive,
  Clock,
  ShieldCheck,
  Package,
  CheckCircle2,
} from "lucide-react";
import downloadApi, { type PublicDownload } from "../api/downloadApi";
import { useSiteConfig } from "../context/SiteConfigContext";

export const DownloadsPage: React.FC = () => {
  const config = useSiteConfig();

  const [apk, setApk] = useState<PublicDownload | null>(null);
  const [windows, setWindows] = useState<PublicDownload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([downloadApi.latestApk(), downloadApi.latestWindows()])
      .then(([androidBuild, windowsBuild]) => {
        if (cancelled) return;
        setApk(androidBuild);
        setWindows(windowsBuild);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load downloads right now.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="bg-[#f9f7f4] min-h-screen text-[#191816] pt-8 pb-20">
      {/* Hero Header */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-8 pb-14">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#eae3d9] text-[#191816] text-xs font-bold uppercase tracking-wider mb-6">
          <span>DOWNLOAD THE APP</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-4xl mx-auto leading-[1.1]">
          Everything in <br />
          <span className="text-[#c47c2b]">your pocket.</span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-[#5e5950] max-w-2xl mx-auto leading-relaxed">
          Book stays, order food, and plan rides across Kenya — one app for
          travellers on the go, and a desktop companion for partners managing
          their business.
        </p>
      </section>

      {/* Error state */}
      {error && (
        <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
          <div className="rounded-2xl border border-[#a85c52]/30 bg-[#a85c52]/5 p-4 text-sm text-[#a85c52] text-center">
            {error}
          </div>
        </section>
      )}

      {/* Loading */}
      {loading && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#c47c2b] border-t-transparent" />
        </section>
      )}

      {/* Download Cards */}
      {!loading && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* Android / Traveller App */}
            <div className="bg-white rounded-3xl border border-[#e6dfd5] shadow-xs overflow-hidden flex flex-col">
              <div className="bg-gradient-to-br from-[#fff7eb] to-[#f4e2c7] p-8 space-y-4">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#8a5b25]">
                  <Smartphone className="w-3.5 h-3.5" /> For Travellers
                </span>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#191816]">
                    DigitalSafaris for Android
                  </h2>
                  <p className="mt-2 text-sm text-[#5e5950]">
                    Book accommodation, order food, and request rides — all from
                    your phone.
                  </p>
                </div>

                {apk ? (
                  <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-[#78644c] pt-1">
                    <span className="inline-flex items-center gap-1.5">
                      <Package className="h-3.5 w-3.5" /> v{apk.version}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <HardDrive className="h-3.5 w-3.5" /> {apk.size}
                    </span>
                    {apk.minimumOs && (
                      <span className="inline-flex items-center gap-1.5">
                        <ShieldCheck className="h-3.5 w-3.5" /> {apk.minimumOs}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />{" "}
                      {new Date(apk.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ) : null}
              </div>

              <div className="flex-1 p-8 space-y-5">
                <ul className="space-y-3 text-sm text-[#3b352f]">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-[#5f7d5d] shrink-0 mt-0.5" />
                    <span>One-tap bookings for stays, meals, and rides.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-[#5f7d5d] shrink-0 mt-0.5" />
                    <span>Secure M-Pesa, wallet, and card payments.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-[#5f7d5d] shrink-0 mt-0.5" />
                    <span>Real-time tracking for every trip and delivery.</span>
                  </li>
                </ul>

                {apk ? (
                  <a
                    href={apk.url}
                    download
                    className="inline-flex items-center justify-center gap-2 w-full bg-[#c47c2b] hover:bg-[#b06d20] text-white text-xs font-bold uppercase tracking-wider py-4 rounded-full shadow-sm transition-all"
                  >
                    <Download className="w-4 h-4" />
                    Download APP
                  </a>
                ) : (
                  <div className="rounded-xl border border-[#e6dfd5] bg-[#f9f7f4] p-4 text-center">
                    <p className="text-xs font-semibold text-[#5e5950]">
                      Android app coming soon
                    </p>
                    <p className="mt-1 text-[11px] text-[#9e978e]">
                      We're finishing the final touches. Check back shortly.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Windows / Partner App */}
            <div className="bg-white rounded-3xl border border-[#e6dfd5] shadow-xs overflow-hidden flex flex-col">
              <div className="bg-gradient-to-br from-[#eef1f6] to-[#e0e5ee] p-8 space-y-4">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#3e5573]">
                  <Monitor className="w-3.5 h-3.5" /> For Partners
                </span>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#191816]">
                    DigitalSafaris for Windows
                  </h2>
                  <p className="mt-2 text-sm text-[#5e5950]">
                    Manage bookings, orders, and trips from your desktop —
                    built for hotel, restaurant, and transport partners.
                  </p>
                </div>

                {windows ? (
                  <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-[#4a5a72] pt-1">
                    <span className="inline-flex items-center gap-1.5">
                      <Package className="h-3.5 w-3.5" /> v{windows.version}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <HardDrive className="h-3.5 w-3.5" /> {windows.size}
                    </span>
                    {windows.minimumOs && (
                      <span className="inline-flex items-center gap-1.5">
                        <ShieldCheck className="h-3.5 w-3.5" />{" "}
                        {windows.minimumOs}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />{" "}
                      {new Date(windows.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ) : null}
              </div>

              <div className="flex-1 p-8 space-y-5">
                <ul className="space-y-3 text-sm text-[#3b352f]">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-[#5f7d5d] shrink-0 mt-0.5" />
                    <span>Accept and manage incoming bookings in one view.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-[#5f7d5d] shrink-0 mt-0.5" />
                    <span>Track orders, earnings, and payouts in real time.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-[#5f7d5d] shrink-0 mt-0.5" />
                    <span>Built for Windows 10 and above.</span>
                  </li>
                </ul>

                {windows ? (
                  <a
                    href={windows.url}
                    download
                    className="inline-flex items-center justify-center gap-2 w-full bg-[#141312] hover:bg-[#2a2825] text-white text-xs font-bold uppercase tracking-wider py-4 rounded-full shadow-sm transition-all"
                  >
                    <Download className="w-4 h-4" />
                    Download Installer
                  </a>
                ) : (
                  <div className="rounded-xl border border-[#e6dfd5] bg-[#f9f7f4] p-4 text-center">
                    <p className="text-xs font-semibold text-[#5e5950]">
                      Windows app coming soon
                    </p>
                    <p className="mt-1 text-[11px] text-[#9e978e]">
                      Partners can use the portal in the meantime.
                    </p>
                    <Link
                      to="/partner-registration"
                      className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-[#c47c2b] underline"
                    >
                      Go to portal
                      <ArrowUpRight className="w-3 h-3" />
                    </Link>
                  </div>
                )}
              </div>
            </div>

          </div>
        </section>
      )}

      {/* Why download */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-[#e6dfd5] mt-12">
        <div className="text-center space-y-3 mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-[#5e5950]">
            WHY THE APP
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            Made for <span className="text-[#c47c2b]">Kenya.</span>
          </h2>
          <p className="text-sm sm:text-base text-[#5e5950] max-w-xl mx-auto leading-relaxed">
            Native payments, local support, and every service in the
            DigitalSafaris ecosystem in one place.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-8 rounded-3xl border border-[#e6dfd5] space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#f4efe8] flex items-center justify-center text-[#c47c2b]">
              <Smartphone className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-[#191816]">
              One app, every service
            </h3>
            <p className="text-xs sm:text-sm text-[#5e5950] leading-relaxed">
              Stays, food, and rides under a single login. No more switching
              between four different apps.
            </p>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-[#e6dfd5] space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#f4efe8] flex items-center justify-center text-[#c47c2b]">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-[#191816]">
              Secure by default
            </h3>
            <p className="text-xs sm:text-sm text-[#5e5950] leading-relaxed">
              Payments protected end-to-end. Your booking, order, and trip data
              stays private and encrypted.
            </p>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-[#e6dfd5] space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#f4efe8] flex items-center justify-center text-[#c47c2b]">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-[#191816]">
              Always up to date
            </h3>
            <p className="text-xs sm:text-sm text-[#5e5950] leading-relaxed">
              New features, services, and partners are added automatically. No
              manual updates.
            </p>
          </div>
        </div>
      </section>

      {/* Support CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="bg-gradient-to-b from-[#eae3d9] to-[#f4efe8] rounded-3xl p-10 sm:p-16 text-center border border-[#e6dfd5] shadow-sm space-y-4">
          <span className="text-xs font-bold uppercase tracking-widest text-[#c47c2b]">
            NEED HELP?
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#191816]">
            We've got <span className="text-[#c47c2b]">you covered.</span>
          </h2>
          <p className="text-sm sm:text-base text-[#5e5950] max-w-xl mx-auto leading-relaxed">
            Having trouble downloading or installing the app? Our support team
            responds within 24 hours.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/contact"
              className="inline-flex items-center justify-center gap-2 bg-[#c47c2b] hover:bg-[#b06d20] text-white text-xs font-bold uppercase tracking-wider px-8 py-4 rounded-full shadow-sm transition-all transform hover:-translate-y-0.5"
            >
              Contact Support
              <ArrowUpRight className="w-4 h-4" />
            </Link>
            {config.support_email && (
              <a
                href={`mailto:${config.support_email}`}
                className="text-xs font-semibold text-[#191816] underline"
              >
                {config.support_email}
              </a>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};