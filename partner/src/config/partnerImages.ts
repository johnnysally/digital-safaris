import accommodationPhoto from "../assets/accomodation.jpg";
import cateringPhoto from "../assets/Catering.jpg";
import experiencePhoto from "../assets/experience.jpg";
import foodPhoto from "../assets/food and dinning.jpg";
import safariPhoto from "../assets/hero-bg.jpg";
import transportPhoto from "../assets/trasportation.jpg";

/**
 * Central image registry for all bundled partner portal photography.
 * Update these mappings to change static portal imagery and fallbacks.
 */
export const partnerImages = {
  shared: {
    sidebarBackground: safariPhoto,
  },
  accommodation: {
    authBackground: accommodationPhoto,
    dashboardFallback: accommodationPhoto,
    propertyFallbacks: [safariPhoto, accommodationPhoto, experiencePhoto],
  },
  restaurant: {
    authBackground: cateringPhoto,
    dashboardFallback: experiencePhoto,
    menuItemFallback: foodPhoto,
    catering: cateringPhoto,
  },
  transport: {
    authBackground: safariPhoto,
    dashboardFallback: transportPhoto,
    vehicleFallback: transportPhoto,
    supportBanner: safariPhoto,
  },
  landing: {
    hero: safariPhoto,
    transport: transportPhoto,
    accommodation: accommodationPhoto,
    dining: foodPhoto,
    experience: experiencePhoto,
    catering: cateringPhoto,
  },
} as const;
