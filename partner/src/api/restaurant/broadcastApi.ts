import axios, { unwrap, unwrapList } from "../axios";
import type {
  BroadcastRequest,
  FoodOrder,
  Paginated,
  ListParams,
} from "../../types";

const broadcastApi = {
  async list(params?: ListParams): Promise<Paginated<BroadcastRequest>> {
    const res = await axios.get("/restaurant/broadcasts", { params });
    return unwrapList<BroadcastRequest>(res.data);
  },

  async details(id: string): Promise<BroadcastRequest> {
    const res = await axios.get(`/restaurant/broadcasts/${id}`);
    return unwrap<BroadcastRequest>(res.data);
  },

  async accept(
    id: string
  ): Promise<{ request: BroadcastRequest; order: FoodOrder }> {
    const res = await axios.post(`/restaurant/broadcasts/${id}/accept`);
    return unwrap<{ request: BroadcastRequest; order: FoodOrder }>(res.data);
  },
};

export default broadcastApi;