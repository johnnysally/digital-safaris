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
	const response = await landingApi.get<ApiEnvelope<{ items: LandingReview[] }>>("/public/reviews?limit=4");
	return response.data.data.items;
}

export async function subscribeToNewsletter(email: string): Promise<void> {
	await landingApi.post("/public/newsletter", { email });
}

export async function fetchLandingConfig(): Promise<LandingConfig> {
	const response = await landingApi.get<{ config: LandingConfig }>("/web/config");
	return response.data.config;
}
