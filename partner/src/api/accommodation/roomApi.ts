import axios, { unwrap } from "../axios";
import uploadApi from "./uploadApi";
import type { Room } from "../../types";

export const MAX_ROOM_PHOTOS = 5;

export interface RoomCreatePayload {
  property: string;
  name: string;
  description?: string;
  type: Room["type"];
  capacity: number;
  beds: Array<{ type: Room["beds"][number]["type"]; count: number }>;
  sizeSqm?: number | null;
  images?: string[];
  amenities?: string[];
  basePrice: number;
  weekendPrice?: number | null;
  seasonalPrices?: Array<{
    name: string;
    from: string;
    to: string;
    price: number;
  }>;
  totalUnits: number;
  status?: "active" | "inactive" | "suspended";
  isFeatured?: boolean;
}

const roomApi = {
  async uploadImage(
    file: File,
  ): Promise<{ url: string; publicId?: string }> {
    return uploadApi.uploadImage(file, "accommodation/rooms");
  },

  async uploadImageToRoom(
    roomId: string,
    file: File,
  ): Promise<{ url: string; images: string[] }> {
    const form = new FormData();
    form.append("file", file);
    const res = await axios.post(
      `/accommodation/rooms/${roomId}/images`,
      form,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return unwrap<{ url: string; images: string[] }>(res.data);
  },

  async removeImageFromRoom(
    roomId: string,
    url: string,
  ): Promise<{ images: string[] }> {
    const res = await axios.delete(
      `/accommodation/rooms/${roomId}/images`,
      { data: { url } },
    );
    return unwrap<{ images: string[] }>(res.data);
  },

  async list(params?: {
    property?: string;
    status?: string;
  }): Promise<Room[]> {
    const res = await axios.get("/accommodation/rooms", { params });
    return unwrap<Room[]>(res.data);
  },

  async details(id: string): Promise<Room> {
    const res = await axios.get(`/accommodation/rooms/${id}`);
    return unwrap<Room>(res.data);
  },

  async create(payload: RoomCreatePayload): Promise<Room> {
    if (
      Array.isArray(payload.images) &&
      payload.images.length > MAX_ROOM_PHOTOS
    ) {
      throw new Error(`A room can have at most ${MAX_ROOM_PHOTOS} photos.`);
    }
    const res = await axios.post("/accommodation/rooms", payload);
    return unwrap<Room>(res.data);
  },

  async update(
    id: string,
    payload: Partial<RoomCreatePayload>,
  ): Promise<Room> {
    if (
      Array.isArray(payload.images) &&
      payload.images.length > MAX_ROOM_PHOTOS
    ) {
      throw new Error(`A room can have at most ${MAX_ROOM_PHOTOS} photos.`);
    }
    const res = await axios.patch(`/accommodation/rooms/${id}`, payload);
    return unwrap<Room>(res.data);
  },

  async remove(id: string): Promise<void> {
    await axios.delete(`/accommodation/rooms/${id}`);
  },
};

export default roomApi;