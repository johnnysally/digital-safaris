export type ID = string;
export type ISODate = string;
export type Hex = `#${string}`;
export type Theme = "light" | "dark";

export type AccountStatus = "active" | "suspended" | "pending" | "rejected";

export type PartnerType = "accommodation" | "restaurant" | "transport";

export type PartnerStatus = "pending" | "approved" | "rejected" | "suspended";

export type AdminRole =
  | "super_admin"
  | "admin"
  | "finance"
  | "support"
  | "operations";

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "checked_in"
  | "checked_out"
  | "cancelled"
  | "completed"
  | "refunded";

export type OrderStatus =
  | "pending"
  | "accepted"
  | "preparing"
  | "ready"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export type DineInStatus =
  | "pending"
  | "confirmed"
  | "seated"
  | "completed"
  | "cancelled";

export type TripStatus =
  | "requested"
  | "accepted"
  | "in_progress"
  | "completed"
  | "cancelled";

export type BroadcastStatus = "open" | "locked" | "cancelled" | "expired";

export type PaymentStatus =
  | "pending"
  | "processing"
  | "success"
  | "failed"
  | "refunded";

export type PaymentMethodName = "mpesa" | "stripe" | "wallet";

export type PayoutStatus =
  | "pending"
  | "processing"
  | "completed"
  | "rejected"
  | "failed";

export type DisputeStatus =
  | "open"
  | "investigating"
  | "resolved"
  | "rejected"
  | "closed";

export type DisputeCategory =
  | "payment"
  | "service"
  | "delivery"
  | "refund"
  | "conduct"
  | "other";

export type ContactStatus = "new" | "in_progress" | "resolved";

export type TransactionType =
  | "credit"
  | "debit"
  | "commission"
  | "payout"
  | "refund";

export type BackupFrequency = "daily" | "weekly" | "monthly";

export type BackupStatus = "ready" | "processing" | "failed";

export type LegalType = "terms" | "privacy" | "cookies";

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
  startDate?: ISODate;
  endDate?: ISODate;
  [key: string]: unknown;
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
  location?: GeoPoint;
}

export interface ContactInfo {
  email?: string;
  phone?: string;
}

export interface ApiEnvelope<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
}

export interface AdminRoleDoc {
  _id: ID;
  name: string;
  description?: string;
  permissions: string[];
  isSystem?: boolean;
  status?: AccountStatus;
  createdAt?: ISODate;
  updatedAt?: ISODate;
}

export interface Admin {
  _id: ID;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: AdminRoleDoc | AdminRole | string;
  permissions?: string[];
  status: AccountStatus;
  avatar?: string | null;
  lastLogin?: ISODate;
  isDeleted?: boolean;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse extends AuthTokens {
  admin: Admin;
}

export interface RefreshResponse extends AuthTokens {}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  email: string;
  otp: string;
  newPassword: string;
}

export interface Customer {
  _id: ID;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  town?: string;
  avatar?: string | null;
  status: AccountStatus;
  walletBalance: number;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface CustomerDetails extends Customer {
  address?: Address;
  lastLogin?: ISODate;
  totalBookings?: number;
  totalOrders?: number;
  totalTrips?: number;
  totalSpent?: number;
}

export interface Partner {
  _id: ID;
  type: PartnerType;
  name: string;
  email: string;
  phone?: string;
  town?: string;
  logo?: string | null;
  status: PartnerStatus;
  rating?: number;
  totalRatings?: number;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface PartnerBusinessInfo {
  registrationNumber?: string;
  taxPin?: string;
  description?: string;
  address?: Address;
  website?: string;
  socials?: Record<string, string>;
  operatingHours?: Record<string, { open: string; close: string }>;
}

export interface PartnerWalletInfo {
  walletId?: ID;
  balance: number;
  totalEarned: number;
  commissionOwed: number;
  lastPayoutAt?: ISODate;
  lastPayoutAmount?: number;
}

export interface PartnerPayoutInfo {
  method?: PaymentMethodName;
  accountName?: string;
  accountNumber?: string;
  bankName?: string;
  mpesaNumber?: string;
  stripeAccountId?: string;
}

export interface PartnerDetails extends Partner {
  business?: PartnerBusinessInfo;
  wallet?: PartnerWalletInfo;
  payout?: PartnerPayoutInfo;
}

export interface Booking {
  _id: ID;
  reference: string;
  customerId: ID;
  customerName: string;
  partnerId: ID;
  partnerName: string;
  partnerType: PartnerType;
  status: BookingStatus;
  checkIn: ISODate;
  checkOut: ISODate;
  guests: number;
  total: number;
  currency: string;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface OrderItem {
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Order {
  _id: ID;
  reference: string;
  customerId: ID;
  customerName: string;
  partnerId: ID;
  partnerName: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  deliveryFee?: number;
  total: number;
  currency: string;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface DineInBooking {
  _id: ID;
  reference: string;
  customerId: ID;
  customerName: string;
  partnerId: ID;
  partnerName: string;
  status: DineInStatus;
  scheduledAt: ISODate;
  partySize: number;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface Trip {
  _id: ID;
  reference: string;
  customerId: ID;
  customerName: string;
  partnerId: ID;
  partnerName: string;
  status: TripStatus;
  pickup: Address;
  dropoff: Address;
  distanceKm?: number;
  fare: number;
  currency: string;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface Broadcast {
  _id: ID;
  reference: string;
  customerId: ID;
  customerName: string;
  foodType: string;
  budget: number;
  currency: string;
  radiusKm: number;
  status: BroadcastStatus;
  acceptedBy?: ID;
  acceptedByName?: string;
  expiresAt: ISODate;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface Payment {
  _id: ID;
  reference: string;
  customerId?: ID;
  customerName?: string;
  partnerId?: ID;
  partnerName?: string;
  method: PaymentMethodName;
  status: PaymentStatus;
  amount: number;
  currency: string;
  serviceType?: PartnerType | "dinein" | "broadcast";
  relatedId?: ID;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface Commission {
  _id: ID;
  partnerId: ID;
  partnerName: string;
  partnerType: PartnerType;
  serviceType: PartnerType | "dinein" | "broadcast";
  relatedId: ID;
  reference: string;
  baseAmount: number;
  rate: number;
  amount: number;
  currency: string;
  createdAt: ISODate;
}

export interface Payout {
  _id: ID;
  reference: string;
  partnerId: ID;
  partnerName: string;
  partnerType: PartnerType;
  method: PaymentMethodName;
  status: PayoutStatus;
  amount: number;
  currency: string;
  reason?: string;
  processedBy?: ID;
  processedAt?: ISODate;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface PayoutSettings {
  minAmount: number;
  schedule: BackupFrequency;
  autoApprove: boolean;
  commissionRate: number;
  currency: string;
}

export interface Wallet {
  _id: ID;
  partnerId: ID;
  partnerName: string;
  partnerType: PartnerType;
  balance: number;
  totalEarned: number;
  commissionOwed: number;
  currency: string;
  lastPayoutAt?: ISODate;
  updatedAt: ISODate;
}

export interface WalletTransaction {
  _id: ID;
  walletId: ID;
  type: TransactionType;
  amount: number;
  currency: string;
  balanceAfter: number;
  reference?: string;
  description?: string;
  createdAt: ISODate;
}

export interface DisputeMessage {
  _id: ID;
  authorId: ID;
  authorName: string;
  authorRole: "admin" | "customer" | "partner";
  body: string;
  attachments?: string[];
  createdAt: ISODate;
}

export interface Dispute {
  _id: ID;
  reference: string;
  raisedById: ID;
  raisedByName: string;
  raisedByRole: "customer" | "partner";
  againstId: ID;
  againstName: string;
  againstRole: "customer" | "partner";
  category: DisputeCategory;
  status: DisputeStatus;
  subject: string;
  assignedTo?: ID;
  assignedToName?: string;
  resolvedAt?: ISODate;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface DisputeDetails extends Dispute {
  description: string;
  messages: DisputeMessage[];
  resolution?: string;
}

export interface Contact {
  _id: ID;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: ContactStatus;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface SystemSetting {
  _id: ID;
  key: string;
  value: unknown;
  updatedAt: ISODate;
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

export interface PaymentMethodConfig {
  name: PaymentMethodName;
  enabled: boolean;
  usedFor: Array<PartnerType | "dinein">;
  config: Record<string, unknown>;
}

export interface CommissionSettings {
  defaultRate: number;
  byService: Record<string, number>;
}

export interface BackupSettings {
  enabled: boolean;
  frequency: BackupFrequency;
  time: string;
  retentionDays: number;
  notifyEmail?: string;
}

export interface LegalDocument {
  _id: ID;
  type: LegalType;
  title: string;
  content: string;
  updatedAt: ISODate;
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
  updatedAt?: ISODate;
}

export interface Backup {
  filename: string;
  size: number;
  type: "auto" | "manual" | "uploaded";
  status: BackupStatus;
  createdAt: ISODate;
}

export interface DashboardOverview {
  totals: {
    customers: number;
    restaurants: number;
    transport: number;
    accommodations: number;
  };
  today: {
    bookings: number;
    orders: number;
    trips: number;
    payouts: number;
  };
  openDisputes: number;
  recentActivity: ActivityItem[];
}

export interface ActivityItem {
  id: ID;
  type:
    | "order"
    | "booking"
    | "trip"
    | "payment"
    | "payout"
    | "partner"
    | "dispute";
  message: string;
  createdAt: ISODate;
}

export interface RevenueReport {
  total: number;
  currency: string;
  byService: Record<string, number>;
  range: { startDate: ISODate; endDate: ISODate };
}

export interface PayoutReport {
  total: number;
  currency: string;
  byPartnerType: Record<PartnerType, number>;
  range: { startDate: ISODate; endDate: ISODate };
}

export interface PaymentReport {
  total: number;
  currency: string;
  byMethod: Record<PaymentMethodName, number>;
  range: { startDate: ISODate; endDate: ISODate };
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  errors?: Record<string, string[]>;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  meta?: PaginationMeta;
}

export interface Paginated<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface OrderNewPayload {
  reference: string;
  total: number;
  items: OrderItem[];
}

export interface OrderCancelledPayload {
  reference: string;
  reason?: string;
}

export interface DineInNewPayload {
  reference: string;
  scheduledAt: ISODate;
  partySize: number;
}

export interface DineInCancelledPayload {
  reference: string;
}

export interface TripNewPayload {
  reference: string;
  pickup: Address;
  dropoff: Address;
}

export interface TripCancelledPayload {
  reference: string;
}

export interface BroadcastNewPayload {
  reference: string;
  foodType: string;
  budget: number;
}

export interface BroadcastLockedPayload {
  reference: string;
  acceptedBy: ID;
}

export interface BroadcastCancelPayload {
  reference: string;
}

export interface PartnerApplicationPayload {
  type: PartnerType;
  name: string;
  email: string;
}

export interface PaymentReceivedPayload {
  reference: string;
  amount: number;
  method: PaymentMethodName;
}

export interface PayoutProcessedPayload {
  reference: string;
  amount: number;
  method: PaymentMethodName;
}

export interface SocketEventMap {
  "order:new": OrderNewPayload;
  "order:cancelled": OrderCancelledPayload;
  "dinein:new": DineInNewPayload;
  "dinein:cancelled": DineInCancelledPayload;
  "trip:new": TripNewPayload;
  "trip:cancelled": TripCancelledPayload;
  "broadcast:new": BroadcastNewPayload;
  "broadcast:locked": BroadcastLockedPayload;
  "broadcast:cancel": BroadcastCancelPayload;
  "partner:application": PartnerApplicationPayload;
  "payment:received": PaymentReceivedPayload;
  "payout:processed": PayoutProcessedPayload;
}

export type SocketEventName = keyof SocketEventMap;

export type StatusVariant =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral";

  export type LocationType = "country" | "county" | "town" | "city" | "area";

export interface Location {
  _id: ID;
  name: string;
  slug: string;
  type: LocationType;
  parent?: ID | null;
  countryCode: string;
  county?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  radiusKm: number;
  timezone: string;
  currency: string;
  isOperational: boolean;
  isDefault: boolean;
  createdAt: ISODate;
  updatedAt: ISODate;
}