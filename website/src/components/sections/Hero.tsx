import React from "react";
import { ArrowUpRight, Compass, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { useSiteConfig } from "../../context/SiteConfigContext";
import { LINKS } from "../../utils/links";

export const Hero: React.FC = () => {
  const config = useSiteConfig();
  const customerUrl = LINKS.getCustomerUrl(config);

  return (
    <section className="relative isolate overflow-hidden border-b border-[#e6dfd5] py-16 sm:py-20 lg:py-24">
      {/* Background Image & Overlay */}
      <div 
        aria-hidden="true"
        className="absolute inset-0 -z-20 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url('/hero-bg.jpg')` }}
      />
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-r from-[#100c08]/90 via-[#100c08]/75 to-[#100c08]/45" />
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-black/35 via-transparent to-black/10" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-12">
          
          {/* Left Content */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/35 bg-black/25 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-amber-200 shadow-sm backdrop-blur-md">
              <Compass className="w-4 h-4 text-amber-400" />
              <span>UNIFIED TRAVEL ECOSYSTEM</span>
            </div>

            <h1 className="text-4xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-6xl lg:text-7xl">
              Your journey. <br />
              <span className="text-[#f39c12]">One platform.</span>
            </h1>

            <p className="mx-auto max-w-xl text-base font-normal leading-relaxed text-white/90 sm:text-lg lg:mx-0">
              DigitalSafaris connects accommodation, food ordering, transportation, and local experiences into one seamless digital platform across Kenya.
            </p>

            {/* Action CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <a
                href={customerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#c47c2b] px-8 py-4 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-black/40 transition-all hover:-translate-y-0.5 hover:bg-[#b06d20] hover:shadow-amber-900/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#191816] sm:w-auto"
              >
                Start Your Journey
                <ArrowUpRight className="w-4 h-4" />
              </a>
              <Link
                to="/partner-registration"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/80 px-8 py-4 text-xs font-bold uppercase tracking-wider text-white backdrop-blur-sm transition-all hover:bg-white hover:text-[#191816] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#191816] sm:w-auto"
              >
                Become a Partner
              </Link>
            </div>

            {/* Stats Bar */}
            <div className="pt-8 border-t border-white/20 grid grid-cols-3 gap-4 max-w-md mx-auto lg:mx-0 text-center lg:text-left">
              <div>
                <h4 className="text-2xl sm:text-3xl font-extrabold text-white">60+</h4>
                <p className="text-xs text-gray-300 font-medium">Verified Stays</p>
              </div>
              <div>
                <h4 className="text-2xl sm:text-3xl font-extrabold text-white">45+</h4>
                <p className="text-xs text-gray-300 font-medium">Restaurants</p>
              </div>
              <div>
                <h4 className="text-2xl sm:text-3xl font-extrabold text-white">40+</h4>
                <p className="text-xs text-gray-300 font-medium">Transport Providers</p>
              </div>
            </div>

          </div>

          {/* Right Visual Graphic */}
          <div className="lg:col-span-5">
            <div className="bg-black/40 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-white/20 shadow-2xl space-y-4 relative">
              <div className="h-64 sm:h-72 bg-gradient-to-tr from-black/60 via-black/40 to-white/10 rounded-2xl p-6 flex flex-col justify-between border border-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400">KENYA TRAVEL ECOSYSTEM</span>
                  <span aria-hidden="true" className="h-2 w-2 rounded-full bg-green-400 shadow-[0_0_12px_rgba(74,222,128,0.8)]"></span>
                </div>

                <div className="space-y-3">
                  <div className="bg-black/60 backdrop-blur-md p-3 rounded-xl border border-white/15 text-xs space-y-1">
                    <span className="font-bold text-white">1. Stay: Lake Naivasha Cottage</span>
                    <p className="text-[11px] text-gray-300">Booked • Check-in Ready</p>
                  </div>
                  <div className="bg-black/60 backdrop-blur-md p-3 rounded-xl border border-white/15 text-xs space-y-1">
                    <span className="font-bold text-white">2. Food: Rift Valley Grill Lunch</span>
                    <p className="text-[11px] text-gray-300">Confirmed • Delivery to Cottage</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-300 px-2">
                <span className="flex items-center gap-1"><ShieldCheck className="w-4 h-4 text-amber-400" /> Verified Merchants</span>
                <span className="font-semibold text-white">Unified Dashboard</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default Hero;
