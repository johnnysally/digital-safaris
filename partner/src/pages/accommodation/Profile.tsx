import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { BadgeCheck, Bell, Building2, CalendarDays, Camera, ChartNoAxesColumnIncreasing, Check, CreditCard, ImagePlus, KeyRound, Mail, MessageSquareText, Plug, ShieldCheck, Sparkles, Star, Upload, UserRound, X } from "lucide-react";
import profileApi from "../../api/accommodation/profileApi";
import walletApi from "../../api/accommodation/walletApi";
import propertyApi from "../../api/accommodation/propertyApi";
import { getApiErrorMessage } from "../../api/axios";
import type { AccommodationPartner, Property, Wallet } from "../../types";
import { AccommodationPartnerLayout, PageHeader } from "../../components/layout/Layout";

const settings = [
  { label: "Profile", icon: UserRound, description: "Your personal details and account contact information." },
  { label: "Property Details", icon: Building2, description: "The business information guests see when they book." },
  { label: "Banking & Payouts", icon: CreditCard, description: "Where and how your accommodation earnings are paid." },
  { label: "Notifications", icon: Bell, description: "Choose which updates you receive from DigitalSafaris." },
  { label: "Security", icon: KeyRound, description: "Protect your account and manage active sessions." },
  { label: "Integrations", icon: Plug, description: "Connect the tools you use to manage your property." },
] as const;

type SettingsSection = (typeof settings)[number]["label"];
type NotificationPreferences = {
  bookingUpdates: boolean;
  guestMessages: boolean;
  payoutUpdates: boolean;
  reviewAlerts: boolean;
  productNews: boolean;
};

const defaultNotificationPreferences: NotificationPreferences = {
  bookingUpdates: true,
  guestMessages: true,
  payoutUpdates: true,
  reviewAlerts: true,
  productNews: false,
};
const notificationPreferencesKey = "digitalsafaris_accommodation_notification_preferences";

export function ProfilePage() {
  const [activeSection, setActiveSection] = useState<SettingsSection>("Profile");
  const [saveMessage, setSaveMessage] = useState("");
  const [savedSettings, setSavedSettings] = useState<Partial<Record<SettingsSection, Record<string, string>>>>({});
  const [notificationPreferences, setNotificationPreferences] = useState(defaultNotificationPreferences);
  const [partner, setPartner] = useState<AccommodationPartner | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState<"avatar" | "cover" | null>(null);
  const [apiError, setApiError] = useState("");
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const propertyImageInputRef = useRef<HTMLInputElement>(null);
  const [uploadingPropertyImage, setUploadingPropertyImage] = useState(false);
  const [propertyImageError, setPropertyImageError] = useState("");

  const selectedProperty = properties.find((property) => property._id === selectedPropertyId) ?? properties[0] ?? null;

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(notificationPreferencesKey);
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (typeof parsed === "object" && parsed !== null) {
          setNotificationPreferences((current) => ({
            ...current,
            ...Object.fromEntries(
              Object.keys(defaultNotificationPreferences)
                .filter((key) => typeof (parsed as Record<string, unknown>)[key] === "boolean")
                .map((key) => [key, (parsed as Record<string, boolean>)[key]]),
            ),
          }));
        }
      }
    } catch {
      setApiError("Could not load saved notification preferences from this browser.");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadProfile() {
      setLoading(true);
      setApiError("");
      try {
        const [profileResult, propertyResult] = await Promise.allSettled([
          profileApi.get(),
          propertyApi.list(),
        ]);
        if (!cancelled) {
          if (profileResult.status === "rejected") throw profileResult.reason;
          setPartner(profileResult.value.partner);
          setWallet(profileResult.value.wallet ?? null);
          if (propertyResult.status === "fulfilled") {
            setProperties(propertyResult.value);
            setSelectedPropertyId(propertyResult.value[0]?._id ?? "");
          } else {
            setPropertyImageError(getApiErrorMessage(propertyResult.reason, "Could not load property listings for image management."));
          }
        }
      } catch (requestError) {
        if (!cancelled) setApiError(getApiErrorMessage(requestError, "Could not load partner settings."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadProfile();
    return () => { cancelled = true; };
  }, []);

  async function handlePropertyImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    setPropertyImageError("");
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setPropertyImageError("Choose an image file to add to the property gallery.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setPropertyImageError("The image must be 10 MB or smaller.");
      return;
    }
    if (!selectedProperty) {
      setPropertyImageError("Create a property before adding gallery images.");
      return;
    }

    setUploadingPropertyImage(true);
    try {
      const uploaded = await propertyApi.uploadImage(file);
      const updated = await propertyApi.update(selectedProperty._id, {
        images: [...(selectedProperty.images ?? []), uploaded.url],
      });
      setProperties((current) => current.map((property) => property._id === updated._id ? updated : property));
      setSaveMessage("Property image added successfully.");
    } catch (requestError) {
      setPropertyImageError(getApiErrorMessage(requestError, "Could not add the property image."));
    } finally {
      setUploadingPropertyImage(false);
    }
  }

  async function removePropertyImage(imageIndex: number) {
    if (!selectedProperty) return;
    const images = selectedProperty.images ?? [];
    const updatedImages = images.filter((_, index) => index !== imageIndex);
    setPropertyImageError("");
    setUploadingPropertyImage(true);
    try {
      const updated = await propertyApi.update(selectedProperty._id, { images: updatedImages });
      setProperties((current) => current.map((property) => property._id === updated._id ? updated : property));
      setSaveMessage("Property image removed from the gallery.");
    } catch (requestError) {
      setPropertyImageError(getApiErrorMessage(requestError, "Could not remove this property image."));
    } finally {
      setUploadingPropertyImage(false);
    }
  }

  async function handleImageUpload(event: ChangeEvent<HTMLInputElement>, imageType: "avatar" | "cover") {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setApiError("Choose an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setApiError("Profile and business images must be 5 MB or smaller.");
      return;
    }

    setUploadingImage(imageType);
    setApiError("");
    setSaveMessage("");
    try {
      if (imageType === "avatar") {
        const result = await profileApi.uploadAvatar(file);
        setPartner((current) => current ? { ...current, avatar: result.avatar } : current);
      } else {
        const result = await profileApi.uploadCover(file);
        setPartner((current) => current ? { ...current, coverImage: result.coverImage } : current);
      }
      setSaveMessage(`${imageType === "avatar" ? "Profile photo" : "Business image"} updated successfully.`);
    } catch (requestError) {
      setApiError(getApiErrorMessage(requestError, `Could not upload ${imageType === "avatar" ? "profile photo" : "business image"}.`));
    } finally {
      setUploadingImage(null);
    }
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget).entries()) as Record<string, string>;
    setSaving(true);
    setApiError("");
    try {
      if (activeSection === "Profile") {
        const updated = await profileApi.update({ contactName: values.contactName, phone: values.phone, countryCode: values.countryCode });
        setPartner((current) => current ? { ...current, ...updated } : updated as AccommodationPartner);
      } else if (activeSection === "Property Details") {
        const updated = await profileApi.update({
          name: values.propertyName,
          type: values.propertyType,
          town: values.town,
          address: values.address,
          description: values.description,
          checkInTime: values.checkInTime,
          checkOutTime: values.checkOutTime,
          amenities: values.amenities.split(",").map((amenity) => amenity.trim()).filter(Boolean),
        });
        setPartner((current) => current ? { ...current, ...updated } : updated as AccommodationPartner);
      } else if (activeSection === "Banking & Payouts") {
        const updated = await walletApi.updatePayoutDetails({
          payoutMethod: values.payoutMethod as Wallet["payoutMethod"],
          payoutDetails: { accountName: values.accountName, bankName: values.bankName, accountNumber: values.accountNumber, phone: values.mobileMoneyPhone },
          payoutFrequency: values.payoutFrequency as Wallet["payoutFrequency"],
          minimumPayout: Number(values.minimumPayout),
        });
        setWallet(updated);
      } else if (activeSection === "Notifications") {
        window.localStorage.setItem(notificationPreferencesKey, JSON.stringify(notificationPreferences));
      }
      setSavedSettings((current) => ({ ...current, [activeSection]: values }));
      setSaveMessage("Changes saved successfully.");
    } catch (requestError) {
      setApiError(getApiErrorMessage(requestError, `Could not save ${activeSection.toLowerCase()}.`));
    } finally {
      setSaving(false);
    }
  }

  function savedValue(section: SettingsSection, field: string, fallback: string) {
    return savedSettings[section]?.[field] ?? fallback;
  }

  function changeSection(section: SettingsSection) {
    setActiveSection(section);
    setSaveMessage("");
  }

  function renderSection() {
    switch (activeSection) {
      case "Profile":
        return (
          <>
            <div className="mb-5 flex items-center gap-4">
              <div className="relative">
                      <div className="grid h-20 w-20 place-items-center overflow-hidden rounded-full bg-[#f1e1c8] text-2xl font-bold text-[#80501b]">
                        {partner?.avatar
                          ? <img className="h-full w-full object-cover" src={partner.avatar} alt={`${partner.contactName ?? partner.name} profile`} />
                          : <span>{(partner?.name ?? "A").slice(0, 1).toUpperCase()}</span>}
                      </div>
                      <button type="button" onClick={() => avatarInputRef.current?.click()} disabled={uploadingImage !== null} aria-label="Upload profile photo" className="absolute -bottom-1 -right-1 grid h-8 w-8 place-items-center rounded-full border-2 border-white bg-[var(--gold)] text-white transition hover:bg-[#a96c1e] disabled:opacity-60">
                        {uploadingImage === "avatar" ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : <Camera size={14} />}
                      </button>
                      <input ref={avatarInputRef} className="sr-only" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => void handleImageUpload(event, "avatar")} />
                    </div>
                    <div>
                      <h3 className="m-0 text-base font-bold text-[var(--text)]">{partner?.contactName ?? partner?.name ?? "Accommodation partner"}</h3>
                      <p className="mb-0 mt-1 text-sm text-[var(--text-soft)]">{partner?.email ?? "Accommodation Partner"}</p>
                      <button type="button" onClick={() => avatarInputRef.current?.click()} disabled={uploadingImage !== null} className="mt-1.5 inline-flex items-center gap-1.5 border-0 bg-transparent p-0 text-[11px] font-semibold text-[#925719] hover:underline disabled:opacity-60">
                        <Camera size={12} /> {uploadingImage === "avatar" ? "Uploading profile photo..." : "Change profile photo"}
                      </button>
                    </div>
                  </div>
            <section className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#e9dfd1] bg-[#fcfaf6] p-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="grid h-[68px] w-[104px] shrink-0 place-items-center overflow-hidden rounded-lg border border-[#e8dfd2] bg-white">
                        {partner?.coverImage ? <img className="h-full w-full object-cover" src={partner.coverImage} alt={`${partner.name} business image`} /> : <Building2 size={21} className="text-[#a68a62]" />}
                </div>
                <div>
                        <h4 className="m-0 text-xs font-semibold text-[#332b24]">Business / property image</h4>
                        <p className="mb-0 mt-1 max-w-md text-[10px] leading-relaxed text-[#81766a]">This is the main image representing your accommodation business. It is separate from your personal profile photo and the property listing gallery.</p>
                </div>
              </div>
                    <button type="button" onClick={() => coverInputRef.current?.click()} disabled={uploadingImage !== null} className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-[#e4d9ca] bg-white px-3.5 text-xs font-semibold text-[#695d51] transition hover:bg-[#fbf7f0] disabled:opacity-60">
                      {uploadingImage === "cover" ? <span className="size-3.5 animate-spin rounded-full border-2 border-[#9b5b17]/30 border-t-[#9b5b17]" /> : <ImagePlus size={14} />}
                      {uploadingImage === "cover" ? "Uploading image..." : partner?.coverImage ? "Change business image" : "Add business image"}
              </button>
            </section>
            <form onSubmit={handleSave}>
              <div className="grid grid-cols-2 gap-[18px]">
                <label className="flex flex-col gap-2 text-[0.82rem] font-bold text-[var(--text-soft)] [&_input]:font-medium [&_select]:font-medium [&_textarea]:font-medium"><span>Contact name</span><input name="contactName" defaultValue={savedValue("Profile", "contactName", partner?.contactName ?? "")} required /></label>
                <label className="flex flex-col gap-2 text-[0.82rem] font-bold text-[var(--text-soft)] [&_input]:font-medium [&_select]:font-medium [&_textarea]:font-medium"><span>Business email (read-only)</span><input type="email" value={partner?.email ?? ""} readOnly /></label>
                <label className="flex flex-col gap-2 text-[0.82rem] font-bold text-[var(--text-soft)] [&_input]:font-medium [&_select]:font-medium [&_textarea]:font-medium"><span>Phone number</span><input name="phone" type="tel" defaultValue={savedValue("Profile", "phone", partner?.phone ?? "")} required /></label>
                <label className="flex flex-col gap-2 text-[0.82rem] font-bold text-[var(--text-soft)] [&_input]:font-medium [&_select]:font-medium [&_textarea]:font-medium"><span>Country calling code</span><input name="countryCode" defaultValue={savedValue("Profile", "countryCode", partner?.countryCode ?? "+255")} required /></label>
              </div>
              <div className="mt-6 flex items-center justify-between gap-4 border-t border-[var(--border)] pt-4 max-[760px]:items-stretch max-[760px]:flex-col"><span>Keep your contact information current for booking updates.</span><button type="submit" className="inline-flex items-center justify-center gap-2 rounded-[10px] border-0 bg-gradient-to-br from-[var(--gold)] to-[#b9781d] px-[1.1rem] py-[0.8rem] font-bold text-white shadow-[var(--shadow-soft)] hover:brightness-[0.98] disabled:cursor-not-allowed disabled:opacity-60" disabled={saving || loading}>{saving ? "Saving..." : "Save profile"}</button></div>
            </form>
          </>
        );
      case "Property Details":
        return (
          <div className="space-y-6">
          <section className="rounded-xl border border-[#e9dfd1] bg-[#fcfaf6] p-4 sm:p-5" aria-labelledby="property-gallery-title">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#f5ead8] text-[#8b4e16]"><ImagePlus size={18} /></span>
                <div>
                  <h3 id="property-gallery-title" className="m-0 text-sm font-semibold text-[#332b24]">Property photo gallery</h3>
                  <p className="mb-0 mt-1 max-w-xl text-xs leading-relaxed text-[#81766a]">Add clear photos of your property to help guests understand the stay. Images are saved to the selected property listing.</p>
                </div>
              </div>
              {properties.length > 1 ? (
                <label className="grid gap-1 text-[10px] font-semibold text-[#6f655b]">
                  Select property
                  <select className="min-h-9 min-w-[180px] rounded-lg border border-[#e4d9ca] bg-white px-3 text-xs font-medium text-[#332b24]" value={selectedProperty?._id ?? ""} onChange={(event) => { setSelectedPropertyId(event.target.value); setPropertyImageError(""); }}>
                    {properties.map((property) => <option key={property._id} value={property._id}>{property.name}</option>)}
                  </select>
                </label>
              ) : null}
            </div>

            {selectedProperty ? (
              <>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] text-[#81766a]"><strong className="text-[#554c43]">{selectedProperty.name}</strong> · {(selectedProperty.images ?? []).length} photo{(selectedProperty.images ?? []).length === 1 ? "" : "s"}</span>
                  <button type="button" onClick={() => propertyImageInputRef.current?.click()} disabled={uploadingPropertyImage} className="inline-flex min-h-9 items-center gap-2 rounded-lg border-0 bg-[#9b5b17] px-3.5 text-xs font-semibold text-white transition hover:bg-[#814a12] disabled:cursor-not-allowed disabled:opacity-60">
                    {uploadingPropertyImage ? <span className="size-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : <Upload size={14} />}
                    {uploadingPropertyImage ? "Updating gallery..." : "Add property image"}
                  </button>
                  <input ref={propertyImageInputRef} className="sr-only" type="file" accept="image/*" onChange={(event) => void handlePropertyImageUpload(event)} />
                </div>
                {(selectedProperty.images ?? []).length ? (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                    {selectedProperty.images?.map((image, index) => (
                      <figure className="group relative m-0 aspect-[4/3] overflow-hidden rounded-lg border border-[#e8dfd2] bg-[#eee5d9]" key={`${selectedProperty._id}-${image}-${index}`}>
                        <img className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" src={image} alt={`${selectedProperty.name} property image ${index + 1}`} loading="lazy" />
                        <span className="absolute bottom-2 left-2 rounded-full bg-black/60 px-2 py-1 text-[9px] font-semibold text-white">{index === 0 ? "Cover photo" : `Photo ${index + 1}`}</span>
                        <button type="button" onClick={() => void removePropertyImage(index)} disabled={uploadingPropertyImage} aria-label={`Remove property image ${index + 1}`} title="Remove image" className="absolute right-2 top-2 grid size-8 place-items-center rounded-full border border-white/40 bg-black/50 text-white opacity-0 transition hover:bg-[#9b342a] focus:opacity-100 group-hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-50">
                          <X size={15} />
                        </button>
                      </figure>
                    ))}
                  </div>
                ) : (
                  <button type="button" onClick={() => propertyImageInputRef.current?.click()} disabled={uploadingPropertyImage} className="flex min-h-[150px] w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[#d8c7aa] bg-white/70 px-4 text-center transition hover:border-[#b9781d] hover:bg-white disabled:opacity-60">
                    <span className="grid size-10 place-items-center rounded-xl bg-[#f5ead8] text-[#8b4e16]"><ImagePlus size={18} /></span>
                    <strong className="text-xs text-[#554c43]">Add the first property photo</strong>
                    <span className="text-[10px] text-[#81766a]">Choose an image up to 10 MB</span>
                  </button>
                )}
                <p className="mb-0 mt-3 text-[10px] leading-relaxed text-[#81766a]">Supported image formats depend on the image file selected. Maximum file size: 10 MB. The first image is used as the listing cover.</p>
              </>
            ) : (
              <div className="rounded-lg border border-dashed border-[#d8c7aa] bg-white/70 px-4 py-6 text-center">
                <Building2 size={20} className="mx-auto text-[#a68a62]" />
                <p className="mb-1 mt-2 text-xs font-semibold text-[#554c43]">No property listing found</p>
                <p className="m-0 text-[10px] text-[#81766a]">Create a property listing before uploading property photos.</p>
              </div>
            )}
            {propertyImageError ? <p className="mb-0 mt-3 rounded-lg border border-[#eed3cf] bg-[#fff8f7] px-3 py-2 text-xs text-[#914940]" role="alert">{propertyImageError}</p> : null}
          </section>
          <form onSubmit={handleSave}>
            <div className="grid grid-cols-2 gap-[18px]">
                <label className="flex flex-col gap-2 text-[0.82rem] font-bold text-[var(--text-soft)] [&_input]:font-medium [&_select]:font-medium [&_textarea]:font-medium"><span>Property name</span><input name="propertyName" defaultValue={savedValue("Property Details", "propertyName", partner?.name ?? "")} required /></label>
                <label className="flex flex-col gap-2 text-[0.82rem] font-bold text-[var(--text-soft)] [&_input]:font-medium [&_select]:font-medium [&_textarea]:font-medium"><span>Property type</span><select name="propertyType" defaultValue={savedValue("Property Details", "propertyType", partner?.type ?? "lodge")}><option value="hotel">Hotel</option><option value="lodge">Lodge</option><option value="camp">Safari camp</option><option value="resort">Resort</option><option value="bnb">B&amp;B</option><option value="guesthouse">Guest house</option><option value="villa">Villa</option><option value="apartment">Apartment</option></select></label>
                <label className="flex flex-col gap-2 text-[0.82rem] font-bold text-[var(--text-soft)] [&_input]:font-medium [&_select]:font-medium [&_textarea]:font-medium"><span>Town or region</span><input name="town" defaultValue={savedValue("Property Details", "town", partner?.town ?? "")} required /></label>
                <label className="flex flex-col gap-2 text-[0.82rem] font-bold text-[var(--text-soft)] [&_input]:font-medium [&_select]:font-medium [&_textarea]:font-medium"><span>Street address</span><input name="address" defaultValue={savedValue("Property Details", "address", partner?.address ?? "")} required /></label>
                <label className="flex flex-col gap-2 text-[0.82rem] font-bold text-[var(--text-soft)] [&_input]:font-medium [&_select]:font-medium [&_textarea]:font-medium"><span>Check-in time</span><input name="checkInTime" type="time" defaultValue={savedValue("Property Details", "checkInTime", partner?.checkInTime ?? "14:00")} /></label>
                <label className="flex flex-col gap-2 text-[0.82rem] font-bold text-[var(--text-soft)] [&_input]:font-medium [&_select]:font-medium [&_textarea]:font-medium"><span>Check-out time</span><input name="checkOutTime" type="time" defaultValue={savedValue("Property Details", "checkOutTime", partner?.checkOutTime ?? "11:00")} /></label>
                <label className="flex flex-col gap-2 text-[0.82rem] font-bold text-[var(--text-soft)] [&_input]:font-medium [&_select]:font-medium [&_textarea]:font-medium col-span-2"><span>Amenities (comma separated)</span><input name="amenities" defaultValue={savedValue("Property Details", "amenities", partner?.amenities?.join(", ") ?? "")} /></label>
                <label className="flex flex-col gap-2 text-[0.82rem] font-bold text-[var(--text-soft)] [&_input]:font-medium [&_select]:font-medium [&_textarea]:font-medium col-span-2"><span>About this property</span><textarea name="description" rows={4} defaultValue={savedValue("Property Details", "description", partner?.description ?? "")} /></label>
            </div>
            <div className="mt-6 flex items-center justify-between gap-4 border-t border-[var(--border)] pt-4 max-[760px]:items-stretch max-[760px]:flex-col"><span>These details appear on your listing and guest confirmations.</span><button type="submit" className="inline-flex items-center justify-center gap-2 rounded-[10px] border-0 bg-gradient-to-br from-[var(--gold)] to-[#b9781d] px-[1.1rem] py-[0.8rem] font-bold text-white shadow-[var(--shadow-soft)] hover:brightness-[0.98]" disabled={saving}>{saving ? "Saving..." : "Save property details"}</button></div>
          </form>
          </div>
        );
      case "Banking & Payouts":
        return (
          <form onSubmit={handleSave}>
            <div className="mb-4 rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] p-3 text-sm text-[var(--text-soft)]"><CreditCard size={18} /><span>Payouts are sent to the verified account below. Account details are partially hidden for security.</span></div>
            <div className="grid grid-cols-2 gap-[18px]">
              <label className="flex flex-col gap-2 text-[0.82rem] font-bold text-[var(--text-soft)] [&_input]:font-medium [&_select]:font-medium [&_textarea]:font-medium"><span>Payout method</span><select name="payoutMethod" defaultValue={savedValue("Banking & Payouts", "payoutMethod", wallet?.payoutMethod ?? "bank")}><option value="bank">Bank account</option><option value="mpesa">M-Pesa</option></select></label>
              <label className="flex flex-col gap-2 text-[0.82rem] font-bold text-[var(--text-soft)] [&_input]:font-medium [&_select]:font-medium [&_textarea]:font-medium"><span>Account holder</span><input name="accountName" defaultValue={savedValue("Banking & Payouts", "accountName", wallet?.payoutDetails.accountName ?? "")} /></label>
              <label className="flex flex-col gap-2 text-[0.82rem] font-bold text-[var(--text-soft)] [&_input]:font-medium [&_select]:font-medium [&_textarea]:font-medium"><span>Bank name</span><input name="bankName" defaultValue={savedValue("Banking & Payouts", "bankName", wallet?.payoutDetails.bankName ?? "")} /></label>
              <label className="flex flex-col gap-2 text-[0.82rem] font-bold text-[var(--text-soft)] [&_input]:font-medium [&_select]:font-medium [&_textarea]:font-medium"><span>Account number</span><input name="accountNumber" type="text" defaultValue={savedValue("Banking & Payouts", "accountNumber", wallet?.payoutDetails.accountNumber ?? "")} /></label>
              <label className="flex flex-col gap-2 text-[0.82rem] font-bold text-[var(--text-soft)] [&_input]:font-medium [&_select]:font-medium [&_textarea]:font-medium"><span>M-Pesa phone</span><input name="mobileMoneyPhone" type="tel" defaultValue={savedValue("Banking & Payouts", "mobileMoneyPhone", wallet?.payoutDetails.phone ?? "")} /></label>
              <label className="flex flex-col gap-2 text-[0.82rem] font-bold text-[var(--text-soft)] [&_input]:font-medium [&_select]:font-medium [&_textarea]:font-medium"><span>Payout frequency</span><select name="payoutFrequency" defaultValue={savedValue("Banking & Payouts", "payoutFrequency", wallet?.payoutFrequency ?? "weekly")}><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="biweekly">Every two weeks</option><option value="monthly">Monthly</option></select></label>
              <label className="flex flex-col gap-2 text-[0.82rem] font-bold text-[var(--text-soft)] [&_input]:font-medium [&_select]:font-medium [&_textarea]:font-medium"><span>Minimum payout</span><input name="minimumPayout" type="number" min="0" defaultValue={savedValue("Banking & Payouts", "minimumPayout", String(wallet?.minimumPayout ?? 0))} /></label>
            </div>
            <div className="mt-[18px] flex items-center justify-between gap-4 rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] p-[14px] max-[760px]:flex-col max-[760px]:items-start"><div className="flex flex-col gap-1"><span className="text-[0.75rem] text-[var(--text-muted)]">Current payout schedule</span><strong className="text-[0.88rem] text-[var(--text)]">{wallet?.payoutFrequency ?? "Not configured"} · {wallet?.currency ?? ""}</strong></div><span className={`inline-flex items-center justify-center rounded-full px-[0.62rem] py-[0.38rem] text-[0.72rem] font-bold ${wallet?.status === "active" ? "bg-[rgba(95,125,93,0.12)] text-[var(--success)]" : "bg-[rgba(181,125,43,0.12)] text-[var(--warning)]"}`}>{wallet?.status ?? "Unavailable"}</span></div>
            <div className="mt-6 flex items-center justify-between gap-4 border-t border-[var(--border)] pt-4 max-[760px]:items-stretch max-[760px]:flex-col"><span>Bank changes may require verification before the next payout.</span><button type="submit" className="inline-flex items-center justify-center gap-2 rounded-[10px] border-0 bg-gradient-to-br from-[var(--gold)] to-[#b9781d] px-[1.1rem] py-[0.8rem] font-bold text-white shadow-[var(--shadow-soft)] hover:brightness-[0.98]" disabled={saving || !wallet}>{saving ? "Saving..." : "Save payout details"}</button></div>
          </form>
        );
      case "Notifications":
        return (
          <form onSubmit={handleSave}>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#eadfce] bg-[linear-gradient(110deg,#fbf5e9,#fffdf8)] p-4">
              <div className="flex items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#f2e3c9] text-[#87551c]"><Bell size={18} /></span>
                <div>
                  <h3 className="m-0 text-sm font-semibold text-[#332b24]">Your notification channels</h3>
                  <p className="mt-1 text-xs leading-relaxed text-[#70675e]">Choose the activity you want highlighted in your partner workspace.</p>
                </div>
              </div>
              <span className="rounded-full border border-[#d8c7aa] bg-white/70 px-3 py-1.5 text-[10px] font-semibold text-[#72512b]">Saved on this device</span>
            </div>
            <div className="grid gap-2">
              {([
                ["bookingUpdates", "Booking activity", "New reservations, guest changes, cancellations, and check-in reminders.", CalendarDays],
                ["guestMessages", "Guest enquiries", "Messages and questions related to current or upcoming stays.", MessageSquareText],
                ["payoutUpdates", "Payments and payouts", "Payout confirmations and payment account notices.", CreditCard],
                ["reviewAlerts", "Guest reviews", "New ratings, written reviews, and response reminders.", Star],
                ["productNews", "Partner news", "Occasional platform updates, product improvements, and partner resources.", Sparkles],
              ] as const).map(([key, title, description, Icon]) => (
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#eee5d9] bg-white/70 p-3.5 transition hover:border-[#d8c6a8] hover:bg-[#fffdf8] sm:p-4" key={key}>
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#f7f0e5] text-[#89591f]"><Icon size={17} /></span>
                  <span className="min-w-0 flex-1">
                    <strong className="block text-sm text-[#332b24]">{title}</strong>
                    <small className="mt-1 block text-xs leading-relaxed text-[#81766a]">{description}</small>
                  </span>
                  <input
                    className="peer sr-only"
                    type="checkbox"
                    checked={notificationPreferences[key]}
                    onChange={(event) => setNotificationPreferences((current) => ({ ...current, [key]: event.target.checked }))}
                    aria-label={`${title} notifications`}
                  />
                  <span aria-hidden="true" className={`relative h-6 w-11 shrink-0 rounded-full transition-colors after:absolute after:left-[3px] after:top-[3px] after:h-[18px] after:w-[18px] after:rounded-full after:bg-white after:shadow-sm after:transition-transform peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#9b5b17] ${notificationPreferences[key] ? "bg-[#9b5b17] after:translate-x-5" : "bg-[#cfc5b8]"}`} />
                </label>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-4">
              <p className="m-0 max-w-xl text-xs leading-relaxed text-[#81766a]">These preferences are stored in this browser only. They do not control email, SMS, or push delivery until server-side notification preferences are available.</p>
              <button type="submit" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border-0 bg-gradient-to-br from-[var(--gold)] to-[#b9781d] px-5 text-sm font-semibold text-white shadow-[var(--shadow-soft)] transition hover:brightness-95 disabled:opacity-60" disabled={saving}>
                <Check size={16} /> {saving ? "Saving..." : "Save preferences"}
              </button>
            </div>
          </form>
        );
      case "Security":
        return (
          <div className="flex flex-col gap-3">
            <div>
              <h3 className="mb-3 mt-6 text-base font-bold">Change password</h3>
              <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] p-4 text-sm text-[var(--text-soft)]">Password updates are not currently supported by the accommodation API.</div>
              <div className="grid grid-cols-2 gap-[18px]">
                <label className="flex flex-col gap-2 text-[0.82rem] font-bold text-[var(--text-soft)] [&_input]:font-medium [&_select]:font-medium [&_textarea]:font-medium col-span-2"><span>Current password</span><input disabled type="password" autoComplete="current-password" /></label>
                <label className="flex flex-col gap-2 text-[0.82rem] font-bold text-[var(--text-soft)] [&_input]:font-medium [&_select]:font-medium [&_textarea]:font-medium"><span>New password</span><input disabled minLength={10} type="password" autoComplete="new-password" /></label>
                <label className="flex flex-col gap-2 text-[0.82rem] font-bold text-[var(--text-soft)] [&_input]:font-medium [&_select]:font-medium [&_textarea]:font-medium"><span>Confirm new password</span><input disabled minLength={10} type="password" autoComplete="new-password" /></label>
              </div>
              <div className="mt-6 flex items-center justify-between gap-4 border-t border-[var(--border)] pt-4 max-[760px]:items-stretch max-[760px]:flex-col"><span>Use at least 10 characters.</span><button type="button" className="inline-flex items-center justify-center gap-2 rounded-[10px] border-0 bg-gradient-to-br from-[var(--gold)] to-[#b9781d] px-[1.1rem] py-[0.8rem] font-bold text-white shadow-[var(--shadow-soft)] hover:brightness-[0.98]" disabled>Update password</button></div>
            </div>
            <div className="flex items-center justify-between gap-4 rounded-lg border border-[var(--border)] p-4 max-[760px]:items-stretch max-[760px]:flex-col">
              <span className="text-[var(--gold)]"><ShieldCheck size={19} /></span>
              <span><strong>Two-factor authentication</strong><small>Two-factor controls are not available through the current API.</small></span>
              <label className="h-5 w-5 accent-[var(--gold)]"><input type="checkbox" checked={false} disabled /><span>Unavailable</span></label>
            </div>
            <div className="flex items-center justify-between gap-4 rounded-lg border border-[var(--border)] p-4 max-[760px]:items-stretch max-[760px]:flex-col">
              <span className="text-[var(--gold)]"><KeyRound size={19} /></span>
              <span><strong>Active sessions</strong><small>Session management is not available through the current API.</small></span>
              <button type="button" className="inline-flex items-center justify-center gap-2 rounded-[10px] border border-[var(--border)] bg-white px-[1.1rem] py-[0.8rem] font-bold text-[var(--text)] px-[0.9rem] py-[0.7rem] text-[0.82rem]" disabled>Unavailable</button>
            </div>
          </div>
        );
      case "Integrations":
        return (
          <div>
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-[#eadfce] bg-[linear-gradient(110deg,#fbf5e9,#fffdf8)] p-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#f2e3c9] text-[#87551c]"><Plug size={18} /></span>
              <div>
                <h3 className="m-0 text-sm font-semibold text-[#332b24]">Connect your operations</h3>
                <p className="mt-1 text-xs leading-relaxed text-[#70675e]">Explore tools that can help streamline guest communication, inventory, and business insights.</p>
              </div>
            </div>
            <div className="grid gap-3 xl:grid-cols-2">
              {([
                ["Channel manager", "Keep room rates and availability aligned across booking channels.", "Inventory & rates", Building2],
                ["WhatsApp Business", "Prepare guest arrival information and service updates for WhatsApp.", "Guest communication", MessageSquareText],
                ["Google Analytics", "Understand how visitors discover and interact with your listing.", "Business insights", ChartNoAxesColumnIncreasing],
              ] as const).map(([title, description, category, Icon]) => (
                <article className="flex min-h-[176px] flex-col rounded-xl border border-[#eee5d9] bg-white/70 p-4 transition hover:border-[#d8c6a8] hover:shadow-[0_5px_16px_rgba(54,37,20,.05)]" key={title}>
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <span className="grid size-11 place-items-center rounded-xl bg-[#f7f0e5] text-[#89591f]"><Icon size={19} /></span>
                    <span className="rounded-full border border-[#e8dfd2] bg-[#faf7f1] px-2.5 py-1 text-[9px] font-semibold text-[#82766a]">Not connected</span>
                  </div>
                  <h3 className="m-0 text-sm font-semibold text-[#332b24]">{title}</h3>
                  <p className="mt-1.5 flex-1 text-xs leading-relaxed text-[#81766a]">{description}</p>
                  <div className="mt-3 flex items-center justify-between gap-3 border-t border-[#f0e9df] pt-3">
                    <span className="text-[10px] font-medium text-[#8c7250]">{category}</span>
                    <button type="button" className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-[#e4d9ca] bg-[#fbf8f2] px-3 text-[10px] font-semibold text-[#81766a]" disabled aria-label={`${title} integration is not available yet`}>Coming soon</button>
                  </div>
                </article>
              ))}
            </div>
            <p className="mt-4 rounded-lg border border-dashed border-[#ded4c6] bg-[#fbf8f2] p-3 text-xs leading-relaxed text-[#81766a]">Integration connections are not available through the accommodation API yet. No external accounts have been connected.</p>
          </div>
        );
    }
  }

  return (
    <AccommodationPartnerLayout>
      <div className="w-full">
        <PageHeader title="Profile & Settings" subtitle="Manage your business profile, property details, and account preferences." />
        {loading || apiError ? <div className={`mb-3.5 flex items-center justify-between gap-3 rounded-lg border px-[13px] py-[11px] text-[0.82rem] ${apiError ? "border-[rgba(168,92,82,0.28)] bg-[rgba(168,92,82,0.07)] text-[#8e443b]" : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-soft)]"}`} role={apiError ? "alert" : "status"}>{apiError || "Loading partner settings..."}</div> : null}

        <section className="relative mb-5 min-h-[168px] overflow-hidden rounded-2xl border border-[#e8ddce] bg-[#2b2017] shadow-[0_12px_30px_rgba(36,22,13,.1)]">
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `linear-gradient(90deg,rgba(34,23,15,.9),rgba(34,23,15,.52)),url('${partner?.coverImage ?? ""}')` }} />
          <div className="relative flex min-h-[168px] flex-wrap items-end justify-between gap-5 p-5 sm:p-7">
            <div className="flex min-w-0 items-center gap-4">
              <div className="grid size-[68px] shrink-0 place-items-center overflow-hidden rounded-2xl border border-white/30 bg-white/15 text-xl font-bold text-white shadow-lg">
                {partner?.logo || partner?.avatar ? <img className="h-full w-full object-cover" src={partner.logo ?? partner.avatar ?? ""} alt="" /> : (partner?.name ?? "A").slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0 text-white">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <h2 className="m-0 truncate font-serif text-2xl font-semibold">{partner?.name ?? "Your accommodation business"}</h2>
                  {partner?.status ? <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] font-semibold capitalize"><BadgeCheck size={13} />{partner.status}</span> : null}
                </div>
                <p className="m-0 text-xs text-white/75">{[partner?.type, partner?.town, partner?.email].filter(Boolean).join(" · ") || "Accommodation partner account"}</p>
              </div>
            </div>
            <button type="button" onClick={() => coverInputRef.current?.click()} disabled={uploadingImage !== null} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/25 bg-black/20 px-3.5 text-xs font-semibold text-white transition hover:bg-black/35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-60">
              {uploadingImage === "cover" ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : <ImagePlus size={15} />}
              {uploadingImage === "cover" ? "Uploading..." : "Update business image"}
            </button>
            <input ref={coverInputRef} className="sr-only" type="file" accept="image/*" onChange={(event) => void handleImageUpload(event, "cover")} />
          </div>
        </section>

        <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="flex items-center gap-3 rounded-xl border border-[#e9dfd1] bg-white/70 p-4">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#f5ead8] text-[#8b4e16]"><UserRound size={18} /></span>
            <div className="min-w-0"><p className="m-0 text-[11px] text-[#81766a]">Account contact</p><strong className="block truncate text-sm text-[#332b24]">{partner?.contactName ?? "Not set"}</strong></div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-[#e9dfd1] bg-white/70 p-4">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#f5ead8] text-[#8b4e16]"><Mail size={18} /></span>
            <div className="min-w-0"><p className="m-0 text-[11px] text-[#81766a]">Business email</p><strong className="block truncate text-sm text-[#332b24]">{partner?.email ?? "Not set"}</strong></div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-[#e9dfd1] bg-white/70 p-4">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#f5ead8] text-[#8b4e16]"><Check size={18} /></span>
            <div className="min-w-0"><p className="m-0 text-[11px] text-[#81766a]">Account status</p><strong className="block truncate text-sm capitalize text-[#332b24]">{partner?.status ?? "Loading status"}</strong></div>
          </div>
        </div>

        <div className="grid grid-cols-[240px_minmax(0,1fr)] items-start gap-5 max-[900px]:grid-cols-[210px_minmax(0,1fr)] max-[760px]:grid-cols-1">
          <nav className="sticky top-4 overflow-hidden rounded-2xl border border-[rgba(130,110,92,0.18)] bg-[rgba(255,252,247,0.94)] p-2.5 shadow-[0_8px_18px_rgba(36,22,13,0.03)] max-[760px]:static max-[760px]:grid max-[760px]:grid-cols-2 max-[760px]:gap-1" aria-label="Settings sections">
            {settings.map(({ label, icon: Icon }) => (
              <button type="button" key={label} className={`flex min-h-11 w-full items-center gap-2.5 rounded-xl border-0 bg-transparent px-3 text-left text-[13px] font-semibold transition-colors max-[760px]:px-2 max-[760px]:text-[11px] [&_svg]:shrink-0 [&_svg]:text-[#92877b] ${activeSection === label ? "bg-[#f4ead9] text-[#80501b] [&_svg]:text-[#a66c22]" : "text-[#62584f] hover:bg-[#faf6ef]"}`} aria-current={activeSection === label ? "page" : undefined} onClick={() => changeSection(label)}>
                <Icon size={16} strokeWidth={1.9} />
                <span className="min-w-0 flex-1">{label}</span>
                {activeSection === label ? <span className="h-1.5 w-1.5 rounded-full bg-[#b9781d]" aria-hidden="true" /> : null}
              </button>
            ))}
          </nav>

          <section className="min-w-0 overflow-hidden rounded-2xl border border-[rgba(130,110,92,0.18)] bg-[rgba(255,252,247,0.96)] p-6 shadow-[0_8px_22px_rgba(36,22,13,0.045)] max-[760px]:p-4 [&_input:not([type=checkbox])]:min-h-11 [&_input:not([type=checkbox])]:rounded-lg [&_input:not([type=checkbox])]:border [&_input:not([type=checkbox])]:border-[#e4d9ca] [&_input:not([type=checkbox])]:bg-white [&_input:not([type=checkbox])]:px-3 [&_input:not([type=checkbox])]:py-2.5 [&_input:not([type=checkbox])]:text-sm [&_input:not([type=checkbox])]:text-[#332b24] [&_input:not([type=checkbox])]:focus:border-[#b9781d] [&_input:not([type=checkbox])]:focus:outline-none [&_input:not([type=checkbox])]:focus:ring-2 [&_input:not([type=checkbox])]:focus:ring-[#b9781d]/15 [&_select]:min-h-11 [&_select]:rounded-lg [&_select]:border [&_select]:border-[#e4d9ca] [&_select]:bg-white [&_select]:px-3 [&_select]:py-2.5 [&_select]:text-sm [&_textarea]:rounded-lg [&_textarea]:border [&_textarea]:border-[#e4d9ca] [&_textarea]:bg-white [&_textarea]:px-3 [&_textarea]:py-2.5 [&_textarea]:text-sm [&_textarea]:focus:border-[#b9781d] [&_textarea]:focus:outline-none [&_textarea]:focus:ring-2 [&_textarea]:focus:ring-[#b9781d]/15" aria-labelledby="settings-section-title">
            <div className="mb-5 border-b border-[var(--border)] pb-4 [&_h2]:m-0 [&_h2]:font-serif [&_h2]:text-2xl [&_p]:mt-2 [&_p]:text-sm [&_p]:text-[var(--text-soft)]">
              <div>
                <p className="mb-1.5 text-[0.68rem] font-extrabold uppercase tracking-[0.12em] text-[var(--text-soft)]">Account settings</p>
                <h2 id="settings-section-title">{activeSection}</h2>
                <p>{settings.find((setting) => setting.label === activeSection)?.description}</p>
              </div>
            </div>
            {saveMessage ? <div className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-800/10 bg-[rgba(95,125,93,0.12)] px-3 py-2.5 text-sm font-semibold text-[var(--success)]" role="status"><Check size={16} />{saveMessage}</div> : null}
            {renderSection()}
          </section>
        </div>
      </div>
    </AccommodationPartnerLayout>
  );
}
