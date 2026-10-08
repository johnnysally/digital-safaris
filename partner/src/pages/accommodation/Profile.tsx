import { useEffect, useState, type FormEvent } from "react";
import { Bell, Building2, Camera, CreditCard, KeyRound, Mail, Plug, ShieldCheck, UserRound } from "lucide-react";
import profileApi from "../../api/accommodation/profileApi";
import walletApi from "../../api/accommodation/walletApi";
import { getApiErrorMessage } from "../../api/axios";
import type { AccommodationPartner, Wallet } from "../../types";
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

export function ProfilePage() {
  const [activeSection, setActiveSection] = useState<SettingsSection>("Profile");
  const [saveMessage, setSaveMessage] = useState("");
  const [savedSettings, setSavedSettings] = useState<Partial<Record<SettingsSection, Record<string, string>>>>({});
  const [partner, setPartner] = useState<AccommodationPartner | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function loadProfile() {
      setLoading(true);
      setApiError("");
      try {
        const result = await profileApi.get();
        if (!cancelled) {
          setPartner(result.partner);
          setWallet(result.wallet ?? null);
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
                <div className="grid h-20 w-20 place-items-center rounded-full bg-[#f1e1c8] text-2xl font-bold text-[#80501b]" />
                <span className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full border-2 border-white bg-[var(--gold)] text-white"><Camera size={14} /></span>
              </div>
              <div>
                <h3>{partner?.name ?? "Accommodation partner"}</h3>
                <p>Accommodation Partner</p>
              </div>
            </div>
            <form onSubmit={handleSave}>
              <div className="grid grid-cols-2 gap-[18px]">
                <label className="flex flex-col gap-2 text-[0.82rem] font-bold text-[var(--text-soft)] [&_input]:font-medium [&_select]:font-medium [&_textarea]:font-medium"><span>Contact name</span><input name="contactName" defaultValue={savedValue("Profile", "contactName", partner?.contactName ?? "")} required /></label>
                <label className="flex flex-col gap-2 text-[0.82rem] font-bold text-[var(--text-soft)] [&_input]:font-medium [&_select]:font-medium [&_textarea]:font-medium"><span>Business email (read-only)</span><input type="email" value={partner?.email ?? ""} readOnly /></label>
                <label className="flex flex-col gap-2 text-[0.82rem] font-bold text-[var(--text-soft)] [&_input]:font-medium [&_select]:font-medium [&_textarea]:font-medium"><span>Phone number</span><input name="phone" type="tel" defaultValue={savedValue("Profile", "phone", partner?.phone ?? "")} required /></label>
                <label className="flex flex-col gap-2 text-[0.82rem] font-bold text-[var(--text-soft)] [&_input]:font-medium [&_select]:font-medium [&_textarea]:font-medium"><span>Country calling code</span><input name="countryCode" defaultValue={savedValue("Profile", "countryCode", partner?.countryCode ?? "+255")} required /></label>
              </div>
              <div className="mt-6 flex items-center justify-between gap-4 border-t border-[var(--border)] pt-4 max-[760px]:items-stretch max-[760px]:flex-col"><span>Keep your contact information current for booking updates.</span><button type="submit" className="inline-flex items-center justify-center gap-2 rounded-[10px] border-0 bg-gradient-to-br from-[var(--gold)] to-[#b9781d] px-[1.1rem] py-[0.8rem] font-bold text-white shadow-[var(--shadow-soft)] hover:brightness-[0.98]">Save profile</button></div>
            </form>
          </>
        );
      case "Property Details":
        return (
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
          <div className="flex flex-col divide-y divide-[var(--border)]">
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] p-4 text-sm text-[var(--text-soft)]">Notification preferences are not currently supported by the accommodation API.</div>
            {([
              ["bookingUpdates", "Booking updates", "New reservations, changes, and cancellations."],
              ["guestMessages", "Guest messages", "Messages and questions from current or upcoming guests."],
              ["payoutUpdates", "Payout activity", "Payout confirmations and payment account notices."],
              ["reviewAlerts", "Guest reviews", "New ratings and review response reminders."],
              ["productNews", "Product announcements", "Occasional updates about tools and partner resources."],
            ] as const).map(([key, title, description]) => (
              <label className="flex items-center justify-between gap-4 py-4" key={key}>
                <span><strong>{title}</strong><small>{description}</small></span>
                <input type="checkbox" disabled aria-label={`${title} preference unavailable`} />
              </label>
            ))}
          </div>
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
          <div className="flex flex-col divide-y divide-[var(--border)]">
            {([
              ["channelManager", "Channel manager", "Sync rates and availability with your channel management tool."],
              ["whatsapp", "WhatsApp Business", "Send guest arrival details and service updates through WhatsApp."],
              ["googleAnalytics", "Google Analytics", "Understand how guests discover and interact with your property listing."],
            ] as const).map(([key, title, description]) => (
              <article className="flex items-center gap-3 py-4 max-[760px]:items-stretch max-[760px]:flex-col" key={key}>
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[rgba(197,138,42,0.12)] text-[var(--gold)]"><Plug size={18} /></span>
                <div><h3>{title}</h3><p>{description} Integration management is not available through the current API.</p></div>
                <button type="button" className="inline-flex items-center justify-center gap-2 rounded-[10px] border border-[var(--border)] bg-white px-[1.1rem] py-[0.8rem] font-bold text-[var(--text)] px-[0.9rem] py-[0.7rem] text-[0.82rem]" disabled>Unavailable</button>
              </article>
            ))}
          </div>
        );
    }
  }

  return (
    <AccommodationPartnerLayout>
      <div className="mx-auto w-full max-w-[1440px]">
        <PageHeader title="Profile & Settings" subtitle="Manage your account and property settings." />
        {loading || apiError ? <div className={`mb-3.5 flex items-center justify-between gap-3 rounded-lg border px-[13px] py-[11px] text-[0.82rem] ${apiError ? "border-[rgba(168,92,82,0.28)] bg-[rgba(168,92,82,0.07)] text-[#8e443b]" : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-soft)]"}`} role={apiError ? "alert" : "status"}>{apiError || "Loading partner settings..."}</div> : null}

        <div className="grid grid-cols-[220px_minmax(0,1fr)] items-start gap-[18px]">
          <nav className="overflow-hidden rounded-[18px] border border-[rgba(130,110,92,0.18)] bg-[rgba(255,252,247,0.94)] p-3 shadow-[0_8px_18px_rgba(36,22,13,0.03)] max-[760px]:grid max-[760px]:grid-cols-2 max-[760px]:gap-1" aria-label="Settings sections">
            {settings.map(({ label, icon: Icon }) => (
              <button type="button" key={label} className={`flex w-full items-center gap-2.5 rounded-lg border-0 bg-transparent px-3 py-2.5 text-left font-bold text-[var(--text-soft)] hover:bg-[var(--surface-soft)] max-[760px]:px-2 max-[760px]:py-[9px] max-[760px]:text-[0.76rem] [&_svg]:shrink-0 [&_svg]:text-[var(--text-muted)] ${activeSection === label ? "bg-[rgba(197,138,42,0.1)] text-[var(--gold)] [&_svg]:text-[var(--gold)]" : ""}`} aria-current={activeSection === label ? "page" : undefined} onClick={() => changeSection(label)}>
                <Icon size={17} />
                <span>{label}</span>
              </button>
            ))}
          </nav>

          <section className="overflow-hidden rounded-[18px] border border-[rgba(130,110,92,0.18)] bg-[rgba(255,252,247,0.94)] p-5 shadow-[0_8px_18px_rgba(36,22,13,0.03)] max-[760px]:p-4" aria-labelledby="settings-section-title">
            <div className="mb-5 border-b border-[var(--border)] pb-4 [&_h2]:m-0 [&_h2]:font-serif [&_h2]:text-2xl [&_p]:mt-2 [&_p]:text-sm [&_p]:text-[var(--text-soft)]">
              <div>
                <p className="mb-1.5 text-[0.68rem] font-extrabold uppercase tracking-[0.12em] text-[var(--text-soft)]">Account settings</p>
                <h2 id="settings-section-title">{activeSection}</h2>
                <p>{settings.find((setting) => setting.label === activeSection)?.description}</p>
              </div>
            </div>
            {saveMessage ? <div className="rounded-lg bg-[rgba(95,125,93,0.12)] px-3 py-2 text-sm font-semibold text-[var(--success)]" role="status">{saveMessage}</div> : null}
            {renderSection()}
          </section>
        </div>
      </div>
    </AccommodationPartnerLayout>
  );
}
