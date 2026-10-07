import axios, { unwrap } from "./axios";
import type { Location, LocationType } from "../types";

interface ListParams {
  type?: LocationType;
  search?: string;
  isOperational?: "true" | "false";
  parent?: string;
}

interface CreatePayload {
  name: string;
  type: LocationType;
  parent?: string | null;
  countryCode: string;
  county?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  radiusKm?: number;
  timezone?: string;
  currency?: string;
  isOperational?: boolean;
  isDefault?: boolean;
}

const locationApi = {
  async list(params?: ListParams): Promise<Location[]> {
    const res = await axios.get("/admin/locations", { params });
    const body = unwrap<Location[] | { items: Location[] }>(res.data);
    if (Array.isArray(body)) return body;
    return (body as { items: Location[] }).items ?? [];
  },

  async details(id: string): Promise<{ location: Location; children: Location[] }> {
    const res = await axios.get(`/admin/locations/${id}`);
    return unwrap<{ location: Location; children: Location[] }>(res.data);
  },

  async create(payload: CreatePayload): Promise<Location> {
    const res = await axios.post("/admin/locations", payload);
    return unwrap<Location>(res.data);
  },

  async update(id: string, payload: Partial<CreatePayload>): Promise<Location> {
    const res = await axios.patch(`/admin/locations/${id}`, payload);
    return unwrap<Location>(res.data);
  },

  async remove(id: string): Promise<void> {
    await axios.delete(`/admin/locations/${id}`);
  },

  async toggleOperational(
    id: string
  ): Promise<{ isOperational: boolean }> {
    const res = await axios.post(`/admin/locations/${id}/toggle-operational`);
    return unwrap<{ isOperational: boolean }>(res.data);
  },
};

export default locationApi;