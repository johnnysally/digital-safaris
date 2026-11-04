import Constants from 'expo-constants';

const extra = (Constants.expoConfig?.extra ?? {}) as {
  apiUrl?: string;
  socketUrl?: string;
  developer?: string;
  company?: string;
  companyUrl?: string;
  copyright?: string;
};

export const API_URL = extra.apiUrl ?? 'https://api.digitalsafaris.co.ke/api';
export const SOCKET_URL = extra.socketUrl ?? 'https://api.digitalsafaris.co.ke';

export const APP_NAME = 'DigitalSafaris';
export const APP_TAGLINE = 'Travel · Explore · Experience';
export const APP_SCHEME = 'digitalsafaris';
export const APP_DOMAIN = 'digitalsafaris.co.ke';

export const DEVELOPER = extra.developer ?? 'Davis Okoth';
export const COMPANY = extra.company ?? 'HDM';
export const COMPANY_URL = extra.companyUrl ?? 'https://www.hdm.co.ke';
export const COPYRIGHT = extra.copyright ?? '© 2026 HDM. All rights reserved.';

export const COMPANY_EMAIL = 'info@hdm.co.ke';
export const SUPPORT_EMAIL = 'support@digitalsafaris.co.ke';
export const SUPPORT_PHONE = '+254 700 000 000';

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  VERIFY_EMAIL: '/verify-email',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',

  SEARCH: '/search',
  ACCOMMODATION: '/accommodation',
  RESTAURANT: '/restaurant',
  TRANSPORT: '/transport',
  AI_CONCIERGE: '/ai-concierge',

  BOOKING: '/booking',
  ORDER: '/order',
  TRIP: '/trip',
  BROADCAST: '/broadcast',
  TRACKING: '/tracking',

  PAYMENT: '/payment',
  WALLET: '/wallet',
  REVIEWS: '/reviews',
  NOTIFICATIONS: '/notifications',
  PROFILE: '/profile',
} as const;

export const PAGE_SIZES = [10, 25, 50, 100] as const;
export const DEFAULT_PAGE_SIZE = 20;

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'ds_customer_access_token',
  REFRESH_TOKEN: 'ds_customer_refresh_token',
} as const;

export const STATUS_COLORS: Record<string, string> = {
  active: 'success',
  confirmed: 'success',
  completed: 'success',
  delivered: 'success',
  success: 'success',
  paid: 'success',
  checked_in: 'info',
  checked_out: 'success',

  pending: 'warning',
  processing: 'warning',
  preparing: 'warning',
  in_progress: 'warning',
  requested: 'warning',
  accepted: 'info',
  ready: 'info',
  out_for_delivery: 'info',
  ongoing: 'info',
  broadcasting: 'info',

  cancelled: 'danger',
  rejected: 'danger',
  failed: 'danger',
  suspended: 'danger',
  refunded: 'danger',
  expired: 'neutral',
  no_show: 'neutral',
  closed: 'neutral',
};

export const PAYMENT_METHODS = ['mpesa', 'stripe', 'wallet'] as const;
export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  mpesa: 'M-Pesa',
  stripe: 'Card',
  wallet: 'Wallet',
};

export const CUISINE_OPTIONS = [
  { label: 'African', value: 'african' },
  { label: 'Italian', value: 'italian' },
  { label: 'Chinese', value: 'chinese' },
  { label: 'Indian', value: 'indian' },
  { label: 'Fast food', value: 'fast_food' },
  { label: 'Seafood', value: 'seafood' },
  { label: 'Other', value: 'other' },
] as const;

export const ACCOMMODATION_TYPES = [
  { label: 'Hotel', value: 'hotel' },
  { label: 'Lodge', value: 'lodge' },
  { label: 'Camp', value: 'camp' },
  { label: 'Resort', value: 'resort' },
  { label: 'BnB', value: 'bnb' },
  { label: 'Guesthouse', value: 'guesthouse' },
  { label: 'Villa', value: 'villa' },
  { label: 'Apartment', value: 'apartment' },
] as const;

export const TRANSPORT_SERVICES = [
  { label: 'Car', value: 'car', detail: 'Comfortable rides' },
  { label: 'Bike', value: 'bike', detail: 'Quick solo trips' },
  { label: 'Van', value: 'van', detail: 'Groups and extra bags' },
] as const;

export const SOCKET_EVENTS = {
  ORDER_ACCEPTED: 'order:accepted',
  ORDER_CANCELLED: 'order:cancelled',
  ORDER_PREPARING: 'order:preparing',
  ORDER_READY: 'order:ready',
  ORDER_OUT_FOR_DELIVERY: 'order:out_for_delivery',
  ORDER_DELIVERED: 'order:delivered',

  DINEIN_ACCEPTED: 'dinein:accepted',
  DINEIN_CANCELLED: 'dinein:cancelled',

  TRIP_STARTED: 'trip:started',
  TRIP_COMPLETED: 'trip:completed',
  TRIP_CANCELLED: 'trip:cancelled',

  BOOKING_CONFIRMED: 'booking:confirmed',
  BOOKING_CANCELLED: 'booking:cancelled',
  BOOKING_CHECKED_IN: 'booking:checked_in',
  BOOKING_CHECKED_OUT: 'booking:checked_out',

  DELIVERY_ACCEPTED: 'delivery:accepted',
  DRIVER_LOCATION: 'driver:location',

  BROADCAST_EXPIRED: 'broadcast:expired',
} as const;

export type SocketEvent = (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS];

export const POLLING = {
  PAYMENT_INTERVAL_MS: 3000,
  PAYMENT_MAX_ATTEMPTS: 40,
  TRACKING_INTERVAL_MS: 20000,
  SESSION_REFRESH_MS: 60000,
} as const;

export const BRAND = {
  name: APP_NAME,
  tagline: APP_TAGLINE,
  company: COMPANY,
  companyUrl: COMPANY_URL,
  developer: DEVELOPER,
  copyright: COPYRIGHT,
  supportEmail: SUPPORT_EMAIL,
  supportPhone: SUPPORT_PHONE,
} as const;