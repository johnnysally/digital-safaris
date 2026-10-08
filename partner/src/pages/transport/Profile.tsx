import { useEffect, useRef, useState, type FormEvent } from "react";
import { Camera, ShieldCheck, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import profileApi from "../../api/transport/profileApi";
import { getApiErrorMessage } from "../../api/axios";
import type { TransportPartner } from "../../types";
import { ApiFeedback, PageHeader } from "../../components/layout/Layout";
import { TransportLayout } from "./Dashboard";

const countryCodes = [
	{ value: "+254", label: "Kenya (+254)" },
	{ value: "+255", label: "Tanzania (+255)" },
	{ value: "+256", label: "Uganda (+256)" },
	{ value: "+250", label: "Rwanda (+250)" },
	{ value: "+251", label: "Ethiopia (+251)" },
	{ value: "+27", label: "South Africa (+27)" },
	{ value: "+1", label: "United States / Canada (+1)" },
	{ value: "+44", label: "United Kingdom (+44)" },
];

const transportServices = [
	{ value: "bike", label: "Motorbike" },
	{ value: "car", label: "Car / Taxi" },
	{ value: "van", label: "Van" },
	{ value: "truck", label: "Truck" },
	{ value: "bus", label: "Bus / Shuttle" },
	{ value: "boat", label: "Boat" },
];

export function TransportProfilePage() {
	const [profile, setProfile] = useState<TransportPartner | null>(null);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");
	const [message, setMessage] = useState("");
	const [uploadingAvatar, setUploadingAvatar] = useState(false);
	const [reload, setReload] = useState(0);
	const avatarInput = useRef<HTMLInputElement>(null);

	useEffect(() => {
		let cancelled = false;
		setLoading(true);
		setError("");
		profileApi.get().then(({ partner }) => { if (!cancelled) setProfile(partner); }).catch((requestError) => {
			if (!cancelled) setError(getApiErrorMessage(requestError, "Could not load transport profile."));
		}).finally(() => { if (!cancelled) setLoading(false); });
		return () => { cancelled = true; };
	}, [reload]);

	async function saveProfile(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const values = new FormData(event.currentTarget);
		const selectedServices = values.getAll("serviceTypes").map(String);
		if (selectedServices.length === 0) {
			setError("Choose at least one transport service.");
			setMessage("");
			return;
		}
		setSaving(true);
		setError("");
		setMessage("");
		try {
			const updated = await profileApi.update({
				firstName: String(values.get("firstName") ?? "").trim(),
				lastName: String(values.get("lastName") ?? "").trim(),
				phone: String(values.get("phone") ?? "").trim(),
				countryCode: String(values.get("countryCode") ?? ""),
				licenseNumber: String(values.get("licenseNumber") ?? "").trim() || null,
				licenseExpiry: String(values.get("licenseExpiry") ?? "") || null,
				town: String(values.get("town") ?? "").trim(),
				address: String(values.get("address") ?? "").trim() || null,
				serviceTypes: selectedServices,
			});
			setProfile(updated);
			setMessage("Transport profile saved.");
		} catch (requestError) {
			setError(getApiErrorMessage(requestError, "Could not save transport profile."));
		} finally { setSaving(false); }
	}

	async function uploadAvatar(file?: File) {
		if (!file) return;
		if (!file.type.startsWith("image/")) {
			setError("Choose an image file for your profile photo.");
			setMessage("");
			return;
		}
		if (file.size > 5 * 1024 * 1024) {
			setError("Profile photos must be 5 MB or smaller.");
			setMessage("");
			return;
		}
		setUploadingAvatar(true);
		setError("");
		setMessage("");
		try {
			const result = await profileApi.uploadAvatar(file);
			setProfile((current) => current ? { ...current, avatar: result.avatar } : current);
			setMessage("Profile photo updated.");
		} catch (requestError) {
			setError(getApiErrorMessage(requestError, "Could not upload profile photo."));
		} finally { setUploadingAvatar(false); }
	}

	return <TransportLayout><div className="transport-page">
		<PageHeader title="Transport Profile" subtitle="Keep your driver, license, and service information current." />
		<ApiFeedback loading={loading} error={error} onRetry={() => setReload((value) => value + 1)} />
		{message ? <div className="transport-success-banner" role="status">{message}</div> : null}
		<section className="transport-panel transport-profile-panel"><div className="transport-panel-heading"><div><h2>Driver Profile</h2><small>Partner account and service area</small></div>{profile ? <span className={`transport-partner-status ${profile.status}`}>{profile.status}</span> : null}<button type="button" className="transport-avatar-upload" aria-label={uploadingAvatar ? "Uploading profile photo" : "Change profile photo"} onClick={() => avatarInput.current?.click()} disabled={uploadingAvatar || saving}>{profile?.avatar ? <img src={profile.avatar} alt="Transport profile" /> : <UserRound size={22} />}<span><Camera size={12} /></span></button><input ref={avatarInput} className="visually-hidden" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => { const file = event.currentTarget.files?.[0]; event.currentTarget.value = ""; void uploadAvatar(file); }} /></div>
			{profile ? <form key={profile.updatedAt} onSubmit={(event) => void saveProfile(event)}><div className="transport-form-grid">
				<label className="field-label"><span>First name</span><input name="firstName" required defaultValue={profile.firstName} /></label>
				<label className="field-label"><span>Last name</span><input name="lastName" required defaultValue={profile.lastName} /></label>
				<label className="field-label"><span>Email address</span><input type="email" value={profile.email} readOnly aria-readonly="true" /></label>
				<label className="field-label"><span>Phone</span><input name="phone" type="tel" required defaultValue={profile.phone} /></label>
				<label className="field-label"><span>Country code</span><select name="countryCode" defaultValue={profile.countryCode}>{!countryCodes.some(({ value }) => value === profile.countryCode) ? <option value={profile.countryCode}>{profile.countryCode}</option> : null}{countryCodes.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}</select></label>
				<label className="field-label"><span>Government ID</span><input value={profile.idNumber} readOnly aria-readonly="true" /></label>
				<label className="field-label"><span>License number</span><input name="licenseNumber" defaultValue={profile.licenseNumber ?? ""} /></label>
				<label className="field-label"><span>License expiry</span><input name="licenseExpiry" type="date" defaultValue={profile.licenseExpiry?.slice(0, 10) ?? ""} /></label>
				<label className="field-label"><span>Town / city</span><input name="town" required defaultValue={profile.town} /></label>
				<label className="field-label field-span-2"><span>Address</span><input name="address" defaultValue={profile.address ?? ""} /></label>
				<fieldset className="transport-profile-services field-span-2"><legend>Transport services <small>Select all that apply</small></legend><div>{transportServices.map(({ value, label }) => <label key={value}><input type="checkbox" name="serviceTypes" value={value} defaultChecked={profile.serviceTypes.includes(value)} />{label}</label>)}</div></fieldset>
			</div><div className="form-actions right-align"><span className="transport-settings-save-note">Profile details are private to your partner account.</span><button type="submit" className="primary-button" disabled={saving || uploadingAvatar}>{saving ? "Saving..." : "Save Profile"}</button></div></form> : null}
		</section>
	</div></TransportLayout>;
}

interface TransportPreferences {
	tripUpdates: boolean;
	deliveryUpdates: boolean;
	payoutUpdates: boolean;
	customerRatings: boolean;
	weeklySummary: boolean;
}

const transportPreferenceKey = "digitalsafaris_transport_preferences";
const defaultTransportPreferences: TransportPreferences = { tripUpdates: true, deliveryUpdates: true, payoutUpdates: true, customerRatings: true, weeklySummary: false };

function loadTransportPreferences(): { preferences: TransportPreferences; error: string } {
	try {
		const stored = window.localStorage.getItem(transportPreferenceKey);
		if (!stored) return { preferences: defaultTransportPreferences, error: "" };
		const parsed: unknown = JSON.parse(stored);
		if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
			throw new Error("Saved notification preferences are invalid.");
		}
		const values = parsed as Partial<TransportPreferences>;
		const keys = Object.keys(defaultTransportPreferences) as Array<keyof TransportPreferences>;
		if (keys.some((key) => values[key] !== undefined && typeof values[key] !== "boolean")) {
			throw new Error("Saved notification preferences are invalid.");
		}
		return { preferences: { ...defaultTransportPreferences, ...values }, error: "" };
	} catch (loadError) {
		const message = loadError instanceof Error && loadError.message === "Saved notification preferences are invalid."
			? loadError.message
			: "Could not read notification preferences from this browser.";
		return { preferences: defaultTransportPreferences, error: message };
	}
}

export function TransportSettingsPage() {
	const [initialSettings] = useState(loadTransportPreferences);
	const [preferences, setPreferences] = useState(initialSettings.preferences);
	const [saved, setSaved] = useState(false);
	const [error, setError] = useState(initialSettings.error);

	function togglePreference(key: keyof TransportPreferences) {
		setPreferences((current) => ({ ...current, [key]: !current[key] }));
		setSaved(false);
		setError("");
	}

	function savePreferences() {
		setError("");
		try {
			window.localStorage.setItem(transportPreferenceKey, JSON.stringify(preferences));
			setSaved(true);
		} catch {
			setSaved(false);
			setError("Could not save preferences in this browser. Check your browser storage settings and try again.");
		}
	}

	return <TransportLayout><div className="transport-page">
		<PageHeader title="Transport Settings" subtitle="Manage dashboard preferences and security information." />
		{error ? <div className="transport-settings-error" role="alert">{error}</div> : null}
		<section className="transport-panel transport-settings-panel"><div className="transport-panel-heading"><div><h2>Notification Preferences</h2><small>These preferences are stored in this browser only.</small></div></div>
			<div className="transport-settings-list">{([
				["tripUpdates", "Trip updates", "Booking requests, trip changes and customer check-in details."],
				["deliveryUpdates", "Delivery job updates", "New assignments and delivery status reminders."],
				["payoutUpdates", "Payout activity", "Payout confirmations and payment status changes."],
				["customerRatings", "Customer ratings", "New reviews and rating updates."],
				["weeklySummary", "Weekly summary", "Keep a weekly activity summary preference on this device."],
			] as const).map(([key, title, detail]) => <div className="transport-setting-row" key={key}><span><strong>{title}</strong><small>{detail}</small></span><button type="button" className={`transport-toggle ${preferences[key] ? "on" : ""}`} role="switch" aria-checked={preferences[key]} aria-label={title} onClick={() => togglePreference(key)}><i /></button></div>)}</div>
			<div className="form-actions right-align"><span className="transport-settings-save-note">{saved ? "Saved on this browser." : "Preferences do not sync to other devices."}</span><button type="button" className="primary-button" onClick={savePreferences}>Save Preferences</button></div>
		</section>
		<section className="transport-panel transport-settings-panel"><div className="transport-panel-heading"><div><h2>Account Security</h2><small>Account security actions available from this portal.</small></div></div><div className="transport-security-note"><ShieldCheck /><div><strong>Partner authentication</strong><p>Your account is protected by your transport partner sign-in session. Password changes and session management are not available in this portal yet.</p><Link to="/partner/transport/profile" className="transport-profile-link">Review your profile</Link></div></div></section>
	</div></TransportLayout>;
}
