import axios, { unwrap } from "../axios";

export interface RoomUnit {
  _id: string;
  number: string;
  floor: string | null;
  status: "active" | "maintenance" | "blocked";
  notes: string | null;
  roomType: string | { _id: string; name: string };
  property: string | { _id: string; name: string };
}

export interface BulkCreatePayload {
  roomTypeId: string;
  count: number;
  startNumber?: number;
  prefix?: string;
  floor?: string;
  status?: "active" | "maintenance" | "blocked";
}

export interface BulkUpdateItem {
  _id: string;
  number?: string;
  floor?: string | null;
  status?: "active" | "maintenance" | "blocked";
  notes?: string | null;
}

const roomUnitApi = {
  async list(params?: { roomType?: string; property?: string; status?: string }): Promise<RoomUnit[]> {
    const res = await axios.get("/accommodation/room-units", { params });
    return unwrap<RoomUnit[]>(res.data);
  },

  async bulkCreate(payload: BulkCreatePayload): Promise<{ created: number; units: RoomUnit[] }> {
    const res = await axios.post("/accommodation/room-units/bulk-create", payload);
    return unwrap<{ created: number; units: RoomUnit[] }>(res.data);
  },

  async bulkUpdate(updates: BulkUpdateItem[]): Promise<{ updated: number; failed: Array<{ _id: string; reason: string }> }> {
    const res = await axios.post("/accommodation/room-units/bulk-update", { updates });
    return unwrap<{ updated: number; failed: Array<{ _id: string; reason: string }> }>(res.data);
  },

  async remove(id: string): Promise<void> {
    await axios.delete(`/accommodation/room-units/${id}`);
  },
};

export default roomUnitApi;