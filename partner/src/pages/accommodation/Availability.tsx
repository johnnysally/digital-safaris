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
      <div className="page-shell">
        <PageHeader title="Availability Calendar" subtitle="Manage room availability and pricing." action={<div className="calendar-toggle"><button type="button" className="secondary-button small-button" aria-label="Previous month" onClick={() => setMonth(new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() - 1, 1)))}><ChevronLeft size={14} /> Previous</button><strong>{month.toLocaleDateString(undefined, { month: "long", year: "numeric", timeZone: "UTC" })}</strong><button type="button" className="secondary-button small-button" aria-label="Next month" onClick={() => setMonth(new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 1)))}>Next <ChevronRight size={14} /></button></div>} />

        <div className="card section-card calendar-card">
          <ApiFeedback loading={loading} error={error} onRetry={() => setReload((current) => current + 1)} />

          <form className="availability-range-form" onSubmit={saveAvailability}>
            <label className="field-label"><span>Room type</span><select required value={selectedRoom} onChange={(event) => chooseRoom(event.target.value)}><option value="">Select a room</option>{rooms.map((room) => <option key={room._id} value={room._id}>{room.name}</option>)}</select></label>
            <label className="field-label"><span>From</span><input required type="date" value={from} onChange={(event) => setFrom(event.target.value)} /></label>
            <label className="field-label"><span>To</span><input required type="date" min={from} value={to} onChange={(event) => setTo(event.target.value)} /></label>
            <label className="field-label"><span>Nightly rate</span><input required type="number" min="0" value={price} onChange={(event) => setPrice(event.target.value)} /></label>
            <label className="field-label"><span>Total units</span><input required type="number" min="0" value={totalUnits} onChange={(event) => setTotalUnits(event.target.value)} /></label>
            <label className="availability-block-toggle"><input type="checkbox" checked={blocked} onChange={(event) => setBlocked(event.target.checked)} /><span>Block selected dates</span></label>
            <button type="submit" className="primary-button" disabled={saving || loading || rooms.length === 0}>{saving ? "Saving..." : "Update range"}</button>
          </form>

          <div className="calendar-table-wrap">
            <table className="availability-table">
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
                    <td className="room-name">{room.name}</td>
                    {dates.map((date) => {
                      const record = availability.find((item) => item.room === room._id && item.date.slice(0, 10) === dateKey(date));
                      const cellStatus = record?.isBlocked ? "maintenance" : record && record.availableUnits === 0 ? "booked" : "available";
                      const content = record?.isBlocked ? "Blocked" : record ? `${record.availableUnits} left · ${record.currency} ${record.price}` : `${room.currency} ${room.basePrice}`;
                      return <td key={`${room._id}-${dateKey(date)}`} className={`availability-cell ${cellStatus}`} title={record?.blockReason ?? content}><span>{content}</span></td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && rooms.length === 0 ? <div className="rooms-empty-state"><strong>No room inventory found</strong><span>Add room types before setting availability.</span></div> : null}
          </div>

          <div className="legend-row">
            <span><i className="legend-dot available" /> Available or base rate</span>
            <span><i className="legend-dot booked" /> Fully booked</span>
            <span><i className="legend-dot maintenance" /> Blocked</span>
          </div>
        </div>
      </div>
    </AccommodationPartnerLayout>
  );
}
