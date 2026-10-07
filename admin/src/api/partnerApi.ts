import axios, { unwrap, unwrapList } from "./axios";
import type {
  Partner,
  PartnerDetails,
  PartnerType,
  Paginated,
  ListParams,
} from "../types";

interface DetailPayload {
  partner: PartnerDetails;
  wallet?: unknown;
}

const ALLOWED_TYPES: PartnerType[] = [
  "accommodation",
  "restaurant",
  "transport",
];

function normalizeType(type: PartnerType | string): PartnerType {
  return ALLOWED_TYPES.includes(type as PartnerType)
    ? (type as PartnerType)
    : "accommodation";
}

const partnerApi = {
  async list(
    type: PartnerType,
    params?: ListParams
  ): Promise<Paginated<Partner>> {
    const safe = normalizeType(type);
    const res = await axios.get(`/admin/partners/${safe}`, { params });
    return unwrapList<Partner>(res.data);
  },

  async details(type: PartnerType, id: string): Promise<PartnerDetails> {
    const safe = normalizeType(type);
    const res = await axios.get(`/admin/partners/${safe}/${id}`);
    const body = unwrap<DetailPayload | PartnerDetails>(res.data);
    return "partner" in (body as object)
      ? (body as DetailPayload).partner
      : (body as PartnerDetails);
  },

  async approve(type: PartnerType, id: string): Promise<Partner> {
    const safe = normalizeType(type);
    const res = await axios.post(`/admin/partners/${safe}/${id}/approve`);
    return unwrap<Partner>(res.data);
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
    return unwrap<Partner>(res.data);
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
    return unwrap<Partner>(res.data);
  },

  async reactivate(type: PartnerType, id: string): Promise<Partner> {
    const safe = normalizeType(type);
    const res = await axios.post(`/admin/partners/${safe}/${id}/reactivate`);
    return unwrap<Partner>(res.data);
  },

  async hardDelete(type: PartnerType, id: string): Promise<void> {
    const safe = normalizeType(type);
    await axios.delete(`/admin/partners/${safe}/${id}/hard`);
  },
};

export default partnerApi;