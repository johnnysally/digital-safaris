import type { AdminRole, StatusVariant } from "../types";

export const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

export const ROUTES = {
  LOGIN: "/login",
  DASHBOARD: "/",

  ADMINS: "/admins",
  CUSTOMERS: "/customers",

  PARTNERS: "/partners",
  PARTNER_DETAILS: (type: string, id: string) => `/partners/${type}/${id}`,

  OPERATIONS: "/operations",
  BOOKING_DETAILS: (id: string) => `/operations/bookings/${id}`,
  ORDER_DETAILS: (id: string) => `/operations/orders/${id}`,
  TRIP_DETAILS: (id: string) => `/operations/trips/${id}`,
  BROADCAST_DETAILS: (id: string) => `/operations/broadcasts/${id}`,

  PAYMENTS: "/payments",
  PAYMENT_METHODS: "/payment-methods",
  WALLETS: "/wallets",
  WALLET_DETAILS: (type: string, id: string) => `/wallets/${type}/${id}`,
  DISPUTES: "/disputes",
  DISPUTE_DETAILS: (id: string) => `/disputes/${id}`,
  REPORTS: "/reports",

  CONTACTS: "/contacts",

  SETTINGS: "/settings",
  BACKUP: "/backup",
  BRANDING: "/branding",
  HEALTH: "/health",
} as const;

export const PAGE_SIZES = [10, 25, 50, 100] as const;
export const DEFAULT_PAGE_SIZE = 25;

export const STORAGE_KEYS = {
  ACCESS_TOKEN: "ds_admin_access_token",
  REFRESH_TOKEN: "ds_admin_refresh_token",
  THEME: "ds_admin_theme",
  SIDEBAR_COLLAPSED: "ds_admin_sidebar_collapsed",
} as const;

export const STATUS_COLORS: Record<string, StatusVariant> = {
  active: "success",
  approved: "success",
  confirmed: "success",
  completed: "success",
  success: "success",
  delivered: "success",
  resolved: "success",
  ready: "success",
  checked_out: "success",

  pending: "warning",
  processing: "warning",
  investigating: "warning",
  preparing: "warning",
  in_progress: "warning",
  requested: "warning",
  open: "warning",
  new: "info",
  accepted: "info",
  confirmed_dinein: "info",
  checked_in: "info",
  seated: "info",
  out_for_delivery: "info",
  locked: "info",
  in_transit: "info",

  suspended: "danger",
  rejected: "danger",
  cancelled: "danger",
  failed: "danger",
  refunded: "danger",
  expired: "neutral",
  closed: "neutral",
  inactive: "neutral",
};

export const ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  finance: "Finance",
  support: "Support",
  operations: "Operations",
};

export const PARTNER_TYPES = ["accommodation", "restaurant", "transport"] as const;
export const PARTNER_TYPE_LABELS: Record<string, string> = {
  accommodation: "Accommodation",
  restaurant: "Restaurant",
  transport: "Transport",
};

export const PAYMENT_METHODS = ["mpesa", "stripe", "wallet"] as const;
export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  mpesa: "M-Pesa",
  stripe: "Stripe",
  wallet: "Wallet",
};

export const SERVICE_TYPES = [
  "accommodation",
  "restaurant",
  "transport",
  "dinein",
] as const;
export const SERVICE_TYPE_LABELS: Record<string, string> = {
  accommodation: "Accommodation",
  restaurant: "Food",
  transport: "Transport",
  dinein: "Dine-In",
};

export const SOCKET_EVENTS = {
  ORDER_NEW: "order:new",
  ORDER_CANCELLED: "order:cancelled",
  DINEIN_NEW: "dinein:new",
  DINEIN_CANCELLED: "dinein:cancelled",
  TRIP_NEW: "trip:new",
  TRIP_CANCELLED: "trip:cancelled",
  BROADCAST_NEW: "broadcast:new",
  BROADCAST_LOCKED: "broadcast:locked",
  BROADCAST_CANCEL: "broadcast:cancel",
  PARTNER_APPLICATION: "partner:application",
  PAYMENT_RECEIVED: "payment:received",
  PAYOUT_PROCESSED: "payout:processed",
} as const;

export const DATE_FORMATS = {
  DATE: "MMM d, yyyy",
  DATETIME: "MMM d, yyyy HH:mm",
  TIME: "HH:mm",
  ISO: "yyyy-MM-dd",
} as const;