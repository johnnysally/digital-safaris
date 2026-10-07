import axios, { unwrap, unwrapList } from "./axios";
import type {
  Customer,
  CustomerDetails,
  Paginated,
  ListParams,
} from "../types";

const customerApi = {
  async list(params?: ListParams): Promise<Paginated<Customer>> {
    const res = await axios.get("/admin/customers", { params });
    return unwrapList<Customer>(res.data);
  },

  async details(id: string): Promise<CustomerDetails> {
    const res = await axios.get(`/admin/customers/${id}`);
    const body = unwrap<{ customer: CustomerDetails } | CustomerDetails>(
      res.data
    );
    return "customer" in (body as object)
      ? (body as { customer: CustomerDetails }).customer
      : (body as CustomerDetails);
  },

  async suspend(id: string, reason?: string): Promise<Customer> {
    const res = await axios.post(`/admin/customers/${id}/suspend`, { reason });
    return unwrap<Customer>(res.data);
  },

  async reactivate(id: string): Promise<Customer> {
    const res = await axios.post(`/admin/customers/${id}/reactivate`);
    return unwrap<Customer>(res.data);
  },

  async hardDelete(id: string): Promise<void> {
    await axios.delete(`/admin/customers/${id}/hard`);
  },
};

export default customerApi;