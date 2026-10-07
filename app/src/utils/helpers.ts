export const classNames = (
  ...classes: Array<string | undefined | null | false>
): string => classes.filter(Boolean).join(" ");

export const slugify = (str: string): string =>
  String(str)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const truncate = (str: string, max = 60): string =>
  str.length > max ? `${str.slice(0, max - 1)}…` : str;

export const capitalize = (str?: string | null): string => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const fullName = (first?: string | null, last?: string | null): string =>
  [first, last].filter(Boolean).join(" ");

export const debounce = <T extends (...args: never[]) => void>(
  fn: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
};

export const fileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

export const groupBy = <T, K extends string | number>(
  arr: T[],
  key: (item: T) => K
): Record<K, T[]> =>
  arr.reduce((acc, item) => {
    const k = key(item);
    if (!acc[k]) acc[k] = [];
    acc[k].push(item);
    return acc;
  }, {} as Record<K, T[]>);

export default classNames;