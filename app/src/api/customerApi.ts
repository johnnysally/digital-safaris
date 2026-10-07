import axios, { unwrap } from "./axios";
import type { Customer, CustomerProfile, CustomerPreferences } from "../types";

const customerApi = {
  async profile(): Promise<{
    customer: Customer;
    profile?: CustomerProfile;
    preference?: CustomerPreferences;
  }> {
    const res = await axios.get("/customer/profile");
    return unwrap(res.data);
  },

  async updateProfile(payload: Partial<Customer>): Promise<Customer> {
    const res = await axios.patch("/customer/profile", payload);
    return unwrap<Customer>(res.data);
  },

  async updateDetails(payload: Partial<CustomerProfile>): Promise<CustomerProfile> {
    const res = await axios.patch("/customer/profile/details", payload);
    return unwrap<CustomerProfile>(res.data);
  },

  async updatePreferences(
    payload: Partial<CustomerPreferences>
  ): Promise<CustomerPreferences> {
    const res = await axios.patch("/customer/profile/preferences", payload);
    return unwrap<CustomerPreferences>(res.data);
  },
};

export default customerApi;