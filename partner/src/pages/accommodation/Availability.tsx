import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import availabilityApi from "../../api/accommodation/availabilityApi";
import roomApi from "../../api/accommodation/roomApi";
import { getApiErrorMessage } from "../../api/axios";
import type { Room, RoomAvailability } from "../../types";
import { AccommodationPartnerLayout, ApiFeedback, PageHeader } from "../../components/layout/Layout";

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function AvailabilityPage() {
  const [month, setMonth] = useState(() => new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1)));
  const [rooms, setRooms] = useState<Room[]>([]);
  const [availability, setAvailability] = useState<RoomAvailability[]>([]);
  const [selectedRoom, setSelectedRoom] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [price, setPrice] = useState("");
  const [totalUnits, setTotalUnits] = useState("");
  const [blocked, setBlocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);

  const monthStart = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth(), 1));
  const monthEnd = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 0));
  const dates = useMemo(() => Array.from({ length: monthEnd.getUTCDate() }, (_, index) => new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth(), index + 1))), [monthEnd.getUTCDate(), month.getUTCFullYear(), month.getUTCMonth()]);

  useEffect(() => {
    let cancelled = false;
    async function loadAvailability() {
      setLoading(true);
      setError("");
      try {
        const [roomData, availabilityData] = await Promise.all([
          roomApi.list(),
          availabilityApi.list({ from: dateKey(monthStart), to: dateKey(monthEnd) }),
        ]);
        if (!cancelled) {
          setRooms(roomData);
          setAvailability(availabilityData);
          setSelectedRoom((current) => current || roomData[0]?._id || "");
          if (!from) setFrom(dateKey(monthStart));
          if (!to) setTo(dateKey(monthEnd));
          if (!price && roomData[0]) setPrice(String(roomData[0].basePrice));
          if (!totalUnits && roomData[0]) setTotalUnits(String(roomData[0].totalUnits));
        }
      } catch (requestError) {
        if (!cancelled) setError(getApiErrorMessage(requestError, "Could not load room availability."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadAvailability();
    return () => { cancelled = true; };
  }, [month, reload]);

  async function saveAvailability(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedRoom || !from || !to) return;
    setSaving(true);
    setError("");
    try {
      await availabilityApi.setRange({
        room: selectedRoom,
        from,
        to,
        totalUnits: Number(totalUnits),
        price: Number(price),
        isBlocked: blocked,
        blockReason: blocked ? "Blocked by accommodation partner" : undefined,
      });
      setReload((current) => current + 1);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Could not update availability."));
    } finally {
      setSaving(false);
    }
  }

  function chooseRoom(roomId: string) {
    const room = rooms.find((item) => item._id === roomId);
    setSelectedRoom(roomId);
    if (room) {
      setPrice(String(room.basePrice));
      setTotalUnits(String(room.totalUnits));
    }
  }

  return (
    <AccommodationPartnerLayout>
      <div className="mx-auto w-full max-w-[1440px]">
        <PageHeader title="Availability Calendar" subtitle="Manage room availability and pricing." action={<div className="flex items-center gap-2.5"><button type="button" className="inline-flex items-center justify-center gap-2 rounded-[10px] border border-[var(--border)] bg-white px-[1.1rem] py-[0.8rem] font-bold text-[var(--text)] px-[0.9rem] py-[0.7rem] text-[0.82rem]" aria-label="Previous month" onClick={() => setMonth(new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() - 1, 1)))}><ChevronLeft size={14} /> Previous</button><strong>{month.toLocaleDateString(undefined, { month: "long", year: "numeric", timeZone: "UTC" })}</strong><button type="button" className="inline-flex items-center justify-center gap-2 rounded-[10px] border border-[var(--border)] bg-white px-[1.1rem] py-[0.8rem] font-bold text-[var(--text)] px-[0.9rem] py-[0.7rem] text-[0.82rem]" aria-label="Next month" onClick={() => setMonth(new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 1)))}>Next <ChevronRight size={14} /></button></div>} />

        <div className="rounded-[18px] border border-[rgba(130,110,92,0.18)] bg-[rgba(255,252,247,0.94)] shadow-[0_8px_18px_rgba(36,22,13,0.03)] p-[18px_20px_10px] p-[18px_20px_14px]">
          <ApiFeedback loading={loading} error={error} onRetry={() => setReload((current) => current + 1)} />

          <form className="grid grid-cols-3 gap-4" onSubmit={saveAvailability}>
            <label className="flex flex-col gap-2 text-[0.82rem] font-bold text-[var(--text-soft)] [&_input]:font-medium [&_select]:font-medium [&_textarea]:font-medium"><span>Room type</span><select required value={selectedRoom} onChange={(event) => chooseRoom(event.target.value)}><option value="">Select a room</option>{rooms.map((room) => <option key={room._id} value={room._id}>{room.name}</option>)}</select></label>
            <label className="flex flex-col gap-2 text-[0.82rem] font-bold text-[var(--text-soft)] [&_input]:font-medium [&_select]:font-medium [&_textarea]:font-medium"><span>From</span><input required type="date" value={from} onChange={(event) => setFrom(event.target.value)} /></label>
            <label className="flex flex-col gap-2 text-[0.82rem] font-bold text-[var(--text-soft)] [&_input]:font-medium [&_select]:font-medium [&_textarea]:font-medium"><span>To</span><input required type="date" min={from} value={to} onChange={(event) => setTo(event.target.value)} /></label>
            <label className="flex flex-col gap-2 text-[0.82rem] font-bold text-[var(--text-soft)] [&_input]:font-medium [&_select]:font-medium [&_textarea]:font-medium"><span>Nightly rate</span><input required type="number" min="0" value={price} onChange={(event) => setPrice(event.target.value)} /></label>
            <label className="flex flex-col gap-2 text-[0.82rem] font-bold text-[var(--text-soft)] [&_input]:font-medium [&_select]:font-medium [&_textarea]:font-medium"><span>Total units</span><input required type="number" min="0" value={totalUnits} onChange={(event) => setTotalUnits(event.target.value)} /></label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={blocked} onChange={(event) => setBlocked(event.target.checked)} /><span>Block selected dates</span></label>
            <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-[10px] border-0 bg-gradient-to-br from-[var(--gold)] to-[#b9781d] px-[1.1rem] py-[0.8rem] font-bold text-white shadow-[var(--shadow-soft)] hover:brightness-[0.98]" disabled={saving || loading || rooms.length === 0}>{saving ? "Saving..." : "Update range"}</button>
          </form>

          <div className="mt-[18px] overflow-x-auto">
            <table className="w-full border-collapse [&_th]:border-b [&_th]:border-[var(--border)] [&_th]:px-[0.8rem] [&_th]:py-[0.9rem] [&_th]:text-left [&_th]:text-[0.76rem] [&_th]:font-extrabold [&_th]:uppercase [&_th]:tracking-[0.08em] [&_th]:text-[var(--text-soft)] [&_td]:border-b [&_td]:border-[var(--border)] [&_td]:px-[0.8rem] [&_td]:py-[0.9rem] [&_td]:text-left [&_td]:text-[var(--text)]">
              <thead>
                <tr>
                  <th>Room</th>
                  {dates.map((date) => (
                    <th key={dateKey(date)}>{date.toLocaleDateString(undefined, { weekday: "short", day: "numeric", timeZone: "UTC" })}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rooms.map((room) => (
                  <tr key={room._id}>
                    <td className="min-w-[150px] font-bold">{room.name}</td>
                    {dates.map((date) => {
                      const record = availability.find((item) => item.room === room._id && item.date.slice(0, 10) === dateKey(date));
                      const content = record?.isBlocked ? "Blocked" : record ? `${record.availableUnits} left · ${record.currency} ${record.price}` : `${room.currency} ${room.basePrice}`;
                      return <td key={`${room._id}-${dateKey(date)}`} className="min-w-[94px] text-center" title={record?.blockReason ?? content}><span className="inline-flex min-h-[54px] w-full items-center justify-center rounded-xl bg-[rgba(197,138,42,0.08)] font-bold text-[var(--text)]">{content}</span></td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && rooms.length === 0 ? <div className="flex min-h-[150px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-soft)] p-6 text-center text-[var(--text-soft)] [&_strong]:text-[var(--text)]"><strong>No room inventory found</strong><span>Add room types before setting availability.</span></div> : null}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-[18px] text-[0.82rem] text-[var(--text-soft)]">
            <span><i className="mr-2 inline-block h-[10px] w-[10px] rounded-full bg-[var(--gold)]" /> Available or base rate</span>
            <span><i className="mr-2 inline-block h-[10px] w-[10px] rounded-full bg-[var(--text)]" /> Fully booked</span>
            <span><i className="mr-2 inline-block h-[10px] w-[10px] rounded-full bg-[var(--border)]" /> Blocked</span>
          </div>
        </div>
      </div>
    </AccommodationPartnerLayout>
  );
}
