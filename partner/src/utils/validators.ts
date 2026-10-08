export function isNonEmpty(value: string): boolean {
	return value.trim().length > 0;
}

export function isValidEmail(value: string): boolean {
	const email = value.trim();
	return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidPhoneNumber(value: string): boolean {
	const phone = value.trim();
	if (!/^\+?[\d\s().-]+$/.test(phone)) return false;
	const digitCount = phone.replace(/\D/g, "").length;
	return digitCount >= 7 && digitCount <= 15;
}