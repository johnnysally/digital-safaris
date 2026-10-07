import axios, { unwrap, unwrapList } from "./axios";
import type {
  Dispute,
  DisputeDetails,
  Paginated,
  ListParams,
} from "../types";

interface ResolveDisputePayload {
  resolution: string;
  outcome?: string;
}

const disputeApi = {
  async list(params?: ListParams): Promise<Paginated<Dispute>> {
    const res = await axios.get("/admin/disputes", { params });
    return unwrapList<Dispute>(res.data);
  },

  async details(id: string): Promise<DisputeDetails> {
    const res = await axios.get(`/admin/disputes/${id}`);
    const body = unwrap<{ dispute: DisputeDetails } | DisputeDetails>(
      res.data
    );
    return "dispute" in (body as object)
      ? (body as { dispute: DisputeDetails }).dispute
      : (body as DisputeDetails);
  },

  async assign(id: string, adminId: string): Promise<Dispute> {
    const res = await axios.post(`/admin/disputes/${id}/assign`, { adminId });
    return unwrap<Dispute>(res.data);
  },

  async resolve(id: string, payload: ResolveDisputePayload): Promise<Dispute> {
    const res = await axios.post(`/admin/disputes/${id}/resolve`, payload);
    return unwrap<Dispute>(res.data);
  },

  async reject(id: string, reason: string): Promise<Dispute> {
    const res = await axios.post(`/admin/disputes/${id}/reject`, { reason });
    return unwrap<Dispute>(res.data);
  },
};

export default disputeApi;