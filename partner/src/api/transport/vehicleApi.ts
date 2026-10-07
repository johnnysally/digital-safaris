import axios, { unwrap } from "../axios";
import type { Vehicle } from "../../types";

const vehicleApi = {
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