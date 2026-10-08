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

	return <TransportLayout><div className="w-full [&_.page-header]:mb-4 [&_.page-header_h1]:text-[2rem] [&_.page-header_p]:text-[.84rem] max-[760px]:[&_.page-header_h1]:text-[1.65rem]">
		<PageHeader title="Availability & Location" subtitle="Control when transport requests can be assigned and share your current location." />
		<ApiFeedback loading={loading} error={error} />
		{message ? <div className="mb-3 rounded-md border border-[rgba(95,125,93,.2)] bg-[rgba(95,125,93,.08)] px-3 py-2.5 text-[.78rem] text-[#4f704b]" role="status">{message}</div> : null}
		<div className="grid grid-cols-[minmax(0,1.1fr)_minmax(280px,.9fr)] items-start gap-[14px] max-[760px]:grid-cols-1">
			<section className="min-w-0 rounded-md border border-[rgba(130,110,92,.14)] bg-[rgba(255,252,247,.92)] shadow-[0_2px_8px_rgba(36,22,13,.025)] p-4"><div className="flex items-center gap-[11px] border-b border-[var(--border)] pb-[15px] [&>div]:flex-1 [&_h2]:m-0 [&_h2]:font-[Cormorant_Garamond,Georgia,serif] [&_h2]:text-[1.2rem] [&_p]:mt-1 [&_p]:text-[.78rem] [&_p]:leading-[1.5]"><span className={`h-2.5 w-2.5 rounded-full bg-[#a5a098] ${location?.isOnline ? "bg-[#5b8b4d] shadow-[0_0_0_4px_rgba(91,139,77,.12)]" : ""}`} /><div><h2>Driver Status</h2><p>{location?.isOnline ? "Your service is visible to dispatch." : "You are currently not receiving requests."}</p></div><StatusBadge status={location?.isOnline ? "Online" : "Offline"} /></div><div className="flex items-center justify-between gap-[14px] border-b border-[var(--border)] py-[15px] [&>span]:flex [&>span]:flex-col [&>span]:gap-1 [&_strong]:text-[.85rem] [&_strong]:text-[var(--text)] [&_small]:text-[.74rem] [&_small]:text-[var(--text-muted)]"><span><strong>Go online</strong><small>Make yourself available for transport and delivery requests.</small></span><button type="button" className={`h-6 w-[42px] shrink-0 cursor-pointer rounded-full border-0 bg-[#d7d0c7] p-0.5 [&_i]:block [&_i]:h-5 [&_i]:w-5 [&_i]:rounded-full [&_i]:bg-white [&_i]:transition-transform [&_i]:duration-[180ms] ${location?.isOnline ? "bg-[#63845e] [&_i]:translate-x-[18px]" : ""}`} role="switch" aria-checked={Boolean(location?.isOnline)} aria-label="Go online" onClick={() => void setOnline(!location?.isOnline)} disabled={saving}><i /></button></div><div className="flex items-center justify-between gap-[14px] border-b border-[var(--border)] py-[15px] [&>span]:flex [&>span]:flex-col [&>span]:gap-1 [&_strong]:text-[.85rem] [&_strong]:text-[var(--text)] [&_small]:text-[.74rem] [&_small]:text-[var(--text-muted)]"><span><strong>Accept new assignments</strong><small>Pause new requests while remaining online.</small></span><button type="button" className={`h-6 w-[42px] shrink-0 cursor-pointer rounded-full border-0 bg-[#d7d0c7] p-0.5 [&_i]:block [&_i]:h-5 [&_i]:w-5 [&_i]:rounded-full [&_i]:bg-white [&_i]:transition-transform [&_i]:duration-[180ms] ${location?.isAvailable ? "bg-[#63845e] [&_i]:translate-x-[18px]" : ""}`} role="switch" aria-checked={Boolean(location?.isAvailable)} aria-label="Accept new assignments" onClick={() => void setAvailable(!location?.isAvailable)} disabled={saving || !location?.isOnline}><i /></button></div></section>
			<section className="min-w-0 rounded-md border border-[rgba(130,110,92,.14)] bg-[rgba(255,252,247,.92)] shadow-[0_2px_8px_rgba(36,22,13,.025)] p-4"><div className="flex min-h-9 items-center justify-between gap-2 border-b border-[rgba(130,110,92,.1)] px-2.5 [&_h2]:m-0 [&_h2]:text-[.9rem] [&_h2]:font-bold"><h2>Current Location</h2><MapPin size={17} /></div><div className="my-[13px] flex min-h-[125px] flex-col items-center justify-center gap-2 rounded-md bg-[linear-gradient(135deg,rgba(197,138,42,.08),rgba(95,125,93,.08)),repeating-linear-gradient(45deg,#f7f1e8,#f7f1e8_10px,#f3ecdf_10px,#f3ecdf_20px)] text-[.8rem] text-[#8e5c1c]"><MapPin size={26} /><span>{location?.town || "Location not shared"}</span></div><div className="flex justify-between gap-3 py-[7px] text-[.72rem] text-[var(--text-muted)] [&_strong]:text-[var(--text)]"><span>Latitude <strong>{location?.latitude?.toFixed(5) ?? "—"}</strong></span><span>Longitude <strong>{location?.longitude?.toFixed(5) ?? "—"}</strong></span></div><div className="flex justify-between gap-3 py-[7px] text-[.72rem] text-[var(--text-muted)] [&_strong]:text-[var(--text)]"><span>Last update</span><strong>{location?.lastPingAt ? new Date(location.lastPingAt).toLocaleString() : "Not shared yet"}</strong></div><button type="button" className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-md border-0 bg-[#b87317] px-4 py-2 mt-2.5 text-[.8rem] font-semibold text-white hover:bg-[#a66512] disabled:cursor-not-allowed disabled:opacity-60" onClick={shareCurrentLocation} disabled={saving}><Crosshair size={15} /> {saving ? "Updating..." : "Share current location"}</button></section>
			<section className="min-w-0 rounded-md border border-[rgba(130,110,92,.14)] bg-[rgba(255,252,247,.92)] shadow-[0_2px_8px_rgba(36,22,13,.025)] col-span-full p-4 max-[760px]:col-auto [&_h2]:m-0 [&_h2]:font-[Cormorant_Garamond,Georgia,serif] [&_h2]:text-[1.2rem] [&_p]:mt-1 [&_p]:text-[.78rem] [&_p]:leading-[1.5] [&_p]:text-[var(--text-soft)]"><span className="mb-2.5 grid h-[38px] w-[38px] place-items-center rounded-full bg-[#f5e8d3] text-[#895016]"><ShieldCheck size={20} /></span><h2>Location privacy</h2><p>Your location is used while you are online to coordinate active trips and delivery assignments. You can go offline at any time.</p><div className="mt-3 flex items-center gap-[7px] text-[.72rem] text-[var(--text-muted)]"><Radio size={14} /> Location sharing is controlled by your browser permission.</div></section>
		</div>
	</div></TransportLayout>;
}
