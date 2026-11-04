import axiosClient from "./axios";

interface ListParams {
  page?: number;
  limit?: number;
  search?: string;
  q?: string;
  town?: string;
  cuisine?: string;
  type?: string;
}

interface BackendList<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
}

interface BackendEnvelope<T> {
  statusCode: number;
  data: T;
  message: string;
  success: boolean;
}

function unwrapList<T>(body: unknown): {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
} {
  const envelope = body as BackendEnvelope<BackendList<T>> | undefined;
  const inner = (envelope?.data ?? body) as BackendList<T>;
  const items = Array.isArray(inner?.items) ? inner.items : [];
  return {
    data: items,
    meta: {
      total: typeof inner?.total === "number" ? inner.total : items.length,
      page: typeof inner?.page === "number" ? inner.page : 1,
      limit: typeof inner?.limit === "number" ? inner.limit : items.length,
      totalPages:
        typeof inner?.totalPages === "number"
          ? inner.totalPages
          : Math.max(1, Math.ceil((inner?.total ?? items.length) / (inner?.limit || 20))),
    },
  };
}

export interface WebRestaurant {
  _id: string;
  name: string;
  slug: string;
  logo?: string | null;
  coverImage?: string | null;
  description?: string;
  cuisineTypes?: string[];
  town: string;
  rating: number;
  totalRatings: number;
  status?: string;
  isOpen?: boolean;
  isAcceptingOrders?: boolean;
}

export interface WebProperty {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  type: string;
  town: string;
  address?: string;
  images?: string[];
  coverImage?: string | null;
  rating: number;
  totalRatings: number;
  minPrice?: number | null;
  maxPrice?: number | null;
  currency?: string;
  roomTypes?: number;
  partner?: {
    _id: string;
    name: string;
    logo?: string | null;
    town?: string;
    type?: string;
  } | null;
}

const searchApi = {
  async restaurants(params?: ListParams) {
    const res = await axiosClient.get("/customer/search/restaurants", { params });
    return unwrapList<WebRestaurant>(res.data);
  },

  async accommodations(params?: ListParams) {
    const res = await axiosClient.get("/customer/search/accommodations", { params });
    return unwrapList<WebProperty>(res.data);
  },
};

export default searchApi;