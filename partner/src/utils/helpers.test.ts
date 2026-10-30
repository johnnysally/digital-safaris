import { describe, expect, it } from "vitest";
import { formatAddress, formatLabel, formatPersonName } from "./helpers";

describe("formatLabel", () => {
	it("formats underscore-separated labels", () => {
		expect(formatLabel("pending_review")).toBe("Pending Review");
	});
});

describe("formatAddress", () => {
	it("joins only populated address parts", () => {
		expect(formatAddress({ line1: "12 Main Road", town: "Nairobi", county: null })).toBe("12 Main Road, Nairobi");
	});

	it("uses the fallback when no address parts are available", () => {
		expect(formatAddress({ line1: " ", town: null }, "Address unavailable")).toBe("Address unavailable");
	});
});

describe("formatPersonName", () => {
	it("joins a person's names and handles missing names", () => {
		expect(formatPersonName({ firstName: "Amina", lastName: "Otieno" })).toBe("Amina Otieno");
		expect(formatPersonName(null)).toBe("Guest");
	});
});
