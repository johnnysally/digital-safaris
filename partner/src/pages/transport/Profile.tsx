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

	return <TransportLayout><div className="w-full [&_.page-header]:mb-4 [&_.page-header_h1]:text-[2rem] [&_.page-header_p]:text-[.84rem] max-[760px]:[&_.page-header_h1]:text-[1.65rem]">
		<PageHeader title="Transport Profile" subtitle="Keep your driver, license, and service information current." />
		<ApiFeedback loading={loading} error={error} onRetry={() => setReload((value) => value + 1)} />
		{message ? <div className="mb-3 rounded-md border border-[rgba(95,125,93,.2)] bg-[rgba(95,125,93,.08)] px-3 py-2.5 text-[.78rem] text-[#4f704b]" role="status">{message}</div> : null}
		<section className="min-w-0 rounded-md border border-[rgba(130,110,92,.14)] bg-[rgba(255,252,247,.92)] shadow-[0_2px_8px_rgba(36,22,13,.025)] mb-[15px] p-4"><div className="flex min-h-9 items-center justify-between gap-2 border-b border-[rgba(130,110,92,.1)] px-2.5 [&_h2]:m-0 [&_h2]:text-[.9rem] [&_h2]:font-bold [&_a]:inline-flex [&_a]:items-center [&_a]:gap-1 [&_a]:whitespace-nowrap [&_a]:text-[.52rem] [&_a]:text-[#925719] [&_a]:no-underline [&>span]:text-[.52rem] [&>span]:text-[#925719]"><div><h2>Driver Profile</h2><small>Partner account and service area</small></div>{profile ? <span className={`inline-flex items-center rounded-full px-[9px] !py-[5px] text-[.65rem] font-bold capitalize ${profile.status === "active" ? "bg-[rgba(95,125,93,.12)] text-[#4f704b]" : profile.status === "pending" ? "bg-[rgba(197,138,42,.13)] text-[#8a5d1f]" : "bg-[#eee8df] text-[#71675d]"}`}>{profile.status}</span> : null}<button type="button" className="relative grid h-11 w-11 place-items-center overflow-hidden rounded-full border-0 bg-[#faecd5] text-[#925719] cursor-pointer [&>img]:h-full [&>img]:w-full [&>img]:object-cover [&>span]:absolute [&>span]:right-0 [&>span]:bottom-0 [&>span]:grid [&>span]:h-[18px] [&>span]:w-[18px] [&>span]:place-items-center [&>span]:rounded-full [&>span]:bg-[#c9821f] [&>span]:text-white" aria-label={uploadingAvatar ? "Uploading profile photo" : "Change profile photo"} onClick={() => avatarInput.current?.click()} disabled={uploadingAvatar || saving}>{profile?.avatar ? <img src={profile.avatar} alt="Transport profile" /> : <UserRound size={22} />}<span><Camera size={12} /></span></button><input ref={avatarInput} className="sr-only" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => { const file = event.currentTarget.files?.[0]; event.currentTarget.value = ""; void uploadAvatar(file); }} /></div>
			{profile ? <form key={profile.updatedAt} onSubmit={(event) => void saveProfile(event)}><div className="grid grid-cols-2 gap-[14px] max-[760px]:grid-cols-1">
				<label className="flex min-w-0 flex-col gap-[5px] text-[.78rem] font-semibold text-[var(--text)] [&_input]:min-h-10 [&_input]:rounded-md [&_input]:border [&_input]:border-[var(--border)] [&_input]:bg-[var(--surface)] [&_input]:px-3 [&_input]:py-[.62rem] [&_input]:text-[.82rem] [&_select]:min-h-10 [&_select]:rounded-md [&_select]:border [&_select]:border-[var(--border)] [&_select]:bg-[var(--surface)] [&_select]:px-3 [&_select]:py-[.62rem] [&_select]:text-[.82rem] [&>span]:text-[.75rem]"><span>First name</span><input name="firstName" required defaultValue={profile.firstName} /></label>
				<label className="flex min-w-0 flex-col gap-[5px] text-[.78rem] font-semibold text-[var(--text)] [&_input]:min-h-10 [&_input]:rounded-md [&_input]:border [&_input]:border-[var(--border)] [&_input]:bg-[var(--surface)] [&_input]:px-3 [&_input]:py-[.62rem] [&_input]:text-[.82rem] [&_select]:min-h-10 [&_select]:rounded-md [&_select]:border [&_select]:border-[var(--border)] [&_select]:bg-[var(--surface)] [&_select]:px-3 [&_select]:py-[.62rem] [&_select]:text-[.82rem] [&>span]:text-[.75rem]"><span>Last name</span><input name="lastName" required defaultValue={profile.lastName} /></label>
				<label className="flex min-w-0 flex-col gap-[5px] text-[.78rem] font-semibold text-[var(--text)] [&_input]:min-h-10 [&_input]:rounded-md [&_input]:border [&_input]:border-[var(--border)] [&_input]:bg-[var(--surface)] [&_input]:px-3 [&_input]:py-[.62rem] [&_input]:text-[.82rem] [&_select]:min-h-10 [&_select]:rounded-md [&_select]:border [&_select]:border-[var(--border)] [&_select]:bg-[var(--surface)] [&_select]:px-3 [&_select]:py-[.62rem] [&_select]:text-[.82rem] [&>span]:text-[.75rem]"><span>Email address</span><input type="email" value={profile.email} readOnly aria-readonly="true" /></label>
				<label className="flex min-w-0 flex-col gap-[5px] text-[.78rem] font-semibold text-[var(--text)] [&_input]:min-h-10 [&_input]:rounded-md [&_input]:border [&_input]:border-[var(--border)] [&_input]:bg-[var(--surface)] [&_input]:px-3 [&_input]:py-[.62rem] [&_input]:text-[.82rem] [&_select]:min-h-10 [&_select]:rounded-md [&_select]:border [&_select]:border-[var(--border)] [&_select]:bg-[var(--surface)] [&_select]:px-3 [&_select]:py-[.62rem] [&_select]:text-[.82rem] [&>span]:text-[.75rem]"><span>Phone</span><input name="phone" type="tel" required defaultValue={profile.phone} /></label>
				<label className="flex min-w-0 flex-col gap-[5px] text-[.78rem] font-semibold text-[var(--text)] [&_input]:min-h-10 [&_input]:rounded-md [&_input]:border [&_input]:border-[var(--border)] [&_input]:bg-[var(--surface)] [&_input]:px-3 [&_input]:py-[.62rem] [&_input]:text-[.82rem] [&_select]:min-h-10 [&_select]:rounded-md [&_select]:border [&_select]:border-[var(--border)] [&_select]:bg-[var(--surface)] [&_select]:px-3 [&_select]:py-[.62rem] [&_select]:text-[.82rem] [&>span]:text-[.75rem]"><span>Country code</span><select name="countryCode" defaultValue={profile.countryCode}>{!countryCodes.some(({ value }) => value === profile.countryCode) ? <option value={profile.countryCode}>{profile.countryCode}</option> : null}{countryCodes.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}</select></label>
				<label className="flex min-w-0 flex-col gap-[5px] text-[.78rem] font-semibold text-[var(--text)] [&_input]:min-h-10 [&_input]:rounded-md [&_input]:border [&_input]:border-[var(--border)] [&_input]:bg-[var(--surface)] [&_input]:px-3 [&_input]:py-[.62rem] [&_input]:text-[.82rem] [&_select]:min-h-10 [&_select]:rounded-md [&_select]:border [&_select]:border-[var(--border)] [&_select]:bg-[var(--surface)] [&_select]:px-3 [&_select]:py-[.62rem] [&_select]:text-[.82rem] [&>span]:text-[.75rem]"><span>Government ID</span><input value={profile.idNumber} readOnly aria-readonly="true" /></label>
				<label className="flex min-w-0 flex-col gap-[5px] text-[.78rem] font-semibold text-[var(--text)] [&_input]:min-h-10 [&_input]:rounded-md [&_input]:border [&_input]:border-[var(--border)] [&_input]:bg-[var(--surface)] [&_input]:px-3 [&_input]:py-[.62rem] [&_input]:text-[.82rem] [&_select]:min-h-10 [&_select]:rounded-md [&_select]:border [&_select]:border-[var(--border)] [&_select]:bg-[var(--surface)] [&_select]:px-3 [&_select]:py-[.62rem] [&_select]:text-[.82rem] [&>span]:text-[.75rem]"><span>License number</span><input name="licenseNumber" defaultValue={profile.licenseNumber ?? ""} /></label>
				<label className="flex min-w-0 flex-col gap-[5px] text-[.78rem] font-semibold text-[var(--text)] [&_input]:min-h-10 [&_input]:rounded-md [&_input]:border [&_input]:border-[var(--border)] [&_input]:bg-[var(--surface)] [&_input]:px-3 [&_input]:py-[.62rem] [&_input]:text-[.82rem] [&_select]:min-h-10 [&_select]:rounded-md [&_select]:border [&_select]:border-[var(--border)] [&_select]:bg-[var(--surface)] [&_select]:px-3 [&_select]:py-[.62rem] [&_select]:text-[.82rem] [&>span]:text-[.75rem]"><span>License expiry</span><input name="licenseExpiry" type="date" defaultValue={profile.licenseExpiry?.slice(0, 10) ?? ""} /></label>
				<label className="flex min-w-0 flex-col gap-[5px] text-[.78rem] font-semibold text-[var(--text)] [&_input]:min-h-10 [&_input]:rounded-md [&_input]:border [&_input]:border-[var(--border)] [&_input]:bg-[var(--surface)] [&_input]:px-3 [&_input]:py-[.62rem] [&_input]:text-[.82rem] [&_select]:min-h-10 [&_select]:rounded-md [&_select]:border [&_select]:border-[var(--border)] [&_select]:bg-[var(--surface)] [&_select]:px-3 [&_select]:py-[.62rem] [&_select]:text-[.82rem] [&>span]:text-[.75rem]"><span>Town / city</span><input name="town" required defaultValue={profile.town} /></label>
				<label className="flex min-w-0 flex-col gap-[5px] text-[.78rem] font-semibold text-[var(--text)] [&_input]:min-h-10 [&_input]:rounded-md [&_input]:border [&_input]:border-[var(--border)] [&_input]:bg-[var(--surface)] [&_input]:px-3 [&_input]:py-[.62rem] [&_input]:text-[.82rem] [&_select]:min-h-10 [&_select]:rounded-md [&_select]:border [&_select]:border-[var(--border)] [&_select]:bg-[var(--surface)] [&_select]:px-3 [&_select]:py-[.62rem] [&_select]:text-[.82rem] [&>span]:text-[.75rem] col-span-2 max-[760px]:col-span-1"><span>Address</span><input name="address" defaultValue={profile.address ?? ""} /></label>
				<fieldset className="col-span-2 max-[760px]:col-span-1 col-span-2 max-[760px]:col-span-1"><legend>Transport services <small>Select all that apply</small></legend><div>{transportServices.map(({ value, label }) => <label key={value}><input type="checkbox" name="serviceTypes" value={value} defaultChecked={profile.serviceTypes.includes(value)} />{label}</label>)}</div></fieldset>
			</div><div className="mt-4 flex items-center gap-3 justify-end"><span className="mr-auto text-[.7rem] text-[var(--text-muted)]">Profile details are private to your partner account.</span><button type="submit" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border-0 bg-[#b87317] px-4 py-2 text-[.8rem] font-semibold text-white hover:bg-[#a66512] disabled:cursor-not-allowed disabled:opacity-60" disabled={saving || uploadingAvatar}>{saving ? "Saving..." : "Save Profile"}</button></div></form> : null}
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

	return <TransportLayout><div className="w-full [&_.page-header]:mb-4 [&_.page-header_h1]:text-[2rem] [&_.page-header_p]:text-[.84rem] max-[760px]:[&_.page-header_h1]:text-[1.65rem]">
		<PageHeader title="Transport Settings" subtitle="Manage dashboard preferences and security information." />
		{error ? <div className="mb-3 rounded-[7px] border border-[rgba(168,92,82,.22)] bg-[rgba(168,92,82,.08)] px-3 py-2.5 text-[.73rem] leading-[1.45] text-[#8e453e]" role="alert">{error}</div> : null}
		<section className="min-w-0 rounded-md border border-[rgba(130,110,92,.14)] bg-[rgba(255,252,247,.92)] shadow-[0_2px_8px_rgba(36,22,13,.025)] mb-[14px] px-[14px] pb-[14px]"><div className="flex min-h-9 items-center justify-between gap-2 border-b border-[rgba(130,110,92,.1)] px-2.5 [&_h2]:m-0 [&_h2]:text-[.9rem] [&_h2]:font-bold [&_a]:inline-flex [&_a]:items-center [&_a]:gap-1 [&_a]:whitespace-nowrap [&_a]:text-[.52rem] [&_a]:text-[#925719] [&_a]:no-underline [&>span]:text-[.52rem] [&>span]:text-[#925719]"><div><h2>Notification Preferences</h2><small>These preferences are stored in this browser only.</small></div></div>
			<div className="last:[&>div]:border-0">{([
				["tripUpdates", "Trip updates", "Booking requests, trip changes and customer check-in details."],
				["deliveryUpdates", "Delivery job updates", "New assignments and delivery status reminders."],
				["payoutUpdates", "Payout activity", "Payout confirmations and payment status changes."],
				["customerRatings", "Customer ratings", "New reviews and rating updates."],
				["weeklySummary", "Weekly summary", "Keep a weekly activity summary preference on this device."],
			] as const).map(([key, title, detail]) => <div className="flex items-center justify-between gap-[14px] border-b border-[var(--border)] py-[15px] [&>span]:flex [&>span]:flex-col [&>span]:gap-1 [&_strong]:text-[.85rem] [&_strong]:text-[var(--text)] [&_small]:text-[.74rem] [&_small]:text-[var(--text-muted)]" key={key}><span><strong>{title}</strong><small>{detail}</small></span><button type="button" className={`h-6 w-[42px] shrink-0 cursor-pointer rounded-full border-0 bg-[#d7d0c7] p-0.5 [&_i]:block [&_i]:h-5 [&_i]:w-5 [&_i]:rounded-full [&_i]:bg-white [&_i]:transition-transform [&_i]:duration-[180ms] ${preferences[key] ? "bg-[#63845e] [&_i]:translate-x-[18px]" : ""}`} role="switch" aria-checked={preferences[key]} aria-label={title} onClick={() => togglePreference(key)}><i /></button></div>)}</div>
			<div className="mt-4 flex items-center gap-3 justify-end"><span className="mr-auto text-[.7rem] text-[var(--text-muted)]">{saved ? "Saved on this browser." : "Preferences do not sync to other devices."}</span><button type="button" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border-0 bg-[#b87317] px-4 py-2 text-[.8rem] font-semibold text-white hover:bg-[#a66512] disabled:cursor-not-allowed disabled:opacity-60" onClick={savePreferences}>Save Preferences</button></div>
		</section>
		<section className="min-w-0 rounded-md border border-[rgba(130,110,92,.14)] bg-[rgba(255,252,247,.92)] shadow-[0_2px_8px_rgba(36,22,13,.025)] mb-[14px] px-[14px] pb-[14px]"><div className="flex min-h-9 items-center justify-between gap-2 border-b border-[rgba(130,110,92,.1)] px-2.5 [&_h2]:m-0 [&_h2]:text-[.9rem] [&_h2]:font-bold [&_a]:inline-flex [&_a]:items-center [&_a]:gap-1 [&_a]:whitespace-nowrap [&_a]:text-[.52rem] [&_a]:text-[#925719] [&_a]:no-underline [&>span]:text-[.52rem] [&>span]:text-[#925719]"><div><h2>Account Security</h2><small>Account security actions available from this portal.</small></div></div><div className="flex items-start gap-3 pt-[14px] [&>svg]:shrink-0 [&>svg]:text-[#925719] [&_strong]:text-[.8rem] [&_p]:mt-[5px] [&_p]:text-[.74rem] [&_p]:leading-[1.5]"><ShieldCheck /><div><strong>Partner authentication</strong><p>Your account is protected by your transport partner sign-in session. Password changes and session management are not available in this portal yet.</p><Link to="/partner/transport/profile" className="mt-[9px] inline-flex text-[.72rem] font-semibold text-[#a9600d] no-underline hover:underline">Review your profile</Link></div></div></section>
	</div></TransportLayout>;
}
