import { describe, expect, it } from "vitest";
import { canAccessPartnerPortal } from "./permissions";

describe("canAccessPartnerPortal", () => {
	it("grants access only to the authenticated partner role", () => {
		const sessions = {
			accommodation: true,
			restaurant: false,
			transport: false,
		};

		expect(canAccessPartnerPortal(sessions, "accommodation")).toBe(true);
		expect(canAccessPartnerPortal(sessions, "restaurant")).toBe(false);
		expect(canAccessPartnerPortal(sessions, "transport")).toBe(false);
	});
});
