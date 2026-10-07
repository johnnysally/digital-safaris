import axios, { unwrap, unwrapList } from "./axios";
import type { CustomerPayment, Paginated, ListParams } from "../types";

const paymentApi = {
  async list(params?: ListParams): Promise<Paginated<CustomerPayment>> {
    const res = await axios.get("/customer/payments", { params });
    return unwrapList<CustomerPayment>(res.data);
  },

  async details(id: string): Promise<CustomerPayment> {
    const res = await axios.get(`/customer/payments/${id}`);
    return unwrap<CustomerPayment>(res.data);
  },

  async retry(id: string, payload?: { phone?: string }): Promise<{
    reference: string;
    checkoutRequestId: string;
  }> {
    const res = await axios.post(`/customer/payments/${id}/retry`, payload || {});
    return unwrap(res.data);
  },

  async confirm(id: string): Promise<CustomerPayment> {
    const res = await axios.post(`/customer/payments/${id}/confirm`);
    return unwrap<CustomerPayment>(res.data);
  },
};

export default paymentApi;