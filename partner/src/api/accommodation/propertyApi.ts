import axios, { unwrap } from "../axios";
import uploadApi from "./uploadApi";
import type { Property, Room } from "../../types";

export interface PropertyLocation {
  _id: string;
  name: string;
  county?: string | null;
  countryCode: string;
  latitude?: number | null;
  longitude?: number | null;
}

export interface PropertyCreatePayload {
  name: string;
  type: string;
  location: string;
  town: string;
  address: string;
  latitude: number;
  longitude: number;
  description?: string;
  images?: string[];
  amenities?: string[];
  rules?: string[];
  checkInTime?: string;
  checkOutTime?: string;
  totalRooms?: number;
  status?: "active" | "inactive" | "suspended";
  isFeatured?: boolean;
}

const propertyApi = {
  async uploadImage(
    file: File,
  ): Promise<{ url: string; publicId?: string }> {
    return uploadApi.uploadImage(file, "accommodation/properties");
  },

  async uploadImageToProperty(
    propertyId: string,
    file: File,
  ): Promise<{ url: string; images: string[] }> {
    const form = new FormData();
    form.append("file", file);
    const res = await axios.post(
      `/accommodation/properties/${propertyId}/images`,
      form,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return unwrap<{ url: string; images: string[] }>(res.data);
  },

  async removeImageFromProperty(
    propertyId: string,
    url: string,
  ): Promise<{ images: string[] }> {
    const res = await axios.delete(
      `/accommodation/properties/${propertyId}/images`,
      { data: { url } },
    );
    return unwrap<{ images: string[] }>(res.data);
  },

  async locations(params?: { q?: string }): Promise<PropertyLocation[]> {
    const res = await axios.get("/public/search/locations", {
      params: { ...params, isOperational: true },
    });
    return unwrap<PropertyLocation[]>(res.data);
  },

  async list(params?: { status?: string }): Promise<Property[]> {
    const res = await axios.get("/accommodation/properties", { params });
    return unwrap<Property[]>(res.data);
  },

  async details(id: string): Promise<{ property: Property; rooms: Room[] }> {
    const res = await axios.get(`/accommodation/properties/${id}`);
    return unwrap<{ property: Property; rooms: Room[] }>(res.data);
  },

  async create(payload: PropertyCreatePayload): Promise<Property> {
    const res = await axios.post("/accommodation/properties", payload);
    return unwrap<Property>(res.data);
  },

  async update(
    id: string,
    payload: Partial<PropertyCreatePayload>,
  ): Promise<Property> {
    const res = await axios.patch(`/accommodation/properties/${id}`, payload);
    return unwrap<Property>(res.data);
  },

  async remove(id: string): Promise<void> {
    await axios.delete(`/accommodation/properties/${id}`);
  },
};

export default propertyApi;