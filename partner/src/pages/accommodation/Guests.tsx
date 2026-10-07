import { useEffect, useState } from "react";
import { Mail, MessageSquareText, UserRound } from "lucide-react";
import guestApi from "../../api/accommodation/guestApi";
import { getApiErrorMessage } from "../../api/axios";
import type { Guest } from "../../types";
import { AccommodationPartnerLayout, ApiFeedback, PageHeader } from "../../components/layout/Layout";

type GuestWithBooking = Omit<Guest, "booking"> & {
  booking: string | { reference: string; checkIn: string; checkOut: string; status: string };
};

export function MessagesPage() {
  const [guests, setGuests] = useState<GuestWithBooking[]>([]);
  const [selectedGuestId, setSelectedGuestId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function loadGuests() {
      setLoading(true);
      setError("");
      try {
        const result = await guestApi.list({ limit: 100 });
        if (!cancelled) {
          const rows = result.data as GuestWithBooking[];
          setGuests(rows);
          setSelectedGuestId((current) => rows.some((guest) => guest._id === current) ? current : rows[0]?._id ?? "");
        }
      } catch (requestError) {
        if (!cancelled) setError(getApiErrorMessage(requestError, "Could not load guest records."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadGuests();
    return () => { cancelled = true; };
  }, [reload]);

  const selectedGuest = guests.find((guest) => guest._id === selectedGuestId);
  const booking = selectedGuest && typeof selectedGuest.booking !== "string" ? selectedGuest.booking : null;

  return (
    <AccommodationPartnerLayout>
      <div className="page-shell">
        <PageHeader title="Messages" subtitle="Review guest details connected to their reservations." />
        <ApiFeedback loading={loading} error={error} onRetry={() => setReload((current) => current + 1)} />

        <div className="messages-layout card">
          <aside className="conversation-list">
            {guests.map((guest) => (
              <button type="button" key={guest._id} className={`conversation-item ${guest._id === selectedGuestId ? "active" : ""}`} onClick={() => setSelectedGuestId(guest._id)}>
                <span className="guest-initial-avatar">{guest.firstName.slice(0, 1)}{guest.lastName.slice(0, 1)}</span>
                <div className="conversation-copy">
                  <div className="conversation-head">
                    <strong>{guest.firstName} {guest.lastName}</strong>
                    <span>{guest.isPrimary ? "Primary" : "Guest"}</span>
                  </div>
                  <div className="conversation-preview">{typeof guest.booking === "string" ? "Reservation details unavailable" : `Booking ${guest.booking.reference}`}</div>
                </div>
              </button>
            ))}
            {!loading && guests.length === 0 ? <div className="rooms-empty-state"><UserRound size={22} /><strong>No guest records</strong><span>Guest details appear when reservations are made.</span></div> : null}
          </aside>

          <section className="chat-panel">
            {selectedGuest ? <>
              <div className="chat-header">
                <div className="chat-user">
                  <span className="guest-initial-avatar large">{selectedGuest.firstName.slice(0, 1)}{selectedGuest.lastName.slice(0, 1)}</span>
                  <div><strong>{selectedGuest.firstName} {selectedGuest.lastName}</strong><span>{selectedGuest.email || "Guest contact"}</span></div>
                </div>
              </div>
              <div className="guest-detail-panel">
                <span className="guest-detail-icon"><MessageSquareText size={19} /></span>
                <h2>Guest messaging is not connected</h2>
                <p>The accommodation API currently provides guest and booking records, but does not expose conversation history or message sending.</p>
                <div className="guest-booking-details">
                  <div><span>Booking</span><strong>{booking?.reference ?? "Unavailable"}</strong></div>
                  <div><span>Check-in</span><strong>{booking?.checkIn ? new Date(booking.checkIn).toLocaleDateString() : "Unavailable"}</strong></div>
                  <div><span>Check-out</span><strong>{booking?.checkOut ? new Date(booking.checkOut).toLocaleDateString() : "Unavailable"}</strong></div>
                  <div><span>Phone</span><strong>{selectedGuest.phone || "Not provided"}</strong></div>
                </div>
                {selectedGuest.email ? <a className="secondary-button" href={`mailto:${selectedGuest.email}`}><Mail size={15} /> Email guest</a> : null}
              </div>
            </> : <div className="guest-detail-panel"><UserRound size={22} /><strong>Select a guest</strong></div>}
          </section>
        </div>
      </div>
    </AccommodationPartnerLayout>
  );
}
