import axios, { unwrap, unwrapList } from "../axios";
import type {
  Wallet,
  Payout,
  Paginated,
  ListParams,
} from "../../types";

const walletApi = {
  async get(): Promise<Wallet> {
    const res = await axios.get("/restaurant/wallet");
    return unwrap<Wallet>(res.data);
  },

  async transactions(params?: ListParams): Promise<Paginated<Payout>> {
    const res = await axios.get("/restaurant/wallet/transactions", {
      params,
    });
    return unwrapList<Payout>(res.data);
  },

  async updatePayoutDetails(payload: Partial<Wallet>): Promise<Wallet> {
    const res = await axios.post(
      "/restaurant/wallet/payout-details",
      payload
    );
    return unwrap<Wallet>(res.data);
  },
};

export default walletApi;