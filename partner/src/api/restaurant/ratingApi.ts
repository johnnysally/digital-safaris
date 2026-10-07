import axios, { unwrap, unwrapList } from "../axios";
import type {
  Rating,
  RatingSummary,
  Paginated,
  ListParams,
} from "../../types";

const ratingApi = {
  async list(params?: ListParams): Promise<Paginated<Rating>> {
    const res = await axios.get("/restaurant/ratings", { params });
    return unwrapList<Rating>(res.data);
  },

  async summary(): Promise<RatingSummary> {
    const res = await axios.get("/restaurant/ratings/summary");
    return unwrap<RatingSummary>(res.data);
  },

  async reply(id: string, message: string): Promise<Rating> {
    const res = await axios.post(`/restaurant/ratings/${id}/reply`, {
      message,
    });
    return unwrap<Rating>(res.data);
  },

  async refresh(): Promise<RatingSummary> {
    const res = await axios.post("/restaurant/ratings/refresh");
    return unwrap<RatingSummary>(res.data);
  },
};

export default ratingApi;