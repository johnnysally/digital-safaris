import axios, { unwrapList, unwrap } from "./axios";
import type {
  Restaurant,
  Accommodation,
  Property,
  Room,
  MenuItem,
  Location,
  Paginated,
  ListParams,
  SearchResponse,
} from "../types";

const searchApi = {
  async restaurants(params?: ListParams): Promise<Paginated<Restaurant>> {
    const res = await axios.get("/customer/search/restaurants", { params });
    return unwrapList<Restaurant>(res.data);
  },

  async accommodations(params?: ListParams): Promise<Paginated<Accommodation>> {
    const res = await axios.get("/customer/search/accommodations", { params });
    return unwrapList<Accommodation>(res.data);
  },

  async properties(params?: ListParams): Promise<Paginated<Property>> {
    const res = await axios.get("/customer/search/properties", { params });
    return unwrapList<Property>(res.data);
  },

  async rooms(params?: ListParams): Promise<Paginated<Room>> {
    const res = await axios.get("/customer/search/rooms", { params });
    return unwrapList<Room>(res.data);
  },

  async menuItems(params?: ListParams): Promise<Paginated<MenuItem>> {
    const res = await axios.get("/customer/search/menu-items", { params });
    return unwrapList<MenuItem>(res.data);
  },

  async locations(params?: ListParams): Promise<Location[]> {
    const res = await axios.get("/customer/search/locations", { params });
    return unwrap<Location[]>(res.data);
  },

  async global(params: { q: string; town?: string }): Promise<SearchResponse> {
    const res = await axios.get("/customer/search/global", { params });
    return unwrap<SearchResponse>(res.data);
  },
};

export default searchApi;