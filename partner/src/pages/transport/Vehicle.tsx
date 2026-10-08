import { useEffect, useRef, useState, type FormEvent } from "react";
import { BusFront, Check, Pencil, Plus, Trash2, Truck } from "lucide-react";
import vehicleApi from "../../api/transport/vehicleApi";
import { getApiErrorMessage } from "../../api/axios";
import type { Vehicle } from "../../types";
import { ApiFeedback, PageHeader, StatusBadge } from "../../components/layout/Layout";
import { TransportLayout } from "./Dashboard";

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

	return <TransportLayout><div className="transport-page">
		<PageHeader title="My Vehicles" subtitle="Manage the vehicles available for transport bookings." action={<button className="primary-button" type="button" onClick={() => { setEditingId(""); setDraft(blankVehicle); setFormOpen(true); }}><Plus size={16} /> Add Vehicle</button>} />
		<ApiFeedback loading={loading} error={error} onRetry={() => setReload((current) => current + 1)} />
		{formOpen ? <form className="transport-panel transport-vehicle-form" onSubmit={(event) => void saveVehicle(event)}>
			<div className="transport-panel-heading"><h2>{editingId ? "Edit Vehicle" : "Register a Vehicle"}</h2><button type="button" className="secondary-button small-button" onClick={() => setFormOpen(false)}>Close</button></div>
			<div className="transport-form-grid">
				<label className="field-label"><span>Vehicle type</span><select value={draft.type} onChange={(event) => updateDraft("type", event.target.value as Vehicle["type"])}>{["bike", "car", "van", "truck", "bus", "boat"].map((type) => <option key={type} value={type}>{type[0].toUpperCase() + type.slice(1)}</option>)}</select></label>
				<label className="field-label"><span>Make</span><input required value={draft.make} onChange={(event) => updateDraft("make", event.target.value)} /></label>
				<label className="field-label"><span>Model</span><input required value={draft.model} onChange={(event) => updateDraft("model", event.target.value)} /></label>
				<label className="field-label"><span>Year</span><input required type="number" min="1980" max={new Date().getFullYear() + 1} value={draft.year} onChange={(event) => updateDraft("year", event.target.value)} /></label>
				<label className="field-label"><span>Color</span><input required value={draft.color} onChange={(event) => updateDraft("color", event.target.value)} /></label>
				<label className="field-label"><span>Plate number</span><input required value={draft.plateNumber} onChange={(event) => updateDraft("plateNumber", event.target.value)} /></label>
				<label className="field-label"><span>Passenger capacity</span><input required type="number" min="1" value={draft.capacity} onChange={(event) => updateDraft("capacity", event.target.value)} /></label>
				<label className="field-label transport-photo-field"><span>Vehicle photo URL</span><input type="url" placeholder="https://..." value={draft.photoUrl} onChange={(event) => updateDraft("photoUrl", event.target.value)} /></label>
				<div className="field-label transport-photo-upload-field"><span>Or upload a photo</span><button type="button" className="secondary-button small-button" onClick={() => photoInput.current?.click()} disabled={uploadingPhoto}>{uploadingPhoto ? "Uploading..." : "Choose image"}</button><input ref={photoInput} type="file" accept="image/*" className="visually-hidden" onChange={(event) => void uploadPhoto(event.target.files?.[0])} /><small>Image is uploaded now and linked when you save the vehicle.</small></div>
				<label className="field-label"><span>Insurance number</span><input value={draft.insuranceNumber} onChange={(event) => updateDraft("insuranceNumber", event.target.value)} /></label>
				<label className="field-label"><span>Insurance expiry</span><input type="date" value={draft.insuranceExpiry} onChange={(event) => updateDraft("insuranceExpiry", event.target.value)} /></label>
				<label className="field-label"><span>Inspection expiry</span><input type="date" value={draft.inspectionExpiry} onChange={(event) => updateDraft("inspectionExpiry", event.target.value)} /></label>
			</div>
			{draft.photoUrl ? <div className="transport-vehicle-photo-preview"><img src={draft.photoUrl} alt="Vehicle preview" onError={(event) => { event.currentTarget.style.visibility = "hidden"; }} /><span>Photo preview</span></div> : null}
			<div className="form-actions right-align"><button type="button" className="secondary-button" onClick={() => setFormOpen(false)}>Cancel</button><button type="submit" className="primary-button" disabled={saving}>{saving ? "Saving..." : editingId ? "Save Vehicle" : "Submit for Approval"}</button></div>
		</form> : null}
		<div className="transport-vehicle-grid">{vehicles.map((vehicle) => <article className="transport-panel transport-vehicle-card" key={vehicle._id}>
			<div className="transport-vehicle-card-image" style={vehicle.photos?.[0] ? { backgroundImage: `linear-gradient(0deg, rgba(30,20,12,.42), rgba(30,20,12,.08)), url('${vehicle.photos[0]}')` } : undefined}>{!vehicle.photos?.[0] ? <Truck size={32} /> : null}<StatusBadge status={vehicle.status} /></div>
			<div className="transport-vehicle-card-body"><div className="transport-panel-heading"><div><h2>{vehicle.make} {vehicle.model}</h2><small>{vehicle.year} · {vehicle.color}</small></div><button type="button" className="icon-action" aria-label={`Edit ${vehicle.make} ${vehicle.model}`} onClick={() => editVehicle(vehicle)}><Pencil size={15} /></button></div>
				<div className="transport-vehicle-meta"><span>{vehicle.plateNumber}</span><span>{vehicle.capacity} seats</span></div>
				<div className="transport-vehicle-actions"><button type="button" className="secondary-button small-button" onClick={() => void setDefault(vehicle._id)} disabled={vehicle.isDefault}>{vehicle.isDefault ? <><Check size={13} /> Default</> : "Set default"}</button><button type="button" className="icon-action danger-action" aria-label={`Remove ${vehicle.make} ${vehicle.model}`} onClick={() => void removeVehicle(vehicle)}><Trash2 size={15} /></button></div>
			</div>
		</article>)}</div>
		{!loading && vehicles.length === 0 ? <div className="transport-panel transport-empty-large"><BusFront size={24} /><strong>No vehicles registered</strong><span>Add a vehicle to become eligible for transport assignments.</span></div> : null}
	</div></TransportLayout>;
}
