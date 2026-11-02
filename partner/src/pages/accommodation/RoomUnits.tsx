import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { BedDouble, Save, Trash2 } from "lucide-react";
import { getApiErrorMessage } from "../../api/axios";
import roomApi from "../../api/accommodation/roomApi";
import roomUnitApi, {
  type BulkUpdateItem,
  type RoomUnit,
} from "../../api/accommodation/roomUnitApi";
import type { Room } from "../../types";
import {
  AccommodationPartnerLayout,
  ApiFeedback,
  PageHeader,
} from "../../components/layout/Layout";

type Status = RoomUnit["status"];

interface DraftUnit {
  _id: string;
  number: string;
  floor: string;
  status: Status;
  notes: string;
  dirty: boolean;
}

export function RoomUnitsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialRoom = searchParams.get("roomType") ?? "";

  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState(initialRoom);
  const [units, setUnits] = useState<DraftUnit[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    roomApi.list().then(setRooms).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedRoom) {
      setUnits([]);
      return;
    }
    setSearchParams({ roomType: selectedRoom }, { replace: true });
    setLoading(true);
    setError("");
    setMessage("");
    roomUnitApi
      .list({ roomType: selectedRoom })
      .then((items) =>
        setUnits(
          items.map((u) => ({
            _id: u._id,
            number: u.number,
            floor: u.floor ?? "",
            status: u.status,
            notes: u.notes ?? "",
            dirty: false,
          }))
        )
      )
      .catch((err) =>
        setError(getApiErrorMessage(err, "Could not load room units."))
      )
      .finally(() => setLoading(false));
  }, [selectedRoom, setSearchParams]);

  function updateUnit(index: number, patch: Partial<DraftUnit>) {
    setUnits((current) =>
      current.map((unit, i) =>
        i === index ? { ...unit, ...patch, dirty: true } : unit
      )
    );
  }

  async function handleSave() {
    const dirty = units.filter((u) => u.dirty);
    if (dirty.length === 0) {
      setMessage("No changes to save.");
      return;
    }
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const updates: BulkUpdateItem[] = dirty.map((u) => ({
        _id: u._id,
        number: u.number.trim(),
        floor: u.floor.trim() || null,
        status: u.status,
        notes: u.notes.trim() || null,
      }));
      const result = await roomUnitApi.bulkUpdate(updates);
      setUnits((current) => current.map((u) => ({ ...u, dirty: false })));
      if (result.failed.length === 0) {
        setMessage(
          `${result.updated} room unit${result.updated === 1 ? "" : "s"} saved.`
        );
      } else {
        setMessage(`${result.updated} saved · ${result.failed.length} failed`);
        setError(result.failed.map((f) => f.reason).join("; "));
      }
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not save room units."));
    } finally {
      setSaving(false);
    }
  }

  const dirtyCount = units.filter((u) => u.dirty).length;
  const activeCount = units.filter((u) => u.status === "active").length;
  const maintenanceCount = units.filter((u) => u.status === "maintenance").length;
  const blockedCount = units.filter((u) => u.status === "blocked").length;
  const selectedRoomDoc = rooms.find((r) => r._id === selectedRoom);

  return (
    <AccommodationPartnerLayout>
      <div className="mx-auto w-full max-w-[1200px]">
        <PageHeader
          title="Room Units"
          subtitle="Number your physical rooms and set each room's status."
          action={
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || dirtyCount === 0}
              className="inline-flex items-center gap-2 rounded-[10px] border-0 bg-gradient-to-br from-[var(--gold)] to-[#b9781d] px-4 py-2 text-sm font-bold text-white shadow-[var(--shadow-soft)] disabled:opacity-50"
            >
              <Save size={15} />
              {saving
                ? "Saving…"
                : dirtyCount > 0
                  ? `Save ${dirtyCount} change${dirtyCount === 1 ? "" : "s"}`
                  : "Save"}
            </button>
          }
        />

        <ApiFeedback loading={loading} error={error} />
        {message ? (
          <div
            className="mb-3 rounded-lg border border-[rgba(95,125,93,.2)] bg-[rgba(95,125,93,.08)] px-3 py-2 text-xs text-[#4f704b]"
            role="status"
          >
            {message}
          </div>
        ) : null}

        <section className="mb-4 rounded-xl border border-[var(--border)] bg-white/60 p-4">
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 text-xs font-semibold text-[var(--text-soft)]">
              Room type
              <select
                className="min-h-10 rounded-lg border border-[var(--border)] bg-white px-3 text-sm"
                value={selectedRoom}
                onChange={(e) => setSelectedRoom(e.target.value)}
              >
                <option value="">Select a room type</option>
                {rooms.map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.name} ({r.totalUnits} unit{r.totalUnits === 1 ? "" : "s"})
                  </option>
                ))}
              </select>
            </label>

            {selectedRoomDoc ? (
              <span className="ml-auto text-xs text-[var(--text-soft)]">
                {units.length} of {selectedRoomDoc.totalUnits} rooms ·{" "}
                {activeCount} active · {maintenanceCount} maintenance ·{" "}
                {blockedCount} blocked
              </span>
            ) : null}
          </div>

          {selectedRoomDoc && units.length !== selectedRoomDoc.totalUnits ? (
            <p className="mt-3 rounded-lg border border-[#eed3cf] bg-[#fff8f7] px-3 py-2 text-xs text-[#914940]">
              Room count out of sync: <strong>{units.length}</strong> units exist but
              the room type says <strong>{selectedRoomDoc.totalUnits}</strong>. Edit
              the room type&apos;s <em>Total rooms</em> and save to sync.
            </p>
          ) : null}
        </section>

        {selectedRoom ? (
          <section className="overflow-hidden rounded-xl border border-[var(--border)] bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#f8f2e8] text-xs uppercase tracking-wide text-[var(--text-soft)]">
                <tr>
                  <th className="px-4 py-3">Room number</th>
                  <th className="px-4 py-3">Floor</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Notes</th>
                </tr>
              </thead>
              <tbody>
                {units.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-10 text-center text-xs text-[var(--text-soft)]"
                    >
                      No rooms for this type yet. Set <strong>Total rooms</strong>{" "}
                      on the room type and save to auto-generate units.
                    </td>
                  </tr>
                ) : null}
                {units.map((unit, index) => (
                  <tr
                    key={unit._id}
                    className={unit.dirty ? "bg-[#fff8ea]" : ""}
                  >
                    <td className="px-4 py-2">
                      <input
                        value={unit.number}
                        onChange={(e) =>
                          updateUnit(index, { number: e.target.value })
                        }
                        className="w-24 rounded border border-[var(--border)] px-2 py-1 text-sm"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        value={unit.floor}
                        onChange={(e) =>
                          updateUnit(index, { floor: e.target.value })
                        }
                        className="w-16 rounded border border-[var(--border)] px-2 py-1 text-sm"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <select
                        value={unit.status}
                        onChange={(e) =>
                          updateUnit(index, {
                            status: e.target.value as Status,
                          })
                        }
                        className="rounded border border-[var(--border)] px-2 py-1 text-sm"
                      >
                        <option value="active">Active</option>
                        <option value="maintenance">Maintenance</option>
                        <option value="blocked">Blocked</option>
                      </select>
                    </td>
                    <td className="px-4 py-2">
                      <input
                        value={unit.notes}
                        onChange={(e) =>
                          updateUnit(index, { notes: e.target.value })
                        }
                        className="w-full rounded border border-[var(--border)] px-2 py-1 text-sm"
                        placeholder="Optional"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ) : (
          <div className="flex min-h-[150px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-soft)] p-6 text-center text-[var(--text-soft)]">
            <BedDouble size={22} />
            <strong className="text-[var(--text)]">Choose a room type</strong>
            <span>
              Its numbered units are auto-generated from{" "}
              <strong>Total rooms</strong> on the room type.
            </span>
          </div>
        )}
      </div>
    </AccommodationPartnerLayout>
  );
}