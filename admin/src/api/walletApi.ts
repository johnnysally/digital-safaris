import axios, { unwrap, unwrapList } from "./axios";
import type {
  Wallet,
  WalletTransaction,
  PartnerType,
  Paginated,
  ListParams,
} from "../types";

const walletApi = {
  async list(params?: ListParams): Promise<Paginated<Wallet>> {
    const res = await axios.get("/admin/wallets", { params });
    return unwrapList<Wallet>(res.data);
  },

  async details(type: PartnerType, id: string): Promise<Wallet> {
    const res = await axios.get(`/admin/wallets/${type}/${id}`);
    const body = unwrap<{ wallet: Wallet } | Wallet>(res.data);
    return "wallet" in (body as object)
      ? (body as { wallet: Wallet }).wallet
      : (body as Wallet);
  },

  async transactions(
    type: PartnerType,
    id: string,
    params?: ListParams
  ): Promise<Paginated<WalletTransaction>> {
    const res = await axios.get(
      `/admin/wallets/${type}/${id}/transactions`,
      { params }
    );
    return unwrapList<WalletTransaction>(res.data);
  },
};

export default walletApi;