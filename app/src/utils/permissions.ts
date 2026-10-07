export const PERMISSIONS = {
  CUSTOMER_ONLY: "customer.only",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];