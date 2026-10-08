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
      <div className="mx-auto w-full max-w-[1440px]">
        <PageHeader title="Messages" subtitle="Review guest details connected to their reservations." />
        <ApiFeedback loading={loading} error={error} onRetry={() => setReload((current) => current + 1)} />

        <div className="grid min-h-[620px] grid-cols-[320px_minmax(0,1fr)] overflow-hidden rounded-[18px] border border-[rgba(130,110,92,0.18)] bg-[rgba(255,252,247,0.94)] shadow-[0_8px_18px_rgba(36,22,13,0.03)]">
          <aside className="border-r border-[var(--border)] bg-[rgba(249,243,232,0.6)]">
            {guests.map((guest) => (
              <button type="button" key={guest._id} className={`flex w-full items-center gap-3 border-0 border-b border-[var(--border)] px-[14px] py-[14px] text-left text-[var(--text)] [&_img]:h-[38px] [&_img]:w-[38px] [&_img]:rounded-full [&_img]:object-cover ${guest._id === selectedGuestId ? "bg-[rgba(197,138,42,0.08)]" : "bg-transparent"}`} onClick={() => setSelectedGuestId(guest._id)}>
                <span className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-full bg-[#f1e1c8] text-[0.72rem] font-bold text-[#80501b]">{guest.firstName.slice(0, 1)}{guest.lastName.slice(0, 1)}</span>
                <div className="min-w-0 flex-1">
                  <div className="mb-1.5 flex items-center justify-between gap-2.5 text-[0.82rem]">
                    <strong>{guest.firstName} {guest.lastName}</strong>
                    <span>{guest.isPrimary ? "Primary" : "Guest"}</span>
                  </div>
                  <div className="overflow-hidden text-ellipsis whitespace-nowrap text-[0.76rem] text-[var(--text-soft)]">{typeof guest.booking === "string" ? "Reservation details unavailable" : `Booking ${guest.booking.reference}`}</div>
                </div>
              </button>
            ))}
            {!loading && guests.length === 0 ? <div className="flex min-h-[150px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-soft)] p-6 text-center text-[var(--text-soft)] [&_strong]:text-[var(--text)]"><UserRound size={22} /><strong>No guest records</strong><span>Guest details appear when reservations are made.</span></div> : null}
          </aside>

          <section className="flex flex-col">
            {selectedGuest ? <>
              <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-[18px]">
                <div className="flex items-center gap-3 [&_img]:h-[38px] [&_img]:w-[38px] [&_img]:rounded-full [&_img]:object-cover [&_strong]:block [&_strong]:text-[0.9rem] [&_span]:block [&_span]:text-[0.7rem] [&_span]:text-[var(--text-soft)]">
                  <span className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-full bg-[#f1e1c8] text-[0.72rem] font-bold text-[#80501b] h-[42px] w-[42px] basis-[42px]">{selectedGuest.firstName.slice(0, 1)}{selectedGuest.lastName.slice(0, 1)}</span>
                  <div><strong>{selectedGuest.firstName} {selectedGuest.lastName}</strong><span>{selectedGuest.email || "Guest contact"}</span></div>
                </div>
              </div>
              <div className="flex flex-1 flex-col items-start justify-center gap-3 bg-[rgba(251,248,242,0.6)] p-[26px] [&_h2]:m-0 [&_h2]:font-serif [&_h2]:text-[1.35rem] [&_h2]:text-[var(--text)] [&>p]:m-0 [&>p]:max-w-[480px] [&>p]:text-[0.84rem] [&>p]:leading-[1.55] [&>p]:text-[var(--text-soft)]">
                <span className="grid h-[42px] w-[42px] place-items-center rounded-full bg-[#f5e8d3] text-[#895016]"><MessageSquareText size={19} /></span>
                <h2>Guest messaging is not connected</h2>
                <p>The accommodation API currently provides guest and booking records, but does not expose conversation history or message sending.</p>
                <div className="my-1.5 grid w-full max-w-[520px] grid-cols-2 gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 [&>div]:flex [&>div]:min-w-0 [&>div]:flex-col [&>div]:gap-1 [&_span]:text-[0.69rem] [&_span]:text-[var(--text-muted)] [&_strong]:overflow-hidden [&_strong]:text-ellipsis [&_strong]:text-[0.78rem] [&_strong]:text-[var(--text)]">
                  <div><span>Booking</span><strong>{booking?.reference ?? "Unavailable"}</strong></div>
                  <div><span>Check-in</span><strong>{booking?.checkIn ? new Date(booking.checkIn).toLocaleDateString() : "Unavailable"}</strong></div>
                  <div><span>Check-out</span><strong>{booking?.checkOut ? new Date(booking.checkOut).toLocaleDateString() : "Unavailable"}</strong></div>
                  <div><span>Phone</span><strong>{selectedGuest.phone || "Not provided"}</strong></div>
                </div>
                {selectedGuest.email ? <a className="inline-flex items-center justify-center gap-2 rounded-[10px] border border-[var(--border)] bg-white px-[1.1rem] py-[0.8rem] font-bold text-[var(--text)]" href={`mailto:${selectedGuest.email}`}><Mail size={15} /> Email guest</a> : null}
              </div>
            </> : <div className="flex flex-1 flex-col items-start justify-center gap-3 bg-[rgba(251,248,242,0.6)] p-[26px] [&_h2]:m-0 [&_h2]:font-serif [&_h2]:text-[1.35rem] [&_h2]:text-[var(--text)] [&>p]:m-0 [&>p]:max-w-[480px] [&>p]:text-[0.84rem] [&>p]:leading-[1.55] [&>p]:text-[var(--text-soft)]"><UserRound size={22} /><strong>Select a guest</strong></div>}
          </section>
        </div>
      </div>
    </AccommodationPartnerLayout>
  );
}
