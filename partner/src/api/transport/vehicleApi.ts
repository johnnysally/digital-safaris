import axios, { unwrap } from "../axios";
import type { Vehicle } from "../../types";

const vehicleApi = {
  async uploadPhoto(file: File): Promise<{ url: string; publicId?: string }> {
    const form = new FormData();
    form.append("file", file);
    form.append("folder", "transport/vehicles");
    const res = await axios.post("/public/upload/single", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return unwrap<{ url: string; publicId?: string }>(res.data);
  },

  async list(params?: { status?: string }): Promise<Vehicle[]> {
    const res = await axios.get("/transport/vehicles", { params });
    return unwrap<Vehicle[]>(res.data);
  },

  async details(id: string): Promise<Vehicle> {
    const res = await axios.get(`/transport/vehicles/${id}`);
    return unwrap<Vehicle>(res.data);
  },

  async create(payload: Partial<Vehicle>): Promise<Vehicle> {
    const res = await axios.post("/transport/vehicles", payload);
    return unwrap<Vehicle>(res.data);
  },

  async update(id: string, payload: Partial<Vehicle>): Promise<Vehicle> {
    const res = await axios.patch(`/transport/vehicles/${id}`, payload);
    return unwrap<Vehicle>(res.data);
  },

  async remove(id: string): Promise<void> {
    await axios.delete(`/transport/vehicles/${id}`);
  },

  async setDefault(id: string): Promise<Vehicle> {
    const res = await axios.post(`/transport/vehicles/${id}/default`);
    return unwrap<Vehicle>(res.data);
  },
};

export default vehicleApi;