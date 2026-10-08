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

	return <div className="grid gap-[11px]">
		<header className="mb-[2px] flex items-center justify-between gap-3 max-[480px]:items-start [&>div>p]:mb-1 [&>div>p]:text-[8px] [&>div>p]:font-semibold [&>div>p]:uppercase [&>div>p]:tracking-[.7px] [&>div>p]:text-[#8a8c82] [&_h1]:m-0 [&_h1]:text-[22px] [&_h1]:tracking-[-.55px] [&>div>span]:mt-1 [&>div>span]:block [&>div>span]:text-[10px] [&>div>span]:text-[#85877e]"><div><p>Restaurant Partner</p><h1>Restaurant Profile</h1><span>Manage your restaurant details and availability.</span></div><button type="button" data-open={profile?.isOpen ?? false} className="inline-flex min-h-6 items-center gap-[5px] rounded-full border border-[#e8e9e1] bg-[#f9faf7] px-2 text-[8px] font-semibold text-[#626b4a] disabled:cursor-wait [&_i]:size-[6px] [&_i]:rounded-full [&_i]:bg-[#b9bbb3] data-[open=true]:[&>i]:bg-[#71a15b]" onClick={() => void toggleOpen()} disabled={!profile || busy === "open"}><i />{busy === "open" ? "Updating…" : profile?.isOpen ? "Open — click to close" : "Closed — click to open"}</button></header>
		{error && <div className="mb-[10px] flex items-center justify-between gap-[10px] rounded-md border border-[#f0d9d4] bg-[#fff8f7] px-[11px] py-[9px] text-[9px] text-[#994c43] [&_button]:rounded-[5px] [&_button]:border [&_button]:border-[#eed3cf] [&_button]:bg-white [&_button]:px-2 [&_button]:py-[5px] [&_button]:text-[8px] [&_button]:text-[#914940]" role="alert">{error}<button type="button" onClick={() => setReload((value) => value + 1)}>Retry</button></div>}
		{message && <div className="mb-[10px] flex items-center justify-start gap-[10px] rounded-md border border-[#dfe7d3] bg-[#f5f7f0] px-[11px] py-[9px] text-[9px] text-[#64753e] [&_a]:inline-flex [&_a]:items-center [&_a]:gap-1 [&_a]:text-inherit" role="status">{message}</div>}
		{loading ? <div className="min-w-0 rounded-lg border border-[#eaeae5] bg-white shadow-[0_1px_3px_rgba(34,37,29,.025)] p-3 text-center text-[9px] text-[#7f8178]" role="status">Loading restaurant profile…</div> : profile && <section className="min-w-0 rounded-lg border border-[#eaeae5] bg-white shadow-[0_1px_3px_rgba(34,37,29,.025)] p-[15px] [&_form]:grid [&_form]:grid-cols-2 [&_form]:gap-[11px] [&_form>label]:grid [&_form>label]:gap-[5px] [&_form>label]:text-[9px] [&_form>label]:font-semibold [&_form>label]:text-[#64675e] [&_input:not([type=checkbox])]:w-full [&_input:not([type=checkbox])]:rounded-[5px] [&_input:not([type=checkbox])]:border [&_input:not([type=checkbox])]:border-[#e8e9e3] [&_input:not([type=checkbox])]:bg-white [&_input:not([type=checkbox])]:p-[9px_10px] [&_input:not([type=checkbox])]:text-[10px] [&_textarea]:w-full [&_textarea]:rounded-[5px] [&_textarea]:border [&_textarea]:border-[#e8e9e3] [&_textarea]:bg-white [&_textarea]:p-[9px_10px] [&_textarea]:text-[10px] [&_fieldset]:col-span-full [&_fieldset]:flex [&_fieldset]:flex-wrap [&_fieldset]:gap-[14px] [&_fieldset]:rounded-[5px] [&_fieldset]:border [&_fieldset]:border-[#e8e9e3] [&_fieldset]:p-[9px_10px] [&_fieldset_legend]:text-[9px] [&_fieldset_label]:inline-flex [&_fieldset_label]:items-center [&_fieldset_label]:gap-[5px] [&_fieldset_label]:text-[9px] max-[480px]:[&_form]:grid-cols-1 max-[480px]:[&_fieldset]:col-span-1">
			<div className="mb-[11px] flex items-center justify-between gap-[10px] [&_h2]:m-0 [&_h2]:text-[11px] [&_h2]:font-bold [&_h2]:text-[#30322d] [&>div]:grid [&>div]:gap-1 [&>div>span]:text-[9px] [&>div>span]:text-[#8a8c83] [&>span]:text-[9px] [&>span]:text-[#8a8c83]"><div><h2>{profile.name}</h2><span>{profile.email} · {profile.status}</span></div></div>
			<div className="mb-3 grid grid-cols-2 gap-3 [&_label]:grid [&_label]:gap-2 [&_label]:text-[10px] [&_label]:font-semibold [&_label]:text-[#64675e] [&_img]:h-[110px] [&_img]:w-full [&_img]:rounded-md [&_img]:object-cover [&_span]:grid [&_span]:h-[80px] [&_span]:place-items-center [&_span]:rounded-md [&_span]:bg-[#f6f6f2] [&_span]:text-[10px] [&_span]:text-[#85877e] [&_input]:text-[9px] max-[680px]:grid-cols-1">
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
				<button className="justify-self-start rounded-[5px] bg-[#707e48] px-[13px] py-[9px] text-[10px] font-semibold text-white disabled:opacity-60" type="submit" disabled={busy === "profile"}>{busy === "profile" ? "Saving…" : "Save profile"}</button>
			</form>
		</section>}
	</div>;
}
