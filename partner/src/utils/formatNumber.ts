export function formatNumber(value: number, options: Intl.NumberFormatOptions = {}, locale?: string): string {
	if (!Number.isFinite(value)) return "—";

	try {
		return new Intl.NumberFormat(locale, options).format(value);
	} catch {
		return String(value);
	}
}