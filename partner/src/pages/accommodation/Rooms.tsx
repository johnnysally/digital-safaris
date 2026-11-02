import { useEffect, useState, type FormEvent } from "react";
import { BedDouble, Building2, Pause, Pencil, Plus, Search, Users, X } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { getApiErrorMessage } from "../../api/axios";
import availabilityApi from "../../api/accommodation/availabilityApi";
import propertyApi from "../../api/accommodation/propertyApi";
import roomApi, { MAX_ROOM_PHOTOS } from "../../api/accommodation/roomApi";
import type { Property, Room, RoomAvailability } from "../../types";
import {
  AccommodationPartnerLayout,
  ApiFeedback,
  PageHeader,
  StatusBadge,
} from "../../components/layout/Layout";
import { PhotoGallery } from "../../components/ui/PhotoGallery";
import { formatCurrency } from "../../utils/formatCurrency";

type RoomStatus = "Active" | "Paused";
type RoomTypeValue = Room["type"];
type BedTypeValue = Room["beds"][number]["type"];

interface RoomTypeRow {
  id: string;
  propertyId: string;
  name: string;
  property: string;
  inventory: number;
  occupied: number;
  rate: number;
  currency: string;
  status: RoomStatus;
  type: RoomTypeValue;
  capacity: number;
  beds: Room["beds"];
  description: string;
  images: string[];
}

interface RoomDraft {
  name: string;
  property: string;
  type: RoomTypeValue;
  capacity: string;
  bedType: BedTypeValue;
  bedCount: string;
  description: string;
  inventory: string;
  rate: string;
  status: RoomStatus;
  images: string[];
}

const emptyDraft: RoomDraft = {
  name: "",
  property: "",
  type: "double",
  capacity: "2",
  bedType: "double",
  bedCount: "1",
  description: "",
  inventory: "",
  rate: "",
  status: "Active",
  images: [],
};

const roomTypeOptions: { value: RoomTypeValue; label: string }[] = [
  { value: "single", label: "Single" },
  { value: "double", label: "Double" },
  { value: "twin", label: "Twin" },
  { value: "suite", label: "Suite" },
  { value: "deluxe", label: "Deluxe" },
  { value: "family", label: "Family" },
  { value: "tent", label: "Tent" },
  { value: "villa", label: "Villa" },
  { value: "apartment", label: "Apartment" },
];

const bedTypeOptions: { value: BedTypeValue; label: string }[] = [
  { value: "single", label: "Single" },
  { value: "double", label: "Double" },
  { value: "queen", label: "Queen" },
  { value: "king", label: "King" },
  { value: "bunk", label: "Bunk" },
];

const fieldClass =
  "flex flex-col gap-2 text-[0.82rem] font-bold text-[var(--text-soft)] [&_input]:font-medium [&_select]:font-medium [&_textarea]:font-medium";

export function RoomsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [rooms, setRooms] = useState<RoomTypeRow[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [search, setSearch] = useState("");
  const [propertyFilter, setPropertyFilter] = useState(
    searchParams.get("property") ?? "All properties",
  );
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
        const [propertyData, roomData] = await Promise.all([
          propertyApi.list(),
          roomApi.list(),
        ]);
        const today = new Date().toISOString().slice(0, 10);
        const availability = await availabilityApi.list({
          from: today,
          to: today,
        });
        if (cancelled) return;

        setProperties(propertyData);
        const propertyNames = new Map(
          propertyData.map((property) => [property._id, property.name]),
        );
        const availabilityByRoom = new Map<string, RoomAvailability>();
        availability.forEach((item) => availabilityByRoom.set(item.room, item));
        setRooms(
          roomData.map((room: Room) => {
            const todayAvailability = availabilityByRoom.get(room._id);
            return {
              id: room._id,
              propertyId: room.property,
              name: room.name,
              property: propertyNames.get(room.property) ?? "Property",
              inventory: room.totalUnits,
              occupied: todayAvailability?.bookedUnits ?? 0,
              rate: room.basePrice,
              currency: room.currency || "KES",
              status: room.status === "active" ? "Active" : "Paused",
              type: room.type,
              capacity: room.capacity,
              beds: room.beds,
              description: room.description ?? "",
              images: room.images ?? [],
            };
          }),
        );
      } catch (requestError) {
        if (!cancelled)
          setError(
            getApiErrorMessage(requestError, "Could not load room inventory."),
          );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadRooms();
    return () => {
      cancelled = true;
    };
  }, [reload]);

  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    if (propertyFilter === "All properties") next.delete("property");
    else next.set("property", propertyFilter);
    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyFilter]);

  const activeRooms = rooms.filter((room) => room.status === "Active");
  const activeInventory = activeRooms.reduce((total, room) => total + room.inventory, 0);
  const activeOccupied = activeRooms.reduce((total, room) => total + room.occupied, 0);
  const availableRooms = activeInventory - activeOccupied;
  const utilization = activeInventory
    ? Math.round((activeOccupied / activeInventory) * 100)
    : 0;
  const filteredRooms = rooms.filter((room) => {
    const matchesSearch = `${room.name} ${room.property}`
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesProperty =
      propertyFilter === "All properties" || room.propertyId === propertyFilter;
    const matchesStatus =
      statusFilter === "All statuses" || room.status === statusFilter;
    return matchesSearch && matchesProperty && matchesStatus;
  });

  function resolveTargetPropertyId(): string {
    if (propertyFilter !== "All properties") {
      const found = properties.find((p) => p._id === propertyFilter);
      if (found) return found._id;
    }
    return properties[0]?._id ?? "";
  }

  function openNewRoomForm() {
    setEditingId(null);
    setDraft({ ...emptyDraft, property: resolveTargetPropertyId() });
    setIsFormOpen(true);
  }

  function openEditRoomForm(room: RoomTypeRow) {
    setEditingId(room.id);
    setDraft({
      name: room.name,
      property: room.propertyId,
      type: room.type,
      capacity: String(room.capacity),
      bedType: room.beds[0]?.type ?? "double",
      bedCount: String(room.beds[0]?.count ?? 1),
      description: room.description,
      inventory: String(room.inventory),
      rate: String(room.rate),
      status: room.status,
      images: room.images,
    });
    setIsFormOpen(true);
  }

  async function handleUploadImage(file: File): Promise<{ url: string }> {
    if (editingId) {
      const result = await roomApi.uploadImageToRoom(editingId, file);
      setDraft((current) => ({ ...current, images: result.images }));
      return { url: result.url };
    }
    const result = await roomApi.uploadImage(file);
    return { url: result.url };
  }

  async function handleRemoveImage(url: string): Promise<void> {
    if (editingId) {
      const result = await roomApi.removeImageFromRoom(editingId, url);
      setDraft((current) => ({ ...current, images: result.images }));
    }
  }

  async function handleReorderImages(next: string[]): Promise<void> {
    setDraft((current) => ({ ...current, images: next }));
    if (editingId) {
      try {
        await roomApi.update(editingId, { images: next });
      } catch (requestError) {
        setError(
          getApiErrorMessage(requestError, "Could not save photo order."),
        );
      }
    }
  }

  async function handleSaveRoom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const inventory = Number(draft.inventory);
    const rate = Number(draft.rate);
    const capacity = Number(draft.capacity);
    const bedCount = Number(draft.bedCount);

    if (!draft.name.trim() || !draft.property) {
      setError("Provide a room name and choose a property.");
      return;
    }
    if (!Number.isFinite(inventory) || inventory < 1) {
      setError("Total rooms must be at least 1.");
      return;
    }
    if (!Number.isFinite(rate) || rate < 1) {
      setError("Nightly rate must be at least 1.");
      return;
    }
    if (!Number.isFinite(capacity) || capacity < 1) {
      setError("Guest capacity must be at least 1.");
      return;
    }
    if (!Number.isFinite(bedCount) || bedCount < 1) {
      setError("Bed count must be at least 1.");
      return;
    }
    if (draft.images.length > MAX_ROOM_PHOTOS) {
      setError(`A room can have at most ${MAX_ROOM_PHOTOS} photos.`);
      return;
    }

    setSaving(true);
    setError("");
    try {
      const payload = {
        property: draft.property,
        name: draft.name.trim(),
        type: draft.type,
        capacity,
        beds: [{ type: draft.bedType, count: bedCount }],
        description: draft.description.trim(),
        basePrice: rate,
        totalUnits: inventory,
        status: draft.status === "Active" ? ("active" as const) : ("inactive" as const),
        images: draft.images,
      };

      if (editingId) {
        await roomApi.update(editingId, payload);
      } else {
        await roomApi.create(payload);
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

  function currencyFor(propertyId: string): string {
    void propertyId;
    return "KES";
  }

  return (
    <AccommodationPartnerLayout>
      <div className="mx-auto w-full max-w-[1440px]">
        <PageHeader
          title="Rooms & Inventory"
          subtitle="Manage room types, nightly rates, and availability across your properties."
          action={
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-[10px] border-0 bg-gradient-to-br from-[var(--gold)] to-[#b9781d] px-[1.1rem] py-[0.8rem] font-bold text-white shadow-[var(--shadow-soft)] hover:brightness-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              onClick={openNewRoomForm}
              disabled={properties.length === 0}
              title={properties.length === 0 ? "Create a property first" : undefined}
            >
              <Plus size={16} /> Add room type
            </button>
          }
        />

        <div className="mb-6 grid grid-cols-4 gap-4">
          <article className="flex items-center gap-4 rounded-[16px] border border-[rgba(130,110,92,0.18)] bg-[rgba(255,252,247,0.94)] p-4 shadow-[0_8px_18px_rgba(36,22,13,0.03)]">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[rgba(197,138,42,0.12)] text-[var(--gold)]">
              <BedDouble size={20} />
            </span>
            <div>
              <span>Room types</span>
              <strong>{rooms.length}</strong>
              <small>Across all properties</small>
            </div>
          </article>
          <article className="flex items-center gap-4 rounded-[16px] border border-[rgba(130,110,92,0.18)] bg-[rgba(255,252,247,0.94)] p-4 shadow-[0_8px_18px_rgba(36,22,13,0.03)]">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[rgba(197,138,42,0.12)] text-[var(--gold)]">
              <Building2 size={20} />
            </span>
            <div>
              <span>Active inventory</span>
              <strong>{activeInventory}</strong>
              <small>Bookable rooms</small>
            </div>
          </article>
          <article className="flex items-center gap-4 rounded-[16px] border border-[rgba(130,110,92,0.18)] bg-[rgba(255,252,247,0.94)] p-4 shadow-[0_8px_18px_rgba(36,22,13,0.03)]">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[rgba(197,138,42,0.12)] text-[var(--gold)]">
              <Users size={20} />
            </span>
            <div>
              <span>Available tonight</span>
              <strong>{availableRooms}</strong>
              <small>{utilization}% occupancy</small>
            </div>
          </article>
          <article className="flex items-center gap-4 rounded-[16px] border border-[rgba(130,110,92,0.18)] bg-[rgba(255,252,247,0.94)] p-4 shadow-[0_8px_18px_rgba(36,22,13,0.03)]">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[rgba(197,138,42,0.12)] text-[var(--gold)]">
              <Pause size={20} />
            </span>
            <div>
              <span>Paused types</span>
              <strong>{rooms.filter((room) => room.status === "Paused").length}</strong>
              <small>Not currently bookable</small>
            </div>
          </article>
        </div>

        <ApiFeedback loading={loading} error={error} onRetry={() => setReload((current) => current + 1)} />

        {isFormOpen ? (
          <form
            className="mb-5 rounded-[18px] border border-[rgba(130,110,92,0.18)] bg-[rgba(255,252,247,0.94)] p-5 shadow-[0_8px_18px_rgba(36,22,13,0.03)]"
            onSubmit={handleSaveRoom}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="mb-1.5 text-[0.68rem] font-extrabold uppercase tracking-[0.12em] text-[var(--text-soft)]">
                  Room inventory
                </p>
                <h2 className="m-0 font-serif text-xl text-[var(--text)]">
                  {editingId ? "Edit room type" : "Add a room type"}
                </h2>
                <p className="mt-1 text-[0.78rem] text-[var(--text-soft)]">
                  These details define what guests can book for this property.
                </p>
              </div>
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] border-0 bg-[rgba(197,138,42,0.08)] text-[var(--gold)]"
                aria-label="Close room form"
                onClick={() => setIsFormOpen(false)}
              >
                <X size={17} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 max-[760px]:grid-cols-1">
              <label className={fieldClass}>
                <span>Room type name</span>
                <input
                  required
                  value={draft.name}
                  onChange={(event) => updateDraft("name", event.target.value)}
                  placeholder="e.g. Garden Suite"
                />
              </label>

              <label className={fieldClass}>
                <span>Property</span>
                <select
                  disabled={Boolean(editingId)}
                  value={draft.property}
                  onChange={(event) => updateDraft("property", event.target.value)}
                >
                  {properties.length === 0 ? (
                    <option value="">No properties yet</option>
                  ) : (
                    properties.map((property) => (
                      <option key={property._id} value={property._id}>
                        {property.name}
                      </option>
                    ))
                  )}
                </select>
              </label>

              <label className={fieldClass}>
                <span>Room type</span>
                <select
                  value={draft.type}
                  onChange={(event) =>
                    updateDraft("type", event.target.value as RoomTypeValue)
                  }
                >
                  {roomTypeOptions.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              <label className={fieldClass}>
                <span>Guest capacity</span>
                <input
                  required
                  type="number"
                  min="1"
                  value={draft.capacity}
                  onChange={(event) => updateDraft("capacity", event.target.value)}
                />
              </label>

              <label className={fieldClass}>
                <span>Bed type</span>
                <select
                  value={draft.bedType}
                  onChange={(event) =>
                    updateDraft("bedType", event.target.value as BedTypeValue)
                  }
                >
                  {bedTypeOptions.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              <label className={fieldClass}>
                <span>Bed count</span>
                <input
                  required
                  type="number"
                  min="1"
                  value={draft.bedCount}
                  onChange={(event) => updateDraft("bedCount", event.target.value)}
                />
              </label>

              <label className={fieldClass}>
                <span>Total rooms</span>
                <input
                  required
                  type="number"
                  min="1"
                  value={draft.inventory}
                  onChange={(event) => updateDraft("inventory", event.target.value)}
                />
              </label>

              <label className={fieldClass}>
                <span>Nightly rate ({currencyFor(draft.property)})</span>
                <input
                  required
                  type="number"
                  min="1"
                  step="0.01"
                  value={draft.rate}
                  onChange={(event) => updateDraft("rate", event.target.value)}
                />
              </label>

              <label className={`${fieldClass} col-span-2 max-[760px]:col-span-1`}>
                <span>Booking status</span>
                <select
                  value={draft.status}
                  onChange={(event) =>
                    updateDraft("status", event.target.value as RoomStatus)
                  }
                >
                  <option value="Active">Active</option>
                  <option value="Paused">Paused</option>
                </select>
              </label>

              <label className={`${fieldClass} col-span-2 max-[760px]:col-span-1`}>
                <span>Description (optional)</span>
                <textarea
                  rows={3}
                  value={draft.description}
                  onChange={(event) =>
                    updateDraft("description", event.target.value)
                  }
                  placeholder="What makes this room special?"
                />
              </label>

              <div className="col-span-2 max-[760px]:col-span-1">
                <PhotoGallery
                  images={draft.images}
                  onChange={(next) => void handleReorderImages(next)}
                  onUpload={(file) => handleUploadImage(file)}
                  onRemove={(url) => handleRemoveImage(url)}
                  max={MAX_ROOM_PHOTOS}
                  label="Room photos"
                  helpText={`Add up to ${MAX_ROOM_PHOTOS} photos of this room type. The first image is used as the cover.`}
                />
              </div>
            </div>

            <div className="mt-[18px] flex justify-end gap-3">
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-[10px] border border-[var(--border)] bg-white px-[1.1rem] py-[0.8rem] font-bold text-[var(--text)]"
                onClick={() => setIsFormOpen(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-[10px] border-0 bg-gradient-to-br from-[var(--gold)] to-[#b9781d] px-[1.1rem] py-[0.8rem] font-bold text-white shadow-[var(--shadow-soft)] hover:brightness-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                disabled={saving || properties.length === 0}
              >
                {saving
                  ? "Saving..."
                  : editingId
                    ? "Save changes"
                    : "Add room type"}
              </button>
            </div>
          </form>
        ) : null}

        <section
          className="rounded-[18px] border border-[rgba(130,110,92,0.18)] bg-[rgba(255,252,247,0.94)] p-4 shadow-[0_8px_18px_rgba(36,22,13,0.03)]"
          aria-label="Room type inventory"
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex min-w-[220px] items-center gap-2 rounded-[10px] border border-[var(--border)] bg-[var(--surface-soft)] px-3 [&_input]:border-0 [&_input]:bg-transparent [&_input]:pl-0 [&_input]:shadow-none [&_input]:focus:ring-0">
                <Search size={15} />
                <input
                  aria-label="Search room types"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search room or property"
                />
              </label>
              <select
                aria-label="Filter by property"
                value={propertyFilter}
                onChange={(event) => setPropertyFilter(event.target.value)}
              >
                <option>All properties</option>
                {properties.map((property) => (
                  <option key={property._id} value={property._id}>
                    {property.name}
                  </option>
                ))}
              </select>
              <select
                aria-label="Filter by status"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option>All statuses</option>
                <option>Active</option>
                <option>Paused</option>
              </select>
            </div>
            <span className="text-sm text-[var(--text-soft)]">
              Showing {filteredRooms.length} of {rooms.length} room types
            </span>
          </div>

          <div className="w-full overflow-x-auto">
            <table className="w-full border-collapse [&_th]:border-b [&_th]:border-[var(--border)] [&_th]:px-3 [&_th]:py-3 [&_th]:text-left [&_th]:text-xs [&_th]:font-extrabold [&_th]:uppercase [&_th]:tracking-wider [&_th]:text-[var(--text-soft)] [&_td]:border-b [&_td]:border-[var(--border)] [&_td]:px-3 [&_td]:py-3 [&_td]:text-sm">
              <thead>
                <tr>
                  <th>Room type</th>
                  <th>Property</th>
                  <th>Inventory</th>
                  <th>Occupancy</th>
                  <th>Nightly rate</th>
                  <th>Photos</th>
                  <th>Status</th>
                  <th>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredRooms.map((room) => {
                  const occupancy = room.inventory
                    ? Math.round((room.occupied / room.inventory) * 100)
                    : 0;
                  return (
                    <tr key={room.id}>
                      <td>
                        <span className="inline-flex items-center gap-2 font-bold text-[var(--text)]">
                          <BedDouble size={16} />
                          {room.name}
                        </span>
                      </td>
                      <td>{room.property}</td>
                      <td>{room.inventory} rooms</td>
                      <td>
                        <div className="min-w-[120px]">
                          <span>
                            {room.occupied} of {room.inventory}
                          </span>
                          <span
                            className="block h-2 overflow-hidden rounded-full bg-[var(--border)]"
                            role="progressbar"
                            aria-label={`${room.name} occupancy`}
                            aria-valuenow={occupancy}
                            aria-valuemin={0}
                            aria-valuemax={100}
                          >
                            <span
                              className="block h-full rounded-full bg-[var(--gold)]"
                              style={{ width: `${occupancy}%` }}
                            />
                          </span>
                        </div>
                      </td>
                      <td>{formatCurrency(room.rate, room.currency)}</td>
                      <td>
                        <span className="inline-flex items-center gap-1 text-xs text-[var(--text-soft)]">
                          {room.images.length}/{MAX_ROOM_PHOTOS}
                        </span>
                      </td>
                      <td>
                        <StatusBadge status={room.status} />
                      </td>
                      <td>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] border-0 bg-[rgba(197,138,42,0.08)] text-[var(--gold)]"
                            aria-label={`Edit ${room.name}`}
                            onClick={() => openEditRoomForm(room)}
                          >
                            <Pencil size={15} />
                          </button>
                          <Link
                            to="/partner/accommodation/availability"
                            className="font-semibold text-[var(--gold)] underline"
                          >
                            Rates
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredRooms.length === 0 ? (
              <div className="flex min-h-[150px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-soft)] p-6 text-center text-[var(--text-soft)]">
                <BedDouble size={22} />
                <strong className="text-[var(--text)]">
                  {rooms.length === 0 ? "No room types yet" : "No room types match these filters"}
                </strong>
                <span>
                  {rooms.length === 0
                    ? properties.length === 0
                      ? "Create a property first, then add room types."
                      : "Add a room type to make your property bookable."
                    : "Try another search or clear your filters."}
                </span>
                {rooms.length === 0 ? (
                  <button
                    type="button"
                    className="inline-flex items-center justify-center gap-2 rounded-[10px] border-0 bg-gradient-to-br from-[var(--gold)] to-[#b9781d] px-[1.1rem] py-[0.7rem] font-bold text-white"
                    onClick={openNewRoomForm}
                    disabled={properties.length === 0}
                  >
                    <Plus size={15} /> Add room type
                  </button>
                ) : (
                  <button
                    type="button"
                    className="border-0 bg-transparent font-bold text-[var(--gold)] underline"
                    onClick={() => {
                      setSearch("");
                      setPropertyFilter("All properties");
                      setStatusFilter("All statuses");
                    }}
                  >
                    Clear filters
                  </button>
                )}
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </AccommodationPartnerLayout>
  );
}