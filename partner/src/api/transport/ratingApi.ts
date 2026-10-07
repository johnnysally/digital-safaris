import axios, { unwrap, unwrapList } from "../axios";
import type {
  Rating,
  RatingSummary,
  Paginated,
  ListParams,
} from "../../types";

const ratingApi = {
  async list(params?: ListParams): Promise<Paginated<Rating>> {
    const res = await axios.get("/transport/ratings", { params });
    return unwrapList<Rating>(res.data);
  },

  async summary(): Promise<RatingSummary> {
    const res = await axios.get("/transport/ratings/summary");
    return unwrap<RatingSummary>(res.data);
  },

  async refresh(): Promise<RatingSummary> {
    const res = await axios.post("/transport/ratings/refresh");
    return unwrap<RatingSummary>(res.data);
  },
};

export default ratingApi;