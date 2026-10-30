import { describe, expect, it } from "vitest";
import { parseLandingReviewsResponse } from "./landingApi";

describe("parseLandingReviewsResponse", () => {
	it("parses the public API envelope and review list", () => {
		expect(parseLandingReviewsResponse({
			statusCode: 200,
			data: {
				items: [{
					id: "review-1",
					name: "Amina Otieno",
					location: "Nairobi",
					image: null,
					rating: 5,
					comment: "A wonderful trip.",
					createdAt: "2026-10-23T10:00:00.000Z",
				}],
			},
			success: true,
		})).toEqual([{
			id: "review-1",
			name: "Amina Otieno",
			location: "Nairobi",
			image: null,
			rating: 5,
			comment: "A wonderful trip.",
			createdAt: "2026-10-23T10:00:00.000Z",
		}]);
	});

	it("rejects unexpected response shapes rather than hiding API errors", () => {
		expect(() => parseLandingReviewsResponse({ data: { reviews: [] } }))
			.toThrow("The landing reviews response did not contain a review list.");
		expect(() => parseLandingReviewsResponse({
			data: { items: [{ id: "review-1", rating: "five" }] },
		})).toThrow("The landing reviews response contained an invalid review.");
	});
});
