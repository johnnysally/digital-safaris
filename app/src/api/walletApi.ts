import axios, { unwrap } from "./axios";
import type { CustomerWallet, TopUpResponse, ConfirmTopUpResponse } from "../types";

const walletApi = {
  async get(): Promise<CustomerWallet> {
    const res = await axios.get("/customer/wallet");
    return unwrap<CustomerWallet>(res.data);
  },

  async topUp(payload: { amount: number; phone: string }): Promise<TopUpResponse> {
    const res = await axios.post("/customer/wallet/top-up", payload);
    return unwrap<TopUpResponse>(res.data);
  },

  async confirmTopUp(payload: { reference: string }): Promise<ConfirmTopUpResponse> {
    const res = await axios.post("/customer/wallet/top-up/confirm", payload);
    return unwrap<ConfirmTopUpResponse>(res.data);
  },
};

export default walletApi;