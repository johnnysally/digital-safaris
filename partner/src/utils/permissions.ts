import type { PartnerRole } from "./constants";

export type PartnerSessions = Record<PartnerRole, boolean>;

export function canAccessPartnerPortal(sessions: PartnerSessions, requiredRole: PartnerRole): boolean {
	return sessions[requiredRole] === true;
}