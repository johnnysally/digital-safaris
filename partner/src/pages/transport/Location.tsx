import { useEffect, useState } from "react";
import { Crosshair, MapPin, Radio, ShieldCheck } from "lucide-react";
import locationApi from "../../api/transport/locationApi";
import profileApi from "../../api/transport/profileApi";
import { getApiErrorMessage } from "../../api/axios";
import type { DriverLocation } from "../../types";
import { ApiFeedback, PageHeader, StatusBadge } from "../../components/layout/Layout";
import { TransportLayout } from "./Dashboard";

export function AvailabilityPage() {
	const [location, setLocation] = useState<DriverLocation | null>(null);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");
	const [message, setMessage] = useState("");

	useEffect(() => {
		let cancelled = false;
		locationApi.get().then((result) => { if (!cancelled) setLocation(result); }).catch((requestError) => {
			if (!cancelled) setError(getApiErrorMessage(requestError, "Could not load driver availability."));
		}).finally(() => { if (!cancelled) setLoading(false); });
		return () => { cancelled = true; };
	}, []);

	async function setOnline(online: boolean) {
		setSaving(true);
		setError("");
		setMessage("");
		try {
			if (online) await profileApi.goOnline();
			else await profileApi.goOffline();
			const updated = await locationApi.get();
			setLocation(updated);
			setMessage(online ? "You are now online for trip and delivery requests." : "You are now offline.");
		} catch (requestError) {
			setError(getApiErrorMessage(requestError, "Could not update your status."));
		} finally { setSaving(false); }
	}

	async function setAvailable(isAvailable: boolean) {
		setSaving(true);
		setError("");
		setMessage("");
		try {
			await locationApi.setAvailability(isAvailable);
			setLocation((current) => current ? { ...current, isAvailable } : current);
			setMessage(isAvailable ? "You are available for new assignments." : "You are unavailable for new assignments.");
		} catch (requestError) {
			setError(getApiErrorMessage(requestError, "Could not update assignment availability."));
		} finally { setSaving(false); }
	}

	function shareCurrentLocation() {
		if (!navigator.geolocation) {
			setError("Location sharing is not supported by this browser.");
			return;
		}
		setSaving(true);
		setError("");
		navigator.geolocation.getCurrentPosition(async (position) => {
			try {
				const updated = await locationApi.ping({ latitude: position.coords.latitude, longitude: position.coords.longitude, heading: position.coords.heading ?? undefined, speed: position.coords.speed ?? undefined, accuracy: position.coords.accuracy });
				setLocation(updated);
				setMessage("Your current location was shared successfully.");
			} catch (requestError) {
				setError(getApiErrorMessage(requestError, "Could not share your location."));
			} finally { setSaving(false); }
		}, (geoError) => {
			setError(geoError.message || "Location permission is required to share your location.");
			setSaving(false);
		}, { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 });
	}

	return <TransportLayout><div className="transport-page">
		<PageHeader title="Availability & Location" subtitle="Control when transport requests can be assigned and share your current location." />
		<ApiFeedback loading={loading} error={error} />
		{message ? <div className="transport-success-banner" role="status">{message}</div> : null}
		<div className="transport-settings-grid">
			<section className="transport-panel transport-status-panel"><div className="transport-status-heading"><span className={`transport-online-indicator ${location?.isOnline ? "online" : ""}`} /><div><h2>Driver Status</h2><p>{location?.isOnline ? "Your service is visible to dispatch." : "You are currently not receiving requests."}</p></div><StatusBadge status={location?.isOnline ? "Online" : "Offline"} /></div><div className="transport-setting-row"><span><strong>Go online</strong><small>Make yourself available for transport and delivery requests.</small></span><button type="button" className={`transport-toggle ${location?.isOnline ? "on" : ""}`} role="switch" aria-checked={Boolean(location?.isOnline)} aria-label="Go online" onClick={() => void setOnline(!location?.isOnline)} disabled={saving}><i /></button></div><div className="transport-setting-row"><span><strong>Accept new assignments</strong><small>Pause new requests while remaining online.</small></span><button type="button" className={`transport-toggle ${location?.isAvailable ? "on" : ""}`} role="switch" aria-checked={Boolean(location?.isAvailable)} aria-label="Accept new assignments" onClick={() => void setAvailable(!location?.isAvailable)} disabled={saving || !location?.isOnline}><i /></button></div></section>
			<section className="transport-panel transport-location-panel"><div className="transport-panel-heading"><h2>Current Location</h2><MapPin size={17} /></div><div className="transport-location-map"><MapPin size={26} /><span>{location?.town || "Location not shared"}</span></div><div className="transport-coordinate-row"><span>Latitude <strong>{location?.latitude?.toFixed(5) ?? "—"}</strong></span><span>Longitude <strong>{location?.longitude?.toFixed(5) ?? "—"}</strong></span></div><div className="transport-coordinate-row"><span>Last update</span><strong>{location?.lastPingAt ? new Date(location.lastPingAt).toLocaleString() : "Not shared yet"}</strong></div><button type="button" className="primary-button" onClick={shareCurrentLocation} disabled={saving}><Crosshair size={15} /> {saving ? "Updating..." : "Share current location"}</button></section>
			<section className="transport-panel transport-privacy-panel"><span className="transport-privacy-icon"><ShieldCheck size={20} /></span><h2>Location privacy</h2><p>Your location is used while you are online to coordinate active trips and delivery assignments. You can go offline at any time.</p><div><Radio size={14} /> Location sharing is controlled by your browser permission.</div></section>
		</div>
	</div></TransportLayout>;
}
