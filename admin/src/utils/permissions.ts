import type { Admin, AdminRole } from "../types";

export const PERMISSIONS = {
  ADMINS_VIEW: "admins.read",
  ADMINS_MANAGE: "admins.write",

  CUSTOMERS_VIEW: "customers.read",
  CUSTOMERS_MANAGE: "customers.write",
  CUSTOMERS_DELETE: "customers.delete",

  PARTNERS_VIEW: "partners.read",
  PARTNERS_MANAGE: "partners.write",
  PARTNERS_DELETE: "partners.delete",

  OPERATIONS_VIEW: "operations.read",

  PAYMENTS_VIEW: "payments.read",
  PAYMENTS_MANAGE: "payments.write",
  PAYOUTS_APPROVE: "payouts.write",

  WALLETS_VIEW: "wallets.read",
  DISPUTES_VIEW: "disputes.read",
  DISPUTES_MANAGE: "disputes.write",

  REPORTS_VIEW: "reports.read",

  CONTACTS_VIEW: "contacts.read",
  CONTACTS_MANAGE: "contacts.write",

  SETTINGS_VIEW: "settings.read",
  SETTINGS_MANAGE: "settings.write",

  BACKUP_VIEW: "backup.read",
  BACKUP_MANAGE: "backup.write",

  BRANDING_VIEW: "branding.read",
  BRANDING_MANAGE: "branding.write",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ALL_PERMISSIONS: Permission[] = Object.values(PERMISSIONS);

export const FULL_ACCESS = "*";

function getRolePermissions(admin: Admin | null): string[] | null {
  const role = admin?.role as unknown;
  if (!role) return null;

  if (typeof role === "object") {
    const r = role as { permissions?: unknown };
    if (Array.isArray(r.permissions)) {
      return r.permissions.filter((p): p is string => typeof p === "string");
    }
  }

  if (Array.isArray(admin?.permissions)) {
    return admin!.permissions!.filter(
      (p): p is string => typeof p === "string"
    );
  }

  return null;
}

export function roleName(admin: Admin | null): string | null {
  const role = admin?.role as unknown;
  if (!role) return null;
  if (typeof role === "string") return role;
  if (typeof role === "object") {
    const r = role as { name?: string; slug?: string; key?: string };
    return r.name ?? r.slug ?? r.key ?? null;
  }
  return null;
}

export function hasRole(admin: Admin | null, role: AdminRole): boolean {
  const name = roleName(admin);
  if (!name) return false;
  const normalized = name.trim().toLowerCase().replace(/\s+/g, "_");
  return normalized === role;
}

export function hasPermission(
  admin: Admin | null,
  permission: Permission | string
): boolean {
  if (!admin) return false;

  const perms = getRolePermissions(admin);
  if (!perms) return false;

  if (perms.includes(FULL_ACCESS)) return true;
  if (perms.includes(permission)) return true;

  const [domain] = permission.split(".");
  if (domain && perms.includes(`${domain}.*`)) return true;

  return false;
}

export function hasAnyPermission(
  admin: Admin | null,
  permissions: Array<Permission | string>
): boolean {
  return permissions.some((p) => hasPermission(admin, p));
}

export function hasAllPermissions(
  admin: Admin | null,
  permissions: Array<Permission | string>
): boolean {
  return permissions.every((p) => hasPermission(admin, p));
}

export default {
  PERMISSIONS,
  ALL_PERMISSIONS,
  FULL_ACCESS,
  roleName,
  hasRole,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
};