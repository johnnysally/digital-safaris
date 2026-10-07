import type { PartnerRole } from "./constants";

const storageKey = (role: PartnerRole, token: "access" | "refresh") =>
	`digitalsafaris_${role}_${token}_token`;

const storage = {
	getAccessToken(role: PartnerRole): string | null {
		return localStorage.getItem(storageKey(role, "access")) ?? sessionStorage.getItem(storageKey(role, "access"));
	},
	getRefreshToken(role: PartnerRole): string | null {
		return localStorage.getItem(storageKey(role, "refresh")) ?? sessionStorage.getItem(storageKey(role, "refresh"));
	},
	setAccessToken(role: PartnerRole, value: string, persistent = true): void {
		const target = persistent ? localStorage : sessionStorage;
		const other = persistent ? sessionStorage : localStorage;
		target.setItem(storageKey(role, "access"), value);
		other.removeItem(storageKey(role, "access"));
	},
	setRefreshToken(role: PartnerRole, value: string, persistent = true): void {
		const target = persistent ? localStorage : sessionStorage;
		const other = persistent ? sessionStorage : localStorage;
		target.setItem(storageKey(role, "refresh"), value);
		other.removeItem(storageKey(role, "refresh"));
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
