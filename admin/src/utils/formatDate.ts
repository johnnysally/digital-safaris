import { DATE_FORMATS } from "./constants";

function toDate(input: string | number | Date): Date | null {
  if (!input) return null;
  const d = input instanceof Date ? input : new Date(input);
  return Number.isNaN(d.getTime()) ? null : d;
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

export function formatDate(input: string | number | Date): string {
  const d = toDate(input);
  if (!d) return "—";
  return `${d.toLocaleString("en-US", { month: "short" })} ${d.getDate()}, ${d.getFullYear()}`;
}

export function formatDateTime(input: string | number | Date): string {
  const d = toDate(input);
  if (!d) return "—";
  return `${formatDate(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatTime(input: string | number | Date): string {
  const d = toDate(input);
  if (!d) return "—";
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatISODate(input: string | number | Date): string {
  const d = toDate(input);
  if (!d) return "";
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function formatRelative(input: string | number | Date): string {
  const d = toDate(input);
  if (!d) return "—";
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);

  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;

  const years = Math.floor(months / 12);
  return `${years}y ago`;
}

export { DATE_FORMATS };
export default formatDate;