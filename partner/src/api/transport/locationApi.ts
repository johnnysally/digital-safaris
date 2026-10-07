import axios, { unwrap } from "../axios";
import type { DriverLocation } from "../../types";

const locationApi = {
  async get(): Promise<DriverLocation> {
    const res = await axios.get("/transport/location");
    return unwrap<DriverLocation>(res.data);
  },

  async ping(payload: {
    latitude: number;
    longitude: number;
    heading?: number;
    speed?: number;
    accuracy?: number;
  }): Promise<DriverLocation> {
    const res = await axios.post("/transport/location/ping", payload);
    return unwrap<DriverLocation>(res.data);
  },

  async setAvailability(
    isAvailable: boolean
  ): Promise<{ isAvailable: boolean }> {
    const res = await axios.post("/transport/location/availability", {
      isAvailable,
    });
    return unwrap<{ isAvailable: boolean }>(res.data);
  },
};

export default locationApi;