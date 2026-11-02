import axios, { unwrap, unwrapList } from "./axios";
import type {
  Payment,
  Commission,
  Payout,
  PayoutSettings,
  Paginated,
  ListParams,
} from "../types";

export interface PayoutRunResult {
  skipped: boolean;
  reason?: string;
  created: number;
  partners: Array<{
    partner: string;
    partnerType: string;
    payout: string;
    amount: number;
  }>;
}

const paymentApi = {
  async list(params?: ListParams): Promise<Paginated<Payment>> {
    const res = await axios.get("/admin/payments", { params });
    return unwrapList<Payment>(res.data);
  },

  async details(id: string): Promise<Payment> {
    const res = await axios.get(`/admin/payments/${id}`);
    const body = unwrap<{ payment: Payment } | Payment>(res.data);
    return "payment" in (body as object)
      ? (body as { payment: Payment }).payment
      : (body as Payment);
  },

  async commissions(params?: ListParams): Promise<Paginated<Commission>> {
    const res = await axios.get("/admin/commissions", { params });
    return unwrapList<Commission>(res.data);
  },

  async payouts(params?: ListParams): Promise<Paginated<Payout>> {
    const res = await axios.get("/admin/payouts", { params });
    return unwrapList<Payout>(res.data);
  },

  async payoutSettings(): Promise<PayoutSettings> {
    const res = await axios.get("/admin/payouts/settings");
    const body = unwrap<{ settings: PayoutSettings } | PayoutSettings>(
      res.data
    );
    return "settings" in (body as object)
      ? (body as { settings: PayoutSettings }).settings
      : (body as PayoutSettings);
  },

  async updatePayoutSettings(
    payload: Partial<PayoutSettings>
  ): Promise<PayoutSettings> {
    const res = await axios.post("/admin/payouts/settings", payload);
    const body = unwrap<{ settings: PayoutSettings } | PayoutSettings>(
      res.data
    );
    return "settings" in (body as object)
      ? (body as { settings: PayoutSettings }).settings
      : (body as PayoutSettings);
  },

  async approvePayout(id: string): Promise<Payout> {
    const res = await axios.post(`/admin/payouts/${id}/approve`);
    return unwrap<Payout>(res.data);
  },

  async rejectPayout(id: string, reason: string): Promise<Payout> {
    const res = await axios.post(`/admin/payouts/${id}/reject`, { reason });
    return unwrap<Payout>(res.data);
  },

  async runPayoutsNow(
    partnerType?: "restaurant" | "transport" | "accommodation"
  ): Promise<PayoutRunResult> {
    const res = await axios.post("/admin/payouts/run-now", {
      partnerType: partnerType || undefined,
    });
    return unwrap<PayoutRunResult>(res.data);
  },
};

export default paymentApi;