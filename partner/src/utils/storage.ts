import type { PartnerRole } from "./constants";

const storageKey = (role: PartnerRole, token: "access" | "refresh") =>
	`digitalsafaris_${role}_${token}_token`;

function setToken(role: PartnerRole, token: "access" | "refresh", value: string, persistent: boolean): void {
	const target = persistent ? localStorage : sessionStorage;
	const other = persistent ? sessionStorage : localStorage;
	target.setItem(storageKey(role, token), value);
	other.removeItem(storageKey(role, token));
}

const storage = {
	getAccessToken(role: PartnerRole): string | null {
		return localStorage.getItem(storageKey(role, "access")) ?? sessionStorage.getItem(storageKey(role, "access"));
	},
	getRefreshToken(role: PartnerRole): string | null {
		return localStorage.getItem(storageKey(role, "refresh")) ?? sessionStorage.getItem(storageKey(role, "refresh"));
	},
	setAccessToken(role: PartnerRole, value: string, persistent = true): void {
		setToken(role, "access", value, persistent);
	},
	setRefreshToken(role: PartnerRole, value: string, persistent = true): void {
		setToken(role, "refresh", value, persistent);
	},
	setSession(role: PartnerRole, accessToken: string, refreshToken: string, persistent = true): void {
		setToken(role, "access", accessToken, persistent);
		setToken(role, "refresh", refreshToken, persistent);
	},
	hasPersistentSession(role: PartnerRole): boolean {
		return localStorage.getItem(storageKey(role, "refresh")) !== null;
	},
	clearRole(role: PartnerRole): void {
		localStorage.removeItem(storageKey(role, "access"));
		localStorage.removeItem(storageKey(role, "refresh"));
		sessionStorage.removeItem(storageKey(role, "access"));
		sessionStorage.removeItem(storageKey(role, "refresh"));
	},
};

export default storage;
