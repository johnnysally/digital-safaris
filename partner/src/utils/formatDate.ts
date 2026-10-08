export function formatDate(
	value: string | number | Date,
	options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" },
	locale?: string,
): string {
	const date = value instanceof Date ? value : new Date(value);
	if (!Number.isFinite(date.getTime())) return "Date unavailable";

	try {
		return new Intl.DateTimeFormat(locale, options).format(date);
	} catch {
		return date.toISOString();
	}
}

export function formatDateTime(value: string | number | Date, locale?: string): string {
	return formatDate(value, { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }, locale);
}

export function formatRelativeDate(value: string | number | Date, now = new Date()): string {
	const date = value instanceof Date ? value : new Date(value);
	if (!Number.isFinite(date.getTime())) return "Date unavailable";

	const elapsedDays = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 86_400_000));
	if (elapsedDays === 0) return "Today";
	if (elapsedDays === 1) return "1d ago";
	return `${elapsedDays}d ago`;
}