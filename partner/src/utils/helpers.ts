export function formatLabel(value: string): string {
	return value.replace(/_/g, " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

export function formatAddress(
	address: { line1?: string | null; town?: string | null; county?: string | null },
	fallback = "Location pending",
): string {
	return [address.line1, address.town, address.county].filter((part): part is string => Boolean(part?.trim())).join(", ") || fallback;
}

export function formatPersonName(person?: { firstName?: string | null; lastName?: string | null } | null, fallback = "Guest"): string {
	const name = [person?.firstName, person?.lastName].filter((part): part is string => Boolean(part?.trim())).join(" ");
	return name || fallback;
}