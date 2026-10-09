import type { LucideIcon } from "lucide-react";
import { BedDouble, CarFront, Hotel, Map, Utensils } from "lucide-react";
import { partnerImages } from "../../config/partnerImages";

export interface LandingService {
	name: string;
	label: string;
	description: string;
	action: string;
	image: string;
	icon: LucideIcon;
	to: string;
	external?: boolean;
}

export const landingServices: LandingService[] = [
	{
		name: "Transport",
		label: "GETTING AROUND",
		description: "Reliable and safe transport for your journeys.",
		action: "Explore Transport",
		image: partnerImages.landing.transport,
		icon: CarFront,
		to: "/partner/transport/login",
	},
	{
		name: "Accommodation",
		label: "STAYS",
		description: "Comfortable stays from hotels to unique lodges.",
		action: "Explore Accommodation",
		image: partnerImages.landing.accommodation,
		icon: BedDouble,
		to: "/partner/accommodation/login",
	},
	{
		name: "Restaurants",
		label: "FOOD & DINING",
		description: "Local and international cuisine at top-rated venues.",
		action: "Explore Restaurants",
		image: partnerImages.landing.dining,
		icon: Utensils,
		to: "/partner/restaurant/login",
	},
	{
		name: "Tours & Activities",
		label: "EXPERIENCES",
		description: "Unforgettable adventures and guided tours.",
		action: "Explore Tours",
		image: partnerImages.landing.experience,
		icon: Map,
		to: "/businesses",
		external: true,
	},
	{
		name: "Hotels",
		label: "STAYS & LODGES",
		description: "Premium and budget-friendly hotels across Kenya.",
		action: "Explore Hotels",
		image: partnerImages.landing.accommodation,
		icon: Hotel,
		to: "/partner/accommodation/rooms",
	},
];

export const destinations = [
	{
		name: "Maasai Mara",
		description: "Wildlife, Nature, Adventure",
		image: partnerImages.landing.hero,
	},
	{
		name: "Nairobi",
		description: "City Life, Culture, Dining",
		image: partnerImages.landing.dining,
	},
	{
		name: "Diani Beach",
		description: "Beaches, Relaxation, Water Sports",
		image: partnerImages.landing.accommodation,
	},
	{
		name: "Mount Kenya",
		description: "Hiking, Nature, Adventure",
		image: partnerImages.landing.experience,
	},
	{
		name: "Lake Naivasha",
		description: "Nature, Wildlife, Boat Rides",
		image: partnerImages.landing.catering,
	},
	{
		name: "Amboseli",
		description: "Wildlife, Kilimanjaro Views",
		image: partnerImages.landing.transport,
	},
];

export const journeyHighlights = [
	{ title: "Plan with confidence", description: "Find the travel services you need in one place." },
	{ title: "Discover local favourites", description: "Explore places and experiences across Kenya." },
	{ title: "Travel your way", description: "Build a journey around the things you love." },
	{ title: "Support local businesses", description: "Connect with the people behind each experience." },
];

export const partnerBenefits = [
	"Access to a large customer base",
	"Easy-to-use partner dashboard",
	"Secure and timely payments",
	"Dedicated partner support",
];
