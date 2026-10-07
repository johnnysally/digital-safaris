export const isEmail = (value: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());

export const isPhone = (value: string): boolean =>
  /^(\+?254|0)?[17]\d{8}$/.test(String(value).replace(/\s+/g, ""));

export const isUrl = (value: string): boolean => {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
};

export const isEmpty = (value?: string | null): boolean =>
  !value || String(value).trim().length === 0;

export const isStrongPassword = (value: string): boolean =>
  value.length >= 8 &&
  /[A-Z]/.test(value) &&
  /[a-z]/.test(value) &&
  /\d/.test(value);

export const isValidOTP = (value: string): boolean => /^\d{6}$/.test(value);