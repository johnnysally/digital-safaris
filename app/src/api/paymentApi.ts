import axios, { unwrap, unwrapList } from "./axios";
import type {
  CustomerPayment,
  Paginated,
  ListParams,
  PaymentStatus,
} from "../types";

export interface InitiatePaymentPayload {
  method: "mpesa" | "stripe" | "wallet";
  amount: number;
  currency?: string;
  purpose: "booking" | "food_order" | "transport" | "topup" | "other";
  quoteId?: string;
  phone?: string;
}

export interface InitiateResponse {
  reference: string;
  status: "pending" | "success" | "failed";
  checkoutRequestId?: string;
  clientSecret?: string;
}

export interface PaymentStatusResponse {
  status: PaymentStatus;
  failureReason?: string | null;
}

export interface PaymentListParams extends ListParams {
  method?: "mpesa" | "stripe" | "wallet";
  purpose?: "booking" | "food_order" | "transport" | "topup" | "other";
}

const paymentApi = {
  async initiate(payload: InitiatePaymentPayload): Promise<InitiateResponse> {
    const res = await axios.post("/public/payment/initiate", payload);
    return unwrap<InitiateResponse>(res.data);
  },

  async status(reference: string): Promise<PaymentStatusResponse> {
    const res = await axios.get(`/public/payment/status/${reference}`);
    return unwrap<PaymentStatusResponse>(res.data);
  },

  async list(params?: PaymentListParams): Promise<Paginated<CustomerPayment>> {
    const res = await axios.get("/customer/payments", { params });
    return unwrapList<CustomerPayment>(res.data);
  },

  async details(id: string): Promise<CustomerPayment> {
    const res = await axios.get(`/customer/payments/${id}`);
    return unwrap<CustomerPayment>(res.data);
  },

  async retry(id: string, phone?: string): Promise<{ reference: string; checkoutRequestId?: string }> {
    const res = await axios.post(`/customer/payments/${id}/retry`, { phone });
    return unwrap<{ reference: string; checkoutRequestId?: string }>(res.data);
  },

  async confirm(id: string): Promise<CustomerPayment> {
    const res = await axios.post(`/customer/payments/${id}/confirm`);
    return unwrap<CustomerPayment>(res.data);
  },
};

export default paymentApi;