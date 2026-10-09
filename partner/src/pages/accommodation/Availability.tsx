import { useEffect, useMemo, useState, type FormEvent } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, CircleDollarSign, LockKeyhole, UnlockKeyhole } from "lucide-react";
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
  const dates = useMemo(
    () => Array.from({ length: monthEnd.getUTCDate() }, (_, index) => new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth(), index + 1))),
    [monthEnd, month],
  );
  const selectedRoomDetails = rooms.find((room) => room._id === selectedRoom);
  const monthLabel = month.toLocaleDateString(undefined, { month: "long", year: "numeric", timeZone: "UTC" });
  const availabilityByRoomAndDate = useMemo(
    () => new Map(availability.map((record) => [`${record.room}:${record.date.slice(0, 10)}`, record])),
    [availability],
  );
  const selectedDateRecords = dates.map((date) => availabilityByRoomAndDate.get(`${selectedRoom}:${dateKey(date)}`));
  const blockedDates = selectedDateRecords.filter((record) => record?.isBlocked).length;
  const availableDates = selectedRoom
    ? selectedDateRecords.filter((record) => !record?.isBlocked && (!record || record.availableUnits > 0)).length
    : 0;

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
        if (cancelled) return;

        setRooms(roomData);
        setAvailability(availabilityData);
        setSelectedRoom((current) => current || roomData[0]?._id || "");
        setFrom((current) => current || dateKey(monthStart));
        setTo((current) => current || dateKey(monthEnd));
        if (!price && roomData[0]) setPrice(String(roomData[0].basePrice));
        if (!totalUnits && roomData[0]) setTotalUnits(String(roomData[0].totalUnits));
      } catch (requestError) {
        if (!cancelled) setError(getApiErrorMessage(requestError, "Could not load room availability."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadAvailability();
    return () => {
      cancelled = true;
    };
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
      <div className="w-full">
        <PageHeader title="Availability" subtitle="Manage room inventory, nightly rates, and blocked dates." />
        <ApiFeedback loading={loading} error={error} onRetry={() => setReload((current) => current + 1)} />

        <section className="mb-5 grid gap-3 sm:grid-cols-3" aria-label="Availability summary">
          <SummaryCard icon={CalendarDays} label="Days this month" value={String(dates.length)} detail={monthLabel} />
          <SummaryCard icon={UnlockKeyhole} label="Available dates" value={String(availableDates)} detail={selectedRoomDetails?.name ?? "Select a room"} />
          <SummaryCard icon={LockKeyhole} label="Blocked dates" value={String(blockedDates)} detail="For selected room" />
        </section>

        <div className="grid items-start gap-5 xl:grid-cols-[minmax(280px,340px)_minmax(0,1fr)]">
          <section className="rounded-xl border border-[#e9dfd1] bg-[rgba(255,252,247,.9)] p-4 shadow-[0_3px_12px_rgba(54,37,20,.035)] sm:p-5">
            <div className="mb-4">
              <h2 className="font-serif text-lg font-semibold text-[#29231e]">Update availability</h2>
              <p className="mt-1 text-xs leading-relaxed text-[#70675e]">Set rates, room capacity, or block a date range for a room.</p>
            </div>

            <form className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1" onSubmit={saveAvailability}>
              <label className="flex min-w-0 flex-col gap-1.5 text-xs font-semibold text-[#554c43]">
                <span>Room type</span>
                <select className="min-h-10 min-w-0 rounded-lg border border-[#ded4c6] bg-white px-3 py-2 text-sm font-normal text-[#322a23] focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-600/20" required value={selectedRoom} onChange={(event) => chooseRoom(event.target.value)}>
                  <option value="">Select a room</option>
                  {rooms.map((room) => <option key={room._id} value={room._id}>{room.name}</option>)}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex min-w-0 flex-col gap-1.5 text-xs font-semibold text-[#554c43]">
                  <span>From</span>
                  <input className="min-h-10 min-w-0 rounded-lg border border-[#ded4c6] bg-white px-2.5 py-2 text-sm font-normal text-[#322a23] focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-600/20" required type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
                </label>
                <label className="flex min-w-0 flex-col gap-1.5 text-xs font-semibold text-[#554c43]">
                  <span>To</span>
                  <input className="min-h-10 min-w-0 rounded-lg border border-[#ded4c6] bg-white px-2.5 py-2 text-sm font-normal text-[#322a23] focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-600/20" required type="date" min={from} value={to} onChange={(event) => setTo(event.target.value)} />
                </label>
              </div>
              <label className="flex min-w-0 flex-col gap-1.5 text-xs font-semibold text-[#554c43]">
                <span>Nightly rate</span>
                <span className="relative">
                  <CircleDollarSign className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#988a78]" size={16} />
                  <input className="min-h-10 w-full rounded-lg border border-[#ded4c6] bg-white py-2 pl-9 pr-3 text-sm font-normal text-[#322a23] focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-600/20" required type="number" min="0" step="0.01" value={price} onChange={(event) => setPrice(event.target.value)} />
                </span>
                {selectedRoomDetails ? <span className="text-[10px] font-normal text-[#81766a]">Default rate: {selectedRoomDetails.currency} {selectedRoomDetails.basePrice}</span> : null}
              </label>
              <label className="flex min-w-0 flex-col gap-1.5 text-xs font-semibold text-[#554c43]">
                <span>Total units</span>
                <input className="min-h-10 rounded-lg border border-[#ded4c6] bg-white px-3 py-2 text-sm font-normal text-[#322a23] focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-600/20" required type="number" min="0" step="1" value={totalUnits} onChange={(event) => setTotalUnits(event.target.value)} />
              </label>
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-[#eee5d9] bg-[#fbf7f0] px-3 py-3 text-xs font-medium text-[#554c43] sm:col-span-2 xl:col-span-1">
                <input className="h-4 w-4 accent-[#b9781d]" type="checkbox" checked={blocked} onChange={(event) => setBlocked(event.target.checked)} />
                <span>Block these dates from booking</span>
              </label>
              <button className="inline-flex min-h-11 items-center justify-center rounded-lg border-0 bg-gradient-to-br from-[var(--gold)] to-[#b9781d] px-4 py-2 text-sm font-semibold text-white shadow-[var(--shadow-soft)] transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-2 xl:col-span-1" type="submit" disabled={saving || loading || rooms.length === 0 || !selectedRoom}>
                {saving ? "Saving changes..." : "Save date range"}
              </button>
            </form>
            {!loading && rooms.length === 0 ? (
              <div className="mt-4 rounded-lg border border-dashed border-[#ded4c6] bg-[#fbf7f0] p-4 text-center text-xs text-[#70675e]">
                <strong className="block text-[#332b24]">No room inventory yet</strong>
                <span className="mt-1 block">Add a room before setting availability.</span>
              </div>
            ) : null}
          </section>

          <section className="min-w-0 overflow-hidden rounded-xl border border-[#e9dfd1] bg-[rgba(255,252,247,.9)] shadow-[0_3px_12px_rgba(54,37,20,.035)]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eee5d9] px-4 py-3 sm:px-5">
              <div>
                <h2 className="font-serif text-lg font-semibold text-[#29231e]">Room calendar</h2>
                <p className="mt-0.5 text-xs text-[#70675e]">{selectedRoomDetails?.name ?? "All rooms"} · daily rate and availability</p>
              </div>
              <div className="flex items-center gap-2">
                <button className="grid h-9 w-9 place-items-center rounded-lg border border-[#ded4c6] bg-white text-[#554c43] transition hover:bg-[#fbf3e7]" type="button" aria-label="Previous month" onClick={() => setMonth(new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() - 1, 1)))}>
                  <ChevronLeft size={17} />
                </button>
                <strong className="min-w-[116px] text-center text-sm text-[#332b24]">{monthLabel}</strong>
                <button className="grid h-9 w-9 place-items-center rounded-lg border border-[#ded4c6] bg-white text-[#554c43] transition hover:bg-[#fbf3e7]" type="button" aria-label="Next month" onClick={() => setMonth(new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 1)))}>
                  <ChevronRight size={17} />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-[#eee5d9] px-4 py-3 text-[10px] text-[#70675e] sm:px-5">
              <Legend color="bg-[#f2f7ef]" label="Available" />
              <Legend color="bg-[#f7e7c9]" label="Fully booked" />
              <Legend color="bg-[#f2deda]" label="Blocked" />
              <span className="ml-auto">{selectedRoomDetails ? `${selectedRoomDetails.currency} ${selectedRoomDetails.basePrice} base rate` : ""}</span>
            </div>

            <div className="max-h-[620px] overflow-auto">
              {rooms.length > 0 ? (
                <table className="w-full min-w-max border-collapse text-left text-[11px]">
                  <thead className="sticky top-0 z-20 bg-[#f8f2e8] text-[#49433d]">
                    <tr>
                      <th className="sticky left-0 z-30 min-w-[160px] border-b border-[#e9dfd1] bg-[#f8f2e8] px-4 py-3 font-semibold">Room</th>
                      {dates.map((date) => (
                        <th className="min-w-[88px] border-b border-[#e9dfd1] px-2 py-3 text-center font-medium" key={dateKey(date)}>
                          <span className="block text-[9px] font-normal uppercase tracking-wide text-[#877b6e]">{date.toLocaleDateString(undefined, { weekday: "short", timeZone: "UTC" })}</span>
                          <span className="mt-0.5 block text-xs">{date.toLocaleDateString(undefined, { day: "numeric", timeZone: "UTC" })}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rooms.map((room) => (
                      <tr className="border-b border-[#eee7dd] last:border-0" key={room._id}>
                        <th className="sticky left-0 z-10 border-r border-[#eee7dd] bg-[#fffcf7] px-4 py-3 text-left font-semibold text-[#332b24]">
                          <span className="block max-w-[145px] truncate">{room.name}</span>
                          <span className="mt-0.5 block text-[9px] font-normal text-[#81766a]">{room.totalUnits} units · {room.currency} {room.basePrice}</span>
                        </th>
                        {dates.map((date) => {
                          const record = availabilityByRoomAndDate.get(`${room._id}:${dateKey(date)}`);
                          const isFull = Boolean(record && !record.isBlocked && record.availableUnits === 0);
                          const cellClass = record?.isBlocked
                            ? "bg-[#f2deda] text-[#963f35]"
                            : isFull
                              ? "bg-[#f7e7c9] text-[#815312]"
                              : "bg-[#f2f7ef] text-[#42643c]";
                          const label = record?.isBlocked
                            ? "Blocked"
                            : `${record?.availableUnits ?? room.totalUnits} available`;
                          const cellPrice = record?.price ?? room.basePrice;
                          return (
                            <td className="border-l border-[#f0e9df] px-1.5 py-2 text-center" key={`${room._id}-${dateKey(date)}`} title={record?.blockReason ?? `${label} · ${room.currency} ${cellPrice}`}>
                              <span className={`mx-auto flex min-h-[46px] min-w-[76px] flex-col items-center justify-center rounded-md px-1.5 py-1 ${cellClass}`}>
                                <strong className="text-[10px] font-semibold">{record?.isBlocked ? "Blocked" : `${record?.availableUnits ?? room.totalUnits} left`}</strong>
                                <small className="mt-0.5 text-[9px] opacity-80">{room.currency} {cellPrice}</small>
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="flex min-h-[180px] flex-col items-center justify-center gap-2 p-6 text-center text-sm text-[#70675e]">
                  <CalendarDays className="text-[#b9781d]" size={24} />
                  <strong className="text-[#332b24]">Calendar is ready when you are</strong>
                  <span>Add room inventory to see daily availability here.</span>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </AccommodationPartnerLayout>
  );
}

function SummaryCard({ icon: Icon, label, value, detail }: { icon: typeof CalendarDays; label: string; value: string; detail: string }) {
  return (
    <div className="flex min-h-[88px] items-center gap-3 rounded-xl border border-[#e9dfd1] bg-[rgba(255,252,247,.9)] px-4 py-3 shadow-[0_3px_12px_rgba(54,37,20,.035)]">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#f5ead8] text-[#8b4e16]"><Icon size={19} /></span>
      <div className="min-w-0">
        <span className="block text-[11px] text-[#70675e]">{label}</span>
        <strong className="block text-xl leading-tight text-[#29231e]">{value}</strong>
        <small className="block truncate text-[10px] text-[#877b6e]">{detail}</small>
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return <span className="inline-flex items-center gap-1.5"><i className={`h-2.5 w-2.5 rounded-sm ${color}`} />{label}</span>;
}
