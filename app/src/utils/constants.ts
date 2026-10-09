import type { StatusVariant } from "../types";

const CONFIGURED_API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const API_URL = import.meta.env.DEV ? "/api" : CONFIGURED_API_URL;

export const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  VERIFY_EMAIL: "/verify-email",
  FORGOT_PASSWORD: "/forgot-password",
RESET_PASSWORD: "/reset-password",

  SEARCH: "/search",
  ACCOMMODATION: "/accommodation",
  RESTAURANT: "/restaurant",
  TRANSPORT: "/transport",
  AI_CONCIERGE: "/ai-concierge",

  BOOKING: "/booking",
  ORDER: "/order",
  TRIP: "/trip",
  BROADCAST: "/broadcast",
  TRACKING: "/tracking",

  PAYMENT: "/payment",
  WALLET: "/wallet",
  REVIEWS: "/reviews",
  NOTIFICATIONS: "/notifications",
  PROFILE: "/profile",
} as const;

export const PAGE_SIZES = [10, 25, 50, 100] as const;
export const DEFAULT_PAGE_SIZE = 20;

export const STORAGE_KEYS = {
  ACCESS_TOKEN: "ds_customer_access_token",
  REFRESH_TOKEN: "ds_customer_refresh_token",
  THEME: "ds_customer_theme",
} as const;

export const STATUS_COLORS: Record<string, StatusVariant> = {
  active: "success",
  confirmed: "success",
  completed: "success",
  delivered: "success",
  success: "success",
  paid: "success",
  checked_in: "info",
  checked_out: "success",

  pending: "warning",
  processing: "warning",
  preparing: "warning",
  in_progress: "warning",
  requested: "warning",
  accepted: "info",
  ready: "info",
  out_for_delivery: "info",
  ongoing: "info",
  broadcasting: "info",

  cancelled: "danger",
  rejected: "danger",
  failed: "danger",
  suspended: "danger",
  refunded: "danger",
  expired: "neutral",
  no_show: "neutral",
  closed: "neutral",
};

export const PAYMENT_METHODS = ["mpesa", "stripe", "wallet"] as const;
export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  mpesa: "M-Pesa",
  stripe: "Card",
  wallet: "Wallet",
};

export const SOCKET_EVENTS = {
  ORDER_ACCEPTED: "order:accepted",
  ORDER_CANCELLED: "order:cancelled",
  ORDER_PREPARING: "order:preparing",
  ORDER_READY: "order:ready",
  ORDER_OUT_FOR_DELIVERY: "order:out_for_delivery",
  ORDER_DELIVERED: "order:delivered",

  DINEIN_ACCEPTED: "dinein:accepted",
  DINEIN_CANCELLED: "dinein:cancelled",

  TRIP_STARTED: "trip:started",
  TRIP_COMPLETED: "trip:completed",
  TRIP_CANCELLED: "trip:cancelled",

  BOOKING_CONFIRMED: "booking:confirmed",
  BOOKING_CANCELLED: "booking:cancelled",
  BOOKING_CHECKED_IN: "booking:checked_in",
  BOOKING_CHECKED_OUT: "booking:checked_out",

  DELIVERY_ACCEPTED: "delivery:accepted",
  DRIVER_LOCATION: "driver:location",

  BROADCAST_EXPIRED: "broadcast:expired",
} as const;