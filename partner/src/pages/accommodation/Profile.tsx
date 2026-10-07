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
            <div className="profile-header-row">
              <div className="profile-avatar-wrap">
                <div className="profile-avatar" />
                <span className="camera-badge"><Camera size={14} /></span>
              </div>
              <div>
                <h3>{partner?.name ?? "Accommodation partner"}</h3>
                <p>Accommodation Partner</p>
              </div>
            </div>
            <form onSubmit={handleSave}>
              <div className="profile-form-grid">
                <label className="field-label"><span>Contact name</span><input name="contactName" defaultValue={savedValue("Profile", "contactName", partner?.contactName ?? "")} required /></label>
                <label className="field-label"><span>Business email (read-only)</span><input type="email" value={partner?.email ?? ""} readOnly /></label>
                <label className="field-label"><span>Phone number</span><input name="phone" type="tel" defaultValue={savedValue("Profile", "phone", partner?.phone ?? "")} required /></label>
                <label className="field-label"><span>Country calling code</span><input name="countryCode" defaultValue={savedValue("Profile", "countryCode", partner?.countryCode ?? "+255")} required /></label>
              </div>
              <div className="settings-save-bar"><span>Keep your contact information current for booking updates.</span><button type="submit" className="primary-button">Save profile</button></div>
            </form>
          </>
        );
      case "Property Details":
        return (
          <form onSubmit={handleSave}>
            <div className="profile-form-grid">
                <label className="field-label"><span>Property name</span><input name="propertyName" defaultValue={savedValue("Property Details", "propertyName", partner?.name ?? "")} required /></label>
                <label className="field-label"><span>Property type</span><select name="propertyType" defaultValue={savedValue("Property Details", "propertyType", partner?.type ?? "lodge")}><option value="hotel">Hotel</option><option value="lodge">Lodge</option><option value="camp">Safari camp</option><option value="resort">Resort</option><option value="bnb">B&amp;B</option><option value="guesthouse">Guest house</option><option value="villa">Villa</option><option value="apartment">Apartment</option></select></label>
                <label className="field-label"><span>Town or region</span><input name="town" defaultValue={savedValue("Property Details", "town", partner?.town ?? "")} required /></label>
                <label className="field-label"><span>Street address</span><input name="address" defaultValue={savedValue("Property Details", "address", partner?.address ?? "")} required /></label>
                <label className="field-label"><span>Check-in time</span><input name="checkInTime" type="time" defaultValue={savedValue("Property Details", "checkInTime", partner?.checkInTime ?? "14:00")} /></label>
                <label className="field-label"><span>Check-out time</span><input name="checkOutTime" type="time" defaultValue={savedValue("Property Details", "checkOutTime", partner?.checkOutTime ?? "11:00")} /></label>
                <label className="field-label field-span-2"><span>Amenities (comma separated)</span><input name="amenities" defaultValue={savedValue("Property Details", "amenities", partner?.amenities?.join(", ") ?? "")} /></label>
                <label className="field-label field-span-2"><span>About this property</span><textarea name="description" rows={4} defaultValue={savedValue("Property Details", "description", partner?.description ?? "")} /></label>
            </div>
            <div className="settings-save-bar"><span>These details appear on your listing and guest confirmations.</span><button type="submit" className="primary-button" disabled={saving}>{saving ? "Saving..." : "Save property details"}</button></div>
          </form>
        );
      case "Banking & Payouts":
        return (
          <form onSubmit={handleSave}>
            <div className="settings-info-banner"><CreditCard size={18} /><span>Payouts are sent to the verified account below. Account details are partially hidden for security.</span></div>
            <div className="profile-form-grid">
              <label className="field-label"><span>Payout method</span><select name="payoutMethod" defaultValue={savedValue("Banking & Payouts", "payoutMethod", wallet?.payoutMethod ?? "bank")}><option value="bank">Bank account</option><option value="mpesa">M-Pesa</option></select></label>
              <label className="field-label"><span>Account holder</span><input name="accountName" defaultValue={savedValue("Banking & Payouts", "accountName", wallet?.payoutDetails.accountName ?? "")} /></label>
              <label className="field-label"><span>Bank name</span><input name="bankName" defaultValue={savedValue("Banking & Payouts", "bankName", wallet?.payoutDetails.bankName ?? "")} /></label>
              <label className="field-label"><span>Account number</span><input name="accountNumber" type="text" defaultValue={savedValue("Banking & Payouts", "accountNumber", wallet?.payoutDetails.accountNumber ?? "")} /></label>
              <label className="field-label"><span>M-Pesa phone</span><input name="mobileMoneyPhone" type="tel" defaultValue={savedValue("Banking & Payouts", "mobileMoneyPhone", wallet?.payoutDetails.phone ?? "")} /></label>
              <label className="field-label"><span>Payout frequency</span><select name="payoutFrequency" defaultValue={savedValue("Banking & Payouts", "payoutFrequency", wallet?.payoutFrequency ?? "weekly")}><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="biweekly">Every two weeks</option><option value="monthly">Monthly</option></select></label>
              <label className="field-label"><span>Minimum payout</span><input name="minimumPayout" type="number" min="0" defaultValue={savedValue("Banking & Payouts", "minimumPayout", String(wallet?.minimumPayout ?? 0))} /></label>
            </div>
            <div className="payout-next-row"><div><span>Current payout schedule</span><strong>{wallet?.payoutFrequency ?? "Not configured"} · {wallet?.currency ?? ""}</strong></div><span className={`status-badge ${wallet?.status === "active" ? "active" : "pending"}`}>{wallet?.status ?? "Unavailable"}</span></div>
            <div className="settings-save-bar"><span>Bank changes may require verification before the next payout.</span><button type="submit" className="primary-button" disabled={saving || !wallet}>{saving ? "Saving..." : "Save payout details"}</button></div>
          </form>
        );
      case "Notifications":
        return (
          <div className="settings-toggle-list">
            <div className="settings-unavailable-note">Notification preferences are not currently supported by the accommodation API.</div>
            {([
              ["bookingUpdates", "Booking updates", "New reservations, changes, and cancellations."],
              ["guestMessages", "Guest messages", "Messages and questions from current or upcoming guests."],
              ["payoutUpdates", "Payout activity", "Payout confirmations and payment account notices."],
              ["reviewAlerts", "Guest reviews", "New ratings and review response reminders."],
              ["productNews", "Product announcements", "Occasional updates about tools and partner resources."],
            ] as const).map(([key, title, description]) => (
              <label className="settings-toggle-row" key={key}>
                <span><strong>{title}</strong><small>{description}</small></span>
                <input type="checkbox" disabled aria-label={`${title} preference unavailable`} />
              </label>
            ))}
          </div>
        );
      case "Security":
        return (
          <div className="settings-security-stack">
            <div>
              <h3 className="settings-subheading">Change password</h3>
              <div className="settings-unavailable-note">Password updates are not currently supported by the accommodation API.</div>
              <div className="profile-form-grid">
                <label className="field-label field-span-2"><span>Current password</span><input disabled type="password" autoComplete="current-password" /></label>
                <label className="field-label"><span>New password</span><input disabled minLength={10} type="password" autoComplete="new-password" /></label>
                <label className="field-label"><span>Confirm new password</span><input disabled minLength={10} type="password" autoComplete="new-password" /></label>
              </div>
              <div className="settings-save-bar"><span>Use at least 10 characters.</span><button type="button" className="primary-button" disabled>Update password</button></div>
            </div>
            <div className="settings-security-row">
              <span className="settings-security-icon"><ShieldCheck size={19} /></span>
              <span><strong>Two-factor authentication</strong><small>Two-factor controls are not available through the current API.</small></span>
              <label className="settings-check-control"><input type="checkbox" checked={false} disabled /><span>Unavailable</span></label>
            </div>
            <div className="settings-security-row">
              <span className="settings-security-icon"><KeyRound size={19} /></span>
              <span><strong>Active sessions</strong><small>Session management is not available through the current API.</small></span>
              <button type="button" className="secondary-button small-button" disabled>Unavailable</button>
            </div>
          </div>
        );
      case "Integrations":
        return (
          <div className="settings-integrations-list">
            {([
              ["channelManager", "Channel manager", "Sync rates and availability with your channel management tool."],
              ["whatsapp", "WhatsApp Business", "Send guest arrival details and service updates through WhatsApp."],
              ["googleAnalytics", "Google Analytics", "Understand how guests discover and interact with your property listing."],
            ] as const).map(([key, title, description]) => (
              <article className="settings-integration-row" key={key}>
                <span className="settings-integration-icon"><Plug size={18} /></span>
                <div><h3>{title}</h3><p>{description} Integration management is not available through the current API.</p></div>
                <button type="button" className="secondary-button small-button" disabled>Unavailable</button>
              </article>
            ))}
          </div>
        );
    }
  }

  return (
    <AccommodationPartnerLayout>
      <div className="page-shell">
        <PageHeader title="Profile & Settings" subtitle="Manage your account and property settings." />
        {loading || apiError ? <div className={`api-feedback ${apiError ? "error" : ""}`} role={apiError ? "alert" : "status"}>{apiError || "Loading partner settings..."}</div> : null}

        <div className="settings-layout">
          <nav className="card settings-nav" aria-label="Settings sections">
            {settings.map(({ label, icon: Icon }) => (
              <button type="button" key={label} className={`settings-link ${activeSection === label ? "active" : ""}`} aria-current={activeSection === label ? "page" : undefined} onClick={() => changeSection(label)}>
                <Icon size={17} />
                <span>{label}</span>
              </button>
            ))}
          </nav>

          <section className="card settings-content" aria-labelledby="settings-section-title">
            <div className="settings-content-heading">
              <div>
                <p className="eyebrow">Account settings</p>
                <h2 id="settings-section-title">{activeSection}</h2>
                <p>{settings.find((setting) => setting.label === activeSection)?.description}</p>
              </div>
            </div>
            {saveMessage ? <div className="settings-save-message" role="status">{saveMessage}</div> : null}
            {renderSection()}
          </section>
        </div>
      </div>
    </AccommodationPartnerLayout>
  );
}
