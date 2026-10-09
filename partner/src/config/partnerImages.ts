import accommodationPhoto from "../../../website/public/accomodation.jpg";
import cateringPhoto from "../../../website/public/Catering.jpg";
import experiencePhoto from "../../../website/public/experience.jpg";
import foodPhoto from "../../../website/public/food and dinning.jpg";
import safariPhoto from "../../../website/public/hero-bg.jpg";
import transportPhoto from "../../../website/public/trasportation.jpg";

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
