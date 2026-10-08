import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import profileApi from "../../api/restaurant/profileApi";
import { getApiErrorMessage } from "../../api/axios";
import type { RestaurantPartner } from "../../types";

export function RestaurantProfilePage() {
	const [profile, setProfile] = useState<RestaurantPartner | null>(null);
	const [loading, setLoading] = useState(true);
	const [busy, setBusy] = useState("");
	const [error, setError] = useState("");
	const [message, setMessage] = useState("");
	const [reload, setReload] = useState(0);

	useEffect(() => {
		let cancelled = false;
		setLoading(true);
		setError("");
		profileApi.get().then(({ partner }) => { if (!cancelled) setProfile(partner); })
			.catch((cause: unknown) => { if (!cancelled) setError(getApiErrorMessage(cause, "Could not load restaurant profile.")); })
			.finally(() => { if (!cancelled) setLoading(false); });
		return () => { cancelled = true; };
	}, [reload]);

	async function saveProfile(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const values = new FormData(event.currentTarget);
		setBusy("profile");
		setError("");
		setMessage("");
		try {
			const updated = await profileApi.update({
				name: String(values.get("name") ?? "").trim(),
				description: String(values.get("description") ?? "").trim(),
				phone: String(values.get("phone") ?? "").trim(),
				town: String(values.get("town") ?? "").trim(),
				address: String(values.get("address") ?? "").trim(),
				cuisineTypes: String(values.get("cuisineTypes") ?? "").split(",").map((value) => value.trim()).filter(Boolean),
				supportsDelivery: values.get("supportsDelivery") === "on",
				supportsDineIn: values.get("supportsDineIn") === "on",
				supportsPickup: values.get("supportsPickup") === "on",
			});
			setProfile(updated);
			setMessage("Restaurant profile saved.");
		} catch (cause) { setError(getApiErrorMessage(cause, "Could not save restaurant profile.")); }
		finally { setBusy(""); }
	}

	async function upload(event: ChangeEvent<HTMLInputElement>, type: "logo" | "cover") {
		const input = event.currentTarget;
		const file = input.files?.[0];
		if (!file) return;
		if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
			setError("Choose an image file that is 5 MB or smaller.");
			return;
		}
		setBusy(type);
		setError("");
		setMessage("");
		try {
			if (type === "logo") {
				const result = await profileApi.uploadLogo(file);
				setProfile((current) => current ? { ...current, logo: result.logo } : current);
			} else {
				const result = await profileApi.uploadCover(file);
				setProfile((current) => current ? { ...current, coverImage: result.coverImage } : current);
			}
			setMessage(type === "logo" ? "Restaurant logo updated." : "Cover image updated.");
		} catch (cause) { setError(getApiErrorMessage(cause, `Could not upload ${type}.`)); }
		finally { setBusy(""); input.value = ""; }
	}

	async function toggleOpen() {
		if (!profile) return;
		setBusy("open");
		setError("");
		try {
			const result = await profileApi.toggleOpen(!profile.isOpen);
			setProfile({ ...profile, isOpen: result.isOpen, isAcceptingOrders: result.isAcceptingOrders });
			setMessage(result.isOpen ? "Restaurant is now open." : "Restaurant is now closed.");
		} catch (cause) { setError(getApiErrorMessage(cause, "Could not update availability.")); }
		finally { setBusy(""); }
	}

	return <div className="restaurant-section-page">
		<header className="restaurant-page-title"><div><p>Restaurant Partner</p><h1>Restaurant Profile</h1><span>Manage your restaurant details and availability.</span></div><button type="button" className={`restaurant-open-pill ${profile?.isOpen ? "open" : ""}`} onClick={() => void toggleOpen()} disabled={!profile || busy === "open"}><i />{busy === "open" ? "Updating…" : profile?.isOpen ? "Open — click to close" : "Closed — click to open"}</button></header>
		{error && <div className="restaurant-feedback" role="alert">{error}<button type="button" onClick={() => setReload((value) => value + 1)}>Retry</button></div>}
		{message && <div className="restaurant-success" role="status">{message}</div>}
		{loading ? <div className="restaurant-card restaurant-loading" role="status">Loading restaurant profile…</div> : profile && <section className="restaurant-card restaurant-section-card restaurant-profile-section">
			<div className="restaurant-section-toolbar"><div><h2>{profile.name}</h2><span>{profile.email} · {profile.status}</span></div></div>
			<div className="restaurant-profile-images">
				<label>Restaurant logo{profile.logo ? <img src={profile.logo} alt={`${profile.name} logo`} /> : <span>No logo uploaded</span>}<input type="file" accept="image/*" onChange={(event) => void upload(event, "logo")} disabled={busy === "logo"} /></label>
				<label>Cover image{profile.coverImage ? <img src={profile.coverImage} alt={`${profile.name} cover`} /> : <span>No cover image uploaded</span>}<input type="file" accept="image/*" onChange={(event) => void upload(event, "cover")} disabled={busy === "cover"} /></label>
			</div>
			<form key={profile.updatedAt} onSubmit={(event) => void saveProfile(event)}>
				<label>Restaurant name<input name="name" required defaultValue={profile.name} /></label>
				<label>Description<textarea name="description" rows={3} defaultValue={profile.description ?? ""} /></label>
				<label>Phone<input name="phone" type="tel" required defaultValue={profile.phone} /></label>
				<label>Town or city<input name="town" required defaultValue={profile.town} /></label>
				<label>Address<input name="address" required defaultValue={profile.address} /></label>
				<label>Cuisines (comma separated)<input name="cuisineTypes" defaultValue={(profile.cuisineTypes ?? []).join(", ")} /></label>
				<fieldset><legend>Services offered</legend><label><input name="supportsDelivery" type="checkbox" defaultChecked={profile.supportsDelivery} /> Delivery</label><label><input name="supportsDineIn" type="checkbox" defaultChecked={profile.supportsDineIn} /> Dine-in</label><label><input name="supportsPickup" type="checkbox" defaultChecked={profile.supportsPickup} /> Pickup</label></fieldset>
				<button className="restaurant-primary-button" type="submit" disabled={busy === "profile"}>{busy === "profile" ? "Saving…" : "Save profile"}</button>
			</form>
		</section>}
	</div>;
}
