export type ID = string;
export type ISODate = string;
export type Hex = `#${string}`;

export type AccountStatus = "active" | "pending" | "suspended" | "rejected";

export type PartnerType = "accommodation" | "restaurant" | "transport";

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "checked_in"
  | "checked_out"
  | "cancelled"
  | "completed"
  | "no_show"
  | "refunded";

export type OrderStatus =
  | "pending"
  | "accepted"
  | "preparing"
  | "ready"
  | "out_for_delivery"
  | "delivered"
  | "completed"
  | "cancelled"
  | "rejected";

export type DineInStatus =
  | "pending"
  | "accepted"
  | "completed"
  | "cancelled"
  | "no_show"
  | "rejected";

export type TripStatus =
  | "requested"
  | "accepted"
  | "ongoing"
  | "completed"
  | "cancelled"
  | "failed";

export type BroadcastStatus =
  | "broadcasting"
  | "accepted"
  | "expired"
  | "cancelled";

export type PaymentStatus =
  | "pending"
  | "processing"
  | "success"
  | "failed"
  | "refunded"
  | "cancelled";

export type PaymentMethodName = "mpesa" | "stripe" | "wallet";

export type PaymentPurpose =
  | "booking"
  | "food_order"
  | "transport"
  | "topup"
  | "other";

export type LocationType = "country" | "county" | "town" | "city" | "area";

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sort?: string;
  order?: "asc" | "desc";
  from?: ISODate;
  to?: ISODate;
  [key: string]: unknown;
}

export interface Paginated<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface Money {
  amount: number;
  currency: string;
}

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface Address {
  line1?: string;
  line2?: string;
  town?: string;
  county?: string;
  country?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  notes?: string;
}

export interface Customer {
  _id: ID;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  countryCode: string;
  avatar?: string | null;
  dateOfBirth?: ISODate | null;
  gender?: "male" | "female" | "other" | null;
  nationality?: string | null;
  location?: ID | null;
  town?: string | null;
  status: AccountStatus;
  emailVerified: boolean;
  phoneVerified: boolean;
  referralCode?: string;
  lastLogin?: ISODate | null;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface CustomerProfile {
  _id: ID;
  customer: ID;
  bio?: string;
  language: string;
  currency: string;
  timezone: string;
  town?: string | null;
  travelInterests?: string[];
  dietaryPreferences?: string[];
  accessibilityNeeds?: string[];
  emergencyContact?: {
    name?: string | null;
    phone?: string | null;
    relationship?: string | null;
  };
  marketingOptIn: boolean;
  pushOptIn: boolean;
}

export interface CustomerPreferences {
  _id: ID;
  customer: ID;
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
    inApp: boolean;
  };
  categories: {
    orderUpdates: boolean;
    bookingUpdates: boolean;
    tripUpdates: boolean;
    paymentUpdates: boolean;
    promotions: boolean;
    newsletters: boolean;
  };
  theme: "light" | "dark" | "system";
  language: string;
  currency: string;
}

export interface CustomerAddress {
  _id: ID;
  customer: ID;
  label: string;
  type: "home" | "work" | "accommodation" | "other";
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state?: string | null;
  country: string;
  postalCode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  isDefault: boolean;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface CustomerWallet {
  _id: ID;
  customer: ID;
  balance: number;
  totalCredited: number;
  totalDebited: number;
  currency: string;
  status: "active" | "frozen";
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface CustomerPayment {
  _id: ID;
  customer: ID;
  reference: string;
  method: PaymentMethodName;
  purpose: PaymentPurpose;
  relatedId?: ID | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  transactionId?: string | null;
  receiptNumber?: string | null;
  failureReason?: string | null;
  meta?: Record<string, unknown>;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface MenuItem {
  _id: ID;
  restaurant: ID;
  menu: ID;
  name: string;
  description?: string;
  image?: string | null;
  price: number;
  currency: string;
  discountPrice?: number | null;
  preparationTimeMinutes?: number;
  ingredients?: string[];
  allergens?: string[];
  dietary?: string[];
  isAvailable: boolean;
  isFeatured: boolean;
  status: "active" | "inactive";
}

export interface Menu {
  _id: ID;
  restaurant: ID;
  name: string;
  description?: string;
  image?: string | null;
  category?: string | null;
  status: "active" | "inactive";
  displayOrder: number;
}

export interface Restaurant {
  _id: ID;
  name: string;
  slug: string;
  email: string;
  phone: string;
  logo?: string | null;
  coverImage?: string | null;
  description?: string;
  cuisineTypes?: string[];
  town: string;
  address: string;
  latitude: number;
  longitude: number;
  supportsDelivery: boolean;
  supportsDineIn: boolean;
  supportsPickup: boolean;
  deliveryRadiusKm: number;
  minimumOrder: number;
  deliveryFee: number;
  isOpen: boolean;
  isAcceptingOrders: boolean;
  rating: number;
  totalRatings: number;
  status: string;
}

export interface RestaurantDetail extends Restaurant {
  menus?: Menu[];
  menuItems?: MenuItem[];
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
  latitude: number;
  longitude: number;
  images?: string[];
  amenities?: string[];
  rules?: string[];
  checkInTime: string;
  checkOutTime: string;
  totalRooms: number;
  status: string;
  isFeatured: boolean;
  rating: number;
  totalRatings: number;
}

export interface Room {
  _id: ID;
  partner: ID;
  property: ID;
  name: string;
  description?: string;
  type: string;
  capacity: number;
  beds: Array<{ type: string; count: number }>;
  sizeSqm?: number | null;
  images?: string[];
  amenities?: string[];
  basePrice: number;
  currency: string;
  weekendPrice?: number | null;
  totalUnits: number;
  status: string;
  isFeatured: boolean;
}

export interface RoomAvailability {
  _id: ID;
  room: ID;
  date: ISODate;
  totalUnits: number;
  bookedUnits: number;
  availableUnits: number;
  price: number;
  currency: string;
  isBlocked: boolean;
}

export interface Accommodation {
  _id: ID;
  name: string;
  slug: string;
  email: string;
  phone: string;
  logo?: string | null;
  coverImage?: string | null;
  description?: string;
  type: string;
  town: string;
  address: string;
  latitude: number;
  longitude: number;
  amenities?: string[];
  checkInTime: string;
  checkOutTime: string;
  rating: number;
  totalRatings: number;
  status: string;
}

export interface AccommodationDetail extends Accommodation {
  properties?: Property[];
  rooms?: Room[];
}

export interface Booking {
  _id: ID;
  reference: string;
  customer: ID;
  partner: ID;
  property: ID;
  room: ID;
  checkIn: ISODate;
  checkOut: ISODate;
  nights: number;
  guests: {
    adults: number;
    children: number;
  };
  roomsBooked: number;
  pricePerNight: number;
  subtotal: number;
  taxes?: number;
  serviceFee?: number;
  discount?: number;
  total: number;
  currency: string;
  paymentMethod: PaymentMethodName;
  paymentStatus: PaymentStatus;
  status: BookingStatus;
  qrCode?: string | null;
  specialRequests?: string | null;
  createdAt: ISODate;
  updatedAt: ISODate;
  propertyName?: string;
  propertyImages?: string[];
  roomName?: string;
  partnerName?: string;
}

export interface OrderItem {
  menuItem: ID;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
  notes?: string | null;
}

export interface Order {
  _id: ID;
  reference: string;
  customer: ID;
  restaurant: ID;
  type: "delivery" | "pickup";
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  currency: string;
  paymentMethod: PaymentMethodName;
  paymentStatus: PaymentStatus;
  deliveryAddress?: Address | null;
  deliveryMethod?: "manual" | "ds_transport" | null;
  deliveryJob?: ID | null;
  orderType: "direct" | "broadcast";
  status: OrderStatus;
  customerNotes?: string | null;
  createdAt: ISODate;
  updatedAt: ISODate;
  restaurantName?: string;
  restaurantLogo?: string | null;
}

export interface DineInBooking {
  _id: ID;
  reference: string;
  customer: ID;
  restaurant: ID;
  type: "dine_in" | "pickup";
  scheduledAt: ISODate;
  partySize: number;
  preOrder?: OrderItem[];
  estimatedTotal: number;
  currency: string;
  status: DineInStatus;
  customerNotes?: string | null;
  createdAt: ISODate;
  updatedAt: ISODate;
  restaurantName?: string;
  restaurantLogo?: string | null;
}

export interface BroadcastRequest {
  _id: ID;
  reference: string;
  customer: ID;
  foodType: string;
  preparation: string;
  timeNeeded: ISODate;
  budget: number;
  currency: string;
  deliveryAddress: Address;
  broadcastRadiusKm: number;
  broadcastExpiresAt: ISODate;
  targetedRestaurants: ID[];
  acceptedBy?: ID | null;
  acceptedByName?: string | null;
  order?: ID | null;
  status: BroadcastStatus;
  notes?: string | null;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface Trip {
  _id: ID;
  reference: string;
  customer: ID;
  partner: ID;
  vehicle: ID;
  type: string;
  pickup: Address;
  dropoff: Address;
  scheduledAt: ISODate;
  startedAt?: ISODate | null;
  completedAt?: ISODate | null;
  distanceKm: number;
  durationMinutes: number;
  passengers: number;
  luggage: number;
  fare: number;
  currency: string;
  paymentMethod: PaymentMethodName;
  paymentStatus: PaymentStatus;
  status: TripStatus;
  notes?: string | null;
  rating?: number | null;
  review?: string | null;
  createdAt: ISODate;
  updatedAt: ISODate;
  driverName?: string;
  driverPhone?: string;
  vehiclePlate?: string;
}

export interface Review {
  _id: ID;
  customer: ID;
  targetType: PartnerType;
  targetId: ID;
  order?: ID | null;
  booking?: ID | null;
  trip?: ID | null;
  rating: number;
  title?: string | null;
  comment: string;
  images?: string[];
  status: "pending" | "published" | "hidden";
  reply?: {
    message?: string | null;
    repliedAt?: ISODate | null;
  };
  createdAt: ISODate;
  customerName?: string;
  customerAvatar?: string | null;
}

export interface Notification {
  _id: ID;
  customer: ID;
  title: string;
  body: string;
  type:
    | "order"
    | "booking"
    | "trip"
    | "payment"
    | "payout"
    | "promo"
    | "system";
  channel: "in_app" | "push" | "email" | "sms";
  relatedId?: ID | null;
  data?: Record<string, unknown>;
  isRead: boolean;
  readAt?: ISODate | null;
  createdAt: ISODate;
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
  timezone: string;
  currency: string;
  isOperational: boolean;
  isDefault: boolean;
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

export interface BroadcastSettings {
  radiusKm: number;
  expirySeconds: number;
}

export interface PaymentMethodPublic {
  _id: ID;
  name: PaymentMethodName;
  label: string;
  usedFor: string[];
}

export interface SitePayload {
  branding: Branding;
  general: GeneralSettings;
  broadcast: BroadcastSettings;
  paymentMethods: PaymentMethodPublic[];
  locations: Location[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse extends AuthTokens {
  customer: Customer;
}

export interface RegisterResponse {
  customerId: ID;
}

export interface VerifyResponse {
  customerId?: ID;
  alreadyVerified?: boolean;
}

export interface WalletResponse extends CustomerWallet {}

export interface TopUpResponse {
  reference: string;
  checkoutRequestId: string;
}

export interface ConfirmTopUpResponse {
  balance: number;
}

export interface SearchRestaurantsParams extends ListParams {
  town?: string;
  cuisine?: string;
}

export interface SearchAccommodationsParams extends ListParams {
  town?: string;
  type?: string;
}

export interface TripQuoteResponse {
  distanceKm: number;
  fare: number;
  currency: string;
}

export interface AiChatResponse {
  reply: string;
  model: string;
  tokensUsed: number;
  provider: string;
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

export interface TrackingDriver {
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string | null;
}

export interface TrackingVehicle {
  make?: string;
  model?: string;
  plateNumber?: string;
  color?: string;
}

export interface TrackingLocation {
  latitude: number;
  longitude: number;
  lastPingAt: ISODate;
}

export interface TrackTripResponse {
  trip: {
    reference: string;
    status: TripStatus;
    pickup: Address;
    dropoff: Address;
    startedAt?: ISODate | null;
    driver?: TrackingDriver | null;
    vehicle?: TrackingVehicle | null;
  };
  location: TrackingLocation | null;
}

export interface TrackDeliveryResponse {
  order: {
    reference: string;
    status: OrderStatus;
    restaurant?: {
      name: string;
      logo?: string | null;
      town: string;
      address: string;
      latitude?: number;
      longitude?: number;
    };
    deliveryAddress?: Address;
  };
  delivery: {
    status: string;
    driver?: TrackingDriver | null;
    vehicle?: TrackingVehicle | null;
  } | null;
  location: TrackingLocation | null;
}

export interface TrackBookingResponse {
  reference: string;
  status: BookingStatus;
  checkIn: ISODate;
  checkOut: ISODate;
  property?: {
    name: string;
    images?: string[];
    address: string;
    town: string;
    latitude?: number;
    longitude?: number;
  };
  room?: {
    name: string;
    type: string;
    images?: string[];
  };
  qrCode?: string | null;
}

export interface SocketEventMap {
  "order:accepted": { reference: string };
  "order:cancelled": { reference: string; reason?: string };
  "order:preparing": { reference: string };
  "order:ready": { reference: string };
  "order:out_for_delivery": { reference: string };
  "order:delivered": { reference: string };
  "dinein:accepted": { reference: string };
  "dinein:cancelled": { reference: string };
  "trip:started": { reference: string };
  "trip:completed": { reference: string };
  "trip:cancelled": { reference: string };
  "booking:confirmed": { reference: string };
  "booking:cancelled": { reference: string };
  "booking:checked_in": { reference: string };
  "booking:checked_out": { reference: string };
  "delivery:accepted": {
    reference: string;
    driverName: string;
    driverPhone: string;
  };
  "driver:location": {
    latitude: number;
    longitude: number;
    heading?: number;
    speed?: number;
  };
  "broadcast:expired": { reference: string };
}

export type SocketEventName = keyof SocketEventMap;

export type StatusVariant =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral";