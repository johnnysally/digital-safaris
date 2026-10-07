import axios, { unwrap } from "../axios";
import type { Property, Room } from "../../types";

const propertyApi = {
  async list(params?: { status?: string }): Promise<Property[]> {
    const res = await axios.get("/accommodation/properties", { params });
    return unwrap<Property[]>(res.data);
  },

  async details(
    id: string
  ): Promise<{ property: Property; rooms: Room[] }> {
    const res = await axios.get(`/accommodation/properties/${id}`);
    return unwrap<{ property: Property; rooms: Room[] }>(res.data);
  },

  async create(payload: Partial<Property>): Promise<Property> {
    const res = await axios.post("/accommodation/properties", payload);
    return unwrap<Property>(res.data);
  },

  async update(
    id: string,
    payload: Partial<Property>
  ): Promise<Property> {
    const res = await axios.patch(
      `/accommodation/properties/${id}`,
      payload
    );
    return unwrap<Property>(res.data);
  },

  async remove(id: string): Promise<void> {
    await axios.delete(`/accommodation/properties/${id}`);
  },
};

export default propertyApi;