import { describe, expect, it } from "vitest";
import { isNonEmpty, isValidEmail, isValidPhoneNumber } from "./validators";

describe("isNonEmpty", () => {
	it("rejects blank and whitespace-only values", () => {
		expect(isNonEmpty("")).toBe(false);
		expect(isNonEmpty(" \t\n")).toBe(false);
	});

	it("accepts values containing non-whitespace characters", () => {
		expect(isNonEmpty(" partner ")).toBe(true);
	});
});

describe("isValidEmail", () => {
	it("accepts a trimmed email address", () => {
		expect(isValidEmail(" person@example.com ")).toBe(true);
	});

	it.each(["", "person@", "@example.com", "person example.com", "a".repeat(250) + "@example.com"])(
		"rejects invalid email %s",
		(email) => {
			expect(isValidEmail(email)).toBe(false);
		},
	);
});

describe("isValidPhoneNumber", () => {
	it("accepts supported punctuation and international numbers", () => {
		expect(isValidPhoneNumber("+254 (712) 345-678")).toBe(true);
	});

	it.each(["123456", "1234567890123456", "call me 0712345678", "++254712345678"])(
		"rejects invalid phone number %s",
		(phone) => {
			expect(isValidPhoneNumber(phone)).toBe(false);
		},
	);
});
