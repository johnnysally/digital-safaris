import axios, { unwrap, unwrapList } from "./axios";
import type {
  Partner,
  PartnerDetails,
  PartnerType,
  Paginated,
  ListParams,
  ISODate,
  PaymentMethodName,
} from "../types";

interface RawWallet {
  _id?: string;
  balance?: number;
  totalEarned?: number;
  totalCommissionOwed?: number;
  commissionOwed?: number;
  totalPaidOut?: number;
  lastPayoutAt?: ISODate | null;
  payoutMethod?: PaymentMethodName;
  payoutDetails?: {
    phone?: string | null;
    bankName?: string | null;
    accountNumber?: string | null;
    accountName?: string | null;
  };
}

interface DetailPayload {
  partner: Partner & Record<string, unknown>;
  wallet?: RawWallet | null;
}

const ALLOWED_TYPES: PartnerType[] = [
  "accommodation",
  "restaurant",
  "transport",
];

const TYPE_ALIASES: Record<string, PartnerType> = {
  accommodation: "accommodation",
  hotel: "accommodation",
  lodge: "accommodation",
  camp: "accommodation",
  resort: "accommodation",
  bnb: "accommodation",
  guesthouse: "accommodation",
  villa: "accommodation",
  apartment: "accommodation",
  restaurant: "restaurant",
  food: "restaurant",
  transport: "transport",
  transport_partner: "transport",
};

function normalizeType(type: PartnerType | string): PartnerType {
  const key = String(type || "").toLowerCase();
  if (TYPE_ALIASES[key]) return TYPE_ALIASES[key];
  if (ALLOWED_TYPES.includes(key as PartnerType)) return key as PartnerType;
  return "accommodation";
}

function mapWallet(
  raw: RawWallet | null | undefined
): PartnerDetails["wallet"] | undefined {
  if (!raw) return undefined;
  return {
    walletId: raw._id,
    balance: raw.balance ?? 0,
    totalEarned: raw.totalEarned ?? 0,
    commissionOwed: raw.totalCommissionOwed ?? raw.commissionOwed ?? 0,
    lastPayoutAt: raw.lastPayoutAt ?? undefined,
    lastPayoutAmount: raw.totalPaidOut ?? undefined,
  };
}

function mapPayout(
  raw: RawWallet | null | undefined
): PartnerDetails["payout"] | undefined {
  if (!raw) return undefined;
  const details = raw.payoutDetails || {};
  const hasAny =
    raw.payoutMethod ||
    details.phone ||
    details.bankName ||
    details.accountNumber ||
    details.accountName;
  if (!hasAny) return undefined;
  return {
    method: raw.payoutMethod,
    accountName: details.accountName ?? undefined,
    accountNumber: details.accountNumber ?? undefined,
    bankName: details.bankName ?? undefined,
    mpesaNumber: details.phone ?? undefined,
  };
}

const partnerApi = {
  async list(
    type: PartnerType,
    params?: ListParams
  ): Promise<Paginated<Partner>> {
    const safe = normalizeType(type);
    const res = await axios.get(`/admin/partners/${safe}`, { params });
    const page = unwrapList<Partner>(res.data);
    const data = (page.data ?? []).map((p) => ({
      ...p,
      type: p.type ?? safe,
      category: p.category ?? p.type ?? safe,
    }));
    return { data, meta: page.meta };
  },

  async details(type: PartnerType, id: string): Promise<PartnerDetails> {
    const safe = normalizeType(type);
    const res = await axios.get(`/admin/partners/${safe}/${id}`);
    const body = unwrap<DetailPayload | (Partner & Record<string, unknown>)>(
      res.data
    );

    if (body && typeof body === "object" && "partner" in body) {
      const payload = body as DetailPayload;
      const partner = payload.partner as Partner & Record<string, unknown>;
      return {
        ...(partner as PartnerDetails),
        type: (partner.type as PartnerType) ?? safe,
        category: (partner.category as PartnerType) ?? safe,
        wallet: mapWallet(payload.wallet),
        payout: mapPayout(payload.wallet),
      };
    }

    const partner = body as Partner & Record<string, unknown>;
    return {
      ...(partner as PartnerDetails),
      type: (partner.type as PartnerType) ?? safe,
      category: (partner.category as PartnerType) ?? safe,
    };
  },

  async approve(type: PartnerType, id: string): Promise<Partner> {
    const safe = normalizeType(type);
    const res = await axios.post(`/admin/partners/${safe}/${id}/approve`);
    const p = unwrap<Partner>(res.data);
    return {
      ...p,
      type: p.type ?? safe,
      category: p.category ?? p.type ?? safe,
    };
  },

  async reject(
    type: PartnerType,
    id: string,
    reason: string
  ): Promise<Partner> {
    const safe = normalizeType(type);
    const res = await axios.post(`/admin/partners/${safe}/${id}/reject`, {
      reason,
    });
    const p = unwrap<Partner>(res.data);
    return {
      ...p,
      type: p.type ?? safe,
      category: p.category ?? p.type ?? safe,
    };
  },

  async suspend(
    type: PartnerType,
    id: string,
    reason: string
  ): Promise<Partner> {
    const safe = normalizeType(type);
    const res = await axios.post(`/admin/partners/${safe}/${id}/suspend`, {
      reason,
    });
    const p = unwrap<Partner>(res.data);
    return {
      ...p,
      type: p.type ?? safe,
      category: p.category ?? p.type ?? safe,
    };
  },

  async reactivate(type: PartnerType, id: string): Promise<Partner> {
    const safe = normalizeType(type);
    const res = await axios.post(`/admin/partners/${safe}/${id}/reactivate`);
    const p = unwrap<Partner>(res.data);
    return {
      ...p,
      type: p.type ?? safe,
      category: p.category ?? p.type ?? safe,
    };
  },

  async hardDelete(type: PartnerType, id: string): Promise<void> {
    const safe = normalizeType(type);
    await axios.delete(`/admin/partners/${safe}/${id}/hard`);
  },
};

export default partnerApi;