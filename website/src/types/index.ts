export type ID = string;
export type ISODate = string;
export type Hex = `#${string}`;

export type PartnerType = "accommodation" | "restaurant" | "transport";
export type LocationType = "country" | "county" | "town" | "city" | "area";

export interface AppLinks {
  customer: string | null;
  partner_landing: string | null;
  transport_partner: string | null;
  restaurant_partner: string | null;
  accommodation_partner: string | null;
}

export interface SocialLinks {
  instagram: string | null;
  tiktok: string | null;
  facebook: string | null;
  linkedin: string | null;
  x: string | null;
  youtube: string | null;
}

export interface AiChatConfig {
  enabled: boolean;
  name: string;
  greeting: string;
  color: string;
}

export interface PaymentMethodPublic {
  _id: ID;
  name: "mpesa" | "stripe" | "wallet";
  label: string;
  usedFor: string[];
}

export interface Location {
  _id: ID;
  name: string;
  slug: string;
  type: LocationType;
  countryCode: string;
  county?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  radiusKm: number;
  isOperational: boolean;
}

export interface SiteConfig {
  site_name: string;
  site_tagline: string;
  site_description: string;
  support_email: string | null;
  support_phone: string | null;
  whatsapp_number: string | null;
  app_links: AppLinks;
  social_links: SocialLinks;
  ai_chat: AiChatConfig;
  site_logo: string | null;
  payment_methods: PaymentMethodPublic[];
  locations: Location[];
}

export interface Branding {
  logo?: string;
  logoUrl?: string;
  favicon?: string;
  emailHeaderLogo?: string;
  primaryColor: Hex;
  secondaryColor: Hex;
  fontFamily: string;
  metaTitle: string;
  metaDescription: string;
}

export interface GeneralSettings {
  appName: string;
  apiUrl?: string;
  appUrl?: string;
  clientUrl?: string;
  adminUrl?: string;
  partnerUrl?: string;
  websiteUrl?: string;
  timezone: string;
  currency: string;
  language: string;
  supportEmail: string;
  supportPhone: string;
  logoUrl?: string;
}

export interface LegalDocument {
  _id: ID;
  type: "terms" | "privacy" | "cookies";
  title: string;
  content: string;
  updatedAt: ISODate;
}

export interface Restaurant {
  _id: ID;
  name: string;
  slug: string;
  logo?: string | null;
  coverImage?: string | null;
  description?: string;
  cuisineTypes?: string[];
  town: string;
  address: string;
  rating: number;
  totalRatings: number;
  status: string;
}

export interface Accommodation {
  _id: ID;
  name: string;
  slug: string;
  logo?: string | null;
  coverImage?: string | null;
  description?: string;
  type: string;
  town: string;
  address: string;
  amenities?: string[];
  rating: number;
  totalRatings: number;
  status: string;
}

export interface Property {
  _id: ID;
  partner: ID;
  name: string;
  slug: string;
  description?: string;
  type: string;
  town: string;
  address: string;
  images?: string[];
  amenities?: string[];
  rating: number;
  totalRatings: number;
  status: string;
}

export interface SearchResponse {
  restaurants: Restaurant[];
  accommodations: Accommodation[];
  properties: Property[];
}

export interface ContactPayload {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
}

export interface ContactResponse {
  success: boolean;
  id: ID;
}

export interface AiChatResponse {
  reply: string;
  provider?: string;
  model?: string;
}

export interface PartnerRegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  businessName: string;
  towns: string[];
  businessType?: string;
  cuisine?: string;
}

export interface PartnerRegisterResponse {
  success: boolean;
  message: string;
  data: {
    partnerId: ID;
  };
}

export interface Service {
  id: string;
  title: string;
  description: string;
  icon: string;
  link: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  errors?: Record<string, string[]>;
}

export interface ApiEnvelope<T> {
  success: boolean;
  statusCode: number;
  message: string;
  status?: string;
  color?: string;
  timestamp?: string;
  data: T;
}