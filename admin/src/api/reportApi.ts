import axios, { unwrap } from "./axios";
import type {
  RevenueReport,
  PayoutReport,
  PaymentReport,
  ListParams,
} from "../types";

function report<T>(body: unknown, key: string): T {
  const b = unwrap<Record<string, unknown> | T>(body);
  if (b && typeof b === "object" && key in (b as Record<string, unknown>)) {
    return (b as Record<string, unknown>)[key] as T;
  }
  return b as T;
}

const reportApi = {
  async revenue(params?: ListParams): Promise<RevenueReport> {
    const res = await axios.get("/admin/reports/revenue", { params });
    return report<RevenueReport>(res.data, "report");
  },

  async payouts(params?: ListParams): Promise<PayoutReport> {
    const res = await axios.get("/admin/reports/payouts", { params });
    return report<PayoutReport>(res.data, "report");
  },

  async payments(params?: ListParams): Promise<PaymentReport> {
    const res = await axios.get("/admin/reports/payments", { params });
    return report<PaymentReport>(res.data, "report");
  },
};

export default reportApi;