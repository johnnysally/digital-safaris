import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { MapPin, Pencil, Plus, Star } from "lucide-react";
import propertyApi, { type PropertyLocation } from "../../api/accommodation/propertyApi";
import { getApiErrorMessage } from "../../api/axios";
import type { Property } from "../../types";
import { AccommodationPartnerLayout, ApiFeedback, PageHeader, StatusBadge } from "../../components/layout/Layout";

const fallbackImages = [
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1502920514313-52581002a659?auto=format&fit=crop&w=1200&q=80",
];

interface PropertyDraft {
  name: string;
  type: string;
  location: string;
  town: string;
  address: string;
  latitude: string;
  longitude: string;
  description: string;
  totalRooms: string;
  checkInTime: string;
  checkOutTime: string;
}

const blankDraft: PropertyDraft = {
  name: "",
  type: "lodge",
  location: "",
  town: "",
  address: "",
  latitude: "",
  longitude: "",
  description: "",
  totalRooms: "0",
  checkInTime: "14:00",
  checkOutTime: "11:00",
};

interface PropertyPageProps {
  mode?: "list" | "new" | "edit";
}

export function PropertyPage({ mode = "list" }: PropertyPageProps) {
  const { propertyId } = useParams();
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>([]);
  const [locations, setLocations] = useState<PropertyLocation[]>([]);
  const [draft, setDraft] = useState<PropertyDraft>(blankDraft);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function loadPage() {
      setLoading(true);
      setError("");
      try {
        if (mode === "list") {
          const propertyList = await propertyApi.list();
          if (!cancelled) setProperties(propertyList);
        } else {
          const [availableLocations, details] = await Promise.all([
            propertyApi.locations(),
            mode === "edit" && propertyId ? propertyApi.details(propertyId) : Promise.resolve(null),
          ]);
          if (cancelled) return;
          setLocations(availableLocations);
          if (details) {
            const property = details.property;
            setDraft({
              name: property.name,
              type: property.type,
              location: property.location ?? "",
              town: property.town,
              address: property.address,
              latitude: String(property.latitude),
              longitude: String(property.longitude),
              description: property.description ?? "",
              totalRooms: String(property.totalRooms),
              checkInTime: property.checkInTime,
              checkOutTime: property.checkOutTime,
            });
          }
        }
      } catch (requestError) {
        if (!cancelled) setError(getApiErrorMessage(requestError, "Could not load property data."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadPage();
    return () => { cancelled = true; };
  }, [mode, propertyId, reload]);

  function updateDraft<Key extends keyof PropertyDraft>(key: Key, value: PropertyDraft[Key]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function saveProperty(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const payload = {
      name: draft.name.trim(),
      type: draft.type,
      location: draft.location,
      town: draft.town.trim(),
      address: draft.address.trim(),
      latitude: Number(draft.latitude),
      longitude: Number(draft.longitude),
      description: draft.description.trim(),
      totalRooms: Number(draft.totalRooms),
      checkInTime: draft.checkInTime,
      checkOutTime: draft.checkOutTime,
    };

    try {
      if (mode === "edit" && propertyId) await propertyApi.update(propertyId, payload);
      else await propertyApi.create(payload);
      navigate("/partner/accommodation/properties");
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Could not save this property."));
    } finally {
      setSaving(false);
    }
  }

  if (mode !== "list") {
    return (
      <AccommodationPartnerLayout>
        <div className="mx-auto w-full max-w-[1440px]">
          <PageHeader title={mode === "new" ? "Add New Property" : "Edit Property"} subtitle="Manage the location and guest details for this listing." />
          <ApiFeedback loading={loading} error={error} onRetry={() => setReload((current) => current + 1)} />
          <form className="rounded-[18px] border border-[rgba(130,110,92,0.18)] bg-[rgba(255,252,247,0.94)] shadow-[0_8px_18px_rgba(36,22,13,0.03)] p-[22px]" onSubmit={saveProperty}>
            <div className="grid grid-cols-2 gap-[18px]">
              <label className="flex flex-col gap-2 text-[0.82rem] font-bold text-[var(--text-soft)] [&_input]:font-medium [&_select]:font-medium [&_textarea]:font-medium"><span>Property name</span><input required value={draft.name} onChange={(event) => updateDraft("name", event.target.value)} /></label>
              <label className="flex flex-col gap-2 text-[0.82rem] font-bold text-[var(--text-soft)] [&_input]:font-medium [&_select]:font-medium [&_textarea]:font-medium"><span>Property type</span><select value={draft.type} onChange={(event) => updateDraft("type", event.target.value)}><option value="hotel">Hotel</option><option value="lodge">Lodge</option><option value="camp">Safari camp</option><option value="resort">Resort</option><option value="bnb">B&amp;B</option><option value="guesthouse">Guest house</option><option value="villa">Villa</option><option value="apartment">Apartment</option></select></label>
              <label className="flex flex-col gap-2 text-[0.82rem] font-bold text-[var(--text-soft)] [&_input]:font-medium [&_select]:font-medium [&_textarea]:font-medium"><span>Operational location</span><select required value={draft.location} onChange={(event) => {
                const location = locations.find((item) => item._id === event.target.value);
                setDraft((current) => ({ ...current, location: event.target.value, town: location?.name ?? current.town, latitude: String(location?.latitude ?? current.latitude), longitude: String(location?.longitude ?? current.longitude) }));
              }}><option value="">Select a location</option>{locations.map((location) => <option key={location._id} value={location._id}>{location.name}{location.county ? `, ${location.county}` : ""}</option>)}</select></label>
              <label className="flex flex-col gap-2 text-[0.82rem] font-bold text-[var(--text-soft)] [&_input]:font-medium [&_select]:font-medium [&_textarea]:font-medium"><span>Town / locality</span><input required value={draft.town} onChange={(event) => updateDraft("town", event.target.value)} /></label>
              <label className="flex flex-col gap-2 text-[0.82rem] font-bold text-[var(--text-soft)] [&_input]:font-medium [&_select]:font-medium [&_textarea]:font-medium col-span-2"><span>Street address</span><input required value={draft.address} onChange={(event) => updateDraft("address", event.target.value)} /></label>
              <label className="flex flex-col gap-2 text-[0.82rem] font-bold text-[var(--text-soft)] [&_input]:font-medium [&_select]:font-medium [&_textarea]:font-medium"><span>Latitude</span><input required type="number" step="any" value={draft.latitude} onChange={(event) => updateDraft("latitude", event.target.value)} /></label>
              <label className="flex flex-col gap-2 text-[0.82rem] font-bold text-[var(--text-soft)] [&_input]:font-medium [&_select]:font-medium [&_textarea]:font-medium"><span>Longitude</span><input required type="number" step="any" value={draft.longitude} onChange={(event) => updateDraft("longitude", event.target.value)} /></label>
              <label className="flex flex-col gap-2 text-[0.82rem] font-bold text-[var(--text-soft)] [&_input]:font-medium [&_select]:font-medium [&_textarea]:font-medium"><span>Total rooms</span><input required type="number" min="0" value={draft.totalRooms} onChange={(event) => updateDraft("totalRooms", event.target.value)} /></label>
              <label className="flex flex-col gap-2 text-[0.82rem] font-bold text-[var(--text-soft)] [&_input]:font-medium [&_select]:font-medium [&_textarea]:font-medium"><span>Check-in time</span><input type="time" value={draft.checkInTime} onChange={(event) => updateDraft("checkInTime", event.target.value)} /></label>
              <label className="flex flex-col gap-2 text-[0.82rem] font-bold text-[var(--text-soft)] [&_input]:font-medium [&_select]:font-medium [&_textarea]:font-medium"><span>Check-out time</span><input type="time" value={draft.checkOutTime} onChange={(event) => updateDraft("checkOutTime", event.target.value)} /></label>
              <label className="flex flex-col gap-2 text-[0.82rem] font-bold text-[var(--text-soft)] [&_input]:font-medium [&_select]:font-medium [&_textarea]:font-medium col-span-2"><span>Description</span><textarea rows={5} value={draft.description} onChange={(event) => updateDraft("description", event.target.value)} /></label>
            </div>
            <div className="mt-[18px] flex justify-between gap-3 justify-end">
              <Link to="/partner/accommodation/properties" className="inline-flex items-center justify-center gap-2 rounded-[10px] border border-[var(--border)] bg-white px-[1.1rem] py-[0.8rem] font-bold text-[var(--text)]">Cancel</Link>
              <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-[10px] border-0 bg-gradient-to-br from-[var(--gold)] to-[#b9781d] px-[1.1rem] py-[0.8rem] font-bold text-white shadow-[var(--shadow-soft)] hover:brightness-[0.98]" disabled={saving || loading || locations.length === 0}>{saving ? "Saving..." : mode === "new" ? "Create property" : "Save changes"}</button>
            </div>
          </form>
        </div>
      </AccommodationPartnerLayout>
    );
  }

  return (
    <AccommodationPartnerLayout>
      <div className="mx-auto w-full max-w-[1440px]">
        <PageHeader title="My Properties" subtitle="Manage your accommodation listings and details." action={<Link to="/partner/accommodation/properties/new" className="inline-flex items-center justify-center gap-2 rounded-[10px] border-0 bg-gradient-to-br from-[var(--gold)] to-[#b9781d] px-[1.1rem] py-[0.8rem] font-bold text-white shadow-[var(--shadow-soft)] hover:brightness-[0.98]"><Plus size={16} /> Add Property</Link>} />
        <ApiFeedback loading={loading} error={error} onRetry={() => setReload((current) => current + 1)} />

        <div className="grid grid-cols-[repeat(auto-fit,minmax(290px,1fr))] gap-[22px]">
          {properties.map((property, index) => (
            <article key={property._id} className="rounded-[18px] border border-[rgba(130,110,92,0.18)] bg-[rgba(255,252,247,0.94)] shadow-[0_8px_18px_rgba(36,22,13,0.03)] overflow-hidden">
              <img src={property.images?.[0] ?? fallbackImages[index % fallbackImages.length]} alt={property.name} className="h-[190px] w-full object-cover" />
              <div className="p-[18px]">
                <div className="mb-3 flex items-start justify-between gap-2.5 [&_h3]:m-0 [&_p]:mt-1 [&_p]:text-[var(--text-soft)]">
                  <div>
                    <h3>{property.name}</h3>
                    <p>{property.type}</p>
                  </div>
                  <Link to={`/partner/accommodation/properties/${property._id}/edit`} className="inline-flex h-9 w-9 items-center justify-center gap-2 rounded-[10px] border-0 bg-[rgba(197,138,42,0.08)] text-[var(--gold)]" aria-label={`Edit ${property.name}`}>
                    <Pencil size={15} />
                  </Link>
                </div>

                <div className="mb-2 flex items-center gap-2 text-[0.82rem] text-[var(--text-soft)]"><MapPin size={14} /> {property.town}, {property.address}</div>
                <div className="my-3 flex items-center justify-between gap-3.5 text-[var(--text-soft)] [&_span]:inline-flex [&_span]:items-center [&_span]:gap-1.5">
                  <span><Star size={14} /> {property.rating}</span>
                  <span>{property.totalRatings} reviews</span>
                </div>

                <div className="mb-3.5">
                  <StatusBadge status={property.status === "active" ? "Active" : property.status} />
                </div>

                <div className="grid grid-cols-3 gap-2.5 border-t border-[var(--border)] pt-3.5 [&>div]:flex [&>div]:flex-col [&>div]:gap-1 [&_strong]:text-base [&_span]:text-[0.72rem] [&_span]:text-[var(--text-soft)]">
                  <div><strong>{property.totalRooms}</strong><span>Rooms</span></div>
                  <div><strong>{property.totalBookings}</strong><span>Bookings</span></div>
                  <div><strong>{property.totalRatings}</strong><span>Reviews</span></div>
                </div>
              </div>
            </article>
          ))}
          {!loading && properties.length === 0 ? <div className="flex min-h-[150px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-soft)] p-6 text-center text-[var(--text-soft)] [&_strong]:text-[var(--text)]"><strong>No properties yet</strong><span>Create a property listing to start adding rooms.</span><Link to="/partner/accommodation/properties/new" className="inline-flex items-center justify-center gap-2 rounded-[10px] border-0 bg-gradient-to-br from-[var(--gold)] to-[#b9781d] px-[1.1rem] py-[0.8rem] font-bold text-white shadow-[var(--shadow-soft)] hover:brightness-[0.98]"><Plus size={15} /> Add Property</Link></div> : null}
        </div>
      </div>
    </AccommodationPartnerLayout>
  );
}
