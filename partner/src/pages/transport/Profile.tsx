import { useEffect, useRef, useState, type FormEvent } from "react";
import { Bike, BusFront, Camera, CarFront, Ship, ShieldCheck, Truck, UserRound } from "lucide-react";
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
	{ value: "bike", label: "Motorbike", detail: "Quick trips and light deliveries", icon: Bike },
	{ value: "car", label: "Car / Taxi", detail: "Private transfers and everyday rides", icon: CarFront },
	{ value: "van", label: "Van", detail: "Group transfers and extra luggage", icon: Truck },
	{ value: "truck", label: "Truck", detail: "Freight and heavy cargo", icon: Truck },
	{ value: "bus", label: "Bus / Shuttle", detail: "Scheduled routes and group travel", icon: BusFront },
	{ value: "boat", label: "Boat", detail: "Water transfers and excursions", icon: Ship },
];

export function TransportProfilePage() {
	const [profile, setProfile] = useState<TransportPartner | null>(null);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");
	const [message, setMessage] = useState("");
	const [uploadingAvatar, setUploadingAvatar] = useState(false);
	const [selectedServices, setSelectedServices] = useState<string[]>([]);
	const [reload, setReload] = useState(0);
	const avatarInput = useRef<HTMLInputElement>(null);

	useEffect(() => {
		let cancelled = false;
		setLoading(true);
		setError("");
		profileApi.get().then(({ partner }) => {
			if (!cancelled) {
				setProfile(partner);
				setSelectedServices(partner.serviceTypes);
			}
		}).catch((requestError) => {
			if (!cancelled) setError(getApiErrorMessage(requestError, "Could not load transport profile."));
		}).finally(() => { if (!cancelled) setLoading(false); });
		return () => { cancelled = true; };
	}, [reload]);

	async function saveProfile(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const values = new FormData(event.currentTarget);
		const submittedServices = values.getAll("serviceTypes").map(String);
		if (submittedServices.length === 0) {
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
				serviceTypes: submittedServices,
			});
			setProfile(updated);
			setSelectedServices(updated.serviceTypes);
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

	return <TransportLayout><div className="w-full [&_.page-header]:mb-6 [&_.page-header_h1]:text-3xl [&_.page-header_p]:text-base [&_label]:text-sm [&_input]:text-base [&_select]:text-base [&_small]:text-sm">
		<PageHeader title="Transport Profile" subtitle="Keep your driver, license, and service information current." />
		<ApiFeedback loading={loading} error={error} onRetry={() => setReload((value) => value + 1)} />
		{message ? <div className="mb-3 rounded-md border border-[rgba(95,125,93,.2)] bg-[rgba(95,125,93,.08)] px-3 py-2.5 text-[.78rem] text-[#4f704b]" role="status">{message}</div> : null}
		{profile ? <section className="mb-5 flex flex-wrap items-center gap-5 rounded-2xl border border-[#eadfd1] bg-gradient-to-r from-[#fffaf3] via-[#fff8ed] to-[#f4e6d0] p-6 shadow-[0_8px_24px_rgba(69,43,22,.05)] max-[520px]:p-4">
			<div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-2xl bg-[#f2dfc2] text-[#8a541c] shadow-inner">{profile.avatar ? <img className="h-full w-full object-cover" src={profile.avatar} alt="" /> : <UserRound size={30} aria-hidden="true" />}</div>
			<div className="min-w-0 flex-1">
				<div className="flex flex-wrap items-center gap-3"><h2 className="m-0 text-2xl font-semibold tracking-tight text-[#34271e]">{profile.firstName} {profile.lastName}</h2><span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${profile.status === "active" ? "bg-[#e4f1e3] text-[#3f7047]" : profile.status === "pending" ? "bg-[#fbefd9] text-[#946118]" : "bg-[#eee8df] text-[#71675d]"}`}>{profile.status} account</span></div>
				<p className="mb-0 mt-2 text-sm text-[#6e5c4c]">{profile.serviceTypes.length ? profile.serviceTypes.map((service) => transportServices.find((item) => item.value === service)?.label ?? service).join(" · ") : "Add the transport services you provide."}</p>
				<div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[#806c58]"><span className="inline-flex items-center gap-2"><ShieldCheck size={15} /> Partner account</span><span>{profile.town}</span><span>{profile.phone}</span></div>
			</div>
		</section> : null}
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
				<fieldset className="col-span-2 min-w-0 rounded-2xl border border-[#eadfd1] bg-[#fffaf3] p-5 max-[760px]:col-span-1 max-[520px]:p-4">
					<legend className="px-1 text-base font-semibold text-[#34271e]">Transport services</legend>
					<div className="mb-4 flex flex-wrap items-center justify-between gap-2">
						<p className="m-0 text-sm leading-relaxed text-[#786a5b]">Select every service you offer. You can update this list whenever your fleet changes.</p>
						<span className="rounded-full bg-[#f2e2c9] px-3 py-1 text-xs font-semibold text-[#87531d]" aria-live="polite">{selectedServices.length} selected</span>
					</div>
					<div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,13rem),1fr))] gap-3">
						{transportServices.map(({ value, label, detail, icon: ServiceIcon }) => {
							const isSelected = selectedServices.includes(value);
							return <label key={value} className={`group flex min-h-[112px] cursor-pointer items-start gap-3 rounded-xl border p-4 transition duration-150 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#a85f19] ${isSelected ? "border-[#c9821f] bg-[#fff1d9] shadow-[0_4px_12px_rgba(168,95,25,.09)]" : "border-[#eadfd1] bg-white hover:border-[#d7b783] hover:bg-[#fffdf9]"}`}>
								<span className={`grid size-11 shrink-0 place-items-center rounded-xl transition-colors ${isSelected ? "bg-[#a85f19] text-white" : "bg-[#f7eee1] text-[#87531d] group-hover:bg-[#f2e2c9]"}`}><ServiceIcon size={21} aria-hidden="true" /></span>
								<span className="min-w-0 flex-1 pt-0.5">
									<span className="flex items-center justify-between gap-2">
										<span className="text-sm font-semibold text-[#34271e]">{label}</span>
										<input className="size-4 shrink-0 accent-[#a85f19]" type="checkbox" name="serviceTypes" value={value} checked={isSelected} onChange={() => setSelectedServices((current) => isSelected ? current.filter((service) => service !== value) : [...current, value])} />
									</span>
									<span className="mt-1 block text-xs leading-relaxed text-[#817365]">{detail}</span>
								</span>
							</label>;
						})}
					</div>
				</fieldset>
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

	return <TransportLayout><div className="grid w-full gap-5 [&_.page-header]:mb-1 [&_.page-header_h1]:text-3xl [&_.page-header_p]:text-base [&_button]:text-sm [&_small]:text-sm">
		<PageHeader title="Transport Settings" subtitle="Personalize your updates and review account protection." />
		<div className="flex flex-wrap items-center gap-4 rounded-2xl border border-[#eadfd1] bg-gradient-to-r from-[#fffaf3] to-[#f6e8d4] p-5 shadow-[0_5px_18px_rgba(69,43,22,.035)]">
			<span className="grid size-12 shrink-0 place-items-center rounded-xl bg-[#f2dfc2] text-[#8a541c]"><ShieldCheck size={23} /></span>
			<div className="min-w-0 flex-1"><h2 className="m-0 text-lg font-semibold text-[#34271e]">Your preferences, your way</h2><p className="mb-0 mt-1 text-sm text-[#786a5b]">Choose which activity matters most. These choices are saved on this device.</p></div>
			<span className="rounded-full bg-white/80 px-3 py-1.5 text-xs font-semibold text-[#87531d]">Device-specific settings</span>
		</div>
		{error ? <div className="rounded-xl border border-[rgba(168,92,82,.22)] bg-[rgba(168,92,82,.08)] px-4 py-3 text-sm leading-relaxed text-[#8e453e]" role="alert">{error}</div> : null}
		<section className="min-w-0 overflow-hidden rounded-2xl border border-[#eadfd1] bg-[#fffdf9] shadow-[0_6px_22px_rgba(69,43,22,.04)]">
			<div className="border-b border-[#efe5d9] px-6 py-5 max-[520px]:px-4"><p className="mb-1 text-xs font-semibold uppercase tracking-[.12em] text-[#9a672d]">Stay up to date</p><h2 className="m-0 text-xl font-semibold text-[#34271e]">Notification preferences</h2><p className="mb-0 mt-1 text-sm text-[#817365]">Updates are a local preference and do not change server-side delivery.</p></div>
			<div className="px-6 max-[520px]:px-4 last:[&>div]:border-0">{([
				["tripUpdates", "Trip updates", "Booking requests, trip changes and customer check-in details."],
				["deliveryUpdates", "Delivery job updates", "New assignments and delivery status reminders."],
				["payoutUpdates", "Payout activity", "Payout confirmations and payment status changes."],
				["customerRatings", "Customer ratings", "New reviews and rating updates."],
				["weeklySummary", "Weekly summary", "Keep a weekly activity summary preference on this device."],
			] as const).map(([key, title, detail]) => <div className="flex items-center justify-between gap-5 border-b border-[#f0e8de] py-5 [&>span]:flex [&>span]:flex-col [&>span]:gap-1.5 [&_strong]:text-base [&_strong]:font-semibold [&_strong]:text-[#34271e] [&_small]:text-sm [&_small]:leading-relaxed [&_small]:text-[#817365]" key={key}><span><strong>{title}</strong><small>{detail}</small></span><button type="button" className={`relative h-7 w-12 shrink-0 cursor-pointer rounded-full border-0 p-1 transition-colors ${preferences[key] ? "bg-[#a85f19]" : "bg-[#d7d0c7]"}`} role="switch" aria-checked={preferences[key]} aria-label={title} onClick={() => togglePreference(key)}><i className={`block size-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${preferences[key] ? "translate-x-5" : "translate-x-0"}`} /></button></div>)}</div>
			<div className="flex flex-wrap items-center gap-4 border-t border-[#efe5d9] bg-[#fcf8f2] px-6 py-4 max-[520px]:px-4"><span className="mr-auto text-sm text-[#817365]" role={saved ? "status" : undefined}>{saved ? "Preferences saved on this browser." : "Changes stay on this device until you save."}</span><button type="button" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#a85f19] px-5 text-sm font-semibold text-white transition hover:bg-[#8f4c12] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a85f19]" onClick={savePreferences}>Save preferences</button></div>
		</section>
		<section className="flex flex-wrap items-start gap-4 rounded-2xl border border-[#eadfd1] bg-[#fffdf9] p-6 shadow-[0_5px_18px_rgba(69,43,22,.035)] max-[520px]:p-4"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#f2dfc2] text-[#8a541c]"><ShieldCheck /></span><div className="min-w-0 flex-1"><p className="mb-1 text-xs font-semibold uppercase tracking-[.12em] text-[#9a672d]">Account protection</p><h2 className="m-0 text-lg font-semibold text-[#34271e]">Secure partner sign-in</h2><p className="mb-0 mt-2 max-w-3xl text-sm leading-relaxed text-[#786a5b]">Your account is protected by your transport partner sign-in session. Password changes and session management are not available in this portal yet.</p><Link to="/partner/transport/profile" className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#eadfd1] bg-[#fcf8f2] px-4 text-sm font-semibold text-[#8f4c12] no-underline hover:bg-[#f5ebde]"><ShieldCheck size={16} /> Review your profile</Link></div></section>
	</div></TransportLayout>;
}
