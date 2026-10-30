import React from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Bed, Utensils, Car, Compass } from "lucide-react";
import { Hero } from "../components/sections/Hero";
import { SERVICES_DATA } from "../utils/constants";

const serviceVisuals: Record<string, { image: string; icon: React.ElementType }> = {
  accommodation: { image: "/accomodation.jpg", icon: Bed },
  food: { image: "/food%20and%20dinning.jpg", icon: Utensils },
  transport: { image: "/trasportation.jpg", icon: Car },
  experiences: { image: "/experience.jpg", icon: Compass },
};

export const HomePage: React.FC = () => {
  return (
    <div className="bg-[#f9f7f4] min-h-screen text-[#191816]">
      <Hero />


      {/* Problem & Solution Section */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          <div className="space-y-6">
            <span className="text-xs font-bold uppercase tracking-widest text-[#855016]">WHAT IS DIGITALSAFARIS?</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              A more connected way to discover and experience Kenya.
            </h2>
            <p className="text-sm sm:text-base text-[#5e5950] leading-relaxed">
              DigitalSafaris is a digital travel platform for planning and enjoying trips in Kenya. Find a place to stay, discover local food, arrange transport, and choose experiences in the places you visit.
            </p>
            <p className="text-sm sm:text-base text-[#5e5950] leading-relaxed">
              The platform connects travelers with local hospitality businesses, making it easier to discover trusted services and organize more of the journey in one place. DigitalSafaris is not limited to wildlife tours; it includes stays, meals, rides, and local activities that make a trip.
            </p>
          </div>

          <div className="bg-[#f4efe8] p-8 rounded-3xl border border-[#e6dfd5] space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-[#191816]">The Connected Journey Flow</h4>
            <div className="space-y-3 pt-2">
              {[
                { step: "Discover", desc: "Explore accommodation, meals, transport, and safari activities." },
                { step: "Choose", desc: "Compare options side-by-side with transparent pricing." },
                { step: "Book / Order", desc: "Complete transactions securely in one place." },
                { step: "Move & Experience", desc: "Access transport and guided tours easily." }
              ].map((s, idx) => (
                <div key={idx} className="bg-white p-4 rounded-xl border border-[#e6dfd5] flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#eae3d9] flex items-center justify-center font-mono text-xs font-bold text-[#855016]">
                    0{idx + 1}
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-[#191816]">{s.step}</h5>
                    <p className="text-[11px] text-[#5e5950]">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>


      {/* Services Overview Cards Section */}
      <section className="py-20 bg-[#eae3d9]/40 border-y border-[#e6dfd5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center space-y-3 mb-12 sm:mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-[#855016]">OUR PLATFORM SERVICES</span>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
              Four pillars of a perfect journey.
            </h2>
            <p className="text-sm sm:text-base text-[#5e5950] max-w-xl mx-auto">
              Whether you need a stay, a hot meal, a ride across town, or a safari guide, DigitalSafaris has you covered.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
            {SERVICES_DATA.map((service) => {
              const visual = serviceVisuals[service.id];
              const Icon = visual.icon;
              const title = service.badge === "FOOD & DINING" ? "Food & Dining" : service.badge.toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());

              return (
                <Link
                  key={service.id}
                  to={service.href}
                  aria-label={`Explore ${title}`}
                  className="group relative flex min-h-[19rem] flex-col justify-between overflow-hidden rounded-3xl border border-black/10 p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#855016] focus-visible:ring-offset-4"
                >
                  <img
                    src={visual.image}
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 m-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 m-0 bg-gradient-to-t from-black/90 via-black/55 to-black/15 transition-colors group-hover:from-black/95" />

                  <div className="relative z-10 space-y-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/25 bg-black/25 text-white backdrop-blur-sm">
                      <Icon className="h-6 w-6" aria-hidden="true" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-bold text-white">{title}</h3>
                      <p className="text-sm leading-relaxed text-white/90">
                        {service.subtitle}
                      </p>
                    </div>
                  </div>

                  <span className="relative z-10 inline-flex items-center justify-between gap-2 border-t border-white/30 pt-4 text-xs font-bold text-white">
                    <span>Explore {title}</span>
                    <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>


      {/* For Businesses Callout Section */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#191816] text-white rounded-3xl p-10 sm:p-16 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          <div className="lg:col-span-8 space-y-4">
            <span className="text-xs font-bold uppercase tracking-widest text-[#f0aa56]">FOR HOSPITALITY MERCHANTS</span>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
              Are you a hotel, restaurant, or transport provider?
            </h2>
            <p className="text-sm sm:text-base text-[#9e978e] leading-relaxed max-w-2xl">
              Join DigitalSafaris to digitize your operations, receive bookings and orders, and reach thousands of active travelers across Kenya.
            </p>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-3">
            <Link
              to="/partner-registration"
              className="w-full text-center bg-[#c47c2b] hover:bg-[#b06d20] text-white text-xs font-bold uppercase tracking-wider py-4 rounded-full shadow-sm transition-all"
            >
              Become a Partner
            </Link>
            <Link
              to="/businesses"
              className="w-full text-center border border-[#3a3733] hover:border-white text-white text-xs font-bold uppercase tracking-wider py-4 rounded-full transition-all"
            >
              Learn Partner Benefits
            </Link>
          </div>

        </div>
      </section>

    </div>
  );
};
