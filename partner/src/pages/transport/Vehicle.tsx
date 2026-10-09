import { useEffect, useRef, useState, type FormEvent } from "react";
import { BusFront, Check, Pencil, Plus, Trash2, Truck } from "lucide-react";
import vehicleApi from "../../api/transport/vehicleApi";
import { getApiErrorMessage } from "../../api/axios";
import type { Vehicle } from "../../types";
import { ApiFeedback, PageHeader, StatusBadge } from "../../components/layout/Layout";
import { TransportLayout } from "./Dashboard";
import { partnerImages } from "../../config/partnerImages";

interface VehicleDraft {
	type: Vehicle["type"];
	make: string;
	model: string;
	year: string;
	color: string;
	plateNumber: string;
	capacity: string;
	photoUrl: string;
	insuranceNumber: string;
	insuranceExpiry: string;
	inspectionExpiry: string;
}

const blankVehicle: VehicleDraft = { type: "car", make: "", model: "", year: "", color: "", plateNumber: "", capacity: "", photoUrl: "", insuranceNumber: "", insuranceExpiry: "", inspectionExpiry: "" };

export function VehiclesPage() {
	const [vehicles, setVehicles] = useState<Vehicle[]>([]);
	const [draft, setDraft] = useState<VehicleDraft>(blankVehicle);
	const [editingId, setEditingId] = useState("");
	const [formOpen, setFormOpen] = useState(false);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [uploadingPhoto, setUploadingPhoto] = useState(false);
	const [error, setError] = useState("");
	const [reload, setReload] = useState(0);
	const photoInput = useRef<HTMLInputElement>(null);

	useEffect(() => {
		let cancelled = false;
		async function loadVehicles() {
			setLoading(true);
			setError("");
			try {
				const result = await vehicleApi.list();
				if (!cancelled) setVehicles(result);
			} catch (requestError) {
				if (!cancelled) setError(getApiErrorMessage(requestError, "Could not load fleet vehicles."));
			} finally {
				if (!cancelled) setLoading(false);
			}
		}
		void loadVehicles();
		return () => { cancelled = true; };
	}, [reload]);

	function editVehicle(vehicle: Vehicle) {
		setEditingId(vehicle._id);
		setDraft({ type: vehicle.type, make: vehicle.make, model: vehicle.model, year: String(vehicle.year), color: vehicle.color, plateNumber: vehicle.plateNumber, capacity: String(vehicle.capacity), photoUrl: vehicle.photos?.[0] ?? "", insuranceNumber: vehicle.insuranceNumber ?? "", insuranceExpiry: vehicle.insuranceExpiry?.slice(0, 10) ?? "", inspectionExpiry: vehicle.inspectionExpiry?.slice(0, 10) ?? "" });
		setFormOpen(true);
	}

	async function saveVehicle(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setSaving(true);
		setError("");
		const payload = { type: draft.type, make: draft.make.trim(), model: draft.model.trim(), year: Number(draft.year), color: draft.color.trim(), plateNumber: draft.plateNumber.trim().toUpperCase(), capacity: Number(draft.capacity), photos: draft.photoUrl.trim() ? [draft.photoUrl.trim()] : [], insuranceNumber: draft.insuranceNumber || null, insuranceExpiry: draft.insuranceExpiry || null, inspectionExpiry: draft.inspectionExpiry || null };
		try {
			if (editingId) await vehicleApi.update(editingId, payload);
			else await vehicleApi.create(payload);
			setFormOpen(false);
			setEditingId("");
			setDraft(blankVehicle);
			setReload((current) => current + 1);
		} catch (requestError) {
			setError(getApiErrorMessage(requestError, "Could not save this vehicle."));
		} finally {
			setSaving(false);
		}
	}

	async function setDefault(id: string) {
		try { await vehicleApi.setDefault(id); setReload((current) => current + 1); }
		catch (requestError) { setError(getApiErrorMessage(requestError, "Could not set the default vehicle.")); }
	}

	async function removeVehicle(vehicle: Vehicle) {
		if (!window.confirm(`Remove ${vehicle.make} ${vehicle.model} from your fleet?`)) return;
		try { await vehicleApi.remove(vehicle._id); setReload((current) => current + 1); }
		catch (requestError) { setError(getApiErrorMessage(requestError, "Could not remove this vehicle.")); }
	}

	async function uploadPhoto(file?: File) {
		if (!file) return;
		if (!file.type.startsWith("image/")) {
			setError("Choose an image file for the vehicle photo.");
			return;
		}
		setUploadingPhoto(true);
		setError("");
		try {
			const uploaded = await vehicleApi.uploadPhoto(file);
			setDraft((current) => ({ ...current, photoUrl: uploaded.url }));
		} catch (requestError) {
			setError(getApiErrorMessage(requestError, "Could not upload vehicle photo."));
		} finally {
			setUploadingPhoto(false);
			if (photoInput.current) photoInput.current.value = "";
		}
	}

	function updateDraft<Key extends keyof VehicleDraft>(key: Key, value: VehicleDraft[Key]) {
		setDraft((current) => ({ ...current, [key]: value }));
	}

	return <TransportLayout><div className="w-full [&_.page-header]:mb-4 [&_.page-header_h1]:text-[2rem] [&_.page-header_p]:text-[.84rem] max-[760px]:[&_.page-header_h1]:text-[1.65rem]">
		<PageHeader title="My Vehicles" subtitle="Manage the vehicles available for transport bookings." action={<button className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border-0 bg-[#b87317] px-4 py-2 text-[.8rem] font-semibold text-white hover:bg-[#a66512] disabled:cursor-not-allowed disabled:opacity-60" type="button" onClick={() => { setEditingId(""); setDraft(blankVehicle); setFormOpen(true); }}><Plus size={16} /> Add Vehicle</button>} />
		<ApiFeedback loading={loading} error={error} onRetry={() => setReload((current) => current + 1)} />
		{formOpen ? <form className="min-w-0 rounded-md border border-[rgba(130,110,92,.14)] bg-[rgba(255,252,247,.92)] shadow-[0_2px_8px_rgba(36,22,13,.025)] mb-[15px] p-4" onSubmit={(event) => void saveVehicle(event)}>
			<div className="flex min-h-9 items-center justify-between gap-2 border-b border-[rgba(130,110,92,.1)] px-2.5 [&_h2]:m-0 [&_h2]:text-[.9rem] [&_h2]:font-bold [&_a]:inline-flex [&_a]:items-center [&_a]:gap-1 [&_a]:whitespace-nowrap [&_a]:text-[.52rem] [&_a]:text-[#925719] [&_a]:no-underline [&>span]:text-[.52rem] [&>span]:text-[#925719]"><h2>{editingId ? "Edit Vehicle" : "Register a Vehicle"}</h2><button type="button" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-[.8rem] font-semibold text-[var(--text)] hover:bg-[#fffaf1] disabled:cursor-not-allowed disabled:opacity-60 !min-h-7 !px-[7px] !py-[5px] text-[.62rem]" onClick={() => setFormOpen(false)}>Close</button></div>
			<div className="grid grid-cols-2 gap-[14px] max-[760px]:grid-cols-1">
				<label className="flex min-w-0 flex-col gap-[5px] text-[.78rem] font-semibold text-[var(--text)] [&_input]:min-h-10 [&_input]:rounded-md [&_input]:border [&_input]:border-[var(--border)] [&_input]:bg-[var(--surface)] [&_input]:px-3 [&_input]:py-[.62rem] [&_input]:text-[.82rem] [&_select]:min-h-10 [&_select]:rounded-md [&_select]:border [&_select]:border-[var(--border)] [&_select]:bg-[var(--surface)] [&_select]:px-3 [&_select]:py-[.62rem] [&_select]:text-[.82rem] [&>span]:text-[.75rem]"><span>Vehicle type</span><select value={draft.type} onChange={(event) => updateDraft("type", event.target.value as Vehicle["type"])}>{["bike", "car", "van", "truck", "bus", "boat"].map((type) => <option key={type} value={type}>{type[0].toUpperCase() + type.slice(1)}</option>)}</select></label>
				<label className="flex min-w-0 flex-col gap-[5px] text-[.78rem] font-semibold text-[var(--text)] [&_input]:min-h-10 [&_input]:rounded-md [&_input]:border [&_input]:border-[var(--border)] [&_input]:bg-[var(--surface)] [&_input]:px-3 [&_input]:py-[.62rem] [&_input]:text-[.82rem] [&_select]:min-h-10 [&_select]:rounded-md [&_select]:border [&_select]:border-[var(--border)] [&_select]:bg-[var(--surface)] [&_select]:px-3 [&_select]:py-[.62rem] [&_select]:text-[.82rem] [&>span]:text-[.75rem]"><span>Make</span><input required value={draft.make} onChange={(event) => updateDraft("make", event.target.value)} /></label>
				<label className="flex min-w-0 flex-col gap-[5px] text-[.78rem] font-semibold text-[var(--text)] [&_input]:min-h-10 [&_input]:rounded-md [&_input]:border [&_input]:border-[var(--border)] [&_input]:bg-[var(--surface)] [&_input]:px-3 [&_input]:py-[.62rem] [&_input]:text-[.82rem] [&_select]:min-h-10 [&_select]:rounded-md [&_select]:border [&_select]:border-[var(--border)] [&_select]:bg-[var(--surface)] [&_select]:px-3 [&_select]:py-[.62rem] [&_select]:text-[.82rem] [&>span]:text-[.75rem]"><span>Model</span><input required value={draft.model} onChange={(event) => updateDraft("model", event.target.value)} /></label>
				<label className="flex min-w-0 flex-col gap-[5px] text-[.78rem] font-semibold text-[var(--text)] [&_input]:min-h-10 [&_input]:rounded-md [&_input]:border [&_input]:border-[var(--border)] [&_input]:bg-[var(--surface)] [&_input]:px-3 [&_input]:py-[.62rem] [&_input]:text-[.82rem] [&_select]:min-h-10 [&_select]:rounded-md [&_select]:border [&_select]:border-[var(--border)] [&_select]:bg-[var(--surface)] [&_select]:px-3 [&_select]:py-[.62rem] [&_select]:text-[.82rem] [&>span]:text-[.75rem]"><span>Year</span><input required type="number" min="1980" max={new Date().getFullYear() + 1} value={draft.year} onChange={(event) => updateDraft("year", event.target.value)} /></label>
				<label className="flex min-w-0 flex-col gap-[5px] text-[.78rem] font-semibold text-[var(--text)] [&_input]:min-h-10 [&_input]:rounded-md [&_input]:border [&_input]:border-[var(--border)] [&_input]:bg-[var(--surface)] [&_input]:px-3 [&_input]:py-[.62rem] [&_input]:text-[.82rem] [&_select]:min-h-10 [&_select]:rounded-md [&_select]:border [&_select]:border-[var(--border)] [&_select]:bg-[var(--surface)] [&_select]:px-3 [&_select]:py-[.62rem] [&_select]:text-[.82rem] [&>span]:text-[.75rem]"><span>Color</span><input required value={draft.color} onChange={(event) => updateDraft("color", event.target.value)} /></label>
				<label className="flex min-w-0 flex-col gap-[5px] text-[.78rem] font-semibold text-[var(--text)] [&_input]:min-h-10 [&_input]:rounded-md [&_input]:border [&_input]:border-[var(--border)] [&_input]:bg-[var(--surface)] [&_input]:px-3 [&_input]:py-[.62rem] [&_input]:text-[.82rem] [&_select]:min-h-10 [&_select]:rounded-md [&_select]:border [&_select]:border-[var(--border)] [&_select]:bg-[var(--surface)] [&_select]:px-3 [&_select]:py-[.62rem] [&_select]:text-[.82rem] [&>span]:text-[.75rem]"><span>Plate number</span><input required value={draft.plateNumber} onChange={(event) => updateDraft("plateNumber", event.target.value)} /></label>
				<label className="flex min-w-0 flex-col gap-[5px] text-[.78rem] font-semibold text-[var(--text)] [&_input]:min-h-10 [&_input]:rounded-md [&_input]:border [&_input]:border-[var(--border)] [&_input]:bg-[var(--surface)] [&_input]:px-3 [&_input]:py-[.62rem] [&_input]:text-[.82rem] [&_select]:min-h-10 [&_select]:rounded-md [&_select]:border [&_select]:border-[var(--border)] [&_select]:bg-[var(--surface)] [&_select]:px-3 [&_select]:py-[.62rem] [&_select]:text-[.82rem] [&>span]:text-[.75rem]"><span>Passenger capacity</span><input required type="number" min="1" value={draft.capacity} onChange={(event) => updateDraft("capacity", event.target.value)} /></label>
				<label className="flex min-w-0 flex-col gap-[5px] text-[.78rem] font-semibold text-[var(--text)] [&_input]:min-h-10 [&_input]:rounded-md [&_input]:border [&_input]:border-[var(--border)] [&_input]:bg-[var(--surface)] [&_input]:px-3 [&_input]:py-[.62rem] [&_input]:text-[.82rem] [&_select]:min-h-10 [&_select]:rounded-md [&_select]:border [&_select]:border-[var(--border)] [&_select]:bg-[var(--surface)] [&_select]:px-3 [&_select]:py-[.62rem] [&_select]:text-[.82rem] [&>span]:text-[.75rem] col-span-2 max-[760px]:col-span-1"><span>Vehicle photo URL</span><input type="url" placeholder="https://..." value={draft.photoUrl} onChange={(event) => updateDraft("photoUrl", event.target.value)} /></label>
				<div className="flex min-w-0 flex-col gap-[5px] text-[.78rem] font-semibold text-[var(--text)] [&_input]:min-h-10 [&_input]:rounded-md [&_input]:border [&_input]:border-[var(--border)] [&_input]:bg-[var(--surface)] [&_input]:px-3 [&_input]:py-[.62rem] [&_input]:text-[.82rem] [&_select]:min-h-10 [&_select]:rounded-md [&_select]:border [&_select]:border-[var(--border)] [&_select]:bg-[var(--surface)] [&_select]:px-3 [&_select]:py-[.62rem] [&_select]:text-[.82rem] [&>span]:text-[.75rem] items-start justify-center gap-[7px] [&>small]:text-[.68rem] [&>small]:leading-[1.4] [&>small]:font-normal"><span>Or upload a photo</span><button type="button" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-[.8rem] font-semibold text-[var(--text)] hover:bg-[#fffaf1] disabled:cursor-not-allowed disabled:opacity-60 !min-h-7 !px-[7px] !py-[5px] text-[.62rem]" onClick={() => photoInput.current?.click()} disabled={uploadingPhoto}>{uploadingPhoto ? "Uploading..." : "Choose image"}</button><input ref={photoInput} type="file" accept="image/*" className="sr-only" onChange={(event) => void uploadPhoto(event.target.files?.[0])} /><small>Image is uploaded now and linked when you save the vehicle.</small></div>
				<label className="flex min-w-0 flex-col gap-[5px] text-[.78rem] font-semibold text-[var(--text)] [&_input]:min-h-10 [&_input]:rounded-md [&_input]:border [&_input]:border-[var(--border)] [&_input]:bg-[var(--surface)] [&_input]:px-3 [&_input]:py-[.62rem] [&_input]:text-[.82rem] [&_select]:min-h-10 [&_select]:rounded-md [&_select]:border [&_select]:border-[var(--border)] [&_select]:bg-[var(--surface)] [&_select]:px-3 [&_select]:py-[.62rem] [&_select]:text-[.82rem] [&>span]:text-[.75rem]"><span>Insurance number</span><input value={draft.insuranceNumber} onChange={(event) => updateDraft("insuranceNumber", event.target.value)} /></label>
				<label className="flex min-w-0 flex-col gap-[5px] text-[.78rem] font-semibold text-[var(--text)] [&_input]:min-h-10 [&_input]:rounded-md [&_input]:border [&_input]:border-[var(--border)] [&_input]:bg-[var(--surface)] [&_input]:px-3 [&_input]:py-[.62rem] [&_input]:text-[.82rem] [&_select]:min-h-10 [&_select]:rounded-md [&_select]:border [&_select]:border-[var(--border)] [&_select]:bg-[var(--surface)] [&_select]:px-3 [&_select]:py-[.62rem] [&_select]:text-[.82rem] [&>span]:text-[.75rem]"><span>Insurance expiry</span><input type="date" value={draft.insuranceExpiry} onChange={(event) => updateDraft("insuranceExpiry", event.target.value)} /></label>
				<label className="flex min-w-0 flex-col gap-[5px] text-[.78rem] font-semibold text-[var(--text)] [&_input]:min-h-10 [&_input]:rounded-md [&_input]:border [&_input]:border-[var(--border)] [&_input]:bg-[var(--surface)] [&_input]:px-3 [&_input]:py-[.62rem] [&_input]:text-[.82rem] [&_select]:min-h-10 [&_select]:rounded-md [&_select]:border [&_select]:border-[var(--border)] [&_select]:bg-[var(--surface)] [&_select]:px-3 [&_select]:py-[.62rem] [&_select]:text-[.82rem] [&>span]:text-[.75rem]"><span>Inspection expiry</span><input type="date" value={draft.inspectionExpiry} onChange={(event) => updateDraft("inspectionExpiry", event.target.value)} /></label>
			</div>
			{draft.photoUrl ? <div className="relative mt-3 h-[125px] w-full max-w-[280px] overflow-hidden rounded-md bg-[#f1e8da] [&_img]:h-full [&_img]:w-full [&_img]:object-cover [&_span]:absolute [&_span]:right-[7px] [&_span]:bottom-[7px] [&_span]:rounded [&_span]:bg-[rgba(35,27,19,.72)] [&_span]:px-1.5 [&_span]:py-1 [&_span]:text-[.62rem] [&_span]:text-white"><img src={draft.photoUrl} alt="Vehicle preview" onError={(event) => { event.currentTarget.style.visibility = "hidden"; }} /><span>Photo preview</span></div> : null}
			<div className="mt-4 flex items-center gap-3 justify-end"><button type="button" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-[.8rem] font-semibold text-[var(--text)] hover:bg-[#fffaf1] disabled:cursor-not-allowed disabled:opacity-60" onClick={() => setFormOpen(false)}>Cancel</button><button type="submit" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border-0 bg-[#b87317] px-4 py-2 text-[.8rem] font-semibold text-white hover:bg-[#a66512] disabled:cursor-not-allowed disabled:opacity-60" disabled={saving}>{saving ? "Saving..." : editingId ? "Save Vehicle" : "Submit for Approval"}</button></div>
		</form> : null}
		<div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-[14px]">{vehicles.map((vehicle) => <article className="min-w-0 rounded-md border border-[rgba(130,110,92,.14)] bg-[rgba(255,252,247,.92)] shadow-[0_2px_8px_rgba(36,22,13,.025)] overflow-hidden" key={vehicle._id}>
			<div className="flex h-[120px] items-center justify-center bg-cover bg-center text-white" style={{ backgroundImage: `linear-gradient(0deg, rgba(30,20,12,.42), rgba(30,20,12,.08)), url('${vehicle.photos?.[0] ?? partnerImages.transport.vehicleFallback}')` }}>{!vehicle.photos?.[0] ? <Truck size={32} /> : null}<StatusBadge status={vehicle.status} /></div>
			<div className="p-3"><div className="flex min-h-9 items-center justify-between gap-2 border-b border-[rgba(130,110,92,.1)] px-2.5 [&_h2]:m-0 [&_h2]:text-[.9rem] [&_h2]:font-bold [&_a]:inline-flex [&_a]:items-center [&_a]:gap-1 [&_a]:whitespace-nowrap [&_a]:text-[.52rem] [&_a]:text-[#925719] [&_a]:no-underline [&>span]:text-[.52rem] [&>span]:text-[#925719]"><div><h2>{vehicle.make} {vehicle.model}</h2><small>{vehicle.year} · {vehicle.color}</small></div><button type="button" className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--surface)] text-[var(--text-soft)] hover:bg-[#fffaf1]" aria-label={`Edit ${vehicle.make} ${vehicle.model}`} onClick={() => editVehicle(vehicle)}><Pencil size={15} /></button></div>
				<div className="flex items-center justify-between gap-2 border-t border-[var(--border)] pt-2.5 text-[.74rem] text-[var(--text-soft)]"><span>{vehicle.plateNumber}</span><span>{vehicle.capacity} seats</span></div>
				<div className="mt-2.5 flex items-center justify-end gap-2 border-0 pt-2.5"><button type="button" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-[.8rem] font-semibold text-[var(--text)] hover:bg-[#fffaf1] disabled:cursor-not-allowed disabled:opacity-60 !min-h-7 !px-[7px] !py-[5px] text-[.62rem]" onClick={() => void setDefault(vehicle._id)} disabled={vehicle.isDefault}>{vehicle.isDefault ? <><Check size={13} /> Default</> : "Set default"}</button><button type="button" className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--surface)] text-[var(--text-soft)] hover:bg-[#fffaf1] text-[var(--danger)]" aria-label={`Remove ${vehicle.make} ${vehicle.model}`} onClick={() => void removeVehicle(vehicle)}><Trash2 size={15} /></button></div>
			</div>
		</article>)}</div>
		{!loading && vehicles.length === 0 ? <div className="min-w-0 rounded-md border border-[rgba(130,110,92,.14)] bg-[rgba(255,252,247,.92)] shadow-[0_2px_8px_rgba(36,22,13,.025)] flex min-h-[150px] flex-col items-center justify-center gap-2 text-center text-[var(--text-muted)] [&_svg]:text-[var(--gold)] [&_strong]:text-[var(--text)] [&_span]:text-[.76rem]"><BusFront size={24} /><strong>No vehicles registered</strong><span>Add a vehicle to become eligible for transport assignments.</span></div> : null}
	</div></TransportLayout>;
}
