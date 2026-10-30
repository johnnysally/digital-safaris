import axios from "axios";

const landingApi = axios.create({
	baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
	timeout: 15000,
	headers: { "Content-Type": "application/json" },
});

interface ApiEnvelope<T> {
	data: T;
	message?: string;
}

interface LandingReviewsResponse {
	items: LandingReview[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseLandingReviewsResponse(body: unknown): LandingReview[] {
	const payload = isRecord(body) && "data" in body ? body.data : body;
	if (!isRecord(payload) || !Array.isArray(payload.items)) {
		throw new Error("The landing reviews response did not contain a review list.");
	}

	const validReviews = payload.items.every((item) =>
		isRecord(item) &&
		typeof item.id === "string" &&
		typeof item.name === "string" &&
		typeof item.location === "string" &&
		(item.image === null || typeof item.image === "string") &&
		typeof item.rating === "number" &&
		typeof item.comment === "string" &&
		typeof item.createdAt === "string",
	);
	if (!validReviews) {
		throw new Error("The landing reviews response contained an invalid review.");
	}
	return payload.items as LandingReview[];
}

export interface LandingReview {
	id: string;
	name: string;
	location: string;
	image: string | null;
	rating: number;
	comment: string;
	createdAt: string;
}

interface LandingConfig {
	social_links: Record<string, string | null>;
}

export async function fetchLandingReviews(): Promise<LandingReview[]> {
	const response = await landingApi.get<ApiEnvelope<LandingReviewsResponse>>("/public/reviews");
	return parseLandingReviewsResponse(response.data);
}

export async function subscribeToNewsletter(email: string): Promise<void> {
	await landingApi.post("/public/newsletter", { email });
}

export async function fetchLandingConfig(): Promise<LandingConfig> {
	const response = await landingApi.get<{ config: LandingConfig }>("/web/config");
	return response.data.config;
}
