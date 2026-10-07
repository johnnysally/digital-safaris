export type ID = string;
export type ISODate = string;
export type Hex = `#${string}`;

export type PartnerKind = "restaurant" | "transport" | "accommodation";

export type AccountStatus =
  | "pending"
  | "active"
  | "suspended"
  | "rejected"
  | "offline"
  | "closed";

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

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "checked_in"
  | "checked_out"
  | "cancelled"
  | "no_show";

export type TripStatus =
  | "requested"
  | "accepted"
  | "ongoing"
  | "completed"
  | "cancelled"
  | "failed";

export type DeliveryJobStatus =
  | "broadcasting"
  | "accepted"
  | "picked_up"
  | "delivered"
  | "expired"
  | "cancelled";

export type BroadcastStatus =
  | "broadcasting"
  | "accepted"
  | "expired"
  | "cancelled";

export type PaymentMethodName = "mpesa" | "stripe" | "wallet";

export type PayoutStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "rejected";

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
  from?: ISODate;
  to?: ISODate;
  [key: string]: unknown;
}

export interface Paginated<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface Address {
  line1?: string;
  line2?: string;
  town?: string;
  county?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  notes?: string;
}

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface PartnerUser {
  _id: ID;
  email: string;
  phone: string;
  countryCode: string;
  status: AccountStatus;
  avatar?: string | null;
  lastLogin?: ISODate | null;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface RestaurantPartner extends PartnerUser {
  name: string;
  slug: string;
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
  totalOrders: number;
  totalEarnings: number;
}

export interface TransportPartner extends PartnerUser {
  firstName: string;
  lastName: string;
  idNumber: string;
  licenseNumber?: string | null;
  licenseExpiry?: ISODate | null;
  town: string;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  serviceTypes: string[];
  isOnline: boolean;
  isAvailable: boolean;
  rating: number;
  totalRatings: number;
  totalTrips: number;
  totalEarnings: number;
}

export interface AccommodationPartner extends PartnerUser {
  name: string;
  contactName?: string;
  slug: string;
  logo?: string | null;
  coverImage?: string | null;
  description?: string;
  type: string;
  location?: ID;
  town: string;
  address: string;
  latitude: number;
  longitude: number;
  amenities?: string[];
  checkInTime: string;
  checkOutTime: string;
  rating: number;
  totalRatings: number;
  totalBookings: number;
  totalEarnings: number;
}

export interface Wallet {
  _id: ID;
  balance: number;
  totalEarned: number;
  totalCommissionOwed: number;
  totalCommissionPaid: number;
  totalPaidOut: number;
  pendingPayout: number;
  currency: string;
  payoutMethod: "mpesa" | "bank";
  payoutDetails: {
    phone?: string | null;
    bankName?: string | null;
    accountNumber?: string | null;
    accountName?: string | null;
  };
  payoutFrequency: "daily" | "weekly" | "biweekly" | "monthly";
  minimumPayout: number;
  lastPayoutAt?: ISODate | null;
  status: "active" | "frozen";
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
  displayOrder: number;
  createdAt: ISODate;
  updatedAt: ISODate;
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
  customer?: {
    _id: ID;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    avatar?: string | null;
  };
  restaurant: ID;
  type: "delivery" | "pickup";
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  currency: string;
  paymentMethod: PaymentMethodName;
  paymentStatus: string;
  deliveryAddress?: Address | null;
  deliveryMethod?: "manual" | "ds_transport" | null;
  deliveryJob?: ID | null;
  orderType: "direct" | "broadcast";
  status: OrderStatus;
  acceptedAt?: ISODate | null;
  preparedAt?: ISODate | null;
  outForDeliveryAt?: ISODate | null;
  deliveredAt?: ISODate | null;
  completedAt?: ISODate | null;
  cancelledAt?: ISODate | null;
  cancelledBy?: "customer" | "restaurant" | "admin" | null;
  cancellationReason?: string | null;
  customerNotes?: string | null;
  restaurantNotes?: string | null;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface DineInBooking {
  _id: ID;
  reference: string;
  customer?: {
    _id: ID;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
  };
  restaurant: ID;
  type: "dine_in" | "pickup";
  scheduledAt: ISODate;
  partySize: number;
  preOrder?: OrderItem[];
  estimatedTotal: number;
  currency: string;
  status: DineInStatus;
  acceptedAt?: ISODate | null;
  completedAt?: ISODate | null;
  cancelledAt?: ISODate | null;
  cancelledBy?: "customer" | "restaurant" | "admin" | null;
  cancellationReason?: string | null;
  customerNotes?: string | null;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface BroadcastRequest {
  _id: ID;
  reference: string;
  customer?: {
    _id: ID;
    firstName: string;
    lastName: string;
    phone: string;
  };
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
  order?: ID | null;
  status: BroadcastStatus;
  notes?: string | null;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface Vehicle {
  _id: ID;
  partner: ID;
  type: "bike" | "car" | "van" | "truck" | "bus" | "boat";
  make: string;
  model: string;
  year: number;
  color: string;
  plateNumber: string;
  capacity: number;
  photos?: string[];
  insuranceNumber?: string | null;
  insuranceExpiry?: ISODate | null;
  inspectionExpiry?: ISODate | null;
  status: "pending" | "active" | "inactive" | "suspended";
  isDefault: boolean;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface DeliveryJob {
  _id: ID;
  reference: string;
  order: ID;
  restaurant: ID;
  customer: {
    _id: ID;
    firstName: string;
    lastName: string;
    phone: string;
  };
  partner?: ID | null;
  vehicle?: ID | null;
  pickup: Address & { latitude: number; longitude: number };
  dropoff: Address & { latitude: number; longitude: number };
  distanceKm: number;
  fee: number;
  commissionRate: number;
  commissionAmount: number;
  partnerEarnings: number;
  currency: string;
  status: DeliveryJobStatus;
  broadcastExpiresAt: ISODate;
  acceptedAt?: ISODate | null;
  pickedUpAt?: ISODate | null;
  deliveredAt?: ISODate | null;
  cancelledBy?: string | null;
  cancellationReason?: string | null;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface Trip {
  _id: ID;
  reference: string;
  customer?: {
    _id: ID;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    avatar?: string | null;
  };
  partner: ID;
  vehicle: ID;
  type: string;
  pickup: Address & { latitude: number; longitude: number };
  dropoff: Address & { latitude: number; longitude: number };
  scheduledAt: ISODate;
  startedAt?: ISODate | null;
  completedAt?: ISODate | null;
  distanceKm: number;
  durationMinutes: number;
  passengers: number;
  luggage: number;
  fare: number;
  commissionRate: number;
  commissionAmount: number;
  partnerEarnings: number;
  currency: string;
  paymentMethod: PaymentMethodName;
  paymentStatus: string;
  status: TripStatus;
  notes?: string | null;
  rating?: number | null;
  review?: string | null;
  cancellationReason?: string | null;
  cancelledBy?: string | null;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface DriverLocation {
  _id?: ID;
  partner: ID;
  latitude: number | null;
  longitude: number | null;
  heading?: number | null;
  speed?: number | null;
  accuracy?: number | null;
  isOnline: boolean;
  isAvailable: boolean;
  activeTrip?: ID | null;
  activeDelivery?: ID | null;
  town?: string | null;
  lastPingAt?: ISODate | null;
}

export interface Property {
  _id: ID;
  partner: ID;
  name: string;
  slug: string;
  description?: string;
  type: string;
  location?: ID;
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
  status: "active" | "inactive" | "suspended";
  isFeatured: boolean;
  rating: number;
  totalRatings: number;
  totalBookings: number;
  createdAt: ISODate;
  updatedAt: ISODate;
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
  seasonalPrices?: Array<{
    name: string;
    from: ISODate;
    to: ISODate;
    price: number;
  }>;
  totalUnits: number;
  status: "active" | "inactive" | "suspended";
  isFeatured: boolean;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface RoomAvailability {
  _id: ID;
  partner: ID;
  property: ID;
  room: ID;
  date: ISODate;
  totalUnits: number;
  bookedUnits: number;
  blockedUnits: number;
  availableUnits: number;
  price: number;
  currency: string;
  isBlocked: boolean;
  blockReason?: string | null;
}

export interface Booking {
  _id: ID;
  reference: string;
  customer?: {
    _id: ID;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    avatar?: string | null;
  };
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
  commissionRate: number;
  commissionAmount: number;
  partnerEarnings: number;
  paymentMethod: PaymentMethodName;
  paymentStatus: string;
  status: BookingStatus;
  confirmedAt?: ISODate | null;
  checkedInAt?: ISODate | null;
  checkedOutAt?: ISODate | null;
  cancelledAt?: ISODate | null;
  cancelledBy?: "customer" | "partner" | "admin" | null;
  cancellationReason?: string | null;
  qrCode?: string | null;
  specialRequests?: string | null;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface Guest {
  _id: ID;
  partner: ID;
  booking: ID;
  customer?: ID | null;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  countryCode?: string | null;
  nationality?: string | null;
  idType?: string | null;
  idNumber?: string | null;
  isPrimary: boolean;
  age?: number | null;
  notes?: string | null;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface Rating {
  _id: ID;
  partner: ID;
  customer?: {
    _id: ID;
    firstName: string;
    lastName: string;
    avatar?: string | null;
  };
  order?: ID | null;
  booking?: ID | null;
  trip?: ID | null;
  rating: number;
  title?: string | null;
  comment: string;
  images?: string[];
  tags?: string[];
  status: "published" | "hidden";
  reply?: {
    message?: string | null;
    repliedAt?: ISODate | null;
  };
  createdAt: ISODate;
}

export interface RatingSummary {
  average: number;
  count: number;
  foodQuality?: number | null;
  service?: number | null;
  delivery?: number | null;
  value?: number | null;
  cleanliness?: number | null;
  comfort?: number | null;
  location?: number | null;
}

export interface Payout {
  _id: ID;
  partner: ID;
  partnerType: PartnerKind;
  amount: number;
  method: "mpesa" | "bank" | "wallet";
  type: "auto" | "manual";
  status: PayoutStatus;
  reference: string;
  transactionId?: string | null;
  failureReason?: string | null;
  processedAt?: ISODate | null;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse<T = PartnerUser> extends AuthTokens {
  partner: T;
}

export interface ProfileResponse<T = PartnerUser> {
  partner: T;
  wallet?: Wallet | null;
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

export interface SocketEventMap {
  "order:new": { reference: string; total: number; items: number };
  "order:cancelled": { reference: string; reason?: string };
  "dinein:new": { reference: string; scheduledAt: ISODate; partySize: number };
  "dinein:cancelled": { reference: string };
  "broadcast:new": { reference: string; foodType: string; budget: number };
  "broadcast:locked": { reference: string; acceptedBy: string };
  "broadcast:cancel": { reference: string };
  "trip:new": { reference: string; pickup: string; dropoff: string };
  "trip:cancelled": { reference: string };
  "delivery:new": { reference: string; fee: number; distanceKm: number };
  "delivery:cancelled": { reference: string };
}

export type SocketEventName = keyof SocketEventMap;

export type StatusVariant =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral";

export type FoodOrder = Order;