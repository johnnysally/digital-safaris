export type PartnerRole = "accommodation" | "restaurant" | "transport";

export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

export const partnerImages = {
	sidebarSafari:
		"https://images.unsplash.com/photo-1516426122078-c23e76319888?auto=format&fit=crop&w=900&q=85",
	loginHero:
		"https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=2200&q=90",
	supportBanner:
		"https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=1800&q=85",
	serengetiLodge:
		"https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=1200&q=85",
	lakeViewResort:
		"https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=85",
	lodgeRoom:
		"https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1200&q=85",
} as const;
