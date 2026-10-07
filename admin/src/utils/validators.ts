export const isEmail = (value: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

export const isPhone = (value: string): boolean =>
  /^\+?[0-9]{7,15}$/.test(value.replace(/[\s-]/g, ""));

export const isUrl = (value: string): boolean => {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
};

export const isStrongPassword = (value: string): boolean =>
  value.length >= 8 &&
  /[A-Z]/.test(value) &&
  /[a-z]/.test(value) &&
  /[0-9]/.test(value);

export const isHexColor = (value: string): boolean =>
  /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(value);

export const isEmpty = (value: unknown): boolean => {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value).length === 0;
  return false;
};

export const isValidOTP = (value: string): boolean =>
  /^[0-9]{4,8}$/.test(value.trim());

export default {
  isEmail,
  isPhone,
  isUrl,
  isStrongPassword,
  isHexColor,
  isEmpty,
  isValidOTP,
};