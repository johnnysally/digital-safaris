import axios, { unwrap, unwrapList } from "./axios";
import type {
  Booking,
  Order,
  Trip,
  Broadcast,
  Paginated,
  ListParams,
} from "../types";

function single<T>(body: unknown, key: string): T {
  const b = unwrap<Record<string, unknown> | T>(body);
  if (b && typeof b === "object" && key in (b as Record<string, unknown>)) {
    return (b as Record<string, unknown>)[key] as T;
  }
  return b as T;
}

const operationApi = {
  async bookings(params?: ListParams): Promise<Paginated<Booking>> {
    const res = await axios.get("/admin/operations/bookings", { params });
    return unwrapList<Booking>(res.data);
  },

  async bookingDetails(id: string): Promise<Booking> {
    const res = await axios.get(`/admin/operations/bookings/${id}`);
    return single<Booking>(res.data, "booking");
  },

  async orders(params?: ListParams): Promise<Paginated<Order>> {
    const res = await axios.get("/admin/operations/orders", { params });
    return unwrapList<Order>(res.data);
  },

  async orderDetails(id: string): Promise<Order> {
    const res = await axios.get(`/admin/operations/orders/${id}`);
    return single<Order>(res.data, "order");
  },

  async trips(params?: ListParams): Promise<Paginated<Trip>> {
    const res = await axios.get("/admin/operations/trips", { params });
    return unwrapList<Trip>(res.data);
  },

  async tripDetails(id: string): Promise<Trip> {
    const res = await axios.get(`/admin/operations/trips/${id}`);
    return single<Trip>(res.data, "trip");
  },

  async broadcasts(params?: ListParams): Promise<Paginated<Broadcast>> {
    const res = await axios.get("/admin/operations/broadcasts", { params });
    return unwrapList<Broadcast>(res.data);
  },

  async broadcastDetails(id: string): Promise<Broadcast> {
    const res = await axios.get(`/admin/operations/broadcasts/${id}`);
    return single<Broadcast>(res.data, "broadcast");
  },
};

export default operationApi;