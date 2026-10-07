import axios, { unwrap } from "./axios";
import type {
  TrackTripResponse,
  TrackDeliveryResponse,
  TrackBookingResponse,
} from "../types";

const trackingApi = {
  async trip(reference: string): Promise<TrackTripResponse> {
    const res = await axios.get(`/customer/tracking/trip/${reference}`);
    return unwrap<TrackTripResponse>(res.data);
  },

  async delivery(reference: string): Promise<TrackDeliveryResponse> {
    const res = await axios.get(`/customer/tracking/delivery/${reference}`);
    return unwrap<TrackDeliveryResponse>(res.data);
  },

  async booking(reference: string): Promise<TrackBookingResponse> {
    const res = await axios.get(`/customer/tracking/booking/${reference}`);
    return unwrap<TrackBookingResponse>(res.data);
  },
};

export default trackingApi;