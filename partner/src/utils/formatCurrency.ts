import { formatNumber } from "./formatNumber";

export function formatCurrency(
	amount: number,
	currency: string,
	options: Omit<Intl.NumberFormatOptions, "style" | "currency"> = {},
	locale?: string,
): string {
	if (!Number.isFinite(amount)) return "—";

	try {
		return new Intl.NumberFormat(locale, { ...options, style: "currency", currency }).format(amount);
	} catch {
		return `${currency} ${formatNumber(amount, options, locale)}`;
	}
}