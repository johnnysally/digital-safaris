import axios, { unwrap, unwrapList } from "./axios";
import type { Trip, TripQuoteResponse, Paginated, ListParams } from "../types";

const tripApi = {
  async quote(payload: {
    pickup: { latitude: number; longitude: number; town: string };
    dropoff: { latitude: number; longitude: number; town: string };
    serviceType?: string;
  }): Promise<TripQuoteResponse> {
    const res = await axios.post("/customer/trips/quote", payload);
    return unwrap<TripQuoteResponse>(res.data);
  },

  async create(payload: Record<string, unknown>): Promise<Trip> {
    const res = await axios.post("/customer/trips", payload);
    return unwrap<Trip>(res.data);
  },

  async list(params?: ListParams): Promise<Paginated<Trip>> {
    const res = await axios.get("/customer/trips", { params });
    return unwrapList<Trip>(res.data);
  },

  async details(id: string): Promise<Trip> {
    const res = await axios.get(`/customer/trips/${id}`);
    return unwrap<Trip>(res.data);
  },

  async cancel(id: string, reason?: string): Promise<Trip> {
    const res = await axios.post(`/customer/trips/${id}/cancel`, { reason });
    return unwrap<Trip>(res.data);
  },

  async rate(id: string, payload: { rating: number; review?: string }): Promise<Trip> {
    const res = await axios.post(`/customer/trips/${id}/rate`, payload);
    return unwrap<Trip>(res.data);
  },
};

export default tripApi;