import axios, { unwrap, unwrapList } from "../axios";
import type { Trip, Paginated, ListParams } from "../../types";

const tripApi = {
  async list(params?: ListParams): Promise<Paginated<Trip>> {
    const res = await axios.get("/transport/trips", { params });
    return unwrapList<Trip>(res.data);
  },

  async details(id: string): Promise<Trip> {
    const res = await axios.get(`/transport/trips/${id}`);
    return unwrap<Trip>(res.data);
  },

  async start(id: string): Promise<Trip> {
    const res = await axios.post(`/transport/trips/${id}/start`);
    return unwrap<Trip>(res.data);
  },

  async complete(id: string): Promise<Trip> {
    const res = await axios.post(`/transport/trips/${id}/complete`);
    return unwrap<Trip>(res.data);
  },

  async cancel(id: string, reason: string): Promise<Trip> {
    const res = await axios.post(`/transport/trips/${id}/cancel`, {
      reason,
    });
    return unwrap<Trip>(res.data);
  },
};

export default tripApi;