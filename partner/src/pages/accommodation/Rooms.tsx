import { useEffect, useState, type FormEvent } from "react";
import { BedDouble, Building2, Pause, Pencil, Plus, Search, Users, X } from "lucide-react";
import { Link } from "react-router-dom";
import { getApiErrorMessage } from "../../api/axios";
import availabilityApi from "../../api/accommodation/availabilityApi";
import propertyApi from "../../api/accommodation/propertyApi";
import roomApi from "../../api/accommodation/roomApi";
import type { Property, Room, RoomAvailability } from "../../types";
import { AccommodationPartnerLayout, ApiFeedback, PageHeader, StatusBadge } from "../../components/layout/Layout";

type RoomStatus = "Active" | "Paused";

interface RoomType {
	id: string;
	propertyId: string;
	name: string;
	property: string;
	inventory: number;
	occupied: number;
	rate: number;
	status: RoomStatus;
}

interface RoomDraft {
	name: string;
	property: string;
	inventory: string;
	occupied: string;
	rate: string;
	status: RoomStatus;
}

const emptyDraft: RoomDraft = {
	name: "",
	property: "",
	inventory: "",
	occupied: "0",
	rate: "",
	status: "Active",
};

export function RoomsPage() {
	const [rooms, setRooms] = useState<RoomType[]>([]);
	const [properties, setProperties] = useState<Property[]>([]);
	const [search, setSearch] = useState("");
	const [propertyFilter, setPropertyFilter] = useState("All properties");
	const [statusFilter, setStatusFilter] = useState("All statuses");
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [draft, setDraft] = useState<RoomDraft>(emptyDraft);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");
	const [reload, setReload] = useState(0);

	useEffect(() => {
		let cancelled = false;

		async function loadRooms() {
			setLoading(true);
			setError("");
			try {
				const [propertyData, roomData] = await Promise.all([propertyApi.list(), roomApi.list()]);
				const today = new Date().toISOString().slice(0, 10);
				const availability = await availabilityApi.list({ from: today, to: today });
				if (cancelled) return;

				setProperties(propertyData);
				const propertyNames = new Map(propertyData.map((property) => [property._id, property.name]));
				const availabilityByRoom = new Map<string, RoomAvailability>();
				availability.forEach((item) => availabilityByRoom.set(item.room, item));
				setRooms(roomData.map((room: Room) => {
					const todayAvailability = availabilityByRoom.get(room._id);
					return {
						id: room._id,
						propertyId: room.property,
						name: room.name,
						property: propertyNames.get(room.property) ?? "Property",
						inventory: room.totalUnits,
						occupied: todayAvailability?.bookedUnits ?? 0,
						rate: room.basePrice,
						status: room.status === "active" ? "Active" : "Paused",
					};
				}));
			} catch (requestError) {
				if (!cancelled) setError(getApiErrorMessage(requestError, "Could not load room inventory."));
			} finally {
				if (!cancelled) setLoading(false);
			}
		}

		void loadRooms();
		return () => { cancelled = true; };
	}, [reload]);

	const activeRooms = rooms.filter((room) => room.status === "Active");
	const activeInventory = activeRooms.reduce((total, room) => total + room.inventory, 0);
	const activeOccupied = activeRooms.reduce((total, room) => total + room.occupied, 0);
	const availableRooms = activeInventory - activeOccupied;
	const utilization = activeInventory ? Math.round((activeOccupied / activeInventory) * 100) : 0;
	const filteredRooms = rooms.filter((room) => {
		const matchesSearch = `${room.name} ${room.property}`.toLowerCase().includes(search.toLowerCase());
		const matchesProperty = propertyFilter === "All properties" || room.property === propertyFilter;
		const matchesStatus = statusFilter === "All statuses" || room.status === statusFilter;
		return matchesSearch && matchesProperty && matchesStatus;
	});

	function openNewRoomForm() {
		setEditingId(null);
		setDraft({ ...emptyDraft, property: properties[0]?._id ?? "" });
		setIsFormOpen(true);
	}

	function openEditRoomForm(room: RoomType) {
		setEditingId(room.id);
		setDraft({
			name: room.name,
			property: room.propertyId,
			inventory: String(room.inventory),
			occupied: String(room.occupied),
			rate: String(room.rate),
			status: room.status,
		});
		setIsFormOpen(true);
	}

	async function handleSaveRoom(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const inventory = Number(draft.inventory);
		const occupied = Number(draft.occupied);
		const rate = Number(draft.rate);

		if (!draft.name.trim() || !draft.property || inventory < 1 || occupied < 0 || occupied > inventory || rate < 1) return;

		setSaving(true);
		setError("");
		try {
			if (editingId) {
				await roomApi.update(editingId, {
					name: draft.name.trim(),
					basePrice: rate,
					totalUnits: inventory,
					status: draft.status === "Active" ? "active" : "inactive",
				});
			} else {
				await roomApi.create({
					property: draft.property,
					name: draft.name.trim(),
					type: "double",
					capacity: 2,
					beds: [{ type: "double", count: 1 }],
					basePrice: rate,
					totalUnits: inventory,
				});
			}
			setIsFormOpen(false);
			setEditingId(null);
			setDraft(emptyDraft);
			setReload((current) => current + 1);
		} catch (requestError) {
			setError(getApiErrorMessage(requestError, "Could not save this room type."));
		} finally {
			setSaving(false);
		}
	}

	function updateDraft<Key extends keyof RoomDraft>(key: Key, value: RoomDraft[Key]) {
		setDraft((currentDraft) => ({ ...currentDraft, [key]: value }));
	}

	return (
		<AccommodationPartnerLayout>
			<div className="mx-auto w-full max-w-[1440px]">
				<PageHeader
					title="Rooms & Inventory"
					subtitle="Manage room types, nightly rates, and availability across your properties."
					action={<button type="button" className="inline-flex items-center justify-center gap-2 rounded-[10px] border-0 bg-gradient-to-br from-[var(--gold)] to-[#b9781d] px-[1.1rem] py-[0.8rem] font-bold text-white shadow-[var(--shadow-soft)] hover:brightness-[0.98]" onClick={openNewRoomForm}><Plus size={16} /> Add room type</button>}
				/>

				<div className="mb-6 grid grid-cols-4 gap-4">
					<article className="rounded-[18px] border border-[rgba(130,110,92,0.18)] bg-[rgba(255,252,247,0.94)] shadow-[0_8px_18px_rgba(36,22,13,0.03)] flex items-center gap-4 rounded-[16px] border border-[rgba(130,110,92,0.18)] bg-[rgba(255,252,247,0.94)] p-4 shadow-[0_8px_18px_rgba(36,22,13,0.03)]">
						<span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[rgba(197,138,42,0.12)] text-[var(--gold)]"><BedDouble size={20} /></span>
						<div><span>Room types</span><strong>{rooms.length}</strong><small>Across all properties</small></div>
					</article>
					<article className="rounded-[18px] border border-[rgba(130,110,92,0.18)] bg-[rgba(255,252,247,0.94)] shadow-[0_8px_18px_rgba(36,22,13,0.03)] flex items-center gap-4 rounded-[16px] border border-[rgba(130,110,92,0.18)] bg-[rgba(255,252,247,0.94)] p-4 shadow-[0_8px_18px_rgba(36,22,13,0.03)]">
						<span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[rgba(197,138,42,0.12)] text-[var(--gold)]"><Building2 size={20} /></span>
						<div><span>Active inventory</span><strong>{activeInventory}</strong><small>Bookable rooms</small></div>
					</article>
					<article className="rounded-[18px] border border-[rgba(130,110,92,0.18)] bg-[rgba(255,252,247,0.94)] shadow-[0_8px_18px_rgba(36,22,13,0.03)] flex items-center gap-4 rounded-[16px] border border-[rgba(130,110,92,0.18)] bg-[rgba(255,252,247,0.94)] p-4 shadow-[0_8px_18px_rgba(36,22,13,0.03)]">
						<span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[rgba(197,138,42,0.12)] text-[var(--gold)]"><Users size={20} /></span>
						<div><span>Available tonight</span><strong>{availableRooms}</strong><small>{utilization}% occupancy</small></div>
					</article>
					<article className="rounded-[18px] border border-[rgba(130,110,92,0.18)] bg-[rgba(255,252,247,0.94)] shadow-[0_8px_18px_rgba(36,22,13,0.03)] flex items-center gap-4 rounded-[16px] border border-[rgba(130,110,92,0.18)] bg-[rgba(255,252,247,0.94)] p-4 shadow-[0_8px_18px_rgba(36,22,13,0.03)]">
						<span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[rgba(197,138,42,0.12)] text-[var(--gold)]"><Pause size={20} /></span>
						<div><span>Paused types</span><strong>{rooms.filter((room) => room.status === "Paused").length}</strong><small>Not currently bookable</small></div>
					</article>
				</div>
				<ApiFeedback loading={loading} error={error} onRetry={() => setReload((current) => current + 1)} />

				{isFormOpen ? (
					<form className="rounded-[18px] border border-[rgba(130,110,92,0.18)] bg-[rgba(255,252,247,0.94)] shadow-[0_8px_18px_rgba(36,22,13,0.03)] p-[22px] mb-5 rounded-[18px] border border-[rgba(130,110,92,0.18)] bg-[rgba(255,252,247,0.94)] p-5 shadow-[0_8px_18px_rgba(36,22,13,0.03)]" onSubmit={handleSaveRoom}>
						<div className="mb-4 [&_h2]:m-0 [&_p]:mt-1 [&_p]:text-sm [&_p]:text-[var(--text-soft)]">
							<div>
								<p className="mb-1.5 text-[0.68rem] font-extrabold uppercase tracking-[0.12em] text-[var(--text-soft)]">Room inventory</p>
								<h2>{editingId ? "Edit room type" : "Add a room type"}</h2>
							</div>
							<button type="button" className="inline-flex h-9 w-9 items-center justify-center gap-2 rounded-[10px] border-0 bg-[rgba(197,138,42,0.08)] text-[var(--gold)]" aria-label="Close room form" onClick={() => setIsFormOpen(false)}><X size={17} /></button>
						</div>
						<div className="grid grid-cols-2 gap-4">
							<label className="flex flex-col gap-2 text-[0.82rem] font-bold text-[var(--text-soft)] [&_input]:font-medium [&_select]:font-medium [&_textarea]:font-medium">
								<span>Room type name</span>
								<input required value={draft.name} onChange={(event) => updateDraft("name", event.target.value)} placeholder="e.g. Garden Suite" />
							</label>
							<label className="flex flex-col gap-2 text-[0.82rem] font-bold text-[var(--text-soft)] [&_input]:font-medium [&_select]:font-medium [&_textarea]:font-medium">
								<span>Property</span>
								<select disabled={Boolean(editingId)} value={draft.property} onChange={(event) => updateDraft("property", event.target.value)}>
									{properties.map((property) => <option key={property._id} value={property._id}>{property.name}</option>)}
								</select>
							</label>
							<label className="flex flex-col gap-2 text-[0.82rem] font-bold text-[var(--text-soft)] [&_input]:font-medium [&_select]:font-medium [&_textarea]:font-medium">
								<span>Total rooms</span>
								<input required type="number" min="1" value={draft.inventory} onChange={(event) => updateDraft("inventory", event.target.value)} />
							</label>
							<label className="flex flex-col gap-2 text-[0.82rem] font-bold text-[var(--text-soft)] [&_input]:font-medium [&_select]:font-medium [&_textarea]:font-medium">
								<span>Occupied tonight</span>
								<input required type="number" min="0" max={draft.inventory || undefined} value={draft.occupied} onChange={(event) => updateDraft("occupied", event.target.value)} />
							</label>
							<label className="flex flex-col gap-2 text-[0.82rem] font-bold text-[var(--text-soft)] [&_input]:font-medium [&_select]:font-medium [&_textarea]:font-medium">
								<span>Nightly rate (USD)</span>
								<input required type="number" min="1" value={draft.rate} onChange={(event) => updateDraft("rate", event.target.value)} />
							</label>
							<label className="flex flex-col gap-2 text-[0.82rem] font-bold text-[var(--text-soft)] [&_input]:font-medium [&_select]:font-medium [&_textarea]:font-medium">
								<span>Booking status</span>
								<select value={draft.status} onChange={(event) => updateDraft("status", event.target.value as RoomStatus)}>
									<option value="Active">Active</option>
									<option value="Paused">Paused</option>
								</select>
							</label>
						</div>
						<div className="mt-[18px] flex justify-between gap-3 justify-end">
							<button type="button" className="inline-flex items-center justify-center gap-2 rounded-[10px] border border-[var(--border)] bg-white px-[1.1rem] py-[0.8rem] font-bold text-[var(--text)]" onClick={() => setIsFormOpen(false)}>Cancel</button>
							<button type="submit" className="inline-flex items-center justify-center gap-2 rounded-[10px] border-0 bg-gradient-to-br from-[var(--gold)] to-[#b9781d] px-[1.1rem] py-[0.8rem] font-bold text-white shadow-[var(--shadow-soft)] hover:brightness-[0.98]" disabled={saving || properties.length === 0}>{saving ? "Saving..." : editingId ? "Save changes" : "Add room type"}</button>
						</div>
					</form>
				) : null}

				<section className="rounded-[18px] border border-[rgba(130,110,92,0.18)] bg-[rgba(255,252,247,0.94)] shadow-[0_8px_18px_rgba(36,22,13,0.03)] rounded-[18px] border border-[rgba(130,110,92,0.18)] bg-[rgba(255,252,247,0.94)] p-4 shadow-[0_8px_18px_rgba(36,22,13,0.03)]" aria-label="Room type inventory">
					<div className="mb-4 flex flex-wrap items-center justify-between gap-3">
						<div className="flex flex-wrap items-center gap-3">
							<label className="flex min-w-[220px] items-center gap-2 rounded-[10px] border border-[var(--border)] bg-[var(--surface-soft)] px-3 [&_input]:border-0 [&_input]:bg-transparent [&_input]:pl-0 [&_input]:shadow-none [&_input]:focus:ring-0">
								<Search size={15} />
								<input aria-label="Search room types" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search room or property" />
							</label>
							<select aria-label="Filter by property" value={propertyFilter} onChange={(event) => setPropertyFilter(event.target.value)}>
								<option>All properties</option>
								{properties.map((property) => <option key={property._id} value={property._id}>{property.name}</option>)}
							</select>
							<select aria-label="Filter by status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
								<option>All statuses</option>
								<option>Active</option>
								<option>Paused</option>
							</select>
						</div>
						<span className="text-sm text-[var(--text-soft)]">Showing {filteredRooms.length} of {rooms.length} room types</span>
					</div>

					<div className="w-full overflow-x-auto [&_table]:w-full [&_table]:border-collapse [&_th]:border-b [&_th]:border-[var(--border)] [&_th]:px-[0.8rem] [&_th]:py-[0.9rem] [&_th]:text-left [&_th]:text-[0.76rem] [&_th]:font-extrabold [&_th]:uppercase [&_th]:tracking-[0.08em] [&_th]:text-[var(--text-soft)] [&_td]:border-b [&_td]:border-[var(--border)] [&_td]:px-[0.8rem] [&_td]:py-[0.9rem] [&_td]:text-left [&_td]:text-[var(--text)]">
						<table className="w-full border-collapse [&_th]:border-b [&_th]:border-[var(--border)] [&_th]:px-3 [&_th]:py-3 [&_th]:text-left [&_th]:text-xs [&_th]:font-extrabold [&_th]:uppercase [&_th]:tracking-wider [&_th]:text-[var(--text-soft)] [&_td]:border-b [&_td]:border-[var(--border)] [&_td]:px-3 [&_td]:py-3 [&_td]:text-sm">
							<thead>
								<tr>
									<th>Room type</th>
									<th>Property</th>
									<th>Inventory</th>
									<th>Occupancy</th>
									<th>Nightly rate</th>
									<th>Status</th>
									<th><span className="sr-only">Actions</span></th>
								</tr>
							</thead>
							<tbody>
								{filteredRooms.map((room) => {
									const occupancy = room.inventory ? Math.round((room.occupied / room.inventory) * 100) : 0;
									return (
										<tr key={room.id}>
											<td><span className="font-bold text-[var(--text)]"><BedDouble size={16} />{room.name}</span></td>
											<td>{room.property}</td>
											<td>{room.inventory} rooms</td>
											<td>
												<div className="min-w-[120px]">
													<span>{room.occupied} of {room.inventory}</span>
													<span className="h-2 overflow-hidden rounded-full bg-[var(--border)] [&>span]:block [&>span]:h-full [&>span]:rounded-full [&>span]:bg-[var(--gold)]" role="progressbar" aria-label={`${room.name} occupancy`} aria-valuenow={occupancy} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${occupancy}%` }} /></span>
												</div>
											</td>
											<td>${room.rate.toLocaleString()}</td>
											<td><StatusBadge status={room.status} /></td>
											<td>
												<div className="flex items-center justify-end gap-2">
													<button type="button" className="inline-flex h-9 w-9 items-center justify-center gap-2 rounded-[10px] border-0 bg-[rgba(197,138,42,0.08)] text-[var(--gold)]" aria-label={`Edit ${room.name}`} onClick={() => openEditRoomForm(room)}><Pencil size={15} /></button>
													<Link to="/partner/accommodation/availability" className="font-semibold text-[var(--gold)] underline">Rates</Link>
												</div>
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
						{filteredRooms.length === 0 ? (
							<div className="flex min-h-[150px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-soft)] p-6 text-center text-[var(--text-soft)] [&_strong]:text-[var(--text)]">
								<BedDouble size={22} />
								<strong>No room types match these filters</strong>
								<span>Try another search or clear your filters.</span>
								<button type="button" className="inline-flex items-center justify-center gap-2 border-0 bg-transparent font-bold text-[var(--gold)] underline" onClick={() => { setSearch(""); setPropertyFilter("All properties"); setStatusFilter("All statuses"); }}>Clear filters</button>
							</div>
						) : null}
					</div>
				</section>
			</div>
		</AccommodationPartnerLayout>
	);
}
