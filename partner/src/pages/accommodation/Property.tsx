import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, BedDouble, Building2, Clock3, MapPin, Navigation, Pencil, Plus, Save, Star } from "lucide-react";
import propertyApi, { type PropertyLocation } from "../../api/accommodation/propertyApi";
import { getApiErrorMessage } from "../../api/axios";
import { partnerImages } from "../../config/partnerImages";
import type { Property } from "../../types";
import { AccommodationPartnerLayout, ApiFeedback, PageHeader, StatusBadge } from "../../components/layout/Layout";

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
    const inputClass = "min-h-11 w-full rounded-lg border border-[#ded4c6] bg-white px-3 py-2.5 text-sm font-normal text-[#322a23] placeholder:text-[#a69b8d] shadow-sm transition focus:border-[#b9781d] focus:outline-none focus:ring-2 focus:ring-[#b9781d]/15";
    const fieldClass = "flex min-w-0 flex-col gap-1.5 text-xs font-semibold text-[#554c43]";

    return (
      <AccommodationPartnerLayout>
        <div className="w-full max-w-[1120px]">
          <PageHeader
            title={mode === "new" ? "Add New Property" : "Edit Property"}
            subtitle="Add the details travelers need to discover and book your property."
            action={<Link to="/partner/accommodation/properties" className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#ded4c6] bg-white px-3.5 py-2 text-xs font-semibold text-[#554c43] no-underline shadow-sm transition hover:bg-[#fbf7f0]"><ArrowLeft size={15} /> Back to properties</Link>}
          />
          <ApiFeedback loading={loading} error={error} onRetry={() => setReload((current) => current + 1)} />
          <form className="overflow-hidden rounded-2xl border border-[#e9dfd1] bg-[rgba(255,252,247,.94)] shadow-[0_10px_28px_rgba(54,37,20,.06)]" onSubmit={saveProperty}>
            <div className="border-b border-[#eee5d9] bg-[linear-gradient(110deg,#fffdf8,#f8f0e3)] px-5 py-5 sm:px-7">
              <div className="flex items-start gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#f5ead8] text-[#8b4e16]"><Building2 size={21} /></span>
                <div>
                  <h2 className="m-0 font-serif text-lg font-semibold text-[#29231e]">Property information</h2>
                  <p className="mt-1 text-xs leading-relaxed text-[#70675e]">Fields marked with * are required. You can update these details later.</p>
                </div>
              </div>
            </div>

            <div className="space-y-7 px-5 py-6 sm:px-7">
              <section aria-labelledby="property-details-heading">
                <FormSectionHeading id="property-details-heading" icon={Building2} title="Property details" description="Give your listing a clear name and choose the closest category." />
                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <label className={fieldClass}>
                    <span>Property name <RequiredMark /></span>
                    <input className={inputClass} autoComplete="organization" placeholder="e.g. Serengeti Lodge" required value={draft.name} onChange={(event) => updateDraft("name", event.target.value)} />
                  </label>
                  <label className={fieldClass}>
                    <span>Property type <RequiredMark /></span>
                    <select className={inputClass} value={draft.type} onChange={(event) => updateDraft("type", event.target.value)}>
                      <option value="hotel">Hotel</option><option value="lodge">Lodge</option><option value="camp">Safari camp</option><option value="resort">Resort</option><option value="bnb">B&amp;B</option><option value="guesthouse">Guest house</option><option value="villa">Villa</option><option value="apartment">Apartment</option>
                    </select>
                  </label>
                  <label className={fieldClass}>
                    <span>Operational location <RequiredMark /></span>
                    <select
                      className={inputClass}
                      required
                      value={draft.location}
                      onChange={(event) => {
                        const location = locations.find((item) => item._id === event.target.value);
                        setDraft((current) => ({
                          ...current,
                          location: event.target.value,
                          town: location?.name ?? current.town,
                          latitude: String(location?.latitude ?? current.latitude),
                          longitude: String(location?.longitude ?? current.longitude),
                        }));
                      }}
                    >
                      <option value="">Select an operational location</option>
                      {locations.map((location) => <option key={location._id} value={location._id}>{location.name}{location.county ? `, ${location.county}` : ""}</option>)}
                    </select>
                    {!loading && locations.length === 0 ? <small className="font-normal text-[#9a4c42]">No operational locations are available. Please try again later.</small> : <small className="font-normal text-[#81766a]">Selecting a location can fill the town and map coordinates.</small>}
                  </label>
                  <label className={fieldClass}>
                    <span>Town / locality <RequiredMark /></span>
                    <input className={inputClass} autoComplete="address-level2" placeholder="e.g. Seronera" required value={draft.town} onChange={(event) => updateDraft("town", event.target.value)} />
                  </label>
                  <label className={`${fieldClass} md:col-span-2`}>
                    <span>Street address <RequiredMark /></span>
                    <input className={inputClass} autoComplete="street-address" placeholder="Road, area, or directions to the property" required value={draft.address} onChange={(event) => updateDraft("address", event.target.value)} />
                  </label>
                </div>
              </section>

              <section aria-labelledby="property-location-heading">
                <FormSectionHeading id="property-location-heading" icon={Navigation} title="Map coordinates" description="Coordinates help guests find your property accurately." />
                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <label className={fieldClass}>
                    <span>Latitude <RequiredMark /></span>
                    <span className="relative">
                      <MapPin className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#988a78]" size={16} />
                      <input className={`${inputClass} pl-9`} required type="number" min="-90" max="90" step="any" placeholder="-2.3333" value={draft.latitude} onChange={(event) => updateDraft("latitude", event.target.value)} />
                    </span>
                  </label>
                  <label className={fieldClass}>
                    <span>Longitude <RequiredMark /></span>
                    <span className="relative">
                      <MapPin className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#988a78]" size={16} />
                      <input className={`${inputClass} pl-9`} required type="number" min="-180" max="180" step="any" placeholder="34.8333" value={draft.longitude} onChange={(event) => updateDraft("longitude", event.target.value)} />
                    </span>
                  </label>
                </div>
              </section>

              <section aria-labelledby="guest-details-heading">
                <FormSectionHeading id="guest-details-heading" icon={BedDouble} title="Guest and stay details" description="Set the room count and the standard arrival and departure times." />
                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                  <label className={fieldClass}>
                    <span>Total rooms <RequiredMark /></span>
                    <input className={inputClass} required type="number" min="0" step="1" value={draft.totalRooms} onChange={(event) => updateDraft("totalRooms", event.target.value)} />
                  </label>
                  <label className={fieldClass}>
                    <span className="flex items-center gap-1.5"><Clock3 size={14} /> Check-in time</span>
                    <input className={inputClass} type="time" value={draft.checkInTime} onChange={(event) => updateDraft("checkInTime", event.target.value)} />
                  </label>
                  <label className={fieldClass}>
                    <span className="flex items-center gap-1.5"><Clock3 size={14} /> Check-out time</span>
                    <input className={inputClass} type="time" value={draft.checkOutTime} onChange={(event) => updateDraft("checkOutTime", event.target.value)} />
                  </label>
                </div>
              </section>

              <section aria-labelledby="property-description-heading">
                <FormSectionHeading id="property-description-heading" icon={MapPin} title="About the property" description="Share what makes the stay memorable for travelers." />
                <label className={`${fieldClass} mt-4`}>
                  <span>Description</span>
                  <textarea className={`${inputClass} min-h-[132px] resize-y leading-relaxed`} rows={5} maxLength={2000} placeholder="Describe the property, its atmosphere, and what guests can expect..." value={draft.description} onChange={(event) => updateDraft("description", event.target.value)} />
                  <span className="text-right text-[10px] font-normal text-[#81766a]">{draft.description.length}/2000 characters</span>
                </label>
              </section>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-[#eee5d9] bg-[#fbf8f2] px-5 py-4 sm:flex-row sm:justify-end sm:px-7">
              <Link to="/partner/accommodation/properties" className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[#ded4c6] bg-white px-5 py-2.5 text-sm font-semibold text-[#554c43] no-underline transition hover:bg-[#f8f2e8]">Cancel</Link>
              <button type="submit" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border-0 bg-gradient-to-br from-[var(--gold)] to-[#b9781d] px-5 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-soft)] transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60" disabled={saving || loading || locations.length === 0}>
                <Save size={16} /> {saving ? "Saving..." : mode === "new" ? "Create property" : "Save changes"}
              </button>
            </div>
          </form>
        </div>
      </AccommodationPartnerLayout>
    );
  }

  function FormSectionHeading({
    id,
    icon: Icon,
    title,
    description,
  }: {
    id: string;
    icon: typeof Building2;
    title: string;
    description: string;
  }) {
    return (
      <div className="flex items-start gap-2.5 border-b border-[#f0e9df] pb-3">
        <span className="mt-0.5 text-[#9b621e]"><Icon size={16} /></span>
        <div>
          <h3 className="m-0 text-sm font-semibold text-[#332b24]" id={id}>{title}</h3>
          <p className="mt-1 text-[11px] leading-relaxed text-[#81766a]">{description}</p>
        </div>
      </div>
    );
  }

  function RequiredMark() {
    return <span className="text-[#b14c3e]" aria-hidden="true">*</span>;
  }

  return (
    <AccommodationPartnerLayout>
      <div className="mx-auto w-full max-w-[1440px]">
        <PageHeader title="My Properties" subtitle="Manage your accommodation listings and details." action={<Link to="/partner/accommodation/properties/new" className="inline-flex items-center justify-center gap-2 rounded-[10px] border-0 bg-gradient-to-br from-[var(--gold)] to-[#b9781d] px-[1.1rem] py-[0.8rem] font-bold text-white shadow-[var(--shadow-soft)] hover:brightness-[0.98]"><Plus size={16} /> Add Property</Link>} />
        <ApiFeedback loading={loading} error={error} onRetry={() => setReload((current) => current + 1)} />

        <div className="grid grid-cols-[repeat(auto-fit,minmax(290px,1fr))] gap-[22px]">
          {properties.map((property, index) => (
            <article key={property._id} className="rounded-[18px] border border-[rgba(130,110,92,0.18)] bg-[rgba(255,252,247,0.94)] shadow-[0_8px_18px_rgba(36,22,13,0.03)] overflow-hidden">
              <img src={property.images?.[0] ?? partnerImages.accommodation.propertyFallbacks[index % partnerImages.accommodation.propertyFallbacks.length]} alt={property.name} className="h-[190px] w-full object-cover" />
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
